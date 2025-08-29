import { useEffect, useMemo, useState } from 'react'
import { useToast } from '../../components/common/ToastProvider.jsx'
import api from '../../lib/api.js'

export default function AdminTransactions() {
  const { notify } = useToast()
  const [pending, setPending] = useState([])
  const [processed, setProcessed] = useState([])
  const [accounts, setAccounts] = useState([])
  const [filter, setFilter] = useState('all') // all | deposit | withdraw

  // Load approvals and accounts from backend
  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const [pendingRows, approvedRows, declinedRows, accountRows] = await Promise.all([
          api.get('/api/admin/approvals?status=PENDING'),
          api.get('/api/admin/approvals?status=APPROVED'),
          api.get('/api/admin/approvals?status=DECLINED'),
          api.get('/api/accounts')
        ])
        if (!mounted) return
        setPending(pendingRows || [])
        setProcessed([...(approvedRows || []), ...(declinedRows || [])])
        setAccounts(accountRows || [])
      } catch (e) {
        notify({ title: 'Failed to load approvals', description: e.message || String(e), variant: 'error' })
      }
    }
    load()
    return () => { mounted = false }
  }, [notify])

  const filtered = useMemo(() => {
    if (filter === 'all') return pending
    return pending.filter(p => String(p.type).toLowerCase() === filter)
  }, [pending, filter])

  async function approve(op) {
    try {
      await api.post(`/api/admin/approvals/${op.id}/decide`, { decision: 'APPROVE' })
      notify({ title: 'Approved', description: `${String(op.type).toLowerCase()} $ ${Number(op.amount||0).toLocaleString()}`, variant: 'success' })
      // refresh lists
      const [pendingRows, approvedRows, declinedRows] = await Promise.all([
        api.get('/api/admin/approvals?status=PENDING'),
        api.get('/api/admin/approvals?status=APPROVED'),
        api.get('/api/admin/approvals?status=DECLINED')
      ])
      setPending(pendingRows || [])
      setProcessed([...(approvedRows || []), ...(declinedRows || [])])
    } catch (e) {
      notify({ title: 'Approve failed', description: e.message || String(e), variant: 'error' })
    }
  }

  async function decline(op) {
    try {
      await api.post(`/api/admin/approvals/${op.id}/decide`, { decision: 'DECLINE' })
      notify({ title: 'Declined', description: `${String(op.type).toLowerCase()} $ ${Number(op.amount||0).toLocaleString()}`, variant: 'error' })
      const [pendingRows, approvedRows, declinedRows] = await Promise.all([
        api.get('/api/admin/approvals?status=PENDING'),
        api.get('/api/admin/approvals?status=APPROVED'),
        api.get('/api/admin/approvals?status=DECLINED')
      ])
      setPending(pendingRows || [])
      setProcessed([...(approvedRows || []), ...(declinedRows || [])])
    } catch (e) {
      notify({ title: 'Decline failed', description: e.message || String(e), variant: 'error' })
    }
  }

  async function deleteApproval(op) {
    try {
      await api.del(`/api/admin/approvals/${op.id}`)
      notify({ title: 'Deleted', description: `${String(op.type).toLowerCase()} request removed`, variant: 'info' })
      const [pendingRows, approvedRows, declinedRows] = await Promise.all([
        api.get('/api/admin/approvals?status=PENDING'),
        api.get('/api/admin/approvals?status=APPROVED'),
        api.get('/api/admin/approvals?status=DECLINED')
      ])
      setPending(pendingRows || [])
      setProcessed([...(approvedRows || []), ...(declinedRows || [])])
    } catch (e) {
      notify({ title: 'Delete failed', description: e.message || String(e), variant: 'error' })
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Transactions Approvals</h1>
          <p className="text-slate-500">Approve or decline user deposit and withdrawal requests</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label className="text-slate-600">Filter:</label>
          <select className="border border-slate-200 rounded-md px-2 py-1" value={filter} onChange={(e)=>setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="deposit">Deposit</option>
            <option value="withdraw">Withdraw</option>
          </select>
        </div>
      </header>

      <section className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-medium text-slate-900">Pending ({pending.length})</h2>
        </div>
        <div className="p-4 overflow-x-auto">
          {filtered.length === 0 ? (
            <p className="text-slate-500 text-sm">No pending requests.</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Account</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Note</th>
                  <th className="py-2 pr-4">Created</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {filtered.map(op => {
                  const acct = accounts.find(a => a.id === op.accountId)
                  return (
                    <tr key={op.id} className="border-t border-slate-100">
                      <td className="py-2 pr-4 capitalize">{String(op.type).toLowerCase()}</td>
                      <td className="py-2 pr-4">{acct ? `${acct.name} (••• ${String(acct.number).slice(-4)})` : (op.accountId ?? '-')}</td>
                      <td className="py-2 pr-4">$ {Number(op.amount||0).toLocaleString()}</td>
                      <td className="py-2 pr-4">{op.note || '-'}</td>
                      <td className="py-2 pr-4">{new Date(op.createdAt).toLocaleString()}</td>
                      <td className="py-2">
                        <div className="flex gap-2">
                          <button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => approve(op)}>Approve</button>
                          <button className="bg-rose-600 hover:bg-rose-700" onClick={() => decline(op)}>Decline</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-medium text-slate-900">History ({processed.length})</h2>
        </div>
        <div className="p-4 overflow-x-auto">
          {processed.length === 0 ? (
            <p className="text-slate-500 text-sm">No processed records.</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Account</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Note</th>
                  <th className="py-2 pr-4">Created</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Decided</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {processed.map(op => {
                  const acct = accounts.find(a => a.id === op.accountId)
                  return (
                    <tr key={op.id} className="border-t border-slate-100">
                      <td className="py-2 pr-4 capitalize">{String(op.type).toLowerCase()}</td>
                      <td className="py-2 pr-4">{acct ? `${acct.name} (••• ${String(acct.number).slice(-4)})` : (op.accountId ?? '-')}</td>
                      <td className="py-2 pr-4">$ {Number(op.amount||0).toLocaleString()}</td>
                      <td className="py-2 pr-4">{op.note || '-'}</td>
                      <td className="py-2 pr-4">{new Date(op.createdAt).toLocaleString()}</td>
                      <td className="py-2 pr-4">{String(op.status).toLowerCase()}</td>
                      <td className="py-2 pr-4">{op.decidedAt ? new Date(op.decidedAt).toLocaleString() : '-'}</td>
                      <td className="py-2">
                        <button onClick={()=>deleteApproval(op)} className="bg-rose-600 hover:bg-rose-700 text-white text-xs px-2 py-1 rounded">Delete</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  )
}

