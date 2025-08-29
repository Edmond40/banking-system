import prisma from '../lib/prisma.js'
import { Prisma } from '@prisma/client'

const D = Prisma.Decimal

export async function listTransactions({ accountId } = {}) {
  return prisma.transaction.findMany({
    where: accountId ? { accountId: Number(accountId) } : undefined,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      accountId: true,
      toAccountId: true,
      kind: true,
      status: true,
      amount: true,
      fee: true,
      currency: true,
      note: true,
      createdAt: true
    }
  })
}

export async function deposit({ accountId, amount, currency = 'USD', note }) {
  const amt = new D(amount)
  if (amt.lte(0)) throw new Error('Amount must be positive')

  return prisma.$transaction(async (tx) => {
    const account = await tx.account.update({
      where: { id: Number(accountId) },
      data: { balance: { increment: amt } }
    })

    const trx = await tx.transaction.create({
      data: {
        accountId: account.id,
        kind: 'DEPOSIT',
        status: 'APPROVED',
        amount: amt,
        currency,
        note
      }
    })
    return { account, transaction: trx }
  })
}

export async function withdraw({ accountId, amount, currency = 'USD', note }) {
  const amt = new D(amount)
  if (amt.lte(0)) throw new Error('Amount must be positive')

  return prisma.$transaction(async (tx) => {
    const current = await tx.account.findUniqueOrThrow({ where: { id: Number(accountId) }, select: { id: true, balance: true, status: true } })
    if (new D(current.balance).lt(amt)) throw new Error('Insufficient funds')

    const account = await tx.account.update({
      where: { id: current.id },
      data: { balance: { decrement: amt } }
    })

    const trx = await tx.transaction.create({
      data: {
        accountId: account.id,
        kind: 'WITHDRAW',
        status: 'APPROVED',
        amount: amt,
        currency,
        note
      }
    })
    return { account, transaction: trx }
  })
}

export async function transfer({ fromAccountId, toAccountId, amount, currency = 'USD', note }) {
  if (fromAccountId === toAccountId) throw new Error('Use TRANSFER_OWN via same endpoint; ids cannot be equal here')
  const amt = new D(amount)
  if (amt.lte(0)) throw new Error('Amount must be positive')

  return prisma.$transaction(async (tx) => {
    const from = await tx.account.findUniqueOrThrow({ where: { id: Number(fromAccountId) }, select: { id: true, balance: true } })
    const to = await tx.account.findUniqueOrThrow({ where: { id: Number(toAccountId) }, select: { id: true, balance: true } })

    if (new D(from.balance).lt(amt)) throw new Error('Insufficient funds')

    const updatedFrom = await tx.account.update({ where: { id: from.id }, data: { balance: { decrement: amt } } })
    const updatedTo = await tx.account.update({ where: { id: to.id }, data: { balance: { increment: amt } } })

    const trx = await tx.transaction.create({
      data: {
        accountId: updatedFrom.id,
        toAccountId: updatedTo.id,
        kind: 'TRANSFER_INTRA',
        status: 'APPROVED',
        amount: amt,
        currency,
        note
      }
    })

    return { from: updatedFrom, to: updatedTo, transaction: trx }
  })
}

export default { listTransactions, deposit, withdraw, transfer }
