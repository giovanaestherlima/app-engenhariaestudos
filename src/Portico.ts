export type LadoLocal = "+n" | "-n";
export type TipoApoio = "articulado" | "rolete" | "engaste";
export type TipoLigacaoNo = "rigido" | "rotula";

export interface Vetor2D {
  x: number;
  y: number;
}

export interface ForcaExtremidade {
  fx: number;
  fy: number;
  momento: number;
}

export interface EsforcosInternos {
  normal: number;
  cortante: number;
  momento: number;
  faceLocalTracionada: LadoLocal | "nenhuma";
  faceTracionada: "interna" | "externa" | "indeterminada" | "nenhuma";
}

export interface ReacaoApoio {
  apoio: Apoio;
  fx: number;
  fy: number;
  momento: number;
}

export interface EquilibrioGlobal {
  somaFx: number;
  somaFy: number;
  somaMomentos: number;
}

export interface EquilibrioNodal {
  no: No;
  somaFx: number;
  somaFy: number;
  somaMomentos: number;
}

interface CargaPontualBarra {
  posicao: number;
  fx: number;
  fy: number;
}

interface CargaDistribuidaBarra {
  qx: number;
  qy: number;
  inicio: number;
  fim: number;
}

interface MomentoPontualBarra {
  posicao: number;
  momento: number;
}

interface CargaNo {
  no: No;
  fx: number;
  fy: number;
  momento: number;
}

interface IncognitaReacao {
  apoio: Apoio;
  componente: "fx" | "fy" | "momento" | "direcao";
  direcao: Vetor2D;
}

interface IndicesExtremidades {
  fxInicial: number;
  fyInicial: number;
  mInicial: number;
  fxFinal: number;
  fyFinal: number;
  mFinal: number;
}

const TOLERANCIA_GEOMETRICA = 1e-10;

function exigirNumeroFinito(valor: number, nome: string): void {
  if (!Number.isFinite(valor)) {
    throw new Error(`${nome} deve ser um número finito.`);
  }
}

function produtoVetorial(a: Vetor2D, b: Vetor2D): number {
  return a.x * b.y - a.y * b.x;
}

function normalizar(vetor: Vetor2D): Vetor2D {
  const modulo = Math.hypot(vetor.x, vetor.y);
  if (modulo <= TOLERANCIA_GEOMETRICA) {
    throw new Error("A direção da reação do rolete não pode ser nula.");
  }
  return { x: vetor.x / modulo, y: vetor.y / modulo };
}

/** Ponto geométrico do pórtico, em metros. */
export class No {
  readonly x: number;
  readonly y: number;
  readonly nome: string;
  readonly tipoLigacao: TipoLigacaoNo;

  constructor(x: number, y: number, nome = "", tipoLigacao: TipoLigacaoNo = "rigido") {
    exigirNumeroFinito(x, "A coordenada X do nó");
    exigirNumeroFinito(y, "A coordenada Y do nó");
    this.x = x;
    this.y = y;
    this.nome = nome;
    this.tipoLigacao = tipoLigacao;
  }

  /**
   * Soma as ações externas no nó e as ações opostas às forças de extremidade
   * exercidas sobre as barras. Momentos positivos são anti-horários globais.
   */
  calcularEquilibrioNodal(
    acoesNasBarras: readonly ForcaExtremidade[],
    acoesExternas: readonly ForcaExtremidade[] = [],
  ): ForcaExtremidade {
    const equilibrio = { fx: 0, fy: 0, momento: 0 };
    for (const acao of acoesNasBarras) {
      equilibrio.fx -= acao.fx;
      equilibrio.fy -= acao.fy;
      equilibrio.momento -= acao.momento;
    }
    for (const acao of acoesExternas) {
      equilibrio.fx += acao.fx;
      equilibrio.fy += acao.fy;
      equilibrio.momento += acao.momento;
    }
    return equilibrio;
  }
}

/** Barra reta entre dois nós, com cargas definidas em eixos globais. */
export class Barra {
  readonly noInicial: No;
  readonly noFinal: No;
  readonly nome: string;
  readonly comprimento: number;
  readonly c: number;
  readonly s: number;
  private readonly cargasPontuais: CargaPontualBarra[] = [];
  private readonly cargasDistribuidas: CargaDistribuidaBarra[] = [];
  private readonly momentosPontuais: MomentoPontualBarra[] = [];
  private ladoInterno: LadoLocal | undefined;

