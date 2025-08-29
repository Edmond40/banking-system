// Very basic header-based auth stub for local development/testing
// Sends 401 if x-user-id is provided but invalid (non-numeric)
// Attaches req.auth = { userId?: number }
import jwt from 'jsonwebtoken'

export function authHeader() {
  return (req, _res, next) => {
    // Default empty auth
    req.auth = {}

    // Prefer Bearer user token if present
    try {
      const header = req.headers['authorization'] || ''
      const [scheme, token] = header.split(' ')
      if (scheme === 'Bearer' && token) {
        const payload = jwt.verify(token, process.env.JWT_SECRET)
        if (payload?.role === 'USER' && typeof payload?.sub === 'number') {
          req.auth.userId = payload.sub
          return next()
        }
      }
    } catch { /* ignore and fallback */ }

    // Fallback: x-user-id header for local dev/testing
    const raw = req.headers['x-user-id']
    if (raw !== undefined) {
      const n = Number(raw)
      if (Number.isNaN(n) || n <= 0) {
        const err = new Error('Invalid x-user-id header')
        err.status = 401
        return next(err)
      }
      req.auth.userId = n
    }
    next()
  }
}

// Require a valid admin JWT in Authorization: Bearer <token>
export function requireAdmin() {
  return (req, _res, next) => {
    try {
      const header = req.headers['authorization'] || ''
      const [scheme, token] = header.split(' ')
      if (scheme !== 'Bearer' || !token) {
        const err = new Error('Missing admin bearer token')
        err.status = 401
        return next(err)
      }
      const payload = jwt.verify(token, process.env.JWT_SECRET)
      if (payload?.role !== 'ADMIN') {
        const err = new Error('Not an admin token')
        err.status = 403
        return next(err)
      }
      req.admin = { id: payload.id ?? null, role: 'ADMIN' }
      next()
    } catch (e) {
      const err = new Error('Invalid or expired admin token')
      err.status = 401
      return next(err)
    }
  }
}

export default { authHeader, requireAdmin }
