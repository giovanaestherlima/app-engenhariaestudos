import { calculateFrame } from './calculator.js';
import { createDemoModel, readCalculationModel, renderCalculationView } from './calculation-view.js';
import { FtoolCanvasApp } from './ftool-canvas.js';

const icons = {
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  structure: '<path d="M4 20h16M6 20V8h12v12M3 8h18M8 8V4h8v4M9 12v2m6-2v2"/>',
  ruler: '<path d="M4 20 20 4M7 17l-2-2m5-1-2-2m5-1-2-2m5-1-2-2"/>',
  mountain: '<path d="m3 19 6-10 4 6 3-4 5 8zM9 9l2-4 3 4"/>',
  wall: '<path d="M4 20V5l8-2 8 2v15M4 9h16M4 14h16M8 9v5m8-5v5m-4 0v6"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5zM4 16h16M8 7h8m-8 4h6"/>',
  water: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11zM9 15a3 3 0 0 0 3 3"/>',
  budget: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5c-.7-.8-1.8-1.2-3.1-1.2-1.8 0-3 .8-3 2s1.1 1.8 3 2.2c1.8.4 3 .9 3 2.2s-1.2 2.2-3.2 2.2c-1.4 0-2.6-.5-3.3-1.4M12 5.5v13"/>',
  search: '<circle cx="10.8" cy="10.8" r="6.7"/><path d="m16 16 4.5 4.5"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  back: '<path d="m15 18-6-6 6-6M9 12h11"/>',
  pencil: '<path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10zM14 7l3 3"/>',
  line: '<path d="M5 19 19 5"/>',
  eraser: '<path d="m7 16-3-3a2 2 0 0 1 0-3l6-6a2 2 0 0 1 3 0l7 7a2 2 0 0 1 0 3l-3 3H8a2 2 0 0 1-1-1zM10 7l7 7m-9 4 6-6"/>',
  undo: '<path d="M9 14 4 9l5-5M4 9h9a6 6 0 0 1 0 12h-2"/>',
  redo: '<path d="m15 14 5-5-5-5m5 5h-9a6 6 0 0 0 0 12h2"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M5 20h14"/>',
  camera: '<path d="M4 7h3l1.5-2h7L17 7h3v12H4z"/><circle cx="12" cy="13" r="3.5"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m21 15-5-5L5 20"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  document: '<path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7m-7 4h7"/>',
  grid: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>',
};

import { categories, content, topographyDetails, summaryExtras, fullLessons } from './study-data.js';

const initialDemo = createDemoModel();
let initialResults = null;
try {
  initialResults = calculateFrame(initialDemo);
} catch (e) {}

const state = {
  view: 'home',
  category: 'estruturas',
  menuOpen: false,
  tool: 'pencil',
  color: '#175b8d',
  canvasUndo: [],
  canvasRedo: [],
  imageUrl: '',
  calculationModel: initialDemo,
  calculationResults: initialResults,
  calculationError: '',
  calcMode: 'reacoes',
  summaryIndex: 0,
  articleIndex: 0,
  summaryQuery: '',
  summaryKind: 'todos',
  toastTimer: 0,
};

function getFtoolModel() {
  if (!state.ftoolApp) return null;
  const fNodes = state.ftoolApp.nodes;
  const fMembers = state.ftoolApp.members;
  const fLoads = state.ftoolApp.nodalLoads;
  if (!fNodes || fNodes.length === 0) return null;
  return {
    nodes: fNodes.map((n) => ({
      name: n.name || n.id,
      x: n.x,
      y: n.y,
      joint: 'rigido',
      support: n.support?.fixX && n.support?.fixY && n.support?.fixRz ? 'engaste'
        : n.support?.fixX && n.support?.fixY ? 'articulado'
        : n.support?.fixY ? 'rolete'
        : 'none',
      reactionAngle: 90,
    })),
    bars: fMembers.map((m) => {
      const n1 = fNodes.find((n) => n.id === m.startNodeId);
      const n2 = fNodes.find((n) => n.id === m.endNodeId);
      const dload = m.distributedLoads?.[0];
      return {
        name: m.name || m.id,
        start: n1?.name || n1?.id || '',
        end: n2?.name || n2?.id || '',
        qx: dload?.direction === 'global' ? (dload.qxi || 0) : 0,
        qy: dload?.direction === 'global' ? (dload.qyi || 0) : 0,
      };
    }),
    nodalLoads: fLoads.map((l) => {
      const n = fNodes.find((node) => node.id === l.nodeId);
      return {
        node: n?.name || n?.id || '',
        fx: l.fx || 0,
        fy: l.fy || 0,
        moment: l.mz || 0,
      };
    }),
    pointLoads: [],
  };
}

const mainView = document.querySelector('#mainView');
const sidebar = document.querySelector('#sidebar');
const scrim = document.querySelector('#drawerScrim');

function icon(name, className = '') {
  return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.document}</svg>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function showToast(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message;
  toast.classList.add('visible');
  window.clearTimeout(state.toastTimer);
  state.toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 2600);
}

