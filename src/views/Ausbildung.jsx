import { useEffect, useMemo, useState } from 'react'
import { BookOpen, ClipboardList, Download, Plus, Check, Clock3, Wind, HeartPulse, Sparkles, Play, Pause, SkipBack, SkipForward, Square } from 'lucide-react'
import { getRelaxSession, getRelaxSessionHistory, saveRelaxSession } from '@db'
import { downloadText, localToday } from '../lib/db/shared/utils.js'

const METHODS = [
  { name: 'Atemschulung', duration: '15–20 Min.', icon: Wind, focus: 'Atem wahrnehmen und ruhig begleiten', practice: 'Beobachte zunächst Brust- und Bauchatmung. Lade dazu ein, eine Hand auf den Bauch zu legen und die Bewegung ohne Druck wahrzunehmen. Ein sanft verlängertes Ausatmen kann angeboten werden; Atempausen und Rhythmen bleiben freiwillig.', adapt: 'Bei Schwindel, Unruhe oder Atemnot sofort zum natürlichen Atem zurückkehren. Keine forcierte Atmung oder langen Atemhalte als Entspannungsübung anleiten.', source: 'Atemschulung; Stundenplanung' },
  { name: 'Progressive Muskelrelaxation (PMR)', duration: '15–30 Min.', icon: HeartPulse, focus: 'Spannung und Loslassen im Wechsel unterscheiden', practice: 'Eine Muskelgruppe kurz und angenehm anspannen, dann lösen und den Unterschied nachspüren. Vom Üben einzelner Gruppen kann schrittweise zu kürzeren Formen übergeleitet werden. Die Wahrnehmung ist wichtiger als eine perfekte Ausführung.', adapt: 'Betroffene, schmerzhafte oder verletzte Bereiche auslassen; Anspannung stets dosieren. Bei Unsicherheit eine entspannte Beobachtung ohne Anspannen wählen.', source: 'Progressive Muskelrelaxation; Stundenplanung' },
  { name: 'Autogenes Training', duration: '20–30 Min.', icon: Sparkles, focus: 'Eine systematische Entspannungsmethode kennenlernen', practice: 'Die Ausbildungsunterlagen führen Autogenes Training als Methode für systematische Kurse an. Die genaue Übungsfolge wird im eigenen Kursmaterial erarbeitet und angeleitet; in der Stunde Ziel, Ablauf und freiwillige Teilnahme vorab erklären.', adapt: 'Bei Unwohlsein Augen öffnen, Haltung ändern oder Übung beenden lassen. Keine Wirkung versprechen und individuelle Reaktionen ernst nehmen.', source: 'Stundenplanung; Methodenübersicht im Ausbildungsprotokoll' },
  { name: 'Phantasiereise & innere Bilder', duration: '20–30 Min.', icon: BookOpen, focus: 'Mit einer ruhigen, freiwilligen Vorstellungsübung arbeiten', practice: 'Eine klare, langsam gesprochene Reise mit Pausen und neutralen Wahlmöglichkeiten vorbereiten. Teilnehmende dürfen Bilder verändern, die Augen offen halten oder jederzeit aussteigen.', adapt: 'Keine belastenden oder überraschenden Szenen vorgeben. Eine Rücknahme mit Bewegung und Orientierung im Raum fest einplanen.', source: 'Methodenübersicht; Stundenplanung' },
  { name: 'Yoga · Asana-Praxis', duration: '30–60 Min.', icon: Wind, focus: 'Haltungen, Atem und Körperwahrnehmung verbinden', practice: 'Asanas mit Vorübungen und passenden Variationen vermitteln. Die Ausbildungsnotiz betont eine angenehme Ausführung, Wohlbefinden und das Erlernen unter Aufsicht. Eine ruhige Stunde kann von einer stabilen Standhaltung in Bewegung, Ausgleich und Ruhe führen.', adapt: 'Anspruchsvolle Haltungen nur entsprechend der eigenen Anleitungskompetenz unterrichten. Teilnehmende wählen eine angenehme Variante oder setzen aus; die Übungssammlung ersetzt keine praktische Einschulung.', source: 'Ausbildungsnotiz „Grundübungen Yoga“', outlineTitle: 'Asanas aus der Ausbildungsnotiz', outline: [
    ['Tadasana · Berghaltung', 'Stabilität finden; als ruhigen Einstieg und zur bewussten Standwahrnehmung nutzen.'],
    ['Vrksasana · Baum', 'Gleichgewicht und konzentrierte Ausrichtung; persönliche Standvariante wählen.'],
    ['Adho Mukha Svanasana · Herabschauender Hund', 'Länge und Dehnung wahrnehmen; die Notiz nennt gebeugte Beine und bei Schulterverletzungen eine Knie-Variante oder kürzere Dauer.'],
    ['Virabhadrasana II · Krieger II', 'Standhaltung mit seitlich geöffneten Armen; die Notiz beschreibt acht Atemzüge je Seite.'],
    ['Balasana · Stellung des Kindes', 'Ruheposition zum Nachspüren; laut Notiz kann eine Decke oder ein Block unterstützen.'],
    ['Setu Bandhasana · unterstützte Brücke', 'Rückenlage mit aufgestellten Füßen und Block als Unterstützung; die Notiz betont eine sanfte, angenehme Variante.'],
    ['Viparita Karani · unterstützte Umkehrhaltung', 'In der Ausbildungsnotiz als Entspannungsposition beschrieben; wegen der Umkehrlage nur nach praktischer Einschulung und mit passenden Wahlmöglichkeiten einplanen.'],
    ['Cat & Cow · Katze und Kuh', 'Sanfte Bewegung im Vierfüßlerstand mit dem Atemrhythmus verbinden.'],
    ['Sukhasana · bequemer Sitz', 'Unterstützte Sitzposition für Atem- und Meditationsübungen; laut Notiz sollen Sitz und Haltung angenehm sein.'],
    ['Shavasana · Abschlussruhe', 'Die Yoga-Notiz beschreibt fünf bis 15 Minuten freie Atemwahrnehmung am Ende der Einheit; anschließend behutsam zurücknehmen.'],
  ] },
  { name: 'Pilates · Basisprogramm', duration: '30–60 Min.', icon: HeartPulse, focus: 'Zentrum, Atmung und kontrollierte Ganzkörperbewegung verbinden', practice: 'Die Kursnotiz ordnet das Basisprogramm nach Ausgangspositionen und Bewegungszielen. Bewegungen werden kontrolliert, mit bewusster Atmung und ökonomischem Krafteinsatz angeleitet. Für eine Entspannungseinheit die Belastung angemessen dosieren und Zeit zum Nachspüren geben.', adapt: 'Anleitungen aus dem praktischen Unterricht verwenden. Keine Übung erzwingen; bei Unsicherheit eine einfachere Ausgangsposition wählen und individuelle Bewegungsqualität vor Wiederholungszahl stellen.', source: 'Ausbildungsnotiz „Grundübungen Pilates“', outlineTitle: 'Acht Bewegungskategorien des Basisprogramms', outline: [
    ['Rückenlage', 'Körperzentrum wahrnehmen und Atmung mit kontrollierten Arm- oder Beinbewegungen verbinden.'],
    ['Seitlage', 'Stabilisation und axiale Länge mit einer kleineren Unterstützungsfläche üben.'],
    ['Sitz', 'Aufrichtung, Rumpforganisation und ruhige Atmung erkunden.'],
    ['Bauchlage', 'Rumpfbewegung mit Schwerpunkt Rücken und kontrollierter Extension.'],
    ['Stütz / Gewichtsübernahme der Arme', 'Arme und Rumpf verbinden; Stützkraft und Kopf-Nacken-Organisation beachten.'],
    ['Ganzkörperintegration', 'Unterschiedliche Körperabschnitte koordiniert und kontrolliert bewegen.'],
    ['Überkopforganisation', 'Umkehrhaltungen; laut Kursnotiz nur mit ausreichender Beweglichkeit und dynamischer Stabilität.'],
    ['Stand', 'Ausrichtung und Gleichgewicht als Grundlage natürlicher Fortbewegung wahrnehmen.'],
  ] },
  { name: 'Stretching & Assisted Stretching', duration: '20–30 Min.', icon: Clock3, focus: 'Beweglichkeit achtsam und individuell erkunden', practice: 'Vorbereiten, Bewegungsumfang (ROM) wahrnehmen, langsam in eine angenehme Dehnung gehen und ruhig weiteratmen. Bei Partnerarbeit fortlaufend Kontakt und Feedback halten; Übergänge fließend gestalten.', adapt: 'Nicht in Schmerz oder gegen Widerstand dehnen. Eignung, Tagesform und mögliche Einschränkungen vorher klären; bei Unsicherheit Übung auslassen.', source: 'Assisted Stretching' },
  { name: 'Entspannungsorientierte Ausdauer', duration: '20–45 Min.', icon: HeartPulse, focus: 'Rhythmische, moderate Bewegung als Ausgleich nutzen', practice: 'Eine passende zyklische Bewegungsform und eine ruhige Umgebung wählen. Leichtes Tempo, lockeres Sprechen und fehlender Zeitdruck helfen, die Belastung angenehm zu halten.', adapt: 'Die individuelle Belastbarkeit entscheidet. Bei Beschwerden abbrechen und fachliche Abklärung empfehlen.', source: 'Entspannung & Ausdauer' },
  { name: 'Achtsamkeit & Meditation', duration: '15–30 Min.', icon: Sparkles, focus: 'Aufmerksamkeit freundlich im gegenwärtigen Erleben halten', practice: 'Einen einfachen Anker wie Atem, Geräusche oder Kontakt zum Boden anbieten. Abschweifen ist normal; die Aufmerksamkeit kann ohne Bewertung zurückkehren.', adapt: 'Augen offen, Bewegung oder ein äußerer Anker sind gleichwertige Optionen.', source: 'Methodenübersicht; Ausbildungsnotizen' },
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
  { id: 'ankommen', name: 'Ankommen & Befinden', minutes: 5, detail: 'Begrüßung, Ziel und Ablauf nennen; Befinden erfragen.' },
  { id: 'einstimmung', name: 'Einstimmung & Übungseinschulung', minutes: 8, detail: 'Methode und Herkunft kurz vorstellen, Position finden, erklären und ausprobieren.' },
  { id: 'hauptteil', name: 'Hauptteil', minutes: 35, detail: 'Übungen methodisch aufbauen, Pausen lassen und individuelle Varianten anbieten.' },
  { id: 'ruhe', name: 'Nachspüren', minutes: 5, detail: 'Stille oder leise Instrumentalmusik; Zeit für die eigene Wahrnehmung geben.' },
  { id: 'ruecknahme', name: 'Rücknahme & Abschluss', minutes: 7, detail: 'Langsam aktivieren, bewegen und orientieren; Feedback und Verabschiedung.' },
]
const PREPARATION_CHECKS = [
  ['ziel', 'Stundenziel und Schwerpunkt sind klar.'],
  ['raum', 'Raum ist ruhig, gelüftet und angenehm temperiert.'],
  ['material', 'Matten, Decken und optionale Hilfsmittel sind bereit.'],
  ['gruppe', 'Platz, Privatsphäre und individuelle Wahlmöglichkeiten sind geklärt.'],
  ['rueckkehr', 'Genügend Zeit für Rücknahme und Abschluss ist eingeplant.'],
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
    question: 'Was beschreibt Lazarus’ transaktionales Stressmodell?',
    answers: ['Stress wird ausschließlich durch die Stärke des äußeren Reizes bestimmt.', 'Bewertung einer Anforderung und Einschätzung eigener Bewältigungsressourcen beeinflussen das Stresserleben.', 'Stress folgt bei allen Menschen einem identischen zeitlichen Ablauf.'],
    correct: 1,
    why: 'Die Ausbildungsnotiz beschreibt primäre und sekundäre Bewertung sowie das Verhältnis von Anforderungen und verfügbaren Ressourcen.',
    source: 'Stresstheorie · Transaktionales Modell',
  },
  {
    question: 'Wofür stehen die Buchstaben im SORKC-Modell?',
    answers: ['Situation, Orientierung, Reiz, Körper, Coping.', 'Stimulus, Organismus, Reaktion, Konsequenz, Kontingenz.', 'Stress, Output, Regulation, Kraft, Konzentration.'],
    correct: 1,
    why: 'SORKC gliedert Auslöser, individuelle Voraussetzungen, Reaktion, Folgen und deren Kontingenz.',
    source: 'Stresstheorie · SORKC-Modell',
  },
]
const STORAGE_KEY = 'relax-training-plan-v1'
const panel = { background: 'var(--card)', borderColor: 'var(--line)' }
const input = { background: 'var(--bg2)', borderColor: 'var(--line)', color: 'var(--ink)' }

