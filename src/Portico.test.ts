import assert from "node:assert/strict";
import { test } from "node:test";
import { Apoio, Barra, No, Portico } from "./Portico.ts";

const quaseIgual = (obtido: number, esperado: number, tolerancia = 1e-9) => {
  assert.ok(
    Math.abs(obtido - esperado) < tolerancia,
    `esperado ${esperado}, obtido ${obtido}`,
  );
};

const verificarEquilibrioGlobal = (resultado: ReturnType<Portico["resolver"]>) => {
  quaseIgual(resultado.equilibrioGlobal.somaFx, 0);
  quaseIgual(resultado.equilibrioGlobal.somaFy, 0);
  quaseIgual(resultado.equilibrioGlobal.somaMomentos, 0);
  for (const equilibrio of resultado.equilibrioNodal) {
    quaseIgual(equilibrio.somaFx, 0);
    quaseIgual(equilibrio.somaFy, 0);
    quaseIgual(equilibrio.somaMomentos, 0);
  }
};

test("pilar em balanço: reação horizontal e momento na base", () => {
  const base = new No(0, 0, "A");
  const topo = new No(0, 2, "B");
  const pilar = new Barra(base, topo, "AB");
  pilar.definirFaceInterna("+n");

  const portico = new Portico();
  portico.adicionarNo(base);
  portico.adicionarNo(topo);
  portico.adicionarBarra(pilar);
  portico.adicionarApoio(new Apoio(base, "engaste"));
  portico.adicionarCargaNo(topo, 10, 0);

  const resultado = portico.resolver();
  verificarEquilibrioGlobal(resultado);
  quaseIgual(resultado.reacoes[0].fx, -10);
  quaseIgual(resultado.reacoes[0].fy, 0);
  quaseIgual(resultado.reacoes[0].momento, 20);

  const esforcosNaBase = resultado.calcularEsforcosNaBarra(pilar, 0);
  quaseIgual(esforcosNaBase.normal, 0);
  quaseIgual(esforcosNaBase.cortante, 10);
  quaseIgual(esforcosNaBase.momento, -20);
  assert.equal(esforcosNaBase.faceLocalTracionada, "+n");
  assert.equal(esforcosNaBase.faceTracionada, "interna");
});

test("nó rígido transfere momento entre pilar e viga", () => {
  const baseA = new No(0, 0, "A");
  const encontro = new No(0, 2, "C");
  const baseB = new No(3, 2, "B");
  const pilar = new Barra(baseA, encontro, "AC");
  const viga = new Barra(encontro, baseB, "CB");

  const portico = new Portico();
  for (const no of [baseA, encontro, baseB]) portico.adicionarNo(no);
  portico.adicionarBarra(pilar);
  portico.adicionarBarra(viga);
  portico.adicionarApoio(new Apoio(baseA, "articulado"));
  portico.adicionarApoio(new Apoio(baseB, "rolete", { x: 0, y: 1 }));
  viga.adicionarCargaPontual(1.5, 10, 0);

  const resultado = portico.resolver();
  verificarEquilibrioGlobal(resultado);
  const reacaoA = resultado.reacoes.find((reacao) => reacao.apoio.no === baseA)!;
  const reacaoB = resultado.reacoes.find((reacao) => reacao.apoio.no === baseB)!;
  quaseIgual(reacaoA.fx, -10);
  quaseIgual(reacaoA.fy, -20 / 3);
  quaseIgual(reacaoB.fy, 20 / 3);

  const extremidadePilar = resultado.extremidades.find((item) => item.barra === pilar)!;
  const extremidadeViga = resultado.extremidades.find((item) => item.barra === viga)!;
  quaseIgual(extremidadePilar.final.momento, -extremidadeViga.inicial.momento);
  quaseIgual(
    resultado.calcularEsforcosNaBarra(pilar, pilar.comprimento).momento,
    resultado.calcularEsforcosNaBarra(viga, 0).momento,
  );
});

