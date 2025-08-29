import prisma from '../lib/prisma.js'

export async function generateUniqueAccountNumber() {
  // Simple 12-digit number generator; retry if collision
  for (let i = 0; i < 5; i++) {
    const num = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('')
    const existing = await prisma.account.findUnique({ where: { number: num } })
    if (!existing) return num
  }
  throw new Error('Failed to generate unique account number')
}

export async function listAccounts({ userId } = {}) {
  return prisma.account.findMany({
    where: userId ? { userId: Number(userId) } : undefined,
    select: {
      id: true,
      userId: true,
      name: true,
      type: true,
      number: true,
      balance: true,
      status: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function createAccount({ userId, name, type, initialBalance = 0 }) {
  const number = await generateUniqueAccountNumber()
  return prisma.account.create({
    data: {
      userId: Number(userId),
      name,
      type,
      number,
      balance: initialBalance
    },
    select: { id: true, userId: true, name: true, type: true, number: true, balance: true }
  })
}

export async function deleteAccount(accountId) {
  // Check if account has zero balance before deletion
  const account = await prisma.account.findUniqueOrThrow({
    where: { id: Number(accountId) },
    select: { balance: true, userId: true }
  })
  
  if (account.balance !== 0) {
    throw new Error('Cannot delete account with non-zero balance')
  }
  
  // Delete the account
  return prisma.account.delete({
    where: { id: Number(accountId) }
  })
}

export default { listAccounts, createAccount, deleteAccount }
