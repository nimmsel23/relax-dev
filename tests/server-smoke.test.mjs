// Smoke-Test: Server startet aus einem frischen Checkout (leere data/, kein ~/.env, kein Vault)
// und beantwortet die Basis-Routen. Fängt kaputte Imports (z. B. fehlendes natives Modul) und
// eine KB ab, die sich nicht aus den YAMLs aufbauen lässt.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import net from "node:net";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.once("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

let child;
let base;
let log = "";

before(async () => {
  const port = await freePort();
  base = `http://127.0.0.1:${port}`;
  child = spawn(process.execPath, ["server.mjs"], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(port), HOST: "127.0.0.1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", (d) => { log += d; });
  child.stderr.on("data", (d) => { log += d; });

  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Server beendet (Exit ${child.exitCode}):\n${log}`);
    try {
      if ((await fetch(`${base}/health`)).ok) return;
    } catch { /* noch nicht bereit */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Server nicht bereit nach 20 s:\n${log}`);
});

after(() => { child?.kill("SIGTERM"); });

test("/health antwortet", async () => {
  const body = await (await fetch(`${base}/health`)).json();
  assert.equal(body.ok, true);
});

test("Knowledge-Base ist gefüllt (node:sqlite + YAML-Import)", async () => {
  const body = await (await fetch(`${base}/api/knowledge/health`)).json();
  assert.equal(body.ok, true);
  assert.ok(body.kb_status.molecules > 0, "keine Moleküle");
  assert.ok(body.kb_status.substances > 0, "keine Substanzen");
});

test("/techniques liefert die Technikliste", async () => {
  const body = await (await fetch(`${base}/techniques`)).json();
  assert.ok(Array.isArray(body.techniques) && body.techniques.length > 0);
});
