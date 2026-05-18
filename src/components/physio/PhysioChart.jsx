import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { usePhysioStore } from '../../store/physioStore'

export default function PhysioChart() {
  const result = usePhysioStore((s) => s.simulationResult)

  if (!result || !result.curves) {
    return (
      <div
        className="h-64 flex items-center justify-center rounded-lg border"
        style={{ background: 'var(--card)', borderColor: 'var(--line)' }}
      >
        <p style={{ color: 'var(--muted)' }} className="text-sm">
          Run simulation to see curves
        </p>
      </div>
    )
  }

  // Transform data for Recharts
  const data = result.timestamps.map((t, idx) => ({
    time: t,
    cortisol: result.curves.cortisol[idx],
    dopamine: result.curves.dopamine[idx],
    glucose: result.curves.glucose[idx],
  }))

  return (
    <div className="rounded-lg border p-4" style={{ background: 'var(--card)', borderColor: 'var(--line)' }}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--ink)' }}>
        Physiological Curves (480 min)
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
          <XAxis
            dataKey="time"
            label={{ value: 'Time (min)', position: 'insideBottomRight', offset: -5 }}
            stroke="var(--muted)"
          />
          <YAxis
            label={{ value: 'Level (0-1)', angle: -90, position: 'insideLeft' }}
            stroke="var(--muted)"
          />
          <Tooltip
            contentStyle={{ background: 'var(--glass)', border: '1px solid var(--line)' }}
            labelStyle={{ color: 'var(--ink)' }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="cortisol"
            stroke="#ff6b6b"
            dot={false}
            strokeWidth={2}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="dopamine"
            stroke="#4ecdc4"
            dot={false}
            strokeWidth={2}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="glucose"
            stroke="#ffd93d"
            dot={false}
            strokeWidth={2}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Metrics */}
      {result.metrics && (
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded" style={{ background: 'var(--glass)' }}>
            <div style={{ color: 'var(--muted)' }}>Stability</div>
            <div style={{ color: 'var(--accent)', fontWeight: 'bold' }}>
              {result.metrics.stabilityIndex.toFixed(2)}
            </div>
          </div>
          <div className="p-2 rounded" style={{ background: 'var(--glass)' }}>
            <div style={{ color: 'var(--muted)' }}>Volatility</div>
            <div style={{ color: 'var(--accent)', fontWeight: 'bold' }}>
              {result.metrics.volatilityScore.toFixed(2)}
            </div>
          </div>
          <div className="p-2 rounded" style={{ background: 'var(--glass)' }}>
            <div style={{ color: 'var(--muted)' }}>Peak Cortisol</div>
            <div style={{ color: '#ff6b6b', fontWeight: 'bold' }}>
              {result.metrics.peakCortisol.toFixed(3)}
            </div>
          </div>
          <div className="p-2 rounded" style={{ background: 'var(--glass)' }}>
            <div style={{ color: 'var(--muted)' }}>Peak Dopamine</div>
            <div style={{ color: '#4ecdc4', fontWeight: 'bold' }}>
              {result.metrics.peakDopamine.toFixed(3)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
