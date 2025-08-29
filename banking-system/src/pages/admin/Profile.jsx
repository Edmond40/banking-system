import { useState } from 'react'
import { useToast } from '../../components/common/ToastProvider.jsx'

export default function AdminProfile() {
  const { notify } = useToast()
  const [profile, setProfile] = useState(() => {
    try { return JSON.parse(localStorage.getItem('admin_profile') || 'null') || { name: '', email: '' } } catch { return { name: '', email: '' } }
  })

  const save = () => {
    try { localStorage.setItem('admin_profile', JSON.stringify(profile)) } catch { /* no-op */ }
    notify({ title: 'Profile saved', description: 'Admin profile updated', variant: 'success' })
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">Admin Profile</h1>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 grid gap-3 max-w-xl">
        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Name</span>
          <input value={profile.name} onChange={(e)=>setProfile({ ...profile, name: e.target.value })} className="rounded-md border-slate-300 focus:ring-brand focus:border-brand" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-slate-700">Email</span>
          <input type="email" value={profile.email} onChange={(e)=>setProfile({ ...profile, email: e.target.value })} className="rounded-md border-slate-300 focus:ring-brand focus:border-brand" />
        </label>
        <button onClick={save} className="bg-brand hover:bg-brand-dark">Save</button>
      </div>
    </div>
  )
}
