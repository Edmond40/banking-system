import { Router } from 'express'
import health from './health.js'
import users from './users.js'
import accounts from './accounts.js'
import transactions from './transactions.js'
import beneficiaries from './beneficiaries.js'
import cards from './cards.js'
import approvals from './approvals.js'
import loans from './loans.js'
import adminCards from './admin/cards.js'
import adminLoans from './admin/loans.js'
import adminApprovals from './admin/approvals.js'
import adminUsers from './admin/users.js'
import adminAuth from './admin/auth.js'
import adminCustomers from './admin/customers.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()

router.use('/health', health)
router.use('/users', users)
router.use('/accounts', accounts)
router.use('/transactions', transactions)
router.use('/beneficiaries', beneficiaries)
router.use('/cards', cards)
router.use('/approvals', approvals)
router.use('/loans', loans)
// Admin auth login route (unprotected)
router.use('/admin/auth', adminAuth)
// Protected admin routes
router.use('/admin/cards', requireAdmin(), adminCards)
router.use('/admin/loans', requireAdmin(), adminLoans)
router.use('/admin/approvals', requireAdmin(), adminApprovals)
router.use('/admin/customers', requireAdmin(), adminCustomers)
// Admin management - allow creation guarded by setup code header
router.use('/admin/users', adminUsers)

export default router
