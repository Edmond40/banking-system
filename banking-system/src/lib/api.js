const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

function getUserId() {
  try {
    const ls = localStorage.getItem('user_id')
    const ss = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('user_id') : null)
    const stored = ls || ss
    if (stored != null && stored !== '') {
      const n = Number(stored)
      return Number.isNaN(n) ? undefined : n
    }
  } catch { /* noop */ }
  return undefined
}

function getUserToken() {
  try {
    return (
      localStorage.getItem('user_token') ||
      (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('user_token') : null) ||
      undefined
    )
  } catch { /* noop */ }
  return undefined
}

function getAdminToken() {
  try {
    return (
      localStorage.getItem('admin_token') ||
      (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('admin_token') : null) ||
      undefined
    )
  } catch { /* noop */ }
  return undefined
}

export async function apiFetch(path, { method='GET', headers={}, body } = {}) {
  const userId = getUserId()
  const adminToken = path.startsWith('/api/admin') ? getAdminToken() : undefined
  const userToken = !path.startsWith('/api/admin') ? getUserToken() : undefined
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(userId ? { 'x-user-id': String(userId) } : {}),
      ...(adminToken ? { 'Authorization': `Bearer ${adminToken}` } : {}),
      ...(!adminToken && userToken ? { 'Authorization': `Bearer ${userToken}` } : {}),
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  })
  if (!res.ok) {
    const text = await res.text().catch(()=> '')
    let msg = text
    try { const j = JSON.parse(text); msg = j.error || j.message || text } catch { /* noop */ }
    throw new Error(msg || `HTTP ${res.status}`)
  }
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) return res.json()
  return res.text()
}

export const api = {
  get: (p) => apiFetch(p),
  post: (p, b) => apiFetch(p, { method:'POST', body: b }),
  patch: (p, b) => apiFetch(p, { method:'PATCH', body: b }),
  del: (p) => apiFetch(p, { method:'DELETE' })
}

export default api
