import { useEffect, useMemo, useState } from 'react'
import { BookOpen, ClipboardList, Download, Upload, Plus, Check, Clock3, Wind, HeartPulse, Sparkles, Play, Pause, SkipBack, SkipForward, Square } from 'lucide-react'
import { getRelaxSession, getRelaxSessionHistory, saveRelaxSession } from '@db'
import { downloadText, localToday } from '../lib/db/shared/utils.js'
import { TEACHING_SCRIPT_KEY, PRANAYAMA_ASSIGNMENT_KEY } from '../lib/training/storage.js'

const METHODS = [
  { name: 'Atemschulung', duration: '15–20 Min. · lokaler Kursrichtwert', durationSource: 'Lokale Kursnotiz „00_Entspannungs-Protokoll-MINIMAL.md“ (erstellt 6. März 2026); das Atemschulungs-PDF selbst nennt keine Dauer.', icon: Wind, focus: 'Atem wahrnehmen und ruhig begleiten', practice: 'Das Kursskript schlägt vor, die Hände auf den Bauch zu legen und die Ein- und Ausatmung wahrzunehmen (S. 48). Ein bequemes Ausatmen ohne festes Zähltempo kann als App-Ergänzung angeboten werden; Atempausen und Rhythmen bleiben freiwillig.', adapt: 'Bei Schwindel, Unruhe oder Atemnot sofort zum natürlichen Atem zurückkehren. Keine forcierte Atmung oder langen Atemhalte als Entspannungsübung anleiten.', source: 'FlexyFit Academy: Atemschulung, S. 48; Stundenplanung, S. 8–12' },
  { name: 'Progressive Muskelrelaxation (PMR)', duration: '15–30 Min. · lokaler Kursrichtwert', durationSource: 'Lokale Kursnotiz „00_Entspannungs-Protokoll-MINIMAL.md“; das separate PMR-Handout nennt 20–30 Minuten für die dort gezeigte Langform.', icon: HeartPulse, focus: 'Spannung und Loslassen im Wechsel unterscheiden', practice: 'Das Ausbildungsskript beschreibt das Wechselspiel aus kurzer Muskelanspannung und anschließendem Lösen mit bewusstem Nachspüren. Es nennt 5–7 Sekunden Anspannung und 30–40 Sekunden Wahrnehmungszeit als Kursrahmen (S. 22). Die geführte 20-Schritte-Langform weiter unten stammt aus einem separaten Handout, nicht aus diesem Kursskript.', adapt: 'Betroffene, schmerzhafte oder verletzte Bereiche auslassen; Anspannung stets dosieren. Bei Unsicherheit oder Unwohlsein Übung ohne Anspannung beobachten oder beenden. Das Kursskript enthält Hinweise zu Kontraindikationen (S. 5); diese Übersicht ersetzt keine fachliche Eignungsabklärung.', source: 'FlexyFit Academy: Progressive Muskelrelaxation, S. 3–28; separate geführte Langform: lokales PMR-Handout, S. 1–4 (externe Quellenangabe im PDF: progressivemuskelentspannung.com); Stundenplanung, S. 8, 12', outlineTitle: 'PMR-Grundlagen im Ausbildungsskript', outline: [
    ['Prinzip und Ziel · S. 3–4, 7–8', 'Das Skript stellt den Wechsel von Anspannung und Entspannung sowie das Wahrnehmen des Unterschieds in den Mittelpunkt. Es beschreibt PMR als aktive Entspannungstechnik und ordnet die historische Entwicklung nach Jacobson ein. Wirkungsbeschreibungen auf der Karte sind Kursinhalte, keine individuelle Zusage.'],
    ['Lernschritte · S. 9–11', 'Die Unterlage führt vom Aufbau eines Muskelsinns über einzelne Muskelgruppen hin zur gleichzeitigen Entspannung mehrerer Gruppen und zu ruhiger, regelmäßiger Atmung. Wiederholung wird als Teil des Lernwegs genannt.'],
    ['Vorbereitung · S. 20–21', 'Kursrahmen: möglichst ungestörter, geräuscharmer und angenehm temperierter Ort, bequeme Liegeposition und passive, akzeptierende Grundhaltung. Das Skript empfiehlt Geduld und keinen Leistungsdruck.'],
    ['Anspannen und lösen · S. 22–23', 'In der Kursschilderung bequem liegen, Aufmerksamkeit auf die Atmung richten, eine Muskelgruppe anspannen, 5–7 Sekunden halten, auf ein Signal lösen und 30–40 Sekunden nachspüren. Die konkrete Anleitung wird passend angeleitet und individuell angepasst.'],
    ['Gruppenfolge · S. 23–25', 'Das Skript überschreibt die Abfolge mit „16 Schritte“ und listet Hände/Arme, Gesichts- und Halsbereiche, Rumpf sowie Füße und Beine. Die Einzelpositionen auf S. 24–25 und die anschließende Kurzliste sind nicht eindeutig deckungsgleich; daher wird hier keine bereinigte kanonische 16er-Liste erfunden.'],
    ['Nachspüren und Abschluss · S. 26–28', 'Nach dem Durchgehen der Gruppen sieht das Skript Zeit für die bewusste Wahrnehmung und eine langsame Rückführung vor. Danach folgen offene Besprechung positiver oder unangenehmer Wahrnehmungen und ein Hinweis auf regelmäßiges Üben.'],
    ['Wirkungsaussagen · S. 13–18', 'Das PDF nennt körperliche und seelische Veränderungen sowie längerfristige Wirkungen. Diese stehen hier nur als Aussagen des Lehrmaterials; sie sind keine Diagnose, Garantie oder Aussage über die Wirkung bei einer einzelnen Person.'],
  ], outlineExtraTitle: 'Geführte 20-Schritte-Langform · separates Handout', outlineExtra: [
    ['Quellenstatus', 'Die interaktive Schrittfolge weiter oben folgt dem lokalen Handout, das auf eine externe Quelle verweist. Sie ist nicht die nummerierte Gruppenfolge des FlexyFit-Ausbildungsskripts.'],
    ['Skriptgrenze', 'Das Ausbildungsskript enthält auf S. 5 eine eigene Rubrik zu Kontraindikationen. Diese App-Karte ist keine medizinische Eignungsprüfung; bei Unsicherheit die Teilnahme fachlich abklären lassen.'],
  ] },
  { name: 'Konzentrative Muskelentspannung', duration: 'Im Stundenentwurf festlegen', icon: HeartPulse, focus: 'Als Verfahren der muskulären Ebene kennenlernen', practice: 'Die Stresstheorie führt die konzentrative Muskelentspannung als Beispiel der muskulären Ebene auf. Im geprüften Kursarchiv liegt dazu keine methodenspezifische Anleitung vor; die Karte dokumentiert deshalb nur die Einordnung.', adapt: 'Keine eigene Übungsfolge aus dem Namen ableiten. Nur nach praktischer Einschulung anleiten und Rückmeldungen der Teilnehmenden berücksichtigen.', source: 'FlexyFit Academy: Stresstheorie, S. 55 · Einordnung, keine Schrittfolge', outlineTitle: 'Kurseinordnung', outline: [
    ['Muskuläre Ebene · S. 55', 'Das Skript listet konzentrative Muskelentspannung neben Progressiver Muskelentspannung und muskulärem Tiefentraining. Eine konkrete Übungsfolge oder Dosierung ist auf dieser Übersichtsseite nicht enthalten.'],
  ] },
  { name: 'Muskuläres Tiefentraining', duration: 'Im Stundenentwurf festlegen', icon: HeartPulse, focus: 'Als Verfahren der muskulären Ebene kennenlernen', practice: 'Die Stresstheorie führt muskuläres Tiefentraining als Beispiel der muskulären Ebene auf. Im geprüften Kursarchiv liegt dazu keine methodenspezifische Anleitung vor; die Karte dokumentiert deshalb nur die Einordnung.', adapt: 'Keine eigene Übungsfolge aus dem Namen ableiten. Nur nach praktischer Einschulung anleiten und Rückmeldungen der Teilnehmenden berücksichtigen.', source: 'FlexyFit Academy: Stresstheorie, S. 55 · Einordnung, keine Schrittfolge', outlineTitle: 'Kurseinordnung', outline: [
    ['Muskuläre Ebene · S. 55', 'Das Skript listet muskuläres Tiefentraining neben konzentrativer Muskelentspannung und Progressiver Muskelentspannung. Eine konkrete Übungsfolge oder Dosierung ist auf dieser Übersichtsseite nicht enthalten.'],
  ] },
  { name: 'Die fünf Tibeter · Bewegungsreihe', duration: 'Dauer nach Stundenentwurf', icon: HeartPulse, focus: 'Eine Bewegungsfolge mit Ausgangs-, End- und Ausgleichsposition kennenlernen', practice: 'Das PMR-Kursskript führt als ergänzenden Praxisteil fünf Bewegungen auf: Kreisel, Kerze, Halbmond, Brücke und Berg. Die Übersicht erschließt die im Text beschriebenen Positionen und Übergänge; die Fotos und praktische Einschulung bleiben für die konkrete Durchführung maßgeblich.', adapt: 'Bewegungen an eigene Möglichkeiten anpassen oder auslassen und bei Unsicherheit praktisch rückfragen. Das Skript enthält eine eigene Wiederholungsempfehlung (S. 30); sie wird hier nicht als allgemeines persönliches Trainingsziel übernommen. Die Reihe ist ein ergänzender Bewegungsteil und kein PMR-Anspannungsprotokoll.', source: 'FlexyFit Academy: Progressive Muskelrelaxation, S. 29–46', outlineTitle: 'Bewegungsfolgen im Kursskript', outline: [
    ['1 · Der Kreisel · S. 31–33', 'Langsam im Uhrzeigersinn um die eigene Achse drehen und dabei die eigene stabile Geschwindigkeit wählen. Zum Ausgleich die Hände vor der Brust falten und ruhig atmen, bis sich die Drehung legt.'],
    ['2 · Die Kerze · S. 34–36', 'In Rückenlage zunächst Kopf/Nacken und unteren Rücken Richtung Boden orientieren. Dann Beine und Kopf gleichzeitig anheben; Beine möglichst gestreckt und Füße angewinkelt halten. Zurück in Rückenlage und die Ausgangsposition erneut finden.'],
    ['3 · Der Halbmond · S. 37–39', 'Im Kniestand mit aufgestellten Zehen die Hände an den Gesäßbereich legen und Kopf sowie Wirbelsäule nur im angenehmen Bereich nach hinten bewegen. Als Ausgleich nennt das Skript den Päckchensitz.'],
    ['4 · Die Brücke · S. 40–42', 'Aufrecht am Boden sitzen, Hände neben dem Gesäß abstützen und das Becken anheben, bis die Brückenform entsteht. Den Kopf nur so weit bewegen, wie es angenehm ist. Zum Ausgleichen in eine eingerollte Position wechseln.'],
    ['5 · Der Berg · S. 43–45', 'Aus der Bauchlage mit Händen am Boden in die gezeigte Stützposition kommen und zwischen dem Durchhängen des Bauches und dem Anheben des Gesäßes wechseln. Das Skript zeigt eine Variante mit den Fersen am Boden für Fortgeschrittene; als Ausgleich nennt es abwechselnd angewinkelten Arm und Bein in Bauchlage.'],
  ], outlineExtraTitle: 'Quellenhinweise', outlineExtra: [
    ['Aufbau · S. 30', 'Das Skript gliedert die Folgen in Ausgangsposition, Endposition und Ausgleichsübung. Es nennt auch eine Wiederholungsempfehlung für wenig Geübte; sie wird hier als Quellenangabe kenntlich gemacht, nicht als individuelle Vorgabe.'],
    ['Herkunftserzählung · S. 31', 'Das Skript weist selbst darauf hin, dass die Entstehungsgeschichte um Peter Kelders Buch nicht unumstritten ist und vermutete Yoga-Wurzeln hat. Die Erzählung wird nicht als historische Tatsache oder Wirkungsbeleg verwendet.'],
  ] },
  { name: 'Autogenes Training', duration: '20–30 Min. · lokaler Kursrichtwert', durationSource: 'Lokale Kursnotiz „00_Entspannungs-Protokoll-MINIMAL.md“; das Kursarchiv enthält keine Schritt-für-Schritt-Anleitung.', icon: Sparkles, focus: 'Eine systematische Entspannungsmethode kennenlernen', practice: 'Die Stresstheorie ordnet Autogenes Training der vegetativen Ebene zu; die Stundenplanung nennt es als systematische Kursmethode. Eine lokale MOC-Notiz führt weitere AT-Themen auf, ist aber kein Anleitungsskript. Die genaue Übungsfolge deshalb nur aus praktisch vermitteltem Originalmaterial anleiten.', adapt: 'Bei Unwohlsein Augen öffnen, Haltung ändern oder Übung beenden lassen. Keine Wirkung versprechen und individuelle Reaktionen ernst nehmen.', source: 'FlexyFit Academy: Stresstheorie, S. 55–56; Stundenplanung, S. 6, 12–13; ergänzend lokale Notiz „MOC-Dipl.Entspannungstrainer“', outlineTitle: 'Kursrahmen und ergänzende Themenübersicht · keine AT-Übungsfolge', outline: [
    ['Einordnung und AT-Themen laut lokaler MOC-Notiz', 'Die persönliche Ausbildungsübersicht nennt Grund-, Mittel- und Oberstufe sowie Ruhetönung, Schwere-, Wärme-, Atem- und Herzregulierung, Bauchwärme und Stirnkühlung. Ihre Methodenübersicht führt AT unter der muskulären Ebene; das FlexyFit-Skript „Stresstheorie“ ordnet es auf S. 55 der vegetativen Ebene zu. Für diese App gilt die Original-PDF-Zuordnung. Die MOC enthält keine Formeln oder Schrittfolge und ist keine AT-Anleitung.'],
    ['Rücknahme · Stundenplanung, S. 12', 'Für liegende Übungen mit geschlossenen Augen nennt das Skript eine ausreichend lange, schrittweise Rücknahme. Bei AT empfiehlt es ein wiederkehrendes Ritual; als Beispiel wird das Zählen von 4 auf 1 mit kleinen Bewegungen, Dehnen, Strecken, bewusstem Atmen und leichter Aktivierung bis zum Sitzen oder Stehen beschrieben. Das ist ein Kursbeispiel, keine vollständige AT-Anleitung.'],
    ['Abschluss · Stundenplanung, S. 13', 'Nach der Entspannungseinheit Zeit für ein Gespräch über das Erleben einplanen. Das Skript empfiehlt gezieltes, offenes Nachfragen und die Reflexion des eigenen Stundenkonzepts.'],
  ] },
  { name: 'Mentales Training · Themenübersicht', duration: 'Im Stundenentwurf festlegen', icon: Sparkles, focus: 'Mentales Training als Themenfeld des Fachmoduls einordnen', practice: 'Die lokale Ausbildungs-MOC führt mentales Training im Kapitel „Mentales- & autogenes Training“ auf; die offizielle Kursbeschreibung nennt das Fach ebenfalls. Im geprüften Kursarchiv liegt dazu kein eigenes Anleitungs-PDF. Diese Karte erschließt daher nur die Themenübersicht und leitet keine konkrete Übung an.', adapt: 'Visualisierung, Autosuggestion, Ankern oder Zielsetzung sind hier Themenüberschriften, keine Anleitung oder Wirkungszusage. Konkrete Techniken nur aus tatsächlich vermitteltem Kursmaterial übernehmen und die eigene Kompetenzgrenze benennen.', source: 'Lokale Ausbildungs-MOC „MOC-Dipl.Entspannungstrainer“, Kapitel Mentales Training; offizielle FlexyFit-Diplom-Kursbeschreibung', outlineTitle: 'Themen laut Ausbildungs-MOC · keine Schrittfolge', outline: [
    ['Grundlagen und Zielbereiche', 'Die MOC nennt Definition und Entwicklung, Ziel und Nutzen, Psychoregulation sowie den optimalen Leistungszustand mit Entspannen, Aktivieren und Fokussieren. Es handelt sich um Kapitelüberschriften, nicht um ausgearbeitete Lehrtexte.'],
    ['Genannte Themenfelder', 'Aufgeführt sind Visualisierung und Sinneseindrücke, Autosuggestion, Ankern, Zielsetzungstraining, Mentales Training nach Eberspächer und ideomotorische Bewegungen. Die MOC enthält hier keine vollständige Durchführung oder Dosierung.'],
    ['Quellenabgrenzung', 'Die lokale MOC ist eine Themenübersicht. Bei der Suche im FlexyFit-Kursarchiv wurde kein eigenständiges Skript zu Mentaltraining gefunden; die Visualisierung im Wirbelsäulen-Skript bezieht sich dort auf anatomische Anschauung und ist keine Mentaltrainings-Anleitung.'],
  ] },
  { name: 'Selbsthypnose · Kursübersicht', duration: 'Im Stundenentwurf festlegen', icon: Sparkles, focus: 'Eine im Skript genannte Soforthilfe einordnen', practice: 'Die Stresstheorie führt Selbsthypnose neben Autogenem Training und PMR als Verfahren der Soforthilfe auf. Sie beschreibt Ähnlichkeiten zu AT und nennt eigene Ziele als möglichen Anwendungskontext. Ein spezifisches Selbsthypnose-Anleitungsskript liegt im Kursarchiv nicht vor; die Karte dokumentiert nur den Kursverweis.', adapt: 'Keine Selbsthypnose-Formel oder Wirkung aus der knappen Quellenbeschreibung ableiten. Nicht als Behandlung oder Empfehlung für ein individuelles Ziel darstellen.', source: 'FlexyFit Academy: Stresstheorie, S. 52 · Überblick, keine Schrittfolge', outlineTitle: 'Soforthilfe im Skript', outline: [
    ['Quellenaussage · S. 52', 'Das Skript beschreibt Selbsthypnose als dem Autogenen Training ähnlich und verbindet sie mit bestimmten persönlichen Zielen. Weitergehende Wirkungsangaben sind Aussagen der Unterlage; sie werden hier nicht als bestätigt oder individuell geeignet übernommen.'],
    ['Anleitungsgrenze', 'Das Kursarchiv enthält keine methodenspezifische Selbsthypnose-Formel oder vollständige Schrittfolge. Die Karte dient der Quellenorientierung, nicht der Durchführung.'],
  ] },
  { name: 'Biofeedback · gerätegestütztes Lernverfahren', duration: 'Nur mit geeigneter Ausstattung und Einweisung', icon: HeartPulse, focus: 'Körpersignale als unmittelbare Rückmeldung im Lernprozess kennenlernen', practice: 'Das Stresstheorie-Skript beschreibt eine Apparatur, die körpereigene Signale über Licht oder Ton zurückmeldet. Die Person wählt eigene Entspannungsschritte und erhält dazu direkt Rückmeldung. Ziel laut Skript ist, Entspannung zunehmend unabhängig vom Gerät zu erreichen. Das ist eine Quellenzusammenfassung, keine Anleitung zur Auswahl oder Anwendung eines Messgeräts.', adapt: 'Die Rückmeldung ist keine Diagnose und garantiert keine bestimmte Wirkung. Keine Messwerte ohne qualifizierte Einweisung erheben oder interpretieren; das Gerät ist kein Ersatz für persönliche Wahrnehmung. Diese App misst keine Körpersignale und empfiehlt keine Geräte.', source: 'FlexyFit Academy: Stresstheorie, S. 47 · Beschreibung des Lernverfahrens, keine Geräteanleitung', outlineTitle: 'Biofeedback im Kursskript · S. 47', outline: [
    ['Signalrückmeldung', 'Ein Gerät gibt körpereigene Signale, die laut Skript mit An- oder Entspannung verbunden sind, als Licht oder Ton zurück. Die App setzt keine konkreten Sensoren oder Messwerte voraus.'],
    ['Eigene Entspannungsschritte', 'Die Person versucht laut Skript mit Methoden eigener Wahl kleine Entspannungsschritte und erhält dazu unmittelbar Rückmeldung. Eine bestimmte Technik wird an dieser Stelle nicht vorgeschrieben.'],
    ['Ziel und Grenze', 'Das Skript beschreibt als Ziel, Entspannung zunehmend unabhängig vom technischen Gerät zu erreichen. Die App übernimmt diese Kursaussage ohne individuelle Wirkungsgarantie oder medizinische Auswertung.'],
  ] },
  { name: 'Phantasiereise & innere Bilder', duration: '20–30 Min. · lokaler Kursrichtwert', durationSource: 'Lokale Kursnotiz „00_Entspannungs-Protokoll-MINIMAL.md“; das Kursarchiv enthält keine Schritt-für-Schritt-Anleitung.', icon: BookOpen, focus: 'Mit einer ruhigen, freiwilligen Vorstellungsübung arbeiten', practice: 'Die Stresstheorie ordnet Fantasiereisen der emotionalen Ebene zu und nennt sie als langfristige Stressbewältigung. Ein spezifisches Fantasiereisen-Anleitungsskript liegt im Kursarchiv nicht vor; konkrete Texte daher anhand der praktischen Einschulung selbst vorbereiten.', adapt: 'Keine belastenden oder überraschenden Szenen vorgeben. Augen offen halten oder aussteigen lassen und eine schrittweise Rücknahme mit Orientierung einplanen.', source: 'FlexyFit Academy: Stresstheorie, S. 55–56; Stundenplanung, S. 12–13', outlineTitle: 'Kursrahmen zur Rücknahme · keine Fantasiereisen-Anleitung', outline: [
    ['Rücknahme · Stundenplanung, S. 12', 'Für liegende Übungen mit geschlossenen Augen nennt das Skript eine ausreichend lange, schrittweise Rücknahme. Fantasiereisen werden ausdrücklich als Methode genannt, bei der eine gute Rücknahme wichtig ist. Ein wiederkehrendes Ritual mit kleinen Bewegungen und schrittweiser Aktivierung ist ein Kursbeispiel; einen konkreten Reise-Text enthält die Unterlage nicht.'],
    ['Abschluss · Stundenplanung, S. 13', 'Nach der Entspannungseinheit Zeit für ein Gespräch über das Erleben einplanen. Das Skript empfiehlt gezieltes, offenes Nachfragen und die Reflexion des eigenen Stundenkonzepts.'],
  ] },
  { name: 'Suggestive Musik', duration: 'Im Stundenentwurf festlegen', icon: BookOpen, focus: 'Musik als emotionales Kursmittel einordnen', practice: 'Die Stresstheorie nennt suggestive Musik als Beispiel der emotionalen Ebene. Eine methodenspezifische Anleitung liegt im Kursarchiv nicht vor. Die Stundenplanung behandelt Musik allgemein als optionales Hilfsmittel; sie kann auch ablenken und soll eine verbale Anleitung nicht übertönen.', adapt: 'Musik nur passend zum Kursziel und freiwillig einsetzen. Ruhige Instrumentalmusik ohne Text oder Naturgeräusche leiser als die Stimme wählen; Wahrnehmung der Gruppe beachten.', source: 'FlexyFit Academy: Stresstheorie, S. 55; Stundenplanung, Musik S. 11, 16, 24', outlineTitle: 'Kurseinordnung und allgemeine Musikplanung', outline: [
    ['Emotionale Ebene · Stresstheorie, S. 55', 'Das Skript listet suggestive Musik neben Fantasiereisen. Es beschreibt hier keine konkrete Musikfolge, Suggestion oder Praxisanleitung.'],
    ['Musik in der Stunde · Stundenplanung, S. 11, 16, 24', 'Die Stundenplanung macht Musik zur optionalen Unterstützung, weist auf mögliche Ablenkung hin und empfiehlt langsame Instrumentalmusik ohne Text oder Naturgeräusche unterhalb der Lautstärke der Kursleitung (S. 11). S. 16 behandelt Störgeräusche im Raum, S. 24 nennt zarte Musik beim Nachspüren. Das sind allgemeine Rahmenhinweise, keine methodenspezifische Anleitung für suggestive Musik.'],
  ] },
  { name: 'Yoga · Asana-Praxis', duration: '30–60 Min. · lokaler Kursrichtwert', durationSource: 'Lokale Kursnotiz „00_Entspannungs-Protokoll-MINIMAL.md“; das Originalskript enthält Übungsbeschreibungen, aber keine Dauer für eine Einheit.', icon: Wind, focus: 'Haltungen, Atem und Körperwahrnehmung verbinden', practice: 'Das Skript führt Yoga als philosophische Lehre mit geistigen und körperlichen Übungen ein und stellt die Asana-Praxis mit Grundsätzen und Varianten vor. Die Übersicht erfasst zusätzlich alle 22 Haltungen und Bewegungsformen, ersetzt aber keine praktische Einschulung.', adapt: 'Das Kursskript sagt, Haltungen nur so auszuführen, dass sie angenehm sind und Wohlbefinden bestehen bleibt. Varianten, Vorübungen und praktische Aufsicht gehören zur Vermittlung; eine Pose muss nicht erzwungen oder vollständig erreicht werden.', source: 'FlexyFit Academy: Grundübungen Yoga, S. 3–72', outlineTitle: 'Haltungen und Bewegungsformen im Originalskript', outline: [
    ['Tadasana · Berghaltung · S. 6–8', 'Standhaltung zum Erarbeiten von Stabilität und Aufrichtung.'],
    ['Vrksasana · Baum · S. 9–11', 'Einbeinstand mit wählbarer Arm- und Fußposition; Gleichgewicht und Stabilität erkunden.'],
    ['Adho Mukha Svanasana · Herabschauender Hund · S. 12–14', 'Stützposition mit Hinweisen zu Händen, Füßen und Länge von Rücken und Nacken.'],
    ['Sthira Sukham Asanam · Ausfallschritt · S. 15–17', 'Übergangsposition zwischen Übungen; das Skript betont ein stabiles Fundament und Varianten.'],
    ['Virabhadrasana II · Krieger II · S. 18–20', 'Standhaltung mit geöffneten Armen und Blick zur vorderen Hand.'],
    ['Utthita Parsvakonasana · gestreckter Seitwinkel · S. 21–23', 'Seitwinkelhaltung mit Hinweisen zu Fußposition, Ausrichtung und Varianten.'],
    ['Setu Bandhasana · Brücke · S. 24–26', 'Unterstützte Rückenlage; das Skript zeigt die Verwendung eines Blocks.'],
    ['Viparita Karani · Umkehr-Mudra · S. 27–30', 'Als Mudra, nicht als Asana bezeichnet; unterstützte Umkehrposition und Entspannungshaltung.'],
    ['Navasana · Boot · S. 31–33', 'Gleichgewichtsübung mit Varianten; das Skript betont einen langen unteren Rücken.'],
    ['Balasana · Stellung des Kindes · S. 34–36', 'Ruheposition mit beschriebenen Arm- und Schultervarianten.'],
    ['Paschimottanasana · sitzende Vorbeuge · S. 37–39', 'Vorbeuge mit persönlichem Bewegungsumfang und langem Rücken; Kopf muss nicht die Knie erreichen.'],
    ['Trikonasana · Dreieck · S. 40–42', 'Stehhaltung mit stabiler Basis und beschriebenem Einsatz eines Blocks.'],
    ['Ardha Matsyendrasana · Drehsitz · S. 43–45', 'Sitzende Drehhaltung; das Skript ordnet sie vorwiegend dem Ende einer Yogastunde zu.'],
    ['Virasana · Heldensitz · S. 46–48', 'Sitzhaltung mit optionaler Unterstützung unter Füßen oder Gesäß.'],
    ['Prasarita Padottanasana · weite Vorbeuge · S. 49–51', 'Vorbeuge mit weiter Fußstellung; das Skript nennt Blöcke als mögliche Unterstützung.'],
    ['Shalabhasana · Heuschrecke · S. 52–54', 'Rückenbeuge in Bauchlage; die Bewegung soll laut Skript nicht aus dem unteren Rücken kommen.'],
    ['Ardha Chandra Asana · Halbmond · S. 55–57', 'Balancehaltung mit einfacher und gedrehter Variante.'],
    ['Parshvottanasana · Flankenhaltung · S. 58–60', 'Stehende Vorbeuge mit unterschiedlichen Handpositionen und optionalen Blöcken.'],
    ['Upavistha Konasana · Vorbeuge mit geöffneten Beinen · S. 61–63', 'Sitzende Vorbeuge mit geöffneten Beinen und schrittweisem Auflösen.'],
    ['Cat & Cow · Katze und Kuh · S. 64–66', 'Bewegungsfolge im Vierfüßlerstand, in der die Wirbelsäule wellenförmig bewegt wird.'],
    ['Shavasana · Totenstellung · S. 67–69', 'Abschlussruhe am Ende der Yogaeinheit; das Skript nennt 5–15 Minuten und freie Atmung.'],
    ['Sukhasana · bequemer Sitz · S. 70–72', 'Aufgerichtete, schmerzfreie Sitzhaltung für Atemübungen und Meditation; Decke oder Block können unterstützen.'],
  ], outlineExtraTitle: 'Einleitung und Ausführungsgrundsätze im Kursheft', outlineExtra: [
    ['Yoga als Lehre · S. 3', 'Das Skript beschreibt Yoga als indische philosophische Lehre mit geistigen und körperlichen Übungen und nennt Yama, Niyama, Asana, Pranayama, Pratyahara und Kriyas als Beispiele. Es fasst Yoga als ganzheitlichen Ansatz auf und hebt die Wirbelsäule hervor.'],
    ['Asana-Praxis · S. 4', 'Asanas werden überwiegend als ruhende Körperübungen beschrieben; je nach Haltung können Beweglichkeit und Körperbeherrschung gefordert sein. Das Skript nennt Vorübungen und Variationen, empfiehlt Erlernen unter Aufsicht und betont eine angenehme Ausführung, bei der Wohlbefinden bleibt.'],
  ] },
  { name: 'Pilates · Basisprogramm', duration: '30–60 Min. · lokaler Kursrichtwert', durationSource: 'Lokale Kursnotiz „00_Entspannungs-Protokoll-MINIMAL.md“; das Originalskript enthält Übungsbeschreibungen, aber keine Dauer für eine Einheit.', icon: HeartPulse, focus: 'Zentrum, Atmung und kontrollierte Ganzkörperbewegung verbinden', practice: 'Das Originalskript beschreibt Pilates-Begriffe und -Cues, acht Bewegungskategorien sowie eine Übungssammlung mit Ausgangsstellungen, Durchführung und Fehlerquellen. Die Übersicht erschließt diese Kursinhalte; sie ersetzt keine praktische Einschulung.', adapt: 'Übungen an Gruppe und Ziel anpassen; Bewegungsqualität und Wahlmöglichkeiten berücksichtigen. Historische Kurs-Cues, insbesondere „Flat Back/Imprint“, nicht ungeprüft als für jede Übung notwendige Position ausgeben. Die gelisteten Fehlerquellen sind Kurslernhinweise, keine Diagnosehilfe.', source: 'FlexyFit Academy: Grundübungen Pilates, S. 8–97', outlineTitle: 'Acht Kategorien aus dem Originalskript', outline: [
    ['1 · Rückenlage · S. 18', 'Körperzentrum wahrnehmen und Atmung mit kontrollierten Arm- oder Beinbewegungen verbinden.'],
    ['2 · Seitlage · S. 19', 'Stabilisation und axiale Länge mit einer kleineren Unterstützungsfläche üben.'],
    ['3 · Sitz · S. 19', 'Aufrichtung, Rumpforganisation und ruhige Atmung erkunden.'],
    ['4 · Bauchlage · S. 20', 'Rumpfbewegung mit Schwerpunkt Rücken und kontrollierter Extension.'],
    ['5 · Gewichtsübernahme der oberen Extremitäten · S. 20', 'Arme und Rumpf verbinden; Stützkraft und Kopf-Nacken-Organisation beachten.'],
    ['6 · Ganzkörperintegration · S. 20', 'Unterschiedliche Körperabschnitte koordiniert und kontrolliert bewegen.'],
    ['7 · Überkopforganisation · S. 21', 'Umkehrhaltungen; das Skript nennt Beweglichkeit und dynamische Stabilität als Voraussetzungen.'],
    ['8 · Stand · S. 21', 'Ausrichtung und Gleichgewicht als Grundlage natürlicher Fortbewegung wahrnehmen.'],
  ], outlineExtraTitle: 'Pilates-Konzept und Übungssammlung · Quellseiten', outlineExtra: [
    ['Abgleich mit der lokalen Master-MOC', 'Die lokale Übersicht fasst das Basisprogramm in sechs Gruppen und 16 Übungseinträge zusammen. Das FlexyFit-Originalskript trennt acht Kategorien (S. 17–21) und führt in der Übungssammlung 19 Einträge (S. 24–97) auf. Diese Karte folgt der detaillierteren Originalquelle.'],
    ['Funktionell wichtige Körpersegmente · S. 22–23', 'Bildtafeln markieren Körpersegmente als visuelle Orientierung zum Basisprogramm. Sie ergänzen die Konzept- und Kategorienseiten, bilden aber keine zusätzliche Übungsfolge.'],
    ['Pilates-Atmung · S. 9', 'Das Skript beschreibt traditionell vier Zählzeiten Einatmung vor und vier Zählzeiten Ausatmung während der Bewegung; es nennt auch eine abweichende Atemempfehlung anderer Autor:innen. Das ist eine überlieferte Kursbeschreibung, kein verbindlicher Atemrhythmus für jede Person oder Bewegung.'],
    ['Pilates Stance · S. 10', 'Begriff für die V-förmige Fußstellung durch Außenrotation der Beine in der Hüfte. Das Skript verortet die Stellung in ihrem historischen Bewegungskontext; sie ist keine notwendige Ausgangsposition jeder Übung.'],
    ['Flat Back / Spine to Mat / Imprint · S. 11', 'Das Skript beschreibt diese Begriffe über ein flach an die Matte orientiertes Becken/Rückensegment und eine posteriore Beckenkippung. Diese Quellvorgabe ist nicht als universelle Neutralposition oder zwingende Ausführung für alle Übungen formuliert.'],
    ['Bauchnabel einziehen · S. 12', 'Das Skript führt den Cue als häufige Aktivierung der Bauchmuskulatur im Zusammenhang mit „Lendenwirbelsäule Richtung Matte“ auf. Die Karte kennzeichnet ihn als Kursbegriff, nicht als dauerhaftes maximales Anspannen.'],
    ['„Pospannung“ · S. 13', 'Das Original verwendet ein Münzbild, um das Anspannen der Gesäßmuskulatur zu veranschaulichen. Auch dies ist ein spezifischer verbaler Cue aus der Quelle und kein allgemeines Dauer-Spannungsgebot.'],
    ['Kinn zur Brust · S. 14', 'Das Skript beschreibt das sanfte Einrollen des Kopfes mit langem Nacken für Rollbewegungen. Die konkrete Kopf- und Nackenposition muss zur jeweiligen Übung und Person passen.'],
    ['Achseln zum Becken · S. 15', 'Verbaler Cue für die Schulterblattbewegung nach unten. Die Quelle formuliert starkes „Pressen“; die Karte hält den Begriff als historischen Kurs-Cue fest und erhebt ihn nicht zur pauschalen Haltungskorrektur.'],
    ['Rückenlage · S. 24–54', 'Pelvic Clock, Shoulder Drops, Chest Lift, Dead Bug, Side to Side, Bridging I, Roll Over I und Assisted Roll Up / Roll Down.'],
    ['Seitlage · S. 55–66', 'Book Openings, Side-Kick Serie und Side Lift.'],
    ['Sitz · S. 67–73', 'Spine Stretch I und Mermaid I.'],
    ['Bauchlage · S. 74–84', 'Scarecrow, Swan und Dart.'],
    ['Vierfüßlerstand · S. 85–88', 'Quadruped.'],
    ['Weitere Übungen im Stand · S. 89–97', 'Roll Down und Standing Balance. Die Einzelseiten führen diese Übungen im Stand aus; eine Kategoriezuordnung wird dort nicht wiederholt.'],
  ] },
  { name: 'Stretching & Assisted Stretching', duration: '30 Min. / Ausklang 10–15 Min.', icon: Clock3, focus: 'Beweglichkeit achtsam und individuell erkunden', practice: 'Vor jeder Einheit aufwärmen und den Bewegungsumfang (ROM) testen. Eine entspannte Atmosphäre und ein Handtuch vorbereiten; Gelenke und Becken neutral halten, die eigene Körperhaltung beachten und fließend zwischen individuell gewählten Übungen wechseln. Atmung und Körpergefühl beachten: „Wollen ist gut – zu viel tut weh.“', adapt: 'Eignung, Tagesform und Einschränkungen vorher klären. Feedback und Wohlergehen laufend erfragen; Berührungen nur nach ausdrücklicher Zustimmung. Bei Schmerz oder Unsicherheit abbrechen oder eine andere Übung wählen.', source: 'FlexyFit Academy: Assisted Stretching, S. 4–41', outlineTitle: 'Flexibilitätstraining · Grundlagen und bebilderte Beispiele', outline: [
    ['Begriff · S. 4–5', 'Beweglichkeit/Flexibilität bezeichnet im Skript die mögliche Bewegungsweite. Es unterscheidet Gelenkigkeit von der Dehnfähigkeit beteiligter Gewebe.'],
    ['Einflussfaktoren · S. 8–10', 'Das Skript nennt Tageszeit, Innen- und Außentemperatur, Ermüdung, Alter, Geschlecht und Wasserverlust sowie den Muskeltonus als Einflussgrößen.'],
    ['Dehnmethoden · S. 12–14', 'Übersicht über aktive und passive statische, intermittierende und Anspannungs-Entspannungs-Methoden (u. a. PNF) sowie aktive/passive dynamische und gemischte Formen.'],
    ['Ziel und Methode · S. 15–17', 'Das Kursprinzip lautet: Das Ziel entscheidet über die Methode. Das Skript listet Bewegungsreichweite, Dehnungstoleranz und subjektives Wohlbefinden als mögliche Zielbereiche und diskutiert Grenzen von Wirkversprechen.'],
    ['Bebilderte Übungen · Oberkörper S. 18–20, Unterkörper S. 21–28', 'Das Skript ergänzt die Grundlagen durch bebilderte Bewegungsbeispiele für Ober- und Unterkörper. Die Tafeln bestehen überwiegend aus Zeichnungen ohne ausformulierte Übungsnamen oder Schritt-für-Schritt-Cues; die konkrete Ausführung kommt daher aus der praktischen Einschulung.'],
    ['Grundregeln · S. 29', 'Atmung beachten, dem Körpergefühl folgen, nicht über die angenehme Grenze gehen und nie ohne Aufwärmen dehnen.'],
  ], outlineExtraTitle: 'Assisted Stretching · Dosierung und Umgang', outlineExtra: [
    ['Eigenständige Entspannungseinheit · S. 31–35', '30-Minuten-Session; pro Muskel 2 × 15 Sekunden bei 7 RPE.'],
    ['Ausklang nach einem Training · S. 31–35', '10–15-Minuten-Session; pro Muskel 1 × 10–15 Sekunden bei 7 RPE.'],
    ['Session-Check · S. 32–35', 'ROM testen, angenehme Atmosphäre schaffen, Handtuch nutzen, Gelenke und Becken neutral halten, Feedback einholen und passende Übungen individuell auswählen.'],
    ['Trainer:innen-Praxis · S. 32–35', 'Eigene Körperhaltung und fließende Übergänge beachten. Berührung nur nach ausdrücklicher Zustimmung; verbales Feedback offen halten.'],
    ['Vorbereitende Gegenbewegungen · S. 41', 'Das Skript zeigt Bewegungen entgegen der eigentlichen Bewegungsrichtung als vorbereitenden Baustein. Es kennzeichnet dies als Kursmethode; eine allgemeine physiologische Wirkung wird daraus nicht abgeleitet.'],
  ] },
  { name: 'Faszientraining · SMR', duration: 'Im Stundenentwurf festlegen', icon: HeartPulse, focus: 'Körperwahrnehmung und Bewegungsrichtungen in faszialen Ketten erkunden', practice: 'Das Assisted-Stretching-Skript stellt Self Myofascial Release (SMR) als verbreitete Form des Faszientrainings vor. In der Praxisnotiz werden Vordehnen, veränderte Winkel und Druck sowie die Rückkehr aus mehreren Bewegungsrichtungen in die Ausgangsposition genannt.', adapt: 'Das PDF enthält nur eine knappe Praxisübersicht, kein vollständiges Übungsprogramm. Konkrete Übungen deshalb praktisch erlernen und individuell auswählen; keine therapeutische Wirkung versprechen oder Beschwerden behandeln.', source: 'FlexyFit Academy: Assisted Stretching, S. 36–40', outlineTitle: 'Praxisideen aus dem Skript', outline: [
    ['SMR · Self Myofascial Release', 'Das Skript nennt Wahrnehmung, Gleitfähigkeit und Hydration als Lernziele des Abschnitts; dies sind Kursinhalte, keine Wirkungszusage der App.'],
    ['Bewegungsrichtungen', 'Aus einer Ausgangsposition in verschiedene Richtungen arbeiten und jeweils wieder kontrolliert zur Ausgangsposition zurückkehren.'],
    ['Winkel und Druck', 'In den praktischen Übungen Winkel und Druck variieren; die konkrete Ausführung und Dosierung aus der praktischen Einschulung übernehmen.'],
    ['Myofasziale Ketten', 'Der Kursabschnitt regt an, mehrere verbundene Bereiche in die Bewegung einzubeziehen und vorbereitende Gegenbewegungen zu nutzen.'],
  ] },
  { name: 'Entspannungsorientierte Ausdauer', duration: 'Je nach Sportart ca. 20–45 Min.', icon: HeartPulse, focus: 'Rhythmische, moderate Bewegung ohne Leistungsdruck nutzen', practice: 'Das Skript bevorzugt für den Entspannungskontext eine extensive, gleichmäßige Belastung. Atmung ruhig und reguliert halten; lockeres Sprechen sollte möglich sein. Sportart individuell wählen, Zeitdruck und Leistungsfokus weglassen und angenehm passende Reize wie Natur oder soziale Bewegung einbeziehen.', adapt: 'Dauer, Häufigkeit und Sportart im PDF sind Kursangaben bzw. Beispiele, keine individuelle Trainingsverordnung. Belastung an Person und Trainingszustand anpassen; bei Beschwerden abbrechen und fachliche Abklärung empfehlen.', source: 'FlexyFit Academy: Entspannung & Ausdauer, S. 4–26', outlineTitle: 'Ausdauer im Kurskontext · Umsetzung', outline: [
    ['Belastungsgefühl · S. 20–21', 'Moderat und gleichmäßig; das Skript nennt ruhige Atmung, lockeres Sprechen, leichtes Schwitzen und den Bereich RECOM-GA1. Flow wird als mögliches Erleben genannt, nicht als erwartbares Ergebnis. Leistungsfähigkeit soll nicht im Vordergrund stehen.'],
    ['Kursrichtwerte · S. 21', 'Das Skript nennt ungefähr 30 Minuten je nach Trainingszustand und 2–3 Einheiten pro Woche als Größenordnung für relevante Veränderungen. Das sind Kursangaben, keine persönliche Verordnung.'],
    ['Beispiele und Dauern · S. 21', 'Joggen 20–30 Minuten; Walking oder Radfahren 30–45; Schwimmen oder Rudern etwa 30; Skilanglauf 30–45. Sportart und Dauer nach Person und Erleben wählen.'],
    ['Alltagsbezug · S. 22', 'Ohne Zeitdruck, möglichst ruhig und mit angenehmen Sinnesreizen üben; Natur, Alleinsein oder Gruppe erwägen und Bewegung nach Möglichkeit in Alltagswege integrieren.'],
  ], outlineExtraTitle: 'Weitere Kurskapitel · Wirkungsfelder und praktische Ideen', outlineExtra: [
    ['Allgemeine Einsatzfelder · S. 4–9', 'Das Skript ordnet Ausdauertraining den Feldern Prävention, Leistungsfähigkeit, Gewichtsmanagement, Rehabilitation und Lebensgefühl zu. Das sind Themen des Lehrskripts, keine Zusage individueller Ergebnisse.'],
    ['Spezielle Wirkfelder · S. 11–18', 'Das Skript behandelt Sport als „Stressventil“ und führt kurzfristige sowie langfristige körperliche und psychische Wirkannahmen auf, darunter Botenstoffe, Vagotonus und Herz-Kreislauf-Themen. Die App macht daraus keine individuelle Wirkungs- oder Gesundheitszusage.'],
    ['Ohne Zeitdruck und im Alltag · S. 23', 'Das Skript empfiehlt angenehme Naturreize, eine ruhige Umgebung, regelmäßige Zeit ohne Zeitdruck sowie die Wahl zwischen Allein- und Gruppentraining. Es nennt auch den Arbeitsweg als mögliche Alltagsbewegung.'],
    ['Laufen und Bergsport · S. 24', 'Beispiele sind Barfußlaufen auf unterschiedlichen Untergründen, Trailrunning, Wandern, Klettern und Skitouren. Das Skript beschreibt Naturwahrnehmung und Konzentration als mögliche Kursaspekte; die Sportarten sind individuelle Beispiele, keine Vorgabe.'],
    ['Wasser und Mannschaftssport · S. 25', 'Schwimmen und Rudern werden mit dem Erleben des Wassers verbunden. Mannschaftssport kann soziale Bedürfnisse aufgreifen und spielerische Belastungswechsel ermöglichen; die Folie nennt Anerkennung und Zugehörigkeit als soziale Aspekte.'],
    ['Naturerlebniswege und Bewegungsparks · S. 26', 'Waldlehrpfade, Naturerlebniswanderwege und Bewegungsparks stehen als Beispiele für vielseitige Sinnes- und Bewegungserfahrungen in der Natur.'],
  ] },
  { name: 'Körperwahrnehmung & Wirbelsäule', duration: 'Kursblock nach Stundenentwurf', icon: Wind, focus: 'Körperteile, Atemräume und Bewegungsmöglichkeiten bewusst wahrnehmen', practice: 'Das Skript enthält Wahrnehmungsübungen zu Körperteilen, zur Verbindung von Armen, Beinen und Wirbelsäule, zu Wirbelsäulenbewegungen und Atemräumen sowie zur Fuß- und Standwahrnehmung. Es schließt mit spielerischen und kreativen Bewegungsformen für Bewegungsfreude.', adapt: 'Die Inhalte dienen dem Kennenlernen und Erleben, nicht der Diagnose oder Behandlung von Beschwerden. Bewegungen bleiben freiwillig und im angenehmen Bereich; taktile Partnerübungen nur mit ausdrücklicher Zustimmung. Die genaue Übungsausführung praktisch aus dem Kurs lernen.', source: 'FlexyFit Academy: Entspannung & Wirbelsäule, S. 24–39', outlineTitle: 'Wahrnehmungs- und Praxisfelder im Skript', outline: [
    ['Körperteile kennenlernen · S. 27', 'Rücken, Becken, Brustkorb und Schultergürtel ertasten und anatomische Begriffe anhand einer Erklärung, eines Skeletts oder Plakats einordnen.'],
    ['Arme, Beine und Wirbelsäule verbinden · S. 28', 'In Rückenlage Bewegungen der Beine oder Arme mit der wahrgenommenen Veränderung von Becken, Wirbelsäule und Brustkorb verbinden.'],
    ['Wirbelsäulenbewegungen · S. 29–30', 'Beugung, Streckung, Seitneigung und Rotation als unterschiedliche Bewegungsmöglichkeiten erkunden; das Skript behandelt Kopf- und Rumpfbewegung.'],
    ['Atemräume · S. 31', 'Atembewegung im Bauch, an den Rippen und in den Flanken wahrnehmen.'],
    ['Stand und Fuß · S. 33–34', 'Fußkontakt, Gewichtsverteilung und Stand beobachten; das Skript ergänzt dazu eine optionale Fußmassage.'],
    ['Beckenuhr · S. 35–36', 'In Rückenlage mit angewinkelten Beinen das Becken zwischen „12“ und „6“, anschließend zwischen seitlichen Zahlen bewegen und zum Schluss langsam kreisen lassen. Atemverbindung ist im Kursskript als Möglichkeit genannt.'],
    ['Bewegungsfreude: Ziel und Motivation · S. 37–38', 'Das Skript betont Spaß, zwanglose Gruppenerfahrung und vielfältige Körper- und Bewegungserfahrungen als Eigenanreiz, Aktivitäten dauerhaft fortzuführen. Der Nutzen wird als Kursziel beschrieben, nicht für Einzelne garantiert.'],
    ['Bewegungsfreude: Methoden und Inhalte · S. 39', 'Kennenlern- und Kooperationsspiele, sensitive und kreative Formen, Handgeräte, Musik, Bewegung im Freien, Walking/Jogging sowie einfache Entspannungsverfahren. Die Stunde soll motivierend und vielseitig gestaltet werden; Gespräche über Erfahrungen und Selbstbeobachtung gehören dazu.'],
  ], outlineExtraTitle: 'Partnerübungen aus dem Kursskript · nur freiwillig und mit Zustimmung', outlineExtra: [
    ['Wohlfühlkreis · S. 25–26', 'Das Skript beschreibt eine Partnerübung zur Rückenwahrnehmung und zum Wiedererkennen über Bewegung und Berührung; es nennt geschlossene Augen für den Innenkreis, ruhige Musik und frische Kleidung. Vor jeder Berührung Zustimmung einholen; eine berührungsfreie Variante oder das Aussetzen muss gleichwertig möglich sein.'],
    ['Druckpunkte · S. 32', 'Eine Person berührt den Rücken der anderen mit einer wechselnden Anzahl Fingerspitzen; die liegende, sitzende oder stehende Person nimmt die Berührung wahr und benennt die Anzahl. Nur mit ausdrücklicher Zustimmung, ohne diagnostische Auswertung oder Druck auf schmerzhafte Bereiche.'],
  ] },
  { name: 'Meditation · kognitive Ebene', duration: '15–30 Min. · lokaler Kursrichtwert', durationSource: 'Lokale Kursnotiz „00_Entspannungs-Protokoll-MINIMAL.md“; das Stresstheorie-Skript ordnet Meditation ein, liefert aber keine Schrittfolge.', icon: Sparkles, focus: 'Aufmerksamkeit freundlich im gegenwärtigen Erleben halten', practice: 'Das Stresstheorie-Skript ordnet Meditation der kognitiven Ebene zu und nennt meditative Verfahren als präventive Methode. Es führt außerdem Zen, Benson-Meditation, CSM und achtsamkeitsbasierte Stressreduktion als unterstützende Maßnahmen auf. Ein einfacher Anker wie Atem, Geräusche oder Bodenkontakt ist eine allgemeine App-Ergänzung, keine Schrittfolge aus dem Kursskript.', adapt: 'Augen offen, Bewegung oder ein äußerer Anker sind gleichwertige Optionen. Bei Unwohlsein Übung anpassen oder beenden.', source: 'FlexyFit Academy: Stresstheorie, S. 55–58 · Einordnung, keine Schrittfolge' },
  { name: 'Weitere unterstützende Verfahren', duration: 'Im Stundenentwurf festlegen', icon: Sparkles, focus: 'Weitere Beispiele aus der Kursübersicht einordnen', practice: 'Die Stresstheorie zählt Tai-Chi, Qigong und Feldenkrais als unterstützende Maßnahmen auf; Zen, Benson-Meditation, CSM und achtsamkeitsbasierte Stressreduktion sind bei der Meditationskarte aufgeführt. Für diese Verfahren liefert das Entspannungsarchiv hier keine eigenen Schrittfolgen. Bei Planung oder Protokoll die konkret durchgeführte Praxis im Beschreibungsfeld benennen.', adapt: 'Die Liste ist eine Kursübersicht, keine Anleitung oder individuelle Empfehlung. Praxis nur auf Grundlage tatsächlicher Einschulung auswählen; keine spezifische Wirkung aus der bloßen Nennung ableiten.', source: 'FlexyFit Academy: Stresstheorie, S. 58 · Überblick, keine Schrittfolge', outlineTitle: 'Unterstützende Maßnahmen im Skript', outline: [
    ['Aufzählung · S. 58', 'Tai-Chi, Qigong, Yoga, Zen, Benson-Meditation, CSM, achtsamkeitsbasierte Stressreduktion und Feldenkrais (im Skript „Feldenkreis“). Yoga und Meditation haben in der Methodenliste eigene Karten; für die übrigen Verfahren enthält das Kursarchiv hier keine konkrete Praxisanleitung.'],
  ] },
]

