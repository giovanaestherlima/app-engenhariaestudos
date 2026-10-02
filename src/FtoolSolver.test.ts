import test from "node:test";
import assert from "node:assert/strict";
import { FtoolSolver, FtoolModel } from "./FtoolSolver.js";

test("Viga em balanço com carga pontual na ponta", () => {
  // Cantilever L = 4m, P = -10 kN at tip (Node 2)
  const model: FtoolModel = {
    nodes: [
      { id: "1", x: 0, y: 0, support: { fixX: true, fixY: true, fixRz: true } },
      { id: "2", x: 4, y: 0 },
    ],
    members: [
      { id: "m1", startNodeId: "1", endNodeId: "2" },
    ],
    nodalLoads: [
      { nodeId: "2", fx: 0, fy: -10, mz: 0 },
    ],
  };

  const res = FtoolSolver.solve(model);
  const r1 = res.reactions.find((r) => r.nodeId === "1");
  assert.ok(r1, "Reação no apoio 1 deve existir");
  assert.ok(Math.abs(r1.fy - 10) < 1e-4, `Fy deve ser 10 kN, obtido ${r1.fy}`);
  // Moment at fixed base: counteracts -10 kN * 4m = -40 kN.m -> reaction Mz = 40 kN.m
  assert.ok(Math.abs(r1.mz - 40) < 1e-4, `Mz deve ser 40 kN.m, obtido ${r1.mz}`);

  const m1 = res.memberResults[0];
  // At x = 0, moment is -40, at x = 4, moment is 0
  const mStart = m1.samples[0].M;
  const mEnd = m1.samples[m1.samples.length - 1].M;
  assert.ok(Math.abs(mStart - (-40)) < 1e-4, `Momento no engaste deve ser -40, obtido ${mStart}`);
  assert.ok(Math.abs(mEnd) < 1e-4, `Momento na ponta livre deve ser 0, obtido ${mEnd}`);
});

test("Viga biapoiada com carga uniformemente distribuída (q = -20 kN/m, L = 6m)", () => {
  // L = 6m, qy = -20 kN/m
  // Reações esperadas: R1 = R2 = 20 * 6 / 2 = 60 kN
  // Momento fletor máximo no meio: q L^2 / 8 = 20 * 36 / 8 = 90 kN.m
  const model: FtoolModel = {
    nodes: [
      { id: "A", x: 0, y: 0, support: { fixX: true, fixY: true } },
      { id: "B", x: 6, y: 0, support: { fixY: true } },
    ],
    members: [
      {
        id: "viga",
        startNodeId: "A",
        endNodeId: "B",
        distributedLoads: [
          { direction: "global", qxi: 0, qyi: -20 },
        ],
      },
    ],
  };

  const res = FtoolSolver.solve(model);
  const ra = res.reactions.find((r) => r.nodeId === "A");
  const rb = res.reactions.find((r) => r.nodeId === "B");
  assert.ok(ra && rb);
  assert.ok(Math.abs(ra.fy - 60) < 1e-3, `Ra deve ser 60 kN, obtido ${ra.fy}`);
  assert.ok(Math.abs(rb.fy - 60) < 1e-3, `Rb deve ser 60 kN, obtido ${rb.fy}`);

  const viga = res.memberResults[0];
  const midSample = viga.samples[Math.floor(viga.samples.length / 2)];
  assert.ok(Math.abs(midSample.M - 90) < 0.5, `Momento máximo deve ser 90 kN.m, obtido ${midSample.M}`);
});

test("Treliça simples biarticulada com liberação de rotação (release both)", () => {
  // Triangular truss: Base A(0,0), B(4,0), Top C(2, 2)
  // Load at top C: Fy = -10 kN
  const model: FtoolModel = {
    nodes: [
      { id: "A", x: 0, y: 0, support: { fixX: true, fixY: true } },
      { id: "B", x: 4, y: 0, support: { fixY: true } },
      { id: "C", x: 2, y: 2 },
    ],
    members: [
      { id: "AB", startNodeId: "A", endNodeId: "B", release: "both" },
      { id: "AC", startNodeId: "A", endNodeId: "C", release: "both" },
      { id: "BC", startNodeId: "B", endNodeId: "C", release: "both" },
    ],
    nodalLoads: [
      { nodeId: "C", fx: 0, fy: -10, mz: 0 },
    ],
  };

  const res = FtoolSolver.solve(model);
  // Reactions at A and B: Fy = 5 kN each
  const ra = res.reactions.find((r) => r.nodeId === "A")!;
  const rb = res.reactions.find((r) => r.nodeId === "B")!;
  assert.ok(Math.abs(ra.fy - 5) < 1e-3, `Ra deve ser 5 kN, obtido ${ra.fy}`);
  assert.ok(Math.abs(rb.fy - 5) < 1e-3, `Rb deve ser 5 kN, obtido ${rb.fy}`);

  // All bending moments must be exactly zero everywhere
  for (const mRes of res.memberResults) {
    for (const s of mRes.samples) {
      assert.ok(Math.abs(s.M) < 1e-4, `Momento deve ser nulo em barra de treliça, obtido ${s.M}`);
    }
  }

  // AC and BC are in compression, AB is in tension
  const ab = res.memberResults.find((m) => m.memberId === "AB")!;
  assert.ok(ab.samples[0].N > 0, "Barra inferior AB deve estar tracionada (N > 0)");
});

