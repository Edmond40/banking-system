import { Router } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { listUsers, createUser, findUserByEmail } from '../services/userService.js'

const router = Router()

router.get('/', async (_req, res, next) => {
  try {
    const rows = await listUsers()
    res.json(rows)
  } catch (err) { next(err) }
})

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6)
})

router.post('/', async (req, res, next) => {
  try {
    const data = CreateUserSchema.parse(req.body)
    const passwordHash = await bcrypt.hash(data.password, 10)
    const user = await createUser({ email: data.email, name: data.name, passwordHash })
    res.status(201).json({ id: user.id, email: user.email, name: user.name })
  } catch (err) { next(err) }
})

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})

// Real login: verify credentials and return user basic info
router.post('/login', async (req, res, next) => {
  try {
    const data = LoginSchema.parse(req.body)
    const user = await findUserByEmail(data.email)
    if (!user) {
      const err = new Error('Invalid email or password')
      err.status = 401
      return next(err)
    }
    const ok = await bcrypt.compare(data.password, user.passwordHash)
    if (!ok) {
      const err = new Error('Invalid email or password')
      err.status = 401
      return next(err)
    }
    const token = jwt.sign({ sub: user.id, role: 'USER' }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    })
    return res.json({ id: user.id, email: user.email, name: user.name, token })
  } catch (err) { next(err) }
})

export default router