const PMR_STEPS = [
  ['Rechte Hand', 'Rechte Hand sanft zur Faust schließen. Kurz wahrnehmen, dann beim Ausatmen lösen und nachspüren.'],
  ['Rechter Arm', 'Rechten Arm leicht anwinkeln und angenehm anspannen. Kurz halten, lösen und den Unterschied wahrnehmen.'],
  ['Linke Hand', 'Linke Hand sanft zur Faust schließen. Lösen und nachspüren.'],
  ['Linker Arm', 'Linken Arm leicht anwinkeln. Kurz anspannen, lösen und nachspüren.'],
  ['Stirn', 'Augenbrauen leicht nach oben ziehen. Spannung kurz wahrnehmen, dann lösen.'],
  ['Augen', 'Augen sanft zusammendrücken, ohne zu pressen. Lösen und nachspüren.'],
  ['Kiefer', 'Zähne leicht aufeinander bringen. Dann den Kiefer lockern.'],
  ['Zunge', 'Zunge sanft an den Gaumen legen. Lösen und nachspüren.'],
  ['Kopf', 'Kinn vorsichtig in Richtung Brust bewegen. Nur im angenehmen Bereich; lösen.'],
  ['Schultern', 'Schultern sanft zu den Ohren ziehen. Kurz halten, fallen lassen und nachspüren.'],
  ['Bauch', 'Bauchdecke leicht anspannen, ohne die Luft anzuhalten. Lösen.'],
  ['Rücken', 'Bauch vorsichtig nach vorne schieben und ein kleines Hohlkreuz bilden. Lösen.'],
  ['Gesäß', 'Gesäßmuskeln sanft anspannen. Dann vollständig lösen.'],
  ['Rechter Fuß', 'Rechten Fuß leicht nach vorne beugen. Spannung wahrnehmen und lösen.'],
  ['Rechte Wade', 'Rechte Fußspitze sanft zum Körper ziehen. Lösen und nachspüren.'],
  ['Rechter Oberschenkel', 'Rechten Oberschenkel leicht anspannen. Lösen.'],
  ['Linker Fuß', 'Linken Fuß leicht nach vorne beugen. Spannung wahrnehmen und lösen.'],
  ['Linke Wade', 'Linke Fußspitze sanft zum Körper ziehen. Lösen und nachspüren.'],
  ['Linker Oberschenkel', 'Linken Oberschenkel leicht anspannen. Lösen und nachspüren.'],
  ['Rückkehr', 'Bewege langsam Hände und Füße, strecke und räkle dich nach Bedarf. Atme frei, orientiere dich im Raum und öffne die Augen, wenn du soweit bist.'],
]

