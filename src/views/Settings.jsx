import AppUpdatePanel from '../components/AppUpdatePanel.jsx'

export default function Settings() {
  return (
    <div className="grid gap-4">
      <h2 className="text-xl font-extrabold" style={{ color: 'var(--ink)' }}>Settings</h2>
      <AppUpdatePanel />
    </div>
  )
}