function setView(view, category = state.category) {
  state.view = view;
  state.category = category;
  state.menuOpen = false;
  render();
  mainView.focus({ preventScroll: true });
}

function renderSidebar() {
  const links = categories.map((item) => `
    <button class="side-link ${state.view === 'category' && state.category === item.id ? 'active' : ''}" type="button" data-action="open-category" data-category="${item.id}">
      <span class="small-icon">${icon(item.icon)}</span>${item.name}
    </button>`).join('');
  sidebar.innerHTML = `
    <p class="side-label">Seu caderno</p>
    <button class="side-link ${state.view === 'home' ? 'active' : ''}" type="button" data-action="go-home"><span class="small-icon">${icon('home')}</span>Início</button>
    <div class="side-divider"></div>
    <p class="side-label">Ferramentas de Cálculo</p>
    <button class="side-link ${state.view === 'calculator' && state.calcMode === 'binario' ? 'active' : ''}" type="button" data-action="open-binario"><span class="small-icon">${icon('structure')}</span>Cálculo por Binário</button>
    <button class="side-link ${state.view === 'canvas' ? 'active' : ''}" type="button" data-action="open-canvas"><span class="small-icon">${icon('pencil')}</span>Desenho Ftool (2D)</button>
    <button class="side-link ${state.view === 'calculator' && state.calcMode === 'reacoes' ? 'active' : ''}" type="button" data-action="open-calculator"><span class="small-icon">${icon('ruler')}</span>Modelar em Tabela</button>
    <div class="side-divider"></div>
    <p class="side-label">Disciplinas</p>
    ${links}
    <div class="side-divider"></div>
    <button class="side-link" type="button" data-action="show-about"><span class="small-icon">${icon('document')}</span>Sobre o protótipo</button>
    <p class="side-foot">Conteúdo de apoio aos estudos.<br>Confira sempre normas e especificações vigentes.</p>`;
  sidebar.classList.toggle('open', state.menuOpen);
  const appBody = document.querySelector('.app-body');
  if (appBody) appBody.classList.toggle('sidebar-closed', !state.menuOpen);
  scrim.classList.toggle('open', state.menuOpen);
}

function categoryTile(item) {
  return `<button class="category-tile" type="button" data-action="open-category" data-category="${item.id}">
    <span class="tile-icon">${icon(item.icon)}</span>
    <span><strong>${item.name}</strong><span class="tile-count">${item.count}</span></span>
  </button>`;
}

function renderHome() {
  const tiles = categories.filter((item) => ['estruturas', 'topografia', 'terraplenagem', 'muros', 'normas', 'solos'].includes(item.id));
  return `<div class="page-wrap home-layout">
    <section class="home-main">
      <div class="page-heading">
        <div><p class="eyebrow">Caderno digital · Engenharia Civil</p><h1>Estude. Desenhe. Entenda.</h1><p class="lede">Conceitos essenciais, normas de referência e ferramentas práticas para acompanhar seus estudos.</p></div>
        <div class="heading-actions"><button class="primary-button" type="button" data-action="open-structures">${icon('pencil')}Desenhar estrutura</button></div>
      </div>
      <label class="search-wrap">${icon('search')}<input id="contentSearch" type="search" placeholder="Pesquisar conteúdos..." autocomplete="off" aria-label="Pesquisar conteúdos"><span class="mobile-only">⌕</span></label>
      <div class="section-head"><h2>Disciplinas</h2><p>6 áreas em destaque</p></div>
      <div class="category-grid" id="categoryGrid">${tiles.map(categoryTile).join('')}</div>
      <section class="recent-section">
        <div class="section-head"><h2>Continue de onde parou</h2><button class="text-button" type="button" data-action="open-category" data-category="estruturas">Ver tudo</button></div>
        <div class="recent-list">
          <button class="recent-item" type="button" data-action="open-content" data-category="estruturas" data-index="1"><span class="recent-icon">${icon('structure')}</span><span><strong>Diagramas de esforços em pórticos</strong><small>Estruturas · Nós rígidos e rótulas</small></span>${icon('arrow')}</button>
          <button class="recent-item" type="button" data-action="open-category" data-category="normas"><span class="recent-icon">${icon('book')}</span><span><strong>NBR 13133 · Levantamentos</strong><small>Normas · Topografia</small></span>${icon('arrow')}</button>
        </div>
      </section>
    </section>
    <aside class="side-panel">
      <div class="welcome-card"><p class="eyebrow">Seu espaço de estudo</p><h2>Do campo ao projeto.</h2><p>Reúna fundamentos, cálculos e esboços em um só lugar.</p><button type="button" data-action="open-category" data-category="topografia">Explorar Topografia ${icon('arrow')}</button></div>
      <div class="mini-stat"><div class="mini-stat-head"><span>Trilha de estudos</span><strong>4 de 9 temas</strong></div><div class="progress-track"><span></span></div></div>
      <div class="tip-card"><p class="eyebrow">Nota técnica</p><p>Critérios como grau de compactação e umidade devem seguir o projeto e a especificação aplicável à obra.</p></div>
    </aside>
  </div>`;
}

