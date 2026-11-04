import { useEffect, useState } from 'react'
import { HeartPulse, Pause, Play } from 'lucide-react'

const GROUPS = [
  ['Rechte Hand und Arm', 'Schließe die rechte Hand locker zur Faust und spanne den Arm sanft an.'],
  ['Linke Hand und Arm', 'Schließe die linke Hand locker zur Faust und spanne den Arm sanft an.'],
  ['Stirn', 'Ziehe die Augenbrauen leicht nach oben.'],
  ['Augen und Wangen', 'Schließe die Augen sanft und hebe die Wangen leicht, ohne zu pressen.'],
  ['Schultern', 'Ziehe die Schultern ein wenig in Richtung Ohren.'],
  ['Bauch', 'Spanne die Bauchdecke leicht an und atme dabei weiter.'],
  ['Gesäß', 'Spanne die Gesäßmuskeln sanft an.'],
  ['Rechtes Bein', 'Spanne den rechten Oberschenkel leicht an und ziehe die Fußspitze sanft zu dir.'],
  ['Linkes Bein', 'Spanne den linken Oberschenkel leicht an und ziehe die Fußspitze sanft zu dir.'],
]
const PHASES = [
  { name: 'Anspannen', seconds: 5, text: 'Sanft anspannen und die Spannung wahrnehmen. Atme dabei ruhig weiter.' },
  { name: 'Loslassen & nachspüren', seconds: 30, text: 'Löse die Spannung. Was verändert sich? Spüre nach, ohne etwas erzwingen zu müssen.' },
]
const card = { background: 'var(--card)', borderColor: 'var(--line)' }

