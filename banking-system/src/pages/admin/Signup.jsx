import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../components/common/ToastProvider.jsx'
import { apiFetch } from '../../lib/api.js'

export default function AdminSignup() {
  const { notify } = useToast()
  const nav = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'OWNER', adminCode: '', code: '' })
  const [mfa, setMfa] = useState(false)
  const [error, setError] = useState('')

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name || !form.email || !form.password || !form.adminCode) {
      const msg = 'All fields are required'
      setError(msg)
      notify({ title: 'Signup error', description: msg, variant: 'error' })
      return
    }
    try {
      await apiFetch('/api/admin/users', {
        method: 'POST',
        headers: { 'x-admin-code': form.adminCode },
        body: { name: form.name, email: form.email, password: form.password, role: form.role }
      })
      setMfa(true)
      notify({ title: 'Verify email/phone', description: 'Enter the 2FA code to complete signup', variant: 'info' })
    } catch (err) {
      const msg = err.message || 'Admin signup failed'
      setError(msg)
      notify({ title: 'Signup error', description: msg, variant: 'error' })
    }
  }

  const verify = (e) => {
    e.preventDefault()
    setError('')
    if (!form.code || form.code.length < 4) {
      const msg = 'Enter the 2FA code sent to you'
      setError(msg)
      notify({ title: 'Verification error', description: msg, variant: 'error' })
      return
    }
    notify({ title: 'Admin account created', description: 'Welcome to the admin portal', variant: 'success' })
    nav('/admin/login')
  }

  return (
    <div className="min-h-[70vh] grid place-items-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h1 className="text-xl font-semibold text-slate-900 mb-4">Admin Sign up</h1>
        {!mfa ? (
          <form onSubmit={submit} className="grid gap-3">
            {error && <div className="text-sm text-rose-600">{error}</div>}
            <label className="grid gap-1 text-sm">
              <span className="text-slate-700">Full name</span>
              <input name="name" value={form.name} onChange={onChange} className="rounded-md border-slate-300 focus:ring-brand focus:border-brand" />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-700">Email</span>
              <input name="email" type="email" value={form.email} onChange={onChange} className="rounded-md border-slate-300 focus:ring-brand focus:border-brand" />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-700">Password</span>
              <input name="password" type="password" value={form.password} onChange={onChange} className="rounded-md border-slate-300 focus:ring-brand focus:border-brand" />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-700">Role</span>
              <select name="role" value={form.role} onChange={onChange} className="rounded-md border-slate-300 focus:ring-brand focus:border-brand">
                <option value="OWNER">Owner</option>
                <option value="MANAGER">Manager</option>
                <option value="ANALYST">Analyst</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-700">Admin setup code</span>
              <input name="adminCode" value={form.adminCode} onChange={onChange} className="rounded-md border-slate-300 focus:ring-brand focus:border-brand" placeholder="Enter ADMIN_AUTH_CODE" />
            </label>
            <button type="submit" className="bg-brand hover:bg-brand-dark">Create admin</button>
          </form>
        ) : (
          <form onSubmit={verify} className="grid gap-3">
            {error && <div className="text-sm text-rose-600">{error}</div>}
            <p className="text-sm text-slate-600">Enter the 2FA code sent to your email/phone</p>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-700">Code</span>
              <input name="code" value={form.code} onChange={onChange} className="rounded-md border-slate-300 focus:ring-brand focus:border-brand" />
            </label>
            <button type="submit" className="bg-brand hover:bg-brand-dark">Verify & Continue</button>
          </form>
        )}
      </div>
    </div>
  )
}
