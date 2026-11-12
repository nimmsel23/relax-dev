# Finale Variante `vos-relax` (Konzept, Entwurf 2026-11-12)

Status: Entwurf, nicht umgesetzt. Umsetzung liegt im Meta-Repo (`~/vitalos/prod`), nicht hier.
Vorbild: `~/vitalos/prod/vos-fitness` (schlanker Wrapper über die Quelle der App, eigene Hosting-Site).

## Ziel

Eine live Relax-Variante, die einfach funktioniert, auch wenn Shell oder Owner-Stand gerade
nicht gesund sind: Atmen, Praxis eintragen, Journal, Statistik. Kein Ausbildungsbezug.

## Trennung Nutzerprodukt vs. Owner-Ausbildungsmodul

| | Nutzerprodukt `vos-relax` | Owner-Ausbildungsmodul |
|---|---|---|
| Inhalt | Heute, Atem, Praxis, Journal, Statistik | Modul (Ausbildung), Physio, Catalog, Kursblöcke in Atem/Praxis, 30-Einheiten-Nachweis |
| Zielgruppe | Endnutzer, Store-Tester, Klienten | nur Owner (persönliche Ausbildung) |
| Build | `VITE_VOS_PRODUCT_BUILD=1` und `VITE_VOS_EDITION=store` | Standard-Build aus `relax-dev` (ohne Edition-Env) |
| Quelle | `relax-app` (Submodul, Pin auf `origin/master`) | `relax-dev` selbst (`pnpm run build`) |
| Site | `vos-relax.web.app` | bleibt `relax-vos.web.app`, Umbenennung später (Vorschlag `vos-ausbildung`) |

Eine Quelle, zwei Gewänder: die Trennung läuft ausschließlich über `src/lib/edition.js`
(`STORE`, `STORE_TABS`, `STORE_HIDDEN_TABS`, `isTabHidden`, `tabLabel`). Kein zweiter Code-Fork.
Owner-Views (`Ausbildung`, `PhysioTimeline`, `SubstanceCatalog`) sind im Store-Build zusätzlich
über `storeGated()` abgesichert und zeigen nur einen Rückweg zur Atemübung.

## Aufbau des Wrappers (Vorschlag)

```
~/vitalos/prod/vos-relax/        (gehört zu prod, kein eigenes Repo; Muster vos-fitness)
  AGENTS.md  package.json  index.html  vite.config.cjs  public/  src/RelaxProductApp.jsx
```

- `vite.config.cjs`: wie `vos-fitness`; verlangt `VITE_VOS_PRODUCT_BUILD=1`, Alias `@relax` ->
  `relax-app/src`, `@db` -> `src/shell/db/relax.js` (Firestore-Schicht), `@view/journal` ->
  Journal-Ansicht der Shell, Firebase-Konfig nur über `.product-config` (Umbiegen der
  `firebase.config.js` wie in `productFirebaseConfig`). Build-Ausgabe `dist-firebase`.
- `RelaxProductApp.jsx`: Login-Gate plus Tab-Leiste aus `STORE_TABS` (dash, atem, session,
  journal, stats) mit `tabLabel`. Rendert die Views aus `@relax/views/*` wie `shell/RelaxApp.jsx`,
  aber ohne Modul/Physio/Catalog und ohne Shell-Subnav. Kein `useCircadianTheme` (setzt global
  `data-theme`), Scope-CSS wie `relax-scope.css`.
- Service Worker, Splash, Changelog aus `packages/mini-app-shell` (`mini-app.json`), nicht kopieren.
- Keine KI-Aufrufe, kein Coach-Backend (`/relax-api`, `/api/knowledge`): Daten nur Firestore
  `relax/{uid}` plus Offline-Cache.

## Hosting

- Kanon laut `~/vitalos/docs/HOSTING-TARGETS.md`: `vos-relax` (heute ohne Target). Site anlegen,
  Target `relax` in einer eigenen `firebase.product-relax.json` (Muster `firebase.product-fitness.json`).
- Store/Produkt: Projekt `vitalos-prod` (Owner-Trennung 2026-11-11), nie über das private
  Deploy-Secret. Privat/Klienten-Variante in `fitness-aos` nur nach Owner-Entscheid.
- `relax-vos.web.app` bleibt unverändert, bis das Ausbildungsmodul eine eigene Site hat.
- Auth: pro neuer Site Authorized Domain und OAuth-Redirect eintragen (`bin/vos-authdomains`).

## Schritte (Reihenfolge)

1. Store-Gewand in `relax-dev` (erledigt, `src/lib/edition.js`), `relax-app`-Pin bumpen.
2. Wrapper `vos-relax` anlegen (Dateien oben), lokaler Build mit `VITE_VOS_EDITION=store`.
3. Bundle-Prüfung: im Produkt-Bundle keine Strings aus `Ausbildung.data.js`, `FlexyFit`, `Kurs`.
4. Site + Target + Auth-Domains anlegen, Deploy durch den User (kein Deploy durch Agenten).
5. Shell-Subnav `SUB_NAV.relax` und `RelaxApp.TABS` im Store-Build an `STORE_TABS` angleichen.

## Offene Entscheidungen (Owner)

- Slug des Ausbildungsmoduls (`vos-ausbildung`) und ob es privat bleibt oder ganz aus dem Produkt-Repo wandert.
- Technik-Namen im Praxis-Dropdown (`Box Breathing`, `NSDR / Yoga Nidra`, `Body Scan`) bleiben, weil
  gespeicherte Einträge darüber gematcht werden; Eindeutschung nur mit Migration.
- `PMR.jsx` (Standalone-Tab) enthält Kursskript-Verweise und ist nicht im Store-Gewand; im Wrapper nicht einbinden.
