import { Link, Outlet, useNavigate, NavLink, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ToastProvider, useToast } from '../../components/common/ToastProvider.jsx'
import { HandCoins } from 'lucide-react'

export default function UserLayout() {
  const nav = useNavigate()
  const { notify } = useToast()
  const { pathname } = useLocation()
  const [isAuthed, setIsAuthed] = useState(() => {
    try { return localStorage.getItem('user_auth') === 'true' } catch { return false }
  })
  // Responsive: treat md>=768 as desktop
  const [isDesktop, setIsDesktop] = useState(() => (typeof window !== 'undefined' ? window.innerWidth >= 768 : true))
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    const read = () => setIsAuthed(localStorage.getItem('user_auth') === 'true')
    read()
    const onStorage = (e) => { if (e.key === 'user_auth') read() }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Track viewport and auto-close drawer when switching to desktop
  useEffect(() => {
    const onResize = () => {
      const desk = window.innerWidth >= 768
      setIsDesktop(desk)
      if (desk) setDrawerOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const doLogout = () => {
    try { localStorage.setItem('user_auth', 'false') } catch { /* no-op */ }
    setIsAuthed(false)
    notify({ title: 'Logged out', description: 'You have been signed out', variant: 'info' })
    nav('/user/login')
  }

  // Lock body scroll when drawer open
  useEffect(() => {
    if (drawerOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [drawerOpen])

  return (
    <ToastProvider>
      <div className="min-h-screen overflow-x-hidden grid grid-rows-[56px_1fr] bg-gradient from-blue-500 to-emerald-500">
        {/* Mobile off-canvas sidebar */}
        {!isDesktop && (
          <>
            <aside className={`fixed top-0 left-0 z-30 h-screen w-64 bg-white shadow-md transition-transform duration-300 ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HandCoins size={24} className="text-purple-600"/>
                  <span className="font-semibold">PayWave</span>
                </div>
                <button aria-label="Close menu" onClick={()=>setDrawerOpen(false)} className="px-2 py-1 rounded hover:bg-slate-100">Close ×</button>
              </div>
              <nav className="p-2">
                <ul className="flex flex-col gap-1 text-sm">
                  <li>
                    <NavLink to="/user/dashboard" className={({isActive})=>`block px-3 py-2 rounded ${isActive?'bg-purple-200 text-purple-900':'hover:bg-slate-100'}`} onClick={()=>setDrawerOpen(false)}>Dashboard</NavLink>
                  </li>
                  <li>
                    <NavLink to="/user/accounts" className={({isActive})=>`block px-3 py-2 rounded ${isActive?'bg-purple-200 text-purple-900':'hover:bg-slate-100'}`} onClick={()=>setDrawerOpen(false)}>Accounts</NavLink>
                  </li>
                  <li>
                    <NavLink to="/user/transfers" className={({isActive})=>`block px-3 py-2 rounded ${isActive?'bg-purple-200 text-purple-900':'hover:bg-slate-100'}`} onClick={()=>setDrawerOpen(false)}>Transfers</NavLink>
                  </li>
                  <li>
                    <NavLink to="/user/cards" className={({isActive})=>`block px-3 py-2 rounded ${isActive?'bg-purple-200 text-purple-900':'hover:bg-slate-100'}`} onClick={()=>setDrawerOpen(false)}>Cards</NavLink>
                  </li>
                  <li>
                    <NavLink to="/user/loans" className={({isActive})=>`block px-3 py-2 rounded ${isActive?'bg-purple-200 text-purple-900':'hover:bg-slate-100'}`} onClick={()=>setDrawerOpen(false)}>Loans</NavLink>
                  </li>
                </ul>
                <hr className="my-3"/>
                <div className="flex flex-col gap-2">
                  {!isAuthed ? (
                    <>
                      <button className="px-3 py-2 rounded border border-slate-200 hover:bg-slate-50 text-left" onClick={()=>{setDrawerOpen(false); nav('/user/login')}}>Login</button>
                      <button className="px-3 py-2 rounded border border-slate-200 hover:bg-slate-50 text-left" onClick={()=>{setDrawerOpen(false); nav('/user/signup')}}>Signup</button>
                    </>
                  ) : (
                    <>
                      <Link className="px-3 py-2 rounded border border-slate-200 hover:bg-slate-50" to="/user/profile" onClick={()=>setDrawerOpen(false)}>Profile</Link>
                      <button className="px-3 py-2 rounded border border-slate-200 hover:bg-slate-50 text-left" onClick={()=>{setDrawerOpen(false); doLogout()}}>Logout</button>
                    </>
                  )}
                </div>
              </nav>
            </aside>
            {/* overlay */}
            {drawerOpen && <div className="fixed inset-0 z-20 bg-black/30" onClick={()=>setDrawerOpen(false)} />}
          </>
        )}
        <header className="text-black sticky top-0 z-50 px-3 sm:px-4 py-2 flex items-center justify-between shadow-md bg-white/70 backdrop-blur bg-gradient-to-r from-white to-purple-300 border-b border-purple-200">
          <div className="flex items-center ">         
            <HandCoins size={28} className="text-purple-600 shrink-0"/>
            <h2 className={`berkshire-swash-bold text-lg sm:text-xl font-semibold px-1 transition-opacity duration-300 hidden md:block`}>PayWave</h2>
            {/* Mobile hamburger */}
            <button className="md:hidden mr-2 px-2 py-1 rounded hover:bg-purple-100" aria-label="Open menu" onClick={()=>setDrawerOpen(true)}>
              <span className="block w-5 h-0.5 bg-purple-700 mb-1" />
              <span className="block w-5 h-0.5 bg-purple-700 mb-1" />
              <span className="block w-5 h-0.5 bg-purple-700" />
            </button>
          </div>
          <div className="flex items-center gap-3 sm:gap-6 min-w-0">
            {/* Desktop nav */}
            <nav className="hidden md:flex gap-4 text-sm whitespace-nowrap -mx-2 px-2">
              
                <NavLink to="/user/dashboard" className={({isActive})=>`block ${isActive?'text-purple-800':'text-slate-800 hover:text-purple-800'}`}>
                  <p className="px-0.5">Dashboard</p>
                  <hr className={`bg-gray-100 w-4/5 mx-auto h-[2px] rounded-full border-none duration-300 ${pathname.startsWith('/user/dashboard')?'scale-100':'scale-0'}`}/>
                </NavLink>
              
                <NavLink to="/user/accounts" className={({isActive})=>`block ${isActive?'text-purple-800':'text-slate-800 hover:text-purple-800'}`}>
                  <p className="px-0.5">Accounts</p>
                  <hr className={`bg-gray-100 w-4/5 mx-auto h-[2px] rounded-full border-none duration-300 ${pathname.startsWith('/user/accounts')?'scale-100':'scale-0'}`}/>
                </NavLink>
              
                <NavLink to="/user/transfers" className={({isActive})=>`block ${isActive?'text-purple-800':'text-slate-800 hover:text-purple-800'}`}>
                  <p className="px-0.5">Transfers</p>
                  <hr className={`bg-gray-100 w-4/5 mx-auto h-[2px] rounded-full border-none duration-300 ${pathname.startsWith('/user/transfers')?'scale-100':'scale-0'}`}/>
                </NavLink>
              
                <NavLink to="/user/cards" className={({isActive})=>`block ${isActive?'text-purple-800':'text-slate-800 hover:text-purple-800'}`}>
                  <p className="px-0.5">Cards</p>
                  <hr className={`bg-gray-100 w-4/5 mx-auto h-[2px] rounded-full border-none duration-300 ${pathname.startsWith('/user/cards')?'scale-100':'scale-0'}`}/>
                </NavLink>
              
                <NavLink to="/user/loans" className={({isActive})=>`block ${isActive?'text-purple-800':'text-slate-800 hover:text-purple-800'}`}>
                  <p className="px-0.5">Loans</p>
                  <hr className={`bg-gray-100 w-4/5 mx-auto h-[2px] rounded-full border-none duration-300 ${pathname.startsWith('/user/loans')?'scale-100':'scale-0'}`}/>
                </NavLink>
            </nav>
            <div className="hidden md:flex items-center gap-2 sm:gap-3 text-sm">
              {!isAuthed ? (
                <>
                  <button className="px-2 sm:px-3 py-1 rounded hover:bg-purple-100" onClick={()=>nav('/user/login')}>Login</button>
                  <button className="px-2 sm:px-3 py-1 rounded hover:bg-purple-100" onClick={()=>nav('/user/signup')}>Signup</button>
                </>
              ) : (
                <>
                  <Link className="px-2 sm:px-3 py-1 rounded bg-slate-900 text-white hover:bg-slate-800" to="/user/profile">Profile</Link>
                  <button className="px-2 sm:px-3 py-1 rounded hover:bg-slate-100" onClick={doLogout}>Logout</button>
                </>
              )}
            </div>
          </div>
        </header>
        <main className="p-3 sm:p-4 bg-gradient-to-br from-slate-100 to-blue-200">
          <Outlet />
        </main>
      </div>
    </ToastProvider>
  );
}
