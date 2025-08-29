import { useState } from 'react'
import { useToast } from '../../components/common/ToastProvider.jsx'

export default function AdminReports() {
  const { notify } = useToast()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [type, setType] = useState('daily')

  const exportReport = (type) => {
    // Mock export
    const range = from && to ? ` (${from} → ${to})` : ''
    notify({ title: 'Export started', description: `${type} report${range}`, variant: 'info' })
    setTimeout(() => notify({ title: 'Export complete', description: `${type} report downloaded${range}`, variant: 'success' }), 600)
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Reports</h1>
        <p className="text-slate-600">Generate and download analytics and operational reports.</p>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 grid gap-3">
        <div className="flex flex-wrap gap-3 items-end">
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">From</span>
            <input type="date" value={from} onChange={(e)=>setFrom(e.target.value)} className="rounded-md border-slate-300 focus:ring-brand focus:border-brand" />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">To</span>
            <input type="date" value={to} onChange={(e)=>setTo(e.target.value)} className="rounded-md border-slate-300 focus:ring-brand focus:border-brand" />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Type</span>
            <select value={type} onChange={(e)=>setType(e.target.value)} className="rounded-md border-slate-300 focus:ring-brand focus:border-brand">
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
              <option value="transactions">Transactions</option>
              <option value="risk">Risk</option>
            </select>
          </label>
          <button onClick={()=>exportReport(type)} className="bg-brand hover:bg-brand-dark">Export</button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={()=>exportReport('Daily summary')} className="bg-brand hover:bg-brand-dark">Daily summary</button>
          <button onClick={()=>exportReport('Monthly statement')}>Monthly statement</button>
          <button onClick={()=>exportReport('Transactions CSV')}>Transactions CSV</button>
          <button onClick={()=>exportReport('Risk audit')}>Risk audit</button>
        </div>
      </div>
    </div>
  )
}
