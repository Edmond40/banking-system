import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { ToastProvider, useToast } from '../../components/common/ToastProvider.jsx'
// Icons (Lucide) — ensure 'lucide-react' is installed
import { LayoutDashboard, Users, CreditCard, ArrowLeftRight, Settings as SettingsIcon, CheckSquare, BarChart3, FileText, Plug, HandCoins } from 'lucide-react'

export default function AdminLayout() {
  const [pendingCount, setPendingCount] = useState(0)
  const nav = useNavigate()
  const { notify } = useToast()
  // Track desktop vs mobile at top-level (md breakpoint ~768px)
  const [isDesktop, setIsDesktop] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 768 : true))
  const [isAuthed, setIsAuthed] = useState(() => {
    try {
      const t = localStorage.getItem('admin_token') || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('admin_token') : null)
      return Boolean(t)
    } catch { return false }
  })
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_sidebar_collapsed')
      if (saved === 'true' || saved === 'false') return saved === 'true'
    } catch { /* noop */; }
    return (typeof window !== 'undefined' ? window.innerWidth < 1024 : false)
  })

  useEffect(() => {
    const read = () => {
      try {
        const items = JSON.parse(localStorage.getItem('admin_approvals') || '[]')
        const count = Array.isArray(items) ? items.filter(x => x.status === 'pending').length : 0
        setPendingCount(count)
      } catch { setPendingCount(0) }
      try {
        const t = localStorage.getItem('admin_token') || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('admin_token') : null)
        setIsAuthed(Boolean(t))
      } catch { /* noop */ }
    }
    read()
    const id = setInterval(read, 1500)
    const onStorage = (e) => {
      if (e.key === 'admin_approvals') read()
      if (e.key === 'admin_token') read()
    }
    window.addEventListener('storage', onStorage)
    const onResize = () => {
      // Track isDesktop and auto-collapse on narrow screens
      setIsDesktop(window.innerWidth >= 768)
      if (window.innerWidth < 1024) setCollapsed(true)
    }
    window.addEventListener('resize', onResize)
    return () => { clearInterval(id); window.removeEventListener('storage', onStorage); window.removeEventListener('resize', onResize) }
  }, [])

  // Persist toggle preference
  useEffect(() => {
    try { localStorage.setItem('admin_sidebar_collapsed', String(collapsed)) } catch { /* noop */; }
  }, [collapsed])

  // Edge swipe to open drawer on mobile (from left 20px)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  useEffect(() => {
    if (isDesktop) return
    const onStart = (e) => {
      const t = e.touches && e.touches[0]
      if (!t) return
      touchStartX.current = t.clientX
      touchStartY.current = t.clientY
    }
    const onEnd = (e) => {
      const t = (e.changedTouches && e.changedTouches[0]) || null
      if (!t) return
      const dx = t.clientX - touchStartX.current
      const dy = t.clientY - touchStartY.current
      const fromEdge = touchStartX.current <= 20
      const horizontal = Math.abs(dx) > Math.abs(dy)
      if (fromEdge && horizontal && dx > 60 && collapsed) {
        setCollapsed(false)
      }
    }
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchend', onEnd)
    }
  }, [isDesktop, collapsed])

  const doLogout = () => {
    try {
      localStorage.removeItem('admin_token')
      if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem('admin_token')
      localStorage.setItem('admin_auth', 'false')
    } catch { /* no-op */; }
    setIsAuthed(false)
    notify({ title: 'Logged out', description: 'Admin session ended', variant: 'info' })
    nav('/admin/login')
  }

  const sidebarWidth = isDesktop ? (collapsed ? 80 : 248) : 248
  const drawerHidden = !isDesktop && collapsed

  return (
    <ToastProvider>
      <div className="min-h-screen overflow-x-hidden">
        <aside
          className={`fixed top-0 left-0 h-screen flex flex-col gap-4 z-30 bg-gradient-to-br from-slate-100 to-blue-200 text-slate-800 p-4 transition-all duration-300 ease-out overflow-hidden shadow-md overflow-y-auto ${drawerHidden ? '-translate-x-full' : 'translate-x-0'}`}
          style={{ width: sidebarWidth }}
        >
          <div className="flex items-center gap-1">
            <HandCoins size={30} className="text-purple-600 shrink-0"/>
            <h2 className={`berkshire-swash-bold text-xl font-semibold px-1 transition-opacity duration-300 ${collapsed ? 'opacity-0 pointer-events-none select-none' : 'opacity-100'}`}>PayWave</h2>
          </div>
          <nav>
            <ul className="flex flex-col gap-2 text-sm">
              {/* Helper: tooltip when collapsed */}
              {[
                { to: '/admin/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
                { to: '/admin/customers', label: 'Customers', Icon: Users },
                { to: '/admin/accounts', label: 'Accounts', Icon: CreditCard },
                { to: '/admin/transactions', label: 'Transactions', Icon: ArrowLeftRight },
                { to: '/admin/settings', label: 'Settings', Icon: SettingsIcon },
                { section: true, label: 'Management' },
                { to: '/admin/users-roles', label: 'Users & Roles', Icon: Users },
                { to: '/admin/approvals', label: 'Approvals', Icon: CheckSquare, approvals: true },
                { to: '/admin/reports', label: 'Reports', Icon: BarChart3 },
                { to: '/admin/audit-logs', label: 'Audit Logs', Icon: FileText },
                { to: '/admin/integrations', label: 'Integrations', Icon: Plug },
              ].map((item, idx) => (
                item.section ? (
                  !collapsed && <li key={`sec-${idx}`} className="mt-3 px-3 text-xs uppercase tracking-wide text-slate-400">{item.label}</li>
                ) : (
                  <li key={item.to} className="relative group" title={collapsed ? item.label : undefined}>
                    <NavLink
                      className={({isActive})=>
                        `flex items-center ${item.approvals ? 'justify-between' : ''} gap-0 px-0 py-1 rounded hover:bg-purple-200 transition-colors ${isActive?'bg-purple-200':''}`
                      }
                      to={item.to}
                      onClick={() => { if (!isDesktop) setCollapsed(true) }}
                    >
                      {/* fixed icon rail (~24px) */}
                      <div className="w-20 flex items-center justify-center">
                        <item.Icon size={17} className="text-purple-600 shrink-0" />
                      </div>
                      {/* collapsible label area */}
                      <div className="overflow-hidden transition-[max-width,opacity] duration-300" style={{ maxWidth: collapsed ? 0 : 208, opacity: collapsed ? 0 : 1 }}>
                        <div className="flex items-center gap-2 px-2 py-2">
                          <span>{item.label}</span>
                          {item.approvals && pendingCount > 0 && (
                            <span className="inline-flex items-center justify-center text-xs font-medium px-2 py-0.5 rounded-full bg-amber-400 text-slate-900">{pendingCount}</span>
                          )}
                        </div>
                      </div>
                    </NavLink>
                    {collapsed && (
                      <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap text-xs bg-purple-600 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg">
                        {item.label}
                      </span>
                    )}
                  </li>
                )
              ))}
            </ul>
          </nav>
        </aside>
        {/* overlay on mobile when drawer is open */}
        {!isDesktop && !collapsed && (
          <div className="fixed inset-0 z-20 bg-black/30" onClick={() => setCollapsed(true)} />
        )}
        <div
          className="grid grid-rows-[56px_1fr] gap-4 transition-[margin-left] duration-300 ease-out"
          style={{ marginLeft: isDesktop ? sidebarWidth : 0 }}
        >
          <header className="px-4 sticky top-0 z-10 flex items-center justify-between bg-gradient-to-l from-white to-purple-300 border-b border-purple-200 shadow-md">
            <button aria-label="Toggle sidebar" aria-expanded={!collapsed} className="px-3 py-1 rounded hover:bg-purple-100 text-purple-700" onClick={()=>setCollapsed(v=>!v)}>
              {/* Desktop: hamburger icon; Mobile: text label */}
              <span className="hidden md:block">
                <span className="block w-5 h-0.5 bg-purple-700 mb-1" />
                <span className="block w-5 h-0.5 bg-purple-700 mb-1" />
                <span className="block w-5 h-0.5 bg-purple-700" />
              </span>
              <span className="md:hidden text-sm font-medium">
                {collapsed ? 'Menu' : 'Close ×'}
              </span>
            </button>
            <div className="flex items-center gap-3 text-sm">
              {!isAuthed ? (
                <>
                  <button className="px-3 py-1 rounded hover:bg-purple-100" onClick={()=>nav('/admin/login')}>Login</button>
                  <button className="px-3 py-1 rounded hover:bg-purple-100" onClick={()=>nav('/admin/signup')}>Signup</button>
                </>
              ) : (
                <>
                  <Link className="px-3 py-1 rounded bg-purple-900 text-white hover:bg-purple-800" to="/admin/profile">Profile</Link>
                  <button className="px-3 py-1 rounded hover:bg-purple-100" onClick={doLogout}>Logout</button>
                </>
              )}
            </div>
          </header>
          <main className="p-6 mb-16 overflow-x-hidden">
            <Outlet />
          </main>

          <footer
            className="text-center text-sm text-gray-500 p-2 border-t border-gray-200 bg-gradient-to-br from-white to-purple-200 fixed bottom-0"
            style={{ left: isDesktop ? sidebarWidth : 0, right: 0 }}
          >
            <p>Ride the Wave of Digital Banking.</p>
            <p>PayWave © {new Date().getFullYear()}</p>
          </footer>
        </div>
      </div>
    </ToastProvider>
  );
}