const DEFAULT_BLOCKS = [
  { id: 'ankommen', name: 'Einleitung & Befinden', minutes: 5, detail: 'Begrüßung, Ziel und organisatorische Hinweise; Befinden erfragen und neue Teilnehmende willkommen heißen. Ein wiederkehrendes Anfangsritual lädt dazu ein, sich bewusst für die Übung zu entscheiden, eine passende Entspannungsposition einzunehmen und die Aufmerksamkeit nach innen zu richten. Augen schließen bleibt optional.' },
  { id: 'einstimmung', name: 'Einstimmung & Übungseinschulung', minutes: 8, detail: 'Methode und Herkunft kurz vorstellen, Position finden, erklären, demonstrieren und ausprobieren.' },
  { id: 'hauptteil', name: 'Hauptteil', minutes: 35, detail: 'Ausgewählte Übungen methodisch sinnvoll aufbauen und so dosieren, dass die Gruppe entspannt folgen kann.' },
  { id: 'ruhe', name: 'Ruhe & Nachspüren', minutes: 5, detail: 'Den individuellen Entspannungszustand kurz in Ruhe oder mit zarter Musik nachspüren lassen.' },
  { id: 'ruecknahme', name: 'Rücknahme, Gespräch & Abschluss', minutes: 7, detail: 'Mit einem wiederkehrenden Ritual gefühlvoll zurückholen, Erleben und Feedback besprechen, verabschieden und auf die nächste Stunde hinweisen.' },
]
const PREPARATION_CHECKS = [
  ['trainer', 'Ich kann Ruhe und Gelassenheit vermitteln und das Kurskonzept verständlich vertreten.'],
  ['team', 'Kurskonzept und Angebot sind mit der Einrichtung bzw. den Mitarbeitenden abgestimmt.'],
  ['ziel', 'Stundenziel und Schwerpunkt sind klar.'],
  ['raum', 'Ruhiger Raum, angenehmes Licht, Lüftung und Temperatur sind vorbereitet; laute Gespräche, Musik im Vorraum und unerwartetes Betreten während der Einheit sind geklärt.'],
  ['material', 'Matten, Decken, warme Kleidung sowie optionale Knie- und Kopfpolster sind verfügbar.'],
  ['musik', 'Musik ist optional und kann ablenken; falls eingesetzt, langsame Instrumentalmusik ohne Textstimme oder Naturgeräusche leiser als die Anleitung wählen.'],
  ['gruppe', 'Der Kurs nennt 5–12 Personen als Richtwert. Größere Gruppen brauchen eine erfahrene Kursleitung und passende räumliche Bedingungen.'],
  ['platz', 'Teilnehmende können Matten und Abstand so wählen, dass ihr persönlicher Raum gewahrt bleibt.'],
  ['freiwilligkeit', 'Schuhe, Brille, Uhr oder Schmuck dürfen auf Hinweis abgelegt werden; niemand wird dazu gedrängt.'],
  ['beginn', 'Gemeinsamer Beginn und gemeinsames Ende sind vereinbart; Verspätungen und Störungen sind bedacht.'],
  ['rueckkehr', 'Genügend Zeit für Rücknahme, Abschlussgespräch und Verabschiedung ist eingeplant.'],
]
const LEARNING_CHECK = [
  {
    question: 'Worauf liegt der Schwerpunkt beim Einschulen einer Übung?',
    answers: ['Auf einer für alle identischen Bewegungsausführung.', 'Auf Körperwahrnehmung und einer passenden Ausführung für die einzelne Person.', 'Auf möglichst vielen Wiederholungen ohne Unterbrechung.'],
    correct: 1,
    why: 'Die Stundenplanung stellt Körper- und Bewegungsempfinden in den Mittelpunkt; Leistungsdenken und Vergleiche sollen vermieden werden.',
    source: 'Stundenplanung · Übungseinschulung',
  },
  {
    question: 'Wie sollte Musik in einer Entspannungseinheit eingesetzt werden?',
    answers: ['Immer, damit niemand Geräusche aus dem Raum wahrnimmt.', 'Optional; ruhige Instrumentalmusik kann helfen, darf die Anleitung aber nicht übertönen oder ablenken.', 'So laut, dass sie die Stimme vollständig ersetzt.'],
    correct: 1,
    why: 'Die Notiz sagt, Musik kann helfen, muss aber nicht eingesetzt werden. Sie soll ruhig und leiser als die Stimme sein.',
    source: 'Stundenplanung · Musik',
  },
  {
    question: 'Was ist bei Gruppengröße und Platz laut Stundenplanung wichtig?',
    answers: ['5–12 Personen sind ein Richtwert; Mattenabstand und persönlicher Raum sollen zur Gruppe passen.', 'Alle legen die Matten eng zusammen, damit die Gruppe synchron bleibt.', 'Die Gruppengröße spielt keine Rolle, wenn Musik läuft.'],
    correct: 0,
    why: 'Das Skript nennt 5–12 Personen als optimale Gruppengröße und betont persönlichen Raum sowie selbst gewählten Mattenabstand.',
    source: 'Stundenplanung · Gruppengröße und Platz',
  },
  {
    question: 'Was bestimmt laut Flexibilitätstraining die Wahl der Dehnmethode?',
    answers: ['Das Ziel des Trainings.', 'Für alle Teilnehmenden dieselbe Methode.', 'Ausschließlich die Dauer der Musik.'],
    correct: 0,
    why: 'Das Skript hält fest: Das Ziel entscheidet über die Methode. Es stellt dazu verschiedene aktive/passive sowie statische/dynamische Formen vor.',
    source: 'Assisted Stretching · Flexibilitätstraining, S. 12–15',
  },
  {
    question: 'Welche Assisted-Stretching-Dosierung unterscheidet das Kursskript?',
    answers: ['Eigene Entspannungseinheit: 30 Minuten mit 2 × 15 Sekunden je Muskel; Ausklang: 10–15 Minuten mit 1 × 10–15 Sekunden.', 'Für beide Varianten immer 60 Minuten mit maximaler Dehnung.', 'Eine feste Wiederholungszahl, unabhängig davon, ob es eine eigene Einheit oder ein Trainingsausklang ist.'],
    correct: 0,
    why: 'Das Assisted-Stretching-Skript nennt unterschiedliche Dauer und Wiederholungen für die eigenständige Einheit und den Ausklang nach einem Training.',
    source: 'Assisted Stretching · Dosierung',
  },
  {
    question: 'Welche Praxiselemente nennt das Skript für Faszientraining?',
    answers: ['Vordehnen, Winkel und Druck variieren und aus unterschiedlichen Richtungen zur Ausgangsposition zurückkehren.', 'Eine Bewegungsrichtung ohne Rückkehr und unabhängig vom Körpergefühl wiederholen.', 'Nur lange statische Dehnungen ohne Variation ausführen.'],
    correct: 0,
    why: 'Der kurze Praxisabschnitt nennt Vordehnen, Variation von Winkel und Druck, myofasziale Ketten und die Rückkehr aus jeder Dehnrichtung zur Ausgangsposition.',
    source: 'Assisted Stretching · Faszientraining',
  },
  {
    question: 'Wie beschreibt das Skript ein entspannungsorientiertes Ausdauertraining?',
    answers: ['Gleichmäßig und moderat, individuell gewählt und ohne Leistungsdruck; ruhig atmen und locker sprechen können.', 'So intensiv wie möglich, damit die Leistung im Mittelpunkt steht.', 'Für alle Personen mit identischer Sportart und Dauer.'],
    correct: 0,
    why: 'Das Skript empfiehlt für den Entspannungskontext eine extensive gleichmäßige Belastung, lockeres Sprechen, individuelle Sportwahl und keinen Leistungsfokus.',
    source: 'Entspannung & Ausdauer · Trainingsmethodische Grundlagen',
  },
  {
    question: 'Welche Wahrnehmungsfelder enthält das Skript „Entspannung & Wirbelsäule“?',
    answers: ['Körperteile, Bewegungsmöglichkeiten der Wirbelsäule, Atemräume sowie Fuß- und Standwahrnehmung.', 'Nur Krafttests und Schmerzdiagnostik.', 'Ausschließlich Atemrhythmen mit festen Atempausen.'],
    correct: 0,
    why: 'Das Skript führt mehrere Körper- und Atemwahrnehmungsübungen sowie Bewegungsfreude als Praxisfelder auf.',
    source: 'Entspannung & Wirbelsäule · Wahrnehmungs- und Entspannungstechniken',
  },
  {
    question: 'Was gehört nach einer tiefen Entspannung in Rückenlage zum Abschluss?',
    answers: ['Sofort aufstehen, damit der Kreislauf aktiviert wird.', 'Eine ruhige Rücknahme mit kleinen Bewegungen, Orientierung und Zeit zum Nachspüren.', 'Direkt mit einer intensiven Belastung fortfahren.'],
    correct: 1,
    why: 'Nach AT, PMR und Phantasiereisen empfiehlt die Stundenplanung eine ausreichend lange, schrittweise Rücknahme und ein Abschlussgespräch.',
    source: 'Stundenplanung · Rücknahme und Abschluss',
  },
  {
    question: 'Wie viel Entspannungszeit wird in Kombination mit anderen Trainingsformen eingeplant?',
    answers: ['Rund 15 Minuten für den Entspannungsteil; ein geschlossener Kurs kann etwa 60 Minuten dauern.', 'Immer genau 60 Minuten zusätzlich zum Haupttraining.', 'Es gibt keinen zeitlichen Rahmen.'],
    correct: 0,
    why: 'Die beiden Angaben beziehen sich auf unterschiedliche Formate: Entspannungsteil in einer kombinierten Stunde und geschlossener Entspannungskurs.',
    source: 'Stundenplanung · Zeitlicher Rahmen',
  },
  {
    question: 'Welchen Puls nennt die Stundenplanung als Richtwert zu Beginn des Entspannungsteils nach anderem Training?',
    answers: ['Unter 120 Schlägen pro Minute.', 'Mindestens 150 Schläge pro Minute.', 'Der Puls soll währenddessen nicht beachtet werden.'],
    correct: 0,
    why: 'Das Skript nennt für die Kombination mit anderen Trainingsformen etwa 15 Minuten Entspannung und einen Puls unter 120 zu Beginn des Entspannungsteils. Das ist eine Kursangabe, keine individuelle Gesundheitsfreigabe.',
    source: 'Stundenplanung · Zeitlicher Rahmen, S. 10',
  },
  {
    question: 'Was beschreibt Lazarus’ transaktionales Stressmodell?',
    answers: ['Stress wird ausschließlich durch die Stärke des äußeren Reizes bestimmt.', 'Bewertung einer Anforderung und Einschätzung eigener Bewältigungsressourcen beeinflussen das Stresserleben.', 'Stress folgt bei allen Menschen einem identischen zeitlichen Ablauf.'],
    correct: 1,
    why: 'Die Ausbildungsnotiz beschreibt primäre und sekundäre Bewertung sowie das Verhältnis von Anforderungen und verfügbaren Ressourcen.',
    source: 'Stresstheorie · Transaktionales Modell',
  },
  {
    question: 'Welche Zuordnung nennt das SORK-Schema auf der Schemafolie?',
    answers: ['S = Stressoren, O = Organismus, R = Stressreaktionen und K = Konsequenzen.', 'S = Situation, O = Orientierung, R = Reiz und K = Körper.', 'S = Stress, O = Output, R = Regulation und K = Kraft.'],
    correct: 0,
    why: 'Die Schemafolie ordnet S, O, R und K so zu. Coping (C) erscheint später als Ansatz zur Stressbewältigung; das Skript bezeichnet den Konsequenzen-Abschnitt zugleich als „K und C“, wodurch seine Notation an dieser Stelle uneindeutig ist.',
    source: 'Stresstheorie · SORK-Schema S. 32; Konsequenzen und Coping S. 40–44',
  },
  {
    question: 'Welche Einschränkung nennt das Skript zur Life-Change-Units-Skala?',
    answers: ['Sie bildet das subjektive Stressempfinden nicht ab.', 'Sie misst direkt den Cortisolwert im Speichel.', 'Sie erfasst ausschließlich die Herzfrequenzvariabilität.'],
    correct: 0,
    why: 'Das Skript nennt LCU nach Holmes und Rahe als Skala lebensverändernder Ereignisse und weist darauf hin, dass sie das subjektive Stressempfinden nicht berücksichtigt.',
    source: 'Stresstheorie · Messbarkeit von Stress, S. 46',
  },
  {
    question: 'Welche unterstützenden Maßnahmen nennt die Stresstheorie?',
    answers: ['Tai-Chi, Qigong, Yoga, Zen, verschiedene Meditationsformen und Feldenkrais.', 'Ausschließlich Krafttraining und Nahrungsergänzung.', 'Nur Biofeedback und Atemanhalten.'],
    correct: 0,
    why: 'Die Übersicht auf S. 58 nennt Tai-Chi, Qigong, Yoga, Zen, Benson-Meditation, CSM, achtsamkeitsbasierte Stressreduktion und Feldenkrais (im Skript: „Feldenkreis“).',
    source: 'Stresstheorie · Unterstützende Maßnahmen, S. 58',
  },
  {
    question: 'Wie ordnet die Stresstheorie Entspannungsverfahren den Ebenen zu?',
    answers: ['Autogenes Training vegetativ, Fantasiereisen und suggestive Musik emotional, Meditation kognitiv.', 'Autogenes Training emotional, Fantasiereisen kognitiv, Meditation muskulär.', 'Alle Verfahren gehören zur muskulären Ebene.'],
    correct: 0,
    why: 'Das Skript unterscheidet muskuläre, vegetative, emotionale und kognitive Ebenen und ordnet jeder Beispiele zu. Die lokale Master-MOC nennt AT abweichend im Abschnitt „muskuläre Ebene“; hier gilt die Zuordnung der Original-PDF-Folie.',
    source: 'Stresstheorie · Entspannungstechniken',
  },
  {
    question: 'Welche Verfahren nennt die Stresstheorie auf der muskulären Ebene?',
    answers: ['Konzentrative Muskelentspannung, Progressive Muskelentspannung und muskuläres Tiefentraining.', 'Autogenes Training, Atemtechniken und Meditation.', 'Fantasiereisen, suggestive Musik und Yoga.'],
    correct: 0,
    why: 'Die Liste auf S. 55 nennt die drei Verfahren als Beispiele für die muskuläre Ebene. Sie liefert für die zwei nicht anderweitig ausgearbeiteten Verfahren hier keine eigene Schrittfolge.',
    source: 'Stresstheorie · Entspannungstechniken, S. 55',
  },
  {
    question: 'Welche Verfahren nennt das Stresstheorie-Skript im Abschnitt „Soforthilfe“?',
    answers: ['Autogenes Training, Progressive Muskelrelaxation und Selbsthypnose.', 'Suggestive Musik, Yoga und Feldenkrais.', 'Nur Meditation und Atemtechniken.'],
    correct: 0,
    why: 'Die Übersicht auf S. 52 nennt AT, PMR und Selbsthypnose als Verfahren der Soforthilfe. Für Selbsthypnose enthält das geprüfte Archiv jedoch keine konkrete Anleitung.',
    source: 'Stresstheorie · Soforthilfe, S. 52',
  },
  {
    question: 'Was sagt das Ernährungsskript über einzelne Lebensmittel und Stress?',
    answers: ['Kein bestimmtes Lebensmittel reduziert Stress direkt; eine ausgewogene, alltagstaugliche Ernährung ist der passende Rahmen.', 'Ein einzelnes „Brain Food“ wirkt zuverlässig gegen Stress und ersetzt Erholung.', 'Power Food senkt bei allen Menschen nachweislich Stresshormone.'],
    correct: 0,
    why: 'Die Unterlage sagt ausdrücklich, dass kein bestimmtes Lebensmittel Stress direkt reduziert (S. 27); Lebensmittelbeispiele und Wirkbehauptungen werden als Kursinhalte eingeordnet.',
    source: 'Entspannung und Ernährung · S. 27, 53–55',
  },
  {
    question: 'Welche Aussage zu Nahrungsergänzung gibt das Ernährungsskript wieder?',
    answers: ['Bei gesunden Menschen mit ausgewogener Ernährung sind Supplemente laut Skript in der Regel nicht erforderlich.', 'Alle Personen mit Stress sollten vorsorglich mehrere Supplemente einnehmen.', 'Trainer:innen sollen passende Dosierungen anhand des Stressempfindens festlegen.'],
    correct: 0,
    why: 'Das Skript sagt, dass Nahrungsergänzung bei gesunden Menschen mit ausgewogener Ernährung in der Regel nicht erforderlich ist (S. 85–86). Die App leitet daraus keine individuelle Verordnung ab.',
    source: 'Entspannung und Ernährung · S. 85–89',
  },
  {
    question: 'Wie sollen Trainer:innen die Begriffe „Stress-Esser“ und „Stress-Hungerer“ einordnen?',
    answers: ['Als feste Personentypen, aus denen sich der Gesundheitszustand ableiten lässt.', 'Als vereinfachte Beschreibungen aus dem Skript; sie erlauben weder eine Diagnose noch eine pauschale Bewertung des Gesundheitszustands.', 'Als Hinweis, dass Stress-Essen grundsätzlich unnormal ist und mit mehr Selbstdisziplin beendet werden muss.'],
    correct: 1,
    why: 'Das Skript warnt davor, den Gesundheitszustand aus den Mustern abzuleiten und Stress-Essen als unnormal zu bewerten. Ermahnungen zu mehr Selbstdisziplin können laut S. 24 zusätzlichen Stress auslösen.',
    source: 'Entspannung und Ernährung · S. 19–24',
  },
  {
    question: 'Welches Essmuster berichtet die im Skript beschriebene Studie?',
    answers: ['Das Essverhalten kann sich zwischen belastenden und positiven Situationen umkehren; die Studie beschreibt ein mögliches Kompensationsmuster.', 'Stress-Esser essen in jeder Situation mehr als Stress-Hungerer.', 'Die Studie zeigt, dass Essverhalten unabhängig von Situation und Stimmung immer gleich bleibt.'],
    correct: 0,
    why: 'In der beschriebenen Untersuchung aßen Stress-Hungerer in der positiven Situation mehr als die Stress-Esser; das Skript fasst dies als Kompensationsmuster auf (S. 20–23). Es ist ein Studienbericht und keine feste Regel für einzelne Personen.',
    source: 'Entspannung und Ernährung · S. 20–23',
  },
  {
    question: 'Was ist bei den Yoga-Haltungen laut Ausbildungsskript wichtig?',
    answers: ['Eine Haltung nur so weit ausführen, dass sie angenehm bleibt; Varianten und praktische Einschulung berücksichtigen.', 'Jede Haltung vollständig erreichen, auch wenn sie unangenehm ist.', 'Alle Teilnehmenden müssen dieselbe Variante und Tiefe halten.'],
    correct: 0,
    why: 'Das Yoga-Skript betont angenehme Ausführung, Varianten und praktische Aufsicht. Eine Pose muss nicht erzwungen oder vollständig erreicht werden.',
    source: 'Grundübungen Yoga · Einleitung und Asana-Grundsätze, S. 3–8',
  },
  {
    question: 'Wie ist die Pilates-Übungssammlung im Originalskript gegliedert?',
    answers: ['In acht Bewegungskategorien, darunter Rückenlage, Seitlage, Sitz, Bauchlage, Gewichtsübernahme, Ganzkörperintegration, Umkehrhaltungen und Stand.', 'Ausschließlich in Übungen für die Rückenlage.', 'Nach festen Leistungsstufen, die für alle Teilnehmenden gelten.'],
    correct: 0,
    why: 'Das Skript ordnet die Übungssammlung in acht Kategorien nach Ausgangsposition und Bewegungsorganisation ein; daraus folgt keine für alle gleiche Leistungsstufe.',
    source: 'Grundübungen Pilates · Basisprogramm, S. 17–21',
  },
  {
    question: 'Wie sind die fünf Tibeter im Kursmaterial eingeordnet?',
    answers: ['Als ergänzende Bewegungsreihe mit fünf Bewegungen, getrennt von der PMR-Anspannungsfolge.', 'Als fünf Muskelgruppen der PMR, die nacheinander angespannt werden.', 'Als Atemübung mit fünf festgelegten Atempausen.'],
    correct: 0,
    why: 'Das PMR-Kursskript führt Kreisel, Kerze, Halbmond, Brücke und Berg als ergänzenden Praxisteil auf; es handelt sich nicht um die PMR-Muskelgruppenfolge.',
    source: 'Progressive Muskelrelaxation · Die fünf Tibeter, S. 29–46',
  },
  {
    question: 'Welche Aussage zur PMR-Gruppenfolge gibt die App quellentreu wieder?',
    answers: ['Das Skript bezeichnet sie als „16 Schritte“, aber die nummerierten Listen stimmen nicht eindeutig überein; deshalb wird keine bereinigte Standardliste behauptet.', 'Das Skript enthält eine eindeutige und überall identische 20-Schritte-Liste.', 'Die Abfolge besteht laut Skript aus fünf Yoga-Haltungen.'],
    correct: 0,
    why: 'Die Kursunterlage überschreibt die Praxis mit „16 Schritte“, während Einzelpositionen und Kurzliste nicht deckungsgleich sind. Die App macht diese Quellenabweichung sichtbar.',
    source: 'Progressive Muskelrelaxation · Gruppenfolge, S. 23–25',
  },
  {
    question: 'Was lässt sich aus den Kursunterlagen zu Autogenem Training und Fantasiereisen sicher ableiten?',
    answers: ['Sie werden als Verfahren bzw. Kursmethoden eingeordnet und die Rücknahme wird behandelt; eine konkrete Übungsfolge liegt im geprüften Archiv nicht vor.', 'Die MOC-Themenliste liefert vollständige Formeln und eine verbindliche AT-Abfolge.', 'Die App kann aus der Methodennennung eine originale Fantasiereise ableiten.'],
    correct: 0,
    why: 'Die Stresstheorie und die MOC geben Themen und Einordnungen vor. Die geprüften Dateien enthalten jedoch keine methodenspezifische Schritt-für-Schritt-Anleitung; die App ergänzt deshalb keine als Original ausgegebene Folge.',
    source: 'Stresstheorie · S. 52, 55; Stundenplanung · S. 12; Kursquellen-MOC',
  },
  {
    question: 'Welche Aussage zur Mentaltraining-Themenliste ist durch die Ausbildungs-MOC belegt?',
    answers: ['Sie nennt Themen wie Visualisierung, Autosuggestion, Ankern und Zielsetzung, liefert dazu aber keine vollständige Schrittfolge.', 'Sie enthält einen vollständigen verbindlichen Ablauf für Visualisierungsübungen.', 'Sie belegt, dass jede genannte Technik bei allen Teilnehmenden dieselbe Wirkung hat.'],
    correct: 0,
    why: 'Die lokale MOC führt diese Begriffe als Themen des Kapitels auf. Im geprüften Kursarchiv liegt kein eigenständiges Mentaltraining-Anleitungsskript vor.',
    source: 'Lokale Ausbildungs-MOC · Mentales Training, Themenübersicht',
  },
  {
    question: 'Wie beschreibt das Skript Biofeedback und sein Lernziel?',
    answers: ['Ein Gerät gibt körpereigene Signale als Licht oder Ton zurück; Entspannung soll zunehmend unabhängig vom Gerät gelingen.', 'Ein einzelner Messwert stellt eine Diagnose und legt die richtige Entspannungsmethode fest.', 'Die App misst den Puls und bestätigt damit, dass eine Person entspannt ist.'],
    correct: 0,
    why: 'Auf S. 47 beschreibt das Skript die Rückmeldung über eine Apparatur und als Ziel eine größere Unabhängigkeit von der Technik. Die App selbst erhebt keine Körpersignale.',
    source: 'Stresstheorie · Biofeedback, S. 47',
  },
].map((question, index) => {
  const offset = index % question.answers.length
  return {
    ...question,
    answers: question.answers.map((_, choiceIndex) => question.answers[(choiceIndex + offset) % question.answers.length]),
    correct: (question.correct - offset + question.answers.length) % question.answers.length,
  }
})
const STORAGE_KEY = 'relax-training-plan-v1'
const CASE_STORAGE_KEY = 'relax-stress-case-v1'
const STRESS_REFLECTION_KEY = 'relax-stress-reflection-v1'
const DELIVERY_STORAGE_KEY = 'relax-training-delivery-v1'
const METHOD_REFLECTION_KEY = 'relax-method-reflections-v1'
const LEARNING_CHECK_KEY = 'relax-learning-check-v1'
const MODULE_BACKUP_FORMAT = 'relax-ausbildung-arbeitsstand'
const MODULE_BACKUP_KEYS = [STORAGE_KEY, CASE_STORAGE_KEY, DELIVERY_STORAGE_KEY, STRESS_REFLECTION_KEY, METHOD_REFLECTION_KEY, LEARNING_CHECK_KEY, TEACHING_SCRIPT_KEY, PRANAYAMA_ASSIGNMENT_KEY]
const METHOD_REFLECTION_FIELDS = [
  ['experience', 'Eigene Erfahrung', 'Was hast du bei der tatsächlich durchgeführten oder besuchten Methode wahrgenommen? Was war angenehm, ungewohnt oder offen?'],
  ['conditions', 'Hilfreiche Bedingungen und Anpassungen', 'Welche Rahmenbedingungen, Wahlmöglichkeiten oder Anpassungen haben deine Teilnahme unterstützt?'],
  ['teaching', 'Anleiten und erklären', 'Was kannst du über Ziel und Ablauf verständlich erklären oder demonstrieren? Wo brauchst du noch praktische Einschulung?'],
]
const METHOD_ORAL_PRACTICE_CHECKS = [
  ['canExplain', 'Ich kann Ziel, Kursbezug und Quellen-Grenzen der Methode mündlich erklären.'],
  ['canDemonstrate', 'Ich kann eine im Kurs praktisch gelernte Übungsfolge zeigen und erläutern.'],
  ['canAdapt', 'Ich kann Befinden erfragen, passende Wahlmöglichkeiten anbieten und meine Trainerrolle benennen.'],
]
const STRESS_REFLECTION_FIELDS = [
  { id: 'stressors', title: 'S · Stressoren und Bewertung', prompt: 'Welche konkrete Situation oder Anforderung möchtest du betrachten? Erlebst du sie eher als Herausforderung, Bedrohung oder Schaden/Verlust? Welche eigenen Bewältigungsmöglichkeiten nimmst du wahr?' },
  { id: 'organism', title: 'O · Persönliche Voraussetzungen', prompt: 'Welche Erfahrungen, Gewohnheiten, Überzeugungen, Fertigkeiten oder aktuellen Belastungen spielen für deine Einschätzung eine Rolle? Teile nur, was du festhalten möchtest.' },
  { id: 'reactions', title: 'R · Reaktionsmuster', prompt: 'Was bemerkst du bei dir auf körperlicher, emotionaler, gedanklicher oder verhaltensbezogener Ebene? Beschreibe Beobachtungen, ohne sie zu bewerten.' },
  { id: 'consequences', title: 'K · Folgen', prompt: 'Welche unmittelbaren oder späteren Folgen hat das Muster für dich und deinen Alltag? Was wird dadurch kurzfristig leichter oder schwieriger?' },
  { id: 'coping', title: 'C · Coping und Ressourcen', prompt: 'Welche vorhandene Ressource könntest du nutzen? Gibt es einen kleinen Ansatz: Stressor verringern, eigene Bewertung prüfen oder eine Erregungsspitze drosseln/vermeiden?' },
]
const panel = { background: 'var(--card)', borderColor: 'var(--line)' }
const input = { background: 'var(--bg2)', borderColor: 'var(--line)', color: 'var(--ink)' }

