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
  };
}