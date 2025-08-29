import { useEffect, useMemo, useState } from 'react'
import { useToast } from '../../components/common/ToastProvider.jsx'
import api from '../../lib/api.js'

export default function UserTransfers() {
  const { notify } = useToast()
  const [mode, setMode] = useState('own') // own | intra
  const [accounts, setAccounts] = useState([])
  const [beneficiaries, setBeneficiaries] = useState([])

  const [form, setForm] = useState({
    from: '',
    toOwn: '',
    toName: '',
    toBank: '',
    toAcct: '',
    amount: '',
    desc: '',
    schedule: 'now', // now | later | recurring
    date: '',
    freq: 'monthly',
    saveBeneficiary: true,
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fromAcc = useMemo(() => accounts.find(a => a.id === form.from), [accounts, form.from])

  // Load accounts and beneficiaries from backend
  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const userId = Number(localStorage.getItem('user_id')) || undefined
        const [accRows, benRows] = await Promise.all([
          api.get(`/api/accounts${userId ? `?userId=${userId}` : ''}`),
          api.get('/api/beneficiaries')
        ])
        if (!mounted) return
        setAccounts(accRows || [])
        setBeneficiaries((benRows || []).map(b => ({ id: b.id, name: b.name, bank: b.bank, acct: b.accountRef })))
        // initialize form selections if empty
        if ((accRows?.length || 0) > 0) {
          setForm(f => ({
            ...f,
            from: f.from || accRows[0].id,
            toOwn: f.toOwn || (accRows[1]?.id || '')
          }))
        }
      } catch (e) {
        notify({ title: 'Failed to load data', description: e.message || String(e), variant: 'error' })
      }
    }
    load()
    return () => { mounted = false }
  }, [notify])

  const fee = useMemo(() => {
    const amt = Number(form.amount || 0)
    if (!amt) return 0
    const base = mode === 'own' ? 0 : 0.01 * amt // 1% for intra-bank mock
    return Math.min(Math.max(base, mode === 'own' ? 0 : 0.5), 10) // clamp 0.5 - 10 for intra
  }, [form.amount, mode])

  const total = useMemo(() => Number(form.amount || 0) + fee, [form.amount, fee])

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  const selectBeneficiary = (ben) => {
    setForm(f => ({ ...f, toName: ben.name, toBank: ben.bank, toAcct: ben.acct }))
  }

  const validate = () => {
    if (!form.from) return 'Select source account'
    if (!form.amount || Number(form.amount) <= 0) return 'Enter a valid amount'
    if (mode === 'own' && (!form.toOwn || form.toOwn === form.from)) return 'Select a different destination account'
    if (mode === 'intra' && (!form.toName || !form.toBank || !form.toAcct)) return 'Enter beneficiary details'
    if (form.schedule !== 'now' && !form.date) return 'Select a schedule date'
    return ''
  }

  const submit = async (e) => {
    e.preventDefault()
    setSuccess('')
    const err = validate()
    if (err) {
      setError(err)
      notify({ title: 'Transfer error', description: err, variant: 'error' })
      return
    }
    setError('')
    try {
      if (mode === 'own') {
        await api.post('/api/transactions/transfer', {
          fromAccountId: Number(form.from),
          toAccountId: Number(form.toOwn),
          amount: Number(form.amount),
          note: form.desc
        })
        notify({ title: 'Transfer successful', description: `$${Number(form.amount).toFixed(2)} moved between your accounts`, variant: 'success' })
        setSuccess(`Transfer of $${Number(form.amount).toFixed(2)} completed`)
        // refresh accounts to reflect updated balances
        const userId = Number(localStorage.getItem('user_id')) || undefined
        const rows = await api.get(`/api/accounts${userId ? `?userId=${userId}` : ''}`)
        setAccounts(rows || [])
      } else {
        // Save beneficiary if chosen
        if (form.saveBeneficiary) {
          try {
            const userId = Number(localStorage.getItem('user_id')) || undefined
            await api.post('/api/beneficiaries', { userId, name: form.toName, bank: form.toBank, accountRef: form.toAcct })
            const list = await api.get('/api/beneficiaries')
            setBeneficiaries((list || []).map(b => ({ id: b.id, name: b.name, bank: b.bank, acct: b.accountRef })))
          } catch (benErr) {
            // Non-fatal
            notify({ title: 'Saved beneficiary failed', description: benErr.message || String(benErr), variant: 'error' })
          }
        }
        notify({ title: 'Not yet supported', description: 'External/intra-bank transfers are not enabled yet.', variant: 'info' })
        setSuccess('Beneficiary saved. External transfer feature coming soon.')
      }
      // Reset amount/desc only
      setForm(f => ({ ...f, amount: '', desc: '' }))
    } catch (e2) {
      notify({ title: 'Transfer failed', description: e2.message || String(e2), variant: 'error' })
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Transfers</h1>
          <p className="text-slate-500">Move money between your accounts or to other bank users</p>
        </div>
      </header>

      <div className="flex gap-2 text-sm">
        <Tab label="Own Accounts" active={mode==='own'} onClick={() => setMode('own')} />
        <Tab label="Intra-bank" active={mode==='intra'} onClick={() => setMode('intra')} />
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={submit} className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-4 grid gap-3">
          {error && <div className="text-sm text-rose-600">{error}</div>}
          {success && <div className="text-sm text-emerald-700">{success}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm">
              <span className="text-slate-700">From account</span>
              <select name="from" value={form.from} onChange={onChange} className="rounded-md border-slate-300 focus:ring-brand focus:border-brand">
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name} (••• {String(a.number).slice(-4)})</option>)}
              </select>
            </label>

            {mode === 'own' ? (
              <label className="grid gap-1 text-sm">
                <span className="text-slate-700">To account</span>
                <select name="toOwn" value={form.toOwn} onChange={onChange} className="rounded-md border-slate-300 focus:ring-brand focus:border-brand">
                  {accounts.filter(a => a.id !== form.from).map(a => <option key={a.id} value={a.id}>{a.name} (••• {String(a.number).slice(-4)})</option>)}
                </select>
              </label>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:col-span-1">
                <label className="grid gap-1 text-sm">
                  <span className="text-slate-700">Beneficiary name</span>
                  <input name="toName" value={form.toName} onChange={onChange} className="rounded-md border-slate-300 focus:ring-brand focus:border-brand" />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="text-slate-700">Bank</span>
                  <input name="toBank" value={form.toBank} onChange={onChange} className="rounded-md border-slate-300 focus:ring-brand focus:border-brand" />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="text-slate-700">Account / IBAN</span>
                  <input name="toAcct" value={form.toAcct} onChange={onChange} className="rounded-md border-slate-300 focus:ring-brand focus:border-brand" />
                </label>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="grid gap-1 text-sm">
              <span className="text-slate-700">Amount</span>
              <input name="amount" type="number" step="0.01" value={form.amount} onChange={onChange} className="rounded-md border-slate-300 focus:ring-brand focus:border-brand" />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-700">Description</span>
              <input name="desc" value={form.desc} onChange={onChange} className="rounded-md border-slate-300 focus:ring-brand focus:border-brand" />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-700">Schedule</span>
              <select name="schedule" value={form.schedule} onChange={onChange} className="rounded-md border-slate-300 focus:ring-brand focus:border-brand">
                <option value="now">Now</option>
                <option value="later">Later</option>
                <option value="recurring">Recurring</option>
              </select>
            </label>
          </div>

          {form.schedule !== 'now' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="grid gap-1 text-sm">
                <span className="text-slate-700">Date</span>
                <input name="date" type="date" value={form.date} onChange={onChange} className="rounded-md border-slate-300 focus:ring-brand focus:border-brand" />
              </label>
              {form.schedule === 'recurring' && (
                <label className="grid gap-1 text-sm">
                  <span className="text-slate-700">Frequency</span>
                  <select name="freq" value={form.freq} onChange={onChange} className="rounded-md border-slate-300 focus:ring-brand focus:border-brand">
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </label>
              )}
              {mode === 'intra' && (
                <label className="flex items-center gap-2 text-sm mt-6">
                  <input name="saveBeneficiary" type="checkbox" checked={form.saveBeneficiary} onChange={onChange} className="rounded border-slate-300" />
                  <span>Save beneficiary</span>
                </label>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-slate-600">Fee: <span className="font-medium text-slate-800">$ {fee.toFixed(2)}</span> • Total debit: <span className="font-semibold">$ {total.toFixed(2)}</span></p>
            <button type="submit" className="bg-brand hover:bg-brand-dark">Submit Transfer</button>
          </div>
        </form>

        <aside className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4">
          <div>
            <h3 className="font-medium text-slate-900">Account summary</h3>
            <ul className="mt-2 text-sm text-slate-700 space-y-1">
              {accounts.map(a => (
                <li key={a.id} className="flex items-center justify-between">
                  <span>{a.name} (••• {String(a.number).slice(-4)})</span>
                  <span>$ {a.balance.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>

          {mode === 'intra' && (
            <div>
              <h3 className="font-medium text-slate-900">Saved beneficiaries</h3>
              <ul className="mt-2 divide-y divide-slate-100">
                {beneficiaries.map(b => (
                  <li key={b.id} className="py-2 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-900">{b.name}</p>
                      <p className="text-xs text-slate-500">{b.bank} • {b.acct}</p>
                    </div>
                    <button onClick={() => selectBeneficiary(b)} className="text-sm">Use</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </section>
    </div>
  )
}

function Tab({ label, active, onClick }) {
  return (
    <button onClick={onClick} className={`px-3 py-1.5 rounded-md text-sm ${active ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>{label}</button>
  )
}
