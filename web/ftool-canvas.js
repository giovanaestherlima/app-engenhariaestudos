import { FtoolSolver } from '../src/FtoolSolver.ts';

// Preset Materials
export const PRESET_MATERIALS = [
  { id: 'mat_steel', name: 'Aço Estrutural (E=205 GPa)', E: 205e6, gamma: 78.5, alpha: 1.2e-5 },
  { id: 'mat_concrete', name: 'Concreto Armado (E=25 GPa)', E: 25e6, gamma: 25.0, alpha: 1.0e-5 },
  { id: 'mat_aluminum', name: 'Alumínio (E=70 GPa)', E: 70e6, gamma: 27.0, alpha: 2.3e-5 },
  { id: 'mat_generic', name: 'Genérico Isotrópico', E: 200e6, gamma: 25.0, alpha: 1.0e-5 },
];

// Preset Sections
export const PRESET_SECTIONS = [
  { id: 'sec_rect_20x30', name: 'Retangular 20x30 cm', type: 'rectangle', width: 0.20, height: 0.30, A: 0.06, I: 0.00045 },
  { id: 'sec_rect_25x40', name: 'Retangular 25x40 cm', type: 'rectangle', width: 0.25, height: 0.40, A: 0.10, I: 0.001333 },
  { id: 'sec_circ_25', name: 'Circular Ø 25 cm', type: 'circle', width: 0.25, height: 0.25, A: Math.PI * 0.25 * 0.25 / 4, I: Math.PI * Math.pow(0.25, 4) / 64 },
  { id: 'sec_i_beam', name: 'Perfil I 200x100', type: 'i-beam', width: 0.10, height: 0.20, A: 0.0028, I: 0.000018 },
  { id: 'sec_generic', name: 'Genérica (A=0.05m², I=0.001m⁴)', type: 'generic', width: 0.20, height: 0.20, A: 0.05, I: 0.001 },
];

export class FtoolCanvasApp {
  constructor(container, options = {}) {
    this.container = container;
    this.onModelChange = options.onModelChange || (() => {});

    // Model data
    this.nodes = [];
    this.members = [];
    this.materials = [...PRESET_MATERIALS];
    this.sections = [...PRESET_SECTIONS];
    this.nodalLoads = [];
    this.dimensionLines = [];

    // Current state
    this.currentMode = 'edit'; // 'edit', 'diagramN', 'diagramV', 'diagramM', 'deformed'
    this.activeTool = 'select'; // 'select', 'node', 'member', 'dimension', 'delete', 'pan'
    this.selectedEntity = null; // { type: 'node'|'member'|'dim', id: string }
    this.currentTab = 'supports'; // 'supports', 'releases', 'materials', 'loads'

    // Precision & Grid
    this.grid = {
      visible: true,
      snap: true,
      stepX: 1.0,
      stepY: 1.0,
    };

    // View Transformation (Model meters -> Screen pixels)
    // Screen X = originX + modelX * scale
    // Screen Y = originY - modelY * scale (Y points UP in model coordinates)
    this.view = {
      originX: 200,
      originY: 360,
      scale: 60, // pixels per meter
      isPanning: false,
      lastPanX: 0,
      lastPanY: 0,
    };

    // Result Scale
    this.resultScale = 1.0;
    this.solverResults = null;
    this.solverError = null;

    // Interactive Drawing Drafts
    this.memberDraft = null; // { startNodeId, startPoint, currentPoint }
    this.dimDraft = null; // { step: 1|2, p1, p2, currentPoint }
    this.mouseModelCoords = { x: 0, y: 0 };
    this.shiftPressed = false;
    this.hoverInfo = null;

    // History for Undo / Redo
    this.history = [];
    this.historyIndex = -1;

    this.initDOM();
    this.setupEvents();
    this.loadDemoModel();
    this.pushHistory();
    this.autoFitView();
    this.solve();
    this.render();
  }

