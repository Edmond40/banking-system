import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api.js'

export default function UserDashboard() {
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState([])
  const [txns, setTxns] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterKind, setFilterKind] = useState('ALL') // ALL | DEPOSIT | WITHDRAW | TRANSFER
  const [pageSize, setPageSize] = useState(8)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const uid = (() => {
          try { return Number(localStorage.getItem('user_id') || sessionStorage.getItem('user_id') || '0') } catch { return 0 }
        })()
        // read name for welcome header
        try {
          const name = localStorage.getItem('user_name') || sessionStorage.getItem('user_name') || ''
          if (!cancelled) setUserName(name || '')
        } catch { /* noop */ }
        const accs = await api.get(`/api/accounts?userId=${uid}`)
        if (cancelled) return
        setAccounts(accs || [])
        // Fetch recent transactions across all accounts in parallel and merge
        const txnLists = await Promise.all(
          (accs || []).map(a => api.get(`/api/transactions?accountId=${a.id}`).catch(() => []))
        )
        if (cancelled) return
        const merged = txnLists.flat().sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8)
        setTxns(merged)
      } catch (e) {
        // minimal fallback
        setAccounts([])
        setTxns([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const totalBalance = useMemo(() => accounts.reduce((sum, a) => sum + Number(a.balance || 0), 0), [accounts])
  const filteredTxns = useMemo(() => {
    if (filterKind === 'ALL') return txns
    return txns.filter(t => {
      const k = String(t.kind||'').toUpperCase()
      if (filterKind === 'TRANSFER') return k.includes('TRANSFER')
      return k.startsWith(filterKind)
    })
  }, [txns, filterKind])

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{`Welcome back${userName ? `, ${userName}` : ''}`}</h1>
          <p className="text-slate-500">Your total balance • ${totalBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-brand hover:bg-brand-dark" onClick={()=> navigate('/user/accounts')}>Add Money</button>
          <button onClick={()=> navigate('/user/transfers')}>New Transfer</button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading && <SkeletonCard />}
        {!loading && accounts.map((a, idx) => (
          <AccountCard key={a.id} name={a.name} number={maskNumber(a.number)} balance={`$ ${Number(a.balance).toLocaleString()}`} accent={idx===1?'emerald':idx===2?'amber':'brand'} />
        ))}
        {!loading && accounts.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-slate-500">No accounts yet. Create one to get started.</div>
        )}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-medium text-slate-900">Recent Transactions</h2>
              <p className="text-sm text-slate-500">Latest activity on your accounts</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <label className="text-slate-600">Filter</label>
              <select value={filterKind} onChange={(e)=>{ setFilterKind(e.target.value); setPageSize(8) }} className="border border-slate-300 rounded-md px-2 py-1">
                <option value="ALL">All</option>
                <option value="DEPOSIT">Deposits</option>
                <option value="WITHDRAW">Withdrawals</option>
                <option value="TRANSFER">Transfers</option>
              </select>
            </div>
          </div>
          <ul className="divide-y divide-slate-100">
            {filteredTxns.slice(0, pageSize).map((t) => (
              <li key={t.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">{renderTxnTitle(t)}</p>
                  <p className="text-xs text-slate-500">{new Date(t.createdAt).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">{formatAmount(t)}</p>
                  <span className="text-xs inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5">{t.status}</span>
                </div>
              </li>
            ))}
            {!loading && filteredTxns.length === 0 && (
              <li className="px-4 py-6 text-sm text-slate-500">No recent activity.</li>
            )}
          </ul>
          {!loading && filteredTxns.length > pageSize && (
            <div className="p-3 border-t border-slate-100">
              <button className="w-full" onClick={()=> setPageSize(s=> s+8)}>Show more</button>
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h2 className="font-medium text-slate-900">Quick Actions</h2>
          <div className="mt-3 grid gap-2">
            <button className="bg-brand hover:bg-brand-dark" onClick={()=> navigate('/user/transfers')}>Transfer Money</button>
            <button onClick={()=> navigate('/user/accounts')}>Manage Accounts</button>
            <button onClick={()=> navigate('/user/transfers')}>Add Beneficiary</button>
          </div>
        </div>
      </section>
    </div>
  );
}

function AccountCard({ name, number, balance, accent = 'brand' }) {
  const ring = accent === 'emerald' ? 'ring-emerald-100' : accent === 'amber' ? 'ring-amber-100' : 'ring-brand/20'
  const bar = accent === 'emerald' ? 'bg-emerald-500' : accent === 'amber' ? 'bg-amber-500' : 'bg-brand'
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-4 ring-1 ${ring} cursor-pointer`} onClick={()=> window.location.assign('/user/accounts')}>
      <div className={`h-1 w-16 ${bar} rounded mb-3`} />
      <p className="text-sm text-slate-500">{name}</p>
      <div className="mt-1 flex items-baseline justify-between">
        <span className="text-xl font-semibold text-slate-900">{balance}</span>
        <span className="text-xs text-slate-500">{number}</span>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 animate-pulse">
      <div className="h-1 w-16 bg-slate-200 rounded mb-3" />
      <div className="h-4 w-24 bg-slate-200 rounded" />
      <div className="mt-3 flex items-baseline justify-between">
        <div className="h-6 w-28 bg-slate-200 rounded" />
        <div className="h-3 w-16 bg-slate-200 rounded" />
      </div>
    </div>
  )
}

function maskNumber(num) {
  if (!num) return '••• ••••'
  const last4 = String(num).slice(-4)
  return `••• ${last4}`
}

function renderTxnTitle(t) {
  const kind = (t.kind || '').toLowerCase()
  if (kind === 'deposit') return 'Deposit'
  if (kind === 'withdraw') return 'Withdrawal'
  if (kind.includes('transfer')) return 'Transfer'
  return t.kind
}

function formatAmount(t) {
  const sign = (t.kind || '').toUpperCase().startsWith('WITHDRAW') || (t.kind || '').toUpperCase().includes('TRANSFER') ? '-' : '+'
  return `${sign}$ ${Number(t.amount).toLocaleString()}`
}
