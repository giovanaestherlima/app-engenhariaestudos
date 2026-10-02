import assert from "node:assert/strict";
import { test } from "node:test";
import { VigaBiapoiada } from "./VigaBiapoiada.ts";

const quaseIgual = (obtido: number, esperado: number, tolerancia = 1e-10) => {
  assert.ok(
    Math.abs(obtido - esperado) < tolerancia,
    `esperado ${esperado}, obtido ${obtido}`,
  );
};

test("carga central: reações iguais, momento máximo no meio", () => {
  const viga = new VigaBiapoiada(10);
  viga.adicionarCargaPontual(10, 5);

  const { ra, rb } = viga.calcularReacoes();
  quaseIgual(ra, 5);
  quaseIgual(rb, 5);
  quaseIgual(viga.calcularCortante(2), 5);
  quaseIgual(viga.calcularCortante(8), -5);
  quaseIgual(viga.calcularMomentoFletor(0), 0);
  quaseIgual(viga.calcularMomentoFletor(10), 0);
  quaseIgual(viga.calcularMomentoFletor(5), 25);
  quaseIgual(viga.calcularCortante(10), 0);
});

test("carga assimétrica: momentos em A determinam Rb", () => {
  const viga = new VigaBiapoiada(8);
  viga.adicionarCargaPontual(20, 2);

  const { ra, rb } = viga.calcularReacoes();
  quaseIgual(rb, (20 * 2) / 8);
  quaseIgual(ra, 20 - rb);
  quaseIgual(viga.calcularMomentoFletor(2), ra * 2);
});