function emptyCasePlan() {
  return {
    title: '4-Wochen-Konzept bei Stress',
    goals: '',
    weeks: Array.from({ length: 4 }, (_, index) => ({ number: index + 1, focus: '', routine: '', relaxation: '', nutrition: '', weeklyCheck: { stress: '', sleep: '', digestion: '', routine: '' } })),
    minimalRoutine: '',
    dayCycle: { time: '', goal: '', sequence: '', duration: '', transition: '' },
    foodIdeas: '',
    brainFood: '',
    powerFood: '',
    soulFood: '',
    recipeIdeas: '',
    naturalProducts: '',
    supplementNotes: '',
    review: { method: '', continue: '' },
  }
}

function csvCell(value) { return `"${String(value ?? '').replaceAll('"', '""')}"` }
function normalizeModuleBackup(backup) {
  if (!backup || backup.format !== MODULE_BACKUP_FORMAT || !backup.data || typeof backup.data !== 'object' || Array.isArray(backup.data)) return null
  if (backup.version === 1) {
    const originalKeys = MODULE_BACKUP_KEYS.filter(key => key !== TEACHING_SCRIPT_KEY && key !== PRANAYAMA_ASSIGNMENT_KEY)
    if (Object.keys(backup.data).length !== originalKeys.length || originalKeys.some(key => !Object.hasOwn(backup.data, key))) return null
    backup = { ...backup, version: 2, data: { ...backup.data, [TEACHING_SCRIPT_KEY]: '', [PRANAYAMA_ASSIGNMENT_KEY]: null } }
  }
  if (backup.version !== 2) return null
  if (MODULE_BACKUP_KEYS.some(key => !Object.hasOwn(backup.data, key))) return null
  if (Object.keys(backup.data).some(key => !MODULE_BACKUP_KEYS.includes(key))) return null
  const { [STORAGE_KEY]: plan, [CASE_STORAGE_KEY]: casePlan, [DELIVERY_STORAGE_KEY]: delivery, [STRESS_REFLECTION_KEY]: stress, [METHOD_REFLECTION_KEY]: methods, [LEARNING_CHECK_KEY]: learning, [TEACHING_SCRIPT_KEY]: breathingScript, [PRANAYAMA_ASSIGNMENT_KEY]: pranayama } = backup.data
  const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value)
  const valid = isObject(plan) && typeof plan.title === 'string' && Array.isArray(plan.blocks)
    && isObject(casePlan) && Array.isArray(casePlan.weeks) && casePlan.weeks.length === 4 && isObject(casePlan.dayCycle)
    && (casePlan.minimalRoutine === undefined || typeof casePlan.minimalRoutine === 'string')
    && (casePlan.review === undefined || (isObject(casePlan.review) && ['method', 'continue'].every(key => typeof casePlan.review[key] === 'string')))
    && (delivery === null || (isObject(delivery) && Array.isArray(delivery.blocks) && delivery.blocks.length > 0 && Number.isInteger(delivery.index) && delivery.index >= 0 && delivery.index < delivery.blocks.length && Number.isFinite(delivery.remaining) && delivery.remaining >= 0 && typeof delivery.running === 'boolean' && (!delivery.running || Number.isFinite(delivery.endsAt))))
    && isObject(stress) && isObject(methods)
    && isObject(learning) && Number.isInteger(learning.index) && learning.index >= 0 && learning.index <= LEARNING_CHECK.length && Number.isInteger(learning.score) && learning.score >= 0 && learning.score <= LEARNING_CHECK.length
    && typeof breathingScript === 'string' && (pranayama === null || (isObject(pranayama) && typeof pranayama.technique === 'string' && ['script', 'rehearsal', 'groupPractice', 'feedback'].every(field => typeof pranayama[field] === 'string')))
  return valid ? backup : null
}
function restoreDelivery() {
  try {
    const saved = JSON.parse(localStorage.getItem(DELIVERY_STORAGE_KEY) || 'null')
    if (!saved || !Array.isArray(saved.blocks) || !saved.blocks.length || !Number.isInteger(saved.index) || saved.index < 0 || saved.index >= saved.blocks.length) return null
    if (!saved.running) {
      const remaining = Number(saved.remaining)
      return Number.isFinite(remaining) && remaining >= 0 ? { ...saved, remaining, running: false, endsAt: null } : null
    }
    const endsAt = Number(saved.endsAt)
    if (!Number.isFinite(endsAt)) return null
    const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))
    return { ...saved, remaining, running: remaining > 0, endsAt: remaining > 0 ? endsAt : null }
  } catch { return null }
}

const MODULE_SECTIONS = new Set(['start', 'grundlagen', 'selbstcheck', 'methoden', 'fallkonzept', 'planung', 'nachweis'])
function readTrainingRoute() {
  const [root, section = 'start', methodName = ''] = window.location.hash.slice(1).split('/')
  if (root !== 'ausbildung') return { section: 'start', method: null }
  const validSection = MODULE_SECTIONS.has(section) ? section : 'start'
  let decodedName = ''
  try { decodedName = decodeURIComponent(methodName) } catch {}
  const method = validSection === 'methoden' ? METHODS.find(item => item.name === decodedName) || null : null
  return { section: validSection, method }
}

function practiceDescription(item) {
  const technique = String(item.technique || '').trim()
  const note = String(item.note || '').trim()
  const label = technique || note || 'Entspannungseinheit'
  const duration = Number(item.minutes) > 0 ? ` (${item.minutes} min)` : ''
  return `${label}${duration}${technique && note ? ` — ${note}` : ''}`
}

function practiceCandidateKey(candidate) {
  return candidate.id != null
    ? `${candidate.date}:id:${candidate.id}`
    : `${candidate.date}:index:${candidate._sessionItemIndex}`
}

async function getCompleteRelaxSessionHistory() {
  const rows = []
  let before = null
  while (true) {
    const page = await getRelaxSessionHistory(365, before)
    rows.push(...(page || []))
    if (!page || page.length < 365) break
    const nextBefore = page[page.length - 1]?.date
    if (!nextBefore || nextBefore === before) break
    before = nextBefore
  }
  return rows
}

