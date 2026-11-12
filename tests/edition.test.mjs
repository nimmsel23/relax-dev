import { test } from "node:test";
import assert from "node:assert/strict";
import { STORE, STORE_TABS, STORE_HIDDEN_TABS, isTabHidden, tabLabel } from "../src/lib/edition.js";

test("ohne Edition-Env ist kein Store-Build aktiv (Owner-Build unverändert)", () => {
  assert.equal(STORE, false);
  assert.equal(isTabHidden("ausbildung"), false);
  assert.equal(tabLabel("stats", "Stats"), "Stats");
});

test("Store-Build blendet Owner-Tabs aus und deutscht Beschriftungen ein", () => {
  for (const id of ["ausbildung", "physio", "catalog"]) assert.equal(isTabHidden(id, true), true, id);
  for (const id of STORE_TABS) assert.equal(isTabHidden(id, true), false, id);
  assert.equal(tabLabel("stats", "Stats", true), "Statistik");
  assert.ok(!STORE_TABS.some((id) => STORE_HIDDEN_TABS.includes(id)));
});
