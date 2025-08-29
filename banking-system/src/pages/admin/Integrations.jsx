import { useEffect, useState } from 'react'
import { useToast } from '../../components/common/ToastProvider.jsx'

export default function AdminIntegrations() {
  const { notify } = useToast()
  const [webhookUrl, setWebhookUrl] = useState('')
  const [apiKey, setApiKey] = useState('')

  const save = () => {
    try { localStorage.setItem('admin_integrations', JSON.stringify({ webhookUrl, apiKey })) } catch { /* no-op */ }
    notify({ title: 'Integrations saved', description: 'Webhook and API key updated', variant: 'success' })
  }

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('admin_integrations') || 'null')
      if (stored) {
        setWebhookUrl(stored.webhookUrl || '')
        setApiKey(stored.apiKey || '')
      }
    } catch { /* no-op */ }
  }, [])

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Integrations</h1>
        <p className="text-slate-600">Webhooks, API keys, and partner configuration.</p>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 grid gap-3 max-w-xl">
        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Webhook URL</span>
          <input value={webhookUrl} onChange={(e)=>setWebhookUrl(e.target.value)} className="rounded-md border-slate-300 focus:ring-brand focus:border-brand" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">API Key</span>
          <input value={apiKey} onChange={(e)=>setApiKey(e.target.value)} className="rounded-md border-slate-300 focus:ring-brand focus:border-brand" />
        </label>
        <div className="flex gap-2">
          <button onClick={save} className="bg-brand hover:bg-brand-dark">Save</button>
          <button onClick={()=>{setWebhookUrl(''); setApiKey('')}}>Clear</button>
        </div>
      </div>
    </div>
  )
}