function csvCell(value) { return `"${String(value ?? '').replaceAll('"', '""')}"` }

export default function Ausbildung() {
  const [section, setSection] = useState('start')
  const [method, setMethod] = useState(null)
  const [pmrStep, setPmrStep] = useState(null)
  const [plan, setPlan] = useState(() => {
    const defaults = { title: 'Ruhig ankommen', focus: '', method: METHODS[0].name, blocks: DEFAULT_BLOCKS, checks: {}, reflection: '' }
    try { const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)); return stored ? { ...defaults, ...stored, checks: stored.checks || {}, reflection: stored.reflection || '' } : defaults }
    catch { return defaults }
  })
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [markingId, setMarkingId] = useState(null)
  const [delivery, setDelivery] = useState(null)
  const [checkIndex, setCheckIndex] = useState(0)
  const [checkAnswer, setCheckAnswer] = useState(null)
  const [checkScore, setCheckScore] = useState(0)
  const [message, setMessage] = useState('')
  const [entry, setEntry] = useState({ date: localToday(), technique: METHODS[0].name, minutes: 20, description: '', signed: false })

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(plan)) }, [plan])
  useEffect(() => {
    if (!delivery?.running) return undefined
    const timer = window.setInterval(() => setDelivery(current => {
      if (!current || !current.running) return current
      if (current.remaining <= 1) return { ...current, remaining: 0, running: false }
      return { ...current, remaining: current.remaining - 1 }
    }), 1000)
    return () => window.clearInterval(timer)
  }, [delivery?.running])
  useEffect(() => {
    let alive = true
    getRelaxSessionHistory(365).then(rows => { if (alive) setHistory(rows || []) }).catch(() => { if (alive) setHistory([]) }).finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  const practice = useMemo(() => history.flatMap(day => (day.items || []).filter(item => item.trainingUnit === true).map(item => ({ ...item, date: day.date }))).sort((a, b) => a.date.localeCompare(b.date)), [history])
  const candidates = useMemo(() => history.flatMap(day => (day.items || []).filter(item => item.trainingUnit !== true && Number(item.minutes) >= 15).map(item => ({ ...item, date: day.date }))).sort((a, b) => a.date.localeCompare(b.date)), [history])
  const totalMinutes = plan.blocks.reduce((sum, block) => sum + (Number(block.minutes) || 0), 0)
  const completed = practice.filter(item => Number(item.minutes) >= 15 && item.signed === true).length

  function notify(text) { setMessage(text); window.setTimeout(() => setMessage(''), 2400) }
  function updateBlock(id, patch) { setPlan(current => ({ ...current, blocks: current.blocks.map(block => block.id === id ? { ...block, ...patch } : block) })) }
  function beginDelivery() {
    if (!plan.blocks.length) return
    setDelivery({ title: plan.title, blocks: plan.blocks.map(block => ({ ...block })), index: 0, remaining: Math.max(1, Number(plan.blocks[0].minutes) || 1) * 60, running: false })
  }
  function changeDeliveryBlock(index) {
    if (!delivery) return
    if (index >= delivery.blocks.length) { setDelivery(null); notify('Einheit abgeschlossen. Zeit fürs Feedback einplanen.'); return }
    const block = delivery.blocks[index]
    setDelivery(current => ({ ...current, index, remaining: Math.max(1, Number(block.minutes) || 1) * 60, running: false }))
  }
  function formatTimer(seconds) { return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}` }
  function answerCheck(index) {
    if (checkAnswer !== null) return
    setCheckAnswer(index)
    if (index === LEARNING_CHECK[checkIndex].correct) setCheckScore(score => score + 1)
  }
  function nextCheck() { setCheckIndex(index => index + 1); setCheckAnswer(null) }
  function resetCheck() { setCheckIndex(0); setCheckAnswer(null); setCheckScore(0) }

  async function addPractice(event) {
    event.preventDefault()
    if (!entry.signed) return notify('Bitte die Durchführung bestätigen.')
    if (Number(entry.minutes) < 15) return notify('Für den Ausbildungsnachweis mindestens 15 Minuten eintragen.')
    setSaving(true)
    try {
      const current = await getRelaxSession(entry.date)
      const items = current?.items || []
      items.push({ id: crypto.randomUUID?.() || String(Date.now()), technique: entry.technique, minutes: Number(entry.minutes), mood_before: 3, mood_after: 3, note: entry.description.trim(), trainingUnit: true, signed: true })
      await saveRelaxSession(entry.date, items)
      const rows = await getRelaxSessionHistory(365)
      setHistory(rows || [])
      setEntry(value => ({ ...value, date: localToday(), description: '', signed: false }))
      notify('Einheit gespeichert')
    } catch { notify('Speichern fehlgeschlagen. Bitte Verbindung prüfen.') }
    finally { setSaving(false) }
  }

  async function confirmExistingPractice(candidate) {
    const confirmed = window.confirm(`Bestätigst du, dass du „${candidate.technique}“ am ${candidate.date} mindestens 15 Minuten selbst durchgeführt hast und diese Session für den Ausbildungsnachweis zählen soll?`)
    if (!confirmed) return
    setMarkingId(candidate.id)
    try {
      const current = await getRelaxSession(candidate.date)
      const updated = (current?.items || []).map(item => item.id === candidate.id ? { ...item, trainingUnit: true, signed: true } : item)
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
        ? [index + 1, item.date, `${item.technique} (${item.minutes} min)${item.note ? ` — ${item.note}` : ''}`, item.signed ? '✓' : '']
        : [index + 1, '', '', ''])
    }
    downloadText(`entspannungstrainer-praxis-${localToday()}.csv`, rows.map(row => row.map(csvCell).join(';')).join('\r\n'), 'text/csv;charset=utf-8')
  }

  if (delivery) {
    const block = delivery.blocks[delivery.index]
    const isLastBlock = delivery.index === delivery.blocks.length - 1
    return <div className="space-y-4 pb-4">
      <section className="rounded-3xl border p-5 text-center" style={{ ...panel, background: 'linear-gradient(160deg, color-mix(in srgb, var(--accent) 20%, var(--card)), var(--card))' }}>
        <button onClick={() => setDelivery(null)} className="float-left rounded-lg border p-2 text-xs font-semibold" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>Beenden</button>
        <div className="pt-10 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>{delivery.title} · Abschnitt {delivery.index + 1} von {delivery.blocks.length}</div>
        <h1 className="mt-3 text-2xl font-black">{block.name}</h1>
        <div className="my-6 font-mono text-6xl font-black tabular-nums" role="timer" aria-live="off">{formatTimer(delivery.remaining)}</div>
        <p className="mx-auto max-w-md text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{block.detail}</p>
        {delivery.remaining === 0 && <div className="mt-4 rounded-xl p-3 text-sm font-semibold" style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>Zeit für diesen Abschnitt ist um. Wechsle weiter, wenn es für die Gruppe passt.</div>}
      </section>
      <div className="flex items-center justify-center gap-3">
        <button aria-label="Vorheriger Abschnitt" disabled={delivery.index === 0} onClick={() => changeDeliveryBlock(delivery.index - 1)} className="rounded-xl border p-3 disabled:opacity-40" style={{ borderColor: 'var(--line)' }}><SkipBack size={20} /></button>
        <button onClick={() => setDelivery(current => current.remaining === 0 ? { ...current, remaining: Math.max(1, Number(current.blocks[current.index].minutes) || 1) * 60, running: true } : { ...current, running: !current.running })} className="flex min-w-36 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold" style={{ background: 'var(--accent)', color: 'var(--bg2)' }}>{delivery.running ? <Pause size={18} /> : <Play size={18} />}{delivery.running ? 'Pause' : delivery.remaining === 0 ? 'Timer erneut' : 'Timer starten'}</button>
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
        <div className="flex flex-nowrap gap-2 overflow-x-auto no-scrollbar">{[['start', 'Überblick'], ['grundlagen', 'Grundlagen'], ['selbstcheck', 'Lerncheck'], ['methoden', 'Methoden'], ['planung', 'Stunde planen'], ['nachweis', 'Praxisnachweis']].map(([id, label]) => <button key={id} onClick={() => { setSection(id); setMethod(null) }} aria-pressed={section === id} className="shrink-0 rounded-full border px-3 py-2 text-xs font-bold" style={{ borderColor: section === id ? 'var(--accent)' : 'var(--line)', color: section === id ? 'var(--accent)' : 'var(--muted)', background: section === id ? 'var(--accent-glow)' : 'transparent' }}>{label}</button>)}</div>
      </div>
    </section>

    {section === 'start' && <>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border p-4" style={panel}><div className="text-xs" style={{ color: 'var(--muted)' }}>Praxisnachweis</div><div className="mt-1 text-2xl font-black">{Math.min(completed, 30)}<span className="text-sm font-semibold" style={{ color: 'var(--muted)' }}> / 30</span></div><div className="mt-2 h-2 overflow-hidden rounded-full" style={{ background: 'var(--bg2)' }}><div className="h-full rounded-full" style={{ width: `${Math.min(100, completed / 30 * 100)}%`, background: 'var(--accent)' }} /></div></div>
        <div className="rounded-2xl border p-4" style={panel}><div className="text-xs" style={{ color: 'var(--muted)' }}>Stundenentwurf</div><div className="mt-1 text-2xl font-black">{totalMinutes}<span className="text-sm font-semibold" style={{ color: 'var(--muted)' }}> Min.</span></div><div className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>Richtwert: 60 Minuten</div></div>
      </div>
      <div className="rounded-2xl border p-4" style={panel}><h2 className="font-bold">Worum es im Modul geht</h2><p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>Entspannungstraining verbindet Grundlagen zu Stress und Erholung mit der passenden Auswahl und verständlichen Anleitung von Übungen. Als Trainer:in gibst du einen sicheren Rahmen, vermittelst Ruhe und passt die Stunde an die Gruppe an.</p><div className="mt-4 grid gap-2 sm:grid-cols-2">{[
        ['Verstehen', 'Stress, Belastung, Ressourcen und individuelle Reaktionen einordnen.'], ['Anleiten', 'Methode erklären, vormachen, üben lassen und Körperwahrnehmung fördern.'], ['Gestalten', 'Ziel, Schwerpunkt, Zeit und ruhige Übergänge bewusst planen.'], ['Reflektieren', 'Erleben erfragen, Feedback aufnehmen und die nächste Stunde anpassen.'],
      ].map(([title, text]) => <div className="rounded-xl p-3" key={title} style={{ background: 'var(--bg2)' }}><div className="text-sm font-bold">{title}</div><div className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{text}</div></div>)}</div></div>
      <div className="rounded-2xl border p-4" style={panel}><h2 className="font-bold">Didaktische Leitlinien</h2><ul className="mt-2 space-y-2 text-sm" style={{ color: 'var(--muted)' }}><li>• Ziel und Ablauf zu Beginn verständlich machen; Übungen und ihre Methode einordnen.</li><li>• Ruhig sprechen, Pausen lassen und unterschiedliche Körperempfindungen zulassen.</li><li>• Körperwahrnehmung zählt mehr als korrekte oder vergleichbare Ausführung.</li><li>• Raum, Temperatur, Privatsphäre und genügend Zeit für eine sanfte Rücknahme vorbereiten.</li><li>• Ein gemeinsamer Beginn und Abschluss schaffen Orientierung; Feedback gehört dazu.</li></ul><p className="mt-3 text-xs" style={{ color: 'var(--dim)' }}>Grundlage: Ausbildungsnotiz „Stundenplanung“.</p></div>
      <div className="flex gap-3"><button onClick={() => setSection('planung')} className="flex-1 rounded-xl px-4 py-3 text-sm font-bold" style={{ background: 'var(--accent)', color: 'var(--bg2)' }}>Einheit entwerfen</button><button onClick={() => setSection('methoden')} className="flex-1 rounded-xl border px-4 py-3 text-sm font-bold" style={{ borderColor: 'var(--line)' }}>Methoden ansehen</button></div>
    </>}

    {section === 'grundlagen' && <>
      <div className="rounded-2xl border p-4" style={panel}><div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Theorie · Stresstheorie</div><h2 className="mt-1 text-lg font-black">Stress verstehen, statt ihn zu bewerten</h2><p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>Stress beschreibt Anpassungsreaktionen auf Anforderungen. Kurzfristige Aktivierung kann hilfreich sein; anhaltende Belastung kann Erholung erschweren. Erleben und Umgang unterscheiden sich von Person zu Person.</p><div className="mt-3 grid gap-2">{[
        ['Selye · Anpassungsverlauf', 'Alarm, Widerstand und Erschöpfung beschreiben einen möglichen Verlauf bei anhaltender Belastung. Das Modell ist eine Orientierung, keine individuelle Diagnose.'],
        ['Lazarus & Folkman · Bewertung und Ressourcen', 'Stress hängt auch davon ab, wie eine Situation eingeschätzt wird und welche Bewältigungsmöglichkeiten verfügbar erscheinen.'],
        ['Salutogenese · Ressourcen stärken', 'Der Blick richtet sich auf Verständlichkeit, Handhabbarkeit und Sinn sowie auf vorhandene persönliche und soziale Ressourcen.'],
        ['SORKC · Verhalten im Kontext', 'Situation, Organismus, Reaktion, Konsequenz und Kontingenz helfen, Auslöser und Muster strukturiert zu betrachten.'],
      ].map(([title, text]) => <div key={title} className="rounded-xl p-3" style={{ background: 'var(--bg2)' }}><div className="text-sm font-bold">{title}</div><p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{text}</p></div>)}</div><p className="mt-3 text-xs" style={{ color: 'var(--dim)' }}>Ausbildungsbezug: „Stresstheorie“. Modelle erklären Zusammenhänge auf unterschiedliche Weise.</p></div>
      <div className="rounded-2xl border p-4" style={panel}><div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Theorie · Körper & Erholung</div><h2 className="mt-1 text-lg font-black">Aktivierung und Erholung</h2><p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>Die Ausbildungsnotizen unterscheiden eine schnelle Stressreaktion (Sympathikus/SAM-System) und länger anhaltende hormonelle Regulation (HPA-Achse). Entspannungsverfahren, angemessene Bewegung und Erholung sind mögliche präventive Ressourcen. Eine Übung oder ein Gefühl allein misst keine Hormone und beweist keine physiologische Wirkung.</p><div className="mt-3 rounded-xl p-3" style={{ background: 'var(--bg2)' }}><div className="text-sm font-bold">Trainer:innen-Perspektive</div><p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>Befinden erfragen, Selbstwahrnehmung fördern und Erleben offen lassen. Aussagen wie „das senkt bei dir Cortisol“ oder „dein Vagus ist aktiviert“ aus einer einzelnen Einheit vermeiden.</p></div></div>
      <div className="rounded-2xl border p-4" style={panel}><div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Anwendung · Lebensalltag</div><h2 className="mt-1 text-lg font-black">Bewegung, Essen, Wirbelsäule</h2><div className="mt-3 space-y-3">{[
        ['Entspannung & Ausdauer', 'Die Unterlagen empfehlen gleichmäßige, moderate und individuell passende Ausdauerbewegung ohne Leistungsdruck. Umgebung, Rhythmus und Freude an der Aktivität zählen mit.'],
        ['Entspannung & Ernährung', 'Stress kann Essensrhythmus, Auswahl und bewusstes Genießen beeinflussen. Im präventiven Gespräch stehen alltagstaugliche Routinen und Wahrnehmung im Vordergrund; Nahrungsergänzung oder Heilversprechen sind kein Ersatz für qualifizierte Beratung.'],
        ['Entspannung & Wirbelsäule', 'Die Ausbildungsnotizen verbinden Körperwahrnehmung, Bewegungsfreude und psychosoziale Einflüsse. Im Kurs werden angenehme Bewegungsoptionen angeboten; Schmerzdiagnostik und Behandlung gehören in qualifizierte Hände.'],
      ].map(([title, text]) => <div key={title}><h3 className="text-sm font-bold">{title}</h3><p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{text}</p></div>)}</div></div>
      <div className="rounded-2xl border p-4" style={{ ...panel, borderColor: 'color-mix(in srgb, var(--orange) 45%, var(--line))' }}><h2 className="font-bold">Präventive Trainerrolle</h2><p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>Du gestaltest Lern- und Bewegungsangebote, keine Diagnose oder Therapie. Teilnahme, Körperkontakt und Augen schließen bleiben freiwillig. Bei Schmerzen, deutlichem Unwohlsein oder gesundheitlichen Fragen Übung stoppen, eine passende Alternative anbieten und bei Bedarf an medizinische Fachpersonen verweisen.</p></div>
    </>}

    {section === 'selbstcheck' && <section className="rounded-2xl border p-5" style={panel}>
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
          <button onClick={() => setMethod(null)} className="text-xs font-bold" style={{ color: 'var(--accent)' }}>← Alle Methoden</button>
          <div className="mt-3 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>Ausbildungsorientierung · {method.duration}</div>
          <h2 className="mt-1 text-xl font-black">{method.name}</h2>
          <div className="mt-4 rounded-xl p-3 text-sm font-semibold" style={{ background: 'var(--bg2)' }}>{method.focus}</div>
          <h3 className="mt-4 text-sm font-bold">Anleitungsidee</h3>
          <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{method.practice}</p>
          <h3 className="mt-4 text-sm font-bold">Anpassung & Selbstbestimmung</h3>
          <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{method.adapt}</p>
          {method.name === 'Progressive Muskelrelaxation (PMR)' && (
            <section className="mt-4 rounded-xl border p-4 space-y-3" style={{ background: 'var(--bg2)', borderColor: 'var(--line)' }} aria-label="Geführte PMR-Langform">
              <div className="text-sm font-bold">PMR-Langform · 20 Schritte</div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>Angelehnt an die lokale FlexyFit-Academy-Handout-Zusammenfassung (20–30 Minuten). Die Schritte laufen manuell: Lass Zeit zum Anspannen und Nachspüren. Nur sanft und schmerzfrei anspannen; betroffene Bereiche überspringen oder die Übung ohne Anspannung beobachten.</p>
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
          </div>}
          <p className="mt-4 border-t pt-3 text-xs" style={{ borderColor: 'var(--line)', color: 'var(--dim)' }}>Ausbildungsbezug: {method.source}. Praxis immer an Person, Tagesform und Qualifikation anpassen.</p>
          {method.name === 'Atemschulung' && <button onClick={() => onNavigate?.('atem')} className="mt-4 w-full rounded-xl border px-4 py-3 text-sm font-bold" style={{ borderColor: 'var(--line)', color: 'var(--accent)' }}>Zur geführten Atemübung</button>}
          <button onClick={() => { setEntry(current => ({ ...current, technique: method.name })); setSection('nachweis') }} className="mt-2 w-full rounded-xl px-4 py-3 text-sm font-bold" style={{ background: 'var(--accent)', color: 'var(--bg2)' }}>Methode im Ausbildungsnachweis dokumentieren</button>
        </article>
      ) : (
        <div className="space-y-3">
          {METHODS.map(item => { const Icon = item.icon; return <button key={item.name} onClick={() => setMethod(item)} className="flex w-full items-center gap-3 rounded-2xl border p-4 text-left" style={panel}><div className="rounded-xl p-2" style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}><Icon size={19} /></div><div className="min-w-0 flex-1"><div className="font-bold">{item.name}</div><div className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>{item.duration} · {item.focus}</div></div><span style={{ color: 'var(--dim)' }}>›</span></button>})}
          <p className="px-1 text-xs leading-relaxed" style={{ color: 'var(--dim)' }}>Autogenes Training und Phantasiereisen sind im Ausbildungsprotokoll genannt; die konkrete Übungsfolge bitte nach dem Original-Kursmaterial unterrichten.</p>
        </div>
      )}
    </>}

    {section === 'planung' && <>
      <div className="rounded-2xl border p-4" style={panel}><div className="flex items-center gap-2"><ClipboardList size={19} style={{ color: 'var(--accent)' }} /><h2 className="font-bold">Stundenentwurf</h2></div><label className="mt-4 block text-xs" style={{ color: 'var(--muted)' }}>Titel<input value={plan.title} onChange={event => setPlan({ ...plan, title: event.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" style={input} /></label><label className="mt-3 block text-xs" style={{ color: 'var(--muted)' }}>Stundenziel<textarea value={plan.focus} onChange={event => setPlan({ ...plan, focus: event.target.value })} placeholder="Was sollen die Teilnehmenden wahrnehmen oder kennenlernen?" rows={2} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" style={input} /></label><label className="mt-3 block text-xs" style={{ color: 'var(--muted)' }}>Schwerpunktmethode<select value={plan.method} onChange={event => setPlan({ ...plan, method: event.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" style={input}>{METHODS.map(item => <option key={item.name}>{item.name}</option>)}</select></label></div>
      <div className="space-y-3">{plan.blocks.map((block, index) => <div className="rounded-2xl border p-4" style={panel} key={block.id}><div className="flex items-start gap-3"><div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black" style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>{index + 1}</div><div className="min-w-0 flex-1"><input value={block.name} onChange={event => updateBlock(block.id, { name: event.target.value })} className="w-full rounded-lg border px-2 py-1 text-sm font-bold" style={input} /><textarea value={block.detail} onChange={event => updateBlock(block.id, { detail: event.target.value })} rows={2} className="mt-2 w-full rounded-lg border px-2 py-1 text-xs leading-relaxed" style={input} /></div><label className="text-center text-[10px]" style={{ color: 'var(--muted)' }}><input type="number" min="0" max="120" value={block.minutes} onChange={event => updateBlock(block.id, { minutes: event.target.value })} className="w-14 rounded-lg border px-1 py-2 text-center text-sm font-bold" style={input} />Min.</label></div></div>)}</div>
      <div className="rounded-2xl border p-4" style={panel}><div className="flex items-center justify-between font-bold"><span>Gesamtdauer</span><span style={{ color: totalMinutes === 60 ? 'var(--green)' : 'var(--accent)' }}>{totalMinutes} Minuten</span></div><p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>Der Entwurf folgt dem Aufbau Ankommen → Einschulung → Hauptteil → Nachspüren → Rücknahme. In Kombination mit anderen Trainingsformen kann der Entspannungsteil kürzer sein; passe alle Zeiten an die Gruppe an.</p><div className="mt-3 flex items-center gap-2 text-xs" style={{ color: 'var(--green)' }}><Check size={15} />Entwurf wird automatisch auf diesem Gerät gespeichert.</div><button onClick={beginDelivery} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold" style={{ background: 'var(--accent)', color: 'var(--bg2)' }}><Play size={16} />Stunde durchführen</button></div>
      <div className="rounded-2xl border p-4" style={panel}><h2 className="font-bold">Vor der Stunde</h2><p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>Rahmenbedingungen aus der Stundenplanung abhaken.</p><div className="mt-3 space-y-2">{PREPARATION_CHECKS.map(([id, label]) => <label key={id} className="flex items-start gap-2 rounded-xl p-3 text-sm" style={{ background: 'var(--bg2)' }}><input type="checkbox" checked={Boolean(plan.checks?.[id])} onChange={event => setPlan(current => ({ ...current, checks: { ...current.checks, [id]: event.target.checked } }))} className="mt-0.5" /><span>{label}</span></label>)}</div></div>
      <div className="rounded-2xl border p-4" style={panel}><h2 className="font-bold">Nach der Stunde reflektieren</h2><p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>Was hat die Gruppe zurückgemeldet? Was möchtest du beim nächsten Mal anpassen?</p><textarea value={plan.reflection} onChange={event => setPlan(current => ({ ...current, reflection: event.target.value }))} rows={4} maxLength={1500} className="mt-3 w-full rounded-xl border px-3 py-2 text-sm" style={input} placeholder="Beobachtungen, Feedback, nächster Schritt …" /></div>
    </>}

    {section === 'nachweis' && <>
      <div className="rounded-2xl border p-4" style={panel}><div className="flex items-center justify-between gap-3"><div><h2 className="font-bold">30 Praxiseinheiten</h2><p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>Dokumentiere Datum, Methode, Dauer und deine Bestätigung.</p></div><button onClick={exportPractice} className="flex items-center gap-1 rounded-lg border px-2 py-2 text-xs font-bold" style={{ borderColor: 'var(--line)' }}><Download size={14} /> CSV</button></div><div className="mt-4 flex items-end justify-between"><div className="text-3xl font-black">{Math.min(completed, 30)}<span className="text-base" style={{ color: 'var(--muted)' }}> / 30</span></div><div className="text-right text-xs" style={{ color: 'var(--muted)' }}>{Math.max(0, 30 - completed)} noch offen</div></div><div className="mt-2 h-2 overflow-hidden rounded-full" style={{ background: 'var(--bg2)' }}><div className="h-full rounded-full" style={{ width: `${Math.min(100, completed / 30 * 100)}%`, background: 'var(--green)' }} /></div></div>
      <form onSubmit={addPractice} className="space-y-3 rounded-2xl border p-4" style={panel}><h3 className="font-bold">Einheit eintragen</h3><div className="grid grid-cols-2 gap-3"><label className="text-xs" style={{ color: 'var(--muted)' }}>Datum<input type="date" required value={entry.date} onChange={event => setEntry({ ...entry, date: event.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" style={input} /></label><label className="text-xs" style={{ color: 'var(--muted)' }}>Dauer (Min.)<input type="number" required min="15" max="240" value={entry.minutes} onChange={event => setEntry({ ...entry, minutes: event.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" style={input} /></label></div><label className="block text-xs" style={{ color: 'var(--muted)' }}>Methode<select value={entry.technique} onChange={event => setEntry({ ...entry, technique: event.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" style={input}>{METHODS.map(item => <option key={item.name}>{item.name}</option>)}</select></label><label className="block text-xs" style={{ color: 'var(--muted)' }}>Beschreibung (optional)<input value={entry.description} onChange={event => setEntry({ ...entry, description: event.target.value })} maxLength={300} placeholder="z. B. PMR, Grundform, zu Hause" className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" style={input} /></label><label className="flex items-start gap-2 rounded-xl p-3 text-xs leading-relaxed" style={{ background: 'var(--bg2)' }}><input type="checkbox" checked={entry.signed} onChange={event => setEntry({ ...entry, signed: event.target.checked })} className="mt-0.5" /><span>Ich bestätige, dass ich diese Entspannungseinheit selbst durchgeführt habe.</span></label><button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold" style={{ background: 'var(--accent)', color: 'var(--bg2)' }}><Plus size={16} />{saving ? 'Speichert …' : 'Einheit speichern'}</button><p className="text-[11px] leading-relaxed" style={{ color: 'var(--dim)' }}>Für den Ausbildungsnachweis zählt eine bestätigte Einheit ab 15 Minuten. Der Export ist eine einfache CSV-Tabelle und ersetzt kein offizielles Formular, falls dieses verlangt wird.</p></form>
      {candidates.length > 0 && <div className="overflow-hidden rounded-2xl border" style={panel}><div className="p-4"><h3 className="font-bold">Vorhandene Sessions prüfen</h3><p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>Diese Einträge dauern mindestens 15 Minuten, sind aber noch nicht bestätigt. Übernimm nur Sessions, die du tatsächlich selbst durchgeführt hast.</p></div><div className="divide-y" style={{ borderColor: 'var(--line)' }}>{candidates.map((item, index) => <div key={item.id || `${item.date}-${index}`} className="flex flex-wrap items-center gap-3 p-3"><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{item.technique} · {item.minutes} Min.</div><div className="text-xs" style={{ color: 'var(--muted)' }}>{item.date}</div></div><button disabled={markingId === item.id} onClick={() => confirmExistingPractice(item)} className="rounded-lg border px-3 py-2 text-xs font-bold disabled:opacity-50" style={{ borderColor: 'var(--line)', color: 'var(--accent)' }}>{markingId === item.id ? 'Speichert …' : 'Bestätigen'}</button></div>)}</div></div>}
      <div className="overflow-hidden rounded-2xl border" style={panel}><div className="flex items-center gap-2 border-b p-4 font-bold" style={{ borderColor: 'var(--line)' }}><BookOpen size={17} style={{ color: 'var(--accent)' }} />Protokoll</div>{loading ? <div className="p-4 text-sm" style={{ color: 'var(--muted)' }}>Lade Einträge …</div> : practice.length === 0 ? <div className="p-4 text-sm" style={{ color: 'var(--muted)' }}>Noch keine Praxiseinheiten dokumentiert.</div> : <div className="divide-y" style={{ borderColor: 'var(--line)' }}>{practice.map((item, index) => <div key={item.id || `${item.date}-${index}`} className="flex items-center gap-3 p-3"><div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ background: item.signed && item.minutes >= 15 ? 'var(--accent-glow)' : 'var(--bg2)', color: 'var(--accent)' }}>{index + 1}</div><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{item.technique} · {item.minutes} Min.</div><div className="text-xs" style={{ color: 'var(--muted)' }}>{item.date}{item.note ? ` · ${item.note}` : ''}</div></div>{item.signed && Number(item.minutes) >= 15 && <Check size={17} style={{ color: 'var(--green)' }} />}</div>)}</div>}</div>
    </>}
    {message && <div role="status" className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full px-4 py-2 text-xs font-bold shadow-xl" style={{ background: 'var(--accent)', color: 'var(--bg2)' }}>{message}</div>}
  </div>
}
