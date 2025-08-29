import { useEffect, useMemo, useState } from 'react'
import { api } from '../../lib/api.js'

export default function AdminDashboard() {
  const [accounts, setAccounts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [approvalsPending, setApprovalsPending] = useState(0)
  const [loans, setLoans] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterKind, setFilterKind] = useState('ALL') // ALL | DEPOSIT | WITHDRAW | TRANSFER
  const [pageSize, setPageSize] = useState(10)

  const reload = async () => {
    setLoading(true)
    try {
      const [accs, txs, pending, loanRows] = await Promise.all([
        api.get('/api/accounts'),
        api.get('/api/transactions'),
        api.get('/api/admin/approvals?status=PENDING'),
        api.get('/api/admin/loans')
      ])
      setAccounts(accs || [])
      setTransactions((txs || []).sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10))
      setApprovalsPending((pending || []).length)
      setLoans(loanRows || [])
    } catch (e) {
      setAccounts([])
      setTransactions([])
      setApprovalsPending(0)
      setLoans([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { reload() }, [])

  const activeCustomers = useMemo(() => new Set((accounts||[]).map(a=>a.userId)).size, [accounts])
  const totalDeposits = useMemo(() => (accounts||[]).reduce((s,a)=> s + Number(a.balance||0), 0), [accounts])
  const loansOutstanding = useMemo(() => (loans||[]).reduce((s,l)=> s + Number(l.amount||0), 0), [loans])
  const filteredTx = useMemo(() => {
    if (filterKind === 'ALL') return transactions
    return transactions.filter(t => {
      const k = String(t.kind||'').toUpperCase()
      if (filterKind === 'TRANSFER') return k.includes('TRANSFER')
      return k.startsWith(filterKind)
    })
  }, [transactions, filterKind])

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500">Overview of KPIs, system status, and quick actions</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-brand hover:bg-brand-dark" onClick={reload} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</button>
          <button>Export</button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI title="Active Customers" value={activeCustomers.toLocaleString()} delta="" />
        <KPI title="Total Deposits" value={`$ ${totalDeposits.toLocaleString()}`} delta="" />
        <KPI title="Loans Outstanding" value={`$ ${loansOutstanding.toLocaleString()}`} delta="" trend="down" />
        <KPI title="Pending Approvals" value={String(approvalsPending)} delta="" trend="up" danger={approvalsPending>0} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-medium text-slate-900">Recent Activity</h2>
              <p className="text-sm text-slate-500">Latest transactions across all accounts</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <label className="text-slate-600">Filter</label>
              <select value={filterKind} onChange={(e)=>{ setFilterKind(e.target.value); setPageSize(10) }} className="border border-slate-300 rounded-md px-2 py-1">
                <option value="ALL">All</option>
                <option value="DEPOSIT">Deposits</option>
                <option value="WITHDRAW">Withdrawals</option>
                <option value="TRANSFER">Transfers</option>
              </select>
            </div>
          </div>
          <div className="p-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="py-2 pr-4">Time</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Account</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {filteredTx.slice(0, pageSize).map((t) => (
                  <tr key={t.id} className="border-t border-slate-100">
                    <td className="py-2 pr-4">{new Date(t.createdAt).toLocaleString()}</td>
                    <td className="py-2 pr-4">{t.kind}</td>
                    <td className="py-2 pr-4">#{t.accountId}{t.toAccountId ? ` → #${t.toAccountId}` : ''}</td>
                    <td className="py-2 pr-4">{formatAdminAmount(t)}</td>
                    <td className="py-2"><span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5">{t.status}</span></td>
                  </tr>
                ))}
                {!loading && filteredTx.length === 0 && (
                  <tr className="border-t border-slate-100"><td className="py-6 text-slate-500" colSpan={5}>No recent activity.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {!loading && filteredTx.length > pageSize && (
            <div className="p-3 border-t border-slate-100">
              <button className="w-full" onClick={()=> setPageSize(s=> s+10)}>Show more</button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
          <h2 className="font-medium text-slate-900">Quick Actions</h2>
          <button className="w-full bg-brand hover:bg-brand-dark" onClick={reload} disabled={loading}>Reload Data</button>
          <button className="w-full">Run Reconciliation</button>
          <button className="w-full">Review Approvals</button>
        </div>
      </section>
    </div>
  );
}

function KPI({ title, value, delta, trend = 'up', danger = false }) {
  const trendColor = danger ? 'text-rose-600' : trend === 'down' ? 'text-amber-600' : 'text-emerald-600'
  const ringColor = danger ? 'ring-rose-100' : 'ring-emerald-100'
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-4 ring-1 ${ringColor}`}>
      <p className="text-sm text-slate-500">{title}</p>
      <div className="mt-2 flex items-baseline justify-between">
        <span className="text-2xl font-semibold text-slate-900">{value}</span>
        <span className={`text-xs ${trendColor}`}>{delta}</span>
      </div>
    </div>
  )
}

function formatAdminAmount(t) {
  const sign = (t.kind || '').toUpperCase().startsWith('WITHDRAW') || (t.kind || '').toUpperCase().includes('TRANSFER') ? '-' : '+'
  return `${sign}$ ${Number(t.amount).toLocaleString()}`
}
