import { test } from "node:test";
import assert from "node:assert/strict";
import { CATEGORIES, PATTERNS, getPattern, cycleSeconds, roundsFor, phaseAt } from "../src/lib/breath/patterns.js";

test("jedes Muster hat gültige Kategorie, Phasen und eindeutige id", () => {
  const cats = new Set(CATEGORIES.map((c) => c.id));
  const ids = new Set();
  for (const p of PATTERNS) {
    assert.ok(cats.has(p.category), `${p.id}: Kategorie ${p.category}`);
    assert.ok(!ids.has(p.id), `${p.id} doppelt`);
    ids.add(p.id);
    assert.ok(p.phases.length >= 2, p.id);
    for (const ph of p.phases) {
      assert.ok(ph.s > 0, `${p.id}: Phase ohne Dauer`);
      assert.ok(ph.to >= 0 && ph.to <= 1, `${p.id}: to außerhalb 0..1`);
    }
    assert.ok(p.technique && p.pni && p.how, `${p.id}: Pflichttexte`);
  }
  for (const c of CATEGORIES) assert.ok(PATTERNS.some((p) => p.category === c.id), `${c.id} leer`);
});

test("Zyklus- und Rundenberechnung", () => {
  const p = getPattern("478");
  assert.equal(cycleSeconds(p), 19);
  assert.equal(roundsFor(p, 3), 9); // 180 / 19 ≈ 9,5 → 9
  assert.equal(roundsFor(p, 0.1), 1);
  assert.equal(cycleSeconds(getPattern("box")), 16);
});

test("phaseAt: Box Breathing durchläuft die vier Phasen", () => {
  const p = getPattern("box");
  const at = (s) => phaseAt(p, s * 1000, 3);
  assert.equal(at(0).phase.kind, "in");
  assert.equal(at(0).fill, 0);
  assert.equal(at(3.999).phase.kind, "in");
  assert.equal(at(4).phase.kind, "hold");
  assert.equal(at(4).fill, 1);
  assert.equal(at(8).phase.kind, "out");
  assert.equal(at(12).phase.kind, "holdOut");
  assert.equal(at(12).fill, 0);
  assert.equal(at(16).round, 2);
  assert.equal(at(16).phase.kind, "in");
});

test("phaseAt: secondsLeft zählt runter, Ende liefert done", () => {
  const p = getPattern("478");
  assert.equal(phaseAt(p, 0, 2).secondsLeft, 4);
  assert.equal(phaseAt(p, 3500, 2).secondsLeft, 1);
  assert.equal(phaseAt(p, 4000, 2).secondsLeft, 7);
  const end = phaseAt(p, 2 * 19 * 1000, 2);
  assert.equal(end.done, true);
  assert.equal(end.round, 2);
});

test("phaseAt: Seufzer füllt in zwei Zügen über 0,75 auf 1 und ist am Zyklusende leer", () => {
  const p = getPattern("sigh");
  const mid = phaseAt(p, 2000, 5); // Ende 1. Zug → Beginn 2. Zug
  assert.equal(mid.phaseIndex, 1);
  assert.ok(Math.abs(mid.fill - 0.75) < 1e-9);
  const top = phaseAt(p, 3000, 5);
  assert.equal(top.phaseIndex, 2);
  assert.equal(top.fill, 1);
  const nextCycle = phaseAt(p, 9000, 5);
  assert.equal(nextCycle.round, 2);
  assert.equal(nextCycle.fill, 0);
});

test("phaseAt: Füllstand ist stetig und bleibt in 0..1", () => {
  for (const p of PATTERNS) {
    let prev = 0;
    for (let ms = 0; ms < cycleSeconds(p) * 2000; ms += 50) {
      const { fill } = phaseAt(p, ms, 3);
      assert.ok(fill >= -1e-9 && fill <= 1 + 1e-9, `${p.id}@${ms}: ${fill}`);
      assert.ok(Math.abs(fill - prev) < 0.2, `${p.id}@${ms}: Sprung ${prev}→${fill}`);
      prev = fill;
    }
  }
});
