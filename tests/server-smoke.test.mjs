// The former dedicated Node API must not bind a port; Relax routes live in Coach :9150.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

test("retired server entrypoint does not start a listener", () => {
  const result = spawnSync(process.execPath, ["server.mjs"], { cwd: ROOT, encoding: "utf8" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Dedicated Relax API removed/);
});