  constructor(noInicial: No, noFinal: No, nome = "") {
    const dx = noFinal.x - noInicial.x;
    const dy = noFinal.y - noInicial.y;
    const comprimento = Math.hypot(dx, dy);
    if (comprimento <= TOLERANCIA_GEOMETRICA) {
      throw new Error("Uma barra deve ter comprimento maior que zero.");
    }

    this.noInicial = noInicial;
    this.noFinal = noFinal;
    this.nome = nome;
    this.comprimento = comprimento;
    this.c = dx / comprimento;
    this.s = dy / comprimento;
  }

  /**
   * Adiciona uma força pontual em uma posição medida do nó inicial.
   * Fx e Fy usam os eixos globais: direita e cima são positivos.
   */
  adicionarCargaPontual(posicao: number, fx: number, fy: number): void {
    exigirNumeroFinito(fx, "A componente Fx da carga");
    exigirNumeroFinito(fy, "A componente Fy da carga");
    this.validarPosicao(posicao, "posição da carga pontual");
    this.cargasPontuais.push({ posicao, fx, fy });
  }

  /**
   * Adiciona carga distribuída uniforme em um intervalo da barra.
   * qx e qy são intensidades nos eixos globais, em kN/m.
   */
  adicionarCargaDistribuida(
    qx: number,
    qy: number,
    inicio = 0,
    fim = this.comprimento,
  ): void {
    exigirNumeroFinito(qx, "A intensidade qx");
    exigirNumeroFinito(qy, "A intensidade qy");
    this.validarPosicao(inicio, "início da carga distribuída");
    this.validarPosicao(fim, "fim da carga distribuída");
    if (fim <= inicio) {
      throw new Error("O fim da carga distribuída deve ser maior que o início.");
    }
    this.cargasDistribuidas.push({ qx, qy, inicio, fim });
  }

  /** Momento pontual aplicado, positivo no sentido anti-horário global. */
  adicionarMomentoConcentrado(momento: number, posicao: number): void {
    exigirNumeroFinito(momento, "O momento concentrado");
    this.validarPosicao(posicao, "posição do momento concentrado");
    this.momentosPontuais.push({ posicao, momento });
  }

  /** Define qual lado da barra aponta para o interior do pórtico. */
  definirFaceInterna(lado: LadoLocal): void {
    this.ladoInterno = lado;
  }

  getCargasPontuais(): readonly CargaPontualBarra[] {
    return this.cargasPontuais;
  }

  getCargasDistribuidas(): readonly CargaDistribuidaBarra[] {
    return this.cargasDistribuidas;
  }

  getMomentosPontuais(): readonly MomentoPontualBarra[] {
    return this.momentosPontuais;
  }

  getFaceInterna(): LadoLocal | undefined {
    return this.ladoInterno;
  }

