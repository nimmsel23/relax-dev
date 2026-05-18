# HOT.md — relax-dev Vision & Richtung

> Was brennt. Was kommen soll. Was dieses Projekt zu mehr macht als einer weiteren Wellness-App.

---

## Das Warum

Entspannung ist keine Pause vom Leben.  
Sie ist der Boden, auf dem Leistung überhaupt erst wächst.

Die meisten Menschen wissen das abstrakt. Sie wissen es nicht *physiologisch*.  
Sie wissen nicht, dass ihr Koffein-Cortisol-Loop um 15:00 Uhr ihren Schlaf um 3 Stunden verschiebt.  
Dass Magnesium-Mangel der Grund ist, warum die Atemübung nicht greift.  
Dass Nikotin + Koffein gemeinsam das Dopaminsystem 50% stärker trifft als einzeln.

relax-dev soll diese Lücke schließen: **sichtbar machen, was im Körper passiert.**  
Nicht als Warnung. Als Information. Als Empowerment.

---

## Was brennt (Ideen die jetzt heiß sind)

### 1. Zirkadianes Design — Licht das atmet

Die App soll sich dem Körper anpassen, nicht umgekehrt.

```
06:00 – 12:00  →  Latte      warmes Morgenlicht, Koffein-Fenster offen
12:00 – 17:00  →  Frappe     ruhiges Nachmittagslicht, Fokuszone
17:00 – 21:00  →  Macchiato  Blaulicht runter, Parasympathikus an
21:00 – 06:00  →  Mocha      Dunkelheit als Programm, Melatonin schützen
```

Das Theme-System ist dabei nicht Ästhetik.  
Es ist eine subtile Erinnerung: *Dein Körper wechselt jetzt den Modus.*

**Hook existiert: `src/hooks/useCircadianTheme.js`**  
Styles brauchen noch Macchiato + Frappe CSS-Variablen.

---

### 2. Open Source Biochemie-DBs anbinden

Die KB ist stark wenn sie mit echten Daten gefüttert wird. Kandidaten:

| Datenbank | Was sie hat | Wie nutzen |
|-----------|-------------|------------|
| **PubChem** (NIH) | 100M+ Moleküle, Halbwertszeiten, SMILES | REST API, Substanz-Lookup per Name |
| **Psychonaut Wiki** | Onset/Peak/Duration-Kurven (Koffein, Nikotin, THC, Adaptogene) | Inoffizielle API, JSON strukturiert |
| **HMDB** | Cortisol, Dopamin, Serotonin — endogen, biochemische Pfade | XML-Dump + REST |
| **OpenFoodFacts** | Mahlzeit → Makros → Glukosekurve | REST API, offline CSV |
| **KEGG** | HPA-Achse, Cortisol-Synthese als Pathway-Graph | REST |
| **ChEMBL** | Drug-like molecules + biologische Aktivität | PostgreSQL-Dump |

**Einstiegspunkt:** PubChem für Basisdaten + Psychonaut Wiki für Timing-Kurven.  
Gemini füllt die Lücken — das ist der aktuelle Weg.

---

### 3. Node Module die passen

Für die nächste Ausbaustufe des Servers:

```
better-sqlite3      →  Substanz-Katalog lokal cachen (kein API-Call pro Request)
ml-regression       →  Onset/Peak/Offset-Kurve aus Timing-Daten fitten
openchemlib         →  Halbwertszeit aus Molekülstruktur schätzen (pure JS)
@nivo/line          →  Cortisol/Dopamin/Glukose gleichzeitig visualisieren
simple-statistics   →  AUC berechnen, Statisitik auf Kurvendaten
```

Minimalste sinnvolle Ergänzung: `better-sqlite3` als lokaler Cache  
für die knowledge/*.yaml-Daten → kein YAML-Parse bei jedem Request.

---

### 4. Physio-Kurven aus der KB speisen

Aktuell sind die Kurven hardcoded. Das ist der nächste große Schritt:

```js
// Jetzt:
const coffeeEffect = spike(0, 45, 1.0, 300);

// Dann (datengetrieben aus molecules.yaml):
const mol = kb.getMolecule("caffeine");
const effect = spike(
  mol.primary_effects.dopamine.onset_minutes,
  mol.primary_effects.dopamine.peak_minutes,
  mol.primary_effects.dopamine.magnitude / 100,
  mol.primary_effects.dopamine.duration_minutes
);
```

Wenn das läuft, ist der SubstanceCatalog kein statisches Glossar mehr —  
er ist der Motor hinter der Simulation.

---

### 5. Persönlicher Kalibrierungsmodus

Jeder Körper reagiert anders. Die KB ist der Durchschnitt.  
RELAX-003 (geplant): User loggt Beobachtung, System gleicht mit KB ab.

```
"Koffein um 09:00 → ich fühle: Energie, Nervosität, Fokus"
       ↓
KB-Prediction: Dopamin +30%, Cortisol +15%, Peak bei 45min
System fragt: "Bei dir früher? Stärker?"
       ↓
Personalisierter Offset wird gespeichert
Nächste Simulation nutzt deinen Offset
```

Das ist der Kern der Idee: Biochemie lernt den Nutzer kennen.

---

## Offene Fragen (ehrlich)

- Psychonaut Wiki API — stabiler Endpunkt? Rate-limit?
- `better-sqlite3` vs. reines YAML-Caching — wann lohnt SQLite wirklich?
- Zirkadianes Theme: Manual-Override persistent über Sessions?
  (Hook speichert via `/theme` API — Logik steht, styles fehlen noch)
- KB wächst: Ab wann brauchen wir Pagination auf `/api/knowledge/molecules`?
- Interaktions-Graph visualisieren: Cytoscape.js? D3-force? Nivo hat kein Graph.

---

## Was dieses Projekt besonders macht

Die meisten Wellness-Apps zeigen dir wie du dich *fühlst*.  
relax-dev soll dir zeigen warum.

Nicht als Arzt. Nicht als Warnsystem.  
Als informierter Begleiter, der den Körper ernst nimmt —  
und der so gebaut ist, dass er mit dem Körper atmet:  
im Licht, im Rhythmus, in der Tiefe.

---

*Zuletzt aktualisiert: 2026-05-18*
