import { Router } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { listUsers, createUser, updateUser, deleteUser } from '../../services/userService.js'
import prisma from '../../lib/prisma.js'

const router = Router()

// GET /api/admin/customers
router.get('/', async (_req, res, next) => {
  try {
    const rows = await listUsers()
    res.json(rows)
  } catch (err) { next(err) }
})

const CreateCustomerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8)
})

// POST /api/admin/customers
router.post('/', async (req, res, next) => {
  try {
    const data = CreateCustomerSchema.parse(req.body)
    const passwordHash = await bcrypt.hash(data.password, 10)
    const user = await createUser({ email: data.email, name: data.name, passwordHash })
    res.status(201).json({ id: user.id, email: user.email, name: user.name, createdAt: user.createdAt })
  } catch (err) { next(err) }
})

const UpdateCustomerSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  status: z.enum(['ACTIVE','FROZEN']).optional(),
  kycStatus: z.enum(['PENDING','VERIFIED','REJECTED']).optional()
})

// PATCH /api/admin/customers/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const data = UpdateCustomerSchema.parse(req.body)
    const row = await updateUser(id, data)
    res.json(row)
  } catch (err) { next(err) }
})

// POST /api/admin/customers/:id/freeze
router.post('/:id/freeze', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    
    // Update user status and all their accounts in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: { status: 'FROZEN' }
      })
      
      await tx.account.updateMany({
        where: { userId: id },
        data: { status: 'FROZEN' }
      })
    })
    
    const row = await updateUser(id, { status: 'FROZEN' })
    res.json(row)
  } catch (err) { next(err) }
})

// POST /api/admin/customers/:id/unfreeze
router.post('/:id/unfreeze', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    
    // Update user status and all their accounts in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: { status: 'ACTIVE' }
      })
      
      await tx.account.updateMany({
        where: { userId: id },
        data: { status: 'ACTIVE' }
      })
    })
    
    const row = await updateUser(id, { status: 'ACTIVE' })
    res.json(row)
  } catch (err) { next(err) }
})

const KycSchema = z.object({ status: z.enum(['PENDING','VERIFIED','REJECTED']) })
// POST /api/admin/customers/:id/kyc
router.post('/:id/kyc', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const { status } = KycSchema.parse(req.body)
    const row = await updateUser(id, { kycStatus: status })
    res.json(row)
  } catch (err) { next(err) }
})

// DELETE /api/admin/customers/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    await deleteUser(id)
    res.status(204).end()
  } catch (err) { next(err) }
})

export default router
