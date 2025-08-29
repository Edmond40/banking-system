import prisma from '../lib/prisma.js'
import { deposit, withdraw } from './transactionService.js'

export async function listApprovals({ status, type } = {}) {
  return prisma.approvalRequest.findMany({
    where: {
      status: status || undefined,
      type: type || undefined
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function createApproval({ type, accountId, amount, note }) {
  return prisma.approvalRequest.create({
    data: {
      type,
      accountId: accountId ? Number(accountId) : null,
      amount: amount ?? null,
      note
    }
  })
}

export async function decideApproval({ id, adminId, decision, note }) {
  const status = decision === 'APPROVE' ? 'APPROVED' : 'DECLINED'
  
  // Get the approval request details
  const approval = await prisma.approvalRequest.findUniqueOrThrow({
    where: { id: Number(id) }
  })
  
  // Update approval status
  const updatedApproval = await prisma.approvalRequest.update({
    where: { id: Number(id) },
    data: { status, decidedAt: new Date(), decidedById: adminId ? Number(adminId) : null, note }
  })
  
  // If approved, execute the actual transaction
  if (decision === 'APPROVE' && approval.accountId && approval.amount) {
    try {
      if (approval.type === 'DEPOSIT') {
        await deposit({
          accountId: approval.accountId,
          amount: approval.amount,
          note: approval.note || 'Admin approved deposit'
        })
      } else if (approval.type === 'WITHDRAW') {
        await withdraw({
          accountId: approval.accountId,
          amount: approval.amount,
          note: approval.note || 'Admin approved withdrawal'
        })
      }
    } catch (transactionError) {
      // If transaction fails, revert approval status
      await prisma.approvalRequest.update({
        where: { id: Number(id) },
        data: { status: 'PENDING', decidedAt: null, decidedById: null }
      })
      throw new Error(`Transaction failed: ${transactionError.message}`)
    }
  }
  
  return updatedApproval
}

export async function deleteApproval(id) {
  return prisma.approvalRequest.delete({
    where: { id: Number(id) }
  })
}

export default { listApprovals, createApproval, decideApproval, deleteApproval }
