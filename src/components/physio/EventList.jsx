import { usePhysioStore } from '../../store/physioStore'
import { X } from 'lucide-react'

const EVENT_ICONS = {
  coffee: '☕',
  meal: '🍽️',
  nicotine: '🚬',
  thc: '🌿',
}

const EVENT_LABELS = {
  coffee: 'Coffee',
  meal: 'Meal',
  nicotine: 'Nicotine',
  thc: 'THC',
}

export default function EventList() {
  const events = usePhysioStore((s) => s.events)
  const removeEvent = usePhysioStore((s) => s.removeEvent)
  const updateEvent = usePhysioStore((s) => s.updateEvent)

  if (events.length === 0) {
    return (
      <div className="text-center py-4" style={{ color: 'var(--muted)' }}>
        <p className="text-sm">No events added. Click above to add.</p>
      </div>
    )
  }

  const sortedEvents = [...events].sort((a, b) => a.time - b.time)

  return (
    <div className="space-y-2 mb-4">
      {sortedEvents.map((event) => (
        <div
          key={event.id}
          className="flex items-center gap-3 p-3 rounded-lg border"
          style={{ background: 'var(--card)', borderColor: 'var(--line)' }}
        >
          <span className="text-lg">{EVENT_ICONS[event.type]}</span>

          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
              {EVENT_LABELS[event.type]}
            </div>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>
              t = {event.time} min
              {event.dose && ` • dose: ${event.dose}`}
              {event.macro && ` • ${event.macro}`}
              {event.strength && ` • ${event.strength}`}
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="number"
              value={event.time}
              onChange={(e) =>
                updateEvent(event.id, { time: Number(e.target.value) })
              }
              className="w-16 px-2 py-1 text-xs rounded border"
              style={{ borderColor: 'var(--line)' }}
              placeholder="time"
            />
            <button
              onClick={() => removeEvent(event.id)}
              className="p-1 hover:bg-red-500/20 rounded transition-colors"
            >
              <X size={16} style={{ color: 'var(--muted)' }} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
