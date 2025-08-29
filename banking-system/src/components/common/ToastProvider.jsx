import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

const ToastContext = createContext({ notify: () => {} })

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(1)

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const notify = useCallback(({ title, description, variant = 'info', duration = 3500 }) => {
    const id = idRef.current++
    const toast = { id, title, description, variant }
    setToasts((t) => [toast, ...t])
    if (duration > 0) {
      setTimeout(() => remove(id), duration)
    }
  }, [remove])

  const value = useMemo(() => ({ notify }), [notify])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onClose={remove} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}

function ToastViewport({ toasts, onClose }) {
  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 w-[320px] max-w-[90vw]">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded-lg shadow-lg border px-4 py-3 bg-white ${
            t.variant === 'success'
              ? 'border-emerald-200'
              : t.variant === 'error'
              ? 'border-rose-200'
              : 'border-slate-200'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`mt-1 h-2 w-2 rounded-full ${
              t.variant === 'success' ? 'bg-emerald-600' : t.variant === 'error' ? 'bg-rose-600' : 'bg-slate-500'
            }`} />
            <div className="flex-1">
              {t.title && <div className="font-medium text-slate-900">{t.title}</div>}
              {t.description && <div className="text-sm text-slate-600">{t.description}</div>}
            </div>
            <button className="text-slate-400 hover:text-slate-600" onClick={() => onClose(t.id)}>✕</button>
          </div>
        </div>
      ))}
    </div>
  )
}
