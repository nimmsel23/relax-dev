// Atemmuster für den Atem-Tab.
//
// Eine Phase: { kind, label, s, to }
//   kind  'in' | 'hold' | 'out' | 'holdOut'  (steuert Farbe + Haptik)
//   s     Dauer in Sekunden
//   to    Ziel-Füllstand der Lunge 0..1 am Phasenende (Start = Ende der Vorphase)
// Zwei 'in'-Phasen hintereinander ergeben den doppelten Einatemzug (Seufzer, Dirga).
//
// Rein datengetrieben und ohne React/DOM, damit tests/breath.test.mjs es direkt laden kann.

export const CATEGORIES = [
  {
    id: 'calm',
    label: 'Beruhigen',
    icon: 'Wind',
    blurb: 'Parasympathikus hoch, Herzfrequenz runter.',
  },
  {
    id: 'sleep',
    label: 'Schlaf',
    icon: 'Moon',
    blurb: 'Abends runterfahren, Einschlafen erleichtern.',
  },
  {
    id: 'focus',
    label: 'Fokus',
    icon: 'Target',
    blurb: 'Ruhig und wach – Lernen, Prüfung, Deep Work.',
  },
  {
    id: 'energy',
    label: 'Energie',
    icon: 'Zap',
    blurb: 'Kurz aktivieren, ohne Kaffee.',
  },
  {
    id: 'sos',
    label: 'SOS',
    icon: 'LifeBuoy',
    blurb: 'Akuter Stress, Anspannung, Panik-Vorstufe.',
  },
]

const IN = (s, to = 1, label = 'Einatmen') => ({ kind: 'in', label, s, to })
const HOLD = (s, to = 1, label = 'Halten') => ({ kind: 'hold', label, s, to })
const OUT = (s, to = 0, label = 'Ausatmen') => ({ kind: 'out', label, s, to })
const HOLD_OUT = (s, label = 'Leer halten') => ({ kind: 'holdOut', label, s, to: 0 })

