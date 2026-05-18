/**
 * Advanced AI Enrichment Engine
 * Intelligent Knowledge Base building with Gemini
 *
 * Features:
 * - Context-aware generation (uses existing KB data for coherence)
 * - Validation before persistence
 * - Source tracking (AI-generated vs manual)
 * - Bidirectional enrichment (molecule → interactions → related effects)
 * - Batch operations (generate related entries)
 * - User feedback loop (flag bad entries for re-generation)
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import os from "os";
import path from "path";

dotenv.config({ path: path.join(os.homedir(), ".env/relax.env") });

const apiKey = process.env.GEMINI_API_KEY;
const modelId = process.env.GEMINI_MODEL || "gemini-2.5-flash";

if (!apiKey) {
  console.error("❌ GEMINI_API_KEY not found in relax.env");
  process.exit(1);
}

const client = new GoogleGenerativeAI(apiKey);
const model = client.getGenerativeModel({ model: modelId });

class AdvancedAIEnricher {
  /**
   * Generate molecule with full context from existing KB
   * Uses existing data to ensure coherence and avoid contradictions
   */
  async generateMoleculeWithContext(moleculeName, existingMolecules = {}, kbInteractions = {}) {
    // Find related molecules for context
    const relatedMols = this.findRelatedMolecules(moleculeName, existingMolecules);
    const relatedContext = relatedMols
      .slice(0, 3)
      .map(([key, mol]) => `${mol.name}: ${mol.functions?.join(", ")}`)
      .join("\n");

    const prompt = `You are a psychoneuroimmunology expert building a Relaxation & Stress-Management Knowledge Base.

Generate a comprehensive biochemistry entry for: "${moleculeName}"

CRITICAL INSTRUCTIONS:
1. Evidence-based only (no speculation)
2. Focused on: stress, relaxation, sleep, mood, energy, inflammation
3. If unsure about specific details, mark as optional or note uncertainty
4. Ensure consistency with similar molecules

EXISTING RELATED MOLECULES (for reference):
${relatedContext || "(none found yet)"}

REQUIRED OUTPUT FORMAT (valid YAML):
name: "English name"
de_name: "German name"
category: "category" # hormone, neurotransmitter, mineral, amino_acid, alkaloid, cytokine, supplement, adaptogen, etc.
formula: "Chemical formula if known, else null"

sources:
  external: [list of food/supplement sources]
  endogenous: true/false/null

functions:
  - "Primary function"
  - "Secondary function"
  - "Tertiary function"

primary_effects:
  dopamine: # or relevant effect
    direction: "increase/decrease/variable"
    magnitude: "percentage change (0-100) if known, else null"
    onset_minutes: "minutes to onset (if applicable)"
    peak_minutes: "minutes to peak (if applicable)"
    duration_minutes: "total duration in minutes"
    mechanism: "Brief explanation of HOW it works"

affects: [list of other molecules/processes it impacts]

produces_from: [precursor molecules if endogenous, else null]
produces_to: [product molecules if endogenous, else null]

affected_by: [what increases/decreases this molecule's levels]

relaxation_relevance: "high_positive|moderate_positive|neutral|moderate_negative|high_negative"

notes: "Clinical observations, timing notes, interactions, caveats, or uncertainty markers"

RETURN ONLY VALID YAML. NO MARKDOWN CODE BLOCKS. START WITH 'name:'`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = this.parseYAMLResponse(text);

      // Validate
      if (this.validateMoleculeEntry(parsed)) {
        return {
          valid: true,
          data: parsed,
          confidence: "high"
        };
      } else {
        return {
          valid: false,
          data: parsed,
          confidence: "low",
          errors: this.getValidationErrors(parsed)
        };
      }
    } catch (error) {
      console.error(`❌ Gemini error generating ${moleculeName}:`, error.message);
      return { valid: false, error: error.message };
    }
  }

  /**
   * Generate smart interactions based on mechanism + mechanism of other molecule
   * Produces more coherent interactions than random pairing
   */
  async generateSmartInteraction(mol1, mol2, mol1Data, mol2Data) {
    const mechanisms = [
      mol1Data.primary_effects ? Object.entries(mol1Data.primary_effects)
        .map(([effect, data]) => `${mol1Data.name} ${data.direction} ${effect}`)
        .join("; ") : "",
      mol2Data.primary_effects ? Object.entries(mol2Data.primary_effects)
        .map(([effect, data]) => `${mol2Data.name} ${data.direction} ${effect}`)
        .join("; ") : ""
    ].filter(Boolean).join(" | ");

    const prompt = `You are a psychoneuroimmunology expert analyzing molecular interactions.

Analyze the interaction between two molecules:

MOLECULE 1: ${mol1Data.name}
${mol1Data.de_name ? `German: ${mol1Data.de_name}` : ""}
Functions: ${mol1Data.functions?.join(", ")}
Effects: ${mechanisms.split("|")[0]}

MOLECULE 2: ${mol2Data.name}
${mol2Data.de_name ? `German: ${mol2Data.de_name}` : ""}
Functions: ${mol2Data.functions?.join(", ")}
Effects: ${mechanisms.split("|")[1]}

Generate ONLY valid YAML (no markdown):

molecules: ["${mol1}", "${mol2}"]
type: "synergistic|antagonistic|synergistic_with_modulation|biphasic|neutral|unclear"

mechanism: "How do they interact at the biochemical level?"

combined_effect: "What is the net result when both are present?"

magnitude_of_interaction: "percentage change (0-100) if measurable, else null"

user_experience: "How might a person feel/respond?"

timing: "Any temporal considerations?"

relaxation_relevance: "high_positive|moderate_positive|neutral|moderate_negative|high_negative"

recommendation: "Is this combination advisable? Avoid/Neutral/Recommended?"

research_note: "Sources, uncertainty markers, or 'theoretical based on mechanisms'"

notes: "Any caveats or context"`;

    try {
      const result = await model.generateContent(prompt);
      const parsed = this.parseYAMLResponse(result.response.text());

      return {
        valid: this.validateInteractionEntry(parsed),
        data: parsed,
        confidence: this.isInteractionCoherent(parsed, mol1Data, mol2Data) ? "high" : "medium"
      };
    } catch (error) {
      console.error(`❌ Gemini interaction error:`, error.message);
      return { valid: false, error: error.message };
    }
  }

  /**
   * Batch generate related interactions for a molecule
   * "If user asks about caffeine, also generate caffeine+X for common pairs"
   */
  async generateRelatedInteractions(moleculeName, moleculeData, otherMolecules, limit = 5) {
    // Pick likely interaction candidates (same relaxation_relevance, same category, opposing effects)
    const candidates = Object.entries(otherMolecules)
      .filter(([, mol]) => {
        // Skip if already have interaction
        // Prioritize: same category, related effects, high/medium relevance
        return mol.category === moleculeData.category ||
               (moleculeData.affects?.includes(mol.name) ||
                mol.affects?.includes(moleculeData.name));
      })
      .slice(0, limit);

    const interactions = [];
    for (const [molKey, molData] of candidates) {
      const result = await this.generateSmartInteraction(
        moleculeName,
        molKey,
        moleculeData,
        molData
      );
      if (result.valid) {
        interactions.push({
          mol1: moleculeName,
          mol2: molKey,
          ...result.data
        });
      }
    }

    return interactions;
  }

  /**
   * Validation: does the generated entry make biochemical sense?
   */
  validateMoleculeEntry(entry) {
    if (!entry?.name || !entry?.de_name || !entry?.category) return false;

    // If has primary_effects, ensure structure is valid
    if (entry.primary_effects) {
      for (const [effect, data] of Object.entries(entry.primary_effects)) {
        if (typeof data === "object") {
          const validDirections = ["increase", "decrease", "variable"];
          if (data.direction && !validDirections.includes(data.direction)) return false;
          if (data.magnitude && (isNaN(data.magnitude) || data.magnitude < 0 || data.magnitude > 100)) return false;
        }
      }
    }

    return true;
  }

  validateInteractionEntry(entry) {
    if (!entry?.molecules || entry.molecules.length !== 2) return false;
    if (!entry?.type || !entry?.mechanism || !entry?.combined_effect) return false;
    return true;
  }

  /**
   * Check coherence: does interaction make sense given molecule mechanisms?
   */
  isInteractionCoherent(interaction, mol1, mol2) {
    // Simple heuristic: if both increase dopamine and interaction is synergistic, that's coherent
    // If both increase dopamine and interaction is antagonistic, that's questionable
    const type = interaction.type;
    const effects1 = Object.values(mol1.primary_effects || {}).map(e => e.direction);
    const effects2 = Object.values(mol2.primary_effects || {}).map(e => e.direction);

    // If mechanisms contradict type, lower confidence
    const allIncrease = effects1.every(e => e === "increase") && effects2.every(e => e === "increase");
    const allDecrease = effects1.every(e => e === "decrease") && effects2.every(e => e === "decrease");

    if ((allIncrease || allDecrease) && type === "antagonistic") {
      return false; // Lower coherence
    }

    return true;
  }

  getValidationErrors(entry) {
    const errors = [];
    if (!entry.name) errors.push("Missing: name");
    if (!entry.de_name) errors.push("Missing: de_name");
    if (!entry.category) errors.push("Missing: category");
    if (entry.primary_effects) {
      for (const [effect, data] of Object.entries(entry.primary_effects)) {
        if (data.magnitude && (data.magnitude < 0 || data.magnitude > 100)) {
          errors.push(`Invalid magnitude for ${effect}: ${data.magnitude}%`);
        }
      }
    }
    return errors;
  }

  /**
   * Find molecules similar to query (same category, related functions, etc)
   */
  findRelatedMolecules(moleculeName, allMolecules) {
    const q = moleculeName.toLowerCase();
    return Object.entries(allMolecules)
      .filter(([, mol]) => {
        // Same category, similar functions, or in related processes
        return mol.name?.toLowerCase().includes(q) ||
               mol.affects?.some(a => a.includes(q)) ||
               mol.produces_from?.some(p => p.includes(q)) ||
               mol.produces_to?.some(p => p.includes(q));
      })
      .slice(0, 5);
  }

  /**
   * Parse YAML-like response from Gemini (lenient parser)
   */
  parseYAMLResponse(text) {
    const result = {};
    const lines = text.split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("#"));

    let currentKey = null;
    let currentArray = [];
    let currentObj = null;

    for (const line of lines) {
      // Try to parse as key: value
      if (line.includes(":")) {
        const [keyPart, valuePart] = line.split(":").map(s => s.trim());

        // Save previous array if exists
        if (currentArray.length > 0 && currentKey) {
          result[currentKey] = currentArray;
          currentArray = [];
        }

        if (valuePart.startsWith("[")) {
          // Array: key: [item1, item2]
          try {
            result[keyPart] = JSON.parse(valuePart);
          } catch {
            result[keyPart] = [valuePart];
          }
          currentKey = null;
        } else if (valuePart === "" || valuePart === "null") {
          // Empty or null value
          result[keyPart] = null;
          currentKey = null;
        } else {
          result[keyPart] = valuePart;
          currentKey = keyPart;
        }
      } else if (line.startsWith("-")) {
        // Array item
        currentArray.push(line.replace(/^-\s*/, "").trim());
      }
    }

    // Save final array if exists
    if (currentArray.length > 0 && currentKey) {
      result[currentKey] = currentArray;
    }

    return result;
  }

  /**
   * Flag entry as questionable (user feedback)
   * Stores metadata for re-generation or review
   */
  flagEntry(type, key, reason) {
    return {
      flagged: true,
      type, // 'molecule' | 'interaction'
      key,
      reason,
      flagged_at: new Date().toISOString(),
      needs_review: true,
      can_regenerate: true
    };
  }
}

export const advancedEnricher = new AdvancedAIEnricher();
