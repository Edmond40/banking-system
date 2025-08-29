import { useEffect, useMemo, useState } from 'react'
import { useToast } from '../../components/common/ToastProvider.jsx'
import api from '../../lib/api.js'

export default function AdminAccounts() {
  const { notify } = useToast()
  const [accounts, setAccounts] = useState([])
  const [selected, setSelected] = useState('')
  const [search, setSearch] = useState('')
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingOps, setLoadingOps] = useState(false)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const rows = await api.get('/api/accounts')
        if (!mounted) return
        setAccounts(rows || [])
      } catch (e) {
        notify({ title: 'Failed to load accounts', description: e.message || String(e), variant: 'error' })
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [notify])

  // load recent transactions when selection changes
  useEffect(() => {
    let mounted = true
    async function loadOps() {
      if (!selected) { setRecent([]); return }
      setLoadingOps(true)
      try {
        const txs = await api.get(`/api/transactions?accountId=${encodeURIComponent(selected)}`)
        if (!mounted) return
        const ordered = (txs || []).sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10)
        setRecent(ordered)
      } catch (e) {
        notify({ title: 'Failed to load account activity', description: e.message || String(e), variant: 'error' })
        setRecent([])
      } finally {
        setLoadingOps(false)
      }
    }
    loadOps()
    return () => { mounted = false }
  }, [selected, notify])

  const filtered = useMemo(() => {
    if (!search) return accounts
    const q = search.toLowerCase()
    return accounts.filter(a => `${a.name} ${a.number} ${a.type}`.toLowerCase().includes(q))
  }, [accounts, search])

  const current = useMemo(() => accounts.find(a => a.id === selected), [accounts, selected])

  async function toggleFreeze() {
    if (!current) return
    try {
      const action = current.status === 'ACTIVE' ? 'freeze' : 'unfreeze'
      await api.post(`/api/admin/customers/${current.userId}/${action}`)
      
      // Refresh accounts to get updated status
      const rows = await api.get('/api/accounts')
      setAccounts(rows || [])
      
      notify({ 
        title: `Account ${action}d`, 
        description: `${current.name} has been ${action}d`, 
        variant: action === 'freeze' ? 'error' : 'success' 
      })
    } catch (e) {
      notify({ title: 'Action failed', description: e.message || String(e), variant: 'error' })
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Accounts</h1>
          <p className="text-slate-500">View balances and manage account status</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <input
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
            placeholder="Search accounts"
            className="border border-slate-200 rounded-md px-2 py-1 w-56"
          />
        </div>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-3 border-b border-slate-100 font-medium">Accounts ({filtered.length})</div>
          <ul className="divide-y divide-slate-100 max-h-[60vh] overflow-auto">
            {filtered.map(a => (
              <li key={a.id} className={`px-4 py-3 cursor-pointer ${selected===a.id ? 'bg-slate-50' : ''}`} onClick={()=>setSelected(a.id)}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-900 font-medium">{a.name}</p>
                    <p className="text-xs text-slate-500">{a.type.toUpperCase()} • {a.number}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${a.status==='ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{a.status}</span>
                </div>
                <p className="text-sm text-slate-700 mt-1">$ {a.balance.toLocaleString()}</p>
              </li>
            ))}
            {(!loading && filtered.length===0) && (
              <li className="px-4 py-3 text-slate-500">No accounts found</li>
            )}
            {loading && (
              <li className="px-4 py-3 text-slate-500">Loading…</li>
            )}
          </ul>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          {current ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{current.name}</h2>
                  <p className="text-sm text-slate-500">{current.type.toUpperCase()} • {current.number}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={toggleFreeze} className="bg-slate-900 text-white hover:bg-slate-800">
                    {current?.status === 'ACTIVE' ? 'Freeze' : 'Unfreeze'}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Info label="Balance" value={`$ ${current.balance.toLocaleString()}`} />
                <Info label="Status" value={current.status} />
                <Info label="Account ID" value={current.id} />
              </div>
              <div>
                <h3 className="font-medium text-slate-900 mb-2">Recent operations</h3>
                {loadingOps ? (
                  <p className="text-sm text-slate-500">Loading…</p>
                ) : recent.length === 0 ? (
                  <p className="text-sm text-slate-500">No recent operations.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="text-left text-slate-500">
                        <tr>
                          <th className="py-2 pr-4">Type</th>
                          <th className="py-2 pr-4">Amount</th>
                          <th className="py-2 pr-4">Note</th>
                          <th className="py-2 pr-4">Status</th>
                          <th className="py-2">Created</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-700">
                        {recent.map(op => (
                          <tr key={op.id} className="border-t border-slate-100">
                            <td className="py-2 pr-4 capitalize">{op.kind}</td>
                            <td className="py-2 pr-4">$ {Number(op.amount||0).toLocaleString()}</td>
                            <td className="py-2 pr-4">{op.note || '-'}</td>
                            <td className="py-2 pr-4">{op.status}</td>
                            <td className="py-2">{new Date(op.createdAt).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-slate-500">Select an account to view details</p>
          )}
        </div>
      </section>
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-slate-900 font-semibold">{value}</p>
    </div>
  )
}

