import prisma from '../lib/prisma.js'
import { Prisma } from '@prisma/client'

const D = Prisma.Decimal

export async function listLoans({ userId } = {}) {
  return prisma.loanApplication.findMany({
    where: userId ? { userId: Number(userId) } : undefined,
    include: { attachments: true },
    orderBy: { createdAt: 'desc' }
  })
}

export async function createLoanApplication({ userId, fullName, income, employment, purpose, amount, annualRate, months, currency = 'USD' }) {
  // Simple amortization estimates
  const P = new D(amount)
  const r = new D(annualRate).div(100).div(12) // monthly rate
  const n = new D(months)
  const one = new D(1)
  const factor = one.plus(r).pow(n)
  const monthly = P.mul(r).mul(factor).div(factor.minus(one)) // M = P * r(1+r)^n / ((1+r)^n - 1)
  const total = monthly.mul(n)
  const interest = total.minus(P)

  return prisma.loanApplication.create({
    data: {
      userId: userId ? Number(userId) : null,
      fullName,
      income,
      employment,
      purpose,
      amount,
      annualRate,
      months: Number(months),
      currency,
      estMonthly: monthly,
      estTotal: total,
      estInterest: interest
    },
    include: { attachments: true }
  })
}

export async function addAttachment({ applicationId, name, sizeBytes, mimeType, url }) {
  return prisma.loanAttachment.create({
    data: {
      applicationId: Number(applicationId),
      name,
      sizeBytes: Number(sizeBytes),
      mimeType,
      url
    }
  })
}

export default { listLoans, createLoanApplication, addAttachment }
