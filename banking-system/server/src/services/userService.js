import prisma from '../lib/prisma.js'

export async function listUsers() {
  return prisma.user.findMany({
    select: { id: true, email: true, name: true, createdAt: true, status: true, kycStatus: true }
  })
}

export async function createUser({ email, name, passwordHash }) {
  return prisma.user.create({
    data: { email, name, passwordHash }
  })
}

export async function findUserByEmail(email) {
  return prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, passwordHash: true }
  })
}

export async function updateUser(id, data) {
  return prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, name: true, createdAt: true, status: true, kycStatus: true }
  })
}

export async function deleteUser(id) {
  return prisma.user.delete({ where: { id } })
}

export default { listUsers, createUser, findUserByEmail, updateUser, deleteUser }
