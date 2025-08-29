import { Router } from 'express'
import { z } from 'zod'
import { listTransactions, deposit, withdraw, transfer } from '../services/transactionService.js'

const router = Router()

// GET /api/transactions?accountId=1
router.get('/', async (req, res, next) => {
  try {
    const { accountId } = req.query
    const rows = await listTransactions({ accountId })
    res.json(rows)
  } catch (err) { next(err) }
})

const DepositSchema = z.object({
  accountId: z.number().int().positive(),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  note: z.string().optional()
})

router.post('/deposit', async (req, res, next) => {
  try {
    const parsed = DepositSchema.parse({
      ...req.body,
      accountId: Number(req.body?.accountId),
      amount: Number(req.body?.amount)
    })
    const result = await deposit(parsed)
    res.status(201).json(result)
  } catch (err) { next(err) }
})

const WithdrawSchema = DepositSchema

router.post('/withdraw', async (req, res, next) => {
  try {
    const parsed = WithdrawSchema.parse({
      ...req.body,
      accountId: Number(req.body?.accountId),
      amount: Number(req.body?.amount)
    })
    const result = await withdraw(parsed)
    res.status(201).json(result)
  } catch (err) { next(err) }
})

const TransferSchema = z.object({
  fromAccountId: z.number().int().positive(),
  toAccountId: z.number().int().positive(),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  note: z.string().optional()
})

router.post('/transfer', async (req, res, next) => {
  try {
    const parsed = TransferSchema.parse({
      ...req.body,
      fromAccountId: Number(req.body?.fromAccountId),
      toAccountId: Number(req.body?.toAccountId),
      amount: Number(req.body?.amount)
    })
    const result = await transfer(parsed)
    res.status(201).json(result)
  } catch (err) { next(err) }
})

export default router
