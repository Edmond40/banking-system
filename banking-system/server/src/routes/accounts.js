import { Router } from 'express'
import { z } from 'zod'
import { listAccounts, createAccount, deleteAccount } from '../services/accountService.js'

const router = Router()

// GET /api/accounts?userId=1
router.get('/', async (req, res, next) => {
  try {
    const { userId } = req.query
    const rows = await listAccounts({ userId })
    res.json(rows)
  } catch (err) { next(err) }
})

const CreateAccountSchema = z.object({
  userId: z.number().int().positive(),
  name: z.string().min(2),
  type: z.enum(['CURRENT', 'SAVINGS']).optional().default('CURRENT'),
  initialBalance: z.number().nonnegative().optional().default(0)
})

// POST /api/accounts
router.post('/', async (req, res, next) => {
  try {
    const parsed = CreateAccountSchema.parse({
      ...req.body,
      userId: Number(req.body?.userId),
      initialBalance: req.body?.initialBalance !== undefined ? Number(req.body.initialBalance) : undefined
    })
    const acc = await createAccount(parsed)
    res.status(201).json(acc)
  } catch (err) { next(err) }
})

// DELETE /api/accounts/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const accountId = Number(req.params.id)
    await deleteAccount(accountId)
    res.status(204).send()
  } catch (err) { next(err) }
})

export default router
