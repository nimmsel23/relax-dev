# CI-Agent — offener Betriebspunkt

- [x] `GEMINI_API_KEY` und `SYNC_TOKEN` als Actions-Secrets einrichten/prüfen — erledigt 2026-11-10 (Secrets vorhanden seit 2026-11-07 bzw. 2026-11-09; `gh secret list`).
- [x] Gemini Merge-Agent an Release-Weg `dev→master` angeglichen — erledigt 2026-11-11: `repair.mjs` ohne `master→vitalos`-Product-Release-Merge; Auto-Merge nur noch für grüne `ci-agent/repair/*` → `master`/`main`.
- [x] Teilergebnis Push Org `ed94e4cd` — erledigt 2026-11-11: `029527a..42b5438` auf `origin/dev`, Check `43035981365` success; fremdes WIP unberührt.
- [x] Einen absichtlich roten, code-behebbaren Check bis zum grünen Promote/Deploy beobachten (Gemini-Repair-Pfad) — erledigt 2026-11-12: Probe `2acf731` → Repair `61dc56d`; Check `43140013721` + Live-Deploy `43140105706` success.
- [x] Checkout-Sync Org `d5c6a0f7` — erledigt 2026-11-12: `origin/dev`=`cadeefb`/`ed21341`, Org-Queue leer; AL-LOG `ed21341`.
- ~~Vite-8 Rolldown `__VITE_PRELOAD__`-Blackscreen~~: `fixRolldownPreloadMarker` vorbeugend (wie 6pack/skills).


# NEXT.md

Nächste Schritte für das Entspannungstrainer-Fachmodul in `relax-dev`.

## Aktive Arbeit

