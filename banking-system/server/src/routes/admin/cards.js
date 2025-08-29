import { Router } from 'express'
import { z } from 'zod'
import { listCards, createCard, freezeCard, unfreezeCard, activateCard, updateCardLimits } from '../../services/cardService.js'

const router = Router()

// Admin cards routes: act across any user. No ownership restriction here.

// GET /api/admin/cards?userId=1
router.get('/', async (req, res, next) => {
  try {
    const userId = req.query.userId ? Number(req.query.userId) : undefined
    if (!userId) {
      // If not filtering, return all cards
      const rows = await listCards({ userId: undefined })
      return res.json(rows)
    }
    const rows = await listCards({ userId })
    res.json(rows)
  } catch (err) { next(err) }
})

const CreateCardSchema = z.object({
  userId: z.number().int().positive(),
  type: z.enum(['PHYSICAL', 'VIRTUAL']).default('PHYSICAL'),
  label: z.string().min(1).optional(),
  last4: z.string().min(4).max(4),
  expMonth: z.number().int().min(1).max(12),
  expYear: z.number().int().min(2000),
  limitDaily: z.number().nonnegative().optional(),
  limitOnline: z.number().nonnegative().optional()
})

// POST /api/admin/cards
router.post('/', async (req, res, next) => {
  try {
    const parsed = CreateCardSchema.parse({
      userId: Number(req.body.userId),
      type: req.body.type,
      label: req.body.label,
      last4: String(req.body.last4),
      expMonth: Number(req.body.expMonth),
      expYear: Number(req.body.expYear),
      limitDaily: req.body.limitDaily !== undefined ? Number(req.body.limitDaily) : undefined,
      limitOnline: req.body.limitOnline !== undefined ? Number(req.body.limitOnline) : undefined,
    })
    const row = await createCard(parsed)
    res.status(201).json(row)
  } catch (err) { next(err) }
})

// POST /api/admin/cards/:id/freeze
router.post('/:id/freeze', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const row = await freezeCard({ id })
    res.json(row)
  } catch (err) { next(err) }
})

// POST /api/admin/cards/:id/unfreeze
router.post('/:id/unfreeze', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const row = await unfreezeCard({ id })
    res.json(row)
  } catch (err) { next(err) }
})

// POST /api/admin/cards/:id/activate
router.post('/:id/activate', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const row = await activateCard({ id })
    res.json(row)
  } catch (err) { next(err) }
})

// POST /api/admin/cards/:id/limits
const LimitsSchema = z.object({
  limitDaily: z.number().nonnegative().optional(),
  limitOnline: z.number().nonnegative().optional()
})

router.post('/:id/limits', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const parsed = LimitsSchema.parse({
      limitDaily: req.body?.limitDaily !== undefined ? Number(req.body.limitDaily) : undefined,
      limitOnline: req.body?.limitOnline !== undefined ? Number(req.body.limitOnline) : undefined
    })
    const row = await updateCardLimits({ id, ...parsed })
    res.json(row)
  } catch (err) { next(err) }
})

export default router
