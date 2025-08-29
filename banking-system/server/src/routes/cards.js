import { Router } from 'express'
import { z } from 'zod'
import { listCards, createCard, freezeCard, unfreezeCard, activateCard, updateCardLimits } from '../services/cardService.js'

const router = Router()

// GET /api/cards?userId=1
router.get('/', async (req, res, next) => {
  try {
    const userId = req.query.userId ? Number(req.query.userId) : req.auth?.userId
    if (!userId) return res.status(400).json({ error: 'userId is required (or set x-user-id header)' })
    const rows = await listCards({ userId })
    res.json(rows)
  } catch (err) { next(err) }
})

const CreateCardSchema = z.object({
  userId: z.number().int().positive(),
  type: z.enum(['PHYSICAL', 'VIRTUAL']).default('PHYSICAL'),
  label: z.string().min(2),
  last4: z.string().length(4),
  expMonth: z.number().int().min(1).max(12),
  expYear: z.number().int().min(2024),
  limitDaily: z.number().nonnegative().optional().default(0),
  limitOnline: z.number().nonnegative().optional().default(0)
})

// POST /api/cards
router.post('/', async (req, res, next) => {
  try {
    const parsed = CreateCardSchema.parse({
      ...req.body,
      userId: req.body?.userId ? Number(req.body.userId) : req.auth?.userId,
      expMonth: Number(req.body?.expMonth),
      expYear: Number(req.body?.expYear),
      limitDaily: req.body?.limitDaily !== undefined ? Number(req.body.limitDaily) : undefined,
      limitOnline: req.body?.limitOnline !== undefined ? Number(req.body.limitOnline) : undefined
    })
    const row = await createCard(parsed)
    res.status(201).json(row)
  } catch (err) { next(err) }
})

// POST /api/cards/:id/freeze?userId=1
router.post('/:id/freeze', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const userId = req.query.userId ? Number(req.query.userId) : req.auth?.userId
    const row = await freezeCard({ id, userId })
    res.json(row)
  } catch (err) { next(err) }
})

// POST /api/cards/:id/unfreeze?userId=1
router.post('/:id/unfreeze', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const userId = req.query.userId ? Number(req.query.userId) : req.auth?.userId
    const row = await unfreezeCard({ id, userId })
    res.json(row)
  } catch (err) { next(err) }
})

// POST /api/cards/:id/activate
router.post('/:id/activate', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const userId = req.query.userId ? Number(req.query.userId) : req.auth?.userId
    const row = await activateCard({ id, userId })
    res.json(row)
  } catch (err) { next(err) }
})

// POST /api/cards/:id/limits
const LimitsSchema = z.object({
  limitDaily: z.number().nonnegative().optional(),
  limitOnline: z.number().nonnegative().optional()
})

router.post('/:id/limits', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const userId = req.query.userId ? Number(req.query.userId) : req.auth?.userId
    const parsed = LimitsSchema.parse({
      limitDaily: req.body?.limitDaily !== undefined ? Number(req.body.limitDaily) : undefined,
      limitOnline: req.body?.limitOnline !== undefined ? Number(req.body.limitOnline) : undefined
    })
    const row = await updateCardLimits({ id, userId, ...parsed })
    res.json(row)
  } catch (err) { next(err) }
})

export default router
