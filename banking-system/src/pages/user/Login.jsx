import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../components/common/ToastProvider.jsx'
import { api } from '../../lib/api.js'

export default function UserLogin() {
  const { notify } = useToast()
  const [mode, setMode] = useState('login') // login | signup | reset
  const [mfa, setMfa] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', name: '', code: '' })
  const [error, setError] = useState('')
  const [remember, setRemember] = useState(true)
  const navigate = useNavigate()

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.email || !form.password) {
      const msg = 'Email and password are required'
      setError(msg)
      notify({ title: 'Login error', description: msg, variant: 'error' })
      return
    }
    try {
      const user = await api.post('/api/users/login', { email: form.email, password: form.password })
      // For now we simulate 2FA after credential verification
      setMfa(true)
      // Stash the user id temporarily to set after verify
      try {
        sessionStorage.setItem('pending_user_id', String(user.id))
        if (user.token) sessionStorage.setItem('pending_user_token', user.token)
        if (user.name) sessionStorage.setItem('pending_user_name', user.name)
      } catch { /* noop */ }
      notify({ title: 'Check your device', description: 'We sent you a 2FA code', variant: 'info' })
    } catch (err) {
      const msg = err.message || 'Login failed'
      setError(msg)
      notify({ title: 'Login error', description: msg, variant: 'error' })
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name || !form.email || !form.password) {
      const msg = 'All fields are required'
      setError(msg)
      notify({ title: 'Signup error', description: msg, variant: 'error' })
      return
    }
    try {
      await api.post('/api/users', { name: form.name, email: form.email, password: form.password })
      setMfa(true)
      notify({ title: 'Verify email/phone', description: 'Enter the 2FA code to complete signup', variant: 'info' })
    } catch (err) {
      const msg = err.message || 'Signup failed'
      setError(msg)
      notify({ title: 'Signup error', description: msg, variant: 'error' })
    }
  }

  const handleReset = (e) => {
    e.preventDefault()
    setError('')
    if (!form.email) {
      const msg = 'Email is required'
      setError(msg)
      notify({ title: 'Reset error', description: msg, variant: 'error' })
      return
    }
    notify({ title: 'Reset link sent', description: 'Check your email for the reset link', variant: 'success' })
  }

  const handleVerify = (e) => {
    e.preventDefault()
    setError('')
    if (!form.code || form.code.length < 4) {
      const msg = 'Enter the 2FA code sent to you'
      setError(msg)
      notify({ title: 'Verification error', description: msg, variant: 'error' })
      return
    }
    try {
      const pending = sessionStorage.getItem('pending_user_id') || '0'
      const token = sessionStorage.getItem('pending_user_token') || ''
      const name = sessionStorage.getItem('pending_user_name') || ''
      // Persist based on Remember Me
      if (remember) {
        localStorage.setItem('user_id', pending)
        if (token) localStorage.setItem('user_token', token)
        localStorage.setItem('user_auth', 'true')
        if (name) localStorage.setItem('user_name', name)
        // clear any session copies
        try { sessionStorage.removeItem('user_token') } catch { /* no-op */ }
      } else {
        sessionStorage.setItem('user_id', pending)
        if (token) sessionStorage.setItem('user_token', token)
        sessionStorage.setItem('user_auth', 'true')
        if (name) sessionStorage.setItem('user_name', name)
        // clear any local copies
        try { localStorage.removeItem('user_token') } catch { /* no-op */ }
      }
      sessionStorage.removeItem('pending_user_id')
      sessionStorage.removeItem('pending_user_token')
      sessionStorage.removeItem('pending_user_name')
    } catch { /* noop */ }
    notify({ title: 'Welcome back', description: 'Login successful', variant: 'success' })
    navigate('/user/dashboard')
  }

  return (
    <div className="min-h-[70vh] grid place-items-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-slate-900">{mfa ? 'Two-Factor Authentication' : mode === 'login' ? 'Login' : mode === 'signup' ? 'Create an account' : 'Reset password'}</h1>
          {!mfa && (
            <div className="text-sm text-slate-600">
              {mode === 'login' ? (
                <button className="text-brand hover:text-brand-dark" onClick={() => setMode('signup')}>Sign up</button>
              ) : (
                <button className="text-brand hover:text-brand-dark" onClick={() => setMode('login')}>Login</button>
              )}
            </div>
          )}
        </div>

        {error && <div className="mb-3 text-sm text-rose-600">{error}</div>}

        {!mfa && mode === 'login' && (
          <form onSubmit={handleLogin} className="grid gap-3">
            <label className="grid gap-1 text-sm">
              <span className="text-slate-700">Email</span>
              <input name="email" type="email" value={form.email} onChange={onChange} className="rounded-md border-slate-300 focus:ring-brand focus:border-brand" />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-700">Password</span>
              <input name="password" type="password" value={form.password} onChange={onChange} className="rounded-md border-slate-300 focus:ring-brand focus:border-brand" />
            </label>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-slate-300" checked={remember} onChange={(e)=>setRemember(e.target.checked)} />
                <span>Remember me</span>
              </label>
              <button type="button" className="text-brand hover:text-brand-dark" onClick={() => setMode('reset')}>Forgot password?</button>
            </div>
            <button type="submit" className="bg-brand hover:bg-brand-dark">Continue</button>
          </form>
        )}

        {!mfa && mode === 'signup' && (
          <form onSubmit={handleSignup} className="grid gap-3">
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
            <button type="submit" className="bg-brand hover:bg-brand-dark">Create account</button>
          </form>
        )}

        {!mfa && mode === 'reset' && (
          <form onSubmit={handleReset} className="grid gap-3">
            <label className="grid gap-1 text-sm">
              <span className="text-slate-700">Email</span>
              <input name="email" type="email" value={form.email} onChange={onChange} className="rounded-md border-slate-300 focus:ring-brand focus:border-brand" />
            </label>
            <div className="flex gap-2">
              <button type="submit" className="bg-brand hover:bg-brand-dark">Send reset link</button>
              <button type="button" onClick={() => setMode('login')}>Back to login</button>
            </div>
          </form>
        )}

        {mfa && (
          <form onSubmit={handleVerify} className="grid gap-3">
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
