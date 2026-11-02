# Übungswiederholung im editierbaren Stundenentwurf verankert (2026-11-02)

- Der Standardtext des Hauptteils erinnert jetzt daran, ausgewählte Übungen oder kleine Übungskomplexe zu wiederholen, damit das Erlernte leichter in den Alltag übergeht.
- Die Empfehlung aus „Stundenplanung“, S. 7, steht damit direkt im bearbeitbaren und exportierbaren Stundenentwurf, nicht nur in den allgemeinen didaktischen Leitlinien.

# 30-Zeilen-Praxisnachweis auf eine A4-Seite angepasst (2026-11-02)

- Der erste Druckvergleich ergab zwei Seiten statt einer; Seitenränder und Zeilenhöhe wurden an das offizielle einseitige A4-Formular angeglichen.
- App-Kopf/Fußnavigation und dunkler Bildschirmhintergrund werden im Ausdruck ausgeblendet; die Signaturspalte bleibt für handschriftliche Unterschriften frei.
- Thorium-Druckvorschau ergab abschließend eine A4-Seite mit den Zeilen 1–30 und den Spalten Datum, Beschreibung und Unterschrift. `npm run build` und `git diff --check` waren erfolgreich; keine Tests ausgeführt.

# Überblicksfach direkt mit Methoden verbunden (2026-11-02)

- Das Fach „Entspannungsmethoden – ein Überblick“ führt jetzt in die Methodenbibliothek und direkt zu PMR, AT, Fantasiereise, Meditation, Coping-Ansatz und unterstützenden Verfahren.
- Damit sind die expliziten MOC-Themen im Kursindex direkt erreichbar; die Themenkarten kennzeichnen fehlende Original-Abläufe weiterhin.

# Kursfächer und Ausbildungsaufgaben klar getrennt (2026-11-02)

- Den Kursindex auf genau die zwölf offiziellen Unterrichtsfächer begrenzt.
- Vier-Wochen-Pflichtaufgabe und 30-Einheiten-Praxisprotokoll als separate ergänzende Ausbildungsaufgaben unter eigener Überschrift dargestellt, mit direkten Einstiegen in beide Bereiche.
- Den Hinweistext an die sichtbare Trennung angepasst. `git diff --check` sauber; keine Tests ausgeführt.

# Ausbildungsarbeitsstand zwischen Geräten übertragen (2026-11-02)

- Der Modulstart kann Stundenentwurf, Vier-Wochen-Fallaufgabe, Lerncheck, Reflexionen, die beiden Atemschulungs-Arbeitsblätter und den pausierten oder laufenden Timer gemeinsam als versionierte JSON-Datei sichern und auf einem anderen Gerät wiederherstellen.
- Die Local-Storage-Schlüssel der Atemschulungsaufgaben sind zentral definiert und werden von Ausbildungsansicht und Atemtrainer gemeinsam verwendet. Schema-Version 2 importiert außerdem frühere Version-1-Sicherungen mit leeren Atemschulungsfeldern.
- Der Import prüft Format und Grundstruktur, fragt vor dem Ersetzen des lokalen Arbeitsstands nach und rollt lokale Schlüssel bei einem Speicherfehler zurück. Der formale Praxisnachweis bleibt im Session-Speicher und wird nicht Teil der Sicherungsdatei.
- `pnpm run build` scheiterte vor Vite an der schreibgeschützten pnpm-Engine-Store-Lockdatei (`ERR_PNPM_STORE_DIR_OPEN_OPERATION_LOCK`); der gleiche Projekt-Build lief mit dem vorhandenen `npm run build` erfolgreich durch (Vite und PWA-Service-Worker). `git diff --check` ist sauber; kein Test ausgeführt.

# Wochenselbstcheck in der Vier-Wochen-Aufgabe ergänzt (2026-11-02)

- Das Fallarbeitsblatt bildet jetzt auch den freiwilligen Wochenrückblick aus dem eigenen ausgearbeiteten Ernährung-/Entspannungskonzept ab: innere Unruhe, Einschlafen, Verdauung und Routinen auf einer 1–10-Skala.
- Skalenrichtung und Grenzen sind direkt an den Feldern erläutert. Der Check bleibt optional, ergänzt keine offizielle Pflichtanforderung und erscheint auch im Markdown-Export.

# Kurzvariante und Abschlussrückblick in der Fallaufgabe ergänzt (2026-11-02)

- Die App übernimmt zwei weitere Teile des eigenen ausgearbeiteten Konzepts: eine kleine Alltagsvariante für volle Tage und den Rückblick auf hilfreiche Methoden/Essensvorbereitung sowie zwei weiterzuführende Routinen.
- Beide Abschnitte sind als persönliche Ergänzungen und nicht als offizielle Pflichtfelder gekennzeichnet; der Markdown-Export enthält sie.
- `npm run build` einschließlich PWA-Service-Worker und `git diff --check` liefen erfolgreich. Ein isolierter Headless-Firefox/Marionette-Lauf unter Xvfb bei 500 CSS-Pixeln Breite bestätigte Tastatureingabe und Reload-Speicherung aller neuen Felder, Wochenselbstcheck 7/10 sowie fehlenden horizontalen Überlauf. Version-2-JSON-Export enthielt den Fallstand und die Atemschulungs-Schlüssel; der Import stellte nach absichtlicher lokaler Änderung den exportierten Fallstand nach Bestätigung und Reload wieder her. Die lokale Vorschau hatte keine API-Proxys und las keine Sessions. Direkter Firefox-Start ohne Xvfb scheiterte zuvor mit Exit-Code 139; die iPhone-/iPad-Abnahme bleibt offen.

# Unterstützende Maßnahmen im Methoden- und Praxisprotokoll auswählbar gemacht (2026-11-02)

- Neuer Sammelpunkt erschließt Tai-Chi, Qigong und Feldenkrais aus Stresstheorie S. 58; Yoga und Meditation bleiben mit eigenen Methodenkarten vertreten.
- Die 30-Einheiten-Erfassung gibt beim Sammelpunkt einen Hinweis, die konkret durchgeführte Praxis im Beschreibungsfeld zu benennen. Die Quellenkarte bleibt eine Übersicht ohne erfundene Schrittfolgen.

# Selbsthypnose als Soforthilfe-Kursverweis ergänzt (2026-11-02)

- Methodenliste und Lerncheck enthalten jetzt Selbsthypnose aus Stresstheorie S. 52.
- Die Karte kennzeichnet die Stelle als Überblick und gibt weder die Wirkbehauptungen der Quelle als bestätigt aus noch ergänzt sie eine fehlende Schrittfolge. Quellenmatrix und TODO aktualisiert.

# Persönliche Sitzungsnotizen als Praxisprotokolle abgegrenzt (2026-11-02)

- Quellenmatrix kennzeichnet die beiden lokalen Sitzungsnotizen als eigene Praxisdokumentation, nicht als FlexyFit-Anleitungen.
- Die erweiterte Atemnotiz enthält zusätzliche Methoden und Wirkbehauptungen, die im Original-PDF nicht belegt sind; das Originalskript bleibt für die Methodenkarte maßgeblich.

# Suggestive Musik als emotionales Kursverfahren ergänzt (2026-11-02)

- Methodenliste bildet jetzt auch die zweite emotionale Methode aus Stresstheorie S. 55 ab: suggestive Musik.
- Die Karte trennt die Einordnung von der allgemeinen optionalen Musikplanung aus Stundenplanung S. 11, 16 und 24 und enthält keine unbelegte Suggestiv- oder Musikfolge. Lerncheck und Quellenmatrix aktualisiert.

# Muskuläre Methodenebene vervollständigt (2026-11-02)

- Methodenliste enthält jetzt alle drei Verfahren aus Stresstheorie S. 55: konzentrative Muskelentspannung, PMR und muskuläres Tiefentraining.
- Für die beiden nur aufgezählten Verfahren bleiben die Karten bewusst bei der Einordnung; es werden keine unbelegten Anleitungen erzeugt. Eine passende Lerncheck-Frage ergänzt.

# Bildvergleich Stress und Entspannung ergänzt (2026-11-02)

- Grundlagenansicht enthält jetzt eine zugängliche Vektorgrafik zur Gegenüberstellung aus Stresstheorie S. 66.
- Da die Quelle den Pfeilen keine Größen oder Körpervorgänge zuordnet, kennzeichnet die App die Illustration ausdrücklich als schematisch. Quellenmatrix und TODO aktualisiert.

# Kompensationsmuster aus der Ernährungsstudie im Lerncheck ergänzt (2026-11-02)

- Eine weitere Lernfrage behandelt den im Skript beschriebenen Wechsel des Essverhaltens zwischen belastenden und positiven Situationen (S. 20–23).
- Die Begründung ordnet dies als Studienbericht und mögliches Muster ein, nicht als Regel für einzelne Personen. TODO aktualisiert.

# Essverhalten bei Stress im Lerncheck ergänzt (2026-11-02)

- Lerncheck fragt jetzt auch ab, dass „Stress-Esser“ und „Stress-Hungerer“ vereinfachte Beschreibungen und weder Diagnosen noch feste Gesundheitstypen sind.
- Die Begründung bildet die Warnung des Skripts vor pauschaler Abwertung und zusätzlichen Stress durch Ermahnungen ab (S. 19–24). TODO aktualisiert.

# Ernährung im Lerncheck ergänzt (2026-11-02)

- Zwei Fragen prüfen jetzt die Aussage, dass kein einzelnes Lebensmittel Stress direkt reduziert, und die Skriptaussage, dass Supplemente bei gesunden Menschen mit ausgewogener Ernährung in der Regel nicht erforderlich sind.
- Beide Antworten verweisen auf die Ernährungsseiten und grenzen Kursaussagen von individuellen Empfehlungen ab. TODO aktualisiert.

# Relative Entspannung aus dem Lehrskript ergänzt (2026-11-02)

- Grundlagenkarte erklärt jetzt den Hinweis aus Stresstheorie S. 63: eine spürbare Entspannung gegenüber einem hohen Ausgangsniveau bedeutet nicht zwingend, dass bereits umfassende Ruhe erreicht ist.
- Die Karte verknüpft diese relative Veränderung mit subjektiver Wahrnehmung und der Grenze, daraus keine Körpermesswerte abzuleiten. TODO aktualisiert.

# Lokale Themenübersicht zum Autogenen Training erschlossen (2026-11-02)

- Die AT-Methodenkarte führt jetzt die Themen aus der lokalen MOC-Notiz auf: Grund-, Mittel- und Oberstufe sowie Ruhe-, Schwere-, Wärme-, Atem-, Herz-, Bauch- und Stirnübungen.
- Die Notiz ist ausdrücklich als persönliche Themenübersicht gekennzeichnet; konkrete Formeln und Schrittfolgen fehlen weiterhin. Quellenmatrix und TODO aktualisiert.

# Anfangsritual im Stundenentwurf konkretisiert (2026-11-02)

- Der Einleitungsblock nennt jetzt die drei Schritte des Kursrituals aus „Stundenplanung“, S. 22: bewusste Entscheidung, Entspannungsposition und Innenwendung der Aufmerksamkeit.
- Augenschluss ist ausdrücklich optional. TODO aktualisiert.

# Stressgrundlagen aus dem Ernährungsskript ergänzt (2026-11-02)

- Kursübersicht im 4-Wochen-Fallkonzept ergänzt: Stressreaktion, Alarm-/Widerstands-/Erschöpfungsphasen, im Skript aufgeführte Folgen und Gegenmaßnahmen aus „Entspannung und Ernährung“, S. 4–12.
- Quellenmatrix präzisiert: S. 1–3 sind Titel, Inhaltsverzeichnis und Kapiteltrenner; die inhaltliche Abdeckung beginnt auf S. 4. Lehrmodell und Gesundheitsangaben bleiben als Kursinhalt eingeordnet.
- TODO aktualisiert.

