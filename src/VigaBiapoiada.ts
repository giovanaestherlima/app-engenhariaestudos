/**
 * Motor estático de uma viga biapoiada (isostática).
 *
 * Modelo:
 *   A ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━● B
 *     x = 0                            x = L
 *
 * A viga tem dois apoios simples: A em x = 0 e B em x = L.
 * Cada apoio restringe o deslocamento vertical, mas não o giro.
 * Por isso M(0) = M(L) = 0 e existem exatamente duas reações
 * verticais desconhecidas (Ra e Rb), determinadas pelo equilíbrio.
 *
 * Convenção de sinais adotada no material de referência:
 *   - Carga pontual positiva: força para BAIXO (kN).
 *   - Reação positiva: força para CIMA (kN).
 *   - Esforço normal positivo: tração na barra. Esta classe ainda não
 *     calcula esforço normal, pois modela somente cargas verticais.
 *   - Cortante positivo: causa giro horário. No corte pelo lado esquerdo,
 *     a força interna positiva atua para baixo na face do corte; assim,
 *     V(x) = Ra menos as cargas verticais descendentes à esquerda.
 *   - Momento fletor positivo: traciona a parte inferior da viga; negativo,
 *     traciona a parte superior. O diagrama deve ser desenhado no lado
 *     tracionado.
 *   - Para carga uniformemente distribuída, quando suportada, dV/dx = -q
 *     e dM/dx = V: o cortante será linear e o momento uma parábola de 2º grau.
 */

export interface CargaPontual {
  /** Magnitude da força, em kN. Positiva para baixo. */
  magnitude: number;
  /** Distância ao apoio A, em metros. */
  posicao: number;
}

export interface Reacoes {
  /** Reação vertical em A (x = 0), kN, positiva para cima. */
  ra: number;
  /** Reação vertical em B (x = L), kN, positiva para cima. */
  rb: number;
}

export class VigaBiapoiada {
  private readonly comprimento: number;
  private readonly cargas: CargaPontual[] = [];

  /**
   * @param comprimento Comprimento total L da viga, em metros (L > 0).
   */
  constructor(comprimento: number) {
    if (!Number.isFinite(comprimento) || comprimento <= 0) {
      throw new Error("O comprimento da viga deve ser um número finito maior que zero.");
    }
    this.comprimento = comprimento;
  }

  getComprimento(): number {
    return this.comprimento;
  }

  getCargas(): readonly CargaPontual[] {
    return this.cargas;
  }

  /**
   * Adiciona uma carga concentrada P na posição x, medida a partir de A.
   *
   * A carga é modelada como uma força pontual: atua numa única seção,
   * provoca um salto no diagrama de cortante e uma mudança de inclinação
   * no diagrama de momento (M continua contínuo).
   *
   * @param magnitude Força P em kN (positiva para baixo).
   * @param x Posição em metros, 0 ≤ x ≤ L.
   */
  adicionarCargaPontual(magnitude: number, x: number): void {
    this.garantirNumeroFinito(magnitude, "magnitude da carga");
    this.garantirPosicaoNaViga(x, "posição da carga");
    this.cargas.push({ magnitude, posicao: x });
  }

  /**
   * Determina as reações verticais pelos dois equilíbrios globais
   * de um corpo rígido no plano (sem carga axial):
   *
   *   ΣFy = 0  e  ΣMA = 0
   *
   * Eixo y para cima:
   *   Ra + Rb − ΣPᵢ = 0          (1)  →  Ra + Rb = ΣPᵢ
   *
   * Momentos em A, horário positivo nas cargas (Pᵢ desce e “gira”
   * a viga no sentido horário em torno de A):
   *   Rb · L − Σ(Pᵢ · xᵢ) = 0    (2)  →  Rb = Σ(Pᵢ · xᵢ) / L
   *
   * A reação Ra não aparece em (2) porque o braço em relação a A é zero.
   * Substituindo (2) em (1):
   *   Ra = ΣPᵢ − Rb
   *
   * Equivalente (momentos em B):
   *   Ra = Σ(Pᵢ · (L − xᵢ)) / L
   *
   * São duas equações e duas incógnitas: a estrutura é isostática.
   */
  calcularReacoes(): Reacoes {
    const L = this.comprimento;

    // Resultante de todas as cargas pontuais (kN, para baixo).
    const somaForcas = this.cargas.reduce((acc, carga) => acc + carga.magnitude, 0);

    // Momento das cargas em relação a A: P · x  (kN·m).
    const somaMomentosEmA = this.cargas.reduce(
      (acc, carga) => acc + carga.magnitude * carga.posicao,
      0,
    );

    // Eq. (2): ΣMA = 0  ⇒  Rb = (Σ Pᵢ xᵢ) / L
    const rb = somaMomentosEmA / L;

    // Eq. (1): ΣFy = 0  ⇒  Ra = ΣPᵢ − Rb
    const ra = somaForcas - rb;

    return { ra, rb };
  }

