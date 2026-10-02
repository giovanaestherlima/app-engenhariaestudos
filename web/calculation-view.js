const svgIcon = (path) => `<svg viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`;

const nodeOptions = (nodes, selected) => nodes.map((node) =>
  `<option value="${escapeAttr(node.name)}" ${node.name === selected ? 'selected' : ''}>${escapeHtml(node.name)}</option>`,
).join('');

const barOptions = (bars, selected) => bars.map((bar) =>
  `<option value="${escapeAttr(bar.name)}" ${bar.name === selected ? 'selected' : ''}>${escapeHtml(bar.name)}</option>`,
).join('');

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function inputField(label, value, key, type = 'number', options = {}) {
  const step = options.step || 'any';
  const placeholder = options.placeholder || '';
  const textValue = value ?? '';
  return `<label class="model-field"><span>${label}</span><input data-field="${key}" type="${type}" ${type === 'number' ? `step="${step}"` : ''} value="${escapeAttr(textValue)}" placeholder="${placeholder}" ${options.min !== undefined ? `min="${options.min}"` : ''} /></label>`;
}

function selectField(label, value, key, options) {
  return `<label class="model-field"><span>${label}</span><select data-field="${key}">${options.map(([optionValue, optionLabel]) =>
    `<option value="${optionValue}" ${value === optionValue ? 'selected' : ''}>${optionLabel}</option>`,
  ).join('')}</select></label>`;
}

export function createDemoModel() {
  return {
    nodes: [
      { name: 'A', x: 0, y: 0, joint: 'rigido', support: 'articulado', reactionAngle: 90 },
      { name: 'B', x: 0, y: 3, joint: 'rigido', support: 'none', reactionAngle: 90 },
      { name: 'C', x: 3, y: 3, joint: 'rigido', support: 'rolete', reactionAngle: 90 },
    ],
    bars: [
      { name: 'AB', start: 'A', end: 'B', qx: 0, qy: 0 },
      { name: 'BC', start: 'B', end: 'C', qx: 0, qy: 0 },
    ],
    nodalLoads: [{ node: 'B', fx: 10, fy: 0, moment: 0 }],
    pointLoads: [],
  };
}

export function readCalculationModel(root) {
  const readRows = (selector, map) => [...root.querySelectorAll(selector)].map(map);
  const read = (row, key) => row.querySelector(`[data-field="${key}"]`)?.value ?? '';
  return {
    nodes: readRows('[data-node-row]', (row) => ({
      name: read(row, 'name').trim(),
      x: read(row, 'x'),
      y: read(row, 'y'),
      joint: read(row, 'joint'),
      support: read(row, 'support'),
      reactionAngle: read(row, 'reactionAngle'),
    })),
    bars: readRows('[data-bar-row]', (row) => ({
      name: read(row, 'name').trim(),
      start: read(row, 'start'),
      end: read(row, 'end'),
      qx: read(row, 'qx') || 0,
      qy: read(row, 'qy') || 0,
    })),
    nodalLoads: readRows('[data-nodal-load-row]', (row) => ({
      node: read(row, 'node'),
      fx: read(row, 'fx') || 0,
      fy: read(row, 'fy') || 0,
      moment: read(row, 'moment') || 0,
    })),
    pointLoads: readRows('[data-point-load-row]', (row) => ({
      bar: read(row, 'bar'),
      position: read(row, 'position'),
      fx: read(row, 'fx') || 0,
      fy: read(row, 'fy') || 0,
    })),
  };
}

function renderNodeRow(node, index) {
  return `<article class="model-row" data-node-row>
    <div class="model-row-title"><span class="row-index">${String(index + 1).padStart(2, '0')}</span><strong>Nó</strong></div>
    <div class="model-fields model-fields-node">
      ${inputField('Identificação', node.name, 'name', 'text', { placeholder: 'A' })}
      ${inputField('X (m)', node.x, 'x')}
      ${inputField('Y (m)', node.y, 'y')}
      ${selectField('Ligação', node.joint, 'joint', [['rigido', 'Rígida'], ['rotula', 'Rótula']])}
      ${selectField('Apoio', node.support, 'support', [['none', 'Sem apoio'], ['articulado', 'Articulado'], ['rolete', 'Rolete'], ['engaste', 'Engaste']])}
      ${inputField('Ângulo do rolete (°)', node.reactionAngle ?? 90, 'reactionAngle')}
    </div>
  </article>`;
}

