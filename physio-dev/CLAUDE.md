# physio-dev

## Philosophie

```
PHYSIOLOGIE (Fundament)
│
├── ERNÄHRUNG → fuel-dev (:9000)
│   Makros, Mikros, Metabolismus, Substanzwirkung
│
└── PSYCHONEUROIMMUNOLOGIE → relax-dev (:9300)
    HPA-Achse, ANS, Cortisol, Vagusnerv, Stress-Immunsystem-Link
```

Ernährung und Entspannung sind nicht zwei getrennte Fächer —
sie sind zwei Interventionsebenen am gleichen physiologischen System.

`physio-dev` ist der **gemeinsame Unterbau**, der erklärt *warum* beides funktioniert.

## Zweck

- Wissensgrundlage für die Ausbildung (Dipl. Ernährungstrainer + Entspannungstrainer)
- Erklärungswerkzeug für Klienten
- Fundament für fundierte Empfehlungen in fuel-dev und relax-dev

## Struktur

```
physio-dev/
├── knowledge/
│   ├── hormones/         Cortisol, Insulin, Leptin, Ghrelin, Melatonin ...
│   ├── neurotransmitters/ Dopamin, Serotonin, GABA, Noradrenalin ...
│   ├── systems/          HPA-Achse, ANS (Sympathikus/Parasympathikus), Darm-Hirn-Achse ...
│   ├── substances/       Koffein, Adaptogene, Mikronährstoffe als Kofaktoren ...
│   └── nutrients/        Makros + Mikros mit physiologischer Wirkung
├── maps/                 Verbindungen: wie Ernährung und Entspannung interagieren
└── refs/                 Quellen, Studien, Ausbildungsunterlagen
```

## Format

Jedes Knowledge-File: Markdown.
Struktur pro File:
- **Was ist es** (1–2 Sätze)
- **Physiologische Funktion**
- **Relevanz Ernährung** (Link zu fuel-dev)
- **Relevanz Entspannung/PNI** (Link zu relax-dev)
- **Klienten-Erklärung** (einfache Sprache)

## Verwandte Projekte

| Projekt | Port | Fokus |
|---------|------|-------|
| fuel-dev | 9000 | Ernährungs-Tracking + Coaching |
| relax-dev | 9300 | Entspannung + Psychoneuroimmunologie |
| physio-dev | — | Knowledge Base (kein Server) |
