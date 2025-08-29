import { useEffect, useState } from 'react'
import { useToast } from '../../components/common/ToastProvider.jsx'
import api from '../../lib/api.js'

export default function AdminApprovals() {
  const { notify } = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  // Load from backend on mount
  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const pending = await api.get('/api/admin/approvals?status=PENDING')
        if (!mounted) return
        setItems(pending || [])
      } catch (e) {
        notify({ title: 'Failed to load approvals', description: e.message || String(e), variant: 'error' })
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [notify])

  const act = async (id, decision) => {
    try {
      await api.post(`/api/admin/approvals/${id}/decide`, { decision: decision === 'approved' ? 'APPROVE' : 'DECLINE' })
      notify({ title: `Marked ${decision}`, description: id, variant: decision==='approved'?'success':'error' })
      // Refresh list
      const pending = await api.get('/api/admin/approvals?status=PENDING')
      setItems(pending || [])
    } catch (e) {
      notify({ title: 'Action failed', description: e.message || String(e), variant: 'error' })
    }
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Approvals Center</h1>
        <p className="text-slate-600">Review and decide on pending items from across the system.</p>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="py-2 pr-4 text-left">ID</th>
                <th className="py-2 pr-4 text-left">Type</th>
                <th className="py-2 pr-4 text-left">Account</th>
                <th className="py-2 pr-4 text-left">Amount</th>
                <th className="py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(i => (
                <tr key={i.id} className="border-t border-slate-100">
                  <td className="py-2 pr-4">{i.id}</td>
                  <td className="py-2 pr-4 capitalize">{String(i.type).toLowerCase()}</td>
                  <td className="py-2 pr-4">{i.accountId || i.account || '-'}</td>
                  <td className="py-2 pr-4">${Number(i.amount||0).toLocaleString()}</td>
                  <td className="py-2 space-x-2">
                    <button disabled={loading} onClick={()=>act(i.id,'approved')}>Approve</button>
                    <button disabled={loading} onClick={()=>act(i.id,'declined')}>Decline</button>
                  </td>
                </tr>
              ))}
              {items.length===0 && (
                <tr><td className="py-4 text-slate-500" colSpan="5">{loading ? 'Loading…' : 'No pending items'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