# Ernährungs-Pflichtaufgabe mit Quellenübersicht erweitert (2026-11-02)

- Aufklappbare Übersicht im Fallkonzept ergänzt: Essverhalten bei Stress, Brain-Food-Beispiele, Power-Food-Kapitel, Supplemente sowie Naturheilmittel und Rezepte mit Seitenbereichen.
- Grundlagenkapitel S. 25–38 ergänzt: ausgewogene Ernährung, Mahlzeitenrhythmus, Getränke und Essenssituation; einzelne Lebensmittel werden laut Skript nicht als direkte Stressreduktion belegt.
- Gesundheitsbehauptungen und Einnahmeangaben werden als Inhalte der Vorlage kenntlich gemacht und nicht als bestätigte Wirkung oder Trainerempfehlung dargestellt.
- Quellenmatrix und TODO aktualisiert.

# Stressansätze und Wirkungsübersicht ergänzt (2026-11-02)

- Grundlagenansicht um die im Skript gegenübergestellten Stressansätze, die Einführung in Sympathikus/Parasympathikus und die vereinfachte Hormonübersicht erweitert.
- Die Wirkungsaufzählung zu Entspannung und die EEG-Bandübersicht sind jetzt als Aussagen der Kursunterlage auffindbar und ausdrücklich von individueller Wirkung oder App-Messwerten getrennt.
- Quellenmatrix, Fundstellen und TODO mit S. 18–21 und 62–68 ergänzt.

# PMR-Kursskript von der Handout-Langform getrennt abgebildet (2026-11-02)

- PMR-Methodenkarte erweitert um Prinzip, Lernschritte, Vorbereitung, Kursrahmen für Anspannen/Nachspüren, Gruppenfolge, Rückführung und Nachbesprechung.
- Die Überschrift „16 Schritte“ stimmt in der Quelle nicht klar mit den beiden gelisteten Abläufen überein; die App weist auf diese Unstimmigkeit hin, statt eine eigene Reihenfolge als Original auszugeben.
- Lokale interaktive 20-Schritte-Langform und offizielles PMR-Kursskript sind in der Karte als unterschiedliche Quellen ausgewiesen.

# Pranayama-Kursaufgabe im Atemtrainer ergänzt (2026-11-02)

- Neues lokales Arbeitsblatt bildet den Kursauftrag S. 39 ab: Technik auswählen, Anleitungstext vorbereiten, frei sprechen üben, in der Gruppe anleiten und Feedback reflektieren; Markdown-Export ergänzt.
- Kursliste der Pranayama-Techniken ist mit S. 38 referenziert. Für die meisten Techniken liefert das Skript keine vollständige Anleitung; das Arbeitsblatt erstellt deshalb keine eigene Praxisfolge.
- Holotropes Atmen und Qigong werden als Exkurse des Skripts sichtbar, inklusive Hinweis auf spekulative/unbestätigte Behauptungen und ohne geführte Praxis.

# Wirbelsäulen-Wahrnehmungsübungen vervollständigt (2026-11-02)

- Methodenkarte ergänzt um den Bewegungsablauf der Beckenuhr, die Formate des Kapitels Bewegungsfreude und zwei bislang fehlende Partnerübungen: Wohlfühlkreis und Druckpunkte.
- Taktile Übungen sind explizit freiwillig und zustimmungsbasiert; keine diagnostische Auswertung oder Anleitung an schmerzhaften Bereichen.
- Quellenmatrix und TODO um die konkret abgebildeten Praxisinhalte aktualisiert.

# Fünf Tibeter mit Kursbewegungen abgeglichen (2026-11-02)

- Methodenkarte beschreibt jetzt Ausgangsposition, Hauptbewegung und Ausgleich der fünf Folgen anhand der PMR-Originalseiten 31–45.
- Wiederholungsempfehlung und umstrittene Herkunftserzählung sind als Quellinhalt eingeordnet und nicht als persönliche Trainingsvorgabe bzw. gesicherte historische Tatsache dargestellt.
- Quellenmatrix und TODO an den Umfang der Praxisübersicht angepasst.

# Pilates-Konzeptbegriffe in der Methodenkarte ergänzt (2026-11-02)

- Pilates-Atmung, Stance, Flat Back/Imprint, Bauchnabel-Cue, Pospannung, Kinn-zur-Brust und Achseln-zum-Becken-Cue aus den Originalseiten 9–15 ergänzt.
- Abweichende Atemempfehlungen im Skript und stark formulierte Haltungscues sind als Quellbegriffe gekennzeichnet, nicht als allgemeingültige Technikvorschrift.
- Quellenmatrix und TODO ergänzt.

# Yoga-Einleitung und Asana-Grundsätze ergänzt (2026-11-02)

- Methodenkarte ergänzt um die Yoga-Einordnung des Kurshefts und dessen Asana-Grundsätze zu Vorübungen, Varianten, Aufsicht und angenehmer Ausführung.
- Die Quelle deckt jetzt S. 3–72 ab; alle 22 Haltungen/Bewegungsformen bleiben mit Seitenangaben aufgeführt.
- Quellenmatrix und TODO aktualisiert.

# Atemmechanik um Kehlkopf und Zwerchfell ergänzt (2026-11-02)

- Aufklappbare Theorieübersicht aus Atemschulung S. 15–20 und 24–27 ergänzt: Druckmodell, Ein-/Ausatmung, Kehlkopffunktion und Zwerchfell.
- Die Übersicht bleibt anatomischer Kursstoff; Prozentangaben werden nicht als individuelle Messung gezeigt und forcierte Atembewegungen nicht angeleitet.
- Quellenmatrix und TODO aktualisiert.

# Rücknahme bei AT und Fantasiereisen quellenbasiert ergänzt (2026-11-02)

- Die Stundenplanung S. 12 beschreibt für AT und Fantasiereisen eine ausreichend lange, schrittweise Rücknahme und nennt ein wiederkehrendes Aktivierungsritual als Beispiel; S. 13 empfiehlt ein Abschlussgespräch.
- Diese Kursrahmen sind nun direkt bei den beiden Methoden sichtbar. Sie werden ausdrücklich nicht als fehlende methodenspezifische Schritt-für-Schritt-Anleitung ausgegeben.
- Quellenmatrix und TODO aktualisiert.

# Umgebungs- und Gruppenbedingungen konkretisiert (2026-11-02)

- Die Stundenplanung S. 11, 16 und 19 differenziert die Vorbereitung nach Musiktyp und Lautstärke, Störquellen außerhalb des Raums und Betreuung größerer Gruppen.
- Diese Bedingungen sind nun konkret als abhaktbare Punkte in der Vorbereitungsliste sichtbar.
- TODO aktualisiert.

# Essverhalten bei Stress differenziert eingeordnet (2026-11-02)

- Ernährung S. 14–24 beschreibt Stress-Essen und Stress-Hungern, situative Kompensation und warnt vor pauschaler Abwertung oder Ermahnung zu mehr Selbstdisziplin.
- Die Pflichtaufgaben-Übersicht hält diese Lehrinhalte jetzt sichtbarer fest und kennzeichnet die Muster ausdrücklich nicht als feste Typen oder Diagnosekategorien.
- Quellenmatrix und TODO aktualisiert.

# Ernährungsgrundlagen S. 25–38 konkretisiert (2026-11-02)

- Das Arbeitsblatt benennt jetzt die Kursabschnitte zu komplexen Kohlenhydraten, Nährstoffbeispielen, Trink-Richtwert und ruhigen Mahlzeitenpausen mit Seitenangaben.
- Die Mengenangabe und Wirkannahmen bleiben klar als Aussagen der Kursunterlage statt als persönliche Vorgaben markiert.
- Quellenmatrix und TODO aktualisiert.

# Brain- und Power-Food-Kapitel vollständiger erschlossen (2026-11-02)

- Die Materialübersicht nennt nun auch Yamswurzel als Brain-Food-Beispiel sowie heimische Lebensmittel, Beeren, Trockenobst, Weizengras, Chia, Zimt, Zitronen und den Abschnitt zu sekundären Pflanzenstoffen (S. 39–69).
- Wirkversprechen bleiben sichtbar als Aussagen des Lehrskripts gekennzeichnet und werden nicht als Empfehlung übernommen.
- Quellenmatrix und TODO aktualisiert.

# Soul Food und Ernährung/Depression ergänzt (2026-11-02)

- Die Pflichtaufgaben-Übersicht umfasst nun auch Capsaicin/scharfe Lebensmittel und Moodfood (S. 79–83) sowie den bislang ausgelassenen Abschnitt „Ernährung und Depression“ (S. 84).
- Stimmungs- und Gesundheitswirkungen werden als Aussagen der Kursunterlage kenntlich gemacht, nicht als Diagnose oder Behandlungsempfehlung.
- Quellenmatrix und TODO aktualisiert.

# Kräuter- und Rezeptabschnitt quellenkritisch erweitert (2026-11-02)

- Die Arbeitsblatt-Übersicht nennt nun das vollständige Kräuterinventar S. 90–104, den Johanniskraut-Wechselwirkungshinweis (S. 94), die ärztliche Abklärung bei anhaltender Unruhe/Erschöpfung (S. 89) und die beiden Teemischungen (S. 106–107).
- Einnahme- und Dosierungsangaben werden nicht als App-Anleitung übernommen; die Abschnitte bleiben als Kursquelle erkennbar.
- Quellenmatrix und TODO aktualisiert.

# Wirbelsäulen-Praxis bis zum tatsächlichen Skriptende ergänzt (2026-11-02)

- Der PDF-Abgleich ergab 40 Seiten; das Bewegungsfreude-Kapitel endet auf S. 39, nicht S. 38. Kursmethoden (Kooperation, Kreativität, Geräte, Musik, Außenraum, Erfahrungsreflexion) sind nun in der Methodenkarte abgebildet.
- Die Quellenmatrix deckt jetzt S. 24–39 ab. Beckenuhr (S. 35–36) und Druckpunkte (S. 32) haben korrigierte Seitenbezüge.
- TODO aktualisiert.

# Ausdauer-Kapitel bis S. 26 vervollständigt (2026-11-02)

- Das 27-seitige PDF enthält nach der bisherigen Abdeckung bis S. 24 weitere Kursbeispiele: Wassersport, Mannschaftssport, Naturerlebniswege und Bewegungsparks (S. 25–26).
- Die Karte führt diese mit Fundstellen auf und kennzeichnet Flow als mögliches individuelles Erleben statt als Ergebnis.
- Quellenmatrix und TODO aktualisiert.

# Stressdefinition und Reaktionsschema ergänzt (2026-11-02)

- Die Grundlagenansicht unterscheidet nun Stressor, Stressreaktion und subjektives Erleben (Stresstheorie S. 5) und enthält das Steinzeit-/Moderner-Mensch-Schema aus S. 10–13.
- Das zugespitzte Schema ist ausdrücklich als Unterrichtsillustration und nicht als allgemeine Stressfolge oder individuelle Prognose eingeordnet.
- Quellenmatrix und TODO aktualisiert.

# Bebilderte Flexibilitätsübungen und Gegenbewegungen ergänzt (2026-11-02)

- Der PDF-Abgleich zeigte, dass S. 18–28 eigene Ober- und Unterkörper-Übungstafeln enthalten und S. 41 vorbereitende Gegenbewegungen beschreibt.
- Die Stretching-Karte dokumentiert diese Bereiche und trennt die nicht ausformulierten Zeichnungen von der textlichen Anleitung, statt Namen oder Cues zu erfinden.
- Quellenmatrix und TODO aktualisiert.

# Pilates-Körpersegmenttafeln erschlossen (2026-11-02)

