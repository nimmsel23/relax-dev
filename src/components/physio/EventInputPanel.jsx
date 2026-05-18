import { usePhysioStore } from '../../store/physioStore'

const EVENTS = [
  { type: 'coffee', icon: '☕', label: 'Coffee', dose: 2 },
  { type: 'meal', icon: '🍽️', label: 'Meal', macro: 'carbs' },
  { type: 'nicotine', icon: '🚬', label: 'Nicotine', dose: 1 },
  { type: 'thc', icon: '🌿', label: 'THC', strength: 'low' },
]

export default function EventInputPanel() {
  const addEvent = usePhysioStore((s) => s.addEvent)
  const events = usePhysioStore((s) => s.events)

  const handleAddEvent = (type, dose = 1, macro = 'carbs') => {
    const defaultTime = events.length > 0
      ? Math.max(...events.map(e => e.time || 0)) + 120
      : 0

    addEvent({
      type,
      time: defaultTime,
      ...(type === 'coffee' || type === 'nicotine' ? { dose } : {}),
      ...(type === 'meal' ? { macro } : {}),
      ...(type === 'thc' ? { strength: 'low' } : {}),
    })
  }

  return (
    <div className="rounded-lg p-4 border" style={{ background: 'var(--card)', borderColor: 'var(--line)' }}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--ink)' }}>
        🎯 Add Events
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {EVENTS.map(({ type, icon, label, dose, macro }) => (
          <button
            key={type}
            onClick={() => handleAddEvent(type, dose, macro)}
            className="p-3 rounded-lg font-semibold text-sm transition-all hover:scale-105 active:scale-95 border"
            style={{
              background: 'var(--accent)',
              color: 'white',
              borderColor: 'var(--accent)',
            }}
          >
            <span className="text-lg block mb-1">{icon}</span>
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
