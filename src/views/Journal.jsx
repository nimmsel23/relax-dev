import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Save } from 'lucide-react'
import { api, localToday } from '../api.js'

const MOODS = ['😞', '😐', '🙂', '😄', '🔥']

export default function Journal() {
  const [date, setDate] = useState(localToday())
  const [content, setContent] = useState('')
  const [mood, setMood] = useState(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    api.get(`/journal?date=${date}`).then(d => {
      if (d?.ok) {
        setContent(d.content || '')
        const moodMatch = d.content?.match(/^mood:\s*(\d)$/m)
        if (moodMatch) setMood(Number(moodMatch[1]) - 1)
        else setMood(null)
      } else {
        setContent('')
        setMood(null)
      }
    }).catch(() => { setContent(''); setMood(null) })
  }, [date])

  function shiftDate(delta) {
    const d = new Date(date + 'T12:00:00')
    d.setDate(d.getDate() + delta)
    setDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`)
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  async function save() {
    setSaving(true)
    try {
      let text = content
      if (mood !== null) {
        text = text.replace(/^mood:\s*\d$/m, '').trim()
        text = `mood: ${mood + 1}\n${text}`.trim()
      }
      await api.post(`/journal?date=${date}`, { content: text })
      showToast('Gespeichert ✓')
    } catch {
      showToast('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {/* Date nav */}
      <div className="flex items-center justify-between mb-4 p-3 rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>
        <button onClick={() => shiftDate(-1)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <div className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>{date}</div>
          {date === localToday() && <div className="text-[10px]" style={{ color: 'var(--accent)' }}>Heute</div>}
        </div>
        <button onClick={() => shiftDate(1)} disabled={date >= localToday()}
          style={{ background: 'none', border: 'none', color: date >= localToday() ? 'var(--dim)' : 'var(--muted)', cursor: date >= localToday() ? 'default' : 'pointer' }}>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Mood */}
      <div className="mb-4 p-4 rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>
        <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--muted)' }}>Stimmung</h3>
        <div className="flex justify-between">
          {MOODS.map((emoji, i) => (
            <button key={i} onClick={() => setMood(mood === i ? null : i)}
              className="text-2xl transition-all rounded-xl p-2"
              style={{
                background: mood === i ? 'var(--accent)' + '22' : 'transparent',
                border: mood === i ? '1.5px solid var(--accent)' : '1.5px solid transparent',
                transform: mood === i ? 'scale(1.15)' : 'scale(1)',
                cursor: 'pointer',
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Text */}
      <div className="mb-4 p-4 rounded-2xl" style={{ background: 'var(--card)', border: '1px solid var(--line)' }}>
        <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--muted)' }}>Eintrag</h3>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={8}
          placeholder="Wie war dein Tag? Stress, Schlaf, Energie, Notizen…"
          className="w-full text-sm rounded-xl p-3 resize-none"
          style={{
            background: 'var(--bg2)',
            border: '1px solid var(--line)',
            color: 'var(--ink)',
            outline: 'none',
            lineHeight: '1.6',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--line)'}
        />
      </div>

      <button
        onClick={save} disabled={saving}
        className="w-full py-3 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2"
        style={{ background: 'var(--accent)', color: '#080b12', opacity: saving ? 0.6 : 1 }}
      >
        <Save size={16} />
        {saving ? 'Speichern…' : 'Eintrag speichern'}
      </button>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl text-sm font-medium shadow-xl z-50"
          style={{ background: 'var(--card)', color: 'var(--accent)', border: '1px solid var(--line)' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
