/**
 * Knowledge Base API Routes
 * Serves biochemistry KB with advanced AI-powered enrichment
 * Features: Context-aware generation, validation, source tracking, confidence scoring
 */

import { kb } from "../knowledge/kb-loader.js";
import { advancedEnricher } from "../knowledge/ai-enricher-v2.js";

export async function handleKnowledgeAPI(req, res, path, body) {
  // ============ DISPATCHER (Unified Query) ============
  // GET /api/knowledge/expand?q=... — intelligent dispatcher: substance OR molecule
  if (req.method === "GET" && path.startsWith("/api/knowledge/expand")) {
    const url = new URL(`http://localhost${req.url}`);
    const query = url.searchParams.get("q");

    if (!query) {
      return json(res, 400, { ok: false, error: "query parameter 'q' required" });
    }

    const result = kb.dispatchQuery(query);
    return json(res, result.data ? 200 : 404, {
      ok: !!result.data,
      query,
      ...result,
    });
  }

  // ============ SUBSTANCES ============
  // GET /api/knowledge/substances — list all substances
  if (req.method === "GET" && path === "/api/knowledge/substances") {
    const substances = kb.loadSubstances();
    return json(res, 200, {
      ok: true,
      count: Object.keys(substances).length,
      substances,
    });
  }

  // GET /api/knowledge/substance/:id — get single substance
  const substanceMatch = path.match(/^\/api\/knowledge\/substance\/([^/?]+)/);
  if (req.method === "GET" && substanceMatch) {
    const query = decodeURIComponent(substanceMatch[1]);
    const substance = kb.getSubstance(query);

    return json(res, substance ? 200 : 404, {
      ok: !!substance,
      substance,
    });
  }

  // GET /api/knowledge/expand/substance/:id — expand substance (substance + molecules + interactions)
  const expandSubMatch = path.match(/^\/api\/knowledge\/expand\/substance\/([^/?]+)/);
  if (req.method === "GET" && expandSubMatch) {
    const query = decodeURIComponent(expandSubMatch[1]);
    const result = kb.expandSubstance(query);

    return json(res, result ? 200 : 404, {
      ok: !!result,
      ...(result || { error: `Substance "${query}" not found` }),
    });
  }

  // ============ MOLECULES ============
  // GET /api/knowledge/molecules — list all molecules
  if (req.method === "GET" && path === "/api/knowledge/molecules") {
    const molecules = kb.loadMolecules();
    return json(res, 200, {
      ok: true,
      count: Object.keys(molecules).length,
      molecules,
    });
  }

  // GET /api/knowledge/expand/molecule/:id — expand molecule (molecule + substances containing it + related molecules)
  const expandMolMatch = path.match(/^\/api\/knowledge\/expand\/molecule\/([^/?]+)/);
  if (req.method === "GET" && expandMolMatch) {
    const query = decodeURIComponent(expandMolMatch[1]);
    const result = kb.expandMolecule(query);

    return json(res, result ? 200 : 404, {
      ok: !!result,
      ...(result || { error: `Molecule "${query}" not found` }),
    });
  }

  // GET /api/knowledge/molecule/:id — get single molecule (with smart AI enrichment)
  const moleculeMatch = path.match(/^\/api\/knowledge\/molecule\/([^/?]+)/);
  if (req.method === "GET" && moleculeMatch) {
    const query = decodeURIComponent(moleculeMatch[1]);

    // First: try cache
    let existing = kb.getMolecule(query);
    if (existing) {
      return json(res, 200, {
        ok: true,
        molecule: existing,
        source: existing._source || "manual",
        confidence: existing._metadata?.confidence || "high",
        saved: true,
      });
    }

    // Not found: Use Advanced Enricher with context
    console.log(`🤖 Advanced Enricher: Researching "${query}" with KB context...`);
    const allMolecules = kb.loadMolecules();
    const kbInteractions = kb.loadInteractions();

    const result = await advancedEnricher.generateMoleculeWithContext(
      query,
      allMolecules,
      kbInteractions
    );

    if (result.valid) {
      // Validate passed: save to KB
      const key = query.toLowerCase().replace(/\s+/g, "_");
      kb.addMolecule(key, result.data, "ai_generated", {
        confidence: result.confidence,
        needs_review: false,
      });

      console.log(`✅ Added "${query}" to KB (confidence: ${result.confidence})`);

      return json(res, 201, {
        ok: true,
        molecule: result.data,
        source: "ai_generated",
        confidence: result.confidence,
        saved: true,
        message: `Generated with ${result.confidence} confidence. Review suggested: ${result.data._metadata?.needs_review}`,
      });
    } else if (result.data && !result.valid) {
      // Partial data (validation failed)
      return json(res, 206, {
        ok: true,
        molecule: result.data,
        source: "ai_generated_unvalidated",
        confidence: result.confidence || "low",
        saved: false,
        validation_errors: result.errors,
        message: "Generated but failed validation. Review required before using.",
      });
    } else {
      return json(res, 404, {
        ok: false,
        error: `Could not generate or find "${query}"`,
        details: result.error,
      });
    }
  }

  // GET /api/knowledge/search?q=... — search both substances AND molecules
  if (req.method === "GET" && path.startsWith("/api/knowledge/search")) {
    const url = new URL(`http://localhost${req.url}`);
    const query = url.searchParams.get("q");

    if (!query) {
      return json(res, 400, { ok: false, error: "query parameter 'q' required" });
    }

    const allResults = kb.searchAll(query);
    return json(res, 200, {
      ok: true,
      query,
      total_count: allResults.total,
      ...allResults,
    });
  }

  // GET /api/knowledge/interaction?mol1=...&mol2=... — get interaction
  if (req.method === "GET" && path.startsWith("/api/knowledge/interaction")) {
    const url = new URL(`http://localhost${req.url}`);
    const mol1 = url.searchParams.get("mol1");
    const mol2 = url.searchParams.get("mol2");

    if (!mol1 || !mol2) {
      return json(res, 400, { ok: false, error: "mol1 and mol2 parameters required" });
    }

    // Try to find existing
    let interaction = kb.getInteraction(mol1, mol2);

    // If not found, try AI enrichment
    if (!interaction) {
      const mol1Data = kb.getMolecule(mol1);
      const mol2Data = kb.getMolecule(mol2);

      if (!mol1Data || !mol2Data) {
        return json(res, 404, {
          ok: false,
          error: "One or both molecules not found in KB",
        });
      }

      console.log(`🤖 Advanced Enricher: Analyzing ${mol1} ↔ ${mol2}...`);
      const result = await advancedEnricher.generateSmartInteraction(mol1, mol2, mol1Data, mol2Data);

      if (result.valid) {
        const key = `${mol1}_${mol2}`;
        kb.addInteraction(key, {
          ...result.data,
          _source: "ai_generated",
          _created_at: new Date().toISOString(),
          _metadata: { confidence: result.confidence }
        });
        interaction = result.data;
        console.log(`✅ Generated interaction ${key} (confidence: ${result.confidence})`);
      }
    }

    return json(res, interaction ? 200 : 404, {
      ok: !!interaction,
      mol1,
      mol2,
      interaction,
      source: interaction && !kb.getInteraction(mol1, mol2) ? "ai_generated" : "cache",
    });
  }

  // GET /api/knowledge/reactions — list all reactions
  if (req.method === "GET" && path === "/api/knowledge/reactions") {
    const reactions = kb.loadReactions();
    return json(res, 200, {
      ok: true,
      count: Object.keys(reactions).length,
      reactions,
    });
  }

  // GET /api/knowledge/reaction/:id — get single reaction
  const reactionMatch = path.match(/^\/api\/knowledge\/reaction\/([^/?]+)/);
  if (req.method === "GET" && reactionMatch) {
    const reactions = kb.loadReactions();
    const reactionId = decodeURIComponent(reactionMatch[1]);
    const reaction = reactions[reactionId];

    return json(res, reaction ? 200 : 404, {
      ok: !!reaction,
      reaction,
    });
  }

  // GET /api/knowledge/interactions — list all interactions
  if (req.method === "GET" && path === "/api/knowledge/interactions") {
    const interactions = kb.loadInteractions();
    return json(res, 200, {
      ok: true,
      count: Object.keys(interactions).length,
      interactions,
    });
  }

  // GET /api/knowledge/molecule/:id/related-interactions — batch generate interactions for a molecule
  const relatedMatch = path.match(/^\/api\/knowledge\/molecule\/([^/?]+)\/related-interactions/);
  if (req.method === "GET" && relatedMatch) {
    const query = decodeURIComponent(relatedMatch[1]);
    const mol = kb.getMolecule(query);

    if (!mol) {
      return json(res, 404, {
        ok: false,
        error: `Molecule "${query}" not found. Generate it first.`,
      });
    }

    console.log(`🤖 Advanced Enricher: Generating related interactions for ${query}...`);
    const allMols = kb.loadMolecules();
    const generated = await advancedEnricher.generateRelatedInteractions(query, mol, allMols, 5);

    for (const interaction of generated) {
      const key = `${interaction.mol1}_${interaction.mol2}`;
      const existing = kb.getInteraction(interaction.mol1, interaction.mol2);
      if (!existing) {
        kb.addInteraction(key, {
          molecules: [interaction.mol1, interaction.mol2],
          ...interaction,
          _source: "ai_generated_batch",
          _created_at: new Date().toISOString(),
        });
      }
    }

    return json(res, 200, {
      ok: true,
      molecule: query,
      interactions_generated: generated.length,
      generated_interactions: generated,
    });
  }

  // Health check
  if (req.method === "GET" && path === "/api/knowledge/health") {
    const substances = kb.loadSubstances();
    const molecules = kb.loadMolecules();
    const reactions = kb.loadReactions();
    const interactions = kb.loadInteractions();

    // Count by source for molecules
    const moleculesBySource = {
      manual: 0,
      ai_generated: 0,
      ai_reviewed: 0
    };
    for (const mol of Object.values(molecules)) {
      moleculesBySource[mol._source || "manual"]++;
    }

    return json(res, 200, {
      ok: true,
      kb_status: {
        substances: Object.keys(substances).length,
        molecules: Object.keys(molecules).length,
        molecules_by_source: moleculesBySource,
        reactions: Object.keys(reactions).length,
        interactions: Object.keys(interactions).length,
        ai_enabled: !!process.env.GEMINI_API_KEY,
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
        dual_catalog_enabled: true,
      },
    });
  }

  // Not found
  return json(res, 404, { ok: false, error: "Knowledge API route not found" });
}

function json(res, code, data) {
  const body = JSON.stringify(data);
  res.writeHead(code, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}
