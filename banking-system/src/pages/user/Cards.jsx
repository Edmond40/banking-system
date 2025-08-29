import { useEffect, useMemo, useState } from 'react'
import { useToast } from '../../components/common/ToastProvider.jsx'
import { api } from '../../lib/api.js'

export default function UserCards() {
  const { notify } = useToast()
  const [cards, setCards] = useState([])
  const [selected, setSelected] = useState(null)
  const current = useMemo(() => cards.find(c => c.id === selected), [cards, selected])

  const [limitForm, setLimitForm] = useState({ daily: '', online: '' })

  useEffect(() => {
    ;(async () => {
      try {
        const rows = await api.get('/api/cards')
        setCards(rows)
        if (rows.length) setSelected(rows[0].id)
      } catch (e) {
        notify({ title: 'Failed to load cards', description: String(e.message || e), variant: 'error' })
      }
    })()
  }, [])

  const toggleFreeze = async (card) => {
    try {
      const path = `/api/cards/${card.id}/${card.status === 'ACTIVE' ? 'freeze' : 'unfreeze'}`
      const updated = await api.post(path)
      setCards(cards.map(c => c.id === updated.id ? updated : c))
      notify({
        title: updated.status === 'FROZEN' ? 'Card frozen' : 'Card unfrozen',
        description: `${updated.label} • •••• ${updated.last4}`,
        variant: updated.status === 'FROZEN' ? 'error' : 'success'
      })
    } catch (e) {
      notify({ title: 'Action failed', description: String(e.message || e), variant: 'error' })
    }
  }

  const activate = async (card) => {
    try {
      const updated = await api.post(`/api/cards/${card.id}/activate`)
      setCards(cards.map(c => c.id === updated.id ? updated : c))
      notify({ title: 'Card activated', description: `${updated.label} • •••• ${updated.last4}`, variant: 'success' })
    } catch (e) {
      notify({ title: 'Activation failed', description: String(e.message || e), variant: 'error' })
    }
  }

  const saveLimits = async (e) => {
    e.preventDefault()
    const d = Number(limitForm.daily)
    const o = Number(limitForm.online)
    if ((limitForm.daily && isNaN(d)) || (limitForm.online && isNaN(o))) {
      notify({ title: 'Invalid limits', description: 'Please enter valid numbers', variant: 'error' })
      return
    }
    try {
      const payload = {}
      if (limitForm.daily !== '') payload.limitDaily = d
      if (limitForm.online !== '') payload.limitOnline = o
      const updated = await api.post(`/api/cards/${selected}/limits`, payload)
      setCards(cards.map(c => c.id === updated.id ? updated : c))
      setLimitForm({ daily: '', online: '' })
      notify({ title: 'Limits updated', description: 'New limits saved for this card', variant: 'success' })
    } catch (e) {
      notify({ title: 'Failed to update limits', description: String(e.message || e), variant: 'error' })
    }
  }

  const revealToken = (card) => {
    // Mock one-time reveal for tokenized PAN
    if (card.tokenRevealed) {
      notify({ title: 'Already revealed', description: 'Token already revealed (mock)', variant: 'info' })
      return
    }
    notify({ title: 'Tokenized PAN', description: `4111 11•• •••• ${card.last4} (mock)`, variant: 'info' })
    setCards(cards.map(c => c.id === card.id ? { ...c, tokenRevealed: true } : c))
  }

  const issueVirtual = async () => {
    try {
      const last4 = String(Math.floor(1000 + Math.random() * 9000))
      const now = new Date()
      const expMonth = ((now.getMonth() + 1) % 12) + 1
      const expYear = now.getFullYear() + 3
      const created = await api.post('/api/cards', {
        type: 'VIRTUAL',
        label: 'New Virtual',
        last4,
        expMonth,
        expYear,
        limitDaily: 200,
        limitOnline: 200,
      })
      setCards([created, ...cards])
      setSelected(created.id)
      notify({ title: 'Virtual card issued', description: 'A new virtual card is ready to use', variant: 'success' })
    } catch (e) {
      notify({ title: 'Failed to issue card', description: String(e.message || e), variant: 'error' })
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Cards</h1>
          <p className="text-slate-500">Manage your virtual and physical cards, limits, and controls</p>
        </div>
        <button onClick={issueVirtual} className="bg-brand hover:bg-brand-dark">Issue virtual card</button>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-3 border-b border-slate-100 font-medium">Your cards</div>
          <ul className="divide-y divide-slate-100">
            {cards.map(c => (
              <li key={c.id} className={`px-4 py-3 cursor-pointer ${selected===c.id ? 'bg-slate-50' : ''}`} onClick={() => setSelected(c.id)}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-900 font-medium">{c.label}</p>
                    <p className="text-xs text-slate-500">{c.type} • •••• {c.last4} • EXP {String(c.expMonth).padStart(2,'0')}/{String(c.expYear).slice(-2)}</p>
                  </div>
                  <span className={`text-xs rounded-full px-2 py-0.5 ${c.status==='ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{c.status}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4">
          {current ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{current.label}</h2>
                  <p className="text-sm text-slate-500">{current.type} • •••• {current.last4} • EXP {String(current.expMonth).padStart(2,'0')}/{String(current.expYear).slice(-2)}</p>
                </div>
                {!current.activated && (
                  <button onClick={() => activate(current)} className="bg-brand hover:bg-brand-dark">Activate</button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Info label="Status" value={current.status} />
                <Info label="Daily limit" value={`$ ${(Number(current.limitDaily)||0).toLocaleString()}`} />
                <Info label="Online limit" value={`$ ${(Number(current.limitOnline)||0).toLocaleString()}`} />
              </div>

              <div className="flex flex-wrap gap-2">
                <button onClick={() => toggleFreeze(current)}>{current.status === 'ACTIVE' ? 'Freeze card' : 'Unfreeze card'}</button>
                <button onClick={() => revealToken(current)}>Reveal tokenized PAN</button>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <h3 className="font-medium text-slate-900 mb-2">Set spending limits</h3>
                <form onSubmit={saveLimits} className="grid grid-cols-1 md:grid-cols-3 gap-3 max-w-2xl">
                  <label className="grid gap-1 text-sm">
                    <span className="text-slate-700">Daily limit ($)</span>
                    <input value={limitForm.daily} onChange={(e)=>setLimitForm({ ...limitForm, daily: e.target.value })} className="rounded-md border-slate-300 focus:ring-brand focus:border-brand" />
                  </label>
                  <label className="grid gap-1 text-sm">
                    <span className="text-slate-700">Online limit ($)</span>
                    <input value={limitForm.online} onChange={(e)=>setLimitForm({ ...limitForm, online: e.target.value })} className="rounded-md border-slate-300 focus:ring-brand focus:border-brand" />
                  </label>
                  <div className="flex items-end">
                    <button type="submit" className="bg-brand hover:bg-brand-dark">Save limits</button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <p className="text-slate-500">Select a card to manage</p>
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