  /**
   * Executa um corte virtual a partir do nó inicial e equilibra o trecho
   * isolado à esquerda da seção. As ações nodais de extremidade estão em
   * eixos globais; são projetadas nos eixos locais da barra antes do retorno.
   */
  calcularEsforcosInternos(
    posicao: number,
    acaoNaExtremidadeInicial: ForcaExtremidade,
  ): EsforcosInternos {
    this.validarPosicao(posicao, "posição da seção");

    const tangente = { x: this.c, y: this.s };
    const normalLocal = { x: -this.s, y: this.c };
    let fx = acaoNaExtremidadeInicial.fx;
    let fy = acaoNaExtremidadeInicial.fy;
    let momentoExterno = acaoNaExtremidadeInicial.momento + produtoVetorial(
      { x: -posicao * tangente.x, y: -posicao * tangente.y },
      { x: acaoNaExtremidadeInicial.fx, y: acaoNaExtremidadeInicial.fy },
    );

    // Cargas pontuais interiores à esquerda do corte; o valor na seção de
    // descontinuidade corresponde ao lado imediatamente à direita da carga.
    for (const carga of this.cargasPontuais) {
      if (carga.posicao <= 0 || carga.posicao >= this.comprimento || carga.posicao > posicao) {
        continue;
      }
      fx += carga.fx;
      fy += carga.fy;
      const bracoLocal = carga.posicao - posicao;
      momentoExterno += bracoLocal * produtoVetorial(
        tangente,
        { x: carga.fx, y: carga.fy },
      );
    }

    for (const carga of this.cargasDistribuidas) {
      const inicio = Math.max(carga.inicio, 0);
      const fim = Math.min(carga.fim, posicao);
      if (fim <= inicio) continue;

      const extensao = fim - inicio;
      const resultante = { x: carga.qx * extensao, y: carga.qy * extensao };
      const centroide = (inicio + fim) / 2;
      fx += resultante.x;
      fy += resultante.y;
      momentoExterno += (centroide - posicao) * produtoVetorial(tangente, resultante);
    }

    for (const carga of this.momentosPontuais) {
      if (carga.posicao > 0 && carga.posicao < this.comprimento && carga.posicao <= posicao) {
        momentoExterno += carga.momento;
      }
    }

    // N positivo traciona; V positivo causa giro horário; M positivo traciona
    // o lado local -n. A componente global paralela/perpendicular a t vira N/V.
    const normal = -(fx * tangente.x + fy * tangente.y);
    const cortante = fx * normalLocal.x + fy * normalLocal.y;
    const momento = -momentoExterno;
    const faceLocalTracionada: EsforcosInternos["faceLocalTracionada"] =
      Math.abs(momento) <= 1e-9 ? "nenhuma" : momento > 0 ? "-n" : "+n";
    let faceTracionada: EsforcosInternos["faceTracionada"] = "indeterminada";

    if (faceLocalTracionada === "nenhuma") {
      faceTracionada = "nenhuma";
    } else if (this.ladoInterno) {
      faceTracionada = faceLocalTracionada === this.ladoInterno ? "interna" : "externa";
    }

    return { normal, cortante, momento, faceLocalTracionada, faceTracionada };
  }

  private validarPosicao(posicao: number, nome: string): void {
    exigirNumeroFinito(posicao, nome);
    if (posicao < 0 || posicao > this.comprimento) {
      throw new Error(`${nome} deve estar entre 0 e ${this.comprimento} m.`);
    }
  }
}

/** Apoio externo. Rolete reage na direção fornecida; momentos em kN.m. */
export class Apoio {
  readonly no: No;
  readonly tipo: TipoApoio;
  readonly direcaoReacao: Vetor2D | undefined;

  constructor(no: No, tipo: TipoApoio, direcaoReacao?: Vetor2D) {
    if (tipo === "rolete" && !direcaoReacao) {
      throw new Error("Informe a direção da reação do apoio tipo rolete.");
    }
    this.no = no;
    this.tipo = tipo;
    this.direcaoReacao = direcaoReacao ? normalizar(direcaoReacao) : undefined;
  }
}

interface ResultadoExtremidade {
  barra: Barra;
  inicial: ForcaExtremidade;
  final: ForcaExtremidade;
}

/** Solução de equilíbrio e consulta de esforços em qualquer seção das barras. */
export class ResultadoPortico {
  readonly reacoes: readonly ReacaoApoio[];
  readonly extremidades: readonly ResultadoExtremidade[];
  readonly equilibrioGlobal: EquilibrioGlobal;
  readonly equilibrioNodal: readonly EquilibrioNodal[];

  constructor(
    reacoes: ReacaoApoio[],
    extremidades: ResultadoExtremidade[],
    equilibrioGlobal: EquilibrioGlobal,
    equilibrioNodal: EquilibrioNodal[],
  ) {
    this.reacoes = reacoes;
    this.extremidades = extremidades;
    this.equilibrioGlobal = equilibrioGlobal;
    this.equilibrioNodal = equilibrioNodal;
  }

  calcularEsforcosNaBarra(barra: Barra, posicao: number): EsforcosInternos {
    const resultado = this.extremidades.find((item) => item.barra === barra);
    if (!resultado) {
      throw new Error("A barra informada não pertence a este resultado.");
    }
    return barra.calcularEsforcosInternos(posicao, resultado.inicial);
  }
}

/**
 * Modelo de pórtico plano composto por barras retas e nós rígidos.
 * Resolve estruturas estaticamente determinadas apenas por equilíbrio.
 */
export class Portico {
  private readonly nos: No[] = [];
  private readonly barras: Barra[] = [];
  private readonly apoios: Apoio[] = [];
  private readonly cargasNos: CargaNo[] = [];

