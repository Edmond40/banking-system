import { Router } from 'express'
import jwt from 'jsonwebtoken'

const router = Router()

// POST /api/admin/auth/login
router.post('/login', (req, res) => {
  const { code } = req.body || {}
  const valid = process.env.ADMIN_AUTH_CODE
  if (!valid) {
    return res.status(500).json({ error: 'ADMIN_AUTH_CODE is not set on server' })
  }
  if (!code || String(code) !== String(valid)) {
    return res.status(401).json({ error: 'Invalid admin code' })
  }
  const token = jwt.sign({ role: 'ADMIN' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' })
  res.json({ token })
})

export default router
