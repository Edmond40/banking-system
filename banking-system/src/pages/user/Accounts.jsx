import { useEffect, useMemo, useState, useCallback } from 'react'
import { useToast } from '../../components/common/ToastProvider.jsx'
import api from '../../lib/api.js'

export default function UserAccounts() {
  const { notify } = useToast()
  const [tab, setTab] = useState('list') // list | statements | open | activity
  const [accounts, setAccounts] = useState([])
  const [selected, setSelected] = useState(undefined)
  const [showDeposit, setShowDeposit] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [activity, setActivity] = useState([])
  const [statements, setStatements] = useState([])
  const [loadingStatements, setLoadingStatements] = useState(false)
  const [statementTxns, setStatementTxns] = useState([])
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [stmtPageSize, setStmtPageSize] = useState(12)
  const [detailsYm, setDetailsYm] = useState(null)

  // Load accounts from backend
  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const userId = Number(localStorage.getItem('user_id')) || undefined
        const rows = await api.get(`/api/accounts${userId ? `?userId=${userId}` : ''}`)
        if (!mounted) return
        setAccounts(rows || [])
        if (rows && rows.length && !selected) setSelected(rows[0]?.id)
      } catch (e) {
        notify({ title: 'Failed to load accounts', description: e.message || String(e), variant: 'error' })
      }
    }
    load()
    return () => { mounted = false }
  }, [notify, selected])

  const filteredStatements = useMemo(() => {
    if (!Array.isArray(statements)) return []
    let rows = statements
    if (dateFrom) {
      const from = new Date(dateFrom)
      rows = rows.filter(r => new Date(r.date) >= from)
    }
    if (dateTo) {
      const to = new Date(dateTo)
      rows = rows.filter(r => new Date(r.date) <= to)
    }
    // newest first for display
    return [...rows].sort((a,b)=> a.date < b.date ? 1 : -1)
  }, [statements, dateFrom, dateTo])

  const current = useMemo(() => accounts.find(a => a.id === selected), [accounts, selected])

  // Load activity (real transactions)
  const refreshActivity = useCallback(async () => {
    if (!current?.id) return
    try {
      const rows = await api.get(`/api/transactions?accountId=${current.id}`)
      setActivity(rows || [])
    } catch (e) {
      notify({ title: 'Failed to load activity', description: e.message || String(e), variant: 'error' })
    }
  }, [current?.id, notify])
  useEffect(() => {
    if (tab === 'activity' && current?.id) {
      refreshActivity()
    }
  }, [tab, current?.id, refreshActivity])

  // Build statements from real transactions for selected account
  useEffect(() => {
    async function loadStatements() {
      if (tab !== 'statements' || !current?.id) return
      setLoadingStatements(true)
      try {
        const rows = await api.get(`/api/transactions?accountId=${current.id}`)
        setStatementTxns(rows || [])
        const monthly = aggregateMonthly(rows || [], current)
        setStatements(monthly)
      } catch (e) {
        notify({ title: 'Failed to load statements', description: e.message || String(e), variant: 'error' })
        setStatements([])
      } finally {
        setLoadingStatements(false)
      }
    }
    loadStatements()
  }, [tab, current, notify])

  const exportCSV = () => {
    try {
      const headers = ['date', 'reference', 'credits', 'debits', 'closing']
      const rows = statements.map(s => headers.map(h => s[h]).join(','))
      const csv = [headers.join(','), ...rows].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `statements_${Date.now()}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      notify({ title: 'Exported CSV', description: 'Statements downloaded', variant: 'success' })
    } catch {
      notify({ title: 'Export failed', description: 'Please try again', variant: 'error' })
    }
  }

  const [openForm, setOpenForm] = useState({ name: '', type: 'current' })
  const onOpen = async (e) => {
    e.preventDefault()
    if (!openForm.name) return
    try {
      const userId = Number(localStorage.getItem('user_id')) || undefined
      const payload = {
        userId,
        name: openForm.name,
        type: openForm.type === 'savings' ? 'SAVINGS' : 'CURRENT'
      }
      const acc = await api.post('/api/accounts', payload)
      notify({ title: 'Account opened', description: `${acc.name} created`, variant: 'success' })
      // refresh accounts list
      const rows = await api.get(`/api/accounts${userId ? `?userId=${userId}` : ''}`)
      setAccounts(rows || [])
      setSelected(acc?.id)
      setOpenForm({ name: '', type: 'current' })
      setTab('list')
    } catch (e) {
      notify({ title: 'Failed to open account', description: e.message || String(e), variant: 'error' })
    }
  }

  // Submit deposit/withdraw approval request
  async function submitOperation(kind, accountId, amount, note) {
    try {
      await api.post('/api/admin/approvals', { 
        type: kind.toUpperCase(), 
        accountId, 
        amount, 
        note 
      })
      setShowDeposit(false)
      setShowWithdraw(false)
      notify({
        title: kind === 'deposit' ? 'Deposit request submitted' : 'Withdrawal request submitted',
        description: `$ ${Number(amount).toLocaleString()} pending admin approval`,
        variant: 'info',
      })
      // refresh accounts and activity
      const userId = Number(localStorage.getItem('user_id')) || undefined
      const rows = await api.get(`/api/accounts${userId ? `?userId=${userId}` : ''}`)
      setAccounts(rows || [])
      await refreshActivity()
    } catch (e) {
      notify({ title: 'Operation failed', description: e.message || String(e), variant: 'error' })
    }
  }

  // Delete account function
  async function deleteAccount() {
    if (!current) return
    try {
      await api.del(`/api/accounts/${current.id}`)
      notify({ 
        title: 'Account deleted', 
        description: `${current.name} has been permanently deleted`, 
        variant: 'success' 
      })
      
      // Refresh accounts list
      const userId = Number(localStorage.getItem('user_id')) || undefined
      const rows = await api.get(`/api/accounts${userId ? `?userId=${userId}` : ''}`)
      setAccounts(rows || [])
      
      // Reset selection if deleted account was selected
      if (rows && rows.length > 0) {
        setSelected(rows[0].id)
      } else {
        setSelected(undefined)
      }
      
      setShowDeleteConfirm(false)
    } catch (e) {
      notify({ title: 'Delete failed', description: e.message || String(e), variant: 'error' })
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">My Accounts</h1>
          <p className="text-slate-500">Manage accounts, statements and open new accounts</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab('open')} className="bg-brand hover:bg-brand-dark">Open Account</button>
          <button onClick={() => setTab('statements')}>Statements</button>
        </div>
      </header>

      <div className="flex gap-2 text-sm">
        <Tab label="Accounts" active={tab==='list'} onClick={() => setTab('list')} />
        <Tab label="Statements" active={tab==='statements'} onClick={() => setTab('statements')} />
        <Tab label="Activity" active={tab==='activity'} onClick={() => setTab('activity')} />
        <Tab label="Open Account" active={tab==='open'} onClick={() => setTab('open')} />
      </div>

      {tab === 'list' && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-3 border-b border-slate-100 font-medium">Accounts</div>
            <ul className="divide-y divide-slate-100">
              {accounts.map(a => (
                <li key={a.id} className={`px-4 py-3 cursor-pointer ${selected===a.id ? 'bg-slate-50' : ''}`} onClick={() => setSelected(a.id)}>
                  <p className="text-slate-900 font-medium">{a.name}</p>
                  <p className="text-xs text-slate-500">{a.type.toUpperCase()} • {a.number}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            {current ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{current.name}</h2>
                    <p className="text-sm text-slate-500">{String(current.type).toUpperCase()} • ••• {String(current.number).slice(-4)}</p>
                  </div>
                  <span className={`text-sm inline-flex items-center rounded-full px-2 py-0.5 ${
                    current.status === 'ACTIVE' 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : 'bg-red-50 text-red-700'
                  }`}>{current.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Info label="Balance" value={`$ ${current.balance.toLocaleString()}`} />
                  <Info label="Account Status" value={
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      current.status === 'ACTIVE' 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : 'bg-red-50 text-red-700'
                    }`}>
                      {current.status}
                    </span>
                  } />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowDeposit(true)}
                    disabled={current.status !== 'ACTIVE'}
                    className={current.status !== 'ACTIVE' ? 'opacity-50 cursor-not-allowed' : ''}
                  >
                    Deposit
                  </button>
                  <button 
                    onClick={() => setShowWithdraw(true)}
                    disabled={current.status !== 'ACTIVE'}
                    className={current.status !== 'ACTIVE' ? 'opacity-50 cursor-not-allowed' : ''}
                  >
                    Withdraw
                  </button>
                  <button onClick={() => setTab('statements')}>View Statements</button>
                  <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={current.balance !== 0}
                    className={`bg-red-600 hover:bg-red-700 text-white ${
                      current.balance !== 0 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-slate-500">Select an account to view details</p>
            )}
          </div>
        </section>
      )}

      {tab === 'activity' && (
        <section className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-medium text-slate-900">Activity</h2>
              <p className="text-sm text-slate-500">Recent transactions</p>
            </div>
            <button onClick={refreshActivity}>Refresh</button>
          </div>
          <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-2">
              <h3 className="font-medium text-slate-900 mb-2">Transactions</h3>
              {current ? (
                <TransactionsTable
                  rows={activity}
                />
              ) : (
                <p className="text-sm text-slate-500">Select an account</p>
              )}
            </div>
          </div>
        </section>
      )}

      {tab === 'statements' && (
        <section className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-4 flex items-center justify-between border-b border-slate-100">
            <div>
              <h2 className="font-medium text-slate-900">Statements</h2>
              <p className="text-sm text-slate-500">Monthly statement summary</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <label className="grid">
                <span className="text-slate-600">From</span>
                <input type="date" value={dateFrom} onChange={(e)=>{ setDateFrom(e.target.value); setStmtPageSize(12) }} className="border border-slate-300 rounded-md px-2 py-1" />
              </label>
              <label className="grid">
                <span className="text-slate-600">To</span>
                <input type="date" value={dateTo} onChange={(e)=>{ setDateTo(e.target.value); setStmtPageSize(12) }} className="border border-slate-300 rounded-md px-2 py-1" />
              </label>
              <button className="bg-brand hover:bg-brand-dark" onClick={exportCSV}>Export CSV</button>
            </div>
          </div>
          <div className="p-4 overflow-x-auto">
            {loadingStatements ? (
              <p className="text-sm text-slate-500">Loading…</p>
            ) : !current ? (
              <p className="text-sm text-slate-500">Select an account</p>
            ) : filteredStatements.length === 0 ? (
              <p className="text-sm text-slate-500">No statements to show.</p>
            ) : (
              <table className="min-w-full text-sm">
                <thead className="text-left text-slate-500">
                  <tr>
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Reference</th>
                    <th className="py-2 pr-4">Credits</th>
                    <th className="py-2 pr-4">Debits</th>
                    <th className="py-2">Closing</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700">
                  {filteredStatements.slice(0, stmtPageSize).map((s, i) => (
                    <tr key={`${s.reference}-${i}`} className="border-t border-slate-100 cursor-pointer hover:bg-slate-50" onClick={()=> setDetailsYm((s.reference||'').replace('STM-',''))}>
                      <td className="py-2 pr-4">{s.date}</td>
                      <td className="py-2 pr-4">{s.reference}</td>
                      <td className="py-2 pr-4">$ {Number(s.credits).toLocaleString()}</td>
                      <td className="py-2 pr-4">$ {Number(s.debits).toLocaleString()}</td>
                      <td className="py-2">$ {Number(s.closing).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {!loadingStatements && filteredStatements.length > stmtPageSize && (
              <div className="pt-3">
                <button className="w-full" onClick={()=> setStmtPageSize(s=> s+12)}>Show more</button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Statement month details modal */}
      {detailsYm && current && (
        <Modal title={`Statement ${detailsYm}`} onClose={() => setDetailsYm(null)}>
          <StatementDetails
            ym={detailsYm}
            account={current}
            rows={statementTxns}
            summary={statements.find(s => (s.reference||'').endsWith(detailsYm))}
          />
        </Modal>
      )}

      {tab === 'open' && (
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <h2 className="font-medium text-slate-900">Open a new account</h2>
          <form onSubmit={onOpen} className="grid gap-3 mt-3 max-w-md">
            <label className="grid gap-1 text-sm">
              <span className="text-slate-700">Account name</span>
              <input className="rounded-md border-slate-300 focus:ring-brand focus:border-brand" value={openForm.name} onChange={(e)=>setOpenForm({...openForm, name:e.target.value})} />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-700">Type</span>
              <select className="rounded-md border-slate-300 focus:ring-brand focus:border-brand" value={openForm.type} onChange={(e)=>setOpenForm({...openForm, type:e.target.value})}>
                <option value="current">Current</option>
                <option value="savings">Savings</option>
              </select>
            </label>
            <button type="submit" className="bg-brand hover:bg-brand-dark w-fit">Open Account</button>
          </form>
        </section>
      )}

      {/* Deposit Modal */}
      {showDeposit && current && (
        <Modal title={`Deposit into ${current.name}`} onClose={() => setShowDeposit(false)}>
          <TransferLikeForm
            cta="Submit deposit"
            onSubmit={(amount, note) => submitOperation('deposit', current.id, amount, note)}
          />
        </Modal>
      )}
      {/* Withdraw Modal */}
      {showWithdraw && current && (
        <Modal title={`Withdraw from ${current.name}`} onClose={() => setShowWithdraw(false)}>
          <TransferLikeForm
            cta="Submit withdrawal"
            onSubmit={(amount, note) => submitOperation('withdraw', current.id, amount, note)}
          />
        </Modal>
      )}

      {showDeleteConfirm && current && (
        <Modal title={`Delete ${current.name}?`} onClose={() => setShowDeleteConfirm(false)}>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Warning</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>This action cannot be undone. This will permanently delete your account and remove all associated data.</p>
                    {current.balance !== 0 && (
                      <p className="mt-2 font-semibold">You must withdraw all funds (current balance: ${current.balance.toLocaleString()}) before deleting this account.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={deleteAccount}
                disabled={current.balance !== 0}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                  current.balance !== 0 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Delete Account
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// Build monthly statement summaries from list of transactions and current account
function aggregateMonthly(transactions, account) {
  if (!Array.isArray(transactions) || !account) return []
  // Group by YYYY-MM
  const groups = new Map()
  for (const t of transactions) {
    const d = new Date(t.createdAt)
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!groups.has(ym)) groups.set(ym, [])
    groups.get(ym).push(t)
  }
  // Build monthly rows
  const months = Array.from(groups.keys()).sort() // ascending
  const rows = months.map((ym) => {
    const list = groups.get(ym)
    let credits = 0, debits = 0
    for (const t of list) {
      const kind = String(t.kind || '').toUpperCase()
      const amt = Number(t.amount || 0)
      if (kind === 'DEPOSIT') credits += amt
      else if (kind === 'WITHDRAW') debits += amt
      else if (kind === 'TRANSFER') {
        if (t.toAccountId === account.id) credits += amt
        if (t.accountId === account.id) debits += amt
      }
    }
    const [y, m] = ym.split('-').map(n=>Number(n))
    const closingDate = new Date(y, m, 0) // last day of month
    return {
      ym,
      date: closingDate.toISOString().slice(0, 10),
      reference: `STM-${ym}`,
      credits: Math.round(credits * 100) / 100,
      debits: Math.round(debits * 100) / 100,
      closing: 0, // fill later
      net: credits - debits,
    }
  })
  // Compute closing using current balance as latest month's closing and back-propagate
  if (rows.length > 0) {
    // Determine latest month present
    const sorted = [...rows].sort((a, b) => a.ym < b.ym ? -1 : a.ym > b.ym ? 1 : 0)
    // Start from latest
    sorted[sorted.length - 1].closing = Number(account.balance || 0)
    for (let i = sorted.length - 2; i >= 0; i--) {
      const next = sorted[i + 1]
      // closing_i = closing_{i+1} - net_{i+1}
      sorted[i].closing = (next.closing ?? 0) - (next.net ?? 0)
    }
    // Map back to original order (ascending)
    const map = new Map(sorted.map(r => [r.ym, r]))
    return rows.map(r => ({ ...r, closing: map.get(r.ym).closing }))
  }
  return rows
}

function Tab({ label, active, onClick }) {
  return (
    <button onClick={onClick} className={`px-3 py-1.5 rounded-md text-sm ${active ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>{label}</button>
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

// Modal primitive
function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm grid place-items-center p-4 z-50">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg border border-slate-200">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-medium text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

// Simple amount/note form used by deposit/withdraw
function TransferLikeForm({ onSubmit, cta }) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  return (
    <form
      onSubmit={(e)=>{
        e.preventDefault()
        setError('')
        const val = Number(amount)
        if (!val || val <= 0) return setError('Enter a valid amount')
        onSubmit(val, note)
      }}
      className="grid gap-3"
    >
      {error && <div className="text-sm text-rose-600">{error}</div>}
      <label className="grid gap-1 text-sm">
        <span className="text-slate-700">Amount ($)</span>
        <input value={amount} onChange={(e)=>setAmount(e.target.value)} type="number" step="0.01" className="rounded-md border-slate-300 focus:ring-brand focus:border-brand" />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="text-slate-700">Note (optional)</span>
        <input value={note} onChange={(e)=>setNote(e.target.value)} className="rounded-md border-slate-300 focus:ring-brand focus:border-brand" />
      </label>
      <div className="flex gap-2">
        <button type="submit" className="bg-brand hover:bg-brand-dark">{cta}</button>
      </div>
      <p className="text-xs text-slate-500">Processed immediately and recorded as a transaction.</p>
    </form>
  )
}

// Transactions table
function TransactionsTable({ rows }) {
  if (!rows || rows.length === 0) return <p className="text-sm text-slate-500">No records.</p>
  return (
    <table className="min-w-full text-sm">
      <thead className="text-left text-slate-500">
        <tr>
          <th className="py-2 pr-4">Type</th>
          <th className="py-2 pr-4">Amount</th>
          <th className="py-2 pr-4">Currency</th>
          <th className="py-2 pr-4">Note</th>
          <th className="py-2 pr-4">Status</th>
          <th className="py-2 pr-4">Created</th>
        </tr>
      </thead>
      <tbody className="text-slate-700">
        {rows.map(op => (
          <tr key={op.id} className="border-t border-slate-100">
            <td className="py-2 pr-4 capitalize">{String(op.kind).toLowerCase()}</td>
            <td className="py-2 pr-4">$ {Number(op.amount).toLocaleString()}</td>
            <td className="py-2 pr-4">{op.currency}</td>
            <td className="py-2 pr-4">{op.note || '-'}</td>
            <td className="py-2 pr-4">{String(op.status).toLowerCase()}</td>
            <td className="py-2 pr-4">{new Date(op.createdAt).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