  pushHistory() {
    const snapshot = JSON.stringify({
      nodes: this.nodes,
      members: this.members,
      nodalLoads: this.nodalLoads,
      dimensionLines: this.dimensionLines,
    });
    // Remove future history if at index
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    this.history.push(snapshot);
    if (this.history.length > 30) this.history.shift();
    this.historyIndex = this.history.length - 1;
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      const data = JSON.parse(this.history[this.historyIndex]);
      this.nodes = data.nodes;
      this.members = data.members;
      this.nodalLoads = data.nodalLoads;
      this.dimensionLines = data.dimensionLines;
      this.selectedEntity = null;
      this.solve();
      this.render();
      this.updateRightPanel();
    }
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      const data = JSON.parse(this.history[this.historyIndex]);
      this.nodes = data.nodes;
      this.members = data.members;
      this.nodalLoads = data.nodalLoads;
      this.dimensionLines = data.dimensionLines;
      this.selectedEntity = null;
      this.solve();
      this.render();
      this.updateRightPanel();
    }
  }

  loadDemoModel() {
    // Classic Portal Frame with cantilever
    this.nodes = [
      { id: 'N1', name: 'A', x: 0, y: 0, support: { fixX: true, fixY: true } },
      { id: 'N2', name: 'B', x: 0, y: 3 },
      { id: 'N3', name: 'C', x: 4, y: 3 },
      { id: 'N4', name: 'D', x: 4, y: 0, support: { fixY: true } },
      { id: 'N5', name: 'E', x: 6, y: 3 },
    ];
    this.members = [
      { id: 'M1', name: 'AB', startNodeId: 'N1', endNodeId: 'N2', release: 'none', distributedLoads: [] },
      { id: 'M2', name: 'BC', startNodeId: 'N2', endNodeId: 'N3', release: 'none', distributedLoads: [{ direction: 'global', qxi: 0, qyi: -15, qxj: 0, qyj: -15 }] },
      { id: 'M3', name: 'CD', startNodeId: 'N3', endNodeId: 'N4', release: 'none', distributedLoads: [] },
      { id: 'M4', name: 'CE', startNodeId: 'N3', endNodeId: 'N5', release: 'none', distributedLoads: [{ direction: 'global', qxi: 0, qyi: -10, qxj: 0, qyj: -10 }] },
    ];
    this.nodalLoads = [
      { nodeId: 'N2', fx: 12, fy: 0, mz: 0 },
    ];
    this.dimensionLines = [
      { id: 'D1', p1: { x: 0, y: 0 }, p2: { x: 4, y: 0 }, offset: -0.8, length: 4.0 },
      { id: 'D2', p1: { x: 4, y: 0 }, p2: { x: 6, y: 0 }, offset: -0.8, length: 2.0 },
      { id: 'D3', p1: { x: 0, y: 0 }, p2: { x: 0, y: 3 }, offset: -0.8, length: 3.0 },
    ];
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="ftool-page">
        <!-- Top Toolbar -->
        <div class="ftool-topbar">
          <div class="ftool-modes">
            <button type="button" class="ftool-mode-btn ${this.currentMode === 'edit' ? 'active' : ''}" data-mode="edit" title="Modo Edição da Estrutura">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              <span>Estrutura</span>
            </button>
            <button type="button" class="ftool-mode-btn result-mode ${this.currentMode === 'diagramN' ? 'active' : ''}" data-mode="diagramN" title="Esforço Normal (N)">
              <span>Normal [N]</span>
            </button>
            <button type="button" class="ftool-mode-btn result-mode ${this.currentMode === 'diagramV' ? 'active' : ''}" data-mode="diagramV" title="Esforço Cortante (V)">
              <span>Cortante [V]</span>
            </button>
            <button type="button" class="ftool-mode-btn result-mode ${this.currentMode === 'diagramM' ? 'active' : ''}" data-mode="diagramM" title="Momento Fletor (M)">
              <span>Momento [M]</span>
            </button>
            <button type="button" class="ftool-mode-btn result-mode ${this.currentMode === 'deformed' ? 'active' : ''}" data-mode="deformed" title="Configuração Deformada">
              <span>Deformada</span>
            </button>
          </div>

          <div class="ftool-actions">
            <div class="ftool-scale-ctrl" title="Escala gráfica dos diagramas e da deformada">
              <span>Escala:</span>
              <input type="range" id="ftoolScaleSlider" min="0.2" max="4.0" step="0.1" value="1.0" />
              <span id="ftoolScaleVal">1.0x</span>
            </div>
            <button type="button" class="primary-button compact-button" id="ftoolSolveBtn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              <span>Calcular</span>
            </button>
            <button type="button" class="primary-button compact-button" data-action="sync-ftool-to-binario" title="Calcular estrutura pelo Método dos Binários com memória passo a passo">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
              <span>Ver por Binário</span>
            </button>
            <button type="button" class="outline-button compact-button" id="ftoolFitBtn" title="Ajustar visualização à tela">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35M11 8v6M8 11h6"/></svg>
              <span>Ajustar Zoom</span>
            </button>
            <button type="button" class="outline-button compact-button" id="ftoolExportImgBtn" title="Exportar imagem do modelo ou diagrama">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              <span>Exportar PNG</span>
            </button>
          </div>
        </div>

        <!-- Studio Main Workspace -->
        <div class="ftool-studio-layout">
          <!-- Left Tool Palette (Ftool Edit Menu) -->
          <div class="ftool-toolbar-left">
            <button type="button" class="ftool-tool-btn ${this.activeTool === 'select' ? 'active' : ''}" data-tool="select" title="Selecionar objetos (nós, barras, cotas)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m3 3 7 18 3-7 7-3L3 3z"/></svg>
            </button>
            <button type="button" class="ftool-tool-btn ${this.activeTool === 'node' ? 'active' : ''}" data-tool="node" title="Inserir Nó (clique no grid ou use o Modo Teclado)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="5" fill="currentColor"/></svg>
            </button>
            <button type="button" class="ftool-tool-btn ${this.activeTool === 'member' ? 'active' : ''}" data-tool="member" title="Inserir Barra (clique em 2 nós. Segure Shift para travar em horizontal/vertical/45°)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="5" y1="19" x2="19" y2="5"/><circle cx="5" cy="19" r="2.5" fill="currentColor"/><circle cx="19" cy="5" r="2.5" fill="currentColor"/></svg>
            </button>
            <button type="button" class="ftool-tool-btn ${this.activeTool === 'dimension' ? 'active' : ''}" data-tool="dimension" title="Linha de Cota (3 cliques: início, fim e afastamento)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 20h16M4 4h16M8 8v8M16 8v8M4 12h16"/></svg>
            </button>

            <div class="ftool-tool-divider"></div>

            <button type="button" class="ftool-tool-btn" id="ftoolKeyboardBtn" title="Modo Teclado: inserir nó ou barra por coordenadas exatas">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M7 16h10"/></svg>
            </button>

            <button type="button" class="ftool-tool-btn" id="ftoolDeleteBtn" title="Excluir elemento selecionado (Del)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>

            <div class="ftool-tool-divider"></div>

            <button type="button" class="ftool-tool-btn" id="ftoolUndoBtn" title="Desfazer (Ctrl+Z)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 14 4 9l5-5M4 9h9a6 6 0 0 1 0 12h-2"/></svg>
            </button>
            <button type="button" class="ftool-tool-btn" id="ftoolRedoBtn" title="Refazer (Ctrl+Y)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m15 14 5-5-5-5m5 5h-9a6 6 0 0 0 0 12h2"/></svg>
            </button>

            <div class="ftool-tool-divider"></div>

            <button type="button" class="ftool-tool-btn" id="ftoolClearAllBtn" title="Novo Modelo (Limpar)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3v18M3 12h18"/></svg>
            </button>
          </div>

          <!-- Central Canvas Viewport -->
          <div class="ftool-viewport" id="ftoolViewport">
            <!-- HUD Top: Grid & Snap controls -->
            <div class="ftool-hud-top">
              <div class="ftool-hud-grid">
                <label>
                  <input type="checkbox" id="ftoolGridCheck" ${this.grid.visible ? 'checked' : ''} />
                  <span>Grid</span>
                </label>
                <label>
                  <input type="checkbox" id="ftoolSnapCheck" ${this.grid.snap ? 'checked' : ''} />
                  <span>Snap</span>
                </label>
                <span>Passo:</span>
                <input type="number" class="ftool-grid-input" id="ftoolGridStepX" value="${this.grid.stepX}" step="0.25" min="0.1" title="Espaçamento X (m)" />
                <span>m</span>
              </div>
            </div>

            <!-- Canvas Element -->
            <canvas id="ftoolCanvas"></canvas>

            <!-- Real-time Coordinate & Hint Readout -->
            <div class="ftool-hud-coords" id="ftoolCoords">
              X: 0.00 m | Y: 0.00 m | L: 0.00 m
            </div>

            <!-- Navigation Controls (Zoom / Pan) -->
            <div class="ftool-hud-controls">
              <button type="button" class="ftool-hud-btn" id="ftoolZoomInBtn" title="Aumentar Zoom (+)">+</button>
              <button type="button" class="ftool-hud-btn" id="ftoolZoomOutBtn" title="Reduzir Zoom (-)">-</button>
              <button type="button" class="ftool-hud-btn" id="ftoolPanModeBtn" title="Modo Pan / Arrastar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M19 9l3 3-3 3M9 19l3 3 3-3M2 12h20M12 2v20"/></svg>
              </button>
            </div>

            <!-- Dynamic Tooltip Inspector for Results -->
            <div class="ftool-inspector-tooltip" id="ftoolInspector"></div>
          </div>

          <!-- Right Properties & Attributes Panel -->
          <div class="ftool-panel-right">
            <div class="ftool-panel-tabs">
              <button type="button" class="ftool-tab-btn ${this.currentTab === 'supports' ? 'active' : ''}" data-tab="supports">Apoios</button>
              <button type="button" class="ftool-tab-btn ${this.currentTab === 'releases' ? 'active' : ''}" data-tab="releases">Rótulas</button>
              <button type="button" class="ftool-tab-btn ${this.currentTab === 'materials' ? 'active' : ''}" data-tab="materials">Material</button>
              <button type="button" class="ftool-tab-btn ${this.currentTab === 'loads' ? 'active' : ''}" data-tab="loads">Cargas</button>
            </div>

            <div class="ftool-tab-content" id="ftoolTabContent">
              <!-- Content rendered dynamically by updateRightPanel -->
            </div>
          </div>
        </div>

        <!-- Student Results Summary Card (Below Studio) -->
        <div class="ftool-results-summary" id="ftoolResultsSummary">
          <!-- Rendered dynamically -->
        </div>

        <!-- Keyboard Mode Modal Dialog -->
        <div class="ftool-modal-scrim" id="ftoolKeyboardModal" style="display:none;">
          <div class="ftool-modal">
            <div class="ftool-modal-header">
              <strong>Modo Teclado (Inserção Numérica)</strong>
              <button type="button" class="icon-button" id="ftoolCloseModalBtn" style="color:#fff;">✕</button>
            </div>
            <div class="ftool-modal-body">
              <div class="ftool-form-row">
                <label>Tipo de Elemento:</label>
                <select class="ftool-select" id="ftoolKbType">
                  <option value="node">Inserir Nó (X, Y)</option>
                  <option value="member">Inserir Barra por Nós (Nó A → Nó B)</option>
                </select>
              </div>

              <div id="ftoolKbNodeFields">
                <div class="ftool-form-row">
                  <label>Coordenada X (m):</label>
                  <input type="number" class="ftool-input" id="ftoolKbX" step="0.5" value="0.0" />
                </div>
                <div class="ftool-form-row">
                  <label>Coordenada Y (m):</label>
                  <input type="number" class="ftool-input" id="ftoolKbY" step="0.5" value="0.0" />
                </div>
              </div>

              <div id="ftoolKbMemberFields" style="display:none;">
                <div class="ftool-form-row">
                  <label>Nó Inicial:</label>
                  <select class="ftool-select" id="ftoolKbStartNode"></select>
                </div>
                <div class="ftool-form-row">
                  <label>Nó Final:</label>
                  <select class="ftool-select" id="ftoolKbEndNode"></select>
                </div>
              </div>
            </div>
            <div class="ftool-modal-footer">
              <button type="button" class="outline-button compact-button" id="ftoolKbCancelBtn">Cancelar</button>
              <button type="button" class="primary-button compact-button" id="ftoolKbConfirmBtn">Inserir</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.canvas = this.container.querySelector('#ftoolCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.coordsEl = this.container.querySelector('#ftoolCoords');
    this.inspectorEl = this.container.querySelector('#ftoolInspector');
    this.resizeCanvas();
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Model meters -> Screen pixels
  toScreen(mx, my) {
    return {
      x: this.view.originX + mx * this.view.scale,
      y: this.view.originY - my * this.view.scale,
    };
  }

  // Screen pixels -> Model meters
  toModel(sx, sy) {
    return {
      x: (sx - this.view.originX) / this.view.scale,
      y: (this.view.originY - sy) / this.view.scale,
    };
  }

  snapToGrid(mx, my) {
    if (!this.grid.snap) return { x: mx, y: my };
    // First, check snap to existing node within tolerance
    const nodeSnapDist = 12 / this.view.scale; // 12 pixels
    for (const node of this.nodes) {
      if (Math.hypot(node.x - mx, node.y - my) <= nodeSnapDist) {
        return { x: node.x, y: node.y, snappedNode: node };
      }
    }
    // Snap to grid increments
    const stepX = this.grid.stepX || 1.0;
    const stepY = this.grid.stepY || 1.0;
    const sx = Math.round(mx / stepX) * stepX;
    const sy = Math.round(my / stepY) * stepY;
    return { x: Number(sx.toFixed(4)), y: Number(sy.toFixed(4)) };
  }

  setupEvents() {
    window.addEventListener('resize', () => {
      this.resizeCanvas();
      this.render();
    });

    // Keyboard modifier tracking (Shift for 0, 90, 45 degree constraint)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Shift') {
        this.shiftPressed = true;
        this.render();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // If not in input field
        if (!['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
          this.deleteSelected();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        this.undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        this.redo();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'Shift') {
        this.shiftPressed = false;
        this.render();
      }
    });

    // Toolbar mode buttons
    this.container.querySelectorAll('[data-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.currentMode = btn.dataset.mode;
        this.container.querySelectorAll('[data-mode]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        if (this.currentMode !== 'edit' && !this.solverResults) {
          this.solve();
        }
        this.render();
      });
    });

    // Toolbar tool buttons
    this.container.querySelectorAll('[data-tool]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.activeTool = btn.dataset.tool;
        this.container.querySelectorAll('[data-tool]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.memberDraft = null;
        this.dimDraft = null;
        this.render();
      });
    });

    // Right Panel Tabs
    this.container.querySelectorAll('[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.currentTab = btn.dataset.tab;
        this.container.querySelectorAll('[data-tab]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.updateRightPanel();
      });
    });

    // Canvas Mouse / Pointer Interactions
    this.canvas.addEventListener('pointerdown', (e) => this.handlePointerDown(e));
    this.canvas.addEventListener('pointermove', (e) => this.handlePointerMove(e));
    this.canvas.addEventListener('pointerup', (e) => this.handlePointerUp(e));
    this.canvas.addEventListener('pointerleave', () => {
      if (this.inspectorEl) this.inspectorEl.style.display = 'none';
    });

    // Zoom on wheel
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const mBefore = this.toModel(sx, sy);

      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      const newScale = Math.min(250, Math.max(10, this.view.scale * zoomFactor));
      this.view.scale = newScale;

      // Adjust origin so the point under cursor stays invariant
      this.view.originX = sx - mBefore.x * this.view.scale;
      this.view.originY = sy + mBefore.y * this.view.scale;
      this.render();
    }, { passive: false });

    // Grid & Snap toggles
    const gridCheck = this.container.querySelector('#ftoolGridCheck');
    const snapCheck = this.container.querySelector('#ftoolSnapCheck');
    const gridStepInput = this.container.querySelector('#ftoolGridStepX');

    gridCheck.addEventListener('change', () => {
      this.grid.visible = gridCheck.checked;
      this.render();
    });
    snapCheck.addEventListener('change', () => {
      this.grid.snap = snapCheck.checked;
    });
    gridStepInput.addEventListener('change', () => {
      const val = parseFloat(gridStepInput.value);
      if (val > 0) {
        this.grid.stepX = val;
        this.grid.stepY = val;
        this.render();
      }
    });

    // Scale Slider
    const scaleSlider = this.container.querySelector('#ftoolScaleSlider');
    const scaleVal = this.container.querySelector('#ftoolScaleVal');
    scaleSlider.addEventListener('input', () => {
      this.resultScale = parseFloat(scaleSlider.value);
      scaleVal.textContent = `${this.resultScale.toFixed(1)}x`;
      this.render();
    });

    // Action buttons
    this.container.querySelector('#ftoolSolveBtn').addEventListener('click', () => {
      this.solve();
      if (this.currentMode === 'edit') {
        this.currentMode = 'diagramM';
        this.container.querySelectorAll('[data-mode]').forEach((b) => b.classList.remove('active'));
        this.container.querySelector('[data-mode="diagramM"]').classList.add('active');
      }
      this.render();
    });

    this.container.querySelector('#ftoolFitBtn').addEventListener('click', () => {
      this.autoFitView();
      this.render();
    });

    this.container.querySelector('#ftoolZoomInBtn').addEventListener('click', () => {
      this.view.scale = Math.min(250, this.view.scale * 1.25);
      this.render();
    });

    this.container.querySelector('#ftoolZoomOutBtn').addEventListener('click', () => {
      this.view.scale = Math.max(10, this.view.scale / 1.25);
      this.render();
    });

    this.container.querySelector('#ftoolPanModeBtn').addEventListener('click', () => {
      this.activeTool = 'pan';
      this.container.querySelectorAll('[data-tool]').forEach((b) => b.classList.remove('active'));
      this.render();
    });

    this.container.querySelector('#ftoolDeleteBtn').addEventListener('click', () => this.deleteSelected());
    this.container.querySelector('#ftoolUndoBtn').addEventListener('click', () => this.undo());
    this.container.querySelector('#ftoolRedoBtn').addEventListener('click', () => this.redo());
    this.container.querySelector('#ftoolClearAllBtn').addEventListener('click', () => {
      if (confirm('Deseja iniciar um novo modelo e limpar a área de desenho?')) {
        this.nodes = [];
        this.members = [];
        this.nodalLoads = [];
        this.dimensionLines = [];
        this.selectedEntity = null;
        this.solverResults = null;
        this.pushHistory();
        this.render();
        this.updateRightPanel();
        this.updateResultsSummary();
      }
    });

    this.container.querySelector('#ftoolExportImgBtn').addEventListener('click', () => this.exportImage());

    // Keyboard mode dialog
    const kbModal = this.container.querySelector('#ftoolKeyboardModal');
    const kbBtn = this.container.querySelector('#ftoolKeyboardBtn');
    const kbCloseBtn = this.container.querySelector('#ftoolCloseModalBtn');
    const kbCancelBtn = this.container.querySelector('#ftoolKbCancelBtn');
    const kbConfirmBtn = this.container.querySelector('#ftoolKbConfirmBtn');
    const kbTypeSelect = this.container.querySelector('#ftoolKbType');

    const openKb = () => {
      kbModal.style.display = 'grid';
      this.populateKbNodesSelect();
    };
    const closeKb = () => { kbModal.style.display = 'none'; };

    kbBtn.addEventListener('click', openKb);
    kbCloseBtn.addEventListener('click', closeKb);
    kbCancelBtn.addEventListener('click', closeKb);

    kbTypeSelect.addEventListener('change', () => {
      const isNode = kbTypeSelect.value === 'node';
      this.container.querySelector('#ftoolKbNodeFields').style.display = isNode ? 'block' : 'none';
      this.container.querySelector('#ftoolKbMemberFields').style.display = isNode ? 'none' : 'block';
    });

    kbConfirmBtn.addEventListener('click', () => {
      if (kbTypeSelect.value === 'node') {
        const x = parseFloat(this.container.querySelector('#ftoolKbX').value) || 0;
        const y = parseFloat(this.container.querySelector('#ftoolKbY').value) || 0;
        this.addOrGetNodeAt(x, y);
      } else {
        const startId = this.container.querySelector('#ftoolKbStartNode').value;
        const endId = this.container.querySelector('#ftoolKbEndNode').value;
        if (startId && endId && startId !== endId) {
          this.createMember(startId, endId);
        }
      }
      this.pushHistory();
      this.solve();
      this.render();
      this.updateRightPanel();
      closeKb();
    });

    this.updateRightPanel();
  }

  populateKbNodesSelect() {
    const s1 = this.container.querySelector('#ftoolKbStartNode');
    const s2 = this.container.querySelector('#ftoolKbEndNode');
    const opts = this.nodes.map((n) => `<option value="${n.id}">${n.name || n.id} (${n.x.toFixed(2)}, ${n.y.toFixed(2)})</option>`).join('');
    s1.innerHTML = opts;
    s2.innerHTML = opts;
    if (this.nodes.length >= 2) {
      s2.selectedIndex = 1;
    }
  }

  autoFitView() {
    if (this.nodes.length === 0) return;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const n of this.nodes) {
      if (n.x < minX) minX = n.x;
      if (n.x > maxX) maxX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.y > maxY) maxY = n.y;
    }
    const padding = 1.5; // meters margin
    minX -= padding; maxX += padding;
    minY -= padding; maxY += padding;
    const spanX = Math.max(2, maxX - minX);
    const spanY = Math.max(2, maxY - minY);

    const rect = this.canvas.getBoundingClientRect();
    const scaleX = rect.width / spanX;
    const scaleY = rect.height / spanY;
    this.view.scale = Math.min(scaleX, scaleY, 90);

    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;
    this.view.originX = rect.width / 2 - midX * this.view.scale;
    this.view.originY = rect.height / 2 + midY * this.view.scale;
  }

  handlePointerDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    // Pan with middle click, right click or if pan tool is active
    if (e.button === 1 || e.button === 2 || this.activeTool === 'pan') {
      this.view.isPanning = true;
      this.view.lastPanX = sx;
      this.view.lastPanY = sy;
      this.canvas.setPointerCapture(e.pointerId);
      return;
    }

    const rawM = this.toModel(sx, sy);
    const snapped = this.snapToGrid(rawM.x, rawM.y);

    if (this.activeTool === 'select') {
      const hit = this.hitTest(sx, sy);
      this.selectedEntity = hit;
      this.updateRightPanel();
      this.render();
      return;
    }

    if (this.activeTool === 'node') {
      const node = this.addOrGetNodeAt(snapped.x, snapped.y);
      this.selectedEntity = { type: 'node', id: node.id };
      this.pushHistory();
      this.solve();
      this.render();
      this.updateRightPanel();
      return;
    }

    if (this.activeTool === 'member') {
      const node = this.addOrGetNodeAt(snapped.x, snapped.y);
      this.memberDraft = {
        startNodeId: node.id,
        startPoint: { x: node.x, y: node.y },
        currentPoint: { x: node.x, y: node.y },
      };
      this.render();
      return;
    }

    if (this.activeTool === 'dimension') {
      if (!this.dimDraft) {
        this.dimDraft = {
          step: 1,
          p1: { x: snapped.x, y: snapped.y },
          currentPoint: { x: snapped.x, y: snapped.y },
        };
      } else if (this.dimDraft.step === 1) {
        this.dimDraft.step = 2;
        this.dimDraft.p2 = { x: snapped.x, y: snapped.y };
      } else if (this.dimDraft.step === 2) {
        // 3rd click: offset position
        const p1 = this.dimDraft.p1;
        const p2 = this.dimDraft.p2;
        const p3 = { x: snapped.x, y: snapped.y };
        const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        if (len > 0.01) {
          // Distance from p3 to line p1-p2
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          // Perpendicular unit vector: (-dy/L, dx/L)
          const offset = (-dy * (p3.x - p1.x) + dx * (p3.y - p1.y)) / len;
          this.dimensionLines.push({
            id: `D_${Date.now()}`,
            p1,
            p2,
            offset,
            length: len,
          });
          this.pushHistory();
        }
        this.dimDraft = null;
        this.render();
      }
    }
  }

  handlePointerMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    if (this.view.isPanning) {
      const dx = sx - this.view.lastPanX;
      const dy = sy - this.view.lastPanY;
      this.view.originX += dx;
      this.view.originY += dy;
      this.view.lastPanX = sx;
      this.view.lastPanY = sy;
      this.render();
      return;
    }

    const rawM = this.toModel(sx, sy);
    let snapped = this.snapToGrid(rawM.x, rawM.y);

    // Apply Shift angle restriction for member drafting (horizontal, vertical, or 45°)
    if (this.memberDraft && this.shiftPressed) {
      const p0 = this.memberDraft.startPoint;
      const dx = snapped.x - p0.x;
      const dy = snapped.y - p0.y;
      const angle = Math.atan2(dy, dx);
      // Snap to nearest 45 degree (PI/4)
      const octant = Math.round(angle / (Math.PI / 4));
      const snappedAngle = octant * (Math.PI / 4);
      const dist = Math.hypot(dx, dy);
      snapped = {
        x: p0.x + dist * Math.cos(snappedAngle),
        y: p0.y + dist * Math.sin(snappedAngle),
      };
      // Snap length to nearest grid step
      const step = this.grid.stepX || 1.0;
      const snappedDist = Math.round(dist / step) * step;
      snapped.x = Number((p0.x + snappedDist * Math.cos(snappedAngle)).toFixed(4));
      snapped.y = Number((p0.y + snappedDist * Math.sin(snappedAngle)).toFixed(4));
    }

    this.mouseModelCoords = snapped;

    // Length readout
    let lengthText = '0.00 m';
    if (this.memberDraft) {
      const p0 = this.memberDraft.startPoint;
      const l = Math.hypot(snapped.x - p0.x, snapped.y - p0.y);
      lengthText = `${l.toFixed(2)} m`;
      this.memberDraft.currentPoint = snapped;
    } else if (this.dimDraft) {
      const p0 = this.dimDraft.p1;
      const l = Math.hypot(snapped.x - p0.x, snapped.y - p0.y);
      lengthText = `${l.toFixed(2)} m`;
      this.dimDraft.currentPoint = snapped;
    }

    if (this.coordsEl) {
      this.coordsEl.textContent = `X: ${snapped.x.toFixed(2)} m | Y: ${snapped.y.toFixed(2)} m | L: ${lengthText} | Zoom: ${Math.round(this.view.scale)}%`;
    }

    // Hover inspector in result diagram mode
    if (this.currentMode !== 'edit' && this.solverResults) {
      this.checkHoverInspector(sx, sy);
    } else {
      if (this.inspectorEl) this.inspectorEl.style.display = 'none';
    }

    if (this.memberDraft || this.dimDraft) {
      this.render();
    }
  }

  handlePointerUp(e) {
    if (this.view.isPanning) {
      this.view.isPanning = false;
      this.canvas.releasePointerCapture(e.pointerId);
      return;
    }

    if (this.activeTool === 'member' && this.memberDraft) {
      const p = this.memberDraft.currentPoint;
      const startNode = this.nodes.find((n) => n.id === this.memberDraft.startNodeId);
      const dist = Math.hypot(p.x - startNode.x, p.y - startNode.y);

      if (dist > 0.05) {
        const endNode = this.addOrGetNodeAt(p.x, p.y);
        if (endNode.id !== startNode.id) {
          this.createMember(startNode.id, endNode.id);
          this.pushHistory();
          this.solve();
          this.updateRightPanel();
        }
      }
      this.memberDraft = null;
      this.render();
    }
  }

  checkHoverInspector(sx, sy) {
    const rawM = this.toModel(sx, sy);
    let closestMem = null;
    let closestDist = Infinity;
    let closestT = 0;

    for (const mem of this.members) {
      const n1 = this.nodes.find((n) => n.id === mem.startNodeId);
      const n2 = this.nodes.find((n) => n.id === mem.endNodeId);
      if (!n1 || !n2) continue;

      const dx = n2.x - n1.x;
      const dy = n2.y - n1.y;
      const L = Math.hypot(dx, dy);
      if (L < 1e-5) continue;

      const t = Math.max(0, Math.min(1, ((rawM.x - n1.x) * dx + (rawM.y - n1.y) * dy) / (L * L)));
      const projX = n1.x + t * dx;
      const projY = n1.y + t * dy;
      const dist = Math.hypot(rawM.x - projX, rawM.y - projY);

      if (dist < closestDist) {
        closestDist = dist;
        closestMem = mem;
        closestT = t;
      }
    }

    const hitThreshold = 18 / this.view.scale; // 18 pixels
    if (closestMem && closestDist < hitThreshold && this.solverResults) {
      const memRes = this.solverResults.memberResults.find((r) => r.memberId === closestMem.id);
      if (memRes && memRes.samples.length > 0) {
        const sampleIdx = Math.min(
          memRes.samples.length - 1,
          Math.max(0, Math.round(closestT * (memRes.samples.length - 1)))
        );
        const sample = memRes.samples[sampleIdx];
        const screenP = this.toScreen(sample.gx, sample.gy);

        this.inspectorEl.style.display = 'block';
        this.inspectorEl.style.left = `${screenP.x}px`;
        this.inspectorEl.style.top = `${screenP.y}px`;
        this.inspectorEl.innerHTML = `
          <strong>Barra ${closestMem.name || closestMem.id}</strong>
          x = ${sample.x.toFixed(2)} m (${((sample.x / memRes.length) * 100).toFixed(0)}%)<br/>
          N = ${sample.N.toFixed(2)} kN<br/>
          V = ${sample.V.toFixed(2)} kN<br/>
          M = ${sample.M.toFixed(2)} kN·m<br/>
          dy = ${(sample.dy * 1000).toFixed(2)} mm
        `;
        return;
      }
    }

    this.inspectorEl.style.display = 'none';
  }

  addOrGetNodeAt(x, y) {
    const tol = 0.05; // 5 cm tolerance
    const existing = this.nodes.find((n) => Math.hypot(n.x - x, n.y - y) < tol);
    if (existing) return existing;

    const id = `N_${Date.now()}_${Math.floor(Math.random() * 100)}`;
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const name = this.nodes.length < alphabet.length ? alphabet[this.nodes.length] : `N${this.nodes.length + 1}`;
    const newNode = {
      id,
      name,
      x: Number(x.toFixed(4)),
      y: Number(y.toFixed(4)),
    };
    this.nodes.push(newNode);
    return newNode;
  }

  createMember(startNodeId, endNodeId) {
    // Check if already exists
    const existing = this.members.find(
      (m) =>
        (m.startNodeId === startNodeId && m.endNodeId === endNodeId) ||
        (m.startNodeId === endNodeId && m.endNodeId === startNodeId)
    );
    if (existing) return existing;

    const n1 = this.nodes.find((n) => n.id === startNodeId);
    const n2 = this.nodes.find((n) => n.id === endNodeId);
    const name = `${n1.name || ''}${n2.name || ''}`;

    const newMember = {
      id: `M_${Date.now()}_${Math.floor(Math.random() * 100)}`,
      name,
      startNodeId,
      endNodeId,
      materialId: 'mat_steel',
      sectionId: 'sec_rect_20x30',
      release: 'none',
      distributedLoads: [],
    };
    this.members.push(newMember);
    this.selectedEntity = { type: 'member', id: newMember.id };
    return newMember;
  }

  hitTest(sx, sy) {
    const rawM = this.toModel(sx, sy);
    const nodeRadius = 10 / this.view.scale;

    // Check nodes first
    for (const node of this.nodes) {
      if (Math.hypot(node.x - rawM.x, node.y - rawM.y) <= nodeRadius) {
        return { type: 'node', id: node.id };
      }
    }

    // Check members
    const memberTolerance = 8 / this.view.scale;
    for (const mem of this.members) {
      const n1 = this.nodes.find((n) => n.id === mem.startNodeId);
      const n2 = this.nodes.find((n) => n.id === mem.endNodeId);
      if (!n1 || !n2) continue;

      const dx = n2.x - n1.x;
      const dy = n2.y - n1.y;
      const L = Math.hypot(dx, dy);
      if (L < 1e-6) continue;

      const t = Math.max(0, Math.min(1, ((rawM.x - n1.x) * dx + (rawM.y - n1.y) * dy) / (L * L)));
      const projX = n1.x + t * dx;
      const projY = n1.y + t * dy;
      if (Math.hypot(rawM.x - projX, rawM.y - projY) <= memberTolerance) {
        return { type: 'member', id: mem.id };
      }
    }

    // Check dimension lines
    for (const dim of this.dimensionLines) {
      const mx = (dim.p1.x + dim.p2.x) / 2;
      const my = (dim.p1.y + dim.p2.y) / 2;
      if (Math.hypot(rawM.x - mx, rawM.y - my) <= 20 / this.view.scale) {
        return { type: 'dim', id: dim.id };
      }
    }

    return null;
  }

  deleteSelected() {
    if (!this.selectedEntity) return;
    const { type, id } = this.selectedEntity;
    if (type === 'node') {
      this.nodes = this.nodes.filter((n) => n.id !== id);
      // Remove attached members
      this.members = this.members.filter((m) => m.startNodeId !== id && m.endNodeId !== id);
      // Remove attached loads
      this.nodalLoads = this.nodalLoads.filter((l) => l.nodeId !== id);
    } else if (type === 'member') {
      this.members = this.members.filter((m) => m.id !== id);
    } else if (type === 'dim') {
      this.dimensionLines = this.dimensionLines.filter((d) => d.id !== id);
    }
    this.selectedEntity = null;
    this.pushHistory();
    this.solve();
    this.render();
    this.updateRightPanel();
  }

  // Solves the frame using Direct Stiffness Method FtoolSolver
  solve() {
    this.solverError = null;
    if (this.nodes.length < 2 || this.members.length === 0) {
      this.solverResults = null;
      this.updateResultsSummary();
      return;
    }

    try {
      const model = {
        nodes: this.nodes,
        members: this.members,
        materials: this.materials,
        sections: this.sections,
        nodalLoads: this.nodalLoads,
      };
      this.solverResults = FtoolSolver.solve(model, 60);
      this.onModelChange(model, this.solverResults);
    } catch (err) {
      this.solverError = err.message || 'Erro no cálculo estrutural.';
      this.solverResults = null;
    }
    this.updateResultsSummary();
  }

  // Visual Graphic Rendering on HTML5 Canvas
  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);

    ctx.clearRect(0, 0, width, height);

    // 1. Grid & Axes
    if (this.grid.visible) {
      this.drawGrid(ctx, width, height);
    }

    // 2. Dimension Lines
    this.drawDimensionLines(ctx);

    // 3. Draft lines (Rubber-band while drawing)
    if (this.memberDraft && this.memberDraft.startPoint && this.memberDraft.currentPoint) {
      const p1 = this.toScreen(this.memberDraft.startPoint.x, this.memberDraft.startPoint.y);
      const p2 = this.toScreen(this.memberDraft.currentPoint.x, this.memberDraft.currentPoint.y);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = '#df7458'; // Coral rubber-band
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 5]);
      ctx.stroke();

      // Show real-time length badge
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      const len = Math.hypot(
        this.memberDraft.currentPoint.x - this.memberDraft.startPoint.x,
        this.memberDraft.currentPoint.y - this.memberDraft.startPoint.y
      );
      ctx.fillStyle = '#123c5b';
      ctx.fillRect(midX - 25, midY - 18, 50, 16);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${len.toFixed(2)} m`, midX, midY - 6);
      ctx.restore();
    }

    if (this.dimDraft && this.dimDraft.p1 && this.dimDraft.currentPoint) {
      const p1 = this.toScreen(this.dimDraft.p1.x, this.dimDraft.p1.y);
      const p2 = this.toScreen(this.dimDraft.currentPoint.x, this.dimDraft.currentPoint.y);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = '#205d8c';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.restore();
    }

    // 4. In results mode: Draw Diagram or Deformed shape under the structure
    if (this.solverResults && this.currentMode !== 'edit') {
      if (this.currentMode === 'deformed') {
        this.drawDeformedShape(ctx);
      } else {
        this.drawInternalForceDiagrams(ctx, this.currentMode);
      }
    }

    // 5. Members (Barras)
    this.drawMembers(ctx);

    // 6. Supports
    this.drawSupports(ctx);

    // 7. Loads (Nodal and Distributed)
    this.drawLoads(ctx);

    // 8. Reactions (in Results mode)
    if (this.solverResults && this.currentMode !== 'edit') {
      this.drawReactions(ctx);
    }

    // 9. Nodes
    this.drawNodes(ctx);
  }

  drawGrid(ctx, width, height) {
    const stepX = this.grid.stepX * this.view.scale;
    const stepY = this.grid.stepY * this.view.scale;
    if (stepX < 10 || stepY < 10) return;

    ctx.save();
    // Grid dots/lines
    const startX = this.view.originX % stepX;
    const startY = this.view.originY % stepY;

    ctx.fillStyle = '#b7cbce';
    for (let x = startX; x < width; x += stepX) {
      for (let y = startY; y < height; y += stepY) {
        ctx.beginPath();
        ctx.arc(x, y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Axis cross at (0, 0)
    const o = this.toScreen(0, 0);
    ctx.strokeStyle = 'rgba(18, 60, 91, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    // X axis
    ctx.moveTo(0, o.y); ctx.lineTo(width, o.y);
    // Y axis
    ctx.moveTo(o.x, 0); ctx.lineTo(o.x, height);
    ctx.stroke();

    // Origin label
    ctx.fillStyle = '#839ca7';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('(0, 0)', o.x - 6, o.y + 14);

    ctx.restore();
  }

  drawMembers(ctx) {
    ctx.save();
    for (const mem of this.members) {
      const n1 = this.nodes.find((n) => n.id === mem.startNodeId);
      const n2 = this.nodes.find((n) => n.id === mem.endNodeId);
      if (!n1 || !n2) continue;

      const p1 = this.toScreen(n1.x, n1.y);
      const p2 = this.toScreen(n2.x, n2.y);
      const isSelected = this.selectedEntity?.type === 'member' && this.selectedEntity?.id === mem.id;

      // In deformed mode, draw undeformed beam faint
      if (this.currentMode === 'deformed') {
        ctx.strokeStyle = '#c5d8dc';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
      } else {
        ctx.strokeStyle = isSelected ? '#13b99c' : '#1d4868';
        ctx.lineWidth = isSelected ? 5.5 : 4;
        ctx.setLineDash([]);
      }

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Member name label
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

      // Offset label perpendicular to bar with clean backdrop
      const offsetDist = 12;
      const lx = midX - Math.sin(angle) * offsetDist;
      const ly = midY + Math.cos(angle) * offsetDist;
      const memLabel = mem.name || mem.id;
      ctx.font = 'bold 10px sans-serif';
      const mtw = ctx.measureText(memLabel).width;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
      ctx.fillRect(lx - mtw / 2 - 3, ly - 6, mtw + 6, 12);
      ctx.fillStyle = isSelected ? '#087c6b' : '#5b788a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(memLabel, lx, ly);

      // End releases (rótulas)
      const release = mem.release || 'none';
      const hingeRadius = 4.5;
      const dx = (p2.x - p1.x) / Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const dy = (p2.y - p1.y) / Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const hDist = 9;

      if (release === 'start' || release === 'both') {
        ctx.beginPath();
        ctx.arc(p1.x + dx * hDist, p1.y + dy * hDist, hingeRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#1d4868';
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }
      if (release === 'end' || release === 'both') {
        ctx.beginPath();
        ctx.arc(p2.x - dx * hDist, p2.y - dy * hDist, hingeRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#1d4868';
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  drawNodes(ctx) {
    ctx.save();
    for (const node of this.nodes) {
      const p = this.toScreen(node.x, node.y);
      const isSelected = this.selectedEntity?.type === 'node' && this.selectedEntity?.id === node.id;
      const isHinged = Boolean(node.hinged || node.joint === 'articulado');

      if (isHinged) {
        // Nodal Hinge (Rótula no Nó): distinct white-filled circle with border and central pivot pin
        ctx.beginPath();
        ctx.arc(p.x, p.y, isSelected ? 6.5 : 5.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#13b99c' : '#123c5b';
        ctx.lineWidth = isSelected ? 2.5 : 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? '#13b99c' : '#123c5b';
        ctx.fill();
      } else {
        // Rigid Node: solid dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, isSelected ? 7 : 5, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? '#13b99c' : '#123c5b';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Node label with clean pill backdrop
      const label = node.name || node.id;
      ctx.font = 'bold 11px sans-serif';
      const tw = ctx.measureText(label).width;
      const lx = p.x + 8;
      const ly = node.support ? p.y - 12 : p.y - 5;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(lx - 2, ly - 7, tw + 4, 14);
      ctx.fillStyle = isSelected ? '#087c6b' : '#123c5b';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, lx, ly);
    }
    ctx.restore();
  }

  drawSupports(ctx) {
    ctx.save();
    for (const node of this.nodes) {
      if (!node.support) continue;
      const s = node.support;
      const p = this.toScreen(node.x, node.y);
      const triH = 16;
      const triW = 18;

      // Fixed support (Engaste): fixX && fixY && fixRz
      if (s.fixX && s.fixY && s.fixRz) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.strokeStyle = '#123c5b';
        ctx.lineWidth = 2.5;
        // Draw fixed block at bottom
        ctx.beginPath();
        ctx.moveTo(-16, 0); ctx.lineTo(16, 0);
        ctx.stroke();
        // Slanted hatching lines
        ctx.lineWidth = 1.2;
        for (let x = -14; x <= 14; x += 5) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x - 5, 8);
          ctx.stroke();
        }
        ctx.restore();
      }
      // Pinned / 2nd order: fixX && fixY
      else if (s.fixX && s.fixY) {
        ctx.save();
        ctx.translate(p.x, p.y);
        // Triangle
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-triW / 2, triH);
        ctx.lineTo(triW / 2, triH);
        ctx.closePath();
        ctx.fillStyle = '#e8f3f5';
        ctx.fill();
        ctx.strokeStyle = '#123c5b';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Base line and hatching
        ctx.beginPath();
        ctx.moveTo(-triW / 2 - 4, triH);
        ctx.lineTo(triW / 2 + 4, triH);
        ctx.stroke();
        ctx.lineWidth = 1;
        for (let x = -triW / 2 - 2; x <= triW / 2 + 2; x += 4) {
          ctx.beginPath();
          ctx.moveTo(x, triH);
          ctx.lineTo(x - 4, triH + 6);
          ctx.stroke();
        }
        ctx.restore();
      }
      // Roller in Y / 1st order: fixY only
      else if (s.fixY && !s.fixX) {
        ctx.save();
        ctx.translate(p.x, p.y);
        // Triangle
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-triW / 2, triH - 4);
        ctx.lineTo(triW / 2, triH - 4);
        ctx.closePath();
        ctx.fillStyle = '#e8f3f5';
        ctx.fill();
        ctx.strokeStyle = '#123c5b';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Rollers (two small wheels)
        ctx.beginPath();
        ctx.arc(-5, triH, 2.5, 0, Math.PI * 2);
        ctx.arc(5, triH, 2.5, 0, Math.PI * 2);
        ctx.stroke();

        // Ground line
        ctx.beginPath();
        ctx.moveTo(-triW / 2 - 4, triH + 3.5);
        ctx.lineTo(triW / 2 + 4, triH + 3.5);
        ctx.stroke();
        ctx.restore();
      }
      // Roller in X: fixX only
      else if (s.fixX && !s.fixY) {
        ctx.save();
        ctx.translate(p.x, p.y);
        // Triangle rotated 90 deg
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-triH + 4, -triW / 2);
        ctx.lineTo(-triH + 4, triW / 2);
        ctx.closePath();
        ctx.fillStyle = '#e8f3f5';
        ctx.fill();
        ctx.strokeStyle = '#123c5b';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Rollers
        ctx.beginPath();
        ctx.arc(-triH, -5, 2.5, 0, Math.PI * 2);
        ctx.arc(-triH, 5, 2.5, 0, Math.PI * 2);
        ctx.stroke();

        // Ground line
        ctx.beginPath();
        ctx.moveTo(-triH - 3.5, -triW / 2 - 4);
        ctx.lineTo(-triH - 3.5, triW / 2 + 4);
        ctx.stroke();
        ctx.restore();
      }

      // Elastic Spring (Mola Ky)
      if (s.springKy && s.springKy > 0) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.strokeStyle = '#13b99c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 6);
        ctx.lineTo(6, 10);
        ctx.lineTo(-6, 15);
        ctx.lineTo(6, 20);
        ctx.lineTo(-6, 25);
        ctx.lineTo(0, 29);
        ctx.lineTo(0, 35);
        ctx.stroke();
        // Ground line
        ctx.beginPath();
        ctx.moveTo(-10, 35); ctx.lineTo(10, 35);
        ctx.stroke();
        ctx.fillStyle = '#087c6b';
        ctx.font = '9px monospace';
        ctx.fillText(`K=${s.springKy}`, 10, 22);
        ctx.restore();
      }
    }
    ctx.restore();
  }

  drawLoads(ctx) {
    ctx.save();
    const isResultsMode = Boolean(this.solverResults && this.currentMode !== 'edit');
    if (isResultsMode) {
      ctx.globalAlpha = 0.45;
    }

    // 1. Nodal Loads
    for (const load of this.nodalLoads) {
      const node = this.nodes.find((n) => n.id === load.nodeId);
      if (!node) continue;
      const p = this.toScreen(node.x, node.y);

      // Force Vector (Fx, Fy)
      if (load.fx || load.fy) {
        const arrowLen = 38;
        const angle = Math.atan2(-load.fy, load.fx); // Screen Y is inverted
        const startX = p.x - Math.cos(angle) * arrowLen;
        const startY = p.y - Math.sin(angle) * arrowLen;

        ctx.strokeStyle = '#205d8c';
        ctx.fillStyle = '#205d8c';
        ctx.lineWidth = 2.5;

        // Shaft
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();

        // Arrowhead
        this.drawArrowHead(ctx, p.x, p.y, angle);

        // Value text with pill backdrop
        const mag = Math.hypot(load.fx, load.fy);
        const text = `${mag.toFixed(1)} kN`;
        ctx.font = 'bold 10px monospace';
        const tw = ctx.measureText(text).width;
        const tx = startX - Math.cos(angle) * 12;
        const ty = startY - Math.sin(angle) * 12;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(tx - tw / 2 - 2, ty - 6, tw + 4, 12);
        ctx.fillStyle = '#205d8c';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, tx, ty);
      }

      // Moment (Mz)
      if (load.mz) {
        ctx.strokeStyle = '#d86d54';
        ctx.fillStyle = '#d86d54';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const r = 20;
        const isCCW = load.mz > 0;
        ctx.arc(p.x, p.y, r, isCCW ? 0.3 * Math.PI : -0.3 * Math.PI, isCCW ? 1.7 * Math.PI : -1.7 * Math.PI, !isCCW);
        ctx.stroke();

        // Arrow head on arc
        const endAngle = isCCW ? 1.7 * Math.PI : -1.7 * Math.PI;
        const ax = p.x + r * Math.cos(endAngle);
        const ay = p.y + r * Math.sin(endAngle);
        this.drawArrowHead(ctx, ax, ay, endAngle + (isCCW ? Math.PI / 2 : -Math.PI / 2));

        ctx.font = 'bold 10px monospace';
        ctx.fillText(`${Math.abs(load.mz).toFixed(1)} kN·m`, p.x, p.y - r - 4);
      }
    }

    // 2. Distributed Loads on Members
    for (const mem of this.members) {
      if (!mem.distributedLoads || mem.distributedLoads.length === 0) continue;
      const n1 = this.nodes.find((n) => n.id === mem.startNodeId);
      const n2 = this.nodes.find((n) => n.id === mem.endNodeId);
      if (!n1 || !n2) continue;

      const p1 = this.toScreen(n1.x, n1.y);
      const p2 = this.toScreen(n2.x, n2.y);
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const Lscreen = Math.hypot(dx, dy);
      if (Lscreen < 10) continue;

      const barAngle = Math.atan2(dy, dx);
      // Perpendicular normal to bar (facing "up" on horizontal beam)
      const nx = -Math.sin(barAngle);
      const ny = Math.cos(barAngle);

      for (const dload of mem.distributedLoads) {
        const qx1 = dload.qxi ?? 0;
        const qx2 = dload.qxj ?? qx1;
        const qy1 = dload.qyi ?? 0;
        const qy2 = dload.qyj ?? qy1;
        if (Math.abs(qx1) < 1e-4 && Math.abs(qx2) < 1e-4 && Math.abs(qy1) < 1e-4 && Math.abs(qy2) < 1e-4) continue;

        const maxH = 26;
        const numArrows = Math.max(3, Math.round(Lscreen / 25));

        ctx.strokeStyle = '#205d8c';
        ctx.fillStyle = '#205d8c';
        ctx.lineWidth = 1.4;

        // Top line points
        const topPts = [];

        // Check if load is primarily global X (horizontal) or normal/Y
        const isGlobalX = Math.abs(qx1) > 1e-4 || Math.abs(qx2) > 1e-4;

        for (let i = 0; i <= numArrows; i++) {
          const t = i / numArrows;
          const bx = p1.x + t * dx;
          const by = p1.y + t * dy;

          let tx = bx;
          let ty = by;

          if (isGlobalX) {
            const qxVal = qx1 + (qx2 - qx1) * t;
            const signX = qxVal > 0 ? -1 : 1; // qx > 0 points right (toward +X), arrow starts to left
            const arrowLen = (Math.abs(qxVal) / (Math.max(Math.abs(qx1), Math.abs(qx2)) || 1)) * maxH;
            tx = bx + signX * arrowLen;
            ty = by;
          } else {
            const qyVal = qy1 + (qy2 - qy1) * t;
            const signY = qyVal < 0 ? 1 : -1; // qy < 0 pushes down
            const arrowHeight = (Math.abs(qyVal) / (Math.max(Math.abs(qy1), Math.abs(qy2)) || 1)) * maxH;
            tx = bx - nx * arrowHeight * signY;
            ty = by - ny * arrowHeight * signY;
          }

          topPts.push({ x: tx, y: ty });

          // Draw individual load arrow
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(bx, by);
          ctx.stroke();

          // Arrowhead pointing to the member
          const arrowDir = Math.atan2(by - ty, bx - tx);
          this.drawArrowHead(ctx, bx, by, arrowDir, 6);
        }

        // Connecting top line
        ctx.beginPath();
        ctx.moveTo(topPts[0].x, topPts[0].y);
        for (let i = 1; i < topPts.length; i++) {
          ctx.lineTo(topPts[i].x, topPts[i].y);
        }
        ctx.stroke();

        // Text label with clean pill backdrop
        ctx.font = 'bold 10px monospace';
        const qMainVal = isGlobalX ? Math.abs(qx1) : Math.abs(qy1);
        const qPrefix = isGlobalX ? 'qx' : 'qy';
        const qText = `${qPrefix} = ${qMainVal.toFixed(1)} kN/m`;
        const qtw = ctx.measureText(qText).width;
        const labelPos = topPts[Math.floor(topPts.length / 2)];
        const qyPos = isGlobalX ? labelPos.y - 10 : labelPos.y - 8;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(labelPos.x - qtw / 2 - 4, qyPos - 7, qtw + 8, 14);
        ctx.fillStyle = '#205d8c';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(qText, labelPos.x, qyPos);
      }
    }

    ctx.restore();
  }

  drawArrowHead(ctx, x, y, angle, size = 8) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-size, -size / 2.2);
    ctx.lineTo(-size, size / 2.2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Dimension Lines (Cotagem Ftool)
  drawDimensionLines(ctx) {
    if (this.dimensionLines.length === 0) return;
    ctx.save();

    for (const dim of this.dimensionLines) {
      const p1 = this.toScreen(dim.p1.x, dim.p1.y);
      const p2 = this.toScreen(dim.p2.x, dim.p2.y);
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const Lscreen = Math.hypot(dx, dy);
      if (Lscreen < 5) continue;

      const angle = Math.atan2(dy, dx);
      // Perpendicular offset unit vector
      const nx = -Math.sin(angle);
      const ny = Math.cos(angle);
      const offsetPx = dim.offset * this.view.scale;

      const d1 = { x: p1.x + nx * offsetPx, y: p1.y + ny * offsetPx };
      const d2 = { x: p2.x + nx * offsetPx, y: p2.y + ny * offsetPx };

      ctx.strokeStyle = '#6b8a99';
      ctx.fillStyle = '#6b8a99';
      ctx.lineWidth = 1.2;

      // Extension witness lines
      const ext = 5;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(d1.x + nx * ext * Math.sign(offsetPx), d1.y + ny * ext * Math.sign(offsetPx));
      ctx.moveTo(p2.x, p2.y);
      ctx.lineTo(d2.x + nx * ext * Math.sign(offsetPx), d2.y + ny * ext * Math.sign(offsetPx));
      ctx.stroke();

      // Dimension line
      ctx.beginPath();
      ctx.moveTo(d1.x, d1.y);
      ctx.lineTo(d2.x, d2.y);
      ctx.stroke();

      // Dual arrowheads
      this.drawArrowHead(ctx, d1.x, d1.y, angle + Math.PI, 6);
      this.drawArrowHead(ctx, d2.x, d2.y, angle, 6);

      // Centered length text
      const midX = (d1.x + d2.x) / 2;
      const midY = (d1.y + d2.y) / 2;
      ctx.save();
      ctx.translate(midX, midY);
      // Keep text readable upright
      let textAngle = angle;
      if (textAngle > Math.PI / 2 || textAngle < -Math.PI / 2) textAngle += Math.PI;
      ctx.rotate(textAngle);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-22, -14, 44, 12);
      ctx.fillStyle = '#204b6e';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${dim.length.toFixed(2)} m`, 0, -8);
      ctx.restore();
    }

    ctx.restore();
  }

  // Draw Internal Force Diagrams (N, V, M)
  drawInternalForceDiagrams(ctx, mode) {
    if (!this.solverResults) return;
    ctx.save();

    const isM = mode === 'diagramM';
    const isV = mode === 'diagramV';
    const isN = mode === 'diagramN';

    // Find maximum absolute value for scaling
    let globalMax = 0;
    for (const memRes of this.solverResults.memberResults) {
      for (const s of memRes.samples) {
        const val = isM ? Math.abs(s.M) : isV ? Math.abs(s.V) : Math.abs(s.N);
        if (val > globalMax) globalMax = val;
      }
    }
    if (globalMax < 1e-4) globalMax = 1;

    // Standard diagram scale in screen pixels
    const baseDiagramHeight = 45 * this.resultScale;
    const diagramUnitScale = baseDiagramHeight / globalMax;

    // Palette: M = Terracotta, V = Emerald, N = Blue
    const strokeColor = isM ? '#ea580c' : isV ? '#059669' : '#2563eb';
    const fillColor = isM ? 'rgba(234, 88, 12, 0.16)' : isV ? 'rgba(5, 150, 105, 0.16)' : 'rgba(37, 99, 235, 0.16)';

    for (const memRes of this.solverResults.memberResults) {
      const mem = this.members.find((m) => m.id === memRes.memberId);
      const n1 = this.nodes.find((n) => n.id === mem.startNodeId);
      const n2 = this.nodes.find((n) => n.id === mem.endNodeId);
      if (!n1 || !n2) continue;

      const p1 = this.toScreen(n1.x, n1.y);
      const p2 = this.toScreen(n2.x, n2.y);
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const Lscreen = Math.hypot(dx, dy);
      if (Lscreen < 5) continue;

      const barAngle = Math.atan2(dy, dx);
      // Perpendicular unit normal in screen coordinates pointing towards local +y' (UPWARDS on screen for horizontal bar)
      const nx = Math.sin(barAngle);
      const ny = -Math.cos(barAngle);

      const samples = memRes.samples;
      const polyPts = [];

      for (let i = 0; i < samples.length; i++) {
        const s = samples[i];
        const t = s.x / memRes.length;
        const bx = p1.x + t * dx;
        const by = p1.y + t * dy;

        let val = 0;
        let ordinate = 0;
        if (isM) {
          // Bending Moment: plotted on the TENSION side (fibras tracionadas).
          // Positive moment (M > 0, bottom in tension) -> drawn DOWNWARDS (towards -y').
          // Negative moment (M < 0, top in tension) -> drawn UPWARDS (towards +y').
          val = s.M;
          ordinate = -val * diagramUnitScale;
        } else if (isV) {
          // Shear force: positive (+) drawn UPWARDS, negative (-) drawn DOWNWARDS.
          val = s.V;
          ordinate = val * diagramUnitScale;
        } else {
          // Normal force: tension (+) drawn UPWARDS, compression (-) drawn DOWNWARDS.
          val = s.N;
          ordinate = val * diagramUnitScale;
        }

        const ox = bx + nx * ordinate;
        const oy = by + ny * ordinate;
        polyPts.push({ ox, oy, bx, by, val, x: s.x });
      }

      // Draw filled diagram polygon
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      for (const pt of polyPts) ctx.lineTo(pt.ox, pt.oy);
      ctx.lineTo(p2.x, p2.y);
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();

      // Outer diagram curve
      ctx.beginPath();
      ctx.moveTo(polyPts[0].ox, polyPts[0].oy);
      for (let i = 1; i < polyPts.length; i++) ctx.lineTo(polyPts[i].ox, polyPts[i].oy);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Draw ordinate hatch lines every few pixels
      ctx.strokeStyle = isM ? 'rgba(234, 88, 12, 0.4)' : isV ? 'rgba(5, 150, 105, 0.4)' : 'rgba(37, 99, 235, 0.4)';
      ctx.lineWidth = 1;
      for (let i = 0; i < polyPts.length; i += Math.max(1, Math.round(polyPts.length / 20))) {
        const pt = polyPts[i];
        ctx.beginPath();
        ctx.moveTo(pt.bx, pt.by);
        ctx.lineTo(pt.ox, pt.oy);
        ctx.stroke();
      }

      // Values labeled at ends and peak
      const valStart = polyPts[0].val;
      const valEnd = polyPts[polyPts.length - 1].val;

      // Find extreme peak
      let peakIdx = 0;
      let peakAbs = 0;
      for (let i = 0; i < polyPts.length; i++) {
        if (Math.abs(polyPts[i].val) > peakAbs) {
          peakAbs = Math.abs(polyPts[i].val);
          peakIdx = i;
        }
      }

      const unit = isM ? 'kN·m' : 'kN';
      // Indent start/end badges slightly along the curve so they don't collide with nodes/supports
      const startBadgeIdx = Math.min(polyPts.length - 1, Math.max(1, Math.round(polyPts.length * 0.08)));
      const endBadgeIdx = Math.max(0, Math.min(polyPts.length - 2, Math.round(polyPts.length * 0.92)));

      this.drawDiagramValueBadge(ctx, polyPts[startBadgeIdx].ox, polyPts[startBadgeIdx].oy, valStart, unit, strokeColor);
      this.drawDiagramValueBadge(ctx, polyPts[endBadgeIdx].ox, polyPts[endBadgeIdx].oy, valEnd, unit, strokeColor);

      if (peakIdx > startBadgeIdx + 2 && peakIdx < endBadgeIdx - 2 && peakAbs > 0.05) {
        this.drawDiagramValueBadge(ctx, polyPts[peakIdx].ox, polyPts[peakIdx].oy, polyPts[peakIdx].val, unit, strokeColor);
      }
    }

    ctx.restore();
  }

  drawDiagramValueBadge(ctx, x, y, value, unit, color) {
    if (Math.abs(value) < 0.01) return;
    ctx.save();
    const text = `${value > 0 ? '+' : ''}${value.toFixed(1)} ${unit}`;
    ctx.font = 'bold 9px monospace';
    const tw = ctx.measureText(text).width;
    const bw = tw + 10;
    const bh = 15;

    // Drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.14)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 1.5;

    // Pill background
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(x - bw / 2, y - bh / 2, bw, bh, 3);
    ctx.fill();

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  // Draw Deformed Shape (Curva elástica ampliada)
  drawDeformedShape(ctx) {
    if (!this.solverResults) return;
    ctx.save();

    // Find maximum displacement for magnification factor
    let maxDisp = 0;
    for (const memRes of this.solverResults.memberResults) {
      for (const s of memRes.samples) {
        const d = Math.hypot(s.dx, s.dy);
        if (d > maxDisp) maxDisp = d;
      }
    }
    if (maxDisp < 1e-7) maxDisp = 0.001;

    // Scale displacement so max deflection is visible (~40 pixels amplified)
    const ampFactor = (40 / (maxDisp * this.view.scale)) * this.resultScale;

    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';

    for (const memRes of this.solverResults.memberResults) {
      const samples = memRes.samples;
      ctx.beginPath();
      for (let i = 0; i < samples.length; i++) {
        const s = samples[i];
        const screenX = this.view.originX + (s.gx + s.dx * ampFactor) * this.view.scale;
        const screenY = this.view.originY - (s.gy + s.dy * ampFactor) * this.view.scale;
        if (i === 0) ctx.moveTo(screenX, screenY);
        else ctx.lineTo(screenX, screenY);
      }
      ctx.stroke();
    }

    // Draw deformed node rings
    for (const disp of this.solverResults.displacements) {
      const node = this.nodes.find((n) => n.id === disp.nodeId);
      if (!node) continue;
      const defX = node.x + disp.dx * ampFactor;
      const defY = node.y + disp.dy * ampFactor;
      const sp = this.toScreen(defX, defY);

      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#0284c7';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.restore();
  }

  // Draw Computed Reactions in Results Mode
  drawReactions(ctx) {
    if (!this.solverResults) return;
    ctx.save();

    for (const react of this.solverResults.reactions) {
      const node = this.nodes.find((n) => n.id === react.nodeId);
      if (!node) continue;
      const p = this.toScreen(node.x, node.y);
      const hasSupport = Boolean(node.support);

      // Horizontal reaction Rx
      if (Math.abs(react.fx) > 0.01) {
        const rLen = 40;
        const dir = react.fx > 0 ? 1 : -1;
        const tipX = p.x - dir * 4;
        const startX = p.x - dir * (rLen + 4);
        const startY = p.y;

        ctx.strokeStyle = '#059669';
        ctx.fillStyle = '#059669';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(tipX, startY);
        ctx.stroke();
        this.drawArrowHead(ctx, tipX, startY, dir > 0 ? 0 : Math.PI, 8);

        const rxText = `Rx=${Math.abs(react.fx).toFixed(1)} kN`;
        this.drawReactionBadge(ctx, rxText, startX - dir * 12, startY - 14);
      }

      // Vertical reaction Ry
      if (Math.abs(react.fy) > 0.01) {
        const isUpward = react.fy > 0;
        const tipY = isUpward ? (hasSupport ? p.y + 22 : p.y + 4) : (hasSupport ? p.y - 14 : p.y - 4);
        const startY = isUpward ? (hasSupport ? p.y + 54 : p.y + 38) : (hasSupport ? p.y - 46 : p.y - 38);
        const startX = p.x;

        ctx.strokeStyle = '#059669';
        ctx.fillStyle = '#059669';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX, tipY);
        ctx.stroke();
        this.drawArrowHead(ctx, startX, tipY, isUpward ? -Math.PI / 2 : Math.PI / 2, 8);

        const ryText = `Ry=${Math.abs(react.fy).toFixed(1)} kN`;
        const badgeY = isUpward ? startY + 12 : startY - 12;
        this.drawReactionBadge(ctx, ryText, startX, badgeY);
      }

      // Moment reaction Mz
      if (Math.abs(react.mz) > 0.01) {
        ctx.strokeStyle = '#059669';
        ctx.fillStyle = '#059669';
        ctx.lineWidth = 2.2;
        const r = 26;
        const isCCW = react.mz > 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, isCCW ? 0.3 * Math.PI : -0.3 * Math.PI, isCCW ? 1.7 * Math.PI : -1.7 * Math.PI, !isCCW);
        ctx.stroke();

        const endAngle = isCCW ? 1.7 * Math.PI : -1.7 * Math.PI;
        const ax = p.x + r * Math.cos(endAngle);
        const ay = p.y + r * Math.sin(endAngle);
        this.drawArrowHead(ctx, ax, ay, endAngle + (isCCW ? Math.PI / 2 : -Math.PI / 2), 7);

        const mzText = `Mz=${Math.abs(react.mz).toFixed(1)} kN·m`;
        this.drawReactionBadge(ctx, mzText, p.x, p.y - r - 12);
      }
    }

    ctx.restore();
  }

  drawReactionBadge(ctx, text, x, y) {
    ctx.save();
    ctx.font = 'bold 10px monospace';
    const tw = ctx.measureText(text).width;
    const bw = tw + 10;
    const bh = 16;

    ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 1;

    ctx.fillStyle = '#ecfdf5';
    ctx.beginPath();
    ctx.roundRect(x - bw / 2, y - bh / 2, bw, bh, 3);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = '#065f46';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  // Update Right Property Panel (Supports, Releases, Materials, Loads)
  updateRightPanel() {
    const tabEl = this.container.querySelector('#ftoolTabContent');
    if (!tabEl) return;

    const sel = this.selectedEntity;
    const selectedNode = sel?.type === 'node' ? this.nodes.find((n) => n.id === sel.id) : null;
    const selectedMember = sel?.type === 'member' ? this.members.find((m) => m.id === sel.id) : null;

    let html = '';

    if (this.currentTab === 'supports') {
      html = `
        <div class="ftool-group">
          <p class="ftool-group-title">Condições de Apoio (Nós)</p>
          <p style="font-size:11px;color:var(--ink-soft);margin:0;">
            ${selectedNode ? `Nó selecionado: <strong>${selectedNode.name || selectedNode.id}</strong> (X=${selectedNode.x.toFixed(2)}, Y=${selectedNode.y.toFixed(2)})` : 'Selecione um nó no canvas para aplicar ou alterar apoios.'}
          </p>
        </div>

        <div class="ftool-group">
          <p class="ftool-group-title">Predefinições de Apoio</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
            <button type="button" class="ftool-btn-secondary" data-preset="free">Livre (Sem apoio)</button>
            <button type="button" class="ftool-btn-secondary" data-preset="pinned">2ª Ordem (Articulado)</button>
            <button type="button" class="ftool-btn-secondary" data-preset="rollerY">1ª Ordem (Rolete Y)</button>
            <button type="button" class="ftool-btn-secondary" data-preset="rollerX">1ª Ordem (Rolete X)</button>
            <button type="button" class="ftool-btn-secondary" data-preset="fixed" style="grid-column:1/-1;">Engaste (3ª Ordem)</button>
          </div>
        </div>

        <div class="ftool-group">
          <p class="ftool-group-title">Restrições e Molas Detalhadas</p>
          <div class="ftool-form-row">
            <label><input type="checkbox" id="ftoolFixX" ${selectedNode?.support?.fixX ? 'checked' : ''} /> Impedir Desloc. X (Dx)</label>
          </div>
          <div class="ftool-form-row">
            <label><input type="checkbox" id="ftoolFixY" ${selectedNode?.support?.fixY ? 'checked' : ''} /> Impedir Desloc. Y (Dy)</label>
          </div>
          <div class="ftool-form-row">
            <label><input type="checkbox" id="ftoolFixRz" ${selectedNode?.support?.fixRz ? 'checked' : ''} /> Impedir Rotação Z (Rz)</label>
          </div>
          <div class="ftool-form-row">
            <label>Mola Kx (kN/m):</label>
            <input type="number" class="ftool-input" id="ftoolKx" value="${selectedNode?.support?.springKx || 0}" step="100" />
          </div>
          <div class="ftool-form-row">
            <label>Mola Ky (kN/m):</label>
            <input type="number" class="ftool-input" id="ftoolKy" value="${selectedNode?.support?.springKy || 0}" step="100" />
          </div>
          <div class="ftool-form-row">
            <label>Mola Kz (kN·m/rad):</label>
            <input type="number" class="ftool-input" id="ftoolKz" value="${selectedNode?.support?.springKz || 0}" step="100" />
          </div>
          <button type="button" class="primary-button compact-button" id="ftoolApplySupportBtn" style="margin-top:6px;" ${!selectedNode ? 'disabled' : ''}>
            Aplicar ao Nó Selecionado
          </button>
        </div>
      `;
    } else if (this.currentTab === 'releases') {
      const curRelease = selectedMember?.release || 'none';
      const isNodeHinged = Boolean(selectedNode?.hinged || selectedNode?.joint === 'articulado');

      html = `
        <div class="ftool-group">
          <p class="ftool-group-title">Rótula no Nó (Articulação Nodal)</p>
          <p style="font-size:11px;color:var(--ink-soft);margin:0 0 8px 0;">
            ${selectedNode ? `Nó selecionado: <strong>${selectedNode.name || selectedNode.id}</strong> (X=${selectedNode.x.toFixed(2)}, Y=${selectedNode.y.toFixed(2)})` : 'Selecione um <strong>nó no canvas</strong> para torná-lo articulado ou rígido.'}
          </p>
          <div class="ftool-form-row">
            <label><input type="radio" name="nodeHingeType" value="rigido" ${!isNodeHinged ? 'checked' : ''} ${!selectedNode ? 'disabled' : ''} /> Nó Rígido (Transmite momento)</label>
          </div>
          <div class="ftool-form-row">
            <label><input type="radio" name="nodeHingeType" value="articulado" ${isNodeHinged ? 'checked' : ''} ${!selectedNode ? 'disabled' : ''} /> Nó Articulado (Rótula no nó: M = 0)</label>
          </div>
          <div class="ftool-apply-row">
            <button type="button" class="primary-button compact-button" id="ftoolApplyNodeHingeBtn" ${!selectedNode ? 'disabled' : ''}>
              ${isNodeHinged ? 'Tornar Nó Rígido' : 'Inserir Rótula no Nó'}
            </button>
          </div>
        </div>

        <div class="ftool-group">
          <p class="ftool-group-title">Rótula nas Barras (Extremidade)</p>
          <p style="font-size:11px;color:var(--ink-soft);margin:0 0 8px 0;">
            ${selectedMember ? `Barra selecionada: <strong>${selectedMember.name || selectedMember.id}</strong>` : 'Selecione uma <strong>barra no canvas</strong> para configurar liberação de rotação.'}
          </p>
          <div class="ftool-form-row">
            <label><input type="radio" name="memberRelease" value="none" ${curRelease === 'none' ? 'checked' : ''} ${!selectedMember ? 'disabled' : ''} /> Sem Articulação (Rígida-Rígida)</label>
          </div>
          <div class="ftool-form-row">
            <label><input type="radio" name="memberRelease" value="both" ${curRelease === 'both' ? 'checked' : ''} ${!selectedMember ? 'disabled' : ''} /> Rótulas nas Duas Extremidades (Treliça)</label>
          </div>
          <div class="ftool-form-row">
            <label><input type="radio" name="memberRelease" value="start" ${curRelease === 'start' ? 'checked' : ''} ${!selectedMember ? 'disabled' : ''} /> Rótula apenas no Início</label>
          </div>
          <div class="ftool-form-row">
            <label><input type="radio" name="memberRelease" value="end" ${curRelease === 'end' ? 'checked' : ''} ${!selectedMember ? 'disabled' : ''} /> Rótula apenas no Fim</label>
          </div>

          <div class="ftool-apply-row">
            <button type="button" class="primary-button compact-button" id="ftoolApplyReleaseSelectedBtn" ${!selectedMember ? 'disabled' : ''}>
              Aplicar à Barra
            </button>
            <button type="button" class="outline-button compact-button" id="ftoolApplyReleaseAllBtn">
              Aplicar a Todas
            </button>
          </div>
        </div>
      `;
    } else if (this.currentTab === 'materials') {
      html = `
        <div class="ftool-group">
          <p class="ftool-group-title">Parâmetros de Material</p>
          <div class="ftool-form-row">
            <label>Material:</label>
            <select class="ftool-select" id="ftoolMatSelect">
              ${this.materials.map((m) => `<option value="${m.id}">${m.name}</option>`).join('')}
            </select>
          </div>
          <div class="ftool-apply-row">
            <button type="button" class="primary-button compact-button" id="ftoolApplyMatSelected" ${!selectedMember ? 'disabled' : ''}>Aplicar à Barra</button>
            <button type="button" class="outline-button compact-button" id="ftoolApplyMatAll">Aplicar a Todas</button>
          </div>
        </div>

        <div class="ftool-group">
          <p class="ftool-group-title">Seções Transversais</p>
          <div class="ftool-form-row">
            <label>Seção:</label>
            <select class="ftool-select" id="ftoolSecSelect">
              ${this.sections.map((s) => `<option value="${s.id}">${s.name}</option>`).join('')}
            </select>
          </div>
          <div class="ftool-apply-row">
            <button type="button" class="primary-button compact-button" id="ftoolApplySecSelected" ${!selectedMember ? 'disabled' : ''}>Aplicar à Barra</button>
            <button type="button" class="outline-button compact-button" id="ftoolApplySecAll">Aplicar a Todas</button>
          </div>
        </div>
      `;
    } else if (this.currentTab === 'loads') {
      const nodalLoad = selectedNode ? this.nodalLoads.find((l) => l.nodeId === selectedNode.id) : null;
      const distLoad = selectedMember?.distributedLoads?.[0];

      html = `
        <div class="ftool-group">
          <p class="ftool-group-title">Cargas Nodais Concentradas</p>
          <p style="font-size:11px;color:var(--ink-soft);margin:0;">
            ${selectedNode ? `Nó: <strong>${selectedNode.name || selectedNode.id}</strong>` : 'Selecione um nó no canvas.'}
          </p>
          <div class="ftool-form-row">
            <label>Força Fx (kN):</label>
            <input type="number" class="ftool-input" id="ftoolLoadFx" value="${nodalLoad?.fx || 0}" step="5" />
          </div>
          <div class="ftool-form-row">
            <label>Força Fy (kN):</label>
            <input type="number" class="ftool-input" id="ftoolLoadFy" value="${nodalLoad?.fy || 0}" step="5" />
          </div>
          <div class="ftool-form-row">
            <label>Momento Mz (kN·m):</label>
            <input type="number" class="ftool-input" id="ftoolLoadMz" value="${nodalLoad?.mz || 0}" step="5" />
          </div>
          <div class="ftool-apply-row">
            <button type="button" class="primary-button compact-button" id="ftoolApplyNodalLoadBtn" ${!selectedNode ? 'disabled' : ''}>Salvar Carga</button>
            <button type="button" class="outline-button compact-button" id="ftoolRemoveNodalLoadBtn" ${!nodalLoad ? 'disabled' : ''}>Remover</button>
          </div>
        </div>

        <div class="ftool-group">
          <p class="ftool-group-title">Cargas Distribuídas nas Barras</p>
          <p style="font-size:11px;color:var(--ink-soft);margin:0;">
            ${selectedMember ? `Barra: <strong>${selectedMember.name || selectedMember.id}</strong>` : 'Selecione uma barra no canvas.'}
          </p>
          <div class="ftool-form-row">
            <label>Direção:</label>
            <select class="ftool-select" id="ftoolDistDir">
              <option value="global" ${distLoad?.direction === 'global' ? 'selected' : ''}>Global (X, Y)</option>
              <option value="local" ${distLoad?.direction === 'local' ? 'selected' : ''}>Local (axial, normal)</option>
            </select>
          </div>
          <div class="ftool-form-row">
            <label>qx inicial (kN/m) [Horizontal]:</label>
            <input type="number" class="ftool-input" id="ftoolDistQx1" value="${distLoad?.qxi || 0}" step="5" />
          </div>
          <div class="ftool-form-row">
            <label>qx final (kN/m) [Horizontal]:</label>
            <input type="number" class="ftool-input" id="ftoolDistQx2" value="${distLoad?.qxj ?? distLoad?.qxi ?? 0}" step="5" />
          </div>
          <div class="ftool-form-row">
            <label>qy inicial (kN/m) [Vertical]:</label>
            <input type="number" class="ftool-input" id="ftoolDistQy1" value="${distLoad?.qyi || 0}" step="5" />
          </div>
          <div class="ftool-form-row">
            <label>qy final (kN/m) [Vertical]:</label>
            <input type="number" class="ftool-input" id="ftoolDistQy2" value="${distLoad?.qyj ?? distLoad?.qyi ?? 0}" step="5" />
          </div>
          <div class="ftool-apply-row">
            <button type="button" class="primary-button compact-button" id="ftoolApplyDistLoadBtn" ${!selectedMember ? 'disabled' : ''}>Salvar Carga</button>
            <button type="button" class="outline-button compact-button" id="ftoolRemoveDistLoadBtn" ${!distLoad ? 'disabled' : ''}>Remover</button>
          </div>
        </div>
      `;
    }

    tabEl.innerHTML = html;
    this.bindRightPanelEvents(selectedNode, selectedMember);
  }

  bindRightPanelEvents(selectedNode, selectedMember) {
    const tabEl = this.container.querySelector('#ftoolTabContent');
    if (!tabEl) return;

    // Supports Presets
    tabEl.querySelectorAll('[data-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!selectedNode) return;
        const preset = btn.dataset.preset;
        if (preset === 'free') {
          delete selectedNode.support;
        } else if (preset === 'pinned') {
          selectedNode.support = { fixX: true, fixY: true, fixRz: false };
        } else if (preset === 'rollerY') {
          selectedNode.support = { fixX: false, fixY: true, fixRz: false };
        } else if (preset === 'rollerX') {
          selectedNode.support = { fixX: true, fixY: false, fixRz: false };
        } else if (preset === 'fixed') {
          selectedNode.support = { fixX: true, fixY: true, fixRz: true };
        }
        this.pushHistory();
        this.solve();
        this.render();
        this.updateRightPanel();
      });
    });

    // Custom support apply
    const applySupportBtn = tabEl.querySelector('#ftoolApplySupportBtn');
    if (applySupportBtn && selectedNode) {
      applySupportBtn.addEventListener('click', () => {
        const fixX = tabEl.querySelector('#ftoolFixX').checked;
        const fixY = tabEl.querySelector('#ftoolFixY').checked;
        const fixRz = tabEl.querySelector('#ftoolFixRz').checked;
        const springKx = parseFloat(tabEl.querySelector('#ftoolKx').value) || 0;
        const springKy = parseFloat(tabEl.querySelector('#ftoolKy').value) || 0;
        const springKz = parseFloat(tabEl.querySelector('#ftoolKz').value) || 0;

        if (fixX || fixY || fixRz || springKx > 0 || springKy > 0 || springKz > 0) {
          selectedNode.support = { fixX, fixY, fixRz, springKx, springKy, springKz };
        } else {
          delete selectedNode.support;
        }
        this.pushHistory();
        this.solve();
        this.render();
        this.updateRightPanel();
      });
    }

    // Node Hinge apply
    const applyNodeHingeBtn = tabEl.querySelector('#ftoolApplyNodeHingeBtn');
    if (applyNodeHingeBtn && selectedNode) {
      applyNodeHingeBtn.addEventListener('click', () => {
        selectedNode.hinged = !selectedNode.hinged;
        selectedNode.joint = selectedNode.hinged ? 'articulado' : 'rigido';
        this.pushHistory();
        this.solve();
        this.render();
        this.updateRightPanel();
      });
    }

    tabEl.querySelectorAll('input[name="nodeHingeType"]').forEach((radio) => {
      radio.addEventListener('change', () => {
        if (!selectedNode) return;
        selectedNode.hinged = radio.value === 'articulado';
        selectedNode.joint = selectedNode.hinged ? 'articulado' : 'rigido';
        this.pushHistory();
        this.solve();
        this.render();
        this.updateRightPanel();
      });
    });

    // Release apply
    const applyRelSelBtn = tabEl.querySelector('#ftoolApplyReleaseSelectedBtn');
    const applyRelAllBtn = tabEl.querySelector('#ftoolApplyReleaseAllBtn');
    if (applyRelSelBtn && selectedMember) {
      applyRelSelBtn.addEventListener('click', () => {
        const val = tabEl.querySelector('input[name="memberRelease"]:checked')?.value || 'none';
        selectedMember.release = val;
        this.pushHistory();
        this.solve();
        this.render();
      });
    }
    if (applyRelAllBtn) {
      applyRelAllBtn.addEventListener('click', () => {
        const val = tabEl.querySelector('input[name="memberRelease"]:checked')?.value || 'none';
        this.members.forEach((m) => { m.release = val; });
        this.pushHistory();
        this.solve();
        this.render();
      });
    }

    // Materials apply
    const applyMatSel = tabEl.querySelector('#ftoolApplyMatSelected');
    const applyMatAll = tabEl.querySelector('#ftoolApplyMatAll');
    if (applyMatSel && selectedMember) {
      applyMatSel.addEventListener('click', () => {
        selectedMember.materialId = tabEl.querySelector('#ftoolMatSelect').value;
        this.solve();
        this.render();
      });
    }
    if (applyMatAll) {
      applyMatAll.addEventListener('click', () => {
        const mat = tabEl.querySelector('#ftoolMatSelect').value;
        this.members.forEach((m) => { m.materialId = mat; });
        this.solve();
        this.render();
      });
    }

    // Sections apply
    const applySecSel = tabEl.querySelector('#ftoolApplySecSelected');
    const applySecAll = tabEl.querySelector('#ftoolApplySecAll');
    if (applySecSel && selectedMember) {
      applySecSel.addEventListener('click', () => {
        selectedMember.sectionId = tabEl.querySelector('#ftoolSecSelect').value;
        this.solve();
        this.render();
      });
    }
    if (applySecAll) {
      applySecAll.addEventListener('click', () => {
        const sec = tabEl.querySelector('#ftoolSecSelect').value;
        this.members.forEach((m) => { m.sectionId = sec; });
        this.solve();
        this.render();
      });
    }

    // Nodal loads
    const applyNodalLoadBtn = tabEl.querySelector('#ftoolApplyNodalLoadBtn');
    const removeNodalLoadBtn = tabEl.querySelector('#ftoolRemoveNodalLoadBtn');
    if (applyNodalLoadBtn && selectedNode) {
      applyNodalLoadBtn.addEventListener('click', () => {
        const fx = parseFloat(tabEl.querySelector('#ftoolLoadFx').value) || 0;
        const fy = parseFloat(tabEl.querySelector('#ftoolLoadFy').value) || 0;
        const mz = parseFloat(tabEl.querySelector('#ftoolLoadMz').value) || 0;

        this.nodalLoads = this.nodalLoads.filter((l) => l.nodeId !== selectedNode.id);
        if (fx !== 0 || fy !== 0 || mz !== 0) {
          this.nodalLoads.push({ nodeId: selectedNode.id, fx, fy, mz });
        }
        this.pushHistory();
        this.solve();
        this.render();
        this.updateRightPanel();
      });
    }
    if (removeNodalLoadBtn && selectedNode) {
      removeNodalLoadBtn.addEventListener('click', () => {
        this.nodalLoads = this.nodalLoads.filter((l) => l.nodeId !== selectedNode.id);
        this.pushHistory();
        this.solve();
        this.render();
        this.updateRightPanel();
      });
    }

    // Distributed loads
    const applyDistLoadBtn = tabEl.querySelector('#ftoolApplyDistLoadBtn');
    const removeDistLoadBtn = tabEl.querySelector('#ftoolRemoveDistLoadBtn');
    if (applyDistLoadBtn && selectedMember) {
      applyDistLoadBtn.addEventListener('click', () => {
        const dir = tabEl.querySelector('#ftoolDistDir').value;
        const qxi = parseFloat(tabEl.querySelector('#ftoolDistQx1').value) || 0;
        const qxj = parseFloat(tabEl.querySelector('#ftoolDistQx2').value) || 0;
        const qyi = parseFloat(tabEl.querySelector('#ftoolDistQy1').value) || 0;
        const qyj = parseFloat(tabEl.querySelector('#ftoolDistQy2').value) || 0;

        if (qxi === 0 && qxj === 0 && qyi === 0 && qyj === 0) {
          selectedMember.distributedLoads = [];
        } else {
          selectedMember.distributedLoads = [
            { direction: dir, qxi, qxj, qyi, qyj },
          ];
        }
        this.pushHistory();
        this.solve();
        this.render();
        this.updateRightPanel();
      });
    }
    if (removeDistLoadBtn && selectedMember) {
      removeDistLoadBtn.addEventListener('click', () => {
        selectedMember.distributedLoads = [];
        this.pushHistory();
        this.solve();
        this.render();
        this.updateRightPanel();
      });
    }
  }

  // Bottom Student Results Summary
  updateResultsSummary() {
    const summaryEl = this.container.querySelector('#ftoolResultsSummary');
    if (!summaryEl) return;

    if (this.solverError) {
      summaryEl.innerHTML = `
        <div class="ftool-summary-header">
          <div class="ftool-summary-title">
            <h3>Diagnóstico Estrutural</h3>
            <span class="ftool-badge warn">Atenção</span>
          </div>
        </div>
        <p style="color:#b91c1c;margin:0;font-size:13px;line-height:1.5;">${this.solverError}</p>
      `;
      return;
    }

    if (!this.solverResults) {
      summaryEl.innerHTML = `
        <div class="ftool-summary-header">
          <div class="ftool-summary-title">
            <h3>Respostas da Estrutura para o Aluno</h3>
            <span class="ftool-badge">Aguardando cálculo</span>
          </div>
        </div>
        <p style="color:var(--ink-soft);margin:0;font-size:12px;">Desenhe ou configure sua estrutura e clique em "Calcular" para obter reações de apoio e esforços internos.</p>
      `;
      return;
    }

    const res = this.solverResults;
    const eq = res.globalEquilibrium;
    const isEquilibrado = Math.abs(eq.sumFx) < 1e-3 && Math.abs(eq.sumFy) < 1e-3;

    const reactionsRows = res.reactions.map((r) => {
      const node = this.nodes.find((n) => n.id === r.nodeId);
      return `
        <tr>
          <td><strong>${node?.name || r.nodeId}</strong></td>
          <td>${(node?.x || 0).toFixed(2)} m</td>
          <td>${(node?.y || 0).toFixed(2)} m</td>
          <td style="font-weight:700;color:var(--navy);">${r.fx.toFixed(2)} kN</td>
          <td style="font-weight:700;color:var(--navy);">${r.fy.toFixed(2)} kN</td>
          <td style="font-weight:700;color:var(--navy);">${r.mz.toFixed(2)} kN·m</td>
        </tr>
      `;
    }).join('');

    const memberRows = res.memberResults.map((mRes) => {
      const mem = this.members.find((m) => m.id === mRes.memberId);
      return `
        <tr>
          <td><strong>${mem?.name || mRes.memberId}</strong></td>
          <td>${mRes.length.toFixed(2)} m</td>
          <td>${mRes.maxN.toFixed(1)} / ${mRes.minN.toFixed(1)} kN</td>
          <td>${mRes.maxV.toFixed(1)} / ${mRes.minV.toFixed(1)} kN</td>
          <td style="font-weight:700;color:#ea580c;">${mRes.maxM.toFixed(1)} / ${mRes.minM.toFixed(1)} kN·m</td>
        </tr>
      `;
    }).join('');

    summaryEl.innerHTML = `
      <div class="ftool-summary-header">
        <div class="ftool-summary-title">
          <h3>Resumo de Resultados Estruturais (Ftool)</h3>
          <span class="ftool-badge ${isEquilibrado ? 'ok' : 'warn'}">
            ${isEquilibrado ? 'Estrutura Equilibrada' : 'Verificar Equilíbrio'}
          </span>
          <span class="ftool-badge">${this.nodes.length} nós · ${this.members.length} barras</span>
        </div>
        <div style="font-size:11px;color:var(--ink-soft);">
          ΣFx = ${eq.sumFx.toFixed(3)} kN | ΣFy = ${eq.sumFy.toFixed(3)} kN | ΣM = ${eq.sumMz.toFixed(3)} kN·m
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
        <div>
          <strong style="display:block;font-size:12px;margin-bottom:6px;color:var(--navy);">Reações de Apoio</strong>
          <div class="ftool-reactions-table-wrap">
            <table class="ftool-table">
              <thead>
                <tr>
                  <th>Nó</th>
                  <th>X</th>
                  <th>Y</th>
                  <th>Rx (kN)</th>
                  <th>Ry (kN)</th>
                  <th>Mz (kN·m)</th>
                </tr>
              </thead>
              <tbody>
                ${reactionsRows || '<tr><td colspan="6" style="text-align:center;">Nenhum apoio com reações.</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <strong style="display:block;font-size:12px;margin-bottom:6px;color:var(--navy);">Esforços Extremos por Barra</strong>
          <div class="ftool-reactions-table-wrap">
            <table class="ftool-table">
              <thead>
                <tr>
                  <th>Barra</th>
                  <th>Vão</th>
                  <th>Normal (N)</th>
                  <th>Cortante (V)</th>
                  <th>Momento (M)</th>
                </tr>
              </thead>
              <tbody>
                ${memberRows}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  exportImage() {
    const dataUrl = this.canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.download = `estrutura_ftool_${this.currentMode}.png`;
    a.href = dataUrl;
    a.click();
  }
}
