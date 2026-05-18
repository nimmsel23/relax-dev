# HOT.md — Open Source Quellen & Node Module

## Biochemie / Substanz-Datenbanken

### Substanzen & Moleküle

| DB | URL | Was | Zugang |
|----|-----|-----|--------|
| **PubChem** (NIH) | pubchem.ncbi.nlm.nih.gov | 100M+ Compounds, SMILES, Halbwertszeiten, Bioaktivität | REST API, kostenlos |
| **ChEMBL** | ebi.ac.uk/chembl | Drug-like molecules + biologische Aktivität | REST API + PostgreSQL-Dump |
| **DrugBank** | drugbank.com | Drugs + Pharmakokinetik, Metabolismus | akademisch kostenlos |
| **OpenFoodFacts** | openfoodfacts.org | Lebensmittel-Nährstoffe → Glukosekurve | REST API + CSV-Download |

### Pharmakologie / Timing-Kurven

| DB | URL | Was | Zugang |
|----|-----|-----|--------|
| **Psychonaut Wiki** | psychonautwiki.org | Onset/Duration/Intensity für Koffein, Nikotin, THC, Adaptogene | inoffizielle API, JSON strukturiert |
| **HMDB** | hmdb.ca | Cortisol, Dopamin, Serotonin — endogen, biochemische Pfade | XML-Dump + REST |
| **KEGG** | kegg.jp | HPA-Achse, Cortisol-Synthese als Pathway-Graph | REST |
| **BioGRID** | thebiogrid.org | Protein-Interaktionen | REST + Download |
| **UniProt** | uniprot.org | Protein-Datenbank, Enzymkinetik | REST API |

---

## Node Module

### API / Daten-Fetch

| Paket | Warum |
|-------|-------|
| nativer `fetch` (Node 18+) | reicht für PubChem/HMDB REST, kein extra Paket nötig |
| `axios` | wenn retry-logic + interceptors gebraucht werden |

### Chemie / Moleküle

| Paket | Warum |
|-------|-------|
| `openchemlib` | SMILES parsen, Molekül-Properties berechnen — pure JS, kein C++ |
| `rdkit-js` | RDKit WebAssembly-Port, mächtiger aber schwerer (~15MB) |

### Pharmakologie / Kurven

| Paket | Warum |
|-------|-------|
| `ml-regression` (mljs) | Kurvenanpassung für PK-Modelle (1-/2-Kompartiment) |
| `simple-statistics` | AUC berechnen, Statistik auf Kurvendaten |
| `numeric` | ODE-Solver für Differentialgleichungen (HPA-Achse modellieren) |

### Caching

| Paket | Warum |
|-------|-------|
| `better-sqlite3` | Lokale SQLite für gecachte Substanzdaten — schnell + synchron |
| `node-cache` | In-Memory TTL-Cache für API-Responses |

### Frontend / Visualisierung

| Paket | Warum |
|-------|-------|
| `@nivo/line` | Cortisol/Dopamin/Glukose gleichzeitig — bereits in AGENTS.md erwähnt |
| `recharts` | einfacher als Nivo, React-nativ, bereits installiert |

---

## Supplement-Datenbanken (Schnittmenge mit fuel-dev)

Adaptogene, Mikronährstoffe, Nootropika — wirken auf Physiologie (relax) UND kommen aus Ernährung (fuel).

| DB | Was | Zugang |
|----|-----|--------|
| **DSLD** (NIH Dietary Supplement Label Database) | 100k+ Produkte mit Inhaltsstoffen + Dosierungen | REST API + Bulk Download, kostenlos |
| **ODS NIH** | Fact Sheets pro Nährstoff (Mg, Zn, B12) mit Referenzwerten | HTML/JSON, frei |
| **COCONUT** | Größte Open-Source-Sammlung natürlicher Verbindungen (500k+) | REST API + Download |
| **LOTUS** | Naturstoffe + Organismen (Ashwagandha, Rhodiola, L-Theanin...) | SPARQL + Download |
| **TCMSP** | TCM-Pflanzen → Moleküle → biologische Targets | Web + Download |
| **Phenol-Explorer** | Polyphenol-Gehalt in Lebensmitteln + Bioverfügbarkeit | CSV Download |

**Relevanz für relax-dev:**
- Adaptogene (Ashwagandha, Rhodiola) → Cortisol-Modulation → Physio-Simulation
- Mikronährstoffe (Mg, B6, D3) → Neurotransmitter-Cofaktoren → KB Enrichment
- DSLD API: direktester Einstieg für Wirkstoff + Dosierung pro Supplement

---

## Priorität

Minimalster sinnvoller Einstieg:

1. `better-sqlite3` — Substanz-Katalog lokal cachen statt YAML bei jedem Request parsen
2. `@nivo/line` — Physio-Kurven visualisieren (3 Kurven gleichzeitig)
3. PubChem REST + Psychonaut Wiki — Basisdaten + Timing-Kurven für Simulation
4. DSLD REST API — Supplement-Daten (Adaptogene, Mikronährstoffe) für KB

Rest ist Ausbaustufe.
