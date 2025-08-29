import { Router } from 'express'
import { z } from 'zod'
import { listBeneficiaries, createBeneficiary, deleteBeneficiary } from '../services/beneficiaryService.js'

const router = Router()

// GET /api/beneficiaries?userId=1
router.get('/', async (req, res, next) => {
  try {
    const userId = req.query.userId ? Number(req.query.userId) : req.auth?.userId
    if (!userId) return res.status(400).json({ error: 'userId is required (or set x-user-id header)' })
    const rows = await listBeneficiaries({ userId })
    res.json(rows)
  } catch (err) { next(err) }
})

const CreateBeneficiarySchema = z.object({
  userId: z.number().int().positive(),
  name: z.string().min(2),
  bank: z.string().min(2),
  accountRef: z.string().min(4)
})

// POST /api/beneficiaries
router.post('/', async (req, res, next) => {
  try {
    const parsed = CreateBeneficiarySchema.parse({
      ...req.body,
      userId: req.body?.userId ? Number(req.body.userId) : req.auth?.userId
    })
    const row = await createBeneficiary(parsed)
    res.status(201).json(row)
  } catch (err) { next(err) }
})

// DELETE /api/beneficiaries/:id?userId=1
router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const userId = req.query.userId ? Number(req.query.userId) : req.auth?.userId
    const result = await deleteBeneficiary({ id, userId })
    res.json(result)
  } catch (err) { next(err) }
})

export default router
