/**
 * composite-solver.js
 *
 * Analytical solver for composite isostatic portal frames using the binary
 * method (método dos binários).  Takes the model definition AND the numerical
 * results already produced by the stiffness-matrix solver (Portico.ts) and
 * overlays the step-by-step pedagogical reasoning that a student would follow
 * when solving by hand.
 *
 * All user-facing text is in Brazilian Portuguese.
 */

// ─── helpers ────────────────────────────────────────────────────────────────

const EPS = 1e-6;
const fmt = (v, d = 2) => {
  if (Math.abs(v) < EPS) v = 0;
  return Number(v).toFixed(d);
};

function nodeByName(model, name) {
  return model.nodes.find((n) => n.name === name);
}

function barByName(model, name) {
  return model.bars.find((b) => b.name === name);
}

/** Count support reactions for a single node. */
function supportReactionCount(node) {
  if (!node) return 0;
  if (node.support === 'engaste') return 3;
  if (node.support === 'articulado') return 2;
  if (node.support === 'rolete') return 1;
  return 0;
}

/** True when a node can act as a pin (transmits force, not moment). */
function isNodePinned(node) {
  if (!node) return false;
  return node.joint === 'rotula'
    || node.support === 'articulado'
    || node.support === 'rolete';
}

/** True when a bar carries no transverse load. */
function isBarUnloaded(model, bar) {
  if (Math.abs(bar.qx || 0) > EPS || Math.abs(bar.qy || 0) > EPS) return false;
  return !(model.pointLoads || []).some((pl) => pl.bar === bar.name);
}

/** Geometry between two nodes. */
function barGeometry(n1, n2) {
  const dx = n2.x - n1.x;
  const dy = n2.y - n1.y;
  const L = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  return { dx, dy, L, angle };
}

// ─── main ───────────────────────────────────────────────────────────────────

