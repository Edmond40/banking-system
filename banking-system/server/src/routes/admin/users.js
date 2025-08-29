import { Router } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import prisma from '../../lib/prisma.js'

const router = Router()

const CreateAdminSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['OWNER','MANAGER','ANALYST','VIEWER']).optional()
})

// Create admin user guarded by admin setup code
router.post('/', async (req, res, next) => {
  try {
    const adminCodeHeader = req.header('x-admin-code') || ''
    const expected = process.env.ADMIN_AUTH_CODE || ''
    if (!expected || adminCodeHeader !== expected) {
      return res.status(401).json({ error: 'Invalid admin code' })
    }

    const data = CreateAdminSchema.parse(req.body)
    const passwordHash = await bcrypt.hash(data.password, 10)

    const admin = await prisma.adminUser.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role ?? 'OWNER',
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    })

    res.status(201).json(admin)
  } catch (err) { next(err) }
})

export default router
