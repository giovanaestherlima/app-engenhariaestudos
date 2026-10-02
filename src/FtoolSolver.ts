export interface FtoolNode {
  id: string;
  x: number; // m
  y: number; // m
  hinged?: boolean;
  joint?: "rigido" | "articulado";
  support?: {
    fixX?: boolean;
    fixY?: boolean;
    fixRz?: boolean;
    springKx?: number; // kN/m
    springKy?: number; // kN/m
    springKz?: number; // kN·m/rad
    angle?: number; // degrees
  };
}

export type MemberRelease = "none" | "start" | "end" | "both";

export interface FtoolMaterial {
  id: string;
  name: string;
  E: number; // kPa (e.g. 205 GPa = 205e6 kPa)
  gamma?: number; // kN/m3
  alpha?: number; // 1/°C
}

export interface FtoolSection {
  id: string;
  name: string;
  type: "generic" | "rectangle" | "circle" | "i-beam";
  A: number; // m2
  I: number; // m4
  height?: number; // m
  width?: number; // m
}

export interface FtoolDistributedLoad {
  direction: "global" | "local";
  qxi?: number; // kN/m (start)
  qyi?: number; // kN/m (start)
  qxj?: number; // kN/m (end)
  qyj?: number; // kN/m (end)
}

export interface FtoolMember {
  id: string;
  startNodeId: string;
  endNodeId: string;
  materialId?: string;
  sectionId?: string;
  release?: MemberRelease;
  distributedLoads?: FtoolDistributedLoad[];
}

export interface FtoolNodalLoad {
  nodeId: string;
  fx: number; // kN
  fy: number; // kN
  mz: number; // kN·m
}

export interface FtoolModel {
  nodes: FtoolNode[];
  members: FtoolMember[];
  materials?: FtoolMaterial[];
  sections?: FtoolSection[];
  nodalLoads?: FtoolNodalLoad[];
}

export interface NodeDisplacement {
  nodeId: string;
  dx: number; // m
  dy: number; // m
  rz: number; // rad
}

export interface NodeReaction {
  nodeId: string;
  fx: number; // kN
  fy: number; // kN
  mz: number; // kN·m
}

export interface MemberSamplePoint {
  x: number; // local pos 0..L (m)
  gx: number; // undeformed global X (m)
  gy: number; // undeformed global Y (m)
  dx: number; // global displacement X (m)
  dy: number; // global displacement Y (m)
  defX: number; // deformed global X (m)
  defY: number; // deformed global Y (m)
  N: number; // kN (axial, tension > 0)
  V: number; // kN (shear)
  M: number; // kN·m (bending moment)
}

export interface MemberResult {
  memberId: string;
  length: number;
  startNodeId: string;
  endNodeId: string;
  localForces: {
    N1: number;
    V1: number;
    M1: number;
    N2: number;
    V2: number;
    M2: number;
  };
  samples: MemberSamplePoint[];
  maxN: number;
  minN: number;
  maxV: number;
  minV: number;
  maxM: number;
  minM: number;
}

export interface FtoolSolveResult {
  displacements: NodeDisplacement[];
  reactions: NodeReaction[];
  memberResults: MemberResult[];
  globalEquilibrium: {
    sumFx: number;
    sumFy: number;
    sumMz: number;
  };
}