export const PATTERNS = [
  // ── Beruhigen ──────────────────────────────────────────────────────────
  {
    id: 'resonance',
    category: 'calm',
    name: 'Kohärenzatmung',
    ratio: '5,5 – 5,5',
    technique: 'Atemübung: Kohärenz (5,5-5,5)',
    minutes: 5,
    phases: [IN(5.5), OUT(5.5)],
    desc: 'Etwa 6 Atemzüge pro Minute: der Bereich, in dem Atmung, Herzrhythmus und Blutdruck gleichschwingen.',
    pni: 'Maximiert die HRV und den Vagustonus (Baroreflex-Resonanz). Dämpft die Sympathikus-Dominanz, Cortisol-Antwort sinkt mit regelmäßiger Praxis.',
    how: 'Nase ein, Nase aus, sanft und gleichmäßig – nichts erzwingen.',
  },
  {
    id: 'long-exhale',
    category: 'calm',
    name: 'Verlängerte Ausatmung',
    ratio: '4 – 6',
    technique: 'Atemübung: Verlängerte Ausatmung (4-6)',
    minutes: 5,
    phases: [IN(4), OUT(6)],
    desc: 'Die Ausatmung ist länger als die Einatmung. Der einfachste Einstieg.',
    pni: 'Ausatmung verlangsamt den Herzschlag über den Vagus (respiratorische Sinusarrhythmie). Längere Exhale = stärkerer parasympathischer Anteil.',
    how: 'Durch die Nase ein, durch die Nase oder gespitzte Lippen aus.',
  },
  {
    id: 'bhramari',
    category: 'calm',
    name: 'Summ-Atmung (Bhramari)',
    ratio: '4 – 8 summen',
    technique: 'Atemübung: Summ-Atmung (Bhramari)',
    minutes: 5,
    phases: [IN(4), OUT(8, 0, 'Ausatmen & summen')],
    desc: 'Beim Ausatmen leise „mmm“ summen. Die Vibration spürst du im Kopf und Brustbein.',
    pni: 'Summen erhöht nasales Stickstoffmonoxid (NO) um ein Vielfaches und stimuliert über Kehlkopf-Vibration den Vagus. Verlängert die Ausatmung ganz natürlich.',
    how: 'Mund geschlossen, Zähne leicht auseinander. Ton so leise, dass er angenehm kribbelt.',
  },
  {
    id: 'dirga',
    category: 'calm',
    name: 'Dreiteilige Atmung (Dirga)',
    ratio: '2 + 2 + 2 – 6',
    technique: 'Atemübung: Dreiteilige Atmung (Dirga)',
    minutes: 5,
    phases: [
      IN(2, 0.4, 'Bauch füllen'),
      IN(2, 0.75, 'Rippen weiten'),
      IN(2, 1, 'Brust heben'),
      OUT(6),
    ],
    desc: 'Der Atem füllt in drei Wellen: Bauch, Flanken, oberer Brustkorb. Ausatmen von oben nach unten.',
    pni: 'Nutzt die gesamte Lungenkapazität und schult die Zwerchfell-Atmung. Gut gegen flache Stress-Brustatmung.',
    how: 'Eine Hand auf dem Bauch, eine auf der Brust. Die untere Hand hebt sich zuerst.',
  },

  // ── Schlaf ─────────────────────────────────────────────────────────────
  {
    id: '478',
    category: 'sleep',
    name: '4-7-8',
    ratio: '4 – 7 – 8',
    technique: 'Atemübung 4-7-8',
    minutes: 3,
    phases: [IN(4), HOLD(7), OUT(8)],
    desc: 'Der Klassiker zum Einschlafen. Das lange Halten und die doppelt so lange Ausatmung lösen Anspannung.',
    pni: 'Das Halten steigert kurzfristig CO₂ und die Vagus-Antwort bei der anschließenden Ausatmung. Senkt die Aktivierung der HPA-Achse vor dem Schlaf.',
    how: 'Zungenspitze hinter die oberen Schneidezähne. Aus durch den Mund mit leisem Rauschen. Max. 4 Runden zu Beginn.',
    caution: 'Anfangs wird einem leicht schwindlig. Im Sitzen oder Liegen üben.',
  },
  {
    id: 'sleep-48',
    category: 'sleep',
    name: 'Lange Ausatmung 4 – 8',
    ratio: '4 – 8',
    technique: 'Atemübung: Lange Ausatmung (4-8)',
    minutes: 5,
    phases: [IN(4), OUT(8)],
    desc: 'Ohne Halten, dafür doppelt so lange Ausatmung. Sanfter als 4-7-8, gut im Bett.',
    pni: 'Hohe respiratorische Sinusarrhythmie fördert Parasympathikus-Dominanz und dämpft das abendliche Gedankenkreisen.',
    how: 'Augen schließen, Kiefer locker, Schultern sinken lassen.',
  },
  {
    id: 'sleep-out-pause',
    category: 'sleep',
    name: 'Atempause nach dem Ausatmen',
    ratio: '4 – 6 – 2 leer',
    technique: 'Atemübung: Atempause (4-6-2)',
    minutes: 5,
    phases: [IN(4), OUT(6), HOLD_OUT(2, 'Pause')],
    desc: 'Nach der Ausatmung kurz innehalten. Die natürliche Pause, in der der Körper loslässt.',
    pni: 'Die Pause nach der Exhale ist der Moment mit der niedrigsten Herzfrequenz im Atemzyklus.',
    how: 'Die Pause nicht erzwingen. Wenn der Impuls zum Einatmen kommt, einfach einatmen.',
  },

  // ── Fokus ──────────────────────────────────────────────────────────────
  {
    id: 'box',
    category: 'focus',
    name: 'Box Breathing',
    ratio: '4 – 4 – 4 – 4',
    technique: 'Box Breathing (4-4-4-4)',
    minutes: 5,
    phases: [IN(4), HOLD(4), OUT(4), HOLD_OUT(4)],
    desc: 'Vier gleiche Seiten. Ruhig und klar – vor Prüfung, Gespräch oder konzentrierter Arbeit.',
    pni: 'Balanciert Sympathikus und Parasympathikus. Stabilisiert die Aufmerksamkeit unter Stress, ohne zu sedieren.',
    how: 'Ruhiger Zug durch die Nase. Schultern unten lassen.',
  },
  {
    id: 'triangle',
    category: 'focus',
    name: 'Dreiecksatmung',
    ratio: '4 – 4 – 4',
    technique: 'Atemübung: Dreiecksatmung (4-4-4)',
    minutes: 5,
    phases: [IN(4), HOLD(4), OUT(4)],
    desc: 'Box ohne leere Pause. Eine Spur wacher, leichter durchzuhalten.',
    pni: 'Mildes Halten nach der Einatmung hebt kurz die Wachheit und stabilisiert dann die Ausatmung.',
    how: 'Gleichmäßig bleiben, keine Anstrengung im Halten.',
  },
  {
    id: 'pre-exam',
    category: 'focus',
    name: 'Prüfungs-Reset',
    ratio: '4 – 2 – 6',
    technique: 'Atemübung: Prüfungs-Reset (4-2-6)',
    minutes: 2,
    phases: [IN(4), HOLD(2), OUT(6)],
    desc: 'Zwei Minuten kurz vor einem Termin. Beruhigt, ohne müde zu machen.',
    pni: 'Verlängerte Ausatmung dämpft die akute Cortisol- und Adrenalin-Antwort, ohne die Wachheit zu senken.',
    how: 'Im Sitzen, Füße am Boden spüren.',
  },

  // ── Energie ────────────────────────────────────────────────────────────
  {
    id: 'activate',
    category: 'energy',
    name: 'Aktivierende Atmung',
    ratio: '2 – 2',
    technique: 'Atemübung: Aktivierende Atmung (2-2)',
    minutes: 1,
    phases: [IN(2), OUT(2)],
    desc: 'Kurz, zügig, ohne Pause. Ein 1-Minuten-Wachmacher für Nachmittagstief oder vor dem Training.',
    pni: 'Schnellere Atmung hebt den Sympathikus-Tonus leicht an – Noradrenalin, Wachheit. Deshalb tagsüber, nicht abends.',
    how: 'Durch die Nase, Bauch bewegen. Nach einer Minute wieder normal atmen.',
    caution: 'Bei Schwindel sofort aufhören. Nicht bei Schwangerschaft, Epilepsie oder Herz-Kreislauf-Problemen.',
  },
  {
    id: 'energy-hold',
    category: 'energy',
    name: 'Kraft-Atem',
    ratio: '3 – 3 voll',
    technique: 'Atemübung: Kraft-Atem (3-3)',
    minutes: 2,
    phases: [IN(3), HOLD(3), OUT(3)],
    desc: 'Mittleres Tempo mit gefüllter Lunge als Anker. Weckt, ohne zu hetzen.',
    pni: 'Brustkorb-Weitung und Halten mit gefüllter Lunge erhöhen kurz den Sympathikus-Tonus bei stabiler Ausatmung.',
    how: 'Beim Halten Brustkorb weit, Gesicht und Schultern entspannt.',
    caution: 'Bei Schwindel aufhören.',
  },

  // ── SOS ────────────────────────────────────────────────────────────────
  {
    id: 'sigh',
    category: 'sos',
    name: 'Physiologischer Seufzer',
    ratio: '2 + 1 – 6',
    technique: 'Atemübung: Physiologischer Seufzer',
    minutes: 1,
    phases: [
      IN(2, 0.75, 'Einatmen'),
      IN(1, 1, 'Nachatmen'),
      OUT(6),
    ],
    desc: 'Doppelte Einatmung durch die Nase, dann lang und hörbar ausatmen. Die schnellste Methode bei akutem Stress.',
    pni: 'Der zweite Zug öffnet kollabierte Lungenbläschen (Alveolen), die lange Ausatmung entlädt CO₂. In einer Studie (Balban et al. 2023, Stanford) senkte 5 Minuten täglich Angst und verbesserte die Stimmung mehr als Achtsamkeitsmeditation.',
    how: 'Zwei Nasenzüge kurz hintereinander, dann durch den Mund seufzen. 1 bis 3 Minuten reichen.',
  },
  {
    id: 'sos-46',
    category: 'sos',
    name: 'Anker-Atmung',
    ratio: '4 – 6 mit Zählen',
    technique: 'Atemübung: Anker-Atmung (4-6)',
    minutes: 3,
    phases: [IN(4), OUT(6)],
    desc: 'Beim Ausatmen innerlich mitzählen. Gibt dem Kopf eine Aufgabe, wenn Gedanken rasen.',
    pni: 'Die Kombination aus verlängerter Ausatmung und fokussierter Aufmerksamkeit unterbricht Grübelschleifen (Default-Mode-Netzwerk).',
    how: 'Beim Ausatmen leise von 6 rückwärts zählen.',
  },
]