  adicionarNo(no: No): void {
    if (this.nos.includes(no)) throw new Error("O nó já foi adicionado ao pórtico.");
    this.nos.push(no);
  }

  adicionarBarra(barra: Barra): void {
    if (!this.nos.includes(barra.noInicial) || !this.nos.includes(barra.noFinal)) {
      throw new Error("Adicione os nós inicial e final ao pórtico antes da barra.");
    }
    if (this.barras.includes(barra)) throw new Error("A barra já foi adicionada ao pórtico.");
    this.barras.push(barra);
  }

  adicionarApoio(apoio: Apoio): void {
    if (!this.nos.includes(apoio.no)) throw new Error("O nó do apoio não pertence ao pórtico.");
    this.apoios.push(apoio);
  }

  adicionarCargaNo(no: No, fx: number, fy: number, momento = 0): void {
    if (!this.nos.includes(no)) throw new Error("O nó da carga não pertence ao pórtico.");
    exigirNumeroFinito(fx, "A carga nodal Fx");
    exigirNumeroFinito(fy, "A carga nodal Fy");
    exigirNumeroFinito(momento, "O momento nodal");
    this.cargasNos.push({ no, fx, fy, momento });
  }

  getNos(): readonly No[] {
    return this.nos;
  }

  getBarras(): readonly Barra[] {
    return this.barras;
  }

  getApoios(): readonly Apoio[] {
    return this.apoios;
  }

  /**
   * Calcula g_h = RT - GL do material de referência para o modelo plano.
   * Cada barra livre tem 3 GL; uma conexão rígida entre n barras restringe
   * 3(n-1) movimentos e uma rótula interna restringe 2(n-1).
   */
  calcularGrauEstaticidade(): number {
    let retencaoTotal = 0;
    for (const apoio of this.apoios) {
      retencaoTotal += apoio.tipo === "engaste" ? 3 : apoio.tipo === "articulado" ? 2 : 1;
    }

    for (const no of this.nos) {
      const barrasConcorrentes = this.barras.filter(
        (barra) => barra.noInicial === no || barra.noFinal === no,
      ).length;
      if (barrasConcorrentes < 2) continue;
      const restricoesPorConexao = no.tipoLigacao === "rotula" ? 2 : 3;
      retencaoTotal += restricoesPorConexao * (barrasConcorrentes - 1);
    }

    return retencaoTotal - 3 * this.barras.length;
  }