function renderBarRow(bar, index, model) {
  return `<article class="model-row" data-bar-row>
    <div class="model-row-title"><span class="row-index">${String(index + 1).padStart(2, '0')}</span><strong>Barra</strong></div>
    <div class="model-fields model-fields-bar">
      ${inputField('Identificação', bar.name, 'name', 'text', { placeholder: 'AB' })}
      ${selectField('Nó inicial', bar.start, 'start', model.nodes.map((node) => [node.name, node.name]))}
      ${selectField('Nó final', bar.end, 'end', model.nodes.map((node) => [node.name, node.name]))}
      ${inputField('qx uniforme (kN/m)', bar.qx ?? 0, 'qx')}
      ${inputField('qy uniforme (kN/m)', bar.qy ?? 0, 'qy')}
    </div>
  </article>`;
}

function renderNodalLoadRow(load, model) {
  return `<article class="model-row load-row" data-nodal-load-row>
    <div class="model-fields model-fields-load">
      ${selectField('Nó', load.node, 'node', model.nodes.map((node) => [node.name, node.name]))}
      ${inputField('Fx (kN)', load.fx ?? 0, 'fx')}
      ${inputField('Fy (kN)', load.fy ?? 0, 'fy')}
      ${inputField('Momento (kN·m)', load.moment ?? 0, 'moment')}
    </div>
  </article>`;
}

function renderPointLoadRow(load, model) {
  return `<article class="model-row load-row" data-point-load-row>
    <div class="model-fields model-fields-point">
      ${selectField('Barra', load.bar, 'bar', model.bars.map((bar) => [bar.name, bar.name]))}
      ${inputField('Posição local x (m)', load.position, 'position')}
      ${inputField('Fx (kN)', load.fx ?? 0, 'fx')}
      ${inputField('Fy (kN)', load.fy ?? 0, 'fy')}
    </div>
  </article>`;
}

export function renderCalculationView(model, imageUrl, results, errorMessage = '', calcMode = 'reacoes') {
  const imagePanel = imageUrl
    ? `<figure class="model-photo"><img src="${escapeAttr(imageUrl)}" alt="Foto de referência da estrutura"><figcaption>Imagem de referência, não interpretada automaticamente.</figcaption></figure>`
    : `<div class="model-photo model-photo-empty">Nenhuma foto anexada. O modelo pode ser calculado pela geometria informada.</div>`;
  const nodeRows = model.nodes.map(renderNodeRow).join('');
  const barRows = model.bars.map((bar, index) => renderBarRow(bar, index, model)).join('');
  const loadRows = model.nodalLoads.map((load) => renderNodalLoadRow(load, model)).join('');
  const pointRows = model.pointLoads.map((load) => renderPointLoadRow(load, model)).join('');

  return `<div class="page-wrap calculation-page">
    <nav class="breadcrumb"><button type="button" data-action="go-home">Início</button>${svgIcon('<path d="M5 12h14m-6-6 6 6-6 6"/>')}<button type="button" data-action="open-structures">Estruturas</button>${svgIcon('<path d="M5 12h14m-6-6 6 6-6 6"/>')}<span>Modelo e cálculo</span></nav>
    <div class="page-heading"><div><p class="eyebrow">Análise de pórtico plano</p><h1>Modelo e cálculo</h1><p class="lede">Confira os dados geométricos e de carregamento da imagem antes de calcular.</p></div><div class="heading-actions"><button class="outline-button" type="button" data-action="open-upload">Trocar foto</button></div></div>
    <div class="calculation-notice"><strong>Confirme o modelo</strong><span>A foto serve como referência. Escala, apoios, conexões e cargas precisam ser transcritos para os campos abaixo; não são detectados automaticamente.</span></div>
    <div class="calculation-layout">
      <form class="model-form" id="modelForm" onsubmit="return false">
        <section class="model-section"><div class="model-section-head"><div><p class="eyebrow">Geometria e vínculos</p><h2>Nós</h2></div><button class="outline-button compact-button" type="button" data-action="add-node">+ Adicionar nó</button></div><div class="model-rows" id="nodeRows">${nodeRows}</div></section>
        <section class="model-section"><div class="model-section-head"><div><p class="eyebrow">Conectividade e cargas</p><h2>Barras</h2></div><button class="outline-button compact-button" type="button" data-action="add-bar">+ Adicionar barra</button></div><div class="model-rows" id="barRows">${barRows}</div><p class="model-help">qx e qy são cargas uniformes nos eixos globais. Use valores negativos para cargas para a esquerda ou para baixo.</p></section>
        <section class="model-section"><div class="model-section-head"><div><p class="eyebrow">Ações concentradas</p><h2>Cargas nos nós</h2></div><button class="outline-button compact-button" type="button" data-action="add-nodal-load">+ Adicionar carga</button></div><div class="model-rows" id="nodalLoadRows">${loadRows}</div><details class="point-load-details"><summary>Cargas pontuais aplicadas no meio de barras</summary><div class="model-section-head inner-add"><span>Posições locais medidas do nó inicial</span><button class="outline-button compact-button" type="button" data-action="add-point-load">+ Carga na barra</button></div><div class="model-rows" id="pointLoadRows">${pointRows || '<p class="model-help">Nenhuma carga pontual em barra adicionada.</p>'}</div></details></section>
        ${errorMessage ? `<div class="calculation-error" role="alert"><strong>Não foi possível calcular</strong><span>${escapeHtml(errorMessage)}</span></div>` : ''}
        <div class="model-submit-row"><span>Unidades: m, kN e kN·m</span><button class="primary-button" type="button" data-action="calculate-frame">Calcular estrutura</button></div>
      </form>
      <aside class="model-aside">${imagePanel}<div class="analysis-panel"><strong>Convenções aplicadas</strong><p>N positivo à tração; cortante positivo com giro horário; momento de viga positivo com tração inferior. Em rótulas, M = 0.</p></div><div class="analysis-panel"><strong>Modelo inicial</strong><p>Os campos começam com um exemplo editável de pórtico. Substitua-o pelos dados conferidos na imagem.</p></div></aside>
    </div>
    ${results ? renderCalculationResults(results, calcMode) : ''}
  </div>`;
}

