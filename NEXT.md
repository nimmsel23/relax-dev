# CI-Agent — offener Betriebspunkt

- [ ] `GEMINI_API_KEY` und `SYNC_TOKEN` als Actions-Secrets fuer diesen Repo-Zweig einrichten/prüfen; einen absichtlich roten Check bis zum grünen Promote/Deploy beobachten.

# NEXT.md

Nächste Schritte für das Entspannungstrainer-Fachmodul in `relax-dev`.

## Aktive Arbeit

1. **Fehlende Originalanleitungen:** Drive-Ordner, sämtliche relevanten Quell- und Notizdateien unter `~/Dokumente`, Kurskapitel-Suchen und ältere Archivkopien am 2026-11-02 gegengeprüft. Weder das FlexyFit-PDF-Archiv noch die Ausbildungs-MOC, Diplom-Notizen oder ältere Sicherung enthält eine methodenspezifische Ablaufanleitung für Mentaltraining, Autogenes Training, Fantasiereisen oder Meditation. Die MOC-Themen Achtsamkeit/Meditation und Stressmanagement durch mentales Training sind in den Karten markiert; AT-Themen bleiben ohne Formel oder erfundene Übungsfolge. Bei neuen Kursunterlagen erneut prüfen.
2. **Mobile Ablaufabnahme:** Im Headless-Firefox bei 320×640 sind Timeransicht und Abschlusszeile geprüft; bei 320×1400 auch der Fallaufgaben-Einstieg. Ein isolierter Marionette-Lauf bei 500 CSS-Pixeln (Firefox erzwang mindestens 500) bestätigte per Tastatureingabe Wochenselbstcheck, Kurzvariante und Abschlussrückblick, lokale Speicherung nach Reload, keinen horizontalen Überlauf sowie JSON-Export und Import nach absichtlicher Änderung eines lokalen Werts. Die Vorschau lief ohne Session-API-Proxys. Aus einem pausierten gespeicherten Timerzustand führte der Abschlussknopf zum vorbefüllten Nachweis-Entwurf; die Selbstbestätigung blieb leer und der Zähler bei 0/30. Den kompletten Weg auf iPhone/iPad weiter prüfen, einschließlich laufendem Timer-Restore, Formularbestätigung, Druck, CSV sowie Sicherung und Wiederherstellung der Ausbildungs- und Atemschulungs-Arbeitsblätter.
3. **Lokale Reflexion sichern:** Headless-Firefox hat echte Tastatureingabe, Speicherung von drei Methodenfeldern samt Fachgesprächs-Selbstcheck, Wiederherstellung nach Reload und Markdown-Export für Atemschulung bestätigt. Exportinhalt und getrennte Ablage waren korrekt. Auf iPhone/iPad die Texteingabe und den Export ergänzend prüfen; Methodenreflexionen bleiben vom formalen 30-Einheiten-Nachweis getrennt.
4. **Quellenänderungen nachziehen:** Bei neuen PDFs oder Aufgaben das MOC, `docs/ENTSPANNUNGSTRAINER-QUELLEN.md`, Methodenkarten, Lerncheck und Arbeitsblätter gemeinsam abgleichen.
5. **Ausbildungsgrenzen erhalten:** Kursangaben zu Ernährung, Stresswirkungen und Physiologie weiter als Lehrmaterial kennzeichnen; keine Diagnosen, Messungen, Heilversprechen oder individuellen Verordnungen daraus ableiten.
6. **Kursindex aktuell halten:** Die zwölf MOC-Hauptfächer und die konkreten Methodenthemen führen zu passenden Lernbereichen. „Kognitive Umstrukturierung zur Stressbewältigung“ und „Stress im Beruf und Alltag“ sind mit Kursübersicht/PDF abgeglichen; bei künftigen MOC- oder Quellenänderungen den Index und die Quellenmatrix gemeinsam prüfen.

Der Stand wurde am 2026-11-02 an den aktuellen Modulablauf angepasst. `docs/NEXT-legacy-2026-10-29.md` bewahrt die ältere Arbeitsliste und damalige Betriebsnotizen; deren aktueller Status wurde hier nicht neu geprüft.