1. **Dependabot deepmerge (Alert #24, low):** Weiter ohne Upstream-Patch (`deepmerge` ≤4.3.1, `first_patched_version: null`); Transitiv Build-Zeit via `vite-plugin-pwa` → `workbox-build` → `@rollup/plugin-node-resolve`. Bei Patch-Release Override analog `minimatch` nachziehen. Alert #27 (`minimatch`) bestätigt `fixed` (2026-11-09).
2. **Store-Umbau Ausbildung.jsx (Variante A):** Sobald ein explizites `+go` des CEO vorliegt, die 19 `localStorage`-Zugriffe auf 8 Schlüssel über einen dedizierten `usePersistentState`-Hook konsolidieren. Formate und Schlüssel bleiben unverändert. (Store-Vorschlag liegt im Tageslog vor; Guide-Queue ist bis dahin leer).
3. **Fehlende Originalanleitungen:** Drive-Ordner, sämtliche relevanten Quell- und Notizdateien unter `~/Dokumente`, Kurskapitel-Suchen und ältere Archivkopien am 2026-11-02 gegengeprüft. Weder das FlexyFit-PDF-Archiv noch die Ausbildungs-MOC, Diplom-Notizen oder ältere Sicherung enthält eine methodenspezifische Ablaufanleitung für Mentaltraining, Autogenes Training, Fantasiereisen oder Meditation. Die MOC-Themen Achtsamkeit/Meditation und Stressmanagement durch mentales Training sind in den Karten markiert; AT-Themen bleiben ohne Formel oder erfundene Übungsfolge. Bei neuen Kursunterlagen erneut prüfen.
4. **Mobile Ablaufabnahme:** Im Headless-Firefox bei 320×640 sind Timeransicht und Abschlusszeile geprüft; bei 320×1400 auch der Fallaufgaben-Einstieg. Ein isolierter Marionette-Lauf bei 500 CSS-Pixeln (Firefox erzwang mindestens 500) bestätigte per Tastatureingabe Wochenselbstcheck, Kurzvariante und Abschlussrückblick, lokale Speicherung nach Reload, keinen horizontalen Überlauf sowie JSON-Export und Import nach absichtlicher Änderung eines lokalen Werts. Die Vorschau lief ohne Session-API-Proxys. Aus einem pausierten gespeicherten Timerzustand führte der Abschlussknopf zum vorbefüllten Nachweis-Entwurf; die Selbstbestätigung blieb leer und der Zähler bei 0/30. Den kompletten Weg auf iPhone/iPad weiter prüfen, einschließlich laufendem Timer-Restore, Formularbestätigung, Druck, CSV sowie Sicherung und Wiederherstellung der Ausbildungs- und Atemschulungs-Arbeitsblätter.
5. **Lokale Reflexion sichern:** Headless-Firefox hat echte Tastatureingabe, Speicherung von drei Methodenfeldern samt Fachgesprächs-Selbstcheck, Wiederherstellung nach Reload und Markdown-Export für Atemschulung bestätigt. Exportinhalt und getrennte Ablage waren korrekt. Auf iPhone/iPad die Texteingabe und den Export ergänzend prüfen; Methodenreflexionen bleiben vom formalen 30-Einheiten-Nachweis getrennt.
6. **Quellenänderungen nachziehen:** Bei neuen PDFs oder Aufgaben das MOC, `docs/ENTSPANNUNGSTRAINER-QUELLEN.md`, Methodenkarten, Lerncheck und Arbeitsblätter gemeinsam abgleichen.
7. **Ausbildungsgrenzen erhalten:** Kursangaben zu Ernährung, Stresswirkungen und Physiologie weiter als Lehrmaterial kennzeichnen; keine Diagnosen, Messungen, Heilversprechen oder individuellen Verordnungen daraus ableiten.
8. **Kursindex aktuell halten:** Die zwölf MOC-Hauptfächer und die konkreten Methodenthemen führen zu passenden Lernbereichen. „Kognitive Umstrukturierung zur Stressbewältigung“ und „Stress im Beruf und Alltag“ sind mit Kursübersicht/PDF abgeglichen; bei künftigen MOC- oder Quellenänderungen den Index und die Quellenmatrix gemeinsam prüfen.
9. **Portal-Kopie uncommitted (seit 2026-11-13):** `docs/apps.html` (Testlauf-Neugenerierung, Titel „App-Links“) liegt uncommitted — Owner-Entscheid committen oder verwerfen. Im Working Tree ist `scripts/portal.mjs` inzwischen erneut durch eine neuere `vos-portal`-Kopie überschrieben und wieder **nicht** Biome-formatiert (`pnpm run tooling:biome` meldet Fehler) — vor jedem Commit `pnpm dlx @biomejs/biome@2.6.6 format --write scripts/portal.mjs`, sonst wird Check (Relax) erneut rot.

Der Stand wurde am 2026-11-02 an den aktuellen Modulablauf angepasst. `docs/NEXT-legacy-2026-10-29.md` bewahrt die ältere Arbeitsliste und damalige Betriebsnotizen; deren aktueller Status wurde hier nicht neu geprüft.


## Gemini CI-Agent — verbleibende Betriebsprüfung

- [x] Einen echten roten, code-behebbaren CI-Lauf beobachten und bestätigen, dass Reparatur-Commit, grüner Check und vorgesehener Promote/Deploy enden — erledigt 2026-11-12 (`2acf731`→`61dc56d`, Check `43140013721`, Live-Deploy `43140105706`).
- [ ] Fehler außerhalb des Codes (fehlende Deploy-Credentials, externe Dienste, Runner-Ausfälle) separat als Diagnose melden; keine ungeprüften Änderungen an Secrets oder Deploy-Konfiguration.
- [x] GitHub Pages fuer `relax-dev` auf Branch `dev`, Ordner `/docs` prüfen/aktivieren — erledigt 2026-11-10 via `POST /repos/nimmsel23/relax-dev/pages` (`source.branch=dev`, `path=/docs`); Status `built`, Live `https://nimmsel23.github.io/relax-dev/` HTTP 200.
- [x] Merge-Agent ohne `master→vitalos` — erledigt 2026-11-11 in `.github/ci-agent/repair.mjs` (Release-Weg `dev→master`).
- [x] Gemini-Reparaturpfad nach dem Feld-Fix anhand eines isolierten roten Checks verifizieren — erledigt 2026-11-12: Diagnose/Repair `61dc56d` (`fix(ci): source repair [ci-agent]`), grüner Check `43140013721`, Promote + Live-Deploy `43140105706`.


**Gemini-Review (potenzielle blinde Flecken, 2026-11-13):**
*   **GitHub-Sicherheitslücken ignoriert:** Die `vos-release`-Ausgabe meldete 43 Schwachstellen in `vitalos`, die in der Selbstzusammenfassung und weiteren Bearbeitung nicht erwähnt wurden.
*   **`vos-portal`-Warnung nicht analysiert:** Die Ursache der Registry-Abweichung und die Konsequenzen des Nicht-Ausführens von `vos-portal` wurden nicht untersucht.
*   **`docs/apps.html`-Änderung unzureichend behandelt:** Die durch `portal.mjs` erzeugte und geänderte Datei wurde nicht weiter geprüft oder ihr Status geklärt, sondern nur als "uncommitted" belassen.
