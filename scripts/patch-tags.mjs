// One-shot script: adds tags to every molecule in molecule.catalog.yaml
// Run: node scripts/patch-tags.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, "../knowledge/molecule.catalog.yaml");

const TAGS = {
  caffeine:             ["stimulant", "adenosine-antagonist", "HPA-axis", "dopamine-modulator", "cortisol-modulator"],
  l_theanine:           ["anxiolytic", "GABA-modulator", "sleep", "calm-alertness", "neuroprotection"],
  magnesium:            ["GABA-modulator", "sleep", "muscle-relaxation", "HPA-axis", "anxiolytic"],
  glycine:              ["sleep", "inhibitory", "parasympathetic", "amino-acid"],
  tryptophan:           ["serotonin-precursor", "sleep", "mood", "melatonin-precursor"],
  serotonin:            ["mood", "sleep", "melatonin-precursor", "gut-brain-axis"],
  melatonin:            ["sleep", "circadian", "antioxidant", "pineal"],
  linalool:             ["anxiolytic", "GABA-modulator", "aromatherapy", "terpene"],
  linalyl_acetate:      ["anxiolytic", "muscle-relaxation", "aromatherapy", "sedative", "terpene"],
  geraniol:             ["anxiolytic", "anti-inflammatory", "aromatherapy", "terpene"],
  gaba:                 ["inhibitory", "anxiolytic", "sleep", "muscle-relaxation", "neurotransmitter"],
  dopamine:             ["reward", "motivation", "focus", "neurotransmitter", "mood"],
  cortisol:             ["HPA-axis", "stress", "immune-modulation", "circadian", "sleep-disruptor"],
  oxytocin:             ["social-bonding", "HPA-axis", "anxiolytic", "cortisol-modulator", "vagal-tone"],
  adenosine:            ["sleep-pressure", "anti-inflammatory", "energy-sensing"],
  withanolide_a:        ["adaptogen", "HPA-axis", "anxiolytic", "cortisol-modulator"],
  withanolide_d:        ["adaptogen", "anti-inflammatory", "neuroprotection"],
  withaferin_a:         ["adaptogen", "anti-inflammatory", "HSP90", "cortisol-modulator"],
  erysotrine:           ["anxiolytic", "GABA-modulator", "CNS-depressant", "alkaloid"],
  erysovine:            ["anxiolytic", "GABA-modulator", "alkaloid"],
  erysodine:            ["anxiolytic", "nicotinic-antagonist", "sedative", "alkaloid"],
  quercetin:            ["antioxidant", "anti-inflammatory", "flavonoid"],
  kaempferol:           ["antioxidant", "anti-inflammatory", "anxiolytic", "flavonoid"],
  apigenin:             ["anxiolytic", "GABA-modulator", "anti-inflammatory", "flavonoid", "sleep"],
  flavonoid_derivatives:["anti-inflammatory", "antispasmodic", "flavonoid"],
  flavonoid_vitexin:    ["anxiolytic", "GABA-modulator", "sedative", "flavonoid", "sleep"],
  alkaloid_harmaline:   ["serotonin-modulator", "MAO-inhibitor", "anxiolytic", "alkaloid"],
  rosmarinic_acid:      ["GABA-modulator", "anti-inflammatory", "antioxidant", "polyphenol"],
  caffeic_acid:         ["antioxidant", "anti-inflammatory", "polyphenol"],
  egcg:                 ["antioxidant", "anti-inflammatory", "neuroprotection", "catechin"],
  theobromine:          ["stimulant", "vasodilation", "adenosine-antagonist", "methylxanthine"],
  salidroside:          ["adaptogen", "anti-fatigue", "dopamine-modulator", "serotonin-modulator"],
  rosavin:              ["adaptogen", "HPA-axis", "cortisol-modulator", "mood"],
  eurycomanone:         ["adaptogen", "HPA-axis", "testosterone", "cortisol-modulator"],
  eurypeptides:         ["adaptogen", "anti-fatigue", "testosterone-signaling"],
  il_10:                ["anti-inflammatory", "immune-modulation", "cytokine", "vagal-tone"],
  endorphins:           ["pain-relief", "mood", "stress-resilience", "opioid", "reward"],
};

const raw = fs.readFileSync(FILE, "utf8");
const doc = YAML.parseDocument(raw);
const mols = doc.get("molecules");

let updated = 0;
for (const [key, tags] of Object.entries(TAGS)) {
  const mol = mols.get(key);
  if (!mol) { console.warn(`  ⚠️  "${key}" nicht gefunden`); continue; }
  mol.set("tags", YAML.parse(JSON.stringify(tags)));
  updated++;
}

fs.writeFileSync(FILE, doc.toString(), "utf8");
console.log(`✅ Tags hinzugefügt: ${updated}/${Object.keys(TAGS).length} Moleküle`);