function renderCategory() {
  const category = categories.find((item) => item.id === state.category) || categories[0];
  const cards = content[category.id] || [];
  const cardMarkup = cards.length ? cards.map((item, index) => `
    <article class="content-card" data-searchable="${escapeHtml(`${item[0]} ${item[1]} ${item[2].join(' ')}`.toLowerCase())}">
      <div class="content-card-top"><div><p class="eyebrow">${category.name} · Guia ${String(index + 1).padStart(2, '0')}</p><h3>${item[0]}</h3></div><span class="tile-icon">${icon(category.icon)}</span></div>
      <p>${item[1]}</p><div class="tag-row">${item[2].map((tag) => `<span class="tag">${tag}</span>`).join('')}</div>
      <button class="quiet-button card-open" type="button" data-action="open-content" data-category="${category.id}" data-index="${index}">Abrir resumo ${icon('arrow')}</button>
    </article>`).join('') : '<div class="empty-state">Os materiais desta área estão sendo organizados. Enquanto isso, explore Topografia, Terraplenagem, Estruturas e Muros.</div>';
  return `<div class="page-wrap">
    <nav class="breadcrumb"><button type="button" data-action="go-home">Início</button>${icon('arrow')}<span>${category.name}</span></nav>
    <div class="page-heading"><div><p class="eyebrow">Caderno de referência</p><h1>${category.name}</h1><p class="lede">${category.count} para apoiar a revisão dos conceitos e a resolução de exercícios.</p></div>
      <div class="heading-actions">${category.id === 'estruturas' ? '<button class="primary-button" type="button" data-action="open-structures">' + icon('pencil') + 'Desenhar</button>' : ''}</div>
    </div>
    ${category.id === 'normas' ? '<div class="analysis-panel" style="margin-bottom:16px"><strong>Uso responsável das referências</strong><p>Confira a edição vigente das normas e as especificações do contrato. Valores didáticos não substituem critérios definidos pelo projeto.</p></div>' : ''}
    <div class="content-grid" id="contentGrid">${cardMarkup}</div>
  </div>`;
}

