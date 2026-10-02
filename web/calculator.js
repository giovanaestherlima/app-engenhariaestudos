import { Apoio, Barra, No, Portico } from '../src/Portico.ts';

function finiteNumber(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`${label} precisa ser um número válido.`);
  return number;
}

export function calculateFrame(model, sampleCount = 40) {
  const frame = new Portico();
  const nodes = new Map();
  const bars = new Map();

  for (const input of model.nodes) {
    const name = String(input.name || '').trim();
    if (!name) throw new Error('Todo nó precisa de uma identificação.');
    if (nodes.has(name)) throw new Error(`A identificação de nó ${name} está duplicada.`);
    const node = new No(
      finiteNumber(input.x, `Coordenada X do nó ${name}`),
      finiteNumber(input.y, `Coordenada Y do nó ${name}`),
      name,
      input.joint === 'rotula' ? 'rotula' : 'rigido',
    );
    nodes.set(name, node);
    frame.adicionarNo(node);
  }

  for (const input of model.bars) {
    const name = String(input.name || '').trim();
    const start = nodes.get(input.start);
    const end = nodes.get(input.end);
    if (!name) throw new Error('Toda barra precisa de uma identificação.');
    if (bars.has(name)) throw new Error(`A identificação de barra ${name} está duplicada.`);
    if (!start || !end) throw new Error(`Confira os nós inicial e final da barra ${name}.`);

    const bar = new Barra(start, end, name);
    if (input.qx || input.qy) {
      bar.adicionarCargaDistribuida(
        finiteNumber(input.qx || 0, `qx da barra ${name}`),
        finiteNumber(input.qy || 0, `qy da barra ${name}`),
      );
    }
    bars.set(name, bar);
    frame.adicionarBarra(bar);
  }

  for (const input of model.nodes) {
    const node = nodes.get(input.name);
    if (input.support === 'articulado' || input.support === 'engaste') {
      frame.adicionarApoio(new Apoio(node, input.support));
    } else if (input.support === 'rolete') {
      const angle = finiteNumber(input.reactionAngle ?? 90, `Ângulo do rolete em ${input.name}`) * Math.PI / 180;
      frame.adicionarApoio(new Apoio(node, 'rolete', { x: Math.cos(angle), y: Math.sin(angle) }));
    }
  }

  for (const load of model.nodalLoads || []) {
    const node = nodes.get(load.node);
    if (!node) throw new Error(`A carga nodal aponta para o nó inexistente ${load.node}.`);
    frame.adicionarCargaNo(
      node,
      finiteNumber(load.fx || 0, `Fx no nó ${load.node}`),
      finiteNumber(load.fy || 0, `Fy no nó ${load.node}`),
      finiteNumber(load.moment || 0, `Momento no nó ${load.node}`),
    );
  }

  for (const load of model.pointLoads || []) {
    const bar = bars.get(load.bar);
    if (!bar) throw new Error(`A carga pontual aponta para a barra inexistente ${load.bar}.`);
    bar.adicionarCargaPontual(
      finiteNumber(load.position, `Posição da carga na barra ${load.bar}`),
      finiteNumber(load.fx || 0, `Fx na barra ${load.bar}`),
      finiteNumber(load.fy || 0, `Fy na barra ${load.bar}`),
    );
  }

  const result = frame.resolver();
  const diagrams = [...bars.entries()].map(([name, bar]) => {
    const samples = Array.from({ length: sampleCount + 1 }, (_, index) => {
      const position = bar.comprimento * index / sampleCount;
      return { position, ...result.calcularEsforcosNaBarra(bar, position) };
    });
    return {
      name,
      length: bar.comprimento,
      start: bar.noInicial.nome,
      end: bar.noFinal.nome,
      samples,
    };
  });

  const binaryMemory = diagrams.map((barDiag) => {
    const bar = bars.get(barDiag.name);
    const L = bar.comprimento;
    const n1 = bar.noInicial;
    const n2 = bar.noFinal;
    const cosTheta = bar.c;
    const sinTheta = bar.s;
    const angleDeg = Math.round(Math.atan2(sinTheta, cosTheta) * 180 / Math.PI * 10) / 10;

    const s0 = barDiag.samples[0];
    const sEnd = barDiag.samples[barDiag.samples.length - 1];

    const M1 = Math.abs(s0.momento) < 1e-9 ? 0 : s0.momento;
    const M2 = Math.abs(sEnd.momento) < 1e-9 ? 0 : sEnd.momento;
    const deltaM = M2 - M1;
    const V_bin = deltaM / L;

    const distLoads = bar.getCargasDistribuidas();
    let qx = 0;
    let qy = 0;
    for (const dl of distLoads) {
      qx += dl.qx;
      qy += dl.qy;
    }

    const qTransv = -qx * sinTheta + qy * cosTheta;
    const qAxial = qx * cosTheta + qy * sinTheta;

    const Qtransv = qTransv * L;
    const V01 = Qtransv / 2;
    const V02 = -Qtransv / 2;
    const M0max = (qTransv * L * L) / 8;

    const V1 = Math.abs(s0.cortante) < 1e-9 ? 0 : s0.cortante;
    const V2 = Math.abs(sEnd.cortante) < 1e-9 ? 0 : sEnd.cortante;

    const N1 = Math.abs(s0.normal) < 1e-9 ? 0 : s0.normal;
    const N2 = Math.abs(sEnd.normal) < 1e-9 ? 0 : sEnd.normal;

    const moments = barDiag.samples.map((s) => s.momento);
    const maxM = Math.max(...moments);
    const minM = Math.min(...moments);
    const extremeMoment = Math.abs(maxM) >= Math.abs(minM) ? maxM : minM;

    let zeroShearX = null;
    if (Math.abs(qTransv) > 1e-6) {
      const xCandidate = V1 / qTransv;
      if (xCandidate > 0.01 && xCandidate < L - 0.01) {
        zeroShearX = xCandidate;
      }
    }

    const reasoning = [
      `1. Isolamento da Barra: Elemento ${barDiag.name} conectando o Nó ${n1.nome} (${n1.x.toFixed(2)}; ${n1.y.toFixed(2)}) ao Nó ${n2.nome} (${n2.x.toFixed(2)}; ${n2.y.toFixed(2)}), com comprimento L = ${L.toFixed(2)} m e inclinação angular θ = ${angleDeg.toFixed(1)}°.`,
      `2. Momentos Nodais de Extremidade: M(${n1.nome}) = ${M1.toFixed(2)} kN·m e M(${n2.nome}) = ${M2.toFixed(2)} kN·m. O gradiente de momento ao longo da barra é ΔM = M(${n2.nome}) − M(${n1.nome}) = ${deltaM.toFixed(2)} kN·m.`,
      `3. Binário de Cisalhamento de Equilíbrio: Para equilibrar a rotação imposta pelos momentos das extremidades, surge um binário de forças transversais com braço L = ${L.toFixed(2)} m: V_bin = ΔM / L = ${deltaM.toFixed(2)} / ${L.toFixed(2)} = ${V_bin.toFixed(2)} kN.`,
      Math.abs(qTransv) > 1e-6
        ? `4. Parcela Isostática de Cargas no Vão: Carga transversal uniforme q⊥ = ${qTransv.toFixed(2)} kN/m. Resultante transversal Q⊥ = ${Qtransv.toFixed(2)} kN. Reações isostáticas na biapoiada simples equivalente: V0,ini = ${V01.toFixed(2)} kN e V0,fim = ${V02.toFixed(2)} kN. Momento fletor isostático máximo no meio do vão: M0,max = q·L²/8 = ${M0max.toFixed(2)} kN·m.`
        : `4. Parcela Isostática de Cargas no Vão: Não há carregamento transversal distribuído na barra (q⊥ = 0). O esforço cortante ao longo da barra decorre estritamente do binário dos momentos de extremidade.`,
      `5. Superposição dos Esforços Cortantes: V(x) = V0(x) + V_bin. Cortante inicial V(${n1.nome}) = ${V1.toFixed(2)} kN e cortante final V(${n2.nome}) = ${V2.toFixed(2)} kN.${zeroShearX !== null ? ` Seção de cortante nulo V=0 em x = ${zeroShearX.toFixed(2)} m, correspondendo ao ponto de momento fletor máximo de campo.` : ''}`,
      `6. Equação e Linha do Momento Fletor M(x): O diagrama de momento varia ${Math.abs(qTransv) > 1e-6 ? 'de forma parabólica (2º grau)' : 'de forma linear (1º grau)'} entre ${M1.toFixed(2)} kN·m no início e ${M2.toFixed(2)} kN·m no final, alcançando o valor extremo de ${extremeMoment.toFixed(2)} kN·m.`,
      `7. Equilíbrio Axial (Normal N): Força normal N = ${N1.toFixed(2)} kN (${N1 > 0.01 ? 'solicitação de Tração' : N1 < -0.01 ? 'solicitação de Compressão' : 'barra descarregada axialmente'}).`,
      `8. Transmissão e Equilíbrio Nodal: As forças cortantes e normais de extremidade geram as reações de apoio correspondentes ou transferem os esforços para as barras concorrentes, garantindo ΣM = 0 e ΣF = 0 em todos os nós.`
    ];

    return {
      barName: barDiag.name,
      startNode: n1.nome,
      endNode: n2.nome,
      length: L,
      angleDeg,
      nodesCoords: { x1: n1.x, y1: n1.y, x2: n2.x, y2: n2.y },
      loads: { qx, qy, qTransv, qAxial },
      endMoments: { M1, M2, deltaM },
      binaryShear: V_bin,
      isostaticPart: { qTransv, Qtransv, V01, V02, M0max },
      superposition: { V1, V2, zeroShearX, extremeMoment },
      axial: { N1, N2, status: N1 > 0.01 ? 'Tração' : N1 < -0.01 ? 'Compressão' : 'Nulo' },
      reasoning,
    };
  });

  return {
    degree: frame.calcularGrauEstaticidade(),
    reactions: result.reacoes.map((reaction) => ({
      node: reaction.apoio.no.nome,
      type: reaction.apoio.tipo,
      fx: reaction.fx,
      fy: reaction.fy,
      moment: reaction.momento,
    })),
    globalBalance: result.equilibrioGlobal,
    nodalBalance: result.equilibrioNodal,
    diagrams,
    binaryMemory,
  };
}