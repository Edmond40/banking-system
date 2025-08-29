import prisma from '../lib/prisma.js'

export async function listBeneficiaries({ userId }) {
  return prisma.beneficiary.findMany({
    where: { userId: Number(userId) },
    select: { id: true, userId: true, name: true, bank: true, accountRef: true, createdAt: true },
    orderBy: { createdAt: 'desc' }
  })
}

export async function createBeneficiary({ userId, name, bank, accountRef }) {
  return prisma.beneficiary.create({
    data: { userId: Number(userId), name, bank, accountRef },
    select: { id: true, userId: true, name: true, bank: true, accountRef: true }
  })
}

export async function deleteBeneficiary({ id, userId }) {
  // Optionally ensure owner deletes only theirs
  const where = userId ? { id: Number(id), userId: Number(userId) } : { id: Number(id) }
  // Find first to verify ownership (if provided)
  const b = await prisma.beneficiary.findFirst({ where })
  if (!b) throw new Error('Beneficiary not found')
  await prisma.beneficiary.delete({ where: { id: b.id } })
  return { ok: true }
}

export default { listBeneficiaries, createBeneficiary, deleteBeneficiary }