export default function PMR() {
  const [practice, setPractice] = useState(null)
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState(0)
  const [remaining, setRemaining] = useState(PHASES[0].seconds)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const groups = practice === 'try' ? GROUPS.slice(0, 1) : GROUPS

  useEffect(() => {
    if (!running || !practice || done) return undefined
    const timer = window.setInterval(() => setRemaining(value => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [running, practice, done])

  // A phase ends in a pause: the next instruction is read before the user starts it.
  useEffect(() => {
    if (running && remaining === 0) setRunning(false)
  }, [remaining, running])

  function start(mode) {
    setPractice(mode); setIndex(0); setPhase(0); setRemaining(PHASES[0].seconds); setRunning(false); setDone(false)
    window.setTimeout(() => document.getElementById('pmr-praxis')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  function next() {
    setRunning(false)
    if (phase === 0) { setPhase(1); setRemaining(PHASES[1].seconds) }
    else if (index + 1 < groups.length) { setIndex(index + 1); setPhase(0); setRemaining(PHASES[0].seconds) }
    else setDone(true)
  }

  return <div className="space-y-4 pb-6">
    <section className="rounded-3xl border p-5 sm:p-6" style={card}>
      <HeartPulse size={26} style={{ color: 'var(--accent)' }} aria-hidden="true" />
      <h1 className="mt-3 text-2xl font-black">Progressive Muskelrelaxation</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>Bei der progressiven Muskelrelaxation (PMR) spannst du einzelne Muskeln kurz und sanft an und lässt sie wieder los. Dann nimmst du dir Zeit, den Unterschied zu spüren. So kannst du lernen, Anspannung früher zu erkennen und bewusst loszulassen.</p>
      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        {['1. Sanft anspannen', '2. Spannung lösen', '3. In Ruhe nachspüren'].map(item => <div key={item} className="rounded-xl px-3 py-3 text-sm font-bold" style={{ background: 'var(--bg2)' }}>{item}</div>)}
      </div>
      <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>„Progressiv“ bedeutet: Du gehst Schritt für Schritt durch verschiedene Muskelgruppen. Es gibt kein richtiges Gefühl und kein Leistungsziel. Vielleicht bemerkst du Wärme, Schwere oder einfach einen kleinen Unterschied – auch wenn du zunächst nichts Besonderes spürst, ist das in Ordnung.</p>
      <button onClick={() => start('try')} className="mt-5 min-h-12 w-full rounded-xl px-4 py-3 text-sm font-bold sm:w-auto" style={{ background: 'var(--accent)', color: 'var(--bg2)' }}>Mit einer Hand ausprobieren</button>
      <p className="mt-2 text-xs" style={{ color: 'var(--dim)' }}>Ein Durchgang · etwa eine Minute · ohne Vorkenntnisse</p>
    </section>

    <section className="rounded-2xl border p-5" style={card}>
      <h2 className="text-lg font-bold">So bereitest du dich vor</h2>
      <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>Setze oder lege dich bequem hin, sodass dein Körper gut unterstützt ist. Wähle nach Möglichkeit einen ruhigen Ort. Die Augen dürfen offen bleiben. Atme natürlich weiter und spanne nur so stark an, dass es angenehm bleibt.</p>
      <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>Lass schmerzhafte oder verletzte Bereiche aus. Bei Muskel- oder Gelenkbeschwerden und wenn du unsicher bist, kläre vorher mit einer medizinischen Fachperson, ob die Übung für dich passt. Bei Schmerz oder Unwohlsein: lösen, pausieren oder aufhören.</p>
    </section>

    <section id="pmr-praxis" className="scroll-mt-4 rounded-2xl border p-5" style={card} aria-label="PMR üben">
      <h2 className="text-lg font-bold">Geführt üben</h2>
      <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>Neun Muskelgruppen · ungefähr 6–10 Minuten. Die Uhr ist eine Orientierung: Zwischen den Phasen entscheidest du selbst, wann es weitergeht.</p>
      {!practice ? <button onClick={() => start('full')} className="mt-4 min-h-12 w-full rounded-xl px-4 py-3 text-sm font-bold" style={{ background: 'var(--accent)', color: 'var(--bg2)' }}>Geführte Übung beginnen</button> : done ? <div className="mt-4 space-y-4" aria-live="polite">
        <h3 className="text-lg font-bold">Nimm dir einen Moment zum Abschluss</h3>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>Spüre deinen Körper als Ganzes. Bewege dann langsam Hände und Füße, räkle dich nach Bedarf, öffne die Augen und orientiere dich im Raum. Wie fühlt sich dein Körper jetzt im Vergleich zum Anfang an?</p>
        <div className="flex flex-wrap gap-2"><button onClick={() => start('full')} className="min-h-11 rounded-xl px-4 text-sm font-bold" style={{ background: 'var(--accent)', color: 'var(--bg2)' }}>Ganze Übung starten</button><button onClick={() => setPractice(null)} className="min-h-11 rounded-xl border px-4 text-sm font-semibold" style={{ borderColor: 'var(--line)' }}>Beenden</button></div>
      </div> : <div className="mt-4 space-y-4">
        <div className="flex justify-between gap-3 text-xs font-semibold" style={{ color: 'var(--muted)' }}><span>{practice === 'try' ? 'Erster Versuch' : `Muskelgruppe ${index + 1} von ${groups.length}`}</span><button onClick={() => { setPractice(null); setRunning(false) }} className="underline">Übung beenden</button></div>
        <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--line)' }}><div className="h-full" style={{ width: `${((index * 2 + phase) / (groups.length * 2)) * 100}%`, background: 'var(--accent)' }} /></div>
        <div className="rounded-xl p-4" style={{ background: 'var(--bg2)' }}>
          <div className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>{PHASES[phase].name}</div>
          <h3 className="mt-1 text-xl font-bold">{groups[index][0]}</h3>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{phase === 0 ? groups[index][1] : PHASES[phase].text}</p>
          {phase === 0 && <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{PHASES[0].text}</p>}
          <div className="mt-4 flex items-center gap-3"><span className="text-3xl font-black tabular-nums" aria-label={`${remaining} Sekunden`}>{remaining}<span className="ml-1 text-sm font-medium">Sek.</span></span><button disabled={remaining === 0} onClick={() => setRunning(!running)} className="flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm font-semibold disabled:opacity-40" style={{ borderColor: 'var(--line)' }}>{running ? <><Pause size={16} />Pause</> : <><Play size={16} />{remaining === PHASES[phase].seconds ? 'Zeit starten' : 'Fortsetzen'}</>}</button></div>
          <p className="mt-2 text-xs" style={{ color: 'var(--dim)' }}>{remaining === 0 ? 'Zeit um. Gehe weiter, sobald du bereit bist.' : 'Lies die Anleitung und starte die Zeit, wenn du bereit bist.'}</p>
        </div>
        <div className="flex flex-wrap gap-2"><button onClick={next} className="min-h-11 flex-1 rounded-xl px-4 text-sm font-bold" style={{ background: 'var(--accent)', color: 'var(--bg2)' }}>{phase === 0 ? 'Lösen & nachspüren' : index + 1 === groups.length ? 'Zum Abschluss' : 'Nächste Muskelgruppe'}</button>{phase === 0 && <button onClick={() => { if (index + 1 < groups.length) { setIndex(index + 1); setRemaining(PHASES[0].seconds); setRunning(false) } else { setRunning(false); setDone(true) } }} className="min-h-11 rounded-xl border px-4 text-sm font-semibold" style={{ borderColor: 'var(--line)' }}>Auslassen</button>}</div>
      </div>}
    </section>

    <section className="rounded-2xl border p-5" style={card}>
      <h2 className="text-lg font-bold">Allein im Alltag anwenden</h2>
      <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>Wenn du das Prinzip kennst, wähle zum Beispiel vor einer Pause eine angenehme Muskelgruppe: etwa fünf Sekunden sanft anspannen, lösen und etwa 30 Sekunden nachspüren. Atme weiter. Wiederhole das bei Bedarf mit anderen Bereichen. Übe regelmäßig in ruhigen Momenten, damit du das Gefühl auch im Alltag leichter erkennst.</p>
      <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>Gedanken schweifen ab? Das ist normal. Richte die Aufmerksamkeit freundlich wieder auf die Körperstelle. Entspannung kann sich jedes Mal anders anfühlen.</p>
      <p className="mt-4 border-t pt-3 text-xs leading-relaxed" style={{ borderColor: 'var(--line)', color: 'var(--dim)' }}>Grundlagen und Zeitrahmen: FlexyFit-Kursskript PMR, S. 3–5 und 22. Diese verkürzte Gruppenfolge ist eine eigenständige Übungsvariante. Ergänzend: <a href="https://www.nhsinform.scot/healthy-living/mental-wellbeing/breathing-and-relaxation-exercises/progressive-muscle-relaxation/" target="_blank" rel="noreferrer" className="underline">NHS inform: Progressive muscle relaxation</a>.</p>
    </section>
  </div>
}