export class FtoolSolver {
  /**
   * Solves the 2D frame using the Direct Stiffness Method.
   */
  static solve(model: FtoolModel, samplePointsPerMember = 50): FtoolSolveResult {
    const nodes = model.nodes;
    const members = model.members;
    if (nodes.length < 2) {
      throw new Error("A estrutura precisa de pelo menos 2 nós.");
    }
    if (members.length === 0) {
      throw new Error("A estrutura precisa de pelo menos 1 barra.");
    }

    const nodeIndexMap = new Map<string, number>();
    nodes.forEach((n, i) => nodeIndexMap.set(n.id, i));

    const materialMap = new Map<string, FtoolMaterial>();
    // Default material: Steel (E = 205 GPa = 205,000,000 kPa)
    const defaultMaterial: FtoolMaterial = {
      id: "default_mat",
      name: "Aço Padrão",
      E: 205e6, // kPa = kN/m²
      gamma: 78.5,
      alpha: 1.2e-5,
    };
    (model.materials || []).forEach((m) => materialMap.set(m.id, m));

    const sectionMap = new Map<string, FtoolSection>();
    // Default section: 0.20m x 0.30m (A = 0.06 m2, I = 0.20 * 0.30^3 / 12 = 0.00045 m4)
    const defaultSection: FtoolSection = {
      id: "default_sec",
      name: "Retangular 20x30",
      type: "rectangle",
      A: 0.06,
      I: 0.00045,
      height: 0.3,
      width: 0.2,
    };
    (model.sections || []).forEach((s) => sectionMap.set(s.id, s));

    const numNodes = nodes.length;
    const totalDof = numNodes * 3;

    // Allocate global stiffness matrix and global force vector
    const K = Array.from({ length: totalDof }, () => new Float64Array(totalDof));
    const F = new Float64Array(totalDof);

    // Apply nodal loads to F
    for (const load of model.nodalLoads || []) {
      const idx = nodeIndexMap.get(load.nodeId);
      if (idx !== undefined) {
        F[idx * 3 + 0] += load.fx || 0;
        F[idx * 3 + 1] += load.fy || 0;
        F[idx * 3 + 2] += load.mz || 0;
      }
    }

    // Keep track of member transformation, length and equivalent nodal loads
    interface MemberInternalData {
      member: FtoolMember;
      L: number;
      cos: number;
      sin: number;
      E: number;
      A: number;
      I: number;
      ke_local: number[][]; // 6x6
      fe_local: number[]; // 6
      T: number[][]; // 6x6
      dofIndices: number[]; // 6
      qx_fun: (x: number) => number;
      qy_fun: (x: number) => number;
    }

    const memberDataList: MemberInternalData[] = [];

    // Assemble member stiffness and equivalent nodal loads
    for (const mem of members) {
      const idx1 = nodeIndexMap.get(mem.startNodeId);
      const idx2 = nodeIndexMap.get(mem.endNodeId);
      if (idx1 === undefined || idx2 === undefined) {
        throw new Error(`Barra ${mem.id} possui nós inexistentes.`);
      }
      const n1 = nodes[idx1];
      const n2 = nodes[idx2];
      const dx = n2.x - n1.x;
      const dy = n2.y - n1.y;
      const L = Math.hypot(dx, dy);
      if (L < 1e-7) {
        throw new Error(`Barra ${mem.id} possui nós coincidentes (comprimento zero).`);
      }
      const cos = dx / L;
      const sin = dy / L;

      const mat = (mem.materialId && materialMap.get(mem.materialId)) || defaultMaterial;
      const sec = (mem.sectionId && sectionMap.get(mem.sectionId)) || defaultSection;
      const E = mat.E;
      const A = sec.A;
      const I = sec.I;

      const relStart = (mem.release === "start" || mem.release === "both") || Boolean(n1.hinged || n1.joint === "articulado");
      const relEnd = (mem.release === "end" || mem.release === "both") || Boolean(n2.hinged || n2.joint === "articulado");
      const release: MemberRelease = relStart && relEnd ? "both" : relStart ? "start" : relEnd ? "end" : "none";

      // Build local stiffness matrix 6x6 based on end releases
      const ke_local = Array.from({ length: 6 }, () => new Array(6).fill(0));
      const EA_L = (E * A) / L;
      ke_local[0][0] = EA_L;
      ke_local[0][3] = -EA_L;
      ke_local[3][0] = -EA_L;
      ke_local[3][3] = EA_L;

      const EI = E * I;
      const L2 = L * L;
      const L3 = L2 * L;

      if (release === "none") {
        // Rigid - Rigid
        ke_local[1][1] = (12 * EI) / L3;
        ke_local[1][2] = (6 * EI) / L2;
        ke_local[1][4] = -(12 * EI) / L3;
        ke_local[1][5] = (6 * EI) / L2;

        ke_local[2][1] = (6 * EI) / L2;
        ke_local[2][2] = (4 * EI) / L;
        ke_local[2][4] = -(6 * EI) / L2;
        ke_local[2][5] = (2 * EI) / L;

        ke_local[4][1] = -(12 * EI) / L3;
        ke_local[4][2] = -(6 * EI) / L2;
        ke_local[4][4] = (12 * EI) / L3;
        ke_local[4][5] = -(6 * EI) / L2;

        ke_local[5][1] = (6 * EI) / L2;
        ke_local[5][2] = (2 * EI) / L;
        ke_local[5][4] = -(6 * EI) / L2;
        ke_local[5][5] = (4 * EI) / L;
      } else if (release === "start") {
        // Hinged - Rigid (θ1 free, M1 = 0)
        ke_local[1][1] = (3 * EI) / L3;
        ke_local[1][2] = 0;
        ke_local[1][4] = -(3 * EI) / L3;
        ke_local[1][5] = (3 * EI) / L2;

        ke_local[2][1] = 0;
        ke_local[2][2] = 0;
        ke_local[2][4] = 0;
        ke_local[2][5] = 0;

        ke_local[4][1] = -(3 * EI) / L3;
        ke_local[4][2] = 0;
        ke_local[4][4] = (3 * EI) / L3;
        ke_local[4][5] = -(3 * EI) / L2;

        ke_local[5][1] = (3 * EI) / L2;
        ke_local[5][2] = 0;
        ke_local[5][4] = -(3 * EI) / L2;
        ke_local[5][5] = (3 * EI) / L;
      } else if (release === "end") {
        // Rigid - Hinged (θ2 free, M2 = 0)
        ke_local[1][1] = (3 * EI) / L3;
        ke_local[1][2] = (3 * EI) / L2;
        ke_local[1][4] = -(3 * EI) / L3;
        ke_local[1][5] = 0;

        ke_local[2][1] = (3 * EI) / L2;
        ke_local[2][2] = (3 * EI) / L;
        ke_local[2][4] = -(3 * EI) / L2;
        ke_local[2][5] = 0;

        ke_local[4][1] = -(3 * EI) / L3;
        ke_local[4][2] = -(3 * EI) / L2;
        ke_local[4][4] = (3 * EI) / L3;
        ke_local[4][5] = 0;

        ke_local[5][1] = 0;
        ke_local[5][2] = 0;
        ke_local[5][4] = 0;
        ke_local[5][5] = 0;
      } else if (release === "both") {
        // Hinged - Hinged (Truss member)
        // All bending terms are 0
      }

      // Transformation matrix T 6x6
      const T = [
        [cos, sin, 0, 0, 0, 0],
        [-sin, cos, 0, 0, 0, 0],
        [0, 0, 1, 0, 0, 0],
        [0, 0, 0, cos, sin, 0],
        [0, 0, 0, -sin, cos, 0],
        [0, 0, 0, 0, 0, 1],
      ];

      // ke_global = T^T * ke_local * T
      // Let's compute ke_global
      const temp = Array.from({ length: 6 }, () => new Array(6).fill(0));
      for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 6; j++) {
          let sum = 0;
          for (let k = 0; k < 6; k++) sum += ke_local[i][k] * T[k][j];
          temp[i][j] = sum;
        }
      }
      const ke_global = Array.from({ length: 6 }, () => new Array(6).fill(0));
      for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 6; j++) {
          let sum = 0;
          for (let k = 0; k < 6; k++) sum += T[k][i] * temp[k][j]; // T^T is T[k][i]
          ke_global[i][j] = sum;
        }
      }

      // Compute fixed-end actions for distributed loads
      let qxi_tot = 0;
      let qxj_tot = 0;
      let qyi_tot = 0;
      let qyj_tot = 0;

      for (const dload of mem.distributedLoads || []) {
        let qi_x = dload.qxi ?? 0;
        let qj_x = dload.qxj ?? qi_x;
        let qi_y = dload.qyi ?? 0;
        let qj_y = dload.qyj ?? qi_y;

        if (dload.direction === "global") {
          // Project to local axes
          // local_x = global_x * cos + global_y * sin
          // local_y = -global_x * sin + global_y * cos
          const local_xi = qi_x * cos + qi_y * sin;
          const local_yi = -qi_x * sin + qi_y * cos;
          const local_xj = qj_x * cos + qj_y * sin;
          const local_yj = -qj_x * sin + qj_y * cos;
          qxi_tot += local_xi;
          qxj_tot += local_xj;
          qyi_tot += local_yi;
          qyj_tot += local_yj;
        } else {
          // Already in local coordinates
          qxi_tot += qi_x;
          qxj_tot += qj_x;
          qyi_tot += qi_y;
          qyj_tot += qj_y;
        }
      }

      // fe_local: fixed end forces exerted ON the element [u1, v1, m1, u2, v2, m2]
      const fe_local = new Array(6).fill(0);

      // Axial distributed load:
      fe_local[0] += ((2 * qxi_tot + qxj_tot) * L) / 6;
      fe_local[3] += ((qxi_tot + 2 * qxj_tot) * L) / 6;

      // Transverse distributed load:
      let v1_fe = 0;
      let m1_fe = 0;
      let v2_fe = 0;
      let m2_fe = 0;

      if (release === "none") {
        // Rigid - Rigid
        v1_fe = ((7 * qyi_tot + 3 * qyj_tot) * L) / 20;
        m1_fe = ((3 * qyi_tot + 2 * qyj_tot) * L2) / 60;
        v2_fe = ((3 * qyi_tot + 7 * qyj_tot) * L) / 20;
        m2_fe = -((2 * qyi_tot + 3 * qyj_tot) * L2) / 60;
      } else if (release === "start") {
        // Hinged - Rigid
        // M1 = 0, moment released to end 2
        const m1_rigid = ((3 * qyi_tot + 2 * qyj_tot) * L2) / 60;
        const m2_rigid = -((2 * qyi_tot + 3 * qyj_tot) * L2) / 60;
        const v1_rigid = ((7 * qyi_tot + 3 * qyj_tot) * L) / 20;
        const v2_rigid = ((3 * qyi_tot + 7 * qyj_tot) * L) / 20;

        m1_fe = 0;
        m2_fe = m2_rigid - 0.5 * m1_rigid;
        v1_fe = v1_rigid + m1_rigid / L;
        v2_fe = v2_rigid - m1_rigid / L;
      } else if (release === "end") {
        // Rigid - Hinged
        // M2 = 0
        const m1_rigid = ((3 * qyi_tot + 2 * qyj_tot) * L2) / 60;
        const m2_rigid = -((2 * qyi_tot + 3 * qyj_tot) * L2) / 60;
        const v1_rigid = ((7 * qyi_tot + 3 * qyj_tot) * L) / 20;
        const v2_rigid = ((3 * qyi_tot + 7 * qyj_tot) * L) / 20;

        m2_fe = 0;
        m1_fe = m1_rigid - 0.5 * m2_rigid;
        v1_fe = v1_rigid - m2_rigid / L;
        v2_fe = v2_rigid + m2_rigid / L;
      } else if (release === "both") {
        // Hinged - Hinged
        m1_fe = 0;
        m2_fe = 0;
        v2_fe = (L * (qyi_tot + 2 * qyj_tot)) / 6;
        v1_fe = (L * (2 * qyi_tot + qyj_tot)) / 6;
      }

      fe_local[1] += v1_fe;
      fe_local[2] += m1_fe;
      fe_local[4] += v2_fe;
      fe_local[5] += m2_fe;

      // Equivalent nodal forces in global coordinates:
      // fe_global = T^T * fe_local
      const fe_global = new Array(6).fill(0);
      for (let i = 0; i < 6; i++) {
        let sum = 0;
        for (let k = 0; k < 6; k++) sum += T[k][i] * fe_local[k];
        fe_global[i] = sum;
      }

      const dofIndices = [
        idx1 * 3 + 0,
        idx1 * 3 + 1,
        idx1 * 3 + 2,
        idx2 * 3 + 0,
        idx2 * 3 + 1,
        idx2 * 3 + 2,
      ];

      // Assemble into global K and add equivalent nodal loads into F
      for (let i = 0; i < 6; i++) {
        const row = dofIndices[i];
        F[row] += fe_global[i]; // Equivalent nodal load
        for (let j = 0; j < 6; j++) {
          const col = dofIndices[j];
          K[row][col] += ke_global[i][j];
        }
      }

      // Store member functions for later continuous evaluation
      const qx_fun = (x: number) => qxi_tot + ((qxj_tot - qxi_tot) * x) / L;
      const qy_fun = (x: number) => qyi_tot + ((qyj_tot - qyi_tot) * x) / L;

      memberDataList.push({
        member: mem,
        L,
        cos,
        sin,
        E,
        A,
        I,
        ke_local,
        fe_local,
        T,
        dofIndices,
        qx_fun,
        qy_fun,
      });
    }

    // Apply support conditions:
    // Springs simply add stiffness to diagonal of K!
    for (let i = 0; i < numNodes; i++) {
      const node = nodes[i];
      if (node.support) {
        if (node.support.springKx && node.support.springKx > 0) {
          K[i * 3 + 0][i * 3 + 0] += node.support.springKx;
        }
        if (node.support.springKy && node.support.springKy > 0) {
          K[i * 3 + 1][i * 3 + 1] += node.support.springKy;
        }
        if (node.support.springKz && node.support.springKz > 0) {
          K[i * 3 + 2][i * 3 + 2] += node.support.springKz;
        }
      }
    }

    // Identify restrained DOFs (fixed supports)
    const isRestrained = new Uint8Array(totalDof);
    const prescribedValues = new Float64Array(totalDof);

    for (let i = 0; i < numNodes; i++) {
      const node = nodes[i];
      if (node.support) {
        if (node.support.fixX) {
          isRestrained[i * 3 + 0] = 1;
          prescribedValues[i * 3 + 0] = 0;
        }
        if (node.support.fixY) {
          isRestrained[i * 3 + 1] = 1;
          prescribedValues[i * 3 + 1] = 0;
        }
        if (node.support.fixRz) {
          isRestrained[i * 3 + 2] = 1;
          prescribedValues[i * 3 + 2] = 0;
        }
      }
    }

    // Restrain rotational DOFs that have no rotational stiffness (e.g., truss joints where all bars have hinges)
    for (let i = 0; i < numNodes; i++) {
      const rotDof = i * 3 + 2;
      let rotStiffness = Math.abs(K[rotDof][rotDof]);
      if (rotStiffness < 1e-10 && !isRestrained[rotDof]) {
        isRestrained[rotDof] = 1;
        prescribedValues[rotDof] = 0;
      }
    }

    // Create a copy of assembled K and F to compute reactions accurately afterwards
    const K_orig = K.map((row) => new Float64Array(row));
    const F_orig = new Float64Array(F);

    // Apply Dirichlet boundary conditions
    for (let dof = 0; dof < totalDof; dof++) {
      if (isRestrained[dof]) {
        for (let j = 0; j < totalDof; j++) {
          K[dof][j] = 0;
        }
        K[dof][dof] = 1;
        F[dof] = prescribedValues[dof];
      } else {
        // Zero out coupling with prescribed DOFs if any
        for (let j = 0; j < totalDof; j++) {
          if (isRestrained[j]) {
            F[dof] -= K[dof][j] * prescribedValues[j];
            K[dof][j] = 0;
          }
        }
      }
    }

    // Solve K * D = F using Gaussian Elimination with partial pivoting
    const D = this.solveLinearSystem(K, F);

    // Check for NaN or Inf (indicates instability / mechanism)
    for (let i = 0; i < totalDof; i++) {
      if (!Number.isFinite(D[i])) {
        throw new Error(
          "Estrutura instável (hipostática ou mecanismo). Verifique se os apoios impedem movimentos de corpo rígido e rotações.",
        );
      }
    }

    // Compute reactions
    const reactions: NodeReaction[] = [];
    let sumRx = 0;
    let sumRy = 0;
    let sumRz = 0;

    for (let i = 0; i < numNodes; i++) {
      const node = nodes[i];
      let rx = 0;
      let ry = 0;
      let rz = 0;

      // Reactions from fixed restraints:
      if (isRestrained[i * 3 + 0]) {
        for (let j = 0; j < totalDof; j++) {
          rx += K_orig[i * 3 + 0][j] * D[j];
        }
        rx -= F_orig[i * 3 + 0];
      }
      if (isRestrained[i * 3 + 1]) {
        for (let j = 0; j < totalDof; j++) {
          ry += K_orig[i * 3 + 1][j] * D[j];
        }
        ry -= F_orig[i * 3 + 1];
      }
      if (isRestrained[i * 3 + 2]) {
        for (let j = 0; j < totalDof; j++) {
          rz += K_orig[i * 3 + 2][j] * D[j];
        }
        rz -= F_orig[i * 3 + 2];
      }

      // Reactions from elastic springs:
      // F_spring = -K * displacement (restoring reaction on the node)
      if (node.support?.springKx && node.support.springKx > 0) {
        rx += -node.support.springKx * D[i * 3 + 0];
      }
      if (node.support?.springKy && node.support.springKy > 0) {
        ry += -node.support.springKy * D[i * 3 + 1];
      }
      if (node.support?.springKz && node.support.springKz > 0) {
        rz += -node.support.springKz * D[i * 3 + 2];
      }

      const hasSupport =
        node.support &&
        (node.support.fixX ||
          node.support.fixY ||
          node.support.fixRz ||
          (node.support.springKx && node.support.springKx > 0) ||
          (node.support.springKy && node.support.springKy > 0) ||
          (node.support.springKz && node.support.springKz > 0));

      if (hasSupport) {
        reactions.push({
          nodeId: node.id,
          fx: rx,
          fy: ry,
          mz: rz,
        });
        sumRx += rx;
        sumRy += ry;
        sumRz += rz + rx * -node.y + ry * node.x;
      }
    }

    // Format nodal displacements
    const displacements: NodeDisplacement[] = [];
    for (let i = 0; i < numNodes; i++) {
      displacements.push({
        nodeId: nodes[i].id,
        dx: D[i * 3 + 0],
        dy: D[i * 3 + 1],
        rz: D[i * 3 + 2],
      });
    }

    // Compute internal member actions, diagrams, and deformed shapes
    const memberResults: MemberResult[] = [];

    for (const mData of memberDataList) {
      const { member, L, cos, sin, dofIndices, ke_local, fe_local, T, qx_fun, qy_fun } = mData;
      const n1 = nodes[nodeIndexMap.get(member.startNodeId)!];

      // Global displacements at member ends
      const D_elem = [
        D[dofIndices[0]],
        D[dofIndices[1]],
        D[dofIndices[2]],
        D[dofIndices[3]],
        D[dofIndices[4]],
        D[dofIndices[5]],
      ];

      // Local displacements d_local = T * D_elem
      const d_local = new Array(6).fill(0);
      for (let i = 0; i < 6; i++) {
        let s = 0;
        for (let j = 0; j < 6; j++) s += T[i][j] * D_elem[j];
        d_local[i] = s;
      }

      // Member end actions exerted ON the element: r_local = ke_local * d_local - fe_local
      const r_local = new Array(6).fill(0);
      for (let i = 0; i < 6; i++) {
        let s = 0;
        for (let j = 0; j < 6; j++) s += ke_local[i][j] * d_local[j];
        r_local[i] = s - fe_local[i];
      }

      // Local end forces conventions:
      // r_local: [u1, v1, m1, u2, v2, m2]
      // N1 = -r_local[0] (positive = tension)
      // V1 = r_local[1]
      // M1 = -r_local[2]
      // N2 = r_local[3]
      // V2 = -r_local[4]
      // M2 = r_local[5]
      const N1 = -r_local[0];
      const V1 = r_local[1];
      const M1 = -r_local[2];
      const N2 = r_local[3];
      const V2 = -r_local[4];
      const M2 = r_local[5];

      // Sample along the member length
      const samples: MemberSamplePoint[] = [];
      const numSamples = Math.max(10, samplePointsPerMember);

      let maxN = -Infinity;
      let minN = Infinity;
      let maxV = -Infinity;
      let minV = Infinity;
      let maxM = -Infinity;
      let minM = Infinity;

      for (let s = 0; s <= numSamples; s++) {
        const x = (s / numSamples) * L;
        const xi = x / L;

        // Internal forces via section equilibrium
        // Integrated distributed loads up to x:
        // qx(x) = qxi + (qxj - qxi) * x/L
        // int_0^x qx(t) dt = qxi * x + 0.5 * (qxj - qxi) * x^2 / L
        const qx_avg = 0.5 * (qx_fun(0) + qx_fun(x));
        const int_qx = qx_avg * x;

        const qy_avg = 0.5 * (qy_fun(0) + qy_fun(x));
        const int_qy = qy_avg * x;

        // Centroid of distributed load on [0, x]:
        // For trapezoid on [0, x]: int_0^x qy(t)*(x - t) dt
        const q0 = qy_fun(0);
        const qx_val = qy_fun(x);
        const int_qy_arm = (q0 * x * x) / 6 + (qx_val * x * x) / 3;

        // Internal normal force:
        // N(x) = -r_local[0] - int_0^x qx(t) dt
        const N = -r_local[0] - int_qx;

        // Internal shear force:
        // V(x) = r_local[1] + int_0^x qy(t) dt
        const V = r_local[1] + int_qy;

        // Internal bending moment:
        // M(x) = -r_local[2] + r_local[1]*x + int_0^x qy(t)*(x - t) dt
        const M = -r_local[2] + r_local[1] * x + int_qy_arm;

        // Deflection: local axial u_loc(x) and transverse v_loc(x)
        // Hermitian shape functions for transverse deflection
        const u1 = d_local[0];
        const v1 = d_local[1];
        const th1 = d_local[2];
        const u2 = d_local[3];
        const v2 = d_local[4];
        const th2 = d_local[5];

        const N_h1 = 1 - 3 * xi * xi + 2 * xi * xi * xi;
        const N_h2 = L * (xi - 2 * xi * xi + xi * xi * xi);
        const N_h3 = 3 * xi * xi - 2 * xi * xi * xi;
        const N_h4 = L * (-xi * xi + xi * xi * xi);

        let v_loc = N_h1 * v1 + N_h2 * th1 + N_h3 * v2 + N_h4 * th2;
        let u_loc = (1 - xi) * u1 + xi * u2;

        // Transform local displacement to global (cos, sin)
        // dx_glob = u_loc * cos - v_loc * sin
        // dy_glob = u_loc * sin + v_loc * cos
        const dx_glob = u_loc * cos - v_loc * sin;
        const dy_glob = u_loc * sin + v_loc * cos;

        const gx = n1.x + x * cos;
        const gy = n1.y + x * sin;

        samples.push({
          x,
          gx,
          gy,
          dx: dx_glob,
          dy: dy_glob,
          defX: gx + dx_glob,
          defY: gy + dy_glob,
          N,
          V,
          M,
        });

        if (N > maxN) maxN = N;
        if (N < minN) minN = N;
        if (V > maxV) maxV = V;
        if (V < minV) minV = V;
        if (M > maxM) maxM = M;
        if (M < minM) minM = M;
      }

      memberResults.push({
        memberId: member.id,
        length: L,
        startNodeId: member.startNodeId,
        endNodeId: member.endNodeId,
        localForces: { N1, V1, M1, N2, V2, M2 },
        samples,
        maxN,
        minN,
        maxV,
        minV,
        maxM,
        minM,
      });
    }

    return {
      displacements,
      reactions,
      memberResults,
      globalEquilibrium: {
        sumFx: sumRx,
        sumFy: sumRy,
        sumMz: sumRz,
      },
    };
  }

  private static solveLinearSystem(A: Float64Array[], b: Float64Array): Float64Array {
    const n = b.length;
    // Augmented matrix
    const M: number[][] = Array.from({ length: n }, (_, i) => {
      const row = new Array(n + 1);
      for (let j = 0; j < n; j++) row[j] = A[i][j];
      row[n] = b[i];
      return row;
    });

    for (let k = 0; k < n; k++) {
      // Find pivot
      let maxVal = Math.abs(M[k][k]);
      let maxRow = k;
      for (let i = k + 1; i < n; i++) {
        const val = Math.abs(M[i][k]);
        if (val > maxVal) {
          maxVal = val;
          maxRow = i;
        }
      }

      if (maxVal < 1e-12) {
        throw new Error(
          "Matriz de rigidez singular. A estrutura possui graus de liberdade desvinculados ou mecanismo.",
        );
      }

      // Swap rows
      if (maxRow !== k) {
        const temp = M[k];
        M[k] = M[maxRow];
        M[maxRow] = temp;
      }

      // Eliminate below
      const pivot = M[k][k];
      for (let i = k + 1; i < n; i++) {
        const factor = M[i][k] / pivot;
        M[i][k] = 0;
        for (let j = k + 1; j <= n; j++) {
          M[i][j] -= factor * M[k][j];
        }
      }
    }

    // Back substitution
    const x = new Float64Array(n);
    for (let i = n - 1; i >= 0; i--) {
      let sum = M[i][n];
      for (let j = i + 1; j < n; j++) {
        sum -= M[i][j] * x[j];
      }
      x[i] = sum / M[i][i];
    }

    return x;
  }
}