export function analyzeCompositeStructure(model, numericalResults) {
  if (!model || !model.nodes || !model.bars || model.bars.length === 0) {
    return null;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 1 — Classify the structure
  // ══════════════════════════════════════════════════════════════════════════

  let r = 0;
  let nEngaste = 0, nArtic = 0, nRolete = 0;
  for (const nd of model.nodes) {
    const c = supportReactionCount(nd);
    r += c;
    if (nd.support === 'engaste') nEngaste++;
    else if (nd.support === 'articulado') nArtic++;
    else if (nd.support === 'rolete') nRolete++;
  }

  // Internal hinges: nodes with joint='rotula' that connect 2+ bars
  const hingeNodes = [];
  for (const nd of model.nodes) {
    if (nd.joint !== 'rotula') continue;
    const connCount = model.bars.filter(
      (b) => b.start === nd.name || b.end === nd.name,
    ).length;
    if (connCount >= 2) {
      hingeNodes.push(nd.name);
    }
  }
  const n = hingeNodes.length;

  if (n === 0) return null; // Not a composite structure

  const isIsostatic = r === 3 + n;
  const classification = {
    totalReactions: r,
    internalHinges: n,
    formula: `r = 3 + n → ${r} = 3 + ${n} ${isIsostatic ? '✓ Isostática' : '✗'}`,
    isIsostatic,
    reasoning: [
      `Contagem de reações de apoio: r = ${r} (${nEngaste} engaste${nEngaste !== 1 ? 's' : ''} × 3 + ${nArtic} articulado${nArtic !== 1 ? 's' : ''} × 2 + ${nRolete} rolete${nRolete !== 1 ? 's' : ''} × 1).`,
      `Rótulas internas encontradas: n = ${n} (${hingeNodes.join(', ')}).`,
      `Condição de isostaticidade: r = 3 + n → ${r} = ${3 + n}. ${isIsostatic ? 'Satisfeita.' : 'NÃO satisfeita.'}`,
    ],
  };

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 2 — Detect pendular bars
  // ══════════════════════════════════════════════════════════════════════════

  const pendularBars = [];
  const pendularBarNames = new Set();

  for (const bar of model.bars) {
    const nA = nodeByName(model, bar.start);
    const nB = nodeByName(model, bar.end);
    if (!nA || !nB) continue;

    // A pendular bar has pins at both ends AND no transverse load
    if (isNodePinned(nA) && isNodePinned(nB) && isBarUnloaded(model, bar)) {
      const geo = barGeometry(nA, nB);
      let direction = 'inclinada';
      if (Math.abs(geo.dy) < EPS) direction = 'horizontal';
      else if (Math.abs(geo.dx) < EPS) direction = 'vertical';

      // Get axial force from numerical results
      let axialForce = 0;
      if (numericalResults?.binaryMemory) {
        const bm = numericalResults.binaryMemory.find((b) => b.barName === bar.name);
        if (bm) axialForce = bm.axial?.N1 ?? 0;
      }
      if (Math.abs(axialForce) < EPS) {
        // fallback: check diagrams
        const diag = numericalResults?.diagrams?.find((d) => d.name === bar.name);
        if (diag?.samples?.[0]) axialForce = diag.samples[0].normal;
      }

      const nature = axialForce > EPS ? 'Tracionada' : axialForce < -EPS ? 'Comprimida' : 'Nula';

      pendularBars.push({
        barName: bar.name,
        startNode: bar.start,
        endNode: bar.end,
        angle: geo.angle,
        direction,
        axialForce,
        nature,
        reasoning: [
          `A barra ${bar.name} (${bar.start}→${bar.end}) é biarticulada e sem carga transversal — é uma barra pendular (${direction === 'horizontal' ? 'escora horizontal' : direction === 'vertical' ? 'escora vertical' : 'escora inclinada'}).`,
          `Só transmite força normal ao longo do eixo: M = 0, V = 0 em todo o comprimento.`,
          direction === 'horizontal'
            ? `Como é horizontal, transmite apenas força horizontal entre ${bar.start} e ${bar.end}.`
            : direction === 'vertical'
              ? `Como é vertical, transmite apenas força vertical entre ${bar.start} e ${bar.end}.`
              : `A direção da força é fixa ao longo da reta que une as extremidades (θ = ${fmt(geo.angle, 1)}°). Componentes: H = N·cos(α), V = N·sen(α).`,
          `Resultado: N = ${fmt(axialForce)} kN → barra ${nature.toLowerCase()}.`,
        ],
      });
      pendularBarNames.add(bar.name);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 3 — Split structure at hinges and detect hierarchy
  // ══════════════════════════════════════════════════════════════════════════

  // Build adjacency (bars connect nodes; hinge nodes are split points)
  // Each part is a set of bars connected without crossing a hinge
  const barToNodes = new Map();
  const nodeToBar = new Map();
  for (const bar of model.bars) {
    barToNodes.set(bar.name, [bar.start, bar.end]);
    for (const end of [bar.start, bar.end]) {
      if (!nodeToBar.has(end)) nodeToBar.set(end, []);
      nodeToBar.get(end).push(bar.name);
    }
  }

  // BFS from each side of each hinge to find connected parts
  const visited = new Set();
  const parts = [];

  function bfsPart(startBarName) {
    const partBars = new Set();
    const partNodes = new Set();
    const queue = [startBarName];
    visited.add(startBarName);

    while (queue.length > 0) {
      const bName = queue.shift();
      partBars.add(bName);
      const [n1, n2] = barToNodes.get(bName);
      partNodes.add(n1);
      partNodes.add(n2);

      for (const nodeName of [n1, n2]) {
        // Don't cross through hinge nodes to other bars
        if (hingeNodes.includes(nodeName)) continue;
        for (const adjBar of nodeToBar.get(nodeName) || []) {
          if (!visited.has(adjBar)) {
            visited.add(adjBar);
            queue.push(adjBar);
          }
        }
      }
    }
    return { bars: [...partBars], nodes: [...partNodes] };
  }

  // Traverse from each bar to find parts
  for (const bar of model.bars) {
    if (visited.has(bar.name)) continue;
    const part = bfsPart(bar.name);
    parts.push(part);
  }

  // ── Classify each part as secondary or principal ──

  const classifiedParts = parts.map((part, idx) => {
    // Count real reactions in this part
    let partReactions = 0;
    const supportInfo = [];
    for (const nodeName of part.nodes) {
      const nd = nodeByName(model, nodeName);
      const c = supportReactionCount(nd);
      if (c > 0) {
        partReactions += c;
        supportInfo.push(`${nd.name}(${nd.support}, ${c} reações)`);
      }
    }

    // Count hinge connections for this part
    const hingeConnections = [];
    for (const hName of hingeNodes) {
      if (part.nodes.includes(hName)) {
        hingeConnections.push(hName);
      }
    }

    // Secondary: real reactions + 2 * hinge_connections = 3 per part,
    // so real reactions = 3 - 2 * hinge_connections
    // Typically: secondary has 1 real reaction (1 rolete) + 1 hinge = 1 + 2 = 3
    // Principal has 3+ real reactions and hinge forces come as external loads
    const type = partReactions < 3 ? 'secundaria' : 'principal';

    return {
      name: type === 'secundaria'
        ? `Parte ${idx + 1} (Secundária) — Barras: ${part.bars.join(', ')}`
        : `Parte ${idx + 1} (Principal) — Barras: ${part.bars.join(', ')}`,
      type,
      nodes: part.nodes,
      bars: part.bars,
      realReactions: partReactions,
      hingeConnections,
      supportInfo,
      reasoning: [], // will be filled below
    };
  });

  // Sort: secondary first
  classifiedParts.sort((a, b) => (a.type === 'secundaria' ? -1 : 1));

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 4–6 — Solve using binary method with numerical results
  // ══════════════════════════════════════════════════════════════════════════

  // For each hinge, extract the forces transmitted
  const hingeForces = [];

  for (const hName of hingeNodes) {
    // Find bars connected to this hinge
    const connBars = model.bars.filter(
      (b) => b.start === hName || b.end === hName,
    );

    // Use numerical results: the force at the hinge is the sum of bar-end
    // forces on one side. We pick the secondary side.
    let Hx = 0, Vy = 0;

    // Find the secondary-side bars (bars in the secondary part connected to hinge)
    const secPart = classifiedParts.find(
      (p) => p.type === 'secundaria' && p.nodes.includes(hName),
    );

    if (secPart && numericalResults?.diagrams) {
      for (const bName of secPart.bars) {
        const bar = barByName(model, bName);
        if (!bar) continue;
        if (bar.start !== hName && bar.end !== hName) continue;

        const diag = numericalResults.diagrams.find((d) => d.name === bName);
        if (!diag?.samples) continue;

        const barNode1 = nodeByName(model, bar.start);
        const barNode2 = nodeByName(model, bar.end);
        const geo = barGeometry(barNode1, barNode2);
        const cosA = geo.dx / geo.L;
        const sinA = geo.dy / geo.L;

        // Get the internal forces at the hinge end
        const isStart = bar.start === hName;
        const sample = isStart ? diag.samples[0] : diag.samples[diag.samples.length - 1];
        const N = sample.normal;
        const V = sample.cortante;

        // Convert local N,V to global Fx, Fy
        // N is along bar axis (positive = tension), V perpendicular
        // The force the bar exerts ON the hinge node:
        const sign = isStart ? -1 : 1; // reaction on joint = opposite of internal
        const fxBar = sign * (N * cosA - V * sinA);
        const fyBar = sign * (N * sinA + V * cosA);

        Hx += fxBar;
        Vy += fyBar;
      }
    }

    // Also account for loads/reactions directly at hinge node
    if (numericalResults?.reactions) {
      const rxn = numericalResults.reactions.find((r) => r.node === hName);
      if (rxn) {
        Hx -= rxn.fx;
        Vy -= rxn.fy;
      }
    }
    // Account for nodal loads at hinge
    const nodalLoadsAtHinge = (model.nodalLoads || []).filter((l) => l.node === hName);
    for (const nl of nodalLoadsAtHinge) {
      Hx -= (nl.fx || 0);
      Vy -= (nl.fy || 0);
    }

    if (Math.abs(Hx) < EPS) Hx = 0;
    if (Math.abs(Vy) < EPS) Vy = 0;

    hingeForces.push({
      hingeName: hName,
      H: Hx,
      V: Vy,
      reasoning: [
        `Na rótula ${hName}, M = 0 (condição de rótula). A estrutura troca forças H e V, mas não momento.`,
        `Forças transmitidas pela rótula: H = ${fmt(Hx)} kN, V = ${fmt(Vy)} kN.`,
        `Pela 3ª Lei de Newton, a parte secundária aplica sobre a principal forças de sentido oposto: H = ${fmt(-Hx)} kN, V = ${fmt(-Vy)} kN.`,
      ],
    });
  }

  // ── Generate reasoning for each part ──

  for (const part of classifiedParts) {
    const partNodes = part.nodes.map((nm) => nodeByName(model, nm)).filter(Boolean);

    // Collect all loads acting on this part
    const partLoads = [];
    for (const bName of part.bars) {
      const bar = barByName(model, bName);
      if (!bar) continue;
      if (Math.abs(bar.qx || 0) > EPS || Math.abs(bar.qy || 0) > EPS) {
        const n1 = nodeByName(model, bar.start);
        const n2 = nodeByName(model, bar.end);
        const geo = barGeometry(n1, n2);
        const Rx = (bar.qx || 0) * geo.L;
        const Ry = (bar.qy || 0) * geo.L;
        partLoads.push({
          bar: bName,
          Rx, Ry,
          L: geo.L,
          qx: bar.qx || 0,
          qy: bar.qy || 0,
          centroidX: (n1.x + n2.x) / 2,
          centroidY: (n1.y + n2.y) / 2,
        });
      }
    }

    // Collect reactions from numerical results for this part
    const partReactions = [];
    if (numericalResults?.reactions) {
      for (const rxn of numericalResults.reactions) {
        if (part.nodes.includes(rxn.node)) {
          partReactions.push(rxn);
        }
      }
    }

    const reasoning = [];

    if (part.type === 'secundaria') {
      reasoning.push(`── RESOLUÇÃO DA PARTE SECUNDÁRIA ──`);
      reasoning.push(`Nós: ${part.nodes.join(', ')} | Barras: ${part.bars.join(', ')}`);
      reasoning.push(`Reações reais: ${part.realReactions} (${part.supportInfo.join(', ')})`);
      reasoning.push(`Rótulas conectadas: ${part.hingeConnections.join(', ')} → acrescenta 2 incógnitas (H, V) por rótula.`);
      reasoning.push(`Total de incógnitas: ${part.realReactions} + ${part.hingeConnections.length * 2} = ${part.realReactions + part.hingeConnections.length * 2} → 3 equações de equilíbrio (ΣFx=0, ΣFy=0, ΣM=0).`);

      if (partLoads.length > 0) {
        for (const pl of partLoads) {
          reasoning.push(`Carga na barra ${pl.bar}: q = (${fmt(pl.qx)}, ${fmt(pl.qy)}) kN/m ao longo de L = ${fmt(pl.L)} m. Resultante R = (${fmt(pl.Rx)}, ${fmt(pl.Ry)}) kN no centroide.`);
        }
      }

      // Show reactions found
      for (const rxn of partReactions) {
        const nd = nodeByName(model, rxn.node);
        reasoning.push(`Reação no apoio ${rxn.node} (${nd.support}): Hx = ${fmt(rxn.fx)} kN, Vy = ${fmt(rxn.fy)} kN${Math.abs(rxn.moment) > EPS ? `, Ma = ${fmt(rxn.moment)} kN·m` : ''}.`);
      }

      // Show hinge forces
      for (const hName of part.hingeConnections) {
        const hf = hingeForces.find((h) => h.hingeName === hName);
        if (hf) {
          reasoning.push(`Na rótula ${hName}: H = ${fmt(hf.H)} kN, V = ${fmt(hf.V)} kN (M = 0 na rótula).`);
        }
      }

      reasoning.push(`Pelo método dos binários (M = F·d): cada par de forças paralelas gera um binário. O equilíbrio exige que a soma dos binários horizontais seja igual (em módulo, oposta em sentido) à soma dos binários verticais.`);

      // Binary method detail for loads
      if (partLoads.length > 0) {
        for (const pl of partLoads) {
          const M0 = Math.abs(pl.qy) > EPS ? pl.qy * pl.L * pl.L / 8 : pl.qx * pl.L * pl.L / 8;
          if (Math.abs(M0) > EPS) {
            reasoning.push(`Flecha isostática da carga na barra ${pl.bar}: M₀ = q·L²/8 = ${fmt(Math.abs(pl.qx || pl.qy))}·${fmt(pl.L)}²/8 = ${fmt(Math.abs(M0))} kN·m.`);
          }
        }
      }

    } else {
      // Principal
      reasoning.push(`── RESOLUÇÃO DA PARTE PRINCIPAL ──`);
      reasoning.push(`Nós: ${part.nodes.join(', ')} | Barras: ${part.bars.join(', ')}`);
      reasoning.push(`Reações reais: ${part.realReactions} (${part.supportInfo.join(', ')}).`);
      reasoning.push(`As forças vindas da rótula entram como cargas externas aplicadas nesta parte (sentido invertido — Ação e Reação).`);

      for (const hName of part.hingeConnections) {
        const hf = hingeForces.find((h) => h.hingeName === hName);
        if (hf) {
          reasoning.push(`Cargas da rótula ${hName} (invertidas): H = ${fmt(-hf.H)} kN, V = ${fmt(-hf.V)} kN.`);
        }
      }

      // Show reactions found
      for (const rxn of partReactions) {
        const nd = nodeByName(model, rxn.node);
        reasoning.push(`Reação no apoio ${rxn.node} (${nd.support}): Hx = ${fmt(rxn.fx)} kN, Vy = ${fmt(rxn.fy)} kN${Math.abs(rxn.moment) > EPS ? `, Ma = ${fmt(rxn.moment)} kN·m` : ''}.`);
      }

      // Pendular bars in this part
      const partPendulars = pendularBars.filter((pb) => part.bars.includes(pb.barName));
      for (const pb of partPendulars) {
        reasoning.push(`Barra pendular ${pb.barName}: N = ${fmt(pb.axialForce)} kN (${pb.nature.toLowerCase()}). Direção: ${pb.direction}.`);
      }

      reasoning.push(`Com as forças da rótula e das barras pendulares, aplicam-se ΣFx=0, ΣFy=0 e ΣM=0 para encontrar as reações restantes.`);

      // Binary reasoning
      if (partReactions.length >= 2) {
        reasoning.push(`Pelo método dos binários: agrupa-se os pares de forças horizontais e verticais para calcular as reações desconhecidas como F = M/d.`);
      }
    }

    // Add moment diagram info for each bar in this part
    for (const bName of part.bars) {
      const bm = (numericalResults?.binaryMemory || []).find((b) => b.barName === bName);
      if (!bm) continue;
      if (pendularBarNames.has(bName)) {
        reasoning.push(`Barra ${bName}: pendular → M = 0, V = 0, N = ${fmt(bm.axial.N1)} kN ao longo de todo o comprimento.`);
      } else {
        reasoning.push(`Barra ${bName}: M(${bm.startNode}) = ${fmt(bm.endMoments.M1)} kN·m → M(${bm.endNode}) = ${fmt(bm.endMoments.M2)} kN·m. V_bin = ΔM/L = ${fmt(bm.binaryShear)} kN.`);
      }
    }

    part.reasoning = reasoning;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 7 — Verification
  // ══════════════════════════════════════════════════════════════════════════

  const gFx = numericalResults?.globalBalance?.somaFx ?? 0;
  const gFy = numericalResults?.globalBalance?.somaFy ?? 0;
  const gM = numericalResults?.globalBalance?.somaMomentos ?? 0;
  const globalOk = Math.max(Math.abs(gFx), Math.abs(gFy), Math.abs(gM)) < 1e-4;

  // Check M=0 at hinges
  let hingeCheckOk = true;
  const hingeCheckReasons = [];
  for (const hName of hingeNodes) {
    const nb = (numericalResults?.nodalBalance || []).find(
      (x) => x.no?.nome === hName,
    );
    if (nb && Math.abs(nb.somaMomentos) > 1e-4) {
      hingeCheckOk = false;
      hingeCheckReasons.push(`M na rótula ${hName} = ${fmt(nb.somaMomentos, 4)} kN·m (esperado ≈ 0).`);
    } else {
      hingeCheckReasons.push(`M = 0 na rótula ${hName} ✓`);
    }
  }

  const verification = {
    globalFx: gFx,
    globalFy: gFy,
    globalM: gM,
    hingeCheckOk,
    nodalCheckOk: globalOk,
    reasoning: [
      `Equilíbrio global: ΣFx = ${fmt(gFx, 4)} kN, ΣFy = ${fmt(gFy, 4)} kN, ΣM = ${fmt(gM, 4)} kN·m. ${globalOk ? '✓' : '✗'}`,
      ...hingeCheckReasons,
      globalOk && hingeCheckOk
        ? `Todas as verificações foram satisfeitas. O cálculo confere.`
        : `Atenção: há resíduos acima da tolerância. Revise o modelo.`,
    ],
  };

  // ══════════════════════════════════════════════════════════════════════════
  // Build full narrative
  // ══════════════════════════════════════════════════════════════════════════

  const fullNarrative = [
    `═══ CLASSIFICAÇÃO DA ESTRUTURA ═══`,
    ...classification.reasoning,
    ``,
  ];

  if (pendularBars.length > 0) {
    fullNarrative.push(`═══ BARRAS PENDULARES ═══`);
    for (const pb of pendularBars) {
      fullNarrative.push(...pb.reasoning);
    }
    fullNarrative.push(``);
  }

  fullNarrative.push(`═══ DIVISÃO E HIERARQUIA ═══`);
  for (const part of classifiedParts) {
    fullNarrative.push(`${part.name} (${part.type})`);
  }
  fullNarrative.push(``);

  for (const part of classifiedParts) {
    fullNarrative.push(...part.reasoning, ``);
  }

  fullNarrative.push(`═══ FORÇAS NAS RÓTULAS ═══`);
  for (const hf of hingeForces) {
    fullNarrative.push(...hf.reasoning);
  }
  fullNarrative.push(``);

  fullNarrative.push(`═══ VERIFICAÇÃO ═══`);
  fullNarrative.push(...verification.reasoning);

  return {
    isComposite: true,
    classification,
    pendularBars,
    parts: classifiedParts,
    hingeForces,
    verification,
    fullNarrative,
  };
}
