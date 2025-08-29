import { useEffect, useState } from 'react'
import { useToast } from '../../components/common/ToastProvider.jsx'

export default function AdminUsersRoles() {
  const { notify } = useToast()
  const [users, setUsers] = useState([
    { id: 'admin_1', name: 'Super Admin', role: 'owner' },
    { id: 'admin_2', name: 'Ops Manager', role: 'manager' },
  ])
  const [form, setForm] = useState({ name: '', role: 'viewer' })

  // Load from storage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('admin_users_roles') || 'null')
      if (stored && Array.isArray(stored)) setUsers(stored)
      else localStorage.setItem('admin_users_roles', JSON.stringify(users))
    } catch { /* no-op */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const write = (next) => {
    setUsers(next)
    try { localStorage.setItem('admin_users_roles', JSON.stringify(next)) } catch { /* no-op */ }
  }

  const add = (e) => {
    e.preventDefault()
    if (!form.name) {
      notify({ title: 'Validation', description: 'Name is required', variant: 'error' })
      return
    }
    const id = `admin_${Date.now()}`
    write([...users, { id, name: form.name, role: form.role }])
    setForm({ name: '', role: 'viewer' })
    notify({ title: 'Admin user added', description: form.name, variant: 'success' })
  }

  const updateRole = (id, role) => {
    const next = users.map(u => u.id === id ? { ...u, role } : u)
    write(next)
    const u = next.find(x => x.id === id)
    notify({ title: 'Role updated', description: `${u?.name || id} → ${role}` , variant: 'info' })
  }

  const remove = (id) => {
    const u = users.find(x => x.id === id)
    write(users.filter(x => x.id !== id))
    notify({ title: 'Admin removed', description: u ? u.name : id, variant: 'info' })
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Users & Roles</h1>
        <p className="text-slate-600">Manage admin users and permissions.</p>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <form onSubmit={add} className="flex flex-wrap gap-2 items-end">
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Name</span>
            <input value={form.name} onChange={(e)=>setForm({ ...form, name: e.target.value })} className="rounded-md border-slate-300 focus:ring-brand focus:border-brand" />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-slate-700">Role</span>
            <select value={form.role} onChange={(e)=>setForm({ ...form, role: e.target.value })} className="rounded-md border-slate-300 focus:ring-brand focus:border-brand">
              <option value="owner">Owner</option>
              <option value="manager">Manager</option>
              <option value="analyst">Analyst</option>
              <option value="viewer">Viewer</option>
            </select>
          </label>
          <button type="submit" className="bg-brand hover:bg-brand-dark">Add admin</button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="py-2 pr-4 text-left">Name</th>
                <th className="py-2 pr-4 text-left">Role</th>
                <th className="py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="py-2 pr-4">{u.name}</td>
                  <td className="py-2 pr-4">
                    <select value={u.role} onChange={(e)=>updateRole(u.id, e.target.value)} className="rounded-md border-slate-300">
                      <option value="owner">Owner</option>
                      <option value="manager">Manager</option>
                      <option value="analyst">Analyst</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </td>
                  <td className="py-2">
                    <button onClick={()=>remove(u.id)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
