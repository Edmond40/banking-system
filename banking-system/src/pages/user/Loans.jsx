import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useToast } from '../../components/common/ToastProvider.jsx'
import { api } from '../../lib/api.js'

export default function Loans() {
  const { notify } = useToast()
  const [apps, setApps] = useState([])

  useEffect(() => {
    (async () => {
      try {
        const rows = await api.get('/api/loans')
        setApps(rows)
      } catch (e) {
        notify({ title: 'Failed to load applications', description: String(e.message || e), variant: 'error' })
      }
    })()
  }, [notify])

  function save(updated) {
    setApps(updated)
  }

  async function handleUpload(appId, files) {
    if (!files || !files.length) return
    const maxFiles = 5
    const maxSize = 2 * 1024 * 1024 // 2MB per file for demo
    const newItems = []
    for (const f of files) {
      if (f.size > maxSize) {
        notify({ title: 'File too large', description: `${f.name} exceeds 2MB`, variant: 'error' })
        continue
      }
      const dataUrl = await new Promise((res, rej) => {
        const r = new FileReader()
        r.onload = () => res(r.result)
        r.onerror = rej
        r.readAsDataURL(f)
      })
      try {
        const created = await api.post('/api/loans/attachments', {
          applicationId: appId,
          name: f.name,
          sizeBytes: f.size,
          mimeType: f.type || 'application/octet-stream',
          url: String(dataUrl)
        })
        newItems.push(created)
      } catch (e) {
        notify({ title: 'Upload failed', description: `${f.name}: ${String(e.message || e)}` , variant: 'error' })
      }
    }
    if (!newItems.length) return
    const updated = apps.map(a => a.id === appId ? { ...a, attachments: [...(a.attachments||[]), ...newItems].slice(0, maxFiles) } : a)
    save(updated)
    notify({ title: 'Uploaded', description: `${newItems.length} file(s) added`, variant: 'success' })
  }

  function removeAttachment(appId, attId) {
    const updated = apps.map(a => a.id === appId ? { ...a, attachments: (a.attachments||[]).filter(x=>x.id!==attId) } : a)
    save(updated)
  }

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Loans</h1>
        <p className="text-slate-600 text-sm">View your current loans, apply for a new one, and manage repayments.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="font-medium mb-2">Your Applications</h2>
          {apps.length === 0 ? (
            <p className="text-sm text-slate-600 mb-4">You have no submitted applications yet.</p>
          ) : (
            <ul className="divide-y">
              {apps.map(app => (
                <li key={app.id} className="py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{app.fullName || 'Applicant'}</div>
                      <div className="text-xs text-slate-500">{new Date(app.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="text-slate-700">Amount: {new Intl.NumberFormat(undefined, { style: 'currency', currency: app.currency || 'USD' }).format(app.amount)}</div>
                      <div className="text-slate-500">{app.months} mo @ {app.annualRate}% • Monthly {new Intl.NumberFormat(undefined, { style: 'currency', currency: app.currency || 'USD' }).format(app.estimates?.monthly || 0)}</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">Purpose: {app.purpose}</div>

                  <div className="mt-2 border rounded p-2 bg-slate-50">
                    <div className="flex items-center justify-between mb-2">
                      <strong className="text-sm">Supporting documents</strong>
                      <label className="text-xs px-2 py-1 rounded bg-purple-600 text-white hover:bg-purple-700 cursor-pointer">
                        Upload
                        <input type="file" className="hidden" multiple onChange={(e)=>{ const f=e.target.files; e.target.value=''; handleUpload(app.id, f) }} />
                      </label>
                    </div>
                    {(app.attachments?.length ?? 0) === 0 ? (
                      <p className="text-xs text-slate-500">No files uploaded yet.</p>
                    ) : (
                      <ul className="space-y-1 text-sm">
                        {app.attachments.map(att => (
                          <li key={att.id} className="flex items-center justify-between">
                            <a className="text-purple-700 hover:underline" href={att.url} download={att.name}>{att.name}</a>
                            <button className="text-rose-600 text-xs hover:underline" onClick={()=>removeAttachment(app.id, att.id)}>Remove</button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link to="/user/loans/apply" className="mt-4 inline-flex items-center px-3 py-1.5 rounded bg-purple-600 text-white hover:bg-purple-700">Apply for a Loan</Link>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="font-medium mb-2">Loan Tools</h2>
          <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
            <li>Estimate monthly repayments</li>
            <li>Compare interest rates</li>
            <li>Check eligibility</li>
          </ul>
        </div>
      </section>
    </div>
  )
}