function numberPt(value, digits = 2) {
  if (Math.abs(value) < 1e-9) value = 0;
  return Number(value).toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function resultCard(label, value, unit, hint = '') {
  return `<div class="result-card"><span>${label}</span><strong>${numberPt(value)} <small>${unit}</small></strong>${hint ? `<em>${hint}</em>` : ''}</div>`;
}

function diagramSvg(samples, field, color, unit) {
  const width = 560;
  const baseline = 78;
  const plotLeft = 40;
  const plotWidth = 480;
  const maxValue = Math.max(1e-9, ...samples.map((sample) => Math.abs(sample[field])));
  const scale = 52 / maxValue;
  const points = samples.map((sample, index) => ({
    x: plotLeft + (plotWidth * index / (samples.length - 1)),
    y: baseline - sample[field] * scale,
  }));
  const line = points.map((point, index) => `${index ? 'L' : 'M'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ');
  const area = `M${plotLeft} ${baseline} ${points.map((point) => `L${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ')} L${plotLeft + plotWidth} ${baseline} Z`;
  const maxPositive = Math.max(...samples.map((sample) => sample[field]));
  const minNegative = Math.min(...samples.map((sample) => sample[field]));
  return `<div class="diagram-box"><div class="diagram-title"><strong>${field === 'normal' ? 'Normal' : field === 'cortante' ? 'Cortante' : 'Momento fletor'}</strong><span>${unit}</span></div><svg class="diagram-svg" viewBox="0 0 ${width} 130" role="img" aria-label="Diagrama de ${field}"><line x1="${plotLeft}" y1="${baseline}" x2="${plotLeft + plotWidth}" y2="${baseline}" class="diagram-axis"/><path d="${area}" fill="${color}" opacity=".13"/><path d="${line}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><text x="${plotLeft}" y="116" class="diagram-label">0 m</text><text x="${plotLeft + plotWidth}" y="116" text-anchor="end" class="diagram-label">x final</text><text x="${plotLeft + plotWidth / 2}" y="127" text-anchor="middle" class="diagram-extreme">máx ${numberPt(maxPositive)} · mín ${numberPt(minNegative)} ${unit}</text></svg></div>`;
}

function renderBinaryBarCard(bar) {
  return `<article class="binary-bar-card">
    <div class="binary-bar-head">
      <div>
        <span class="bar-tag">Barra ${escapeHtml(bar.barName)}</span>
        <h3>${escapeHtml(bar.startNode)} → ${escapeHtml(bar.endNode)} <small>Vão L = ${numberPt(bar.length)} m · Inclinação θ = ${bar.angleDeg}°</small></h3>
      </div>
      <div class="binary-badges">
        <span class="binary-badge">ΔM = ${numberPt(bar.endMoments.deltaM)} kN·m</span>
        <span class="binary-badge highlight">V<sub>bin</sub> = ${numberPt(bar.binaryShear)} kN</span>
        <span class="binary-badge ${bar.axial.status === 'Tração' ? 'tension' : bar.axial.status === 'Compressão' ? 'compression' : ''}">N = ${numberPt(bar.axial.N1)} kN (${bar.axial.status})</span>
      </div>
    </div>
    <div class="binary-metrics-grid">
      <div class="metric-item">
        <span>Momento Inicial M(${escapeHtml(bar.startNode)})</span>
        <strong>${numberPt(bar.endMoments.M1)} <small>kN·m</small></strong>
      </div>
      <div class="metric-item">
        <span>Momento Final M(${escapeHtml(bar.endNode)})</span>
        <strong>${numberPt(bar.endMoments.M2)} <small>kN·m</small></strong>
      </div>
      <div class="metric-item">
        <span>Binário Transversal V<sub>bin</sub></span>
        <strong>${numberPt(bar.binaryShear)} <small>kN</small></strong>
      </div>
      <div class="metric-item">
        <span>Cortante Inicial V(${escapeHtml(bar.startNode)})</span>
        <strong>${numberPt(bar.superposition.V1)} <small>kN</small></strong>
      </div>
      <div class="metric-item">
        <span>Cortante Final V(${escapeHtml(bar.endNode)})</span>
        <strong>${numberPt(bar.superposition.V2)} <small>kN</small></strong>
      </div>
      <div class="metric-item">
        <span>Momento Crítico no Vão</span>
        <strong>${numberPt(bar.superposition.extremeMoment)} <small>kN·m</small></strong>
      </div>
    </div>
    <div class="binary-reasoning-wrap">
      <h4>Linha de Raciocínio Passo a Passo (Cálculo da Barra):</h4>
      <ol class="binary-reasoning-steps">
        ${bar.reasoning.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}
      </ol>
    </div>
  </article>`;
}

function renderCalculationResults(results, calcMode = 'reacoes') {
  const balanceOk = Math.max(Math.abs(results.globalBalance.somaFx), Math.abs(results.globalBalance.somaFy), Math.abs(results.globalBalance.somaMomentos)) < 1e-7;
  const reactions = results.reactions.map((reaction) => `<article class="reaction-card"><div class="reaction-card-head"><strong>Apoio ${escapeHtml(reaction.node)}</strong><span>${reaction.type}</span></div><div class="reaction-values"><div><small>Hx</small><b>${numberPt(reaction.fx)} <i>kN</i></b></div><div><small>Vy</small><b>${numberPt(reaction.fy)} <i>kN</i></b></div><div><small>Ma</small><b>${numberPt(reaction.moment)} <i>kN·m</i></b></div></div></article>`).join('');
  const diagrams = results.diagrams.map((bar) => `<article class="bar-result"><div class="bar-result-head"><div><p class="eyebrow">Barra ${escapeHtml(bar.name)}</p><h3>${escapeHtml(bar.start)} → ${escapeHtml(bar.end)} <small>${numberPt(bar.length)} m</small></h3></div><span class="result-tag">${bar.samples.length} seções</span></div><div class="diagram-grid">${diagramSvg(bar.samples, 'normal', '#205d8c', 'kN')}${diagramSvg(bar.samples, 'cortante', '#13a891', 'kN')}${diagramSvg(bar.samples, 'momento', '#d86d54', 'kN·m')}</div></article>`).join('');

  const modeSwitcher = `
    <div class="calc-mode-switcher" role="tablist" aria-label="Modo de visualização dos cálculos">
      <button class="mode-toggle-btn ${calcMode === 'reacoes' ? 'active' : ''}" type="button" data-action="set-calc-mode" data-mode="reacoes">
        ${svgIcon('<path d="M4 20h16M6 20V8h12v12M3 8h18M8 8V4h8v4M9 12v2m6-2v2"/>')}
        <span>Visualizar por Reações</span>
      </button>
      <button class="mode-toggle-btn ${calcMode === 'binario' ? 'active' : ''}" type="button" data-action="set-calc-mode" data-mode="binario">
        ${svgIcon('<path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10zM14 7l3 3"/>')}
        <span>Visualizar por Binário (Memória)</span>
      </button>
    </div>`;

  if (calcMode === 'binario') {
    const binaryBars = (results.binaryMemory || []).map(renderBinaryBarCard).join('');
    const nodalCheck = (results.nodalBalance || []).map((nb) => `
      <div class="nodal-balance-card">
        <div class="nodal-balance-head"><strong>Nó ${escapeHtml(nb.no.nome)}</strong><span class="tag">${nb.no.tipoLigacao === 'rotula' ? 'Rótula Interna' : 'Nó Rígido'}</span></div>
        <p>Resíduo de Momento: <b>${numberPt(nb.somaMomentos, 4)} kN·m</b></p>
        <p>Resíduo Fx: <b>${numberPt(nb.somaFx, 4)} kN</b> · Fy: <b>${numberPt(nb.somaFy, 4)} kN</b></p>
        <small>${nb.no.tipoLigacao === 'rotula' ? 'Momento nulo na rótula interna (M = 0).' : 'Os momentos de extremidade das barras concorrentes somam zero (ΣM = 0), transferindo os binários perfeitamente.'}</small>
      </div>`).join('');

    return `<section class="calculation-results" id="calculationResults">
      <div class="results-heading">
        <div>
          <p class="eyebrow">Memória Didática de Cálculo</p>
          <h2>Cálculo das Barras por Binário</h2>
          <p>Linha de raciocínio passo a passo de cada barra pelo equilíbrio de momentos e binários transversais.</p>
        </div>
        <span class="result-badge ${balanceOk ? 'ok' : 'warn'}">${balanceOk ? 'Equilíbrio Satisfeito' : 'Confira o modelo'}</span>
      </div>
      ${modeSwitcher}
      <div class="binary-intro-card">
        <div class="binary-intro-head">
          <div class="binary-intro-icon">${svgIcon('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>')}</div>
          <div>
            <strong>Fundamento do Método por Binário</strong>
            <p>O equilíbrio à rotação de cada elemento isolado é estabelecido pelo binário de forças de cisalhamento: <code>V<sub>bin</sub> = (M<sub>fim</sub> − M<sub>ini</sub>) / L</code>. Esse binário se superpõe às forças isostáticas das cargas no vão (<code>V(x) = V<sub>0</sub>(x) + V<sub>bin</sub></code>), fornecendo a linha de raciocínio completa para obtenção dos diagramas N, V e M.</p>
          </div>
        </div>
      </div>
      <div class="binary-bars-list">${binaryBars}</div>
      <div class="nodal-binary-section">
        <div class="section-head"><div><p class="eyebrow">Compatibilidade Nodal</p><h3>Equilíbrio dos Nós por Binário</h3></div><span class="result-badge ok">ΣM = 0 nos Nós</span></div>
        <div class="nodal-balance-grid">${nodalCheck}</div>
      </div>
      <div class="bar-diagrams-section">
        <div class="section-head"><div><p class="eyebrow">Visualização Gráfica</p><h3>Diagramas Estruturais Resultantes</h3></div></div>
        <div class="bar-diagrams">${diagrams}</div>
      </div>
      <details class="balance-details">
        <summary>Conferir resíduos de equilíbrio global</summary>
        <p>ΣFx = ${numberPt(results.globalBalance.somaFx, 6)} kN · ΣFy = ${numberPt(results.globalBalance.somaFy, 6)} kN · ΣM = ${numberPt(results.globalBalance.somaMomentos, 6)} kN·m</p>
      </details>
    </section>`;
  }

  return `<section class="calculation-results" id="calculationResults">
    <div class="results-heading">
      <div>
        <p class="eyebrow">Resultado do equilíbrio</p>
        <h2>Reações e diagramas</h2>
        <p>Grau de estaticidade g<sub>h</sub> = ${results.degree}; o equilíbrio foi ${balanceOk ? 'satisfeito' : 'verificado com resíduo numérico'}.</p>
      </div>
      <span class="result-badge ${balanceOk ? 'ok' : 'warn'}">${balanceOk ? 'Equilibrado' : 'Confira o modelo'}</span>
    </div>
    ${modeSwitcher}
    <div class="reaction-grid">${reactions}</div>
    <div class="bar-diagrams">${diagrams}</div>
    <details class="balance-details">
      <summary>Conferir resíduos de equilíbrio global</summary>
      <p>ΣFx = ${numberPt(results.globalBalance.somaFx, 6)} kN · ΣFy = ${numberPt(results.globalBalance.somaFy, 6)} kN · ΣM = ${numberPt(results.globalBalance.somaMomentos, 6)} kN·m</p>
    </details>
  </section>`;
}