test("Apoio elástico com mola vertical (Ky = 500 kN/m)", () => {
  // Cantilever with tip spring Ky = 500 kN/m and tip vertical load Fy = -50 kN
  // Fixed at 0, tip at 5m
  const model: FtoolModel = {
    nodes: [
      { id: "1", x: 0, y: 0, support: { fixX: true, fixY: true, fixRz: true } },
      { id: "2", x: 5, y: 0, support: { springKy: 500 } },
    ],
    members: [
      { id: "m1", startNodeId: "1", endNodeId: "2" },
    ],
    nodalLoads: [
      { nodeId: "2", fx: 0, fy: -50, mz: 0 },
    ],
  };

  const res = FtoolSolver.solve(model);
  const rSpring = res.reactions.find((r) => r.nodeId === "2")!;
  assert.ok(rSpring, "Reação na mola deve existir");
  // The spring takes part of the 50 kN load
  assert.ok(rSpring.fy > 0 && rSpring.fy < 50, `Reação na mola deve ser positiva, obtido ${rSpring.fy}`);
  const rFix = res.reactions.find((r) => r.nodeId === "1")!;
  assert.ok(Math.abs(rFix.fy + rSpring.fy - 50) < 1e-3, "Equilíbrio vertical global deve ser 50 kN");
});

test("Carga distribuída linear / trapezoidal", () => {
  // Simply supported beam L = 6m, triangular load q1 = 0, q2 = -30 kN/m
  // Total load = 0.5 * 30 * 6 = 90 kN. Resultant at 2/3 of span (x = 4m from left).
  // Ra = 90 * (2/6) = 30 kN, Rb = 90 * (4/6) = 60 kN
  const model: FtoolModel = {
    nodes: [
      { id: "A", x: 0, y: 0, support: { fixX: true, fixY: true } },
      { id: "B", x: 6, y: 0, support: { fixY: true } },
    ],
    members: [
      {
        id: "viga_triang",
        startNodeId: "A",
        endNodeId: "B",
        distributedLoads: [
          { direction: "global", qxi: 0, qyi: 0, qxj: 0, qyj: -30 },
        ],
      },
    ],
  };

  const res = FtoolSolver.solve(model);
  const ra = res.reactions.find((r) => r.nodeId === "A")!;
  const rb = res.reactions.find((r) => r.nodeId === "B")!;
  assert.ok(Math.abs(ra.fy - 30) < 1e-2, `Ra deve ser 30 kN, obtido ${ra.fy}`);
  assert.ok(Math.abs(rb.fy - 60) < 1e-2, `Rb deve ser 60 kN, obtido ${rb.fy}`);
});

test("Rótula no nó libera momento fletor nas barras conectadas", () => {
  // Beam with 2 spans: A(0,0) fixed, B(4,0) hinged node, C(8,0) roller
  // Load at B: Fy = -20 kN
  const model: FtoolModel = {
    nodes: [
      { id: "A", x: 0, y: 0, support: { fixX: true, fixY: true, fixRz: true } },
      { id: "B", x: 4, y: 0, hinged: true },
      { id: "C", x: 8, y: 0, support: { fixY: true } },
    ],
    members: [
      { id: "AB", startNodeId: "A", endNodeId: "B" },
      { id: "BC", startNodeId: "B", endNodeId: "C" },
    ],
    nodalLoads: [
      { nodeId: "B", fx: 0, fy: -20, mz: 0 },
    ],
  };

  const res = FtoolSolver.solve(model);
  const mAB = res.memberResults.find((m) => m.memberId === "AB")!;
  const mBC = res.memberResults.find((m) => m.memberId === "BC")!;

  const mEndAB = mAB.samples[mAB.samples.length - 1].M;
  const mStartBC = mBC.samples[0].M;
  assert.ok(Math.abs(mEndAB) < 1e-4, `Momento no fim de AB na rótula deve ser 0, obtido ${mEndAB}`);
  assert.ok(Math.abs(mStartBC) < 1e-4, `Momento no início de BC na rótula deve ser 0, obtido ${mStartBC}`);
});