export function patternsByCategory(categoryId) {
  return PATTERNS.filter((p) => p.category === categoryId)
}

export function getPattern(id) {
  return PATTERNS.find((p) => p.id === id) || null
}

/** Länge eines Atemzyklus in Sekunden. */
export function cycleSeconds(pattern) {
  return pattern.phases.reduce((a, ph) => a + ph.s, 0)
}

/** Anzahl Zyklen für eine Zieldauer in Minuten (mindestens 1). */
export function roundsFor(pattern, minutes) {
  return Math.max(1, Math.round((minutes * 60) / cycleSeconds(pattern)))
}

function easeInOut(p) {
  return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2
}

/**
 * Zustand zum Zeitpunkt tMs (ab Start, ohne Pausen).
 * Liefert Phase, Fortschritt, Lungen-Füllstand, Runde und ob alles durch ist.
 */
export function phaseAt(pattern, tMs, rounds) {
  const cycleMs = cycleSeconds(pattern) * 1000
  const totalMs = cycleMs * rounds
  if (tMs >= totalMs) {
    const last = pattern.phases.length - 1
    return {
      done: true,
      round: rounds,
      phaseIndex: last,
      phase: pattern.phases[last],
      progress: 1,
      secondsLeft: 0,
      fill: pattern.phases[last].to,
    }
  }
  const round = Math.floor(tMs / cycleMs) + 1
  let t = tMs % cycleMs
  // Füllstand zu Beginn des Zyklus = Ende der letzten Phase
  let from = pattern.phases[pattern.phases.length - 1].to
  for (let i = 0; i < pattern.phases.length; i++) {
    const ph = pattern.phases[i]
    const len = ph.s * 1000
    if (t < len) {
      const progress = t / len
      const fill = from + (ph.to - from) * easeInOut(progress)
      return {
        done: false,
        round,
        phaseIndex: i,
        phase: ph,
        progress,
        secondsLeft: Math.ceil((len - t) / 1000),
        fill,
      }
    }
    t -= len
    from = ph.to
  }
  // Rundungsrand: letzte Phase
  const last = pattern.phases.length - 1
  return { done: false, round, phaseIndex: last, phase: pattern.phases[last], progress: 1, secondsLeft: 0, fill: pattern.phases[last].to }
}