export default function Ausbildung({ onNavigate }) {
  const [{ section, method }, setRoute] = useState(readTrainingRoute)
  const [pmrStep, setPmrStep] = useState(null)
  const [methodQuery, setMethodQuery] = useState('')
  const [plan, setPlan] = useState(() => {
    const defaults = { title: 'Ruhig ankommen', focus: '', method: METHODS[0].name, blocks: DEFAULT_BLOCKS, checks: {}, reflection: '' }
    try { const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)); return stored ? { ...defaults, ...stored, checks: stored.checks || {}, reflection: stored.reflection || '' } : defaults }
    catch { return defaults }
  })
  const [casePlan, setCasePlan] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(CASE_STORAGE_KEY))
      if (!stored) return emptyCasePlan()
      const defaults = emptyCasePlan()
      return { ...defaults, ...stored, weeks: defaults.weeks.map((week, index) => ({ ...week, ...(stored.weeks?.[index] || {}) })), dayCycle: { ...defaults.dayCycle, ...(stored.dayCycle || {}) } }
    } catch { return emptyCasePlan() }
  })
  const [stressReflection, setStressReflection] = useState(() => {
    const defaults = Object.fromEntries(STRESS_REFLECTION_FIELDS.map(field => [field.id, '']))
    try { return { ...defaults, ...JSON.parse(localStorage.getItem(STRESS_REFLECTION_KEY) || '{}') } }
    catch { return defaults }
  })
  const [methodReflections, setMethodReflections] = useState(() => {
    try { return JSON.parse(localStorage.getItem(METHOD_REFLECTION_KEY) || '{}') }
    catch { return {} }
  })
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [markingId, setMarkingId] = useState(null)
  const [delivery, setDelivery] = useState(restoreDelivery)
  const [learningCheck, setLearningCheck] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LEARNING_CHECK_KEY) || '{}')
      const index = Number.isInteger(saved.index) ? Math.max(0, Math.min(saved.index, LEARNING_CHECK.length)) : 0
      const answer = Number.isInteger(saved.answer) && index < LEARNING_CHECK.length && saved.answer >= 0 && saved.answer < LEARNING_CHECK[index].answers.length ? saved.answer : null
      return { index, answer, score: Number.isInteger(saved.score) ? Math.max(0, Math.min(saved.score, index + (answer !== null ? 1 : 0))) : 0 }
    } catch { return { index: 0, answer: null, score: 0 } }
  })
  const { index: checkIndex, answer: checkAnswer, score: checkScore } = learningCheck
  const [message, setMessage] = useState('')
  const [entry, setEntry] = useState({ date: localToday(), technique: METHODS[0].name, minutes: 20, description: '', signed: false })

  useEffect(() => {
    const syncTrainingRoute = () => {
      if (window.location.hash === '#ausbildung' || window.location.hash.startsWith('#ausbildung/')) setRoute(readTrainingRoute())
    }
    window.addEventListener('hashchange', syncTrainingRoute)
    return () => window.removeEventListener('hashchange', syncTrainingRoute)
  }, [])

  function navigateSection(nextSection) {
    const validSection = MODULE_SECTIONS.has(nextSection) ? nextSection : 'start'
    setRoute({ section: validSection, method: null })
    const nextHash = validSection === 'start' ? '#ausbildung' : `#ausbildung/${validSection}`
    if (window.location.hash !== nextHash) window.location.hash = nextHash
  }

  function selectMethod(nextMethod) {
    setRoute({ section: 'methoden', method: nextMethod })
    window.location.hash = `#ausbildung/methoden/${encodeURIComponent(nextMethod.name)}`
  }

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(plan)) }, [plan])
  useEffect(() => { localStorage.setItem(CASE_STORAGE_KEY, JSON.stringify(casePlan)) }, [casePlan])
  useEffect(() => {
    try {
      if (delivery) localStorage.setItem(DELIVERY_STORAGE_KEY, JSON.stringify(delivery))
      else localStorage.removeItem(DELIVERY_STORAGE_KEY)
    } catch {}
  }, [delivery])
  useEffect(() => {
    try { localStorage.setItem(STRESS_REFLECTION_KEY, JSON.stringify(stressReflection)) } catch {}
  }, [stressReflection])
  useEffect(() => {
    try { localStorage.setItem(METHOD_REFLECTION_KEY, JSON.stringify(methodReflections)) } catch {}
  }, [methodReflections])
  useEffect(() => {
    try { localStorage.setItem(LEARNING_CHECK_KEY, JSON.stringify(learningCheck)) } catch {}
  }, [learningCheck])
  useEffect(() => {
    if (!delivery?.running) return undefined
    const timer = window.setInterval(() => setDelivery(current => {
      if (!current?.running || !current.endsAt) return current
      const remaining = Math.max(0, Math.ceil((current.endsAt - Date.now()) / 1000))
      if (remaining === 0) return { ...current, remaining: 0, running: false, endsAt: null }
      return remaining === current.remaining ? current : { ...current, remaining }
    }), 1000)
    return () => window.clearInterval(timer)
  }, [delivery?.running])
  useEffect(() => {
    let alive = true
    getCompleteRelaxSessionHistory().then(rows => { if (alive) setHistory(rows || []) }).catch(() => { if (alive) setHistory([]) }).finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  const practice = useMemo(() => history.flatMap(day => (day.items || []).filter(item => item.trainingUnit === true && item.signed === true).map(item => ({ ...item, date: day.date }))).sort((a, b) => a.date.localeCompare(b.date)), [history])
  const candidates = useMemo(() => history.flatMap(day => (day.items || []).map((item, itemIndex) => ({ ...item, date: day.date, _sessionItemIndex: itemIndex })).filter(item => !(item.trainingUnit === true && item.signed === true) && (String(item.technique || '').trim() || Number(item.minutes) > 0 || String(item.note || '').trim()))).sort((a, b) => a.date.localeCompare(b.date)), [history])
  const totalMinutes = plan.blocks.reduce((sum, block) => sum + (Number(block.minutes) || 0), 0)
  const completed = practice.length
  const caseProgress = [
    { label: 'Ziele formuliert', done: Boolean(casePlan.goals.trim()) },
    ...casePlan.weeks.map(week => ({ label: `Woche ${week.number} ausgearbeitet`, done: ['focus', 'routine', 'relaxation', 'nutrition'].every(key => Boolean(week[key]?.trim())) })),
    { label: 'Tageszyklus mit Zeitstruktur beschrieben', done: ['time', 'goal', 'sequence', 'duration', 'transition'].every(key => Boolean(casePlan.dayCycle[key]?.trim())) },
    { label: 'Ernährungskapitel vollständig bearbeitet', done: ['foodIdeas', 'brainFood', 'powerFood', 'soulFood', 'recipeIdeas', 'naturalProducts', 'supplementNotes'].every(key => Boolean(casePlan[key]?.trim())) },
  ]
  const caseProgressCount = caseProgress.filter(item => item.done).length
  const matchingMethods = METHODS.filter(item => `${item.name} ${item.focus} ${item.practice} ${item.source}`.toLocaleLowerCase('de-AT').includes(methodQuery.trim().toLocaleLowerCase('de-AT')))

  function notify(text) { setMessage(text); window.setTimeout(() => setMessage(''), 2400) }
  function updateBlock(id, patch) { setPlan(current => ({ ...current, blocks: current.blocks.map(block => block.id === id ? { ...block, ...patch } : block) })) }
  function beginDelivery() {
    if (!plan.blocks.length) return
    const selectedMethod = METHODS.find(item => item.name === plan.method)
    const method = selectedMethod ? {
      name: selectedMethod.name,
      focus: selectedMethod.focus,
      practice: selectedMethod.practice,
      adapt: selectedMethod.adapt,
      source: selectedMethod.source,
    } : null
    setDelivery({ title: plan.title, method, blocks: plan.blocks.map(block => ({ ...block })), index: 0, remaining: Math.max(1, Number(plan.blocks[0].minutes) || 1) * 60, running: false, endsAt: null })
  }
  function changeDeliveryBlock(index) {
    if (!delivery) return
    if (index >= delivery.blocks.length) {
      setEntry(current => ({ ...current, date: localToday(), technique: delivery.method?.name || plan.method || METHODS[0].name, minutes: '', description: delivery.title || '', signed: false }))
      setDelivery(null)
      navigateSection('nachweis')
      notify('Nachweis-Entwurf vorbereitet. Nur nach tatsächlich durchgeführter Einheit bestätigen.')
      return
    }
    const block = delivery.blocks[index]
    setDelivery(current => ({ ...current, index, remaining: Math.max(1, Number(block.minutes) || 1) * 60, running: false, endsAt: null }))
  }
  function toggleDeliveryTimer() {
    setDelivery(current => {
      if (!current) return current
      if (current.running) {
        const remaining = Math.max(0, Math.ceil(((current.endsAt || Date.now()) - Date.now()) / 1000))
        return { ...current, remaining, running: false, endsAt: null }
      }
      const remaining = current.remaining > 0 ? current.remaining : Math.max(1, Number(current.blocks[current.index].minutes) || 1) * 60
      return { ...current, remaining, running: true, endsAt: Date.now() + remaining * 1000 }
    })
  }
  function formatTimer(seconds) { return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}` }
  function answerCheck(index) {
    if (checkAnswer !== null) return
    setLearningCheck(current => ({ ...current, answer: index, score: index === LEARNING_CHECK[current.index].correct ? current.score + 1 : current.score }))
  }
  function nextCheck() { setLearningCheck(current => ({ ...current, index: current.index + 1, answer: null })) }
  function resetCheck() { setLearningCheck({ index: 0, answer: null, score: 0 }) }

  async function addPractice(event) {
    event.preventDefault()
    if (!entry.signed) return notify('Bitte die Durchführung bestätigen.')
    if (entry.minutes !== '' && (!Number.isFinite(Number(entry.minutes)) || Number(entry.minutes) < 1)) return notify('Die Dauer muss mindestens eine Minute betragen oder leer bleiben.')
    if (entry.technique === 'Weitere unterstützende Verfahren' && !entry.description.trim()) return notify('Bitte die konkret durchgeführte unterstützende Praxis benennen.')
    setSaving(true)
    try {
      const current = await getRelaxSession(entry.date)
      const items = current?.items || []
      items.push({ id: crypto.randomUUID?.() || String(Date.now()), technique: entry.technique, minutes: entry.minutes === '' ? null : Number(entry.minutes), mood_before: 3, mood_after: 3, note: entry.description.trim(), trainingUnit: true, signed: true })
      await saveRelaxSession(entry.date, items)
      const rows = await getCompleteRelaxSessionHistory()
      setHistory(rows || [])
      setEntry(value => ({ ...value, date: localToday(), description: '', signed: false }))
      notify('Einheit gespeichert')
    } catch { notify('Speichern fehlgeschlagen. Bitte Verbindung prüfen.') }
    finally { setSaving(false) }
  }

  async function confirmExistingPractice(candidate) {
    const confirmed = window.confirm(`Bestätigst du, dass du „${candidate.technique || candidate.note || 'diese Praxis'}“ am ${candidate.date} selbst als Entspannungseinheit durchgeführt hast und diese Session für den Ausbildungsnachweis zählen soll?`)
    if (!confirmed) return
    const candidateKey = practiceCandidateKey(candidate)
    setMarkingId(candidateKey)
    try {
      const current = await getRelaxSession(candidate.date)
      const updated = (current?.items || []).map((item, index) => {
        const matches = candidate.id != null ? item.id === candidate.id : index === candidate._sessionItemIndex
        return matches ? { ...item, trainingUnit: true, signed: true } : item
      })
      await saveRelaxSession(candidate.date, updated)
      setHistory(rows => rows.map(day => day.date === candidate.date ? { ...day, items: updated } : day))
      notify('Session als Praxiseinheit bestätigt')
    } catch { notify('Übernahme fehlgeschlagen. Bitte Verbindung prüfen.') }
    finally { setMarkingId(null) }
  }

  function exportPractice() {
    const rows = [['Nr.', 'DATUM', 'BESCHREIBUNG', 'UNTERSCHRIFT']]
    for (let index = 0; index < 30; index += 1) {
      const item = practice[index]
      rows.push(item
        ? [index + 1, item.date, practiceDescription(item), '']
        : [index + 1, '', '', ''])
    }
    downloadText(`entspannungstrainer-praxis-${localToday()}.csv`, rows.map(row => row.map(csvCell).join(';')).join('\r\n'), 'text/csv;charset=utf-8')
  }

  function exportModuleBackup() {
    try {
      const data = {
        [STORAGE_KEY]: plan,
        [CASE_STORAGE_KEY]: casePlan,
        [DELIVERY_STORAGE_KEY]: delivery,
        [STRESS_REFLECTION_KEY]: stressReflection,
        [METHOD_REFLECTION_KEY]: methodReflections,
        [LEARNING_CHECK_KEY]: learningCheck,
        [TEACHING_SCRIPT_KEY]: localStorage.getItem(TEACHING_SCRIPT_KEY) || '',
        [PRANAYAMA_ASSIGNMENT_KEY]: JSON.parse(localStorage.getItem(PRANAYAMA_ASSIGNMENT_KEY) || 'null'),
      }
      const backup = { format: MODULE_BACKUP_FORMAT, version: 2, exportedAt: new Date().toISOString(), data }
      downloadText(`relax-ausbildung-arbeitsstand-${localToday()}.json`, JSON.stringify(backup, null, 2), 'application/json;charset=utf-8')
      notify('Ausbildungs-Arbeitsstand exportiert.')
    } catch {
      notify('Arbeitsstand konnte nicht gelesen werden. Bitte Eingaben prüfen und erneut sichern.')
    }
  }

  async function importModuleBackup(event) {
    const input = event.currentTarget
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      notify('Die Sicherungsdatei ist größer als 2 MB.')
      return
    }
    try {
      const backup = normalizeModuleBackup(JSON.parse(await file.text()))
      if (!backup) throw new Error('invalid backup')
      if (!window.confirm('Dieser Ausbildungs-Arbeitsstand ersetzt die lokalen Arbeitsblätter und den Timer auf diesem Gerät. Der formale Praxisnachweis bleibt separat. Fortfahren?')) return
      const previous = Object.fromEntries(MODULE_BACKUP_KEYS.map(key => [key, localStorage.getItem(key)]))
      try {
        for (const key of MODULE_BACKUP_KEYS) {
          const value = backup.data[key]
          if (value === null) localStorage.removeItem(key)
          else localStorage.setItem(key, key === TEACHING_SCRIPT_KEY ? value : JSON.stringify(value))
        }
      } catch (error) {
        for (const key of MODULE_BACKUP_KEYS) {
          if (previous[key] === null) localStorage.removeItem(key)
          else localStorage.setItem(key, previous[key])
        }
        throw error
      }
      window.location.reload()
    } catch {
      notify('Datei ungültig oder konnte nicht gespeichert werden. Der vorhandene Arbeitsstand blieb erhalten.')
    }
  }

  function exportTrainingPlan() {
    const selectedMethod = METHODS.find(item => item.name === plan.method)
    const lines = [
      `# ${plan.title || 'Stundenentwurf Entspannungstraining'}`,
      '', `Datum des Exports: ${localToday()}`, '',
      '## Stundenziel', plan.focus || '_Noch nicht formuliert._', '',
      '## Schwerpunktmethode', plan.method || '_Keine Methode ausgewählt._',
      ...(selectedMethod ? [`\n**Fokus:** ${selectedMethod.focus}`, `\n**Anleitung und Anpassung:** ${selectedMethod.practice} ${selectedMethod.adapt}`, `\n**Quelle:** ${selectedMethod.source}`] : []),
      '', '## Stundenablauf',
      ...plan.blocks.flatMap((block, index) => [`### ${index + 1}. ${block.name} · ${block.minutes} Min.`, block.detail || '', '']),
      '## Vorbereitung',
      ...PREPARATION_CHECKS.map(([id, label]) => `- [${plan.checks?.[id] ? 'x' : ' '}] ${label}`),
      '', '## Nachreflexion', plan.reflection || '_Noch nicht ausgefüllt._',
      '', '---', 'Arbeitsentwurf aus dem Relax-Ausbildungsmodul. Kursrichtwerte ersetzen keine individuelle Gesundheitsfreigabe oder praktische Einschulung.',
    ]
    const filename = (plan.title || 'stundenentwurf').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'stundenentwurf'
    downloadText(`stundenentwurf-${filename}-${localToday()}.md`, lines.join('\n'), 'text/markdown;charset=utf-8')
  }

  function updateCaseWeek(index, key, value) {
    setCasePlan(current => ({ ...current, weeks: current.weeks.map((week, i) => i === index ? { ...week, [key]: value } : week) }))
  }

  function updateCaseWeekReview(index, key, value) {
    setCasePlan(current => ({ ...current, weeks: current.weeks.map((week, i) => i === index ? { ...week, weeklyCheck: { ...(week.weeklyCheck || {}), [key]: value } } : week) }))
  }

  function exportCaseConcept() {
    const lines = [
      `# ${casePlan.title || '4-Wochen-Konzept bei Stress'}`,
      '', '## Ziele', casePlan.goals || '', '', '## Wochenroutine',
      ...casePlan.weeks.flatMap(week => [`### Woche ${week.number}${week.focus ? ` · ${week.focus}` : ''}`, `- Alltag/Routine: ${week.routine || ''}`, `- Entspannung: ${week.relaxation || ''}`, `- Ernährung: ${week.nutrition || ''}`, `- Wochenselbstcheck (optional): innere Unruhe ${week.weeklyCheck?.stress || '—'}/10; Einschlafen ${week.weeklyCheck?.sleep || '—'}/10; Verdauung ${week.weeklyCheck?.digestion || '—'}/10; Routinen ${week.weeklyCheck?.routine || '—'}/10`, '']),
      '## Einordnung des Wochenselbstchecks', 'Die Werte sind ein freiwilliger, subjektiver Rückblick aus meinem Konzeptentwurf. Bei Beschwerden bedeutet 1 = gering und 10 = stark; bei Routinen 1 = kaum und 10 = sehr gut eingehalten. Sie sind keine Messwerte, Diagnose oder Behandlungsempfehlung.',
      '', '## Minimalvariante für hektische Tage', casePlan.minimalRoutine || '_Noch nicht ausgefüllt._',
      '## Ausgearbeiteter Tageszyklus',
      `- Tageszeit: ${casePlan.dayCycle.time || ''}`, `- Ziel: ${casePlan.dayCycle.goal || ''}`, `- Übungen und Reihenfolge: ${casePlan.dayCycle.sequence || ''}`, `- Zeitstruktur: ${casePlan.dayCycle.duration || ''}`, `- Übergänge und Rücknahme: ${casePlan.dayCycle.transition || ''}`,
      '', '## Ernährungsideen aus dem Skript', `- Lebensmittel/Mahlzeiten: ${casePlan.foodIdeas || ''}`, `- Brain Food: ${casePlan.brainFood || ''}`, `- Power Food: ${casePlan.powerFood || ''}`, `- Soul Food: ${casePlan.soulFood || ''}`, `- Rezeptideen: ${casePlan.recipeIdeas || ''}`, `- Naturheilkundliche Inhalte: ${casePlan.naturalProducts || ''}`, `- Nahrungsergänzungsmittel: ${casePlan.supplementNotes || ''}`,
      '', '## Rückblick nach vier Wochen', `- Hilfreichste Entspannungsmethode und Essensvorbereitung: ${casePlan.review?.method || ''}`, `- Zwei Routinen zum Weiterführen: ${casePlan.review?.continue || ''}`,
      '', '---', 'Arbeitsstand aus dem Relax-Ausbildungsmodul. Inhalte individuell prüfen und keine Diagnose oder Therapie ableiten.',
    ]
    downloadText(`stresskonzept-4-wochen-${localToday()}.md`, lines.join('\n'), 'text/markdown;charset=utf-8')
  }

  function exportStressReflection() {
    const lines = [
      '# Persönliche Stressreflexion',
      `\nDatum: ${localToday()}`,
      '\nDiese Notizen sind eine freiwillige Selbstreflexion, keine Diagnose.',
      ...STRESS_REFLECTION_FIELDS.flatMap(field => [`\n## ${field.title}`, stressReflection[field.id] || '_Noch keine Notiz._']),
      '\nQuelle: FlexyFit Academy, Stresstheorie, S. 32–44.',
    ]
    downloadText(`stressreflexion-${localToday()}.md`, lines.join('\n'), 'text/markdown;charset=utf-8')
  }

  function exportMethodReflection(selectedMethod) {
    const reflection = methodReflections[selectedMethod.name] || {}
    const lines = [
      `# Selbsterfahrung: ${selectedMethod.name}`,
      '', `Datum des Exports: ${localToday()}`, '',
      ...METHOD_REFLECTION_FIELDS.flatMap(([id, title]) => [`## ${title}`, reflection[id] || '', '']),
      '## Freiwillige Fachgesprächs- und Praxisprobe',
      ...METHOD_ORAL_PRACTICE_CHECKS.map(([id, label]) => `- [${reflection.readiness?.[id] ? 'x' : ' '}] ${label}`),
      '',
      `Ausbildungsbezug: ${selectedMethod.source}`,
      '', 'Persönliche Reflexion nach eigener Erfahrung oder praktischer Einschulung. Kein Nachweis einer absolvierten Ausbildungseinheit.',
    ]
    downloadText(`selbsterfahrung-${selectedMethod.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${localToday()}.md`, lines.join('\n'), 'text/markdown;charset=utf-8')
  }

  if (delivery) {
    const block = delivery.blocks[delivery.index]
    const isLastBlock = delivery.index === delivery.blocks.length - 1
    return <div className="space-y-4 pb-4">
      <section className="rounded-3xl border p-5 text-center" style={{ ...panel, background: 'linear-gradient(160deg, color-mix(in srgb, var(--accent) 20%, var(--card)), var(--card))' }}>
        <button onClick={() => setDelivery(null)} className="float-left rounded-lg border p-2 text-xs font-semibold" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>Beenden</button>
        <div className="pt-10 text-[10px] font-bold uppercase tracking-widest sm:text-xs" style={{ color: 'var(--muted)' }}>{delivery.title} · Abschnitt {delivery.index + 1} von {delivery.blocks.length}</div>
        <h1 className="mt-3 text-2xl font-black">{block.name}</h1>
        <div className="my-6 font-mono text-6xl font-black tabular-nums" role="timer" aria-live="off">{formatTimer(delivery.remaining)}</div>
        <p className="mx-auto max-w-md text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{block.detail}</p>
        {delivery.remaining === 0 && <div className="mt-4 rounded-xl p-3 text-sm font-semibold" style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>Zeit für diesen Abschnitt ist um. Wechsle weiter, wenn es für die Gruppe passt.</div>}
      </section>
      {delivery.method && <section className="rounded-2xl border p-4" style={panel}>
        <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Geplante Schwerpunktmethode</div>
        <h2 className="mt-1 font-bold">{delivery.method.name}</h2>
        <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{delivery.method.focus}</p>
        <p className="mt-3 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{delivery.method.practice}</p>
        <p className="mt-2 text-[11px] leading-relaxed" style={{ color: 'var(--dim)' }}>Anpassung: {delivery.method.adapt}</p>
        <p className="mt-2 text-[10px] leading-relaxed" style={{ color: 'var(--dim)' }}>Kursbezug: {delivery.method.source}</p>
      </section>}
      <div className="flex items-center justify-center gap-3">
        <button aria-label="Vorheriger Abschnitt" disabled={delivery.index === 0} onClick={() => changeDeliveryBlock(delivery.index - 1)} className="rounded-xl border p-3 disabled:opacity-40" style={{ borderColor: 'var(--line)' }}><SkipBack size={20} /></button>
        <button onClick={toggleDeliveryTimer} className="flex min-w-36 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold" style={{ background: 'var(--accent)', color: 'var(--bg2)' }}>{delivery.running ? <Pause size={18} /> : <Play size={18} />}{delivery.running ? 'Pause' : delivery.remaining === 0 ? 'Timer erneut' : 'Timer starten'}</button>
        <button aria-label={isLastBlock ? 'Einheit abschließen' : 'Nächster Abschnitt'} onClick={() => changeDeliveryBlock(delivery.index + 1)} className="rounded-xl border p-3" style={{ borderColor: 'var(--line)' }}>{isLastBlock ? <Square size={20} /> : <SkipForward size={20} />}</button>
      </div>
      <p className="text-center text-xs leading-relaxed" style={{ color: 'var(--dim)' }}>Der Timer unterstützt deine Zeitplanung. Du leitest weiterhin selbst an, beobachtest die Gruppe und passt Dauer oder Übergang an.</p>
    </div>
  }

  return <div className="space-y-4 pb-4">
    <section className="rounded-3xl border p-5" style={{ ...panel, background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 17%, var(--card)), var(--card))' }}>
      <div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Präventiver Vitaltrainer · Fachmodul</div>
      <h1 className="mt-2 text-2xl font-black">Entspannung anleiten lernen</h1>
      <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>Theorie verstehen, eine stimmige Einheit gestalten und die eigene Praxis für den Ausbildungsnachweis dokumentieren.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <div className="flex flex-nowrap gap-2 overflow-x-auto no-scrollbar">{[['start', 'Überblick'], ['grundlagen', 'Grundlagen'], ['selbstcheck', 'Lerncheck'], ['methoden', 'Methoden'], ['fallkonzept', '4-Wochen-Fall'], ['planung', 'Stunde planen'], ['nachweis', 'Praxisnachweis']].map(([id, label]) => <button key={id} onClick={() => navigateSection(id)} aria-pressed={section === id} className="shrink-0 rounded-full border px-3 py-2 text-xs font-bold" style={{ borderColor: section === id ? 'var(--accent)' : 'var(--line)', color: section === id ? 'var(--accent)' : 'var(--muted)', background: section === id ? 'var(--accent-glow)' : 'transparent' }}>{label}</button>)}</div>
      </div>
    </section>

    {section === 'start' && <>
      <section className="rounded-2xl border p-4" style={panel} aria-labelledby="module-backup-title">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1"><h2 id="module-backup-title" className="font-bold">Arbeitsstand auf ein anderes Gerät mitnehmen</h2><p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>Sichert Stundenentwurf, Fallaufgabe, Lerncheck, Reflexionen, Atemschulungs-Arbeitsblätter und einen pausierten oder laufenden Timer als JSON-Datei. Die Datei lässt sich auf iPhone, iPad oder Rechner übertragen und dort wiederherstellen.</p></div>
          <button type="button" onClick={exportModuleBackup} className="shrink-0 inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold" style={{ background: 'var(--accent)', color: 'var(--bg2)' }}><Download size={15} /> Sichern</button>
        </div>
        <label htmlFor="module-backup-file" className="mt-3 inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold" style={{ borderColor: 'var(--line)', color: 'var(--accent)' }}><Upload size={16} /> Sicherung wiederherstellen</label>
        <input id="module-backup-file" type="file" accept="application/json,.json" onChange={importModuleBackup} className="sr-only" />
        <p className="mt-2 text-[11px] leading-relaxed" style={{ color: 'var(--dim)' }}>Die Datei enthält persönliche Texte und bleibt in deiner Verantwortung. Der formale Praxisnachweis wird separat im Relax-Session-Speicher geführt und nicht importiert.</p>
      </section>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border p-4" style={panel}><div className="text-xs" style={{ color: 'var(--muted)' }}>Praxisnachweis</div><div className="mt-1 text-2xl font-black">{Math.min(completed, 30)}<span className="text-sm font-semibold" style={{ color: 'var(--muted)' }}> / 30</span></div><div className="mt-2 h-2 overflow-hidden rounded-full" style={{ background: 'var(--bg2)' }}><div className="h-full rounded-full" style={{ width: `${Math.min(100, completed / 30 * 100)}%`, background: 'var(--accent)' }} /></div></div>
        <div className="rounded-2xl border p-4" style={panel}><div className="text-xs" style={{ color: 'var(--muted)' }}>Stundenentwurf</div><div className="mt-1 text-2xl font-black">{totalMinutes}<span className="text-sm font-semibold" style={{ color: 'var(--muted)' }}> Min.</span></div><div className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>Richtwert: 60 Minuten</div></div>
      </div>
      <div className="rounded-2xl border p-4" style={panel}><h2 className="font-bold">Worum es im Modul geht</h2><p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>Entspannungstraining verbindet Grundlagen zu Stress und Erholung mit der passenden Auswahl und verständlichen Anleitung von Übungen. Als Trainer:in gibst du einen sicheren Rahmen, vermittelst Ruhe und passt die Stunde an die Gruppe an.</p><div className="mt-4 grid gap-2 sm:grid-cols-2">{[
        ['Verstehen', 'Stress, Belastung, Ressourcen und individuelle Reaktionen einordnen.'], ['Anleiten', 'Methode erklären, vormachen, üben lassen und Körperwahrnehmung fördern.'], ['Gestalten', 'Ziel, Schwerpunkt, Zeit und ruhige Übergänge bewusst planen.'], ['Reflektieren', 'Erleben erfragen, Feedback aufnehmen und die nächste Stunde anpassen.'],
      ].map(([title, text]) => <div className="rounded-xl p-3" key={title} style={{ background: 'var(--bg2)' }}><div className="text-sm font-bold">{title}</div><div className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{text}</div></div>)}</div></div>
      <div className="rounded-2xl border p-4" style={panel}><h2 className="font-bold">Didaktische Leitlinien</h2><ul className="mt-2 space-y-2 text-sm" style={{ color: 'var(--muted)' }}><li>• Ziel, Schwerpunkt und Ablauf zu Beginn verständlich machen und die Herkunft der Methode einordnen.</li><li>• Übungen erklären, demonstrieren und ausprobieren lassen; an die Teilnehmenden anpassen.</li><li>• Ruhig sprechen, Pausen lassen und den Sprechstil anhand von Rückmeldungen abstimmen.</li><li>• Körperwahrnehmung zählt mehr als korrekte oder vergleichbare Ausführung; Leistungsdenken und Vergleiche vermeiden.</li><li>• Einzelne Übungen wiederholen, damit Teilnehmende sie leichter in den Alltag integrieren können.</li><li>• Raum, Temperatur, Privatsphäre und genügend Zeit für eine sanfte Rücknahme vorbereiten.</li><li>• Ein gemeinsamer Beginn und Abschluss schaffen Orientierung; Feedback gehört dazu.</li></ul><p className="mt-3 text-xs" style={{ color: 'var(--dim)' }}>Grundlage: FlexyFit Academy, „Stundenplanung“, S. 4–9.</p></div>
      <section className="rounded-2xl border p-4" style={panel}>
        <h2 className="font-bold">Lernpfad durch das Fachmodul</h2>
        <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>Arbeite dich von den Grundlagen über Selbsterfahrung und Planung bis zur dokumentierten Praxis vor. Die Reihenfolge ist eine Orientierung für diese App, keine offizielle Prüfungsreihenfolge.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">{[
          ['1', 'Verstehen', 'Stressgrundlagen lesen und Wissen im Lerncheck wiederholen.', [['grundlagen', 'Grundlagen ansehen'], ['selbstcheck', 'Lerncheck starten']]],
          ['2', 'Erfahren', 'Methoden auswählen, nach tatsächlicher Praxis reflektieren und offene Fragen festhalten.', [['methoden', 'Methoden öffnen']]],
          ['3', 'Übertragen', 'Die offizielle Vier-Wochen-Aufgabe mit Zielen, Routine, Tageszyklus und Ernährung bearbeiten.', [['fallkonzept', 'Fallkonzept bearbeiten']]],
          ['4', 'Anleiten', 'Stunde entwerfen, vorbereiten und den Timer bei der Durchführung als Zeitstütze verwenden.', [['planung', 'Stunde planen']]],
          ['5', 'Nachweisen', 'Selbst durchgeführte Einheiten bestätigen, sammeln und im 30-Zeilen-Format ausgeben.', [['nachweis', 'Praxisnachweis öffnen']]],
        ].map(([number, title, detail, actions]) => <div key={number} className="rounded-xl p-3" style={{ background: 'var(--bg2)' }}><div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-black" style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>{number}</span><h3 className="text-sm font-bold">{title}</h3></div><p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{detail}</p><div className="mt-3 flex flex-wrap gap-2">{actions.map(([target, label]) => <button key={target} onClick={() => navigateSection(target)} className="rounded-lg border px-3 py-2 text-xs font-bold" style={{ borderColor: 'var(--line)', color: 'var(--accent)' }}>{label}</button>)}</div></div>)}</div>
      </section>
      <details className="rounded-2xl border p-4" style={panel}>
        <summary className="cursor-pointer font-bold">Kursfächer aus der Ausbildungsübersicht</summary>
        <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>Der Kursindex ordnet die Themen deiner MOC den passenden App-Bereichen zu. Eine Zuordnung öffnet den Lernbereich; sie bestätigt weder eine absolvierte Kurseinheit noch ersetzt sie das Originalskript.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">{[
          ['Stresstheorie & Stressmanagement', 'Stressreaktion, Stressansätze, Ressourcen, SORKC und Messbarkeit.', [['grundlagen', 'Grundlagen']]],
          ['Entspannungsmethoden im Überblick', 'Vier Ebenen, Selbsthypnose, Biofeedback und weitere unterstützende Verfahren aus der Stresstheorie.', [['methoden', 'Methoden']]],
          ['Mentales und autogenes Training', 'Themen der Ausbildungs-MOC sowie AT-Einordnung im Kursmaterial. Die Übersicht kennzeichnet fehlende methodenspezifische Ablaufskripte.', [['methoden', 'Themenkarten']]],
          ['Atemschulung', 'Atemmechanik, Kursübungen sowie Arbeitsblätter zur eigenen Anleitung und Gruppenpraxis.', [['atem', 'Atemschulung']]],
          ['Progressive Muskelrelaxation', 'Grundlagen, Praxisrahmen, Rücknahme und die im Skript ergänzten fünf Tibeter.', [['methoden', 'PMR und fünf Tibeter']]],
          ['Yoga-Grundübungen', 'Asana-Grundsätze, Varianten und die Haltungen aus dem Originalskript.', [['methoden', 'Yoga-Karte']]],
          ['Pilates-Grundübungen', 'Kursbegriffe, acht Kategorien und die Übungssammlung aus dem Skript.', [['methoden', 'Pilates-Karte']]],
          ['Assisted Stretching und Faszientraining', 'Flexibilität, angeleitete Partnerarbeit und die SMR-Praxisübersicht.', [['methoden', 'Stretching-Karten']]],
          ['Entspannung und Ausdauersport', 'Extensive gleichmäßige Bewegung und Kursbeispiele als Entspannungsbaustein.', [['methoden', 'Ausdauer-Karte']]],
          ['Entspannung und Wirbelsäule', 'Körperwahrnehmung, Bewegungsfreude und präventive Trainergrenzen.', [['methoden', 'Wirbelsäulen-Karte']]],
          ['Entspannung und Ernährung', 'Stressessen, Ernährungsthemen sowie Lebensmittel, Pflanzenstoffe, Naturheilmittel und Rezepte als Kursinhalte.', [['fallkonzept', 'Ernährungsaufgabe']]],
          ['Stundenplanung', 'Ziele, Gruppe, Raum, Vorbereitung, Stundenaufbau, Zeitblöcke, Rücknahme und Abschluss.', [['planung', 'Stunde planen']]],
          ['Pflichtaufgabe und Praxisprotokoll', 'Vier-Wochen-Konzept mit Tageszyklus sowie der getrennte Nachweis der 30 Praxiseinheiten.', [['fallkonzept', 'Vier-Wochen-Fall'], ['nachweis', '30 Einheiten']]],
        ].map(([title, description, actions]) => <article key={title} className="rounded-xl p-3" style={{ background: 'var(--bg2)' }}><h3 className="text-sm font-bold">{title}</h3><p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{description}</p><div className="mt-3 flex flex-wrap gap-2">{actions.map(([target, label]) => <button key={target} type="button" onClick={() => target === 'atem' ? onNavigate?.('atem') : navigateSection(target)} className="min-h-10 rounded-lg border px-3 py-2 text-xs font-bold" style={{ borderColor: 'var(--line)', color: 'var(--accent)' }}>{label}</button>)}</div></article>)}</div>
        <p className="mt-3 text-[11px]" style={{ color: 'var(--dim)' }}>Grundlage: lokale Ausbildungs-MOC „MOC-Dipl.Entspannungstrainer“ und die zugeordneten Kurs-PDFs. Die Aufteilung hier ist eine Navigation für die App, keine offizielle Prüfungsreihenfolge.</p>
      </details>
    </>}

    {section === 'grundlagen' && <>
      <div className="rounded-2xl border p-4" style={panel}><div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Theorie · Stresstheorie</div><h2 className="mt-1 text-lg font-black">Stress verstehen, statt ihn zu bewerten</h2><p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>Das Skript unterscheidet Stressoren als Anforderungen oder Auslöser von Stressreaktionen und dem subjektiven Erleben des „Gestresst-Seins“ (S. 5). Es versammelt mehrere Definitionen; Stress wird dabei als Reaktion auf Anforderungen und als biologischer Anpassungsprozess beschrieben. Kurzfristige Aktivierung kann hilfreich sein; anhaltende Belastung kann Erholung erschweren. Erleben und Umgang unterscheiden sich von Person zu Person.</p><div className="mt-3 grid gap-2">{[
        ['Reaktionsschema · Steinzeit und moderner Alltag · S. 10–13', 'Das Lehrskript stellt schematisch Orientierung → Aktivierung → Anpassung → Erholung → Überforderung → Erschöpfung gegenüber. In der Steinzeit-Illustration ist Erholung nach einer akuten Gefahr vorgesehen; für den modernen Alltag betont die Folie, dass sie oft fehlt. „Tod“ erscheint als dramatischer Endpunkt der Steinzeitfolie, nicht als allgemeine Stressfolge. Dieses Schema ist eine Unterrichtsillustration, keine universelle oder medizinische Verlaufsprognose.'],
        ['Selye · Anpassungsverlauf', 'Alarm, Widerstand und Erschöpfung beschreiben einen möglichen Verlauf bei anhaltender Belastung. Das Modell ist eine Orientierung, keine individuelle Diagnose.'],
        ['Lazarus & Folkman · Bewertung und Ressourcen', 'Stress hängt auch davon ab, wie eine Situation eingeschätzt wird und welche Bewältigungsmöglichkeiten verfügbar erscheinen.'],
        ['Salutogenese · Ressourcen stärken', 'Der Blick richtet sich auf Verständlichkeit, Handhabbarkeit und Sinn sowie auf vorhandene persönliche und soziale Ressourcen.'],
        ['SORKC · Verhalten im Kontext', 'Die Selbstreflexion im Skript betrachtet Stressoren, individuelle Voraussetzungen, Reaktionsmuster, Konsequenzen und Coping-Ansatzpunkte.'],
      ].map(([title, text]) => <div key={title} className="rounded-xl p-3" style={{ background: 'var(--bg2)' }}><div className="text-sm font-bold">{title}</div><p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{text}</p></div>)}</div><p className="mt-3 text-xs" style={{ color: 'var(--dim)' }}>Ausbildungsbezug: FlexyFit Academy, „Stresstheorie“; Definitionen S. 5–8, Reaktionsschema S. 10–13, Stressansätze S. 18 und 24–31, SORKC S. 32–44, Salutogenese S. 59.</p></div>
      <div className="rounded-2xl border p-4" style={panel}><div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Schematische Darstellung · Stresstheorie S. 66</div><h2 className="mt-1 text-lg font-black">Stress und Entspannung im Bildvergleich</h2><svg viewBox="0 0 300 190" className="mt-3 w-full" role="img" aria-labelledby="stress-relax-title stress-relax-desc"><title id="stress-relax-title">Schematischer Vergleich von Stress und Entspannung</title><desc id="stress-relax-desc">Zwei abstrakte Körpersymbole. Beim Symbol Stress zeigen Pfeile nach außen, beim Symbol Entspannung nach innen. Die Zeichnung enthält keine Messgrößen.</desc><defs><marker id="stress-relax-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto"><path d="M0,0 L6,3.5 L0,7 Z" fill="var(--ink)" /></marker></defs><text x="75" y="18" textAnchor="middle" fill="var(--ink)" fontSize="13" fontWeight="600">Stress</text><text x="225" y="18" textAnchor="middle" fill="var(--ink)" fontSize="13" fontWeight="600">Entspannung</text><g fill="var(--accent)"><circle cx="75" cy="48" r="15" /><ellipse cx="75" cy="105" rx="32" ry="43" /><circle cx="225" cy="48" r="15" /><ellipse cx="225" cy="105" rx="32" ry="43" /></g><g stroke="var(--ink)" strokeWidth="1.7" markerEnd="url(#stress-relax-arrow)"><line x1="54" y1="84" x2="31" y2="63" /><line x1="96" y1="84" x2="119" y2="63" /><line x1="52" y1="119" x2="27" y2="153" /><line x1="98" y1="119" x2="123" y2="153" /><line x1="195" y1="65" x2="213" y2="85" /><line x1="255" y1="65" x2="237" y2="85" /><line x1="195" y1="153" x2="213" y2="127" /><line x1="255" y1="153" x2="237" y2="127" /></g></svg><p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>Die Folie stellt zwei abstrakte Richtungen gegenüber. Sie weist den Pfeilen keine konkreten Körpervorgänge oder Messwerte zu; die Grafik ist deshalb eine Illustration und keine physiologische Aussage.</p></div>
      <div className="rounded-2xl border p-4" style={panel}><div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Theorie · Stressansätze</div><h2 className="mt-1 text-lg font-black">Verschiedene Perspektiven auf Stress</h2><p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>Das Kursskript stellt mehrere Erklärungsansätze nebeneinander. Sie lenken den Blick auf unterschiedliche Aspekte und sind keine Diagnosemodelle für einzelne Personen.</p><div className="mt-3 grid gap-2">{[
        ['Reaktionsorientiert · S. 18, 24', 'Betrachtet die Reaktion des Organismus; das Skript nennt Cannon und Selye.'],
        ['Auslösende Reize · S. 18, 25', 'Betrachtet Lebensereignisse und alltägliche Widrigkeiten (Daily Hassles); die individuelle Bewertung wird in diesem Ansatz laut Skript weniger berücksichtigt.'],
        ['Persönlichkeitstheoretisch · S. 18, 26', 'Ordnet individuelle Merkmale und Unterschiede als Perspektive ein; das Skript nennt unter anderem Typ-A-Konzepte und Kontrollüberzeugungen.'],
        ['Transaktional · S. 18, 27–31', 'Verknüpft Situation und Person: Bewertung und eingeschätzte Bewältigungsmöglichkeiten beeinflussen, ob eine Anforderung als Herausforderung, Überforderung oder Schädigung erlebt wird.'],
        ['Ressourcenorientiert und biopsychosozial · S. 18', 'Richtet den Blick auf Gesundheit und Ressourcen sowie auf das Zusammenwirken biologischer, psychologischer und sozialer Einflüsse.'],
      ].map(([title, text]) => <div key={title} className="rounded-xl p-3" style={{ background: 'var(--bg2)' }}><div className="text-sm font-bold">{title}</div><p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{text}</p></div>)}</div><p className="mt-3 text-xs" style={{ color: 'var(--dim)' }}>Quelle: FlexyFit Academy, „Stresstheorie“, S. 18, 24–31. Die Übersicht gibt die Einteilung des Lehrskripts wieder.</p></div>
      <div className="rounded-2xl border p-4" style={panel}><div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Theorie · vegetatives Nervensystem</div><h2 className="mt-1 text-lg font-black">Aktivierung und Erholung im Kursmodell</h2><p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>Das Skript beschreibt den Sympathikus als mit Aktivierung und Leistung verbunden, den Parasympathikus mit Ruhe und Regeneration. Es führt außerdem Cortisol, Adrenalin und Noradrenalin sowie Melatonin, Serotonin und Insulin als Beispiele in einer vereinfachten Hormonübersicht an.</p><div className="mt-3 rounded-xl p-3" style={{ background: 'var(--bg2)' }}><div className="text-sm font-bold">Einordnung für die Praxis</div><p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>Das sind Lehrbegriffe aus dem Skript, keine Messung des eigenen Nervensystems oder Hormonstatus. Aus einer Entspannungsübung oder dem subjektiven Erleben lässt sich keine konkrete Hormonveränderung ableiten.</p></div><p className="mt-3 text-xs" style={{ color: 'var(--dim)' }}>Quelle: FlexyFit Academy, „Stresstheorie“, Sympathikus/Parasympathikus S. 15–16, Hormonübersicht S. 20.</p></div>
      <div className="rounded-2xl border p-4" style={panel}><div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Theorie · Wirkungsannahmen im Skript</div><h2 className="mt-1 text-lg font-black">Entspannung: beschriebene Körper- und Geisteffekte</h2><p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>Das Skript führt mögliche Veränderungen etwa bei Puls, Blutdruck, Muskelspannung, Atmung, Durchblutung, Schlaf, Schmerz, Verdauung und Konzentration auf (S. 62, 64–65). Es nennt außerdem EEG-Bereiche und verknüpft Alpha-Aktivität mit Entspannung (S. 67–68).</p><div className="mt-3 rounded-xl p-3" style={{ background: 'var(--bg2)' }}><div className="text-sm font-bold">Kursinhalt, keine Messung</div><p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>Diese Aufzählung gibt die Aussagen der Ausbildungsunterlage wieder und belegt keine individuelle Wirkung. Die App misst weder EEG noch Kreislauf- oder andere Körperwerte; eine subjektive Entspannung erlaubt keine Aussage über einen bestimmten Messwert.</p></div><p className="mt-3 text-xs" style={{ color: 'var(--dim)' }}>Quelle: FlexyFit Academy, „Stresstheorie“, S. 62–68.</p></div>
      <div className="rounded-2xl border p-4" style={panel}>
        <div className="flex items-start justify-between gap-3"><div><div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Selbstreflexion · SORKC</div><h2 className="mt-1 text-lg font-black">Ein eigenes Stressmuster betrachten</h2></div><button type="button" onClick={exportStressReflection} className="shrink-0 inline-flex items-center gap-1 rounded-lg border px-2.5 py-2 text-xs font-bold" style={{ borderColor: 'var(--line)' }}><Download size={14} /> Markdown</button></div>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>Das Kursskript schlägt dafür 20 Minuten vor und betont: Es gibt kein Richtig oder Falsch. Nutze die Felder freiwillig und nur so weit, wie es für dich passend ist. Deine Einträge bleiben im lokalen Browser dieses Geräts; sie werden nicht mit dem Praxistagebuch synchronisiert.</p>
        <p className="mt-2 rounded-xl p-3 text-xs leading-relaxed" style={{ background: 'var(--bg2)', color: 'var(--muted)' }}>Quellenhinweis zur Notation: Die Schemafolie ordnet S, O, R und K den Stressoren, dem Organismus, den Stressreaktionen und den Konsequenzen zu. Coping (C) wird später als Bewältigungsansatz behandelt; der Konsequenzen-Abschnitt heißt im Skript zugleich „K und C“. Diese Reflexionsfelder trennen Folgen und Coping für die praktische Bearbeitung, ohne die uneinheitliche Kursnotation als eindeutige Modellzuordnung auszugeben.</p>
        <div className="mt-3 space-y-3">{STRESS_REFLECTION_FIELDS.map(field => <label key={field.id} className="block"><span className="mb-1 block text-sm font-semibold">{field.title}</span><span className="mb-1 block text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{field.prompt}</span><textarea value={stressReflection[field.id]} onChange={event => setStressReflection(current => ({ ...current, [field.id]: event.target.value }))} rows={3} className="w-full rounded-xl border p-3 text-sm" style={input} /></label>)}</div>
        <p className="mt-3 text-xs" style={{ color: 'var(--dim)' }}>Kursbezug: FlexyFit Academy, „Stresstheorie“, S. 32–44. Die Reflexion dient der persönlichen Betrachtung, nicht der Diagnose oder Therapie.</p>
      </div>
      <div className="rounded-2xl border p-4" style={panel}><div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Theorie · Entspannungsverfahren</div><h2 className="mt-1 text-lg font-black">Vier Ebenen der Entspannung</h2><div className="mt-3 grid gap-2 sm:grid-cols-2">{[
        ['Muskulär', 'Konzentrative Muskelentspannung, Progressive Muskelentspannung und muskuläres Tiefentraining.'],
        ['Vegetativ', 'Autogenes Training und Atemtechniken.'],
        ['Emotional', 'Fantasiereisen und suggestive Musik.'],
        ['Kognitiv', 'Meditation.'],
      ].map(([title, text]) => <div key={title} className="rounded-xl p-3" style={{ background: 'var(--bg2)' }}><div className="text-sm font-bold">{title}</div><p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{text}</p></div>)}</div><p className="mt-3 text-xs" style={{ color: 'var(--dim)' }}>Ebenen und Beispiele: FlexyFit-Skript „Stresstheorie“, S. 55–56. Die lokale Master-MOC führt Autogenes Training abweichend unter der muskulären Ebene; diese App folgt der Zuordnung im Original-PDF. Für Autogenes Training, Fantasiereisen und Meditation enthält das Kursarchiv keine konkrete Schritt-für-Schritt-Anleitung.</p></div>
      <div className="rounded-2xl border p-4" style={panel}><div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Theorie · Stressbewältigung</div><h2 className="mt-1 text-lg font-black">Soforthilfe, Prävention und unterstützende Maßnahmen</h2><div className="mt-3 grid gap-3 sm:grid-cols-2"><div className="rounded-xl p-3" style={{ background: 'var(--bg2)' }}><div className="text-sm font-bold">Im Abschnitt „Soforthilfe“ genannt</div><p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>Das Skript führt Autogenes Training, Progressive Muskelrelaxation und Selbsthypnose auf (S. 51–52). Die App bietet eine PMR-Übersicht; konkrete Anleitungen für AT und Selbsthypnose liegen im Kursarchiv nicht vor.</p></div><div className="rounded-xl p-3" style={{ background: 'var(--bg2)' }}><div className="text-sm font-bold">Langfristig und präventiv</div><p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>Für langfristige Stressbewältigung nennt das Skript PMR, Autogenes Training, meditative Verfahren und Phantasiereisen (S. 56). Bei AT, Meditation und Fantasiereisen bleibt die App bei der Kurseinordnung, solange keine konkrete Kursanleitung vorliegt.</p></div></div><div className="mt-3 rounded-xl p-3" style={{ background: 'var(--bg2)' }}><div className="text-sm font-bold">Weitere unterstützende Maßnahmen · S. 58</div><p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>Das Skript zählt Tai-Chi, Qigong, Yoga, Zen, Benson-Meditation, CSM, achtsamkeitsbasierte Stressreduktion und Feldenkrais (im Skript: „Feldenkreis“) auf. Für Yoga liegt eine eigene Übungssammlung vor; die übrigen Namen sind im Kursmaterial hier eine Übersicht und keine vollständigen Anleitungskonzepte.</p></div><p className="mt-3 text-xs" style={{ color: 'var(--dim)' }}>Kursbezug: FlexyFit Academy, „Stresstheorie“, S. 51–58.</p></div>
      <div className="rounded-2xl border p-4" style={panel}><div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Grundbegriff · Stresstheorie</div><h2 className="mt-1 text-lg font-black">Was heißt „entspannt“?</h2><p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>Das Skript beschreibt Entspannung als kurzfristigen oder länger anhaltenden Zustand verminderter Aktivierung, der im wachen Zustand auftreten kann. Subjektives Erleben, Muskelspannung und autonome Reaktionen müssen dabei nicht gleich verlaufen. Eine Person kann sich gegenüber einem hohen Ausgangsniveau bereits deutlich entspannter erleben, ohne schon einen umfassenden Ruhezustand erreicht zu haben. Im Training zählt deshalb auch die eigene Wahrnehmung; ein Gefühl allein belegt keinen bestimmten physiologischen Messwert.</p><p className="mt-3 text-xs" style={{ color: 'var(--dim)' }}>Ausbildungsbezug: FlexyFit-Skript „Stresstheorie“, Entspannungsdefinition und relative Veränderung S. 63 (Definition nach Dorsch).</p></div>
      <div className="rounded-2xl border p-4" style={panel}><div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Theorie · Körper & Erholung</div><h2 className="mt-1 text-lg font-black">Aktivierung und Erholung</h2><p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>Die Ausbildungsnotizen unterscheiden eine schnelle Stressreaktion (Sympathikus/SAM-System) und länger anhaltende hormonelle Regulation (HPA-Achse). Entspannungsverfahren, angemessene Bewegung und Erholung sind mögliche präventive Ressourcen. Eine Übung oder ein Gefühl allein misst keine Hormone und beweist keine physiologische Wirkung.</p><div className="mt-3 rounded-xl p-3" style={{ background: 'var(--bg2)' }}><div className="text-sm font-bold">Trainer:innen-Perspektive</div><p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>Befinden erfragen, Selbstwahrnehmung fördern und Erleben offen lassen. Aussagen wie „das senkt bei dir Cortisol“ oder „dein Vagus ist aktiviert“ aus einer einzelnen Einheit vermeiden.</p></div></div>
      <div className="rounded-2xl border p-4" style={panel}><div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Theorie · Stress messen</div><h2 className="mt-1 text-lg font-black">Messwerte und Erleben unterscheiden</h2><p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>Das Skript stellt verschiedene Zugänge nebeneinander: Beobachtung und Fragebögen, die Life-Change-Units-Skala für Lebensereignisse sowie biologische und körperbezogene Messgrößen. Es nennt Blut- oder Speichelproben (z. B. Cortisol, Adrenalin/Noradrenalin, Alpha-Amylase), Hautleitwert, Blutdruck, Herzfrequenz und Herzfrequenzvariabilität. Die LCU-Skala berücksichtigt laut Skript nicht das subjektive Stressempfinden.</p><div className="mt-3 rounded-xl p-3" style={{ background: 'var(--bg2)' }}><div className="text-sm font-bold">Biofeedback im Kurs</div><p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>Das Skript beschreibt Biofeedback als Rückmeldung körpereigener Signale über ein Gerät, etwa durch Licht oder Ton. Diese App erhebt keine solchen Messwerte. Als Entspannungstrainer:in weder Messverfahren durchführen noch aus einem einzelnen Wert eine Diagnose oder individuelle Wirkung ableiten.</p></div><p className="mt-3 text-xs" style={{ color: 'var(--dim)' }}>Ausbildungsbezug: FlexyFit Academy, „Stresstheorie“, S. 45–47.</p></div>
      <div className="rounded-2xl border p-4" style={panel}><div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Theorie · Entspannung & Wirbelsäule</div><h2 className="mt-1 text-lg font-black">Schmerz verstehen und einordnen</h2><p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>Das Kursskript behandelt Schmerz als Sinnes- und Gefühlserlebnis, beschreibt körperliche Voraussetzungen und nennt psychosoziale Belastungsfaktoren wie Stress und Kontrollverlust. Es führt außerdem unterschiedliche schmerzbezogene Gedanken und psychologisch orientierte Bewältigungsansätze auf.</p><div className="mt-3 rounded-xl p-3" style={{ background: 'var(--bg2)' }}><div className="text-sm font-bold">Grenze der Trainerrolle</div><p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>Die Abschnitte zu Selbstuntersuchungen, Selbstbehandlung, physikalischen Anwendungen und Medikamenten werden hier als Kursinhalte kenntlich gemacht, aber nicht als Selbsttests, Behandlung oder Medikamentenempfehlung angeleitet. Im Entspannungstraining stehen Befinden, freiwillige angenehme Bewegung und eine passende Weiterverweisung im Vordergrund.</p></div><p className="mt-3 text-xs" style={{ color: 'var(--dim)' }}>Ausbildungsbezug: FlexyFit Academy, „Entspannung & Wirbelsäule“, S. 4–8 und 10–23.</p></div>
      <div className="rounded-2xl border p-4" style={panel}><div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Anwendung · Lebensalltag</div><h2 className="mt-1 text-lg font-black">Ernährung & Wirbelsäule</h2><div className="mt-3 space-y-3">{[
        ['Entspannung & Ernährung', 'Stress kann Essensrhythmus, Auswahl und bewusstes Genießen beeinflussen. Im präventiven Gespräch stehen alltagstaugliche Routinen und Wahrnehmung im Vordergrund; Nahrungsergänzung oder Heilversprechen sind kein Ersatz für qualifizierte Beratung.'],
        ['Entspannung & Wirbelsäule', 'Die Ausbildungsnotizen verbinden Körperwahrnehmung, Bewegungsfreude und psychosoziale Einflüsse. Im Kurs werden angenehme Bewegungsoptionen angeboten; Schmerzdiagnostik und Behandlung gehören in qualifizierte Hände.'],
      ].map(([title, text]) => <div key={title}><h3 className="text-sm font-bold">{title}</h3><p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{text}</p></div>)}</div></div>
      <div className="rounded-2xl border p-4" style={{ ...panel, borderColor: 'color-mix(in srgb, var(--orange) 45%, var(--line))' }}><h2 className="font-bold">Präventive Trainerrolle</h2><p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>Du gestaltest Lern- und Bewegungsangebote, keine Diagnose oder Therapie. Teilnahme, Körperkontakt und Augen schließen bleiben freiwillig. Bei Schmerzen, deutlichem Unwohlsein oder gesundheitlichen Fragen Übung stoppen, eine passende Alternative anbieten und bei Bedarf an medizinische Fachpersonen verweisen.</p></div>
    </>}

    {section === 'selbstcheck' && <section className="rounded-2xl border p-5" style={panel}>
      <p className="mb-3 text-xs" style={{ color: 'var(--muted)' }}>Dein Lernstand wird lokal auf diesem Gerät gespeichert und beim nächsten Öffnen fortgesetzt.</p>
      {checkIndex >= LEARNING_CHECK.length ? <div className="text-center">
        <div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Lerncheck abgeschlossen</div>
        <h2 className="mt-2 text-2xl font-black">{checkScore} von {LEARNING_CHECK.length} richtig</h2>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>Nutze Antworten als Wiederholung der Kursnotizen. Sie ersetzen nicht die praktische Einschulung und das Originalmaterial.</p>
        <button onClick={resetCheck} className="mt-4 rounded-xl px-4 py-3 text-sm font-bold" style={{ background: 'var(--accent)', color: 'var(--bg2)' }}>Noch einmal</button>
      </div> : <>
        <div className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted)' }}><span>Lerncheck · Frage {checkIndex + 1} / {LEARNING_CHECK.length}</span><span>{checkScore} richtig</span></div>
        <h2 className="mt-4 text-lg font-black">{LEARNING_CHECK[checkIndex].question}</h2>
        <div className="mt-4 space-y-2">{LEARNING_CHECK[checkIndex].answers.map((answer, index) => {
          const selected = checkAnswer === index
          const correctAnswer = checkAnswer !== null && index === LEARNING_CHECK[checkIndex].correct
          const wrongAnswer = selected && index !== LEARNING_CHECK[checkIndex].correct
          return <button key={answer} disabled={checkAnswer !== null} onClick={() => answerCheck(index)} className="w-full rounded-xl border p-3 text-left text-sm leading-relaxed disabled:cursor-default" style={{ background: correctAnswer ? 'color-mix(in srgb, var(--green) 14%, var(--bg2))' : wrongAnswer ? 'color-mix(in srgb, var(--red) 14%, var(--bg2))' : 'var(--bg2)', borderColor: correctAnswer ? 'var(--green)' : wrongAnswer ? 'var(--red)' : 'var(--line)' }}>{answer}</button>
        })}</div>
        {checkAnswer !== null && <div className="mt-4 rounded-xl p-3" style={{ background: 'var(--bg2)' }}><div className="text-sm font-bold" style={{ color: checkAnswer === LEARNING_CHECK[checkIndex].correct ? 'var(--green)' : 'var(--orange)' }}>{checkAnswer === LEARNING_CHECK[checkIndex].correct ? 'Richtig' : 'Noch einmal anschauen'}</div><p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{LEARNING_CHECK[checkIndex].why}</p><p className="mt-2 text-[10px]" style={{ color: 'var(--dim)' }}>{LEARNING_CHECK[checkIndex].source}</p><button onClick={nextCheck} className="mt-3 w-full rounded-xl px-4 py-3 text-sm font-bold" style={{ background: 'var(--accent)', color: 'var(--bg2)' }}>{checkIndex + 1 === LEARNING_CHECK.length ? 'Ergebnis ansehen' : 'Nächste Frage'}</button></div>}
      </>}
    </section>}

    {section === 'methoden' && <>
      {method ? (
        <article className="rounded-2xl border p-5" style={panel}>
          <button onClick={() => navigateSection('methoden')} className="text-xs font-bold" style={{ color: 'var(--accent)' }}>← Alle Methoden</button>
          <div className="mt-3 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>Ausbildungsorientierung · {method.duration}</div>
          {method.durationSource && <p className="mt-1 text-[11px] leading-relaxed" style={{ color: 'var(--dim)' }}>Dauerquelle: {method.durationSource}</p>}
          <h2 className="mt-1 text-xl font-black">{method.name}</h2>
          <div className="mt-4 rounded-xl p-3 text-sm font-semibold" style={{ background: 'var(--bg2)' }}>{method.focus}</div>
          <h3 className="mt-4 text-sm font-bold">Anleitungsidee</h3>
          <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{method.practice}</p>
          <h3 className="mt-4 text-sm font-bold">Anpassung & Selbstbestimmung</h3>
          <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{method.adapt}</p>
          {method.name === 'Progressive Muskelrelaxation (PMR)' && (
            <section className="mt-4 rounded-xl border p-4 space-y-3" style={{ background: 'var(--bg2)', borderColor: 'var(--line)' }} aria-label="Geführte PMR-Langform">
              <div className="text-sm font-bold">PMR-Langform · 20 Schritte</div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>Angelehnt an das lokale Ausbildungs-Handout (20–30 Minuten; Quellenangabe im PDF: progressivemuskelentspannung.com). Die Schritte laufen manuell: Lass Zeit zum Anspannen und Nachspüren. Nur sanft und schmerzfrei anspannen; betroffene Bereiche überspringen oder die Übung ohne Anspannung beobachten.</p>
              {pmrStep === null ? (
                <button onClick={() => setPmrStep(0)} className="w-full rounded-xl px-4 py-3 text-sm font-bold" style={{ background: 'var(--accent)', color: 'var(--bg2)' }}>Schrittfolge beginnen</button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold" style={{ color: 'var(--muted)' }}><span>Schritt {pmrStep + 1} von {PMR_STEPS.length}</span><span>{Math.round((pmrStep + 1) / PMR_STEPS.length * 100)} %</span></div>
                  <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--line)' }}><div className="h-full rounded-full" style={{ width: `${(pmrStep + 1) / PMR_STEPS.length * 100}%`, background: 'var(--accent)' }} /></div>
                  <div className="rounded-xl p-3" style={{ background: 'var(--card)' }}><div className="font-bold">{PMR_STEPS[pmrStep][0]}</div><p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{PMR_STEPS[pmrStep][1]}</p></div>
                  <div className="flex gap-2">
                    <button disabled={pmrStep === 0} onClick={() => setPmrStep(step => Math.max(0, step - 1))} className="flex-1 rounded-xl border px-3 py-2.5 text-sm font-semibold disabled:opacity-40" style={{ borderColor: 'var(--line)' }}>Zurück</button>
                    {pmrStep < PMR_STEPS.length - 1
                      ? <button onClick={() => setPmrStep(step => step + 1)} className="flex-1 rounded-xl px-3 py-2.5 text-sm font-bold" style={{ background: 'var(--accent)', color: 'var(--bg2)' }}>Weiter</button>
                      : <button onClick={() => setPmrStep(null)} className="flex-1 rounded-xl px-3 py-2.5 text-sm font-bold" style={{ background: 'var(--accent)', color: 'var(--bg2)' }}>Abschließen</button>}
                  </div>
                </div>
              )}
            </section>
          )}
          {method.outline && <div className="mt-4 rounded-xl p-3" style={{ background: 'var(--bg2)' }}>
            <h3 className="text-sm font-bold">{method.outlineTitle}</h3>
            <div className="mt-3 space-y-3">{method.outline.map(([title, text]) => <div key={title}><div className="text-xs font-bold">{title}</div><p className="mt-0.5 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{text}</p></div>)}</div>
            {method.outlineExtra && <><h3 className="mt-5 border-t pt-4 text-sm font-bold" style={{ borderColor: 'var(--line)' }}>{method.outlineExtraTitle}</h3><div className="mt-3 space-y-3">{method.outlineExtra.map(([title, text]) => <div key={title}><div className="text-xs font-bold">{title}</div><p className="mt-0.5 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{text}</p></div>)}</div></>}
          </div>}
          {method.name === 'Entspannungsorientierte Ausdauer' && <div className="mt-4 rounded-xl p-3 text-xs leading-relaxed" style={{ background: 'var(--bg2)', color: 'var(--muted)' }}>Einzelne Entspannungseinheit und allgemeine Bewegungsempfehlung sind verschiedene Größen: Für Erwachsene nennt das österreichische Gesundheitsportal 150–300 Minuten Ausdauerbewegung mit mittlerer Intensität pro Woche sowie muskelkräftigende Übungen an mindestens zwei Tagen. <a href="https://www.gesundheit.gv.at/leben/bewegung/gesund-durch-sport/bewegungsempfehlungen-erwachsene.html" target="_blank" rel="noreferrer" className="font-semibold underline" style={{ color: 'var(--accent)' }}>Österreichische Bewegungsempfehlungen ↗</a></div>}
          <p className="mt-4 border-t pt-3 text-xs" style={{ borderColor: 'var(--line)', color: 'var(--dim)' }}>Ausbildungsbezug: {method.source}. Praxis immer an Person, Tagesform und Qualifikation anpassen.</p>
          <section className="mt-4 rounded-xl border p-4" style={{ borderColor: 'var(--line)', background: 'var(--bg2)' }}>
            <h3 className="text-sm font-bold">Selbsterfahrung & Lernreflexion</h3>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>Nach eigener Teilnahme oder praktischer Einschulung festhalten. Bei reinen Themenübersichten keine Durchführung ableiten. Die Notizen bleiben lokal in diesem Browser und zählen nicht als Ausbildungs-Praxiseinheit. Die <a href="https://www.flexyfitacademy.com/de/sport/yoga-pilates-entspannungstrainer" target="_blank" rel="noreferrer" className="font-semibold underline" style={{ color: 'var(--accent)' }}>offizielle Diplom-Kursbeschreibung ↗</a> nennt praktische Teile und Selbsterfahrung; bei Yoga auch Anleiten und Korrigieren ausgewählter Übungen.</p>
            <div className="mt-3 space-y-3">{METHOD_REFLECTION_FIELDS.map(([id, title, prompt]) => <label key={id} className="block text-xs font-semibold">{title}<span className="mt-1 block font-normal leading-relaxed" style={{ color: 'var(--muted)' }}>{prompt}</span><textarea value={methodReflections[method.name]?.[id] || ''} onChange={event => setMethodReflections(current => ({ ...current, [method.name]: { ...(current[method.name] || {}), [id]: event.target.value.slice(0, 1500) } }))} rows={3} maxLength={1500} className="mt-2 w-full rounded-xl border px-3 py-2 text-sm font-normal" style={input} /></label>)}</div>
            <div className="mt-4 border-t pt-3" style={{ borderColor: 'var(--line)' }}><h4 className="text-xs font-bold">Fachgesprächs- und Praxisprobe · freiwilliger Selbstcheck</h4><p className="mt-1 text-[11px] leading-relaxed" style={{ color: 'var(--muted)' }}>Die offizielle Prüfungsbeschreibung nennt mündliches Beantworten sowie praktisches Vorzeigen und Erklären. Diese Markierungen sind deine Lernnotizen, keine offizielle Prüfung oder Bewertung. Eine Übungsfolge nur abhaken, wenn du sie praktisch gelernt hast.</p><div className="mt-2 space-y-2">{METHOD_ORAL_PRACTICE_CHECKS.map(([id, label]) => <label key={id} className="flex items-start gap-2 rounded-lg p-2 text-xs leading-relaxed" style={{ background: 'var(--card)' }}><input type="checkbox" checked={Boolean(methodReflections[method.name]?.readiness?.[id])} onChange={event => setMethodReflections(current => ({ ...current, [method.name]: { ...(current[method.name] || {}), readiness: { ...(current[method.name]?.readiness || {}), [id]: event.target.checked } } }))} className="mt-0.5" /><span>{label}</span></label>)}</div></div>
            <button onClick={() => exportMethodReflection(method)} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold" style={{ borderColor: 'var(--line)', color: 'var(--accent)' }}><Download size={15} /> Reflexion als Markdown exportieren</button>
          </section>
          {method.name === 'Atemschulung' && <button onClick={() => onNavigate?.('atem')} className="mt-4 w-full rounded-xl border px-4 py-3 text-sm font-bold" style={{ borderColor: 'var(--line)', color: 'var(--accent)' }}>Zur geführten Atemübung</button>}
          <button onClick={() => { setEntry(current => ({ ...current, technique: method.name })); navigateSection('nachweis') }} className="mt-2 w-full rounded-xl px-4 py-3 text-sm font-bold" style={{ background: 'var(--accent)', color: 'var(--bg2)' }}>Methode im Ausbildungsnachweis dokumentieren</button>
        </article>
      ) : (
        <div className="space-y-3">
          <label className="block text-xs font-semibold" style={{ color: 'var(--muted)' }}>Methode finden<input type="search" value={methodQuery} onChange={event => setMethodQuery(event.target.value)} placeholder="Name, Thema oder Quelle" aria-label="Methoden nach Name, Thema oder Quelle durchsuchen" className="mt-1 w-full rounded-xl border px-3 py-3 text-sm font-normal" style={input} /></label>
          <p className="px-1 text-[11px]" style={{ color: 'var(--dim)' }}>{matchingMethods.length} von {METHODS.length} Methoden</p>
          {matchingMethods.length ? matchingMethods.map(item => { const Icon = item.icon; return <button key={item.name} onClick={() => selectMethod(item)} className="flex w-full items-center gap-3 rounded-2xl border p-4 text-left" style={panel}><div className="rounded-xl p-2" style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}><Icon size={19} /></div><div className="min-w-0 flex-1"><div className="font-bold">{item.name}</div><div className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>{item.duration} · {item.focus}</div></div><span style={{ color: 'var(--dim)' }}>›</span></button>}) : <div className="rounded-2xl border p-4 text-sm" style={{ ...panel, color: 'var(--muted)' }}>Keine Methoden gefunden. Suche nach einem Themenbegriff wie „Atem“, „Rücknahme“ oder „Stresstheorie“.</div>}
          <p className="px-1 text-xs leading-relaxed" style={{ color: 'var(--dim)' }}>Mentales Training, Autogenes Training, Fantasiereisen und Meditation sind als Kursinhalte oder Themenübersichten eingeordnet; das Kursarchiv enthält dazu keine vollständigen methodenspezifischen Anleitungen. Die App ergänzt deshalb keine vermeintlichen Original-Abläufe.</p>
        </div>
      )}
    </>}

    {section === 'fallkonzept' && <>
      <section className="rounded-2xl border p-4 space-y-2" style={panel}>
        <div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Pflichtaufgabe · Entspannungstrainer</div>
        <h2 className="text-lg font-black">Stresskonzept über vier Wochen</h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>Der Fall aus dem Aufgaben-PDF: 38-jähriger Abteilungsleiter, unregelmäßige Mahlzeiten, wenig Bewegung, Verdauungsbeschwerden, innere Unruhe und Einschlafprobleme. Entwickle Ziele und eine alltagstaugliche Wochenroutine; arbeite einen Tageszyklus mit Übungsauswahl und Zeitstruktur aus.</p>
        <div className="rounded-xl border p-3 text-xs leading-relaxed" style={{ borderColor: 'color-mix(in srgb, var(--orange) 45%, var(--line))', background: 'var(--bg2)', color: 'var(--muted)' }}><strong style={{ color: 'var(--fg)' }}>Präventive Fallbearbeitung:</strong> Die genannten Verdauungs- und Schlafbeschwerden sind keine Diagnose. Ziele gemeinsam und ohne Abnehm- oder Heilversprechen formulieren; Ernährung und Entspannung als alltagstaugliche Lern- und Wohlbefindensangebote planen. Bei anhaltenden oder zunehmenden Beschwerden zur medizinischen Abklärung ermutigen. Die Fallbeschreibung ersetzt kein Gespräch mit der betroffenen Person.</div>
        <p className="text-xs" style={{ color: 'var(--dim)' }}>Ausbildungsquelle: FlexyFit Academy, „ESPT_Pflichtaufgabe_ENTSPANNUNGSTRAINER“; ergänzende Skripte „Entspannung und Ernährung“ und „Stundenplanung“.</p>
      </section>
      <section className="rounded-2xl border p-4 space-y-3" style={panel}>
        <div className="flex items-center justify-between gap-2"><h3 className="font-bold">Konzeptentwurf</h3><button onClick={exportCaseConcept} className="flex items-center gap-1 rounded-lg border px-2 py-2 text-xs font-bold" style={{ borderColor: 'var(--line)' }}><Download size={14} /> Markdown</button></div>
        <label className="block text-xs" style={{ color: 'var(--muted)' }}>Titel<input value={casePlan.title} onChange={event => setCasePlan(current => ({ ...current, title: event.target.value }))} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" style={input} /></label>
        <label className="block text-xs" style={{ color: 'var(--muted)' }}>Ziele<textarea value={casePlan.goals} onChange={event => setCasePlan(current => ({ ...current, goals: event.target.value }))} rows={3} placeholder="Welche Veränderungen soll der Fallkunde selbst wahrnehmen? Formuliere überprüfbare, realistische Ziele." className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" style={input} /></label>
      </section>
      <section className="rounded-2xl border p-4" style={panel} aria-live="polite">
        <div className="flex items-baseline justify-between gap-3"><h3 className="font-bold">Arbeitsstand</h3><span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>{caseProgressCount} / {caseProgress.length} Bereiche</span></div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">{caseProgress.map(item => <div key={item.label} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs" style={{ background: 'var(--bg2)', color: item.done ? 'var(--green)' : 'var(--muted)' }}><span aria-hidden="true">{item.done ? '✓' : '○'}</span>{item.label}</div>)}</div>
        <p className="mt-3 text-[11px] leading-relaxed" style={{ color: 'var(--dim)' }}>Der Check zeigt nur, ob Pflichtbereiche Text enthalten. Er bewertet weder fachliche Richtigkeit noch Qualität oder Einreichungsfähigkeit.</p>
      </section>
      <div className="space-y-3">{casePlan.weeks.map((week, index) => <section key={week.number} className="rounded-2xl border p-4 space-y-3" style={panel}>
        <h3 className="font-bold">Woche {week.number}</h3>
        {[['focus', 'Wochenziel', 'Welcher kleine Schwerpunkt passt zu dieser Woche?'], ['routine', 'Alltagsroutine', 'Wann und wie lässt sich die Veränderung realistisch in den Alltag einbauen?'], ['relaxation', 'Entspannungsübung', 'Welche Methode aus den Skripten wird eingeplant und wie wird sie angeleitet?'], ['nutrition', 'Ernährungsbaustein', 'Welche passende Skriptidee wird ausgewählt und wie alltagstauglich umgesetzt?']].map(([key, label, placeholder]) => <label key={key} className="block text-xs" style={{ color: 'var(--muted)' }}>{label}<textarea value={week[key]} onChange={event => updateCaseWeek(index, key, event.target.value)} rows={2} placeholder={placeholder} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" style={input} /></label>)}
        <div className="rounded-xl p-3" style={{ background: 'var(--bg2)' }}><h4 className="text-xs font-bold">Wochenselbstcheck · optionale Ergänzung deines Konzeptentwurfs</h4><p className="mt-1 text-[11px] leading-relaxed" style={{ color: 'var(--muted)' }}>Nur subjektiv einschätzen: Bei Beschwerden bedeutet 1 = gering und 10 = stark; bei Routinen 1 = kaum und 10 = sehr gut eingehalten. Keine Messung oder Diagnose.</p><div className="mt-3 grid grid-cols-2 gap-3">{[['stress', 'Innere Unruhe'], ['sleep', 'Einschlafen'], ['digestion', 'Verdauung'], ['routine', 'Routine eingehalten']].map(([key, label]) => <label key={key} className="text-xs" style={{ color: 'var(--muted)' }}>{label}<select value={week.weeklyCheck?.[key] || ''} onChange={event => updateCaseWeekReview(index, key, event.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" style={input}><option value="">Offen</option>{Array.from({ length: 10 }, (_, value) => <option key={value + 1} value={String(value + 1)}>{value + 1} / 10</option>)}</select></label>)}</div></div>
      </section>)}</div>
      <section className="rounded-2xl border p-4 space-y-3" style={panel}><h3 className="font-bold">Kurzvariante für hektische Tage · eigene Konzept-Ergänzung</h3><p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>Welche kleine Alternative bleibt realistisch, wenn der geplante Ablauf an einem vollen Arbeitstag nicht klappt? In deinem Beispiel sind es kurze Atemwahrnehmung, eine echte Mittagspause und ein kurzer Spaziergang.</p><textarea value={casePlan.minimalRoutine || ''} onChange={event => setCasePlan(current => ({ ...current, minimalRoutine: event.target.value }))} rows={3} placeholder="Beschreibe deine eigene kurze Alltagsvariante." className="w-full rounded-xl border px-3 py-2 text-sm" style={input} /></section>
      <section className="rounded-2xl border p-4 space-y-3" style={panel}>
        <h3 className="font-bold">Eine Einheit als Tageszyklus ausarbeiten</h3>
        {[['time', 'Zeitpunkt und Alltagssituation', 'z. B. Feierabend; Voraussetzungen und Dauer'], ['goal', 'Ziel der Einheit', 'Was soll der Teilnehmer üben oder wahrnehmen?'], ['sequence', 'Übungsauswahl und Reihenfolge', 'Ankommen, Einschulung, Hauptteil, Nachspüren'], ['duration', 'Zeitstruktur', 'Minuten je Abschnitt; Gesamtzeit'], ['transition', 'Rücknahme und Abschluss', 'Orientierung, Feedback und Transfer in den Alltag']].map(([key, label, placeholder]) => <label key={key} className="block text-xs" style={{ color: 'var(--muted)' }}>{label}<textarea value={casePlan.dayCycle[key]} onChange={event => setCasePlan(current => ({ ...current, dayCycle: { ...current.dayCycle, [key]: event.target.value } }))} rows={2} placeholder={placeholder} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" style={input} /></label>)}
      </section>
      <section className="rounded-2xl border p-4 space-y-3" style={panel}>
        <h3 className="font-bold">Ernährungsteil der Aufgabe</h3>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>Das Skript „Entspannung und Ernährung“ gliedert „Lebensmittel gegen Stress“ in Brain Food, Power Food und Soul Food. Es hält zugleich fest, dass kein bestimmtes Lebensmittel Stress direkt reduziert (S. 27), ordnet Power-Food-Versprechen kritisch ein (S. 53–55) und sagt, dass Nahrungsergänzung bei gesunden Menschen mit gesunder Ernährung in der Regel nicht erforderlich ist (S. 85–86). Nutze die Felder für eine ausgewogene, alltagstaugliche Auswahl und eigene Quellenstellen; leite daraus keine individuelle Dosierung oder Therapie ab.</p>
        <details className="rounded-xl border p-3" style={{ borderColor: 'var(--line)', background: 'var(--bg2)' }}>
          <summary className="cursor-pointer text-xs font-bold">Kursmaterial zur Konzeptarbeit · Seitenübersicht</summary>
          <div className="mt-3 space-y-3 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
            <p><strong>Stressgrundlagen · S. 4–12:</strong> Der Einstieg erklärt Stress als angeborene Anpassungsreaktion mit Aktivierung für Angriff oder Flucht (S. 4–5), stellt Alarm-, Widerstands- und Erschöpfungsphase vor (S. 6–9) und führt mögliche körperliche und psychische Folgen sowie Dauerstress auf (S. 10–11). Als Gegenmaßnahmen nennt die Unterlage Bewegung, Ruhepausen und passende Ernährung (S. 12). Das sind vereinfachte Lehrinhalte des Ernährungsskripts, keine individuelle Verlaufsprognose oder medizinische Beratung.</p>
            <p><strong>Essverhalten bei Stress · S. 14–24:</strong> Das Skript unterscheidet Stress-Essen und Stress-Hungern, beschreibt Veränderungen je nach Situation und berichtet ein kompensatorisches Essmuster aus einer Studie (S. 19–23). Es warnt davor, daraus pauschal auf den Gesundheitszustand zu schließen oder Stress-Essen als unnormal abzustempeln; Ermahnungen zu mehr Selbstdisziplin können laut Skript zusätzlichen Stress auslösen (S. 24). Die Begriffe sind keine festen Personentypen oder Diagnosekategorien.</p>
            <p><strong>Grundlagen · S. 25–38:</strong> Das Skript stellt voran, dass keine einzelnen Lebensmittel Stress direkt reduzieren (S. 27). Es behandelt komplexe Kohlenhydrate und Vollwertkost (S. 28–29), nennt Omega-3-Fettsäuren sowie Vitamin- und Mineralstoffbeispiele (S. 30–36), führt 1,5–2 Liter als Trink-Richtwert an (S. 37) und empfiehlt regelmäßige Pausen und eine ruhige Essenssituation (S. 38). Das sind Inhalte und Empfehlungen der Kursunterlage, keine individuelle Ernährungs- oder Trinkvorgabe; Wirkbehauptungen werden nicht als bestätigt dargestellt.</p>
            <p><strong>Brain Food · S. 39–51:</strong> Beispiele im Skript sind Haferflocken, Nüsse, Paranüsse, Lachs bzw. pflanzliche Omega-3-Quellen, Süßkartoffeln, Yamswurzel, grüner Tee und Kakao. Besonders die Aussagen zu Yamswurzel, Stimmung und Nervensystem werden hier als Kursbehauptungen kenntlich gemacht, nicht als bestätigte Wirkungsgarantie oder Empfehlung.</p>
            <p><strong>Power Food · S. 52–69:</strong> Das Kapitel führt Begriff und Werbeversprechen kritisch ein (S. 53–56) und nennt heimische Lebensmittel und Beeren (S. 57–59), Trockenobst, Weizengras, Chia, Zimt und Zitronen (S. 60–64) sowie Nährstoffgruppen und sekundäre Pflanzenstoffe im Zusammenhang mit dem Immunsystem (S. 65–69). Die genannten Gesundheitswirkungen bleiben Aussagen der Kursunterlage; Beispiele werden nicht als „Superfood“-Wirkversprechen übernommen.</p>
            <p><strong>Soul Food · S. 70–83:</strong> Das Kapitel behandelt Genuss und Essen als Belohnung oder Trost sowie Schokolade, Tryptophan, anregende und scharfe Lebensmittel (Capsaicin, S. 79–82) und den visuellen Eindruck einer Mahlzeit („Moodfood“, S. 83). Die Aussagen zu Stimmung, Botenstoffen und Farben sind Kursinhalte, keine individuelle Wirkungszusage; die Unterlage nennt auch mögliche Nachteile scharfer Lebensmittel.</p>
            <p><strong>Ernährung und Depression · S. 84:</strong> Das Skript berichtet Zusammenhänge zwischen Ernährungsweisen und Depressionsrisiko und nennt ungesättigte Fettsäuren und Olivenöl als Ernährungstipps. Diese Darstellung belegt keine Ursache bei einer einzelnen Person und ist weder Diagnose noch Behandlungsempfehlung.</p>
            <p><strong>Nahrungsergänzung · S. 85–89:</strong> Das Skript sagt, dass Supplemente bei gesunden Menschen mit ausgewogener Ernährung in der Regel nicht erforderlich sind (S. 86). Bei anhaltender innerer Unruhe und Erschöpfung empfiehlt es ärztliche Abklärung (S. 89). Produktwahl und Dosierung gehören nicht in eine Trainerempfehlung.</p>
            <p><strong>Naturheilmittel · S. 90–104:</strong> Das Skript führt Ginseng, Taigawurzel, Johanniskraut, Baldrian, Hopfen, Melisse, Passionsblume, Lavendel, Mädesüß, Kardamom, Borretsch, Basilikum und Majoran auf. Diese Liste dokumentiert Kursstoff, keine bestätigte Wirkung oder Anwendungsempfehlung. Besonders weist die Unterlage selbst auf mögliche Wechselwirkungen von Johanniskraut mit Medikamenten hin (S. 94); konkrete Einnahmeangaben werden hier nicht übernommen.</p>
            <p><strong>Rezepte und Hausmittel · S. 105–108:</strong> Die Unterlage enthält zwei Kräuterteemischungen (S. 106–107) und Hinweise zu Geschmack/Kombinationen (S. 108), darunter Dost, Lavendel, Schafgarbe, Salbei, Rosmarin sowie Benediktenkraut, Beifuß und Orangenschale. Die Rezepttexte und Mengenangaben werden als historischer Kursinhalt dokumentiert, nicht als App-Rezept oder Verzehrempfehlung ausgegeben.</p>
          </div>
        </details>
        {[['foodIdeas', 'Lebensmittel und Mahlzeitenideen', 'Skriptbezug und Tageszeit'], ['brainFood', 'Brain Food', 'Beispiele und Skriptstelle'], ['powerFood', 'Power Food', 'Beispiele und Skriptstelle'], ['soulFood', 'Soul Food', 'Beispiele und Skriptstelle'], ['recipeIdeas', 'Rezeptideen', 'Welche einfache Zubereitung passt zur Wochenroutine?'], ['naturalProducts', 'Nervenberuhigende Naturheilkunde', 'Kursinhalt und Grenzen der präventiven Trainerrolle'], ['supplementNotes', 'Nahrungsergänzungsmittel', 'Skriptinhalt, offene Fragen und nötige fachliche Abklärung']].map(([key, label, placeholder]) => <label key={key} className="block text-xs" style={{ color: 'var(--muted)' }}>{label}<textarea value={casePlan[key]} onChange={event => setCasePlan(current => ({ ...current, [key]: event.target.value }))} rows={2} placeholder={placeholder} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" style={input} /></label>)}
        <div className="rounded-xl p-3 text-xs" style={{ background: 'var(--bg2)', color: 'var(--muted)' }}>Der Entwurf speichert lokal auf diesem Gerät. Er ist ein Ausbildungsarbeitsblatt, keine Diagnose oder individuelle Behandlungsempfehlung.</div>
      </section>
      <section className="rounded-2xl border p-4 space-y-3" style={panel}><h3 className="font-bold">Rückblick nach vier Wochen · optionale Konzept-Ergänzung</h3><p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>Halte fest, was sich in diesem Fallkonzept als praktikabel erwiesen hat und was weiterlaufen soll.</p><label className="block text-xs" style={{ color: 'var(--muted)' }}>Hilfreichste Entspannungsmethode und Essensvorbereitung<textarea value={casePlan.review?.method || ''} onChange={event => setCasePlan(current => ({ ...current, review: { ...(current.review || {}), method: event.target.value } }))} rows={3} placeholder="Was würdest du im Beispielkonzept beibehalten?" className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" style={input} /></label><label className="block text-xs" style={{ color: 'var(--muted)' }}>Zwei Routinen für die nächsten vier Wochen<textarea value={casePlan.review?.continue || ''} onChange={event => setCasePlan(current => ({ ...current, review: { ...(current.review || {}), continue: event.target.value } }))} rows={2} placeholder="Welche zwei kleinen Gewohnheiten bleiben alltagstauglich?" className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" style={input} /></label></section>
    </>}

    {section === 'planung' && <>
      <div className="rounded-2xl border p-4" style={panel}><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><ClipboardList size={19} style={{ color: 'var(--accent)' }} /><h2 className="font-bold">Stundenentwurf</h2></div><button type="button" onClick={exportTrainingPlan} className="flex shrink-0 items-center gap-1 rounded-lg border px-2 py-2 text-xs font-bold" style={{ borderColor: 'var(--line)' }}><Download size={14} /> Markdown</button></div><label className="mt-4 block text-xs" style={{ color: 'var(--muted)' }}>Titel<input value={plan.title} onChange={event => setPlan({ ...plan, title: event.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" style={input} /></label><label className="mt-3 block text-xs" style={{ color: 'var(--muted)' }}>Stundenziel<textarea value={plan.focus} onChange={event => setPlan({ ...plan, focus: event.target.value })} placeholder="Was sollen die Teilnehmenden wahrnehmen oder kennenlernen?" rows={2} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" style={input} /></label><label className="mt-3 block text-xs" style={{ color: 'var(--muted)' }}>Schwerpunktmethode<select value={plan.method} onChange={event => setPlan({ ...plan, method: event.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" style={input}>{METHODS.map(item => <option key={item.name}>{item.name}</option>)}</select></label></div>
      <div className="space-y-3">{plan.blocks.map((block, index) => <div className="rounded-2xl border p-4" style={panel} key={block.id}><div className="flex items-start gap-3"><div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black" style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>{index + 1}</div><div className="min-w-0 flex-1"><input value={block.name} onChange={event => updateBlock(block.id, { name: event.target.value })} className="w-full rounded-lg border px-2 py-1 text-sm font-bold" style={input} /><textarea value={block.detail} onChange={event => updateBlock(block.id, { detail: event.target.value })} rows={2} className="mt-2 w-full rounded-lg border px-2 py-1 text-xs leading-relaxed" style={input} /></div><label className="text-center text-[10px]" style={{ color: 'var(--muted)' }}><input type="number" min="0" max="120" value={block.minutes} onChange={event => updateBlock(block.id, { minutes: event.target.value })} className="w-14 rounded-lg border px-1 py-2 text-center text-sm font-bold" style={input} />Min.</label></div></div>)}</div>
      <div className="rounded-2xl border p-4" style={panel}><div className="flex items-center justify-between font-bold"><span>Gesamtdauer</span><span style={{ color: totalMinutes === 60 ? 'var(--green)' : 'var(--accent)' }}>{totalMinutes} Minuten</span></div><p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>Der Entwurf folgt dem Aufbau Ankommen → Einschulung → Hauptteil → Nachspüren → Rücknahme. Für die Kombination mit anderen Trainingsformen nennt das Skript rund 15 Minuten Entspannungsteil und einen Puls unter 120 zu dessen Beginn; ein geschlossener Kurs dauert etwa 60 Minuten. Das sind Kursrichtwerte, keine individuelle Gesundheitsfreigabe.</p><div className="mt-3 flex items-center gap-2 text-xs" style={{ color: 'var(--green)' }}><Check size={15} />Entwurf wird automatisch auf diesem Gerät gespeichert.</div><button onClick={beginDelivery} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold" style={{ background: 'var(--accent)', color: 'var(--bg2)' }}><Play size={16} />Stunde durchführen</button></div>
      <div className="rounded-2xl border p-4" style={panel}><h2 className="font-bold">Vor der Stunde</h2><p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>Rahmenbedingungen aus der Stundenplanung abhaken.</p><div className="mt-3 space-y-2">{PREPARATION_CHECKS.map(([id, label]) => <label key={id} className="flex items-start gap-2 rounded-xl p-3 text-sm" style={{ background: 'var(--bg2)' }}><input type="checkbox" checked={Boolean(plan.checks?.[id])} onChange={event => setPlan(current => ({ ...current, checks: { ...current.checks, [id]: event.target.checked } }))} className="mt-0.5" /><span>{label}</span></label>)}</div></div>
      <div className="rounded-2xl border p-4" style={panel}><h2 className="font-bold">Nach der Stunde reflektieren</h2><p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>Was hat die Gruppe zurückgemeldet? Was möchtest du beim nächsten Mal anpassen?</p><textarea value={plan.reflection} onChange={event => setPlan(current => ({ ...current, reflection: event.target.value }))} rows={4} maxLength={1500} className="mt-3 w-full rounded-xl border px-3 py-2 text-sm" style={input} placeholder="Beobachtungen, Feedback, nächster Schritt …" /></div>
    </>}

    {section === 'nachweis' && <>
      <div className="rounded-2xl border p-4" style={panel}><div className="flex items-center justify-between gap-3"><div><h2 className="font-bold">30 Praxiseinheiten</h2><p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>Dokumentiere Datum, Methode, Dauer und deine Bestätigung.</p></div><div className="flex gap-2"><button onClick={() => window.print()} className="flex items-center gap-1 rounded-lg border px-2 py-2 text-xs font-bold" style={{ borderColor: 'var(--line)' }}><BookOpen size={14} /> Drucken / PDF</button><button onClick={exportPractice} className="flex items-center gap-1 rounded-lg border px-2 py-2 text-xs font-bold" style={{ borderColor: 'var(--line)' }}><Download size={14} /> CSV</button></div></div><div className="mt-4 flex items-end justify-between"><div className="text-3xl font-black">{Math.min(completed, 30)}<span className="text-base" style={{ color: 'var(--muted)' }}> / 30</span></div><div className="text-right text-xs" style={{ color: 'var(--muted)' }}>{Math.max(0, 30 - completed)} noch offen</div></div><div className="mt-2 h-2 overflow-hidden rounded-full" style={{ background: 'var(--bg2)' }}><div className="h-full rounded-full" style={{ width: `${Math.min(100, completed / 30 * 100)}%`, background: 'var(--green)' }} /></div></div>
      <form onSubmit={addPractice} className="space-y-3 rounded-2xl border p-4" style={panel}><h3 className="font-bold">Einheit eintragen</h3><div className="grid grid-cols-2 gap-3"><label className="text-xs" style={{ color: 'var(--muted)' }}>Datum<input type="date" required value={entry.date} onChange={event => setEntry({ ...entry, date: event.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" style={input} /></label><label className="text-xs" style={{ color: 'var(--muted)' }}>Dauer (Min., optional)<input type="number" min="1" max="240" value={entry.minutes} onChange={event => setEntry({ ...entry, minutes: event.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" style={input} /></label></div><label className="block text-xs" style={{ color: 'var(--muted)' }}>Methode<select value={entry.technique} onChange={event => setEntry({ ...entry, technique: event.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" style={input}>{METHODS.map(item => <option key={item.name}>{item.name}</option>)}</select></label><label className="block text-xs" style={{ color: 'var(--muted)' }}>{entry.technique === 'Weitere unterstützende Verfahren' ? 'Konkret durchgeführte Praxis (Pflichtfeld)' : 'Beschreibung (optional)'}<input value={entry.description} onChange={event => setEntry({ ...entry, description: event.target.value })} required={entry.technique === 'Weitere unterstützende Verfahren'} maxLength={300} placeholder={entry.technique === 'Weitere unterstützende Verfahren' ? 'z. B. Qigong' : 'z. B. PMR, Grundform, zu Hause'} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" style={input} /></label><label className="flex items-start gap-2 rounded-xl p-3 text-xs leading-relaxed" style={{ background: 'var(--bg2)' }}><input type="checkbox" checked={entry.signed} onChange={event => setEntry({ ...entry, signed: event.target.checked })} className="mt-0.5" /><span>Ich bestätige, dass ich diese Entspannungseinheit selbst durchgeführt habe.</span></label><button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold" style={{ background: 'var(--accent)', color: 'var(--bg2)' }}><Plus size={16} />{saving ? 'Speichert …' : 'Einheit speichern'}</button><p className="text-[11px] leading-relaxed" style={{ color: 'var(--dim)' }}>Der offizielle Nachweis verlangt Datum, Beschreibung und Unterschrift, aber keine Dauerangabe. Die Dauer ist hier freiwillige Zusatzinformation; die 15 Minuten aus der Stundenplanung beziehen sich auf den Entspannungsteil eines kombinierten Kurses. Der CSV-Export lässt die Unterschrift zur handschriftlichen Unterzeichnung frei.</p></form>
      {candidates.length > 0 && <div className="overflow-hidden rounded-2xl border" style={panel}><div className="p-4"><h3 className="font-bold">Vorhandene Sessions prüfen</h3><p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>Diese Einträge aus deinem Tagesprotokoll sind noch nicht als Ausbildungseinheit bestätigt. Übernimm nur Sessions, die du tatsächlich selbst durchgeführt hast.</p></div><div className="divide-y" style={{ borderColor: 'var(--line)' }}>{candidates.map((item, index) => {
        const candidateKey = practiceCandidateKey(item)
        return <div key={candidateKey || `${item.date}-${index}`} className="flex flex-wrap items-center gap-3 p-3"><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{item.technique || item.note || 'Unbenannte Praxis'}{Number(item.minutes) > 0 ? ` · ${item.minutes} Min.` : ''}</div><div className="text-xs" style={{ color: 'var(--muted)' }}>{item.date}</div></div><button disabled={markingId === candidateKey} onClick={() => confirmExistingPractice(item)} className="rounded-lg border px-3 py-2 text-xs font-bold disabled:opacity-50" style={{ borderColor: 'var(--line)', color: 'var(--accent)' }}>{markingId === candidateKey ? 'Speichert …' : 'Bestätigen'}</button></div>
      })}</div></div>}
      <div className="overflow-hidden rounded-2xl border" style={panel}><div className="flex items-center gap-2 border-b p-4 font-bold" style={{ borderColor: 'var(--line)' }}><BookOpen size={17} style={{ color: 'var(--accent)' }} />Protokoll</div>{loading ? <div className="p-4 text-sm" style={{ color: 'var(--muted)' }}>Lade Einträge …</div> : practice.length === 0 ? <div className="p-4 text-sm" style={{ color: 'var(--muted)' }}>Noch keine Praxiseinheiten dokumentiert.</div> : <div className="divide-y" style={{ borderColor: 'var(--line)' }}>{practice.map((item, index) => <div key={item.id || `${item.date}-${index}`} className="flex items-center gap-3 p-3"><div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>{index + 1}</div><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{item.technique || item.note || 'Entspannungseinheit'}{Number(item.minutes) > 0 ? ` · ${item.minutes} Min.` : ''}</div><div className="text-xs" style={{ color: 'var(--muted)' }}>{item.date}{item.technique && item.note ? ` · ${item.note}` : ''}</div></div><Check size={17} style={{ color: 'var(--green)' }} /></div>)}</div>}</div>
      <section id="training-print" aria-hidden="true">
        <header className="training-print-header">
          <div><div>Dipl. EntspannungstrainerIn · A-Lizenz</div><h1>Trainingsprotokoll</h1><p>Name: __________________________________________</p></div>
          <div className="training-print-date">Stand: {localToday()}</div>
        </header>
        <table className="training-print-table">
          <thead><tr><th aria-label="Nummer"></th><th>DATUM</th><th>BESCHREIBUNG</th><th>UNTERSCHRIFT</th></tr></thead>
          <tbody>{Array.from({ length: 30 }, (_, index) => {
            const item = practice[index]
            const description = item ? practiceDescription(item) : ''
            return <tr key={index}><td>{index + 1}</td><td>{item?.date || ''}</td><td>{description}</td><td></td></tr>
          })}</tbody>
        </table>
        <p className="training-print-note">Die Unterschriftsfelder sind für die handschriftliche Signatur vorgesehen.</p>
      </section>
    </>}
    {message && <div role="status" className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full px-4 py-2 text-xs font-bold shadow-xl" style={{ background: 'var(--accent)', color: 'var(--bg2)' }}>{message}</div>}
  </div>
}