  /**
   * Resolve reações globais e esforços de extremidade por equilíbrio.
   * As equações de cada barra e nó cancelam as ações internas; sua soma
   * equivale a ΣFx = 0, ΣFy = 0 e ΣMp = 0 para o pórtico completo.
   */
  resolver(): ResultadoPortico {
    if (this.barras.length === 0) throw new Error("O pórtico precisa ter ao menos uma barra.");

    const grauEstaticidade = this.calcularGrauEstaticidade();
    if (grauEstaticidade !== 0) {
      throw new Error(
        `O pórtico não é isostático pelo grau g_h = ${grauEstaticidade}. ` +
        "O solver de equilíbrio requer g_h = 0.",
      );
    }

    for (const no of this.nos) {
      if (no.tipoLigacao !== "rotula") continue;
      const barrasConcorrentes = this.barras.filter(
        (barra) => barra.noInicial === no || barra.noFinal === no,
      ).length;
      if (barrasConcorrentes < 2) {
        throw new Error("Uma rótula interna deve conectar pelo menos duas barras.");
      }
      if (this.apoios.some((apoio) => apoio.no === no && apoio.tipo === "engaste")) {
        throw new Error("Um nó rotulado não pode ter apoio externo do tipo engaste.");
      }
      if (Math.abs(this.resultanteNo(no).momento) > 1e-10) {
        throw new Error("Não se pode aplicar momento concentrado diretamente em uma rótula.");
      }
    }

    const indices = new Map<Barra, IndicesExtremidades>();
    let proximoIndice = 0;
    for (const barra of this.barras) {
      indices.set(barra, {
        fxInicial: proximoIndice++,
        fyInicial: proximoIndice++,
        mInicial: proximoIndice++,
        fxFinal: proximoIndice++,
        fyFinal: proximoIndice++,
        mFinal: proximoIndice++,
      });
    }

    const incognitasReacao: Array<IncognitaReacao | undefined> =
      Array(6 * this.barras.length).fill(undefined);
    const indicesReacao = new Map<Apoio, number[]>();
    for (const apoio of this.apoios) {
      const indicesDoApoio: number[] = [];
      if (apoio.tipo === "articulado" || apoio.tipo === "engaste") {
        indicesDoApoio.push(proximoIndice);
        incognitasReacao[proximoIndice] = {
          apoio,
          componente: "fx",
          direcao: { x: 1, y: 0 },
        };
        proximoIndice += 1;
        indicesDoApoio.push(proximoIndice);
        incognitasReacao[proximoIndice] = {
          apoio,
          componente: "fy",
          direcao: { x: 0, y: 1 },
        };
        proximoIndice += 1;
      } else {
        indicesDoApoio.push(proximoIndice);
        incognitasReacao[proximoIndice] = {
          apoio,
          componente: "direcao",
          direcao: apoio.direcaoReacao!,
        };
        proximoIndice += 1;
      }
      if (apoio.tipo === "engaste") {
        indicesDoApoio.push(proximoIndice);
        incognitasReacao[proximoIndice] = {
          apoio,
          componente: "momento",
          direcao: { x: 0, y: 0 },
        };
        proximoIndice += 1;
      }
      indicesReacao.set(apoio, indicesDoApoio);
    }

    const quantidadeEquacoes = 3 * this.barras.length + this.nos.reduce((total, no) => {
      const barrasConcorrentes = this.barras.filter(
        (barra) => barra.noInicial === no || barra.noFinal === no,
      ).length;
      return total + (no.tipoLigacao === "rotula"
        ? 2 + barrasConcorrentes
        : 3);
    }, 0);
    if (quantidadeEquacoes !== proximoIndice) {
      throw new Error(
        `O sistema não é isostático pelo modelo de equilíbrio: ${proximoIndice} incógnitas ` +
        `e ${quantidadeEquacoes} equações. Verifique apoios, conectividade e vínculos internos.`,
      );
    }

    const matriz: number[][] = [];
    const termosIndependentes: number[] = [];
    const novaEquacao = (termoIndependente: number): number[] => {
      matriz.push(Array(proximoIndice).fill(0));
      termosIndependentes.push(termoIndependente);
      return matriz[matriz.length - 1];
    };

    // Equilíbrio de cada barra como corpo rígido: ΣFx = 0, ΣFy = 0 e
    // ΣM(no inicial) = 0. Cargas de extremidade são nodais e ficam fora
    // deste corpo livre; cargas interiores entram por sua resultante.
    for (const barra of this.barras) {
      const indicesBarra = indices.get(barra)!;
      const carga = this.resultanteInterior(barra);

      let equacao = novaEquacao(-carga.fx);
      equacao[indicesBarra.fxInicial] = 1;
      equacao[indicesBarra.fxFinal] = 1;

      equacao = novaEquacao(-carga.fy);
      equacao[indicesBarra.fyInicial] = 1;
      equacao[indicesBarra.fyFinal] = 1;

      equacao = novaEquacao(-carga.momentoNoInicial);
      equacao[indicesBarra.mInicial] = 1;
      equacao[indicesBarra.mFinal] = 1;
      equacao[indicesBarra.fxFinal] = -barra.comprimento * barra.s;
      equacao[indicesBarra.fyFinal] = barra.comprimento * barra.c;
    }

    // Equilíbrio nodal: barras sempre transmitem Fx e Fy. Nós rígidos também
    // equilibram os momentos de extremidade, transferindo momento entre viga
    // e pilar. Na rótula, não existe equilíbrio de momento compartilhado:
    // cada extremidade conectada recebe sua própria equação M = 0, enquanto
    // as duas equações de força mantêm a transmissão horizontal e vertical.
    for (const no of this.nos) {
      const cargaNo = this.resultanteNo(no);
      let equacaoFx = novaEquacao(-cargaNo.fx);
      let equacaoFy = novaEquacao(-cargaNo.fy);
      const equacaoM = no.tipoLigacao === "rigido"
        ? novaEquacao(-cargaNo.momento)
        : undefined;

      for (const barra of this.barras) {
        const indicesBarra = indices.get(barra)!;
        if (barra.noInicial === no) {
          equacaoFx[indicesBarra.fxInicial] -= 1;
          equacaoFy[indicesBarra.fyInicial] -= 1;
          if (equacaoM) {
            equacaoM[indicesBarra.mInicial] -= 1;
          } else {
            const momentoRotula = novaEquacao(0);
            momentoRotula[indicesBarra.mInicial] = 1;
          }
        }
        if (barra.noFinal === no) {
          equacaoFx[indicesBarra.fxFinal] -= 1;
          equacaoFy[indicesBarra.fyFinal] -= 1;
          if (equacaoM) {
            equacaoM[indicesBarra.mFinal] -= 1;
          } else {
            const momentoRotula = novaEquacao(0);
            momentoRotula[indicesBarra.mFinal] = 1;
          }
        }
      }

      for (const apoio of this.apoios) {
        if (apoio.no !== no) continue;
        const indicesDoApoio = indicesReacao.get(apoio)!;
        for (const indice of indicesDoApoio) {
          const reacao = incognitasReacao[indice]!;
          if (reacao.componente === "momento") {
            if (equacaoM) equacaoM[indice] += 1;
          } else {
            equacaoFx[indice] += reacao.direcao.x;
            equacaoFy[indice] += reacao.direcao.y;
          }
        }
      }
    }

    const solucao = this.resolverSistema(matriz, termosIndependentes);
    const reacoes = this.apoios.map((apoio) => {
      const reacao = { apoio, fx: 0, fy: 0, momento: 0 };
      for (const indice of indicesReacao.get(apoio)!) {
        const incognita = incognitasReacao[indice]!;
        const valor = solucao[indice];
        if (incognita.componente === "momento") reacao.momento = valor;
        else {
          reacao.fx += valor * incognita.direcao.x;
          reacao.fy += valor * incognita.direcao.y;
        }
      }
      return reacao;
    });

    const extremidades = this.barras.map((barra) => {
      const item = indices.get(barra)!;
      return {
        barra,
        inicial: {
          fx: solucao[item.fxInicial],
          fy: solucao[item.fyInicial],
          momento: solucao[item.mInicial],
        },
        final: {
          fx: solucao[item.fxFinal],
          fy: solucao[item.fyFinal],
          momento: solucao[item.mFinal],
        },
      };
    });

    const equilibrioGlobal = this.calcularEquilibrioGlobal(reacoes);
    const equilibrioNodal = this.nos.map((no) => {
      const acoesNasBarras: ForcaExtremidade[] = [];
      for (const extremidade of extremidades) {
        if (extremidade.barra.noInicial === no) acoesNasBarras.push(extremidade.inicial);
        if (extremidade.barra.noFinal === no) acoesNasBarras.push(extremidade.final);
      }

      const acaoExterna = this.resultanteNo(no);
      for (const reacao of reacoes) {
        if (reacao.apoio.no !== no) continue;
        acaoExterna.fx += reacao.fx;
        acaoExterna.fy += reacao.fy;
        acaoExterna.momento += reacao.momento;
      }

      const residual = no.calcularEquilibrioNodal(acoesNasBarras, [acaoExterna]);
      return { no, somaFx: residual.fx, somaFy: residual.fy, somaMomentos: residual.momento };
    });
    return new ResultadoPortico(reacoes, extremidades, equilibrioGlobal, equilibrioNodal);
  }