function normalizeSearchText(value) {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function getSummarySections(categoryId, index, item) {
  if (categoryId === 'topografia') return topographyDetails[index] || [];
  const detailed = summaryExtras[categoryId]?.[index];
  if (detailed) return detailed;
  return [
    { kind: 'teoria', title: 'Conceito essencial', text: item[1] },
    { kind: 'aplicacao', title: 'Tópicos relacionados', text: `Use estes termos para orientar a revisão: ${item[2].join(', ')}. Confira hipóteses, unidades e critérios do projeto ao resolver exercícios.` },
  ];
}

function renderSummary() {
  const category = categories.find((item) => item.id === state.category) || categories[0];
  const item = (content[state.category] || [])[state.summaryIndex];
  if (!item) return renderCategory();
  const sections = getSummarySections(state.category, state.summaryIndex, item);
  const matchingSections = sections.map((section, originalIndex) => ({ ...section, originalIndex })).filter((section) => {
    const kindMatches = state.summaryKind === 'todos' || section.kind === state.summaryKind;
    const queryMatches = !state.summaryQuery || normalizeSearchText(`${section.title} ${section.text} ${section.kind} ${category.name}`)
      .includes(normalizeSearchText(state.summaryQuery));
    return kindMatches && queryMatches;
  });
  const kindLabels = { teoria: 'Teoria', calculo: 'Cálculo', verificacao: 'Verificação', norma: 'Norma', aplicacao: 'Aplicação' };
  return `<div class="page-wrap">
    <nav class="breadcrumb"><button type="button" data-action="go-home">Início</button>${icon('arrow')}<button type="button" data-action="open-category" data-category="${state.category}">${category.name}</button>${icon('arrow')}<span>Resumo</span></nav>
    <div class="page-heading"><div><p class="eyebrow">${category.name} · Resumo ${String(state.summaryIndex + 1).padStart(2, '0')}</p><h1>${item[0]}</h1><p class="lede">${item[1]}</p></div></div>
    <div class="summary-search-panel">
      <label class="search-wrap">${icon('search')}<input id="summarySearch" type="search" value="${escapeHtml(state.summaryQuery)}" placeholder="Buscar neste resumo: teoria, cálculo, fórmulas..." autocomplete="off" aria-label="Buscar dentro do resumo"></label>
      <label class="summary-kind-filter"><span>Mostrar</span><select id="summaryKind"><option value="todos" ${state.summaryKind === 'todos' ? 'selected' : ''}>Todos os tópicos</option><option value="teoria" ${state.summaryKind === 'teoria' ? 'selected' : ''}>Teoria</option><option value="calculo" ${state.summaryKind === 'calculo' ? 'selected' : ''}>Cálculos</option><option value="verificacao" ${state.summaryKind === 'verificacao' ? 'selected' : ''}>Verificações</option><option value="norma" ${state.summaryKind === 'norma' ? 'selected' : ''}>Normas</option><option value="aplicacao" ${state.summaryKind === 'aplicacao' ? 'selected' : ''}>Aplicações</option></select></label>
      <span class="summary-match-count" id="summaryMatchCount">${matchingSections.length} ${matchingSections.length === 1 ? 'tópico' : 'tópicos'}</span>
    </div>
    <div class="summary-sections" id="summarySections">${matchingSections.map((section, index) => `
      <article class="summary-block" data-summary-kind="${section.kind}" data-summary-search="${escapeHtml(normalizeSearchText(`${section.title} ${section.text} ${section.kind} ${category.name}`))}">
        <div class="summary-block-head"><span class="summary-number">${String(index + 1).padStart(2, '0')}</span><span class="tag">${kindLabels[section.kind] || 'Tópico'}</span></div>
        <h2>${section.title}</h2><p>${section.text}</p>
        <button class="quiet-button article-open" type="button" data-action="open-article" data-section-index="${section.originalIndex}">Abrir conteúdo completo ${icon('arrow')}</button>
      </article>`).join('') || '<div class="empty-state" id="summaryEmpty">Nenhum tópico corresponde a essa busca. Tente “teoria”, “cálculo”, “azimute” ou “nivelamento”.</div>'}</div>
    <div class="summary-footer"><button class="outline-button" type="button" data-action="open-category" data-category="${state.category}">${icon('back')}Voltar aos conteúdos</button>${state.category === 'estruturas' ? '<button class="primary-button" type="button" data-action="open-calculator">Modelar uma estrutura</button>' : ''}</div>
  </div>`;
}

function renderArticle() {
  const category = categories.find((item) => item.id === state.category) || categories[0];
  const item = (content[state.category] || [])[state.summaryIndex];
  const section = getSummarySections(state.category, state.summaryIndex, item || [])[state.articleIndex];
  if (!item || !section) return renderCategory();

  const lesson = fullLessons[section.title] || {
    intro: section.text,
    sections: [
      { title: 'Conceito central', text: section.text },
      { title: 'Como estudar este tópico', text: `Relacione o tema a ${item[0].toLowerCase()}. Identifique os dados conhecidos, declare as hipóteses, mantenha as unidades consistentes e confira o resultado com as condições do problema.` },
    ],
    caution: 'Confirme as hipóteses e os critérios aplicáveis ao exercício, projeto ou especificação vigente.',
  };
  const kindLabels = { teoria: 'Teoria', calculo: 'Cálculo', verificacao: 'Verificação', norma: 'Norma', aplicacao: 'Aplicação' };

  const formulasMarkup = lesson.formulas ? `
    <div class="article-formula-box">
      <span class="article-formula-title">Fórmulas e Relações Fundamentais</span>
      <div class="article-formula-content">${escapeHtml(lesson.formulas)}</div>
    </div>` : '';

  const stepByStepMarkup = lesson.stepByStep && lesson.stepByStep.length ? `
    <div class="article-step-list">
      <div class="section-subhead"><h3>Roteiro Passo a Passo de Resolução</h3></div>
      ${lesson.stepByStep.map((step, idx) => `
        <div class="article-step-item">
          <span class="step-badge">${idx + 1}</span>
          <div class="step-content">
            <strong>${escapeHtml(step.title)}</strong>
            <p>${escapeHtml(step.text)}</p>
          </div>
        </div>
      `).join('')}
    </div>` : '';

  const exampleMarkup = lesson.example ? `
    <div class="article-example-card">
      <span class="example-badge">Exemplo Prático Resolvido Passo a Passo</span>
      <h3>${escapeHtml(lesson.example.title)}</h3>
      <p>${escapeHtml(lesson.example.text)}</p>
    </div>` : '';

  const questionsMarkup = lesson.questions && lesson.questions.length ? `
    <section class="article-questions-section">
      <div class="questions-title">
        <div>
          <p class="eyebrow">Hora de Praticar</p>
          <h3>Questões Comentadas de Concursos</h3>
        </div>
        <span class="result-tag">${lesson.questions.length} ${lesson.questions.length === 1 ? 'questão' : 'questões'}</span>
      </div>
      <div class="questions-list">
        ${lesson.questions.map((q) => `
          <article class="question-card">
            <span class="question-banca">${escapeHtml(q.banca)}</span>
            <div class="question-prompt">${escapeHtml(q.prompt)}</div>
            ${q.options && q.options.length ? `
              <div class="question-options">
                ${q.options.map((opt) => `<div>${escapeHtml(opt)}</div>`).join('')}
              </div>
            ` : ''}
            <button class="quiz-toggle-btn" type="button" data-action="toggle-quiz-solution">
              ${icon('check')}
              <span>Ver Gabarito e Resolução Comentada</span>
            </button>
            <div class="quiz-solution-box" style="display:none;">
              <strong>Gabarito: ${escapeHtml(q.gabarito)}</strong>
              <div>${escapeHtml(q.solution)}</div>
            </div>
          </article>
        `).join('')}
      </div>
    </section>` : '';

  return `<div class="page-wrap article-page">
    <nav class="breadcrumb"><button type="button" data-action="go-home">Início</button>${icon('arrow')}<button type="button" data-action="open-category" data-category="${state.category}">${category.name}</button>${icon('arrow')}<button type="button" data-action="back-to-summary">${item[0]}</button>${icon('arrow')}<span>Conteúdo</span></nav>
    <div class="page-heading"><div><p class="eyebrow">${category.name} · ${kindLabels[section.kind] || 'Estudo'}</p><h1>${section.title}</h1><p class="lede">${lesson.intro}</p></div></div>
    <article class="article-sheet">
      ${formulasMarkup}
      ${lesson.sections.map((part, index) => `<section class="article-section"><div class="article-section-title"><span class="summary-number">${String(index + 1).padStart(2, '0')}</span><h2>${part.title}</h2></div><p>${part.text}</p></section>`).join('')}
      ${stepByStepMarkup}
      ${exampleMarkup}
      ${lesson.caution ? `<aside class="article-note"><strong>Atenção</strong><p>${lesson.caution}</p></aside>` : ''}
      ${questionsMarkup}
    </article>
    <div class="summary-footer"><button class="outline-button" type="button" data-action="back-to-summary">${icon('back')}Voltar ao resumo</button><button class="primary-button" type="button" data-action="open-category" data-category="${state.category}">Ver outros tópicos</button></div>
  </div>`;
}

function filterSummarySections() {
  const query = normalizeSearchText(document.querySelector('#summarySearch')?.value || '');
  const kind = document.querySelector('#summaryKind')?.value || 'todos';
  const blocks = [...document.querySelectorAll('[data-summary-kind]')];
  let visible = 0;
  for (const block of blocks) {
    const matches = (kind === 'todos' || block.dataset.summaryKind === kind) && block.dataset.summarySearch.includes(query);
    block.hidden = !matches;
    if (matches) visible += 1;
  }
  const count = document.querySelector('#summaryMatchCount');
  if (count) count.textContent = `${visible} ${visible === 1 ? 'tópico' : 'tópicos'}`;
  const empty = document.querySelector('#summaryEmpty');
  if (empty) empty.hidden = visible > 0;
  else if (visible === 0 && !document.querySelector('#summaryEmpty')) {
    document.querySelector('#summarySections')?.insertAdjacentHTML('beforeend', '<div class="empty-state" id="summaryEmpty">Nenhum tópico corresponde a essa busca. Tente “teoria”, “cálculo”, “azimute” ou “nivelamento”.</div>');
  }
}

function renderStructures() {
  return `<div class="page-wrap">
    <nav class="breadcrumb"><button type="button" data-action="go-home">Início</button>${icon('arrow')}<span>Estruturas</span></nav>
    <div class="page-heading"><div><p class="eyebrow">Ferramentas de estruturas</p><h1>Escolha como começar</h1><p class="lede">Calcule estruturas pelo método de binário e reações, desenhe diretamente no canvas com estilo Ftool ou envie uma foto de referência.</p></div></div>
    <div class="structure-options structure-options-three">
      <button class="option-card" type="button" data-action="open-binario"><span class="option-icon">${icon('structure')}</span><h2>Cálculo por Binário</h2><p>Memória de cálculo analítica detalhada com linha de raciocínio passo a passo e reações</p></button>
      <button class="option-card" type="button" data-action="open-canvas"><span class="option-icon">${icon('pencil')}</span><h2>Desenho Interativo (Ftool 2D)</h2><p>Grelha, snap magnético, apoios, cargas e diagramas N, V, M instantâneos</p></button>
      <button class="option-card" type="button" data-action="open-upload"><span class="option-icon">${icon('camera')}</span><h2>Foto e cálculo</h2><p>Use a imagem como referência do modelo</p></button>
    </div>
  </div>`;
}

function renderCanvas() {
  return `<div class="page-wrap" style="width:min(1240px, 100%);">
    <nav class="breadcrumb"><button type="button" data-action="go-home">Início</button>${icon('arrow')}<button type="button" data-action="open-structures">Estruturas</button>${icon('arrow')}<span>Módulo Ftool Interativo</span></nav>
    <div class="page-heading">
      <div>
        <p class="eyebrow">Análise Computacional de Estruturas Planas</p>
        <h1>Desenho Interativo estilo Ftool</h1>
        <p class="lede">Grelha configurável com atração magnética (snap), ferramentas de inserção de nós e barras (com Shift para travar a 0°, 45° e 90°), linhas de cota, condições de apoio (1ª e 2ª ordem, engaste e molas), rótulas, cargas e cálculo de diagramas (N, V, M) e deformada.</p>
      </div>
      <div class="heading-actions">
        <button class="primary-button" type="button" data-action="sync-ftool-to-binario" title="Calcular a estrutura desenhada e abrir a Memória de Cálculo por Binário">${icon('structure')}Ver por Binário</button>
        <button class="outline-button" type="button" data-action="sync-ftool-to-table" title="Preencher o modelo de formulário com a estrutura desenhada">Preencher Tabela</button>
        <button class="outline-button" type="button" data-action="open-structures">Voltar</button>
      </div>
    </div>
    <div id="ftoolStudioMount"></div>
  </div>`;
}

function renderUpload() {
  return `<div class="page-wrap">
    <nav class="breadcrumb"><button type="button" data-action="go-home">Início</button>${icon('arrow')}<button type="button" data-action="open-structures">Estruturas</button>${icon('arrow')}<span>Enviar foto</span></nav>
    <div class="page-heading"><div><p class="eyebrow">Registro visual</p><h1>Enviar foto</h1><p class="lede">Carregue uma imagem como referência e depois confirme geometria, vínculos e ações no modelo de cálculo.</p></div><div class="heading-actions"><button class="outline-button" type="button" data-action="open-structures">Voltar</button></div></div>
    <div class="upload-layout">
      <section class="upload-main">
        <label class="upload-drop" id="uploadDrop" for="galleryInput"><span class="option-icon">${icon('image')}</span><strong>Toque para escolher uma imagem</strong><small>JPG ou PNG · arraste o arquivo até aqui</small></label>
        <input class="visually-hidden" id="galleryInput" type="file" accept="image/png,image/jpeg,image/webp" />
        <input class="visually-hidden" id="cameraInput" type="file" accept="image/*" capture="environment" />
        <div class="file-actions"><button class="primary-button" type="button" data-action="open-camera">${icon('camera')}Câmera</button><button class="outline-button" type="button" data-action="open-gallery">${icon('image')}Galeria</button></div>
      </section>
      <aside class="preview-card"><h3>Pré-visualização</h3><div class="image-preview" id="imagePreview"><div class="image-placeholder">${icon('image')}<span>Nenhuma imagem selecionada</span></div></div><p class="preview-meta" id="previewMeta">JPG / PNG / WEBP</p><div class="analysis-panel" id="analysisPanel"><strong>Como o cálculo funciona</strong><p>A imagem não fornece escala e condições de apoio por si só. Confira e transcreva os dados antes de resolver.</p></div><button class="primary-button" style="width:100%;margin-top:12px" type="button" data-action="continue-to-calculation" id="continueCalculation" disabled>${icon('structure')}Confirmar modelo e calcular</button></aside>
    </div>
  </div>`;
}

function renderAbout() {
  return `<div class="page-wrap"><nav class="breadcrumb"><button type="button" data-action="go-home">Início</button>${icon('arrow')}<span>Sobre</span></nav><div class="page-heading"><div><p class="eyebrow">EngCivil</p><h1>Um caderno para aprender</h1><p class="lede">Protótipo interativo para estudar fundamentos de Engenharia Civil e registrar ideias de projeto.</p></div></div><div class="content-grid"><article class="content-card"><h3>Referências de estudo</h3><p>Os resumos não substituem as normas completas, o projeto executivo ou a avaliação de profissional habilitado.</p><div class="tag-row"><span class="tag">NBR 13133</span><span class="tag">NBR 5681</span><span class="tag">DNIT</span><span class="tag">NBR 11682</span></div></article><article class="content-card"><h3>Desenhos e imagens</h3><p>Os esboços e pré-análises deste protótipo são ferramentas de anotação. Não fazem verificação estrutural automática nem laudo técnico.</p></article></div></div>`;
}

function render() {
  renderSidebar();
  mainView.innerHTML = state.view === 'home' ? renderHome()
    : state.view === 'category' ? renderCategory()
    : state.view === 'summary' ? renderSummary()
    : state.view === 'article' ? renderArticle()
    : state.view === 'structures' ? renderStructures()
    : state.view === 'canvas' ? renderCanvas()
    : state.view === 'upload' ? renderUpload()
    : state.view === 'calculator' ? renderCalculationView(state.calculationModel, state.imageUrl, state.calculationResults, state.calculationError, state.calcMode)
    : renderAbout();
  if (state.view === 'canvas') setupCanvas();
  if (state.view === 'upload') setupUpload();
}

function setupCanvas() {
  const mount = document.querySelector('#ftoolStudioMount');
  if (!mount) return;
  state.ftoolApp = new FtoolCanvasApp(mount, {
    onModelChange: (model, results) => {
      // Model updated
    },
  });
}


function setupUpload() {
  const galleryInput = document.querySelector('#galleryInput');
  const cameraInput = document.querySelector('#cameraInput');
  const drop = document.querySelector('#uploadDrop');
  const selectFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Escolha um arquivo de imagem.');
      return;
    }
    if (state.imageUrl) URL.revokeObjectURL(state.imageUrl);
    state.imageUrl = URL.createObjectURL(file);
    document.querySelector('#imagePreview').innerHTML = `<img src="${state.imageUrl}" alt="Imagem selecionada para revisão">`;
    document.querySelector('#previewMeta').textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB`;
    document.querySelector('#analysisPanel').innerHTML = '<strong>Imagem pronta</strong><p>Transcreva as dimensões, vínculos e cargas visíveis para obter resultados coerentes.</p>';
    document.querySelector('#continueCalculation').disabled = false;
  };
  galleryInput.addEventListener('change', () => selectFile(galleryInput.files?.[0]));
  cameraInput.addEventListener('change', () => selectFile(cameraInput.files?.[0]));
  drop.addEventListener('dragover', (event) => { event.preventDefault(); drop.classList.add('dragover'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('dragover'));
  drop.addEventListener('drop', (event) => {
    event.preventDefault();
    drop.classList.remove('dragover');
    selectFile(event.dataTransfer?.files?.[0]);
  });
}

function saveCalculationModelFromForm() {
  const form = document.querySelector('#modelForm');
  if (form) state.calculationModel = readCalculationModel(form);
  return state.calculationModel;
}

function addModelRow(action) {
  const model = saveCalculationModelFromForm();
  if (action === 'add-node') {
    let index = model.nodes.length + 1;
    let name = `N${index}`;
    while (model.nodes.some((node) => node.name === name)) name = `N${++index}`;
    const maxX = Math.max(0, ...model.nodes.map((node) => Number(node.x) || 0));
    model.nodes.push({ name, x: maxX + 1, y: 0, joint: 'rigido', support: 'none', reactionAngle: 90 });
  } else if (action === 'add-bar') {
    if (model.nodes.length < 2) return showToast('Adicione pelo menos dois nós antes da barra.');
    let index = model.bars.length + 1;
    let name = `B${index}`;
    while (model.bars.some((bar) => bar.name === name)) name = `B${++index}`;
    model.bars.push({ name, start: model.nodes[0].name, end: model.nodes.at(-1).name, qx: 0, qy: 0 });
  } else if (action === 'add-nodal-load') {
    if (!model.nodes.length) return showToast('Adicione um nó antes da carga.');
    model.nodalLoads.push({ node: model.nodes[0].name, fx: 0, fy: 0, moment: 0 });
  } else if (action === 'add-point-load') {
    if (!model.bars.length) return showToast('Adicione uma barra antes da carga.');
    model.pointLoads.push({ bar: model.bars[0].name, position: 0, fx: 0, fy: 0 });
  }
  state.calculationModel = model;
  state.calculationResults = null;
  state.calculationError = '';
  render();
}

function calculateCurrentModel() {
  const model = saveCalculationModelFromForm();
  state.calculationModel = model;
  try {
    state.calculationResults = calculateFrame(model);
    state.calculationError = '';
    render();
    window.setTimeout(() => document.querySelector('#calculationResults')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  } catch (error) {
    state.calculationResults = null;
    state.calculationError = error instanceof Error ? error.message : 'Erro inesperado ao montar o modelo.';
    render();
  }
}

function extractModelFromFtool() {
  if (!state.ftoolApp) return null;
  const fNodes = state.ftoolApp.nodes;
  const fMembers = state.ftoolApp.members;
  const fLoads = state.ftoolApp.nodalLoads;
  if (!fNodes || fNodes.length === 0) return null;
  return {
    nodes: fNodes.map((n) => ({
      name: n.name || n.id,
      x: n.x,
      y: n.y,
      joint: 'rigido',
      support: n.support?.fixX && n.support?.fixY && n.support?.fixRz ? 'engaste'
        : n.support?.fixX && n.support?.fixY ? 'articulado'
        : n.support?.fixY ? 'rolete'
        : 'none',
      reactionAngle: 90,
    })),
    bars: fMembers.map((m) => {
      const n1 = fNodes.find((n) => n.id === m.startNodeId);
      const n2 = fNodes.find((n) => n.id === m.endNodeId);
      const dload = m.distributedLoads?.[0];
      return {
        name: m.name || m.id,
        start: n1?.name || n1?.id || '',
        end: n2?.name || n2?.id || '',
        qx: dload?.direction === 'global' ? (dload.qxi || 0) : 0,
        qy: dload?.direction === 'global' ? (dload.qyi || 0) : 0,
      };
    }),
    nodalLoads: fLoads.map((l) => {
      const n = fNodes.find((node) => node.id === l.nodeId);
      return {
        node: n?.name || n?.id || '',
        fx: l.fx || 0,
        fy: l.fy || 0,
        moment: l.mz || 0,
      };
    }),
    pointLoads: [],
  };
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  if (action === 'toggle-menu') { state.menuOpen = !state.menuOpen; renderSidebar(); }
  if (action === 'close-menu') { state.menuOpen = false; renderSidebar(); }
  if (action === 'go-home') setView('home');
  if (action === 'open-category') setView('category', button.dataset.category);
  if (action === 'open-structures') setView('structures');
  if (action === 'open-canvas') setView('canvas');
  if (action === 'open-upload') setView('upload');
  if (action === 'open-calculator') {
    state.calculationModel = createDemoModel();
    state.calcMode = 'reacoes';
    try {
      state.calculationResults = calculateFrame(state.calculationModel);
      state.calculationError = '';
    } catch {
      state.calculationResults = null;
    }
    setView('calculator');
  }
  if (action === 'open-binario') {
    state.calculationModel = createDemoModel();
    state.calcMode = 'binario';
    try {
      state.calculationResults = calculateFrame(state.calculationModel);
      state.calculationError = '';
    } catch {
      state.calculationResults = null;
    }
    setView('calculator');
    window.setTimeout(() => document.querySelector('#calculationResults')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }
  if (action === 'continue-to-calculation') {
    if (!state.imageUrl) return showToast('Selecione uma foto antes de continuar.');
    state.calculationModel = createDemoModel();
    state.calcMode = 'binario';
    try {
      state.calculationResults = calculateFrame(state.calculationModel);
      state.calculationError = '';
    } catch {
      state.calculationResults = null;
    }
    setView('calculator');
  }
  if (['add-node', 'add-bar', 'add-nodal-load', 'add-point-load'].includes(action)) addModelRow(action);
  if (action === 'calculate-frame') calculateCurrentModel();
  if (action === 'set-calc-mode') {
    state.calcMode = button.dataset.mode;
    render();
  }
  if (action === 'toggle-quiz-solution') {
    const box = button.nextElementSibling;
    if (box) {
      const isHidden = box.style.display === 'none';
      box.style.display = isHidden ? 'block' : 'none';
      const label = button.querySelector('span');
      if (label) label.textContent = isHidden ? 'Ocultar Resolução' : 'Ver Gabarito e Resolução Comentada';
    }
  }
  if (action === 'show-about') setView('about');
  if (action === 'open-content') {
    state.summaryIndex = Number(button.dataset.index);
    state.summaryQuery = '';
    state.summaryKind = 'todos';
    setView('summary', button.dataset.category);
  }
  if (action === 'open-article') {
    state.articleIndex = Number(button.dataset.sectionIndex);
    setView('article', state.category);
  }
  if (action === 'back-to-summary') setView('summary', state.category);
  if (action === 'sync-ftool-to-table') {
    const model = extractModelFromFtool();
    if (!model) {
      showToast('Desenhe a estrutura no Ftool antes de transferir.');
      return;
    }
    state.calculationModel = model;
    state.calcMode = 'reacoes';
    try {
      state.calculationResults = calculateFrame(model);
      state.calculationError = '';
    } catch (e) {
      state.calculationResults = null;
      state.calculationError = e instanceof Error ? e.message : 'Erro ao calcular a estrutura.';
    }
    setView('calculator');
    showToast('Estrutura transferida para o modelo de tabela!');
  }
  if (action === 'sync-ftool-to-binario') {
    const model = extractModelFromFtool();
    if (!model) {
      showToast('Desenhe a estrutura no Ftool antes de transferir.');
      return;
    }
    state.calculationModel = model;
    state.calcMode = 'binario';
    try {
      state.calculationResults = calculateFrame(model);
      state.calculationError = '';
    } catch (e) {
      state.calculationResults = null;
      state.calculationError = e instanceof Error ? e.message : 'Erro ao calcular a estrutura.';
    }
    setView('calculator');
    showToast('Calculado pelo Método dos Binários!');
    window.setTimeout(() => document.querySelector('#calculationResults')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }
  if (action === 'open-gallery') document.querySelector('#galleryInput')?.click();
  if (action === 'open-camera') document.querySelector('#cameraInput')?.click();
  if (action === 'analyze-image') {
    document.querySelector('#analysisPanel').innerHTML = '<strong>Revisão visual preparada</strong><p>Use esta imagem como registro de estudo. O protótipo não interpreta esforços, estabilidade ou segurança estrutural.</p>';
    showToast('Imagem pronta para revisão de estudo.');
  }
});

document.addEventListener('input', (event) => {
  if (event.target.id === 'summarySearch') {
    state.summaryQuery = event.target.value;
    filterSummarySections();
    return;
  }
  if (event.target.id !== 'contentSearch') return;
  const query = event.target.value.trim().toLocaleLowerCase('pt-BR');
  const grid = document.querySelector('#categoryGrid');
  if (grid) {
    const matches = categories.filter((item) => `${item.name} ${item.count}`.toLocaleLowerCase('pt-BR').includes(query));
    grid.innerHTML = matches.length ? matches.map(categoryTile).join('') : '<div class="empty-state">Nenhuma disciplina encontrada.</div>';
  }
});

document.addEventListener('change', (event) => {
  if (event.target.id !== 'summaryKind') return;
  state.summaryKind = event.target.value;
  filterSummarySections();
});

render();

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}