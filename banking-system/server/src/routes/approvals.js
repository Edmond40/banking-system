import { Router } from 'express'
import { z } from 'zod'
import { listApprovals, createApproval, decideApproval } from '../services/approvalService.js'

const router = Router()

// GET /api/approvals?status=PENDING&type=WITHDRAW
router.get('/', async (req, res, next) => {
  try {
    const { status, type } = req.query
    const rows = await listApprovals({ status, type })
    res.json(rows)
  } catch (err) { next(err) }
})

const CreateApprovalSchema = z.object({
  type: z.enum(['WITHDRAW', 'DEPOSIT', 'OTHER']),
  accountId: z.number().int().positive().optional(),
  amount: z.number().nonnegative().optional(),
  note: z.string().optional()
})

router.post('/', async (req, res, next) => {
  try {
    const parsed = CreateApprovalSchema.parse({
      ...req.body,
      accountId: req.body?.accountId !== undefined ? Number(req.body.accountId) : undefined,
      amount: req.body?.amount !== undefined ? Number(req.body.amount) : undefined
    })
    const row = await createApproval(parsed)
    res.status(201).json(row)
  } catch (err) { next(err) }
})

const DecisionSchema = z.object({ decision: z.enum(['APPROVE', 'DECLINE']), note: z.string().optional(), adminId: z.number().int().positive().optional() })

router.post('/:id/decide', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const { adminId, decision, note } = DecisionSchema.parse({ ...req.body, adminId: req.body?.adminId !== undefined ? Number(req.body.adminId) : undefined })
    const row = await decideApproval({ id, adminId, decision, note })
    res.json(row)
  } catch (err) { next(err) }
})

export default router