  private calcularEquilibrioGlobal(reacoes: ReacaoApoio[]): EquilibrioGlobal {
    const equilibrio: EquilibrioGlobal = { somaFx: 0, somaFy: 0, somaMomentos: 0 };
    const somarForca = (x: number, y: number, fx: number, fy: number): void => {
      equilibrio.somaFx += fx;
      equilibrio.somaFy += fy;
      equilibrio.somaMomentos += x * fy - y * fx;
    };

    for (const carga of this.cargasNos) {
      somarForca(carga.no.x, carga.no.y, carga.fx, carga.fy);
      equilibrio.somaMomentos += carga.momento;
    }

    for (const barra of this.barras) {
      for (const carga of barra.getCargasPontuais()) {
        const x = barra.noInicial.x + carga.posicao * barra.c;
        const y = barra.noInicial.y + carga.posicao * barra.s;
        somarForca(x, y, carga.fx, carga.fy);
      }
      for (const carga of barra.getCargasDistribuidas()) {
        const extensao = carga.fim - carga.inicio;
        const posicaoCentroide = (carga.inicio + carga.fim) / 2;
        const x = barra.noInicial.x + posicaoCentroide * barra.c;
        const y = barra.noInicial.y + posicaoCentroide * barra.s;
        somarForca(x, y, carga.qx * extensao, carga.qy * extensao);
      }
      for (const carga of barra.getMomentosPontuais()) {
        equilibrio.somaMomentos += carga.momento;
      }
    }

    for (const reacao of reacoes) {
      somarForca(reacao.apoio.no.x, reacao.apoio.no.y, reacao.fx, reacao.fy);
      equilibrio.somaMomentos += reacao.momento;
    }

    return equilibrio;
  }

