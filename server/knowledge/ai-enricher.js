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

class AIEnricher {
  async generateMoleculeEntry(moleculeName, category = null) {
    const categoryHint = category ? ` (category: ${category})` : "";
    const prompt = `Generate a comprehensive biochemistry entry for the molecule "${moleculeName}"${categoryHint}.

Return ONLY valid YAML format matching this structure:
- name: English name
- de_name: German name
- category: molecule category (hormone, neurotransmitter, mineral, etc.)
- formula: Chemical formula if known
- sources: {external: [...], endogenous: true/false/null}
- functions: List of key functions (3-5 items)
- primary_effects: Object with effect properties
- affects: List of other molecules/processes affected
- relaxation_relevance: high_positive, moderate_positive, neutral, moderate_negative, high_negative
- notes: Additional relevant notes

Make it evidence-based, concise, and focused on relaxation/stress physiology.`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      // Extract YAML from response
      const yamlMatch = text.match(/^([\s\S]*?)$/m);
      if (!yamlMatch) return null;

      // Parse YAML-like content (simplified)
      return this.parseAIResponse(text);
    } catch (error) {
      console.error(`❌ Gemini error generating molecule ${moleculeName}:`, error.message);
      return null;
    }
  }

  async generateInteraction(mol1, mol2, existingMol1Data = null, existingMol2Data = null) {
    const context = [];
    if (existingMol1Data) {
      context.push(`${mol1} effects: ${JSON.stringify(existingMol1Data.primary_effects)}`);
    }
    if (existingMol2Data) {
      context.push(`${mol2} effects: ${JSON.stringify(existingMol2Data.primary_effects)}`);
    }

    const contextStr = context.length > 0 ? `\n\nContext:\n${context.join("\n")}` : "";

    const prompt = `Analyze the biochemical interaction between "${mol1}" and "${mol2}".${contextStr}

Return ONLY valid YAML format matching this structure:
- molecules: ["${mol1}", "${mol2}"]
- type: synergistic, antagonistic, synergistic_with_modulation, biphasic, neutral, etc.
- mechanism: Brief explanation of how they interact
- combined_effect: What happens when both are present
- user_experience: How the user might feel
- recommendation: If applicable
- relaxation_relevance: high_positive, moderate_positive, neutral, moderate_negative, high_negative
- notes: Additional notes

Focus on relaxation, stress physiology, and practical relevance.`;

    try {
      const result = await model.generateContent(prompt);
      return this.parseAIResponse(result.response.text());
    } catch (error) {
      console.error(`❌ Gemini error generating interaction ${mol1}-${mol2}:`, error.message);
      return null;
    }
  }

  async generateReaction(processName, description) {
    const prompt = `Generate a comprehensive biochemical cascade/reaction description for "${processName}".

Description: ${description}

Return ONLY valid YAML format with:
- name: Process name (English)
- de_name: German name
- description: What this process does
- category: cascade, rhythm, stress_response, etc.
- mechanism: How it works
- timeline: Key timing information
- activated_by: What triggers it
- inhibited_by: What suppresses it
- consequences: Effects and outcomes
- notes: Clinical/practical notes

Make it evidence-based and focused on stress/relaxation physiology.`;

    try {
      const result = await model.generateContent(prompt);
      return this.parseAIResponse(result.response.text());
    } catch (error) {
      console.error(`❌ Gemini error generating reaction ${processName}:`, error.message);
      return null;
    }
  }

  parseAIResponse(text) {
    // Remove markdown code blocks if present
    let cleanText = text.replace(/```yaml\n?/g, "").replace(/```\n?/g, "");

    // Try to extract YAML-like content
    // This is simplified; real YAML parsing would use a library
    const lines = cleanText.split("\n").filter((line) => line.trim());

    const result = {};
    let currentKey = null;
    let currentArray = [];

    for (const line of lines) {
      const match = line.match(/^-\s+([^:]+):\s*(.*)/);
      if (match) {
        if (currentKey && currentArray.length > 0) {
          result[currentKey] = currentArray;
          currentArray = [];
        }
        currentKey = match[1];
        const value = match[2].trim();
        if (value) result[currentKey] = value;
      } else if (line.startsWith("  -")) {
        // Array item
        const item = line.replace(/^\s+-\s+/, "").trim();
        currentArray.push(item);
      }
    }

    if (currentKey && currentArray.length > 0) {
      result[currentKey] = currentArray;
    }

    return Object.keys(result).length > 0 ? result : null;
  }

  async checkAndEnrich(query, kbLoader) {
    // Check if molecule exists
    const existing = kbLoader.getMolecule(query);
    if (existing) {
      return { found: true, data: existing, source: "cache" };
    }

    console.log(`🤖 Gemini: Researching "${query}"...`);

    // Generate new entry
    const generated = await this.generateMoleculeEntry(query);
    if (generated) {
      console.log(`✅ Gemini generated entry for ${query}`);
      kbLoader.addMolecule(query.toLowerCase().replace(/\s+/g, "_"), generated);
      return { found: false, data: generated, source: "ai_generated", saved: true };
    }

    return { found: false, data: null, source: "not_found" };
  }
}

export const enricher = new AIEnricher();