test("binário da viga em balanço é transferido ao pilar no nó rígido", () => {
  const base = new No(0, 0, "A");
  const encontro = new No(0, 3, "B");
  const ponta = new No(2, 3, "C");
  const pilar = new Barra(base, encontro, "AB");
  const viga = new Barra(encontro, ponta, "BC");
  const portico = new Portico();
  for (const no of [base, encontro, ponta]) portico.adicionarNo(no);
  portico.adicionarBarra(pilar);
  portico.adicionarBarra(viga);
  portico.adicionarApoio(new Apoio(base, "engaste"));
  viga.adicionarCargaPontual(2, 0, -10);

  const resultado = portico.resolver();
  verificarEquilibrioGlobal(resultado);
  quaseIgual(resultado.reacoes[0].fx, 0);
  quaseIgual(resultado.reacoes[0].fy, 10);
  quaseIgual(resultado.reacoes[0].momento, 20);

  const momentoNoTopoDoPilar = resultado.calcularEsforcosNaBarra(pilar, 3).momento;
  const momentoNaRaizDaViga = resultado.calcularEsforcosNaBarra(viga, 0).momento;
  quaseIgual(Math.abs(momentoNoTopoDoPilar), 20);
  quaseIgual(Math.abs(momentoNaRaizDaViga), 20);
  quaseIgual(resultado.calcularEsforcosNaBarra(pilar, 1.5).normal, -10);

  const acoesNoNo = resultado.equilibrioNodal.find((item) => item.no === encontro)!;
  quaseIgual(acoesNoNo.somaFx, 0);
  quaseIgual(acoesNoNo.somaFy, 0);
  quaseIgual(acoesNoNo.somaMomentos, 0);
});

test("carga distribuída uniforme produz cortante linear e momento quadrático", () => {
  const engaste = new No(0, 0, "A");
  const ponta = new No(4, 0, "B");
  const barra = new Barra(engaste, ponta, "AB");
  const portico = new Portico();
  portico.adicionarNo(engaste);
  portico.adicionarNo(ponta);
  portico.adicionarBarra(barra);
  portico.adicionarApoio(new Apoio(engaste, "engaste"));
  barra.adicionarCargaDistribuida(0, -2);

  const resultado = portico.resolver();
  verificarEquilibrioGlobal(resultado);
  quaseIgual(resultado.reacoes[0].fy, 8);
  quaseIgual(resultado.reacoes[0].momento, 16);

  const noMeio = resultado.calcularEsforcosNaBarra(barra, 2);
  quaseIgual(noMeio.cortante, 4);
  quaseIgual(noMeio.momento, -4);
  quaseIgual(resultado.calcularEsforcosNaBarra(barra, 4).cortante, 0);
  quaseIgual(resultado.calcularEsforcosNaBarra(barra, 4).momento, 0);
});

test("sistema com reações excedentes é rejeitado como não isostático", () => {
  const base = new No(0, 0, "A");
  const ponta = new No(2, 0, "B");
  const barra = new Barra(base, ponta);
  const portico = new Portico();
  portico.adicionarNo(base);
  portico.adicionarNo(ponta);
  portico.adicionarBarra(barra);
  portico.adicionarApoio(new Apoio(base, "engaste"));
  portico.adicionarApoio(new Apoio(ponta, "rolete", { x: 0, y: 1 }));

  assert.throws(() => portico.resolver(), /não é isostático/);
});

test("rótula transmite forças, libera momentos e mantém g_h igual a zero", () => {
  const base = new No(0, 0, "A");
  const encontro = new No(0, 4, "B", "rotula");
  const ponta = new No(3, 4, "C");
  const pilar = new Barra(base, encontro, "AB");
  const viga = new Barra(encontro, ponta, "BC");
  const portico = new Portico();
  for (const no of [base, encontro, ponta]) portico.adicionarNo(no);
  portico.adicionarBarra(pilar);
  portico.adicionarBarra(viga);
  portico.adicionarApoio(new Apoio(base, "engaste"));
  portico.adicionarApoio(new Apoio(ponta, "rolete", { x: 0, y: 1 }));
  portico.adicionarCargaNo(encontro, 10, 0);
  viga.adicionarCargaPontual(1.5, 0, -6);

  assert.equal(portico.calcularGrauEstaticidade(), 0);
  const resultado = portico.resolver();
  verificarEquilibrioGlobal(resultado);

  const reacaoBase = resultado.reacoes.find((reacao) => reacao.apoio.no === base)!;
  const reacaoPonta = resultado.reacoes.find((reacao) => reacao.apoio.no === ponta)!;
  quaseIgual(reacaoBase.fx, -10);
  quaseIgual(reacaoBase.fy, 3);
  quaseIgual(reacaoBase.momento, 40);
  quaseIgual(reacaoPonta.fy, 3);

  const extremidadePilar = resultado.extremidades.find((item) => item.barra === pilar)!;
  const extremidadeViga = resultado.extremidades.find((item) => item.barra === viga)!;
  quaseIgual(extremidadePilar.final.fx, 10);
  quaseIgual(extremidadePilar.final.fy, -3);
  quaseIgual(extremidadePilar.final.momento, 0);
  quaseIgual(extremidadeViga.inicial.fx, 0);
  quaseIgual(extremidadeViga.inicial.fy, 3);
  quaseIgual(extremidadeViga.inicial.momento, 0);
  quaseIgual(resultado.calcularEsforcosNaBarra(viga, 0).momento, 0);
});