  /**
   * Esforço cortante V(x) numa seção a x metros de A.
   *
  * Método das seções: corta-se a viga em x e equilibra-se o trecho
  * à ESQUERDA. Pela convenção adotada, o cortante positivo causa giro
  * horário; na face direita deste trecho, sua força interna aponta para
  * baixo. O equilíbrio resulta em:
   *
   *   V(x) = Ra − Σ Pᵢ    para toda carga com xᵢ ≤ x
   *
   * Interpretação:
   *   - Logo à direita de A, V = +Ra (a reação “sobe” o trecho esquerdo).
   *   - Ao atravessar uma carga pontual para baixo, V diminui de um salto
   *     igual a P (descontinuidade do diagrama de cortante).
   *   - Em x = L inclui-se também Rb, e o equilíbrio global exige V(L) = 0.
   *
   * Na seção exata de uma carga concentrada o cortante é descontínuo.
   * Esta implementação devolve o valor imediatamente à DIREITA da seção
   * (a carga em xᵢ = x já foi descontada).
   */
  calcularCortante(x: number): number {
    this.garantirPosicaoNaViga(x, "posição do cortante");

    const { ra, rb } = this.calcularReacoes();
    let v = ra;

    for (const carga of this.cargas) {
      if (carga.posicao <= x) {
        v -= carga.magnitude;
      }
    }

    // Em x = L a reação B também atua na seção (apoio da extremidade direita).
    if (x >= this.comprimento) {
      v += rb;
    }

    return v;
  }

  /**
   * Momento fletor M(x) numa seção a x metros de A.
   *
   * De novo pelo trecho à esquerda: o momento interno equilibra os
   * momentos das forças externas à esquerda da seção.
   *
   *   M(x) = Ra · x − Σ Pᵢ · (x − xᵢ)    para toda carga com xᵢ ≤ x
   *
   * O termo Ra · x é o momento da reação A (braço = x).
   * Cada carga à esquerda contribui com Pᵢ vezes o braço (x − xᵢ).
   * Carga exatamente em x tem braço nulo e não altera M — por isso
   * o diagrama de momento é contínuo, mesmo com salto no cortante.
   *
   * Relação diferencial (útil para conferência):
   *   dM/dx = V(x)     (fora dos pontos de carga concentrada)
   *   dV/dx = −q(x)    (aqui q = 0 entre as cargas pontuais)
   *
   * Condições de contorno da biapoiada: M(0) = 0 e M(L) = 0.
   */
  calcularMomentoFletor(x: number): number {
    this.garantirPosicaoNaViga(x, "posição do momento");

    const { ra } = this.calcularReacoes();
    let m = ra * x;

    for (const carga of this.cargas) {
      if (carga.posicao <= x) {
        m -= carga.magnitude * (x - carga.posicao);
      }
    }

    return m;
  }

  private garantirNumeroFinito(valor: number, nome: string): void {
    if (!Number.isFinite(valor)) {
      throw new Error(`A ${nome} deve ser um número finito.`);
    }
  }

  private garantirPosicaoNaViga(x: number, nome: string): void {
    this.garantirNumeroFinito(x, nome);
    if (x < 0 || x > this.comprimento) {
      throw new Error(`${nome} deve estar entre 0 e ${this.comprimento} m (comprimento da viga).`);
    }
  }
}
