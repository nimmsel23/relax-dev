import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const VAULT_PATHS = [
  path.join(os.homedir(), "Vitaltrainer/Sportkompetenz/Endokrinologie"),
  path.join(os.homedir(), "Vitaltrainer/Sportkompetenz/Biochemie"),
  path.join(os.homedir(), "Vitaltrainer/Sportkompetenz/Biochemie/Supplemente"),
  path.join(os.homedir(), "Vitaltrainer/Sportkompetenz/Physiologie"),
  path.join(os.homedir(), "Vitaltrainer/Dipl.Entspannungstrainer"),
  path.join(os.homedir(), "BODY/Kräuter"),
  path.join(os.homedir(), "physiologie"),
];

class VaultSearch {
  constructor() {
    this.index = null;
  }

  buildIndex() {
    if (this.index) return this.index;

    this.index = [];
    for (const vaultPath of VAULT_PATHS) {
      if (!fs.existsSync(vaultPath)) continue;
      try {
        const files = fs.readdirSync(vaultPath);
        for (const file of files) {
          if (!file.endsWith(".md")) continue;
          const fullPath = path.join(vaultPath, file);
          const name = file.replace(/\.md$/, "");
          // extract [[wikilinks]] from file content for relation mapping
          let links = [];
          try {
            const raw = fs.readFileSync(fullPath, "utf8");
            links = extractWikilinks(raw);
          } catch { /* skip */ }
          this.index.push({ name, path: fullPath, section: path.basename(vaultPath), links });
        }
      } catch { /* skip unreadable dirs */ }
    }
    return this.index;
  }

  // Find best matching vault file for a substance/molecule key + metadata
  findFile(key, meta = {}) {
    const index = this.buildIndex();
    const candidates = [
      key.replace(/_/g, " "),
      meta.de_name || "",
      meta.name || "",
    ].filter(Boolean).map((s) => s.toLowerCase());

    let best = null;
    let bestScore = 0;

    for (const entry of index) {
      const entryLower = entry.name.toLowerCase();
      let score = 0;

      for (const term of candidates) {
        if (!term) continue;
        if (entryLower === term) { score = Math.max(score, 100); break; }
        if (entryLower.includes(term)) { score = Math.max(score, 80); }
        const firstWord = term.split(/[\s_-]/)[0];
        if (firstWord.length > 3 && entryLower.includes(firstWord)) {
          score = Math.max(score, 50);
        }
      }

      if (score > bestScore) {
        bestScore = score;
        best = entry;
      }
    }

    return bestScore >= 50 ? best : null;
  }

  // Return [[wikilinks]] found in a vault file — used to discover KB connections
  getLinksFor(key, meta = {}) {
    const entry = this.findFile(key, meta);
    return entry ? entry.links : [];
  }

  readAndSanitize(filePath) {
    const raw = fs.readFileSync(filePath, "utf8");
    return sanitizeObsidian(raw);
  }
}

// Extract all [[Link]] and [[Link|Display]] targets from markdown
function extractWikilinks(md) {
  const links = new Set();
  const re = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
  let m;
  while ((m = re.exec(md)) !== null) {
    links.add(m[1].trim());
  }
  return [...links];
}

// Convert [[Link]] → clickable span, [[Link|Display]] → clickable span with display text
// Frontend intercepts data-vault-link clicks to open the right modal entry
function sanitizeObsidian(md) {
  return md
    // strip frontmatter
    .replace(/^---[\s\S]*?---\n?/, "")
    // [[Link|Display]] → clickable span
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, (_, link, display) =>
      `<span class="vault-link" data-vault-link="${encodeLink(link)}">${display}</span>`
    )
    // [[Link]] → clickable span
    .replace(/\[\[([^\]]+)\]\]/g, (_, link) =>
      `<span class="vault-link" data-vault-link="${encodeLink(link)}">${link}</span>`
    )
    // strip standalone #tags (line-level tag lists)
    .replace(/(^|\s)#[A-Za-zÄÖÜäöüß][A-Za-zÄÖÜäöüß0-9_-]*/g, "")
    .trim();
}

function encodeLink(link) {
  // normalize to catalog key format: lowercase, spaces→underscore, strip parens/special
  return link.toLowerCase().replace(/\s+/g, "_").replace(/[()]/g, "");
}

export const vaultSearch = new VaultSearch();
