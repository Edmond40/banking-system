import { useState, useMemo } from 'react'

export default function AdminAuditLogs() {
  const [query, setQuery] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [logs] = useState([
    { id: 1, actor: 'Super Admin', action: 'Updated settings', ts: '2025-08-25 10:12' },
    { id: 2, actor: 'Ops Manager', action: 'Approved withdrawal ap_1', ts: '2025-08-25 10:35' },
    { id: 3, actor: 'Analyst', action: 'Viewed reports', ts: '2025-08-24 09:10' },
  ])

  const parseTs = (s) => {
    // Accepts 'YYYY-MM-DD HH:mm' by converting to ISO-ish
    const iso = s.replace(' ', 'T')
    const t = Date.parse(iso)
    return isNaN(t) ? 0 : t
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = logs
    if (q) list = list.filter(l => l.actor.toLowerCase().includes(q) || l.action.toLowerCase().includes(q))
    if (from) {
      const f = Date.parse(from)
      if (!isNaN(f)) list = list.filter(l => parseTs(l.ts) >= f)
    }
    if (to) {
      // Include whole day by adding 1 day - 1 ms
      const t0 = Date.parse(to)
      if (!isNaN(t0)) {
        const t1 = t0 + 24*60*60*1000 - 1
        list = list.filter(l => parseTs(l.ts) <= t1)
      }
    }
    return list
  }, [query, from, to, logs])

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Audit Logs</h1>
        <p className="text-slate-600">Track changes and decisions across the admin console.</p>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-wrap gap-3 mb-3 items-end">
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Search</span>
            <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Actor or action" className="rounded-md border-slate-300 focus:ring-brand focus:border-brand" />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">From</span>
            <input type="date" value={from} onChange={(e)=>setFrom(e.target.value)} className="rounded-md border-slate-300 focus:ring-brand focus:border-brand" />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">To</span>
            <input type="date" value={to} onChange={(e)=>setTo(e.target.value)} className="rounded-md border-slate-300 focus:ring-brand focus:border-brand" />
          </label>
        </div>
        <ul className="text-sm space-y-2">
          {filtered.map(l => (
            <li key={l.id} className="border border-slate-200 rounded-md p-2">
              <div className="font-medium">{l.actor}</div>
              <div className="text-slate-600">{l.action}</div>
              <div className="text-slate-400 text-xs">{l.ts}</div>
            </li>
          ))}
        </ul>
        {filtered.length === 0 && <div className="text-slate-500 text-sm">No results</div>}
      </div>
    </div>
  )
}
