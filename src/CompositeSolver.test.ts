import assert from "node:assert/strict";
import { test } from "node:test";
import { calculateFrame } from "../web/calculator.js";
import { analyzeCompositeStructure } from "../web/composite-solver.js";

const quaseIgual = (obtido: number, esperado: number, tolerancia = 1e-4) => {
  assert.ok(
    Math.abs(obtido - esperado) < tolerancia,
    `esperado ${esperado}, obtido ${obtido}`,
  );
};

test("Pórtico Composto com Rótula e Barra Pendular (Exemplo de Referência)", () => {
  // Geometria de referência:
  // Nós:
  // A(0, 0) - apoio articulado
  // B(0, 6) - nó rígido
  // C(6, 6) - rótula interna
  // D(6, 0) - apoio articulado
  // E(12, 6) - nó rígido
  // F(12, 0) - apoio rolete
  // Barras:
  // AB (pilar esquerdo)
  // BC (viga esquerda)
  // CD (pilar central)
  // AD (barra pendular inferior / escora)
  // CE (viga direita)
  // EF (coluna direita com carga distribuída qx = 10 kN/m)
  
  const model = {
    nodes: [
      { name: "A", x: 0, y: 0, joint: "rigido", support: "rolete", reactionAngle: 90 },
      { name: "B", x: 0, y: 6, joint: "rigido", support: "none", reactionAngle: 90 },
      { name: "C", x: 6, y: 6, joint: "rotula", support: "none", reactionAngle: 90 },
      { name: "D", x: 6, y: 0, joint: "rigido", support: "articulado", reactionAngle: 90 },
      { name: "E", x: 12, y: 6, joint: "rigido", support: "none", reactionAngle: 90 },
      { name: "F", x: 12, y: 0, joint: "rigido", support: "rolete", reactionAngle: 90 },
    ],
    bars: [
      { name: "AB", start: "A", end: "B", qx: 0, qy: 0 },
      { name: "BC", start: "B", end: "C", qx: 0, qy: 0 },
      { name: "CD", start: "C", end: "D", qx: 0, qy: 0 },
      { name: "AD", start: "A", end: "D", qx: 0, qy: 0 },
      { name: "CE", start: "C", end: "E", qx: 0, qy: 0 },
      { name: "EF", start: "E", end: "F", qx: 10, qy: 0 },
    ],
    nodalLoads: [],
    pointLoads: [],
  };

  const results = calculateFrame(model);
  assert.ok(results, "O cálculo numérico deve convergir");

  const composite = analyzeCompositeStructure(model, results);
  assert.ok(composite, "Deve identificar como pórtico composto");
  assert.equal(composite.isComposite, true);
  assert.equal(composite.classification.internalHinges, 1);
  assert.equal(composite.classification.isIsostatic, true);
  
  // Barra pendular AD
  assert.ok(composite.pendularBars.length > 0, "Deve detectar a barra pendular AD");
  const barAD = composite.pendularBars.find(b => b.barName === "AD");
  assert.ok(barAD, "Barra AD deve ser pendular");
  assert.equal(barAD.direction, "horizontal");
  assert.equal(barAD.nature, "Comprimida");
  quaseIgual(Math.abs(barAD.axialForce), 60, 1.0);
  
  // Reações globais:
  // Carga total horizontal: 10 kN/m * 6m = 60 kN (para a direita)
  // Reação H em D deve ser -60 kN (para a esquerda)
  const rD = results.reactions.find(r => r.node === "D");
  assert.ok(rD);
  quaseIgual(rD.fx, -60, 1.0);

  // Verificação de partes e rótulas
  assert.ok(composite.parts.length >= 2, "Deve dividir a estrutura em partes");
  assert.equal(composite.verification.hingeCheckOk, true);
});
