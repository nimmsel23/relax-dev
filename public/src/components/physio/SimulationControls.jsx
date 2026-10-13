import { usePhysioStore } from '../../store/physioStore'

export default function SimulationControls() {
  const events = usePhysioStore((s) => s.events)
  const context = usePhysioStore((s) => s.context)
  const horizonMinutes = usePhysioStore((s) => s.horizonMinutes)
  const updateContext = usePhysioStore((s) => s.updateContext)
  const setHorizonMinutes = usePhysioStore((s) => s.setHorizonMinutes)
  const setSimulationResult = usePhysioStore((s) => s.setSimulationResult)
  const setLoading = usePhysioStore((s) => s.setLoading)
  const setError = usePhysioStore((s) => s.setError)

  const handleSimulate = async () => {
    if (events.length === 0) {
      setError('Add at least one event first')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('http://127.0.0.1:9123/api/physio/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events,
          context,
          horizonMinutes,
          resolution: 1,
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      setSimulationResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Your Conditions */}
      <div className="rounded-lg p-4 border" style={{ background: 'var(--card)', borderColor: 'var(--line)' }}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--ink)' }}>
          🏥 Your Conditions
        </h3>

        {/* Fasted */}
        <label className="flex items-center gap-3 mb-4 cursor-pointer group">
          <input
            type="checkbox"
            checked={context.fasted}
            onChange={(e) => updateContext({ fasted: e.target.checked })}
            className="w-4 h-4 rounded"
          />
          <div className="flex-1">
            <span className="text-sm font-medium block" style={{ color: 'var(--ink)' }}>
              Fasted (no food)
            </span>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>
              Higher glucose sensitivity
            </span>
          </div>
        </label>

        {/* Sleep Debt */}
        <div className="mb-4">
          <div className="flex items-end justify-between mb-2">
            <div>
              <label className="text-sm font-medium block" style={{ color: 'var(--ink)' }}>
                😴 Sleep Deprivation
              </label>
              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                How tired are you? (0 = well-rested, 1 = severe debt)
              </span>
            </div>
            <span className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
              {(context.sleepDebt * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={context.sleepDebt}
            onChange={(e) => updateContext({ sleepDebt: Number(e.target.value) })}
            className="w-full h-2 rounded bg-line"
          />
        </div>

        {/* Stress Level */}
        <div className="mb-4">
          <div className="flex items-end justify-between mb-2">
            <div>
              <label className="text-sm font-medium block" style={{ color: 'var(--ink)' }}>
                😰 Stress Level
              </label>
              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                How stressed are you? (0 = calm, 1 = very stressed)
              </span>
            </div>
            <span className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
              {(context.stressLevel * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={context.stressLevel}
            onChange={(e) => updateContext({ stressLevel: Number(e.target.value) })}
            className="w-full h-2 rounded bg-line"
          />
        </div>

        {/* Circadian Phase */}
        <div className="mb-4">
          <label className="text-sm font-medium block mb-2" style={{ color: 'var(--ink)' }}>
            🕐 Time of Day
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['morning', 'afternoon', 'evening'].map((phase) => (
              <button
                key={phase}
                onClick={() => updateContext({ circadianPhase: phase })}
                className="px-3 py-2 rounded text-xs font-semibold transition-all border"
                style={{
                  background: context.circadianPhase === phase ? 'var(--accent)' : 'var(--glass)',
                  borderColor: 'var(--line)',
                  color: context.circadianPhase === phase ? 'white' : 'var(--ink)',
                }}
              >
                {phase === 'morning' && '🌅 Morning'}
                {phase === 'afternoon' && '☀️ Afternoon'}
                {phase === 'evening' && '🌙 Evening'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Simulation Settings */}
      <div className="rounded-lg p-4 border" style={{ background: 'var(--card)', borderColor: 'var(--line)' }}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--ink)' }}>
          ⏱️ Simulation Duration
        </h3>

        <div className="flex items-end justify-between mb-2">
          <span className="text-xs" style={{ color: 'var(--muted)' }}>How long to simulate?</span>
          <span className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
            {horizonMinutes} minutes ({(horizonMinutes / 60).toFixed(1)}h)
          </span>
        </div>
        <input
          type="range"
          min="60"
          max="1440"
          step="60"
          value={horizonMinutes}
          onChange={(e) => setHorizonMinutes(Number(e.target.value))}
          className="w-full h-2 rounded bg-line"
        />
      </div>

      {/* Simulate Button */}
      <button
        onClick={handleSimulate}
        className="w-full py-4 font-bold rounded-lg transition-all text-white text-lg hover:scale-105 active:scale-95"
        style={{ background: 'var(--accent)' }}
      >
        🚀 Simulate Now
      </button>

      {/* Instructions */}
      <div className="rounded-lg p-3 border text-xs" style={{ background: 'var(--glass)', borderColor: 'var(--line)' }}>
        <p className="font-semibold mb-2" style={{ color: 'var(--ink)' }}>
          📋 How to use:
        </p>
        <ol className="space-y-1 list-decimal pl-4" style={{ color: 'var(--muted)' }}>
          <li>Add your events (coffee, meals, etc.) with specific times</li>
          <li>Set your current conditions (sleep debt, stress, time of day)</li>
          <li>Choose simulation duration (how many hours to model)</li>
          <li>Click "Simulate Now" to see how your body responds</li>
          <li>Read the chart: higher lines = more hormone activity</li>
        </ol>
      </div>
    </div>
  )
}
