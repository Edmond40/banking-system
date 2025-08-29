import { useState, useEffect } from 'react'
import { useToast } from '../../components/common/ToastProvider.jsx'

export default function AdminSettings() {
  const { notify } = useToast()
  const defaultSettings = {
    security: {
      passwordMinLen: 8,
      requireMFA: true,
      sessionTimeoutMin: 30,
    },
    approvals: {
      depositLimit: 5000,
      withdrawLimit: 3000,
      dualApproval: true,
    },
    notifications: {
      email: true,
      sms: false,
      inApp: true,
    },
  }

  const readSettings = () => {
    try { return JSON.parse(localStorage.getItem('admin_settings') || 'null') || defaultSettings } catch { return defaultSettings }
  }
  const writeSettings = (s) => {
    try { localStorage.setItem('admin_settings', JSON.stringify(s)) } catch { /* no-op */ }
  }

  const [settings, setSettings] = useState(defaultSettings)

  useEffect(() => {
    setSettings(readSettings())
  }, [])

  const onNumber = (path, value) => {
    const v = Number(value)
    if (isNaN(v) || v < 0) return
    setSettings(prev => setByPath(prev, path, v))
  }
  const onBool = (path, value) => setSettings(prev => setByPath(prev, path, !!value))

  const save = () => {
    // Simple validation
    if (settings.security.passwordMinLen < 6) {
      notify({ title: 'Validation error', description: 'Password min length must be at least 6', variant: 'error' })
      return
    }
    writeSettings(settings)
    notify({ title: 'Settings saved', description: 'Configuration updated', variant: 'success' })
  }
  const reset = () => {
    setSettings(readSettings())
    notify({ title: 'Reset complete', description: 'Reverted to last saved values', variant: 'info' })
  }
  const restoreDefaults = () => {
    setSettings(defaultSettings)
    notify({ title: 'Defaults loaded', description: 'Not saved yet — click Save to persist', variant: 'info' })
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Admin Settings</h1>
        <p className="text-slate-600">Roles, permissions, approval matrices, security configs.</p>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Security</h2>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Password minimum length</span>
            <input type="number" min={6} value={settings.security.passwordMinLen}
                   onChange={(e)=>onNumber(['security','passwordMinLen'], e.target.value)}
                   className="rounded-md border-slate-300 focus:ring-brand focus:border-brand w-40" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={settings.security.requireMFA}
                   onChange={(e)=>onBool(['security','requireMFA'], e.target.checked)}
                   className="rounded border-slate-300" />
            <span>Require MFA for admin login</span>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Session timeout (minutes)</span>
            <input type="number" min={5} value={settings.security.sessionTimeoutMin}
                   onChange={(e)=>onNumber(['security','sessionTimeoutMin'], e.target.value)}
                   className="rounded-md border-slate-300 focus:ring-brand focus:border-brand w-40" />
          </label>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Approvals</h2>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Deposit limit requiring approval ($)</span>
            <input type="number" min={0} value={settings.approvals.depositLimit}
                   onChange={(e)=>onNumber(['approvals','depositLimit'], e.target.value)}
                   className="rounded-md border-slate-300 focus:ring-brand focus:border-brand w-40" />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Withdraw limit requiring approval ($)</span>
            <input type="number" min={0} value={settings.approvals.withdrawLimit}
                   onChange={(e)=>onNumber(['approvals','withdrawLimit'], e.target.value)}
                   className="rounded-md border-slate-300 focus:ring-brand focus:border-brand w-40" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={settings.approvals.dualApproval}
                   onChange={(e)=>onBool(['approvals','dualApproval'], e.target.checked)}
                   className="rounded border-slate-300" />
            <span>Require dual approval for high-risk transactions</span>
          </label>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3 lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
          <div className="flex flex-wrap gap-6 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={settings.notifications.email}
                     onChange={(e)=>onBool(['notifications','email'], e.target.checked)}
                     className="rounded border-slate-300" />
              <span>Email</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={settings.notifications.sms}
                     onChange={(e)=>onBool(['notifications','sms'], e.target.checked)}
                     className="rounded border-slate-300" />
              <span>SMS</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={settings.notifications.inApp}
                     onChange={(e)=>onBool(['notifications','inApp'], e.target.checked)}
                     className="rounded border-slate-300" />
              <span>In-app</span>
            </label>
          </div>
        </div>
      </section>

      <footer className="flex gap-2">
        <button onClick={save} className="bg-brand hover:bg-brand-dark">Save</button>
        <button onClick={reset}>Reset</button>
        <button onClick={restoreDefaults}>Load defaults</button>
      </footer>
    </div>
  );
}

// Helper to immutably set nested path in an object
function setByPath(obj, path, value) {
  const clone = JSON.parse(JSON.stringify(obj))
  let cur = clone
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i]
    cur[key] = typeof cur[key] === 'object' && cur[key] !== null ? cur[key] : {}
    cur = cur[key]
  }
  cur[path[path.length - 1]] = value
  return clone
}
