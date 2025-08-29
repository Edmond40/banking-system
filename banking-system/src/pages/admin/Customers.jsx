 import { useEffect, useMemo, useState } from 'react'
 import { useToast } from '../../components/common/ToastProvider.jsx'
 import api from '../../lib/api.js'

export default function AdminCustomers() {
  const { notify } = useToast()
  const [query, setQuery] = useState('')
  const [customers, setCustomers] = useState([])
  const [editing, setEditing] = useState(null) // null | { mode: 'create'|'edit', id? }
  const [form, setForm] = useState({ name: '', email: '', password: '', kycStatus: 'PENDING' })

  // Load customers from backend
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const rows = await api.get('/api/admin/customers')
        if (mounted) setCustomers(rows || [])
      } catch (e) {
        notify({ title: 'Failed to load customers', description: e.message || String(e), variant: 'error' })
      }
    })()
    return () => { mounted = false }
  }, [notify])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return customers
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      String(c.status || '').toLowerCase().includes(q) ||
      String(c.kycStatus || '').toLowerCase().includes(q)
    )
  }, [query, customers])

  const startCreate = () => { setEditing({ mode: 'create' }); setForm({ name: '', email: '', password: '', kycStatus: 'PENDING' }) }
  const startEdit = (c) => { setEditing({ mode: 'edit', id: c.id }); setForm({ name: c.name, email: c.email, password: '', kycStatus: c.kycStatus || 'PENDING' }) }

  const save = async (e) => {
    e.preventDefault()
    if (editing?.mode === 'create') {
      if (!form.name || !form.email || !form.password) {
        notify({ title: 'Validation', description: 'Name, email, and password are required', variant: 'error' })
        return
      }
      try {
        await api.post('/api/admin/customers', { name: form.name, email: form.email, password: form.password })
        notify({ title: 'Customer created', description: form.name, variant: 'success' })
        const rows = await api.get('/api/admin/customers')
        setCustomers(rows || [])
        setEditing(null)
      } catch (e2) {
        notify({ title: 'Create failed', description: e2.message || String(e2), variant: 'error' })
      }
    } else if (editing?.mode === 'edit' && editing?.id) {
      if (!form.name || !form.email) {
        notify({ title: 'Validation', description: 'Name and email are required', variant: 'error' })
        return
      }
      try {
        await api.patch(`/api/admin/customers/${editing.id}`, { name: form.name, email: form.email, kycStatus: form.kycStatus })
        notify({ title: 'Customer updated', description: form.name, variant: 'success' })
        const rows = await api.get('/api/admin/customers')
        setCustomers(rows || [])
        setEditing(null)
      } catch (e3) {
        notify({ title: 'Update failed', description: e3.message || String(e3), variant: 'error' })
      }
    }
  }

  const remove = async (id) => {
    try {
      await api.del(`/api/admin/customers/${id}`)
      setCustomers(prev => prev.filter(c => c.id !== id))
      notify({ title: 'Customer removed', description: String(id), variant: 'info' })
    } catch (e) {
      notify({ title: 'Delete failed', description: e.message || String(e), variant: 'error' })
    }
  }

  const toggleFreeze = async (id, status) => {
    try {
      const path = status === 'ACTIVE' ? 'freeze' : 'unfreeze'
      const row = await api.post(`/api/admin/customers/${id}/${path}`)
      setCustomers(prev => prev.map(c => c.id === id ? row : c))
      notify({ title: path === 'freeze' ? 'Customer frozen' : 'Customer unfrozen', description: String(id), variant: path === 'freeze' ? 'error' : 'success' })
    } catch (e) {
      notify({ title: 'Action failed', description: e.message || String(e), variant: 'error' })
    }
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Customers</h1>
          <p className="text-slate-500">Search, view, and manage customers and KYC.</p>
        </div>
        <button onClick={startCreate} className="bg-brand hover:bg-brand-dark shrink-0">Add customer</button>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex items-center gap-3 mb-3">
          <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search by name or email" className="rounded-md border-slate-300 focus:ring-brand focus:border-brand w/full max-w-lg" />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">KYC</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Created</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="text-slate-800">
              {filtered.map(c => (
                <tr key={c.id} className="border-t border-slate-100">
                  <td className="py-2 pr-4">{c.name}</td>
                  <td className="py-2 pr-4">{c.email}</td>
                  <td className="py-2 pr-4 capitalize">{String(c.kycStatus || '').toLowerCase()}</td>
                  <td className="py-2 pr-4"><span className={`text-xs rounded-full px-2 py-0.5 ${c.status==='ACTIVE'?'bg-emerald-50 text-emerald-700':'bg-amber-50 text-amber-700'}`}>{String(c.status || '').toLowerCase()}</span></td>
                  <td className="py-2 pr-4">{c.createdAt ? new Date(c.createdAt).toLocaleString() : '-'}</td>
                  <td className="py-2 space-x-2">
                    <button onClick={()=>startEdit(c)}>Edit</button>
                    <button onClick={()=>toggleFreeze(c.id, c.status)}>{c.status==='ACTIVE'?'Freeze':'Unfreeze'}</button>
                    <button onClick={()=>remove(c.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {filtered.length===0 && (
                <tr><td className="py-4 text-slate-500" colSpan="6">No customers found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/20 grid place-items-center p-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 w-full max-w-lg">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">{editing.mode==='create' ? 'New customer' : 'Edit customer'}</h3>
            <form onSubmit={save} className="grid gap-3">
              <label className="grid gap-1 text-sm">
                <span className="text-slate-700">Full name</span>
                <input value={form.name} onChange={(e)=>setForm({ ...form, name: e.target.value })} className="rounded-md border-slate-300 focus:ring-brand focus:border-brand" />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-slate-700">Email</span>
                <input value={form.email} onChange={(e)=>setForm({ ...form, email: e.target.value })} className="rounded-md border-slate-300 focus:ring-brand focus:border-brand" />
              </label>
              {editing.mode==='create' && (
                <label className="grid gap-1 text-sm">
                  <span className="text-slate-700">Password</span>
                  <input type="password" value={form.password} onChange={(e)=>setForm({ ...form, password: e.target.value })} className="rounded-md border-slate-300 focus:ring-brand focus:border-brand" />
                </label>
              )}
              <label className="grid gap-1 text-sm">
                <span className="text-slate-700">KYC status</span>
                <select value={form.kycStatus} onChange={(e)=>setForm({ ...form, kycStatus: e.target.value })} className="rounded-md border-slate-300 focus:ring-brand focus:border-brand">
                  <option value="PENDING">Pending</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </label>
              <div className="flex gap-2">
                <button type="submit" className="bg-brand hover:bg-brand-dark">Save</button>
                <button type="button" onClick={()=>setEditing(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