- Die bisher ausgesparten Seiten 22–23 zeigen visuell markierte, funktionell wichtige Körpersegmente zwischen Konzept und Übungssammlung.
- Methodenkarte und Quellenmatrix führen sie nun als visuelle Orientierung auf, nicht als zusätzliche Übungsfolge.
- TODO aktualisiert.

# Ausdauer-Kapitel vollständig abgeglichen (2026-11-02)

- Methodenkarte auf das vollständige Kapitel „Entspannung & Ausdauer“ (S. 4–24) erweitert: allgemeine und spezielle Wirkungsfelder, Belastungsgefühl, Kursrichtwerte, Sportdauern, Alltagsbezug und praktische Varianten.
- Aussagen und Richtwerte des Skripts sind als Kursinhalte bzw. Beispiele gekennzeichnet; daraus werden keine individuellen Wirkungszusagen oder Trainingsverordnungen abgeleitet.
- Quellenmatrix und TODO an den vollständigen Seitenumfang angepasst.

# Push von dev und Meta-Repo-Release relax-release (2026-10-29)

Abschluss der Release-Kette `dev` → `master` → `vitalos` für das Atem-Feature. Die Hinweise „nichts gepusht" in den beiden Einträgen darunter gelten damit nicht mehr.

- **Branch `dev`**: gepusht (`2d07df5..952eecd`), `dev` und `origin/dev` sind gleich. Neben dem Fast-Forward auf `origin/master` (`0d43599`) enthält der Push den Docs-Commit `952eecd` (RESULTS/NEXT). Kein neues Release, live bleibt der Stand von `0d43599`.
- **`relax-release --yes`**: lief durch (ein vorheriger Aufruf `releax-release` war ein Tippfehler und führte nichts aus). Der Branch `vitalos` in `relax-dev` wurde von `3daa8cc` auf `0d43599` vorgezogen und gepusht; der `relax-app`-Pointer im Meta-Repo `~/vitalos` steht auf `0d43599` (Skript meldete „No parent submodule pointer changes detected", im Meta-Repo war nichts mehr zu pushen).
- **Zusätzlicher Hosting-Deploy**: `relax-release` hat lokal gebaut und per `firebase deploy` erneut auf die Site `relax-vos` ausgeliefert; inhaltlich derselbe Stand wie der CI-Deploy von 13:08 UTC.
- **Live-Ort des Atem-Features**: https://relax-vos.web.app/#atem (Firebase-Hosting-Site `relax-vos`, Projekt `fitness-aos`, laut `firebase.json`). Die Atem-Dateien liegen auf `origin/master`. Die Seite selbst wurde nicht im Browser geöffnet.

---

# Release dev → master und Live-Deploy (2026-10-29)

Nachtrag zur Atem-/Build-Session: Der Release-Weg `dev` → `master` → Live-Deploy lief durch, nachdem ein roter CI-Check behoben war. Der Hinweis „nichts gepusht oder deployt" im Eintrag darunter gilt damit für den Release nicht mehr.

- **`package.json` (test-Script, `a217146`)**: `Check (Relax)` war auf `607b528` rot, weil `node --test tests/` unter Node 22.23 den Ordner als Modulpfad auflöst (lokal mit Node 26 unauffällig). Script nutzt jetzt `node --test tests/*.test.mjs`; mit der offiziellen Node-22.23.4-Binary reproduziert und verifiziert (23/23 Tests, Build grün).
- **Release-PR `dev` → `master` (#1)**: gemergt, `Check (Relax)` grün, Auto-Merge lief, danach Dispatch von „Live Deploy (Relax master)" (`deploy-master.yml`) erfolgreich.
- **`.github/workflows/automerge.yml`**: musste nicht mehr angepasst werden — `origin/master` hatte die Korrektur (`--base master`, `3daa8cc`) schon, nur `dev` hinkte hinterher; `deploy-master.yml` lag bisher nur auf `master`.
- **Branch `dev`**: lokal per Fast-Forward auf `origin/master` (`0d43599`) gebracht, Workflows auf beiden Branches identisch. `dev` ist 7 Commits vor `origin/dev`, nichts gepusht.

---

# Atem-Tab, Build-Fixes, node:sqlite und Cloud-Tauglichkeit (2026-10-29)

Neues Feature „Atem" (Visualizer, Streaks, Dashboard-Karte) plus Aufräumen am Build: Der Vite-Build lieferte wegen absoluter bzw. veralteter Kopien unter `public/` nur einen 5-kB-Stub. Außerdem `better-sqlite3` durch `node:sqlite` ersetzt, CI auf pnpm umgestellt und das Repo aus einem frischen Checkout lauffähig gemacht. Alles auf `dev` committet, nichts gepusht oder deployt.

- **Atem-Tab** (`src/views/Breath.jsx`, `src/components/breath/BreathPlayer.jsx`, `src/lib/breath/patterns.js`, `e12c69d`): 5 Kategorien mit 15 Techniken, Muster-Karten mit PNI-Erklärung, Orb-Visualizer (Phasenring, Countdown, 3-s-Vorlauf, Wake-Lock, Pause/Beenden, optionale Vibration). Abschluss fragt Stimmung ab und schreibt ins normale Session-Log (Läufe < 20 s verworfen). Tab `#atem` in `src/App.jsx`, `.no-scrollbar` in `src/styles.css`, CLAUDE.md ergänzt. Muster liegen bewusst in `src/lib/`, weil `src/data/` von `.gitignore` verschluckt wird.
- **Atem-Statistik** (`src/lib/breath/stats.js`, `src/lib/breath/prefs.js`, `tests/breath-stats.test.mjs`, `f4520b5`): Atem-Erkennung, Minuten pro Tag, aktuelle/längste Serie, Tageszeit-Vorschlag; `Breath.jsx` nutzt die gemeinsamen Module.
- **Dashboard-Karte „Atmen"** (`src/components/breath/BreathCard.jsx`, `fbf0b1d`): Serie, Rekord, 7-Tage-Balken, Tageszeit-Vorschlag mit Sprung in den Atem-Tab. Nur gegen Mock-Server im Headless-Browser getestet.
- **Build-Fix Symlinks/Kopien** (`31ffa4c`, `74e81c2`, `eca76ec`): `public/src`, `public/index.html`, `public/physio`, `scripts/deploy.sh`, `scripts/kb`, `scripts/physio-devctl`, `physio-sim/fuel-dev` und `physio-devctl` entfernt; `bin/physio-devctl` ist jetzt ein relativer Symlink. `npm run build` liefert wieder die volle App (~820 kB statt Stub), `dist/` enthält kein `src/` und kein `physio/` mehr.
- **`server/knowledge/kb-db.js`, `kb-cache.js`, `package.json`** (`22a1917`): `better-sqlite3` durch eingebautes `node:sqlite` (`DatabaseSync`) ersetzt, Abhängigkeit entfernt, CLAUDE.md/GEMINI.md angepasst. Gegen Kopie der DB geprüft (Lese-/Schreibpfade, `curated`-Schutz, WAL, Foreign Keys).
- **CI und Cloud-Setup** (`693f6b0`, `1468d1f`, `a1b3af7`, `a217146`): `.github/workflows/check.yml` und `preview-dev.yml` auf pnpm, neues `scripts/ci-install.sh` (gemeinsamer Einstieg für CI/Devcontainer, schreibt `allowBuilds` nur flüchtig und nur ohne übergeordneten Workspace, standalone `--frozen-lockfile`), `pnpm-lock.yaml` eingecheckt, `.nvmrc` + `engines` (Node ≥ 22.13), `.devcontainer/devcontainer.json`, `tests/server-smoke.test.mjs`, `test`-Script als Dateiliste, README/CLAUDE.md um „Cloud-Entwicklung" ergänzt (inkl. Korrektur `~/.env/relax.env`). In frischer Kopie mit leerem `HOME` verifiziert: Install, Tests, Build grün.
- **README** (`607b528`): Release-Weg auf `dev` → `master` → `vitalos` korrigiert (laut `AGENTS.md`).

---

## 2026-10-21 — Gemeinsamer Changelog

Universalisierten VitalOS-Release-Dialog über vendorte Vite-Module eingebunden. Standalone mit eigener Bestätigung; eingebettet unterdrückt zugunsten des zentralen Shell-Dialogs.

# RESULTS.md

Session: physio-sim (2026-05-18)

## Completed

### Dual-Catalog Knowledge Base Architecture
- Implemented bidirectional substance ↔ molecule mapping in YAML catalogs
- 19 herbal substances + 27 biochemical molecules with cross-references
- Each molecule tracks `found_in` (which substances contain it)
- Each substance tracks `references` (which molecules it contains)

### Knowledge Base Loader & Dispatcher
- Extended `kb-loader.js` with `dispatchQuery()` intelligent router
- Substance expansion: substance → molecules → interactions between them
- Molecule expansion: molecule → substances containing it → related molecules (via interactions)
- Caching + indexing for fast lookups across both catalogs
- Search across both catalogs unified (`searchAll()`)

### Knowledge API Routes
- Implemented `/api/knowledge/*` endpoint suite in `knowledge.js`
- `/api/knowledge/expand?q=...` — unified dispatcher (detects substance or molecule)
- `/api/knowledge/substance/:id` — single substance
- `/api/knowledge/expand/substance/:id` — substance expansion
- `/api/knowledge/molecule/:id` — single molecule (with AI enrichment fallback)
- `/api/knowledge/expand/molecule/:id` — molecule expansion
- `/api/knowledge/interaction?mol1=...&mol2=...` — interaction lookup (with AI generation)
- `/api/knowledge/search?q=...` — cross-catalog search
- `/api/knowledge/health` — KB status (added `dual_catalog_enabled: true`)
- All routes integrated into `server.mjs`

### Graph Visualization
- Built `KnowledgeGraph.jsx` Reactflow component
- Custom node types: `SubstanceNode` (central, larger) + `MoleculeNode` (circular layout)
- Substance at (0, 0), molecules arranged in circle (radius 280px)
- Edges: substance→molecule (animated gray), molecule↔molecule (color-coded: green synergistic, red antagonistic dashed)
- Includes ReactFlow controls, background, mini-map
- Loading/error/empty states

### UI Integration
- Added List/Graph toggle to `SubstanceCatalog.jsx`
- Graph view shows `KnowledgeGraph` component
- List view preserves existing flat categorized display
- Separate search inputs for list vs graph modes
- All existing functionality preserved

### Gemini API Configuration
- Moved API key loading from `~/.env/gemini.env` → `~/.env/relax.env`
- Updated `ai-enricher.js` + `ai-enricher-v2.js` to load from `~/.env/relax.env`
- Project-level `relax.env.example` removed (was in .gitignore anyway)
- Config uses `os.homedir()` for cross-platform compatibility

### Git Commits
- `401bfb1` — Dual-catalog + graph visualization implementation
- `1696ac8` — Documentation + configuration updates
- `d533e3f` — Gemini API config (initial, project-level relax.env)
- `474a617` — Remove relax.env.example
- `17d2b29` — Configure Gemini API to load from ~/.env/relax.env

## Test Results

All API endpoints tested & functional:
- ✅ Health check: 19 substances, 27 molecules, dual_catalog_enabled=true
- ✅ Substance expansion (Mulungu): returned substance + 3 molecules + interactions
- ✅ Molecule expansion (Caffeine): returned molecule + substances containing it + related molecules
- ✅ Interaction lookup (Caffeine ↔ L-Theanine): synergistic effect recognized
- ✅ Cross-catalog search (Ashwagandha): found substance

## Known Issues / Gaps

- Browser testing of graph visualization not yet performed (API side verified only)
- Physiology Obsidian Vault integration not explored (user asked, deferred)
- Physio Timeline Graph Engine (cortisol/dopamine simulation) not implemented (planned feature)


## 2026-10-31 — Dev-Projekte unter ~/dev

Lokale Entwicklungspfade und betroffene Verknüpfungen auf `~/dev/*-dev` umgestellt. Runtime-Daten, Branches und Release-Checkouts behalten ihre Zuständigkeit. Keine Pushes oder Releases. Gesamter Umzug und Prüfungen: `~/RESULTS.md`.

## 2026-11-02 — Entspannungstrainer-Modul als App-Bereich

- Ausbildungsbereich `Ausbildung` in die App-Navigation integriert: Modulüberblick, didaktische Leitlinien, Methodenbibliothek, editierbarer 60-Minuten-Stundenentwurf und 30-Einheiten-Praxisnachweis.
- Methodenbeschreibungen und Stundenstruktur an den lokalen Ausbildungsnotizen (Stundenplanung, Atemschulung, PMR, Assisted Stretching, Entspannung & Ausdauer und Protokoll) ausgerichtet; Übungen enthalten Optionen zur individuellen Anpassung.
- Praxisnachweise nutzen das bestehende Relax-Session-Datenmodell und Firestore-/Offline-Speicher. CSV-Export für das Protokoll ergänzt.
- Ausbildungs-Notizen für das Ziel und Folgeabgleich in `TODO.md` festgehalten. Kein Push oder Release.

## 2026-11-02 — Ausbildungsweg als Hauptnavigation

- App-Einstieg ist jetzt der Modulbereich; Kopfzeile benennt das Produkt als Entspannungstrainer.
- Mobile Navigation bündelt die Kernwege Heute, Modul, Praxis und Atem. Journal, Stats, Physio, Catalog und Einstellungen sind über „Mehr“ erreichbar; bestehende Hash-Deep-Links bleiben gültig.
- Modulgrundlagen um Stressmodelle, Ressourcen, Aktivierung/Erholung sowie die Ausbildungsbezüge zu Ernährung, Wirbelsäule und moderater Ausdauer erweitert. Präventive Rolle und didaktische Wahlmöglichkeiten sind ausdrücklich beschrieben.
- Stundenentwurf ergänzt um gespeicherte Vorbereitungshäkchen und Nachreflexion.
- Vite-Produktionsbuild und `git diff --check` erfolgreich. Keine Tests, kein Push und kein Release.

## 2026-11-02 — Geplanter Kursabschnitt durchführbar

- Stundenplan kann jetzt als Durchführungsansicht gestartet werden: Abschnittshinweis, Dauer, Countdown, Pause/Fortsetzen sowie manuelle Navigation und Abschluss.
- Übergänge bleiben bewusst unter Trainerkontrolle und können nach Gruppe und Situation angepasst werden.
- Kein PMR-Skript aus der lokal vorliegenden, nicht als Akademie-Original gekennzeichneten Zusammenfassung abgeleitet.

## 2026-11-02 — Ausbildungsnachweis aus vorhandenen Praxislogs

- Bestehende Tages-Sessions mit mindestens 15 Minuten Dauer werden als prüfbare Kandidaten angeboten und erst nach expliziter Bestätigung als selbst durchgeführte Ausbildungseinheit markiert.
- CSV-Export enthält die Kopfzeile und exakt 30 nummerierte Zeilen, passend zur lokalen Minimalvorlage.

## 2026-11-02 — Ansichten nach Bedarf laden

- Alle App-Bereiche per React `lazy`/`Suspense` aufgeteilt. Der gebaute Haupt-JS-Chunk sank von ca. 865 KB auf 166 KB; der Ausbildungsbereich liegt bei ca. 36 KB. Die PWA precacht weiterhin alle Bereiche für Offline-Verfügbarkeit.
- Produktionsbuild erfolgreich; kein Einzelchunk überschreitet Vites 500-KB-Warnschwelle. Keine Tests, kein Push oder Release.

## 2026-11-02 — Yoga und Pilates aus Ausbildungsstoff abgebildet

- Die gemeinsame Karte getrennt: Yoga listet ausgewählte Asanas samt Kursnotizen zu Atem, Varianten und Abschlussruhe; Pilates zeigt die acht im Basisprogramm aufgeführten Bewegungskategorien.
- Methodenhinweise direkt aus `Grundübungen Yoga.md` und `Grundübungen_Pilates.md` zusammengefasst. Anspruchsvolle Positionen sind als praktische Einschulung erfordernde Inhalte markiert.

## 2026-11-02 — Selbstcheck zu Theorie und Didaktik

- Lernbereich enthält sechs Multiple-Choice-Fragen zu Übungseinschulung, Musik, Rücknahme, Stundenzeit, Lazarus und SORKC.
- Jede Antwort gibt eine Begründung und verweist auf die zugehörige lokale Ausbildungsnotiz; Ergebnis ist als Wiederholung, nicht als Prüfungsnachweis gekennzeichnet.

## 2026-11-02 — Lern- und Praxisablauf verknüpft

- Dashboard und Session-Seite unterscheiden jetzt das persönliche Tages-/Stimmungsprotokoll vom offiziellen 30-Einheiten-Nachweis und verlinken zurück zum Modul.
- Eine Methode kann direkt für den Nachweis vorausgewählt werden; Atemschulung verlinkt zusätzlich in den geführten Atemtrainer.
- Bei der damaligen Sichtung wurden nur Modulnotizen berücksichtigt. Nachtrag 2026-11-02: Die Original-Skripte und Aufgaben-PDFs liegen im separaten Archiv `Dokumente/FlexyFit-ACADEMY/_Entspannungstrainer/`; spezifische Anleitungen für AT und Phantasiereisen sind dort weiterhin nicht vorhanden.
- Vite-Produktionsbuild und `git diff --check` erfolgreich. Keine Tests, kein Push und kein Release.

## 2026-11-02 — Atemtrainer an Ausbildungspraxis angebunden

- Atemseite ergänzt um den Kursablauf: Brust-/Bauchatmung zunächst wahrnehmen, Handkontakt am Bauch optional anbieten und kurze fünfminütige Übungsphasen als Vorschlag aus der lokalen Atemschulungsnotiz.
- Hyperventilation und Atemanhalten als außerhalb dieses geführten Entspannungsangebots eingeordnet; bei Unwohlsein zurück zur natürlichen Atmung.

## 2026-11-02 — PMR-Langform als manuelle Schrittfolge

- Methodenkarte enthält eine geführte Abfolge der 19 Muskelgruppen aus dem lokalen Handout-PDF plus Rücknahme. Die Schritte werden manuell weitergeschaltet, damit Anspannungs- und Nachspürpausen angepasst werden können.
- Quelle und Grenzen sichtbar: lokales Handout-PDF mit externer Quellenangabe; sanfte schmerzfreie Anspannung, Auslassen betroffener Bereiche und Beobachtungsalternative.

## 2026-11-02 — Vier-Wochen-Pflichtaufgabe ergänzt

- Originale Aufgaben-PDF im separaten FlexyFit-Archiv gefunden und Anforderungen übernommen: Ziele, alltagstaugliche Wochenroutine, ein Tageszyklus mit Übungsauswahl und Zeitstruktur sowie Lebensmittel-, Rezept-, Naturheilkunde- und Supplementbausteine.
- Neuer lokal gespeicherter Arbeitsbereich mit vier Wochenfeldern, Tageszyklus, Ernährungskapiteln und Markdown-Export. Vorformulierungen bleiben als Eingabeaufforderungen offen, damit der Entwurf aus den Skripten und der eigenen Kursarbeit entsteht.
- Kursquellen-Inventar berichtigt: wichtige Skripte, PMR-Handout und Ausbildungsaufgaben sind als PDFs vorhanden; AT- und Phantasiereisen-Anleitungs-PDFs fehlen weiterhin.

## 2026-11-02 — Fünf Tibeter aus dem PMR-Kursskript ergänzt

- Methodenbibliothek bildet den zweiten Praxisteil des 48-seitigen PMR-Skripts als eigenständige Bewegungsreihe ab: Kreisel, Kerze, Halbmond, Brücke und Berg.
- Die Karte hält die im Skript vorgesehene Dreiteilung (Ausgangsposition, Endposition, Ausgleich) fest und grenzt die Bewegungsreihe von PMR ab. Für die genaue Ausführung verweist sie auf das Originalskript und die praktische Einschulung.

## 2026-11-02 — Entspannungsverfahren nach Stresstheorie eingeordnet

- Grundlagenkarte ergänzt um die vier Ebenen des Originalskripts: muskulär, vegetativ, emotional und kognitiv samt den dort genannten Methoden.
- Lerncheck fragt die Zuordnung ab. Die AT- und Fantasiereisen-Karten nennen nun klar, dass die Skripte die Verfahren einordnen, aber keine konkrete Schritt-für-Schritt-Anleitung enthalten.

## 2026-11-02 — Stundenplanung an Kursbedingungen angeglichen

- Vorbereitungsliste ergänzt um die im Skript beschriebenen Raum-, Klima-, Gruppen- und Freiwilligkeitsbedingungen: 5–12 Personen als Richtwert, gewählter Mattenabstand, optionale persönliche Gegenstände sowie warme Kleidung und Polster.
- Stundenentwurf benennt Einleitung, methodischen Hauptteil, Ruhephase, ritualisierte Rücknahme, Feedback, Verabschiedung und Hinweis auf die nächste Einheit klarer. Lerncheck greift Gruppengröße und persönlichen Raum auf.

## 2026-11-02 — Assisted Stretching nach Original-PDF konkretisiert

- Methodenkarte übernimmt die im Skript getrennte Dosierung: eigenständige 30-Minuten-Einheit mit 2 × 15 Sekunden je Muskel und 10–15-minütiger Trainingsausklang mit 1 × 10–15 Sekunden.
- Session-Check ergänzt um ROM-Test, Handtuch, neutrale Gelenk-/Beckenposition, Trainerhaltung, fließende Übergänge, individuelles Feedback und freiwillige Zustimmung vor Berührungen.
- Lerncheck prüft die Unterscheidung zwischen eigenständiger Einheit und Trainingsausklang.

## 2026-11-02 — Faszientraining und SMR ergänzt

- Separate Methodenkarte für den Abschnitt Faszientraining aus dem Assisted-Stretching-Skript ergänzt: SMR, vorbereitendes Dehnen, Winkel-/Druckvariation, myofasziale Ketten und Rückkehr in die Ausgangsposition.
- Kursziele werden als Inhalte des Skripts gekennzeichnet, nicht als Wirkungsversprechen. Die Karte macht sichtbar, dass das PDF nur eine kurze Praxisübersicht und kein vollständiges Übungsprogramm liefert.
- Lerncheck greift die im Skript genannten Praxiselemente auf.

## 2026-11-02 — Entspannungsbegriff und Ausdauerprofil konkretisiert

- Grundlagenkarte erklärt nach dem Stresstheorie-Skript, dass subjektives Erleben, Muskelspannung und autonome Reaktionen auseinandergehen können; Entspannung wird nicht als Schlaf gleichgesetzt.
- Ausdauermethode übernimmt den Kursansatz (gleichmäßig, moderat, sprechbar, individuell und ohne Leistungsfokus) sowie die dortigen beispielhaften Dauern und Umgebungsoptionen.
- Allgemeine österreichische Bewegungsempfehlungen werden als eigener Wochenumfang getrennt vom Kursbeispiel verlinkt.

## 2026-11-02 — Ernährungskategorien aus dem Kursskript ergänzt

- Das Vier-Wochen-Arbeitsblatt enthält nun eigene Felder für Brain Food, Power Food und Soul Food, die drei Kategorien aus dem Skript „Entspannung und Ernährung“.
- Markdown-Export führt alle drei Kategorien mit; der Arbeitsbereich bleibt quellenbezogen und gibt keine eigenen Lebensmittel- oder Wirkungsversprechen vor.

## 2026-11-02 — Wahrnehmungsübungen zur Wirbelsäule ergänzt

- Eigenständige Methodenkarte nach dem Originalskript mit Körperteil- und Bewegungswahrnehmung, Atemräumen, Fuß-/Standwahrnehmung, Beckenuhr und Bewegungsfreude.
- Die Karte trennt Kurslernen von Diagnose und Behandlung; taktile Partnerübungen sind ausdrücklich zustimmungsbasiert.
- Lerncheck prüft die im Skript aufgeführten Wahrnehmungsfelder.

## 2026-11-02 — Yoga- und Pilateskarten mit Original-PDFs abgeglichen

- Yoga- und Pilatesmethoden jetzt direkt den FlexyFit-Originalskripten zugeordnet; unbelegte Sitzposition Sukhasana aus der Asana-Auswahl entfernt und durch die im PDF beschriebene Utthita Parsvakonasana ersetzt.
- Viparita Karani korrekt als Umkehr-Mudra statt als Asana gekennzeichnet. Verletzungsbezogene Kurzmodifikation aus der früheren Zusammenfassung durch Verweis auf praktische Einschulung ersetzt.
- Yoga-/Pilatesdauer nicht mehr als Kursvorgabe ausgewiesen; Dauer wird im eigenen Stundenentwurf festgelegt.

## 2026-11-02 — Druckvorlage für 30 Praxiseinheiten ergänzt

- Der Ausbildungsnachweis bietet neben CSV nun eine A4-Druckansicht mit 30 nummerierten Zeilen und den offiziellen Spalten Datum, Beschreibung und Unterschrift.
- Erfasste Einheiten werden übernommen; Unterschriftsfelder bleiben für die handschriftliche Signatur frei.

## 2026-11-02 — Vollständigkeitsanzeige für die Pflichtaufgabe ergänzt

- Der Vier-Wochen-Entwurf zeigt den Arbeitsstand für Zielsetzung, alle vier Wochen, den ausgearbeiteten Tageszyklus und sämtliche Ernährungskapitel.
- Der Check erkennt nur leere Pflichtbereiche und weist ausdrücklich darauf hin, dass er keine fachliche Bewertung ersetzt.
- Gegen das offizielle Aufgaben-PDF abgeglichen: Wochenroutine, Übungsauswahl, Stundenaufbau/Zeitstruktur sowie Rezepte, Naturheilkunde, Lebensmittel und Nahrungsergänzung sind getrennt vertreten.

## 2026-11-02 — Ernährungskapitel mit Quellkritik ergänzt

- Das Arbeitsblatt weist jetzt auf die Aussagen des Originalskripts hin: kein einzelnes Lebensmittel reduziert nach Skript direkt Stress (S. 27), Power-Food-Versprechen werden kritisch besprochen (S. 53–55), und Nahrungsergänzung ist bei gesunden Menschen mit gesunder Ernährung laut Skript in der Regel nicht erforderlich (S. 85–86).
- Die Notiz lenkt zu ausgewogener, alltagstauglicher Auswahl und grenzt individuelle Dosierung oder Therapie weiterhin aus.

## 2026-11-02 — Kursübungen im Atemtrainer gekennzeichnet

- Bhramari und Sama Vritti sind im Atemtrainer jetzt nach dem Atemschulungs-PDF (S. 38) benannt und mit Fundstelle markiert.
- Die Bauchatmung wird als eigene Kursübung (S. 48) ohne festes Atemtempo benannt; andere Timer-Muster sind als Zusatzübungen statt als Ausbildungsvorgaben gekennzeichnet.
- PNI-Texte mit physiologischen Wirkungsversprechen entfernt und durch neutrale Übungsbeschreibungen sowie einen Hinweis zu freiwilligen Atempausen und fehlender Körpermessung ersetzt.

## 2026-11-02 — Meditation als Kurseinordnung abgegrenzt

- Die Methodenkarte nennt jetzt die Zuordnung zur kognitiven Ebene auf S. 55–56 des Stresstheorie-Skripts und kennzeichnet Atem-/Bodenkontakt-Anker ausdrücklich als allgemeine App-Ergänzung.
- Das Skript enthält keine konkrete Schrittfolge für Meditation; die Dauer wird daher nicht als Kursvorgabe ausgegeben.

## 2026-11-02 — Seitenfundstellen in der Methodenbibliothek ergänzt

- Methodenkarten verweisen jetzt mit Seitenbereichen auf die Atemschulung, das PMR-Handout und PMR-Kursskript, Stresstheorie, Yoga, Pilates, Assisted Stretching, Ausdauer sowie Wirbelsäule.
- Nicht belegte Dauerangaben für Atemschulung, Autogenes Training und Fantasiereisen auf „Dauer nach Stundenentwurf“ umgestellt; PMR-Dauer auf die 20–30 Minuten des Handouts ausgerichtet.
- PMR-Handout als extern quellenbasiertes Handout statt als originales Akademie-Skript gekennzeichnet.

## 2026-11-02 — Schmerztheorie aus dem Wirbelsäulenskript ergänzt

- Die Grundlagenansicht fasst jetzt die Kurskapitel zu Schmerz als Sinnes-/Gefühlserlebnis, psychosozialem Kontext und psychologischer Bewältigung mit Seitenverweisen (S. 4–8, 10–23) zusammen.
- Selbstuntersuchungen, Selbstbehandlung, physikalische Anwendungen und Medikamente werden als Kursinhalte eingeordnet, aber nicht in diagnostische oder therapeutische App-Anleitungen umgewandelt.

## 2026-11-02 — Unbelegte Atemübungsdosierung korrigiert

- Die Angabe „fünf Minuten, zwei- bis dreimal täglich“ wurde aus dem Kursbezug entfernt: Sie steht nicht im Atemschulungs-PDF.
- Die App verweist nun auf die tatsächliche Praxisaufgabe auf S. 48 (Bauchatmung wahrnehmen und eigenen Anleitungstext vorbereiten) und kennzeichnet Timerlängen als App-Auswahl.

## 2026-11-02 — Lokale Kursrichtwerte wiederhergestellt

- Die separate Kursnotiz `00_Entspannungs-Protokoll-MINIMAL.md` nennt Richtwerte für Atemschulung (15–20 Min.), PMR (15–30 Min.), AT und Fantasiereisen (je 20–30 Min.), Yoga/Pilates (je 30–60 Min.) und Meditation (15–30 Min.).
- Diese Werte erscheinen auf den Methodenkarten ausdrücklich als lokale Kursrichtwerte; Abweichungen zur Dauerangabe im Original-PDF werden benannt, und fehlende Praxisanleitungen bleiben offen.

## 2026-11-02 — Kursquellenmatrix dokumentiert

- Neue Quellenmatrix ordnet Originalskripte, Pflichtaufgaben und lokale Kursnotizen den App-Bereichen zu und hält Seitenbereiche sowie absichtliche Grenzen fest.
- README verlinkt die Matrix als Einstieg für weitere Kursabgleiche.

## 2026-11-02 — Anleitungstext zur Bauchatmung bearbeitbar gemacht

- Die Praxisaufgabe aus Atemschulung S. 48 ist im Atemtrainer nun als persönliches Textfeld direkt bei der Kursübung verfügbar.
- Der Entwurf wird lokal auf dem Gerät gespeichert und kann als Markdown-Datei exportiert werden; die Quelle der Schreibaufgabe steht im Export.

## 2026-11-02 — Selbstreflexion aus der Stresstheorie ergänzt

- Die 20-minütige Selbstreflexionsaufgabe aus „Stresstheorie“, S. 32–44, ist jetzt als freiwilliges Arbeitsblatt in den Grundlagen verfügbar: Stressoren/Bewertung, persönliche Voraussetzungen, Reaktionsmuster, Folgen und Coping.
- Einträge bleiben lokal im Browser und sind vom Praxistagebuch getrennt; Markdown-Export enthält Quelle und Diagnoseabgrenzung.
- Quiz und Grundlagen verwenden nun die Begriffe des Skripts (Stressoren, Organismus, Stressreaktionen, Konsequenzen, Coping) statt einer abweichenden SORKC-Auflösung.

## 2026-11-02 — Messbarkeit von Stress eingeordnet

- Grundlagen und Lerncheck decken jetzt die in „Stresstheorie“, S. 45–47 genannten Beobachtungs-, Fragebogen-, Ereignis-, biologischen und körperbezogenen Messzugänge sowie Biofeedback ab.
- Die LCU-Einschränkung zum subjektiven Stresserleben ist sichtbar; die App selbst misst keine Körperwerte und leitet daraus keine Diagnose ab.

## 2026-11-02 — Yoga-Übungssammlung vollständig indexiert

- Der Seitenabgleich des Originalskripts „Grundübungen Yoga“ (S. 6–72) ergab 22 Haltungen und Bewegungsformen; bisher zeigte die Karte zehn Beispiele.
- Die Methodenkarte führt nun alle 22 mit Seitenbereichen und knapper Beschreibung. Ausfallschritt, Katze-Kuh und Viparita Karani sind entsprechend der Quelle als Bewegungsform bzw. Mudra abgegrenzt.

## 2026-11-02 — Pilates-Basisprogramm mit Übungsregister verbunden

- Der Seitenabgleich des Pilates-Originals bestätigte acht Kategorien (S. 17–21) und 19 benannte Übungsfolgen (S. 24–97).
- Die Methodenkarte führt die Kategorien samt Fundstellen und listet die Bewegungen nach den im Skript beschriebenen Ausgangspositionen. Wo das PDF die Kategorien bei den späteren Einzelseiten nicht wiederholt, wird keine zusätzliche Zuordnung behauptet.

## 2026-11-02 — Stressbewältigung und unterstützende Maßnahmen ergänzt

- Die Grundlagen nennen jetzt die Kurslisten für Soforthilfe (PMR, AT, Selbsthypnose), langfristige Prävention und unterstützende Verfahren wie Tai-Chi, Qigong, Yoga, Zen, Benson-Meditation, CSM, achtsamkeitsbasierte Stressreduktion und Feldenkrais.
- Die App unterscheidet diese Übersicht von einer konkreten Kursanleitung und markiert, welche Verfahren im Archiv nicht praktisch ausgearbeitet sind. Salutogenese und Stressmodelle haben präzisere Seitenfundstellen.
- Der Lerncheck enthält eine Frage zu den unterstützenden Maßnahmen.

## 2026-11-02 — Trainerrahmen und Zeitvorgaben der Stundenplanung ergänzt

- Didaktische Leitlinien umfassen jetzt Trainerhaltung, Konzeptvermittlung, Erklären/Demonstrieren/Erproben, Wiederholung und sprachliches Feedback.
- Die Vorbereitungsliste enthält die Abstimmung mit der Einrichtung und den optionalen Musikeinsatz; beim Kombinationskurs sind 15 Minuten und der im Skript genannte Pulswert unter 120 als Kursangabe samt Einschränkung sichtbar.
- Der Lerncheck fragt den Zeitrichtwert ab.

## 2026-11-02 — Flexibilitätstraining als Grundlagenblock ergänzt

- Die Stretching-Karte umfasst jetzt auch die allgemeinen PDF-Abschnitte zu Beweglichkeit/Dehnfähigkeit, Einflussfaktoren, Methodenfamilien, zielorientierter Wahl und Grundregeln (S. 4–17, 29).
- Die Assisted-Stretching-Dosierung und Kundenpraxis stehen separat daneben (S. 31–35); ein Lerncheck fragt die Zielorientierung bei der Methodenwahl ab.

## 2026-11-02 — Atemmechanik im Atemtrainer ergänzt

- Der Atemtrainer enthält jetzt die Kursfrage aus der Gruppenarbeit (S. 4) und eine aufklappbare Übersicht zu Einatmung, Brust- und Bauchatmung (S. 9–14).
- Die Anatomieangaben sind auf die Kursmechanik begrenzt und als Ausbildungsinhalt statt Diagnose- oder Behandlungshinweis markiert.
# Konkrete Methode beim Sammelpunkt verpflichtend erfasst (2026-11-02)

- Beim Praxisnachweis ist die konkrete unterstützende Praxis nun Pflicht, wenn „Weitere unterstützende Verfahren“ ausgewählt wird.
- Browserseitige Pflichtfeldprüfung und zusätzliche Formularvalidierung verhindern einen generischen oder nur aus Leerzeichen bestehenden Eintrag.
# Ausdauer-Quellenbereich und Praxisvarianten präzisiert (2026-11-02)

- Methodenkarte nennt jetzt den tatsächlichen Inhaltsbereich S. 4–26 statt S. 4–24.
- Die Praxisübersicht trennt die Empfehlungen aus S. 23, Lauf-/Bergsportbeispiele inklusive Trailrunning aus S. 24, Wasser- und Mannschaftssport aus S. 25 sowie Naturwege/Bewegungsparks aus S. 26.
## 2026-11-02 — Vollständige Historie für Ausbildungsnachweis

- Session-Historie kann über einen exklusiven `before`-Datums-Cursor rückwärts paginiert werden (Firestore und lokale Server).
- Der Ausbildungsnachweis lädt die Seiten vollständig, sodass ältere bestätigte Einheiten und noch zu prüfende Praxislogs auch bei langen Ausbildungsverläufen sichtbar bleiben. Der Drucknachweis bleibt bei seinen 30 Formularzeilen.
- API-Vertrag dokumentiert; Vite-Produktionsbuild erfolgreich und `git diff --check` sauber.
# Fallaufgabe um konkrete Präventionsgrenze ergänzt (2026-11-02)

- Direkt am Fallarbeitsblatt wird klargestellt, dass Verdauungs- und Schlafbeschwerden keine Diagnose darstellen und die Fallbeschreibung kein Gespräch mit der Person ersetzt.
- Die Aufgabe lenkt auf gemeinsam formulierte Wohlbefindensziele ohne Heil- oder Abnehmversprechen und nennt medizinische Abklärung bei anhaltenden oder zunehmenden Beschwerden.
- Vite-Produktionsbuild und `git diff --check` erfolgreich.
# Produktdokumentation auf das Ausbildungsmodul ausgerichtet (2026-11-02)

- `VISION.md` beschreibt jetzt den Ausbildungsweg vom Kursverständnis über Planung und Anleitung bis zum Praxisnachweis sowie die Quellen- und Trainergrenzen.
- `NEXT.md` priorisiert Kursabgleich, 30-Einheiten-Nachweis, Pflichtaufgabe und mobile/offline Akzeptanz. Physio- und Katalogthemen sind als Zusatzbereiche eingeordnet.
- README und Agentenhinweise verweisen auf dieselbe Produktpriorität; unbelegte Wirkmodelle sind nicht länger als zentrales Produktziel formuliert.
# Bestätigungsstatus des Praxisnachweises konsistent ausgewertet (2026-11-02)

- Der 30er-Zähler, die Protokollliste sowie CSV- und Druckexport enthalten nun nur Einheiten ab 15 Minuten mit `trainingUnit` und expliziter Bestätigung.
- Ältere Sessions ohne gültige Bestätigung bleiben als prüfbare Kandidaten sichtbar, auch wenn ein alter Datensatz bereits `trainingUnit: true` markiert hatte.
- Vite-Produktionsbuild und `git diff --check` erfolgreich.
# Antwortmuster im Ausbildungs-Lerncheck aufgelöst (2026-11-02)

- Die Antwortoptionen aller 22 Lerncheck-Fragen werden deterministisch rotiert; die korrekte Option und ihre Begründung/Quelle bleiben gekoppelt.
- Vorher standen 17 von 22 korrekten Antworten an erster Stelle. Nach der Rotation verteilen sich die korrekten Positionen auf 8, 5 und 9 Fragen.
- Vite-Produktionsbuild und `git diff --check` erfolgreich.
# Dauerangabe im Praxisnachweis von der Kursvorgabe getrennt (2026-11-02)

- Abgleich von `ESPT_Pflichtaufgabe_Trainingsprotokoll-A_Lizenz.pdf`, der zweiten offiziellen Formularvorlage und `Stundenplanung.pdf`: Die Formulare verlangen Datum, Beschreibung und Unterschrift, enthalten aber keine allgemeine Mindestdauer. Die 15 Minuten in der Stundenplanung gelten für einen Entspannungsteil in einem kombinierten Kurs.
- Dauer im App-Nachweis ist nun optional; Sessions können ohne 15-Minuten-Schwelle nach ausdrücklicher Bestätigung übernommen und gezählt werden. Der CSV-Export lässt die Unterschrift wie die Druckansicht frei.
- Quellenmatrix, README und TODO korrigiert. Vite-Produktionsbuild und `git diff --check` erfolgreich.
# Legacy-Sessions beim Nachweisimport einzeln bestätigen (2026-11-02)

- Kandidaten merken ihre Position im Tagesprotokoll als Rückfallkennung. Wenn ein älterer Datensatz keine ID enthält, aktualisiert die Bestätigung dadurch nur die ausgewählte Zeile.
- Sessions mit ID werden weiterhin anhand ihrer ID zugeordnet.
- Vite-Produktionsbuild und `git diff --check` erfolgreich.

# Modulnavigation mit URL und Browser-Zurück synchronisiert (2026-11-02)

- Tabwechsel schreiben den Tab jetzt in den URL-Hash; bestehende Hash-Links bleiben nutzbar.
- Beim Browser-Zurück zu einer URL ohne Hash wird der passende Standard-Tab wiederhergestellt (Modul, beziehungsweise Catalog auf dem isolierten Knowledge-Port).
- Vite-Produktionsbuild und `git diff --check` erfolgreich.

# Ausbildungs-Unterseiten direkt verlinkbar gemacht (2026-11-02)

- Grundlagen, Lerncheck, Methodenliste, Fallkonzept, Stundenplanung und Praxisnachweis aktualisieren den Hash unter `#ausbildung/<abschnitt>`.
- Einzelne Methodenkarten nutzen `#ausbildung/methoden/<methodenname>`; direkter Aufruf und Browser-Zurück/Vor stellen die passende Karte wieder her.
- README und TODO aktualisiert; Vite-Produktionsbuild erfolgreich.

# Installations- und Browser-Auftritt auf das Fachmodul ausgerichtet (2026-11-02)

- Browser-Titel und Beschreibung nennen jetzt das Entspannungstrainer-Modul der Präventiven Vitaltrainer-Ausbildung.
- PWA-Name, Homescreen-Kurzname, Manifestbeschreibung, Changelog-Label, Paketbeschreibung und README-Einstieg sind konsistent auf denselben Produktzweck ausgerichtet.
- Vite-Produktionsbuild und `git diff --check` erfolgreich.

# Ausbildungs-Deep-Links im Shell-Router korrekt erkannt (2026-11-02)

- Der Top-Level-Router liest jetzt das erste Segment des URL-Hashs. Links wie `#ausbildung/methoden/<name>` wählen explizit den Modul-Tab, statt auf die Standardroute zurückzufallen.
- Bestehende einteilige Hash-Routen wie `#atem` oder `#session` bleiben unverändert auflösbar.
- Vite-Produktionsbuild und `git diff --check` erfolgreich.

# Durchführungs-Timer mit absoluter Endzeit stabilisiert (2026-11-02)

- Abschnitts-Timer berechnet Restzeit anhand einer Endzeit statt jede Intervall-Ausführung als verstrichene Sekunde zu zählen.
- Bei Hintergrunddrosselung und Rückkehr in die App wird dadurch die tatsächliche Restzeit angezeigt; Pause, Fortsetzen, Abschnittswechsel und Neustart setzen die Endzeit passend zurück.
- Vite-Produktionsbuild und `git diff --check` erfolgreich.

# Laufenden Stunden-Timer nach App-Wechsel wiederaufnehmen (2026-11-02)

- Der Durchführungszustand wird lokal gespeichert und beim Öffnen der Modulansicht validiert wiederhergestellt.
- Eine laufende Einheit setzt die Restzeit aus der absoluten Endzeit fort; pausierte Einheiten behalten ihren Stand. Beenden und Abschließen entfernen den gespeicherten Lauf.
- Vite-Produktionsbuild und `git diff --check` erfolgreich.

# Kursanleitungen in Google Drive abgeglichen (2026-11-02)

- Gezielt nach konkreten Anleitungen zu Autogenem Training, Fantasiereisen und Meditation gesucht und die passende Entspannungstrainer-MOC geprüft.
- Drive-Treffer sind thematische MOCs ohne methodenspezifische Schrittfolgen; Quellenmatrix und offene Beschaffung dieser Originalanleitungen entsprechend dokumentiert.

# Lerncheck um zentrale Methodenquellen erweitert (2026-11-02)

- Fünf quellgebundene Fragen prüfen Yoga-Grundsätze, Pilates-Kategorien, die Abgrenzung der fünf Tibeter von PMR, die uneindeutige PMR-Gruppenliste und die fehlenden Anleitungen zu AT/Fantasiereisen.
- Antwortpositionen werden wie bei den vorhandenen Fragen deterministisch rotiert; jede Erklärung nennt den Kursbezug und die betroffene Quellgrenze.

# Selbsterfahrung an die Methodenbibliothek angebunden (2026-11-02)

- Jede Methodenkarte bietet jetzt drei lokal gespeicherte Reflexionsfelder zu eigener Erfahrung, hilfreichen Anpassungen sowie Anleiten/Erklären und praktischem Einschulungsbedarf.
- Der Markdown-Export kennzeichnet die Notizen ausdrücklich als persönliche Reflexion und nicht als absolvierten Ausbildungsnachweis.
- Die Ergänzung folgt der offiziellen Diplom-Kursbeschreibung, die Praxis und Selbsterfahrung nennt; die Methoden-PDFs bleiben die Quelle für konkrete Ausbildungsinhalte.

# Fachmodul-Startseite als Lernpfad verknüpft (2026-11-02)

- Direkteinstiege führen jetzt von Grundlagen/Lerncheck über Methodenreflexion und Vier-Wochen-Fall bis Stundenplanung und Praxisnachweis.
- Die Reihenfolge ist ausdrücklich als App-Orientierung gekennzeichnet und wird nicht als offizielle Prüfungsreihenfolge ausgegeben.

# Fachgesprächs- und Praxisprobe an Methoden angebunden (2026-11-02)

- Jede Methodenkarte bietet drei freiwillige Selbstchecks zum mündlichen Erklären, praktischen Zeigen einer bereits gelernten Folge sowie zum Anpassen und Einordnen der Trainerrolle.
- Der Export enthält die markierten Lernstände. UI und Quellenmatrix kennzeichnen das Werkzeug als App-Lernhilfe, nicht als offizielle Prüfungsrubrik oder Bewertung.

# Mentaltraining-Themenübersicht im Fachmodul ergänzt (2026-11-02)

- Die Ausbildungs-MOC nennt ein Mentaltraining-Kapitel mit Visualisierung, Autosuggestion, Ankern, Zielsetzung, Eberspächer und ideomotorischen Themen; diese Themen waren bisher nicht als eigene Methodenkarte auffindbar.
- Neue Karte und Lerncheck-Frage erschließen die Überschriften, kennzeichnen aber das fehlende Mentaltraining-Skript und erfinden keine Übungsfolge. Ein gleichlautender Visualisierungsbegriff im Wirbelsäulen-PDF bleibt als anatomische Anschauung abgegrenzt.

# Offene Anleitungsquellen um Mentaltraining ergänzt (2026-11-02)

- TODO, Quellenmatrix und Quellenabgrenzung führen Mentales Training jetzt neben AT, Fantasiereisen und Meditation als fehlende methodenspezifische Anleitung. Die Themenkarte aus der MOC wird nicht mit einem Kurs-Anleitungsskript verwechselt.

# Schwerpunktmethode in den Durchführungs-Timer übernommen (2026-11-02)

- Beim Start des Timers werden Name, Fokus, Kursrahmen, Anpassung und Quelle der im Stundenentwurf gewählten Methode übernommen und während der Durchführung angezeigt.
- Der aktive Timer speichert diese Methodenkurzdaten zusammen mit seinen Abschnitten, damit sie nach Modulwechsel oder App-Neustart weiter verfügbar bleiben.

# Durchgeführte Stunde für den Praxisnachweis vorbereiten (2026-11-02)

- Beim bewussten Abschließen des letzten Timerabschnitts öffnet sich der Praxisnachweis mit heutigem Datum, gewählter Methode und Stundentitel als bearbeitbarem Entwurf.
- Dauer bleibt leer und die Selbstbestätigung bleibt aus; die Einheit wird erst nach ausdrücklichem Bestätigen im Formular gezählt.

# Produktunterlagen an den aktuellen Fachmodul-Ablauf angeglichen (2026-11-02)

- Vision und README nennen Mentaltraining jetzt als Themenübersicht ohne Anleitung und dokumentieren die Methodenreflexion sowie den Übergang vom Timer zum unbestätigten Praxisnachweis.
- NEXT.md enthält nur aktuelle Prioritäten zum Fachmodul; die historische Liste mit Betriebsnotizen ist zur Nachvollziehbarkeit in `docs/NEXT-legacy-2026-10-29.md` erhalten.

# Agentenkontext vom alten Physio-Kernziel bereinigt (2026-11-02)

- GEMINI.md nennt nun das Entspannungstrainer-Fachmodul als Produktfokus und Physio/Knowledge Base als Zusatzbereiche; Quickstart-Befehle verwenden das festgelegte pnpm.
- CLAUDE.md startet den Dev-Server mit pnpm. Die ältere Physio-Timeline-AGENTS-Datei bleibt erhalten, ist aber sichtbar als historische Spezifikation und nicht als aktive Repo-Anweisung markiert.

# Doppelte Aufgaben-PDFs im Quelleninventar ausgewiesen (2026-11-02)

- SHA-256-Abgleich bestätigt, dass die beiden Vier-Wochen-Aufgaben-PDFs byte-identisch sind.
- Ebenso sind die zwei Trainingsprotokoll-PDFs identische Kopien mit denselben 30 Zeilen. Die Quellenmatrix weist sie deshalb gemeinsam aus, ohne eine separate Aufgabenvariante anzunehmen.

# Lerncheck-Fortschritt lokal gespeichert (2026-11-02)

- Zwischenstand, aktuelle Antwort und Punktzahl des Lernchecks bleiben lokal erhalten und werden beim erneuten Öffnen fortgesetzt.
- Die Ansicht kennzeichnet die lokale Speicherung; ein bewusster Neustart setzt den Lerncheck weiterhin zurück.

# Stundenentwurf als Markdown exportierbar (2026-11-02)

- Der Export enthält Ziel, Methode samt Ausbildungsbezug und Quelle, alle Zeitblöcke, Vorbereitungsstatus und Nachreflexion.
- Der Entwurf lässt sich damit für die Kursvorbereitung außerhalb des lokal speichernden Browsers mitnehmen.

# Biofeedback als Kursmethode auffindbar gemacht (2026-11-02)

- Stresstheorie S. 47 beschreibt Biofeedback als Gerät, das körpereigene Signale unmittelbar zurückmeldet, und nennt selbstgewählte Entspannungsschritte sowie größere Unabhängigkeit vom Gerät als Lernziel.
- Die Methodenkarte und eine Lerncheck-Frage bilden diese Passage ab. Sie enthalten keine Geräteanleitung, Diagnostik, Messung in der App oder individuelle Wirkungsgarantie.

# Relative Vite- und PWA-Pfade ausgerichtet (2026-11-02)

- Der Standalone-Build erzeugt Assets, PWA-Registrierung, Manifest-Icons und Offline-Fallback relativ zum App-Verzeichnis statt zum Domain-Root.
- Die eigenständige Firebase-Site bleibt unverändert am Domain-Root nutzbar; der App-eigene Build erfüllt nun die gemeinsame Vite-Konvention für relative Assets.

# Methodenlisten-Hinweis zur Quellenlage vervollständigt (2026-11-02)

- Der Hinweis unter der Methodenliste nennt jetzt auch Mentales Training als Themenübersicht ohne vollständige methodenspezifische Anleitung.
- Damit stimmt der sichtbare App-Hinweis mit der Methodenkarte, der TODO-Liste und der Quellenmatrix überein.

# Methodenbibliothek durchsuchbar gemacht (2026-11-02)

- Die Methodenliste filtert nun live nach Namen, Schwerpunkten, Anleitungstexten und Quellen.
- Trefferzahl und verständlicher Leerzustand unterstützen die Suche auf schmalen Bildschirmen.

# Schmale Browseransicht geprüft (2026-11-02)

- Methodenliste und lange Biofeedback-Karte wurden bei 390×844 in Headless-Firefox gerendert. Name, Suchfeld, Karten und Navigationsleiste bleiben lesbar; kein horizontaler Seitenüberlauf war sichtbar.
- Der Firefox-Scrollbar-Gutter zeigte zuvor einen hellen Streifen. `scrollbar-color` und `scrollbar-width` folgen jetzt dem App-Thema.
- Die echte iPhone-/iPad-Abnahme und der vollständige Timer-/Nachweisablauf bleiben offen.

# 320-Pixel-Kopfbereich verbessert (2026-11-02)

- Bei 320×640 waren App-Titel und Zeitplan-Schaltfläche optisch zu eng. Der App-Titel nutzt unter 640 Pixeln jetzt eine kleinere Schrift.
- Der erneute Firefox-Screenshot zeigt Abstand zwischen Titel und Schaltfläche; Methodenliste, Suche und Abschnittsnavigation bleiben erreichbar.

# SORK-Notation an die Kursquelle angepasst (2026-11-02)

- Der Lerncheck fragt die eindeutige S/O/R/K-Zuordnung der Schemafolie ab und erklärt separat, dass Coping später als C erscheint.
- Die Reflexionshilfe kennzeichnet die widersprüchliche Überschrift „K und C“ im Konsequenzen-Abschnitt und erklärt, dass Folgen und Coping in der App praktisch getrennt werden.

# ID-lose Alt-Sessions eindeutig übernehmen (2026-11-02)

- Jede unbestätigte Session erhält für die Listenzeile einen stabilen Schlüssel aus Datum und ID beziehungsweise Originalindex.
- Während eine ID-lose Zeile gespeichert wird, ist nur deren Schaltfläche gesperrt; benachbarte Zeilen bleiben einzeln bedienbar.

# Master-MOC-Abweichungen an Originalskripten kenntlich gemacht (2026-11-02)

- Die Master-MOC ordnet Autogenes Training der muskulären Ebene zu; das Stresstheorie-PDF nennt es auf S. 55 unter vegetativ. App-Karte und Lerncheck folgen dem PDF und weisen auf die MOC-Abweichung hin.
- Die Master-MOC bündelt Pilates in sechs Gruppen; das Original-PDF trennt acht Kategorien. Methodenkarte und Quellenmatrix erklären die unterschiedliche Gruppierung.
- Auch die Pilates-Übungsübersicht zählt unterschiedlich: 16 Einträge in der Master-MOC gegenüber 19 im Original-PDF und in der App.

# Timer-Metazeile auf schmalen Displays angepasst (2026-11-02)

- Die Timer-Kopfzeile verwendet unter der Small-Breakpoint eine kleinere Schrift, damit die Abschnittsanzahl bei 320 Pixeln nicht allein in eine neue Zeile rutscht.

# Timer-Abschluss zum unbestätigten Nachweis geprüft (2026-11-02)

- Im Headless-Firefox bei 320 Pixeln führte der Abschlussknopf aus einem pausierten Timerzustand zum Nachweis-Entwurf und übernahm Methode und Stundenname.
- Die Selbstbestätigung blieb leer und der Nachweiszähler bei 0/30. Die Prüfung nutzte nur ein wegwerfbares Browserprofil; der echte iPhone/iPad-Ablauf, laufender Timer-Restore sowie Druck und CSV bleiben offen.

# Methodenreflexion und Markdown-Export im Browser geprüft (2026-11-02)

- Headless-Firefox stellte einen vorhandenen `Atemschulung`-Reflexionsdatensatz mit allen drei Feldern und gesetztem Selbstcheck wieder her.
- Der Markdown-Download enthielt alle drei Einträge, den methodenspezifischen Dateinamen und den Hinweis, dass die Reflexion keine absolvierte Ausbildungseinheit belegt. Der Reflexionsspeicher blieb getrennt vom Trainingsnachweis.
- Im anschließend gesteuerten Firefox-Profil wurden drei Notizen per WebDriver-Tastatureingabe geschrieben, im lokalen Reflexionsobjekt gespeichert, nach Reload wiederhergestellt und im tatsächlichen Markdown-Blob geprüft.
- Der Fachgesprächs-Selbstcheck blieb ebenfalls nach Reload gesetzt; der Export nennt, dass die Reflexion keine absolvierte Ausbildungseinheit belegt. Geräteabnahme auf iPhone/iPad bleibt offen.

# Drive-Kursordner erneut auf fehlende Methoden-Anleitungen geprüft (2026-11-02)

- Den direkten Entspannungstrainer-Ordner und gezielte Drive-Suchen für Mentaltraining, Autogenes Training, Fantasiereisen und Meditation geprüft.
- Der Ordner enthält die Pflichtaufgabe in zwei gleich großen PDF-Kopien, die Aufgaben-Markdown-Datei und Trainingsprotokoll-Kopien, aber keine eigenständigen Methoden-Anleitungen. Die ausgelesene Aufgaben-PDF bestätigt den App-Workflow aus Zielen, Vier-Wochen-Routine, ausgearbeitetem Tageszyklus und Ernährungstipps.
- Quellenmatrix und NEXT dokumentieren den aktuellen Suchstand; fehlende Schrittfolgen bleiben offen und werden nicht aus der Aufgabenbeschreibung abgeleitet.
# Ältere Kursarchiv-Sicherung gegen aktuelle Originalquellen abgeglichen (2026-11-02)

- Alle Dateien im älteren Entspannungstrainer-PDF-Archiv per SHA-256 mit dem aktuellen FlexyFit-Archiv verglichen.
- Die abweichenden Dateinamen (u. a. `Stresstheorie B-Lizenz.pdf` und mehrere PDF-Dateien ohne Endung) stimmen bytegenau mit erfassten Originalquellen überein; die Sicherung enthält keine zusätzlichen Kurs-PDFs.
- Quellenmatrix, TODO und NEXT halten fest, dass auch die lokale Sicherung keine Anleitung für Mentaltraining, Autogenes Training, Fantasiereisen oder Meditation ergänzt.
# Drive-Treffer anhand konkreter Kurskapitel auf Anleitungen geprüft (2026-11-02)

- Die Suche nach AT-Grundstufe/Ruhetönung, Fantasiereisen-Rücknahme, Meditation und Mentaltraining nach Eberspächer lieferte die Master-MOC und `🦉Vitaltrainer-Diplom.md` als mögliche Kursquellen.
- Beide Dateien wiederholen Themen und Kapitelüberschriften; die Diplom-Notiz ergänzt eine allgemeine Einleitung, aber keine konkrete Anleitung oder Schrittfolge für die fehlenden Methoden.
- Quellenmatrix, TODO und NEXT enthalten jetzt diese Prüfung. Die Methodenkarten bleiben bei den durch Kursunterlagen belegten Angaben.
# Ausbildungs-MOC in der Modul-Startansicht erschlossen (2026-11-02)

- Die Startansicht enthält jetzt einen aufklappbaren Kursindex mit den einzelnen Fächern aus der Ausbildungs-MOC: Stresstheorie, Methodenüberblick, Mentales/autogenes Training, Atemschulung, PMR, Yoga, Pilates, Assisted Stretching/Faszien, Ausdauer, Wirbelsäule, Ernährung, Stundenplanung und Aufgaben/Nachweis.
- Jeder Eintrag führt direkt zum passenden App-Bereich; Atemschulung öffnet den bestehenden Atem-Tab. Hinweise stellen klar, dass die Navigation weder absolvierte Kurseinheiten bestätigt noch Originalskripte ersetzt.
- Die Methodenfächer springen direkt auf ihre jeweilige Karte; Bereichs- und Tabwechsel setzen den gemeinsamen Scrollbereich auf den Anfang zurück.
- Statische Namensprüfung bestätigte alle elf Methodenkarten-Ziele; der Build und die Diff-Prüfung waren erfolgreich.
- Ein Abgleich der MOC-Hauptüberschriften bestätigt alle zwölf Kursfächer im Index; die Fachtitel entsprechen nun auch in den zuvor verkürzten Einträgen der Ausbildungsübersicht.
- TODO, NEXT und diese Ergebnisnotiz aktualisiert.
# Fallbeschreibung der offiziellen Vier-Wochen-Aufgabe vervollständigt (2026-11-02)

- Den Fallprompt mit den im Original-PDF genannten Angaben ergänzt: männlich, 38 Jahre, Abteilungsleiter eines Großunternehmens und leichtes Übergewicht.
- Der präventive Hinweis stellt jetzt ausdrücklich klar, dass das im Fall erwähnte Übergewicht kein zusätzliches Abnehmziel begründet; Verdauungs- und Schlafbeschwerden bleiben als Fallangaben, nicht als Diagnose, gekennzeichnet.
- TODO und diese Ergebnisnotiz aktualisiert.
# Lerncheck an die offizielle Vier-Wochen-Pflichtaufgabe angeschlossen (2026-11-02)

- Zwei quellengebundene Fragen prüfen jetzt den geforderten Arbeitsablauf und die vier Ernährungskapitel der Pflichtaufgabe.
- Begründungen verlinken die jeweilige Aufgabenanforderung und grenzen sie von medizinischer Behandlung sowie individueller Ernährungs-/Supplementempfehlung ab.
- TODO und diese Ergebnisnotiz aktualisiert.
# Kognitive Umstrukturierung quellengebunden eingeordnet (2026-11-02)

- Die Methodenübersicht erschließt jetzt den MOC-Themenpunkt „Kognitive Umstrukturierung zur Stressbewältigung“ direkt aus dem Kursindex.
- Die Karte und eine neue Lerncheck-Frage verbinden die MOC mit Stresstheorie S. 43: Veränderung eigener Bewertungen ist dort ein Coping-Ansatz; eine eigenständige Technik oder Schrittfolge ist im Skript nicht ausgeführt.
- Die App grenzt die Themenübersicht ausdrücklich von Therapie ab und verweist für die beschreibende Selbstreflexion auf das vorhandene SORKC-Arbeitsblatt.
- Quellenmatrix und TODO aktualisiert.
# Veralteten Projekt-Entscheidungsstand abgegrenzt (2026-11-02)

- `UNKLARHEITEN.md` beschrieb noch die frühere Planung einer Psychoneuroimmunologie-App und bezeichnete den inzwischen entwickelten Ausbildungsbereich als Platzhalter.
- Die Datei dokumentiert diesen Text nun als historischen Stand und stellt klar, dass die alten Skalen-/Schlaf-/CSV-Fragen das aktuelle Ziel der Kursrepräsentation nicht blockieren.
- `NEXT.md` hält die neue direkte Kursindex-Verknüpfung der kognitiven Umstrukturierung aktuell.
# Praxisrahmen der Methodenkarten klarer bezeichnet (2026-11-02)

- Die auf der Modulkarte verwendete Überschrift „Anleitungsidee“ konnte bei reinen Kursübersichten mit fehlender Schrittfolge wie eine konkrete Anleitung wirken.
- Die Überschrift heißt jetzt „Praxisrahmen“; der Markdown-Export des Stundenentwurfs verwendet ebenfalls „Praxisrahmen und Anpassung“.
- Die gebaute Ansicht des neuen Kursindex-Routings wurde manuell in Firefox bei dessen kleinstmöglicher Fensterbreite (500 CSS-Pixel) geprüft: Coping-Ansatz-Button öffnet die richtige Karte, der Deep-Link ist korrekt und die Dokumentbreite überschreitet die Viewportbreite nicht. Die echte 390-Pixel-Ansicht auf iPhone/iPad bleibt offen.
# AT-Themenübersicht gegen die Ausbildungs-MOC vervollständigt (2026-11-02)

- Die aktuelle Drive-Fassung der Master-MOC wurde direkt abgerufen und der AT-Abschnitt vollständig mit der Methodenkarte abgeglichen.
- Die Karte enthält jetzt neben Grund-/Mittel-/Oberstufe auch Ursprung, Definition/Anwendungsbereiche, Entspannung/Wirkungsweisen, Rahmenbedingungen/Kontraindikationen und alle genannten Übungsfelder samt Themen für Mittel- und Oberstufe.
- Eine Lerncheck-Frage prüft die Unterscheidung zwischen MOC-Kapitelstichworten und tatsächlich vorhandener Übungsanleitung. Quellenmatrix, TODO und NEXT aktualisiert.
# MOC-Thema Stress im Beruf und Alltag quellengebunden abgebildet (2026-11-02)

- Die aktuelle Master-MOC nennt in diesem Fach Ursachen und Folgen von Stress im privaten/beruflichen Umfeld sowie internationale Forschungsbezüge und nationale Trends.
- Im 70-seitigen Stresstheorie-PDF gegengeprüft: WHO-Hinweis (S. 4), Unternehmerbefragung zum Stressverständnis (S. 6), Life-Event-Forschung/Daily Hassles (S. 25), Arbeitsplatzstressoren (S. 38) und chronische/gesellschaftliche Folgen (S. 43). Eine aktuelle nationale Statistikübersicht oder systematische internationale Forschungszusammenfassung liegt dort nicht vor.
- Grundlagenansicht, Kursindex, Lerncheck, Quellenmatrix und TODO zeigen jetzt diese MOC/PDF-Grenze; es wurden keine unreferenzierten Kennzahlen ergänzt.
# Österreichischen Arbeitskontext quellgetrennt ergänzt (2026-11-02)

- Die Grundlagenkarte führt nun 65 % Präsentismus laut AK-Arbeitsklima-Index 2025 an: unselbständig Beschäftigte, die im letzten Halbjahr mindestens einmal trotz gesundheitlicher Einschränkung arbeiteten.
- Die Kennzahl ist ausdrücklich als selbstberichteter Kontextindikator und nicht als Stressprävalenz oder FlexyFit-Kursinhalt gekennzeichnet. Erhebungsbasen (Trend n = 44.096; Branchenvergleich 2025 n = 4.179) und direkte Quellenverknüpfung stehen dabei.
- Quellenmatrix und TODO führen die externe Ergänzung mit denselben Abgrenzungen.

# Startstatus des Relax-Dev-Dienstes gegen Portkonflikte abgesichert (2026-11-02)

- Ein Startversuch meldete zunächst „Node API healthy“, obwohl `aos-relax-dev.service` auf :9123 mit `EADDRINUSE` wiederholt abstürzte. Der vorhandene Listener war derselbe `server.mjs`-Checkout unter `coach-relax.service` (PID 875); sein Health-Endpunkt antwortete mit HTTP 200.
- Die fehlschlagende Dublette `aos-relax-dev.service` wurde gestoppt; `coach-relax.service` blieb aktiv und unverändert. Das User-Service des standalone Dev-Controllers ist nicht aktiviert.
- `relax-devctl start` und `restart` gelten jetzt erst als erfolgreich, wenn das jeweils konfigurierte User-Service und die API gleichzeitig aktiv sind; andernfalls endet der CLI-Aufruf mit Fehler und nennt beide Zustände. Die UI auf :5904 läuft derzeit nicht.
- Syntax per Python-AST und `git diff --check` geprüft; keine Tests ausgeführt.
# Offizielle Modulbeschreibung beim Mentaltraining quellengetrennt ergänzt (2026-11-02)

- Die offizielle Kursbeschreibung des Präventiven Fitness- und Vitaltrainer-Lehrgangs bestätigt beim Fach „Mentales- & autogenes Training“ Theorie und Praxis mit Raum für Selbsterfahrung; sie nennt öffentlich keine konkreten Formeln, Technikfolgen oder Dosierungen.
- Mentaltraining- und AT-Karten zeigen diesen Rahmen nun ausdrücklich neben den MOC-Themen. Die bestehende Reflexion verlinkt auf die programmspezifische Kursbeschreibung; die fehlenden Übungsfolgen bleiben offen, bis passende Kursmaterialien vorliegen.
- Die Kursbeschreibung nennt außerdem die mündlich-praktische Abschlussprüfung; die freiwillige Reflexionsprobe bleibt als App-Lernhilfe und nicht als offizielle Prüfungsrubrik gekennzeichnet.
- Der Produktionsbuild mit dem dokumentierten pnpm-Installationssetup lief durch und generierte den PWA-Service-Worker; `git diff --check` ist sauber. Keine Tests ausgeführt.

# Öffentliche FlexyFit-Lernhinweise am Reflexionsablauf ergänzt (2026-11-02)

- Die aktuelle FlexyFit-FAQ beschreibt Lehrvideos, Übungsdemonstrationen, regelmäßige eigene Wiederholung, Beobachtung erfahrener Trainer:innen und frühe Anleitungspraxis mit freiwilligen Übungspartnern als Lernwege.
- Diese Hinweise stehen jetzt am Methoden-Reflexionsfeld und in der Quellenmatrix als ergänzende Lernempfehlungen. Sie werden ausdrücklich nicht als fehlende methodenspezifische Originalanleitung oder als Ersatz des A-Lizenz-Praxisnachweises ausgegeben.

# Kursindex gegen offiziellen Vitaltrainer-Lehrgangsplan abgeglichen (2026-11-02)

- Die offizielle Kursinfo LWLL26-we-4a bestätigt den Dipl.-Entspannungstrainer als Modul II des Präventiven Fitness- und Vitaltrainers, mit eLearning und optionaler Präsenz (Online-Webinare) sowie zwölf Unterrichtsfächern.
- Der Kursindex verlinkt diese Quelle direkt und hält Pflichtaufgabe/Praxisprotokoll sichtbar von den zwölf Unterrichtsfächern getrennt.

# Dokumente-Bestand und MOC-Themen erneut abgeglichen (2026-11-02)

- Die relevanten Ausbildungsunterlagen unter `~/Dokumente` umfassen die FlexyFit-PDFs, den separaten Ausbildungsordner mit MOC und Markdown-Notizen sowie ältere Kopien. Die vier offenen Methoden enthalten weiterhin keine vollständigen methodenspezifischen Ablaufanleitungen.
- In der vollständigen Master-MOC waren „Achtsamkeitstraining und Meditationstechniken“ sowie „Stressmanagement durch mentales Training“ als Themen genannt. Beide sind jetzt an den passenden Karten ausdrücklich als MOC-Stichworte sichtbar; daraus werden keine Abläufe abgeleitet.
- Der Markdown-Text des separaten Sportpsychologie-Skripts bestätigt Fantasiereisen und Autogenes Training als Beispiele beim Angstmanagement (S. 45); die Stelle ist nur eine Methodenliste, keine Anleitung.
