import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api.js'

export default function AdminLogin() {
  const [code, setCode] = useState('')
  const [show, setShow] = useState(false)
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mfa, setMfa] = useState(false)
  const [otp, setOtp] = useState('')
  const [pendingToken, setPendingToken] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState(0)
  const navigate = useNavigate()
  const otpInputRef = useRef(null)

  useEffect(() => {
    // If already signed in, go to dashboard
    try {
      const t = localStorage.getItem('admin_token') || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('admin_token') : null)
      if (t) navigate('/admin/dashboard', { replace: true })
    } catch {
      // no-op
    }
  }, [navigate])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!code) { setError('Enter your admin code'); return }
    if (code.length < 4) { setError('Code must be at least 4 characters'); return }
    const now = Date.now()
    if (lockedUntil && now < lockedUntil) {
      const secs = Math.ceil((lockedUntil - now)/1000)
      setError(`Too many attempts. Try again in ${secs}s`)
      return
    }
    try {
      setLoading(true)
      const res = await api.post('/api/admin/auth/login', { code })
      // hold token until OTP is confirmed
      setPendingToken(res.token)
      setMfa(true)
      setTimeout(()=> otpInputRef.current?.focus(), 50)
    } catch (err) {
      setAttempts(a => a + 1)
      if (attempts + 1 >= 5) {
        setLockedUntil(Date.now() + 30_000) // 30s lockout
        setAttempts(0)
        setError('Too many attempts. Locked for 30 seconds')
      } else {
        setError(err.message || 'Login failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const verify = (e) => {
    e.preventDefault()
    setError('')
    // Mock OTP check: accept any 4+ digits; plug real API later
    const valid = otp && otp.replace(/\D/g,'').length >= 4
    if (!valid) { setError('Enter the 2FA code sent to you'); return }
    try {
      if (remember) {
        localStorage.setItem('admin_token', pendingToken)
        sessionStorage.removeItem('admin_token')
      } else {
        sessionStorage.setItem('admin_token', pendingToken)
        localStorage.removeItem('admin_token')
      }
      // optional: reflect auth state for header components that watch this flag
      localStorage.setItem('admin_auth', 'true')
    } catch {}
    navigate('/admin/dashboard')
  }

  return (
    <div className="min-h-[70vh] grid place-items-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-slate-900">{mfa ? 'Two-Factor Authentication' : 'Admin Login'}</h1>
          {!mfa && (
            <button type="button" className="text-sm text-brand hover:text-brand-dark" onClick={()=>navigate('/admin/signup')} aria-label="Go to signup">
              Create admin
            </button>
          )}
        </div>
        {error && <div className="mb-3 text-sm text-rose-600" role="alert">{error}</div>}
        {!mfa ? (
        <form onSubmit={submit} className="grid gap-3" aria-label="Admin code login">
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700 flex items-center gap-2">Admin code
              <span className="inline-block text-xs text-slate-500" title="Ask your system owner for the current admin code">(what's this?)</span>
            </span>
            <div className="flex gap-2 items-center">
              <input
                value={code}
                onChange={(e)=>setCode(e.target.value)}
                type={show ? 'text' : 'password'}
                placeholder="Enter code"
                className="flex-1 rounded-md border-slate-300 focus:ring-brand focus:border-brand"
                onKeyDown={(e)=>{ if(e.key==='Enter'){ submit(e) } }}
                aria-label="Admin code"
              />
              <button type="button" onClick={()=>setShow(s=>!s)} className="text-sm px-2 py-1 border rounded-md" aria-pressed={show} aria-label="Toggle code visibility">
                {show ? 'Hide' : 'Show'}
              </button>
              <button
                type="button"
                className="text-sm px-2 py-1 border rounded-md"
                onClick={async ()=>{
                  try {
                    const txt = await navigator.clipboard.readText()
                    if (txt) setCode(txt.trim())
                  } catch {
                    setError('Clipboard not available. Paste manually (Ctrl/Cmd+V).')
                  }
                }}
                >Paste</button>
            </div>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={remember} onChange={(e)=>setRemember(e.target.checked)} className="rounded border-slate-300" />
            <span>Remember this device</span>
          </label>
          <button type="submit" disabled={loading} className="bg-brand hover:bg-brand-dark disabled:opacity-60">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
          <div className="flex items-center justify-between text-sm text-slate-600 mt-1" aria-live="polite">
            <span className="text-slate-500">Min code length: 4</span>
            <button type="button" className="hover:text-slate-800" onClick={()=>alert('Contact your system owner for the current admin code.')}>Forgot code?</button>
          </div>
        </form>
        ) : (
        <form onSubmit={verify} className="grid gap-3" aria-label="Two-factor verification">
          <p className="text-sm text-slate-600">Enter the 2FA code sent to your email/phone</p>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Code</span>
            <input ref={otpInputRef} value={otp} onChange={(e)=>setOtp(e.target.value)} inputMode="numeric" pattern="[0-9]*" className="rounded-md border-slate-300 focus:ring-brand focus:border-brand" aria-label="Two factor code" />
          </label>
          <div className="flex gap-2">
            <button type="submit" className="bg-brand hover:bg-brand-dark">Verify & Continue</button>
            <button type="button" onClick={()=>{ setMfa(false); setOtp(''); setPendingToken('') }}>Back</button>
          </div>
        </form>
        )}
      </div>
    </div>
  )
}
