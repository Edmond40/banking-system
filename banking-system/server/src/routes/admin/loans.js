import { Router } from 'express'
import { z } from 'zod'
import { listLoans, createLoanApplication, addAttachment } from '../../services/loanService.js'

const router = Router()

// Admin loans routes: act across any user

// GET /api/admin/loans?userId=1
router.get('/', async (req, res, next) => {
  try {
    const { userId } = req.query
    const rows = await listLoans({ userId: userId !== undefined ? Number(userId) : undefined })
    res.json(rows)
  } catch (err) { next(err) }
})

const CreateLoanSchema = z.object({
  userId: z.number().int().positive().optional(),
  fullName: z.string().min(3),
  income: z.number().nonnegative(),
  employment: z.enum(['EMPLOYED','SELF_EMPLOYED','STUDENT','UNEMPLOYED']),
  purpose: z.string().min(3),
  amount: z.number().positive(),
  annualRate: z.number().positive(),
  months: z.number().int().min(1),
  currency: z.string().default('USD')
})

// POST /api/admin/loans
router.post('/', async (req, res, next) => {
  try {
    const parsed = CreateLoanSchema.parse({
      ...req.body,
      userId: req.body?.userId !== undefined ? Number(req.body.userId) : undefined,
      income: Number(req.body?.income),
      amount: Number(req.body?.amount),
      annualRate: Number(req.body?.annualRate),
      months: Number(req.body?.months)
    })
    const row = await createLoanApplication(parsed)
    res.status(201).json(row)
  } catch (err) { next(err) }
})

const AttachmentSchema = z.object({
  applicationId: z.number().int().positive(),
  name: z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
  mimeType: z.string().min(2),
  url: z.string().url()
})

// POST /api/admin/loans/attachments
router.post('/attachments', async (req, res, next) => {
  try {
    const parsed = AttachmentSchema.parse({
      ...req.body,
      applicationId: Number(req.body?.applicationId),
      sizeBytes: Number(req.body?.sizeBytes)
    })
    const row = await addAttachment(parsed)
    res.status(201).json(row)
  } catch (err) { next(err) }
})

export default router
