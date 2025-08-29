import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '../../components/common/ToastProvider.jsx'
import { api } from '../../lib/api.js'

export default function LoansApply() {
  const nav = useNavigate()
  const { notify } = useToast()

  // calculator
  const [amount, setAmount] = useState(5000)
  const [annualRate, setAnnualRate] = useState(12)
  const [months, setMonths] = useState(24)
  const [currencyCode, setCurrencyCode] = useState('USD')

  // applicant details
  const [fullName, setFullName] = useState('')
  const [income, setIncome] = useState('')
  const [employment, setEmployment] = useState('employed')
  const [purpose, setPurpose] = useState('Personal')

  const { monthly, total, interest } = useMemo(() => {
    const P = Number(amount) || 0
    const r = (Number(annualRate) || 0) / 100 / 12
    const n = Number(months) || 0
    let m = 0
    if (r === 0) {
      m = n ? P / n : 0
    } else {
      m = n ? (P * r) / (1 - Math.pow(1 + r, -n)) : 0
    }
    const t = m * n
    const i = t - P
    return { monthly: m, total: t, interest: i }
  }, [amount, annualRate, months])

  const money = (n) => new Intl.NumberFormat(undefined, { style: 'currency', currency: currencyCode }).format(+n || 0)

  function validate() {
    const errs = []
    if (!fullName.trim()) errs.push('Full name is required')
    if ((+amount) <= 0) errs.push('Amount must be greater than 0')
    if ((+annualRate) < 0 || (+annualRate) > 100) errs.push('Annual rate must be between 0 and 100')
    if ((+months) < 1) errs.push('Term must be at least 1 month')
    if ((+income) < 0) errs.push('Monthly income cannot be negative')
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (errs.length) {
      notify({ title: 'Fix validation errors', description: errs.join('\n'), variant: 'error', duration: 4500 })
      return
    }
    try {
      const payload = {
        fullName,
        income: Number(income),
        employment: employment === 'self-employed' ? 'SELF_EMPLOYED' : employment.toUpperCase(),
        purpose,
        amount: Number(amount),
        annualRate: Number(annualRate),
        months: Number(months),
        currency: currencyCode
      }
      await api.post('/api/loans', payload)
      notify({ title: 'Application submitted', description: 'We will review and contact you shortly.', variant: 'success' })
      nav('/user/loans')
    } catch (e) {
      notify({ title: 'Could not submit application', description: String(e.message || e), variant: 'error' })
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Apply for a Loan</h1>
        <p className="text-slate-600 text-sm">Estimate your repayment, then proceed to submit your application.</p>
      </header>

      <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="font-medium mb-4">Loan Calculator</h2>
          <div className="space-y-4 text-sm">
            <label className="block">
              <span className="text-slate-700">Currency</span>
              <select
                className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-300"
                value={currencyCode}
                onChange={(e)=>setCurrencyCode(e.target.value)}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </label>
            <label className="block">
              <span className="text-slate-700">Amount</span>
              <input
                type="number"
                className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-300"
                value={amount}
                min={0}
                onChange={(e)=>setAmount(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-slate-700">Annual interest rate (%)</span>
              <input
                type="number"
                className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-300"
                value={annualRate}
                min={0}
                step={0.01}
                onChange={(e)=>setAnnualRate(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-slate-700">Term (months)</span>
              <input
                type="number"
                className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-300"
                value={months}
                min={1}
                onChange={(e)=>setMonths(e.target.value)}
              />
            </label>
            <div className="flex flex-wrap gap-2 text-xs">
              {[12,24,36,60].map((m)=> (
                <button type="button" key={m} onClick={()=>setMonths(m)} className={`px-2 py-1 rounded border ${months==m?'bg-purple-600 text-white border-purple-600':'border-slate-300 hover:bg-slate-50'}`}>{m} mo</button>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="font-medium mb-4">Estimated Repayment</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between"><span>Monthly payment:</span><strong>{money(monthly)}</strong></li>
            <li className="flex justify-between"><span>Total repayment:</span><strong>{money(total)}</strong></li>
            <li className="flex justify-between"><span>Total interest:</span><strong>{money(interest)}</strong></li>
          </ul>
          <div className="mt-6 flex gap-3">
            <button type="submit" className="px-3 py-1.5 rounded bg-purple-600 text-white hover:bg-purple-700">Submit Application</button>
            <Link to="/user/loans" className="px-3 py-1.5 rounded border border-slate-300 hover:bg-slate-50">Back</Link>
          </div>
        </section>

        <section className="md:col-span-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="font-medium mb-4">Applicant Details</h2>
          <div className="grid gap-4 md:grid-cols-2 text-sm">
            <label className="block">
              <span className="text-slate-700">Full name</span>
              <input type="text" className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-300" value={fullName} onChange={(e)=>setFullName(e.target.value)} />
            </label>
            <label className="block">
              <span className="text-slate-700">Monthly income ({currencyCode})</span>
              <input type="number" min={0} className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-300" value={income} onChange={(e)=>setIncome(e.target.value)} />
            </label>
            <label className="block">
              <span className="text-slate-700">Employment status</span>
              <select className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-300" value={employment} onChange={(e)=>setEmployment(e.target.value)}>
                <option value="employed">Employed</option>
                <option value="self-employed">Self-employed</option>
                <option value="student">Student</option>
                <option value="unemployed">Unemployed</option>
              </select>
            </label>
            <label className="block">
              <span className="text-slate-700">Purpose</span>
              <select className="mt-1 w-full rounded border border-slate-300 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-300" value={purpose} onChange={(e)=>setPurpose(e.target.value)}>
                <option>Personal</option>
                <option>Auto</option>
                <option>Education</option>
                <option>Home Improvement</option>
                <option>Debt Consolidation</option>
              </select>
            </label>
          </div>
        </section>

      </form>
    </div>
  )
}
