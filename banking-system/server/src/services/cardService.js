import prisma from '../lib/prisma.js'

export async function listCards({ userId }) {
  const where = (userId !== undefined && userId !== null)
    ? { userId: Number(userId) }
    : undefined
  return prisma.card.findMany({
    where,
    select: { id: true, userId: true, type: true, label: true, last4: true, expMonth: true, expYear: true, status: true, activated: true, limitDaily: true, limitOnline: true, createdAt: true },
    orderBy: { createdAt: 'desc' }
  })
}

export async function createCard({ userId, type = 'PHYSICAL', label, last4, expMonth, expYear, limitDaily = 0, limitOnline = 0 }) {
  return prisma.card.create({
    data: {
      userId: Number(userId),
      type,
      label,
      last4,
      expMonth: Number(expMonth),
      expYear: Number(expYear),
      limitDaily,
      limitOnline
    },
    select: { id: true, userId: true, type: true, label: true, last4: true, expMonth: true, expYear: true, status: true, activated: true, limitDaily: true, limitOnline: true }
  })
}

export async function freezeCard({ id, userId }) {
  const where = userId ? { id: Number(id), userId: Number(userId) } : { id: Number(id) }
  const c = await prisma.card.findFirst({ where })
  if (!c) throw new Error('Card not found')
  return prisma.card.update({ where: { id: c.id }, data: { status: 'FROZEN' } })
}

export async function unfreezeCard({ id, userId }) {
  const where = userId ? { id: Number(id), userId: Number(userId) } : { id: Number(id) }
  const c = await prisma.card.findFirst({ where })
  if (!c) throw new Error('Card not found')
  return prisma.card.update({ where: { id: c.id }, data: { status: 'ACTIVE' } })
}

export async function activateCard({ id, userId }) {
  const where = userId ? { id: Number(id), userId: Number(userId) } : { id: Number(id) }
  const c = await prisma.card.findFirst({ where })
  if (!c) throw new Error('Card not found')
  return prisma.card.update({ where: { id: c.id }, data: { activated: true, status: 'ACTIVE' } })
}

export async function updateCardLimits({ id, userId, limitDaily, limitOnline }) {
  const where = userId ? { id: Number(id), userId: Number(userId) } : { id: Number(id) }
  const c = await prisma.card.findFirst({ where })
  if (!c) throw new Error('Card not found')
  const data = {}
  if (limitDaily !== undefined) data.limitDaily = Number(limitDaily)
  if (limitOnline !== undefined) data.limitOnline = Number(limitOnline)
  return prisma.card.update({ where: { id: c.id }, data })
}

export default { listCards, createCard, freezeCard, unfreezeCard, activateCard, updateCardLimits }