  private resultanteInterior(barra: Barra): {
    fx: number;
    fy: number;
    momentoNoInicial: number;
  } {
    let fx = 0;
    let fy = 0;
    let momentoNoInicial = 0;

    for (const carga of barra.getCargasPontuais()) {
      if (carga.posicao <= 0 || carga.posicao >= barra.comprimento) continue;
      fx += carga.fx;
      fy += carga.fy;
      momentoNoInicial += carga.posicao * (barra.c * carga.fy - barra.s * carga.fx);
    }

    for (const carga of barra.getCargasDistribuidas()) {
      const extensao = carga.fim - carga.inicio;
      const resultante = { x: carga.qx * extensao, y: carga.qy * extensao };
      const centroide = (carga.inicio + carga.fim) / 2;
      fx += resultante.x;
      fy += resultante.y;
      momentoNoInicial += centroide * (barra.c * resultante.y - barra.s * resultante.x);
    }

    for (const carga of barra.getMomentosPontuais()) {
      if (carga.posicao > 0 && carga.posicao < barra.comprimento) {
        momentoNoInicial += carga.momento;
      }
    }

    return { fx, fy, momentoNoInicial };
  }

  private resultanteNo(no: No): { fx: number; fy: number; momento: number } {
    const resultante = { fx: 0, fy: 0, momento: 0 };
    for (const carga of this.cargasNos) {
      if (carga.no === no) {
        resultante.fx += carga.fx;
        resultante.fy += carga.fy;
        resultante.momento += carga.momento;
      }
    }

    // Uma força ou um momento aplicado exatamente na ponta de uma barra
    // pertence ao nó, não ao interior do corpo livre da barra.
    for (const barra of this.barras) {
      for (const carga of barra.getCargasPontuais()) {
        if ((carga.posicao === 0 && barra.noInicial === no) ||
          (carga.posicao === barra.comprimento && barra.noFinal === no)) {
          resultante.fx += carga.fx;
          resultante.fy += carga.fy;
        }
      }
      for (const carga of barra.getMomentosPontuais()) {
        if ((carga.posicao === 0 && barra.noInicial === no) ||
          (carga.posicao === barra.comprimento && barra.noFinal === no)) {
          resultante.momento += carga.momento;
        }
      }
    }
    return resultante;
  }

  private resolverSistema(matriz: number[][], termos: number[]): number[] {
    const ordem = termos.length;
    const aumentada = matriz.map((linha, indice) => [...linha, termos[indice]]);
    const escala = Math.max(1, ...matriz.flat().map(Math.abs));
    const tolerancia = escala * 1e-12;

    for (let coluna = 0; coluna < ordem; coluna += 1) {
      let pivo = coluna;
      for (let linha = coluna + 1; linha < ordem; linha += 1) {
        if (Math.abs(aumentada[linha][coluna]) > Math.abs(aumentada[pivo][coluna])) {
          pivo = linha;
        }
      }
      if (Math.abs(aumentada[pivo][coluna]) <= tolerancia) {
        throw new Error(
          "O sistema de equilíbrio é singular: a estrutura pode ser instável ou hiperestática.",
        );
      }

      [aumentada[coluna], aumentada[pivo]] = [aumentada[pivo], aumentada[coluna]];
      const divisor = aumentada[coluna][coluna];
      for (let j = coluna; j <= ordem; j += 1) aumentada[coluna][j] /= divisor;

      for (let linha = 0; linha < ordem; linha += 1) {
        if (linha === coluna) continue;
        const fator = aumentada[linha][coluna];
        if (Math.abs(fator) <= tolerancia) continue;
        for (let j = coluna; j <= ordem; j += 1) {
          aumentada[linha][j] -= fator * aumentada[coluna][j];
        }
      }
    }

    return aumentada.map((linha) => linha[ordem]);
  }
}