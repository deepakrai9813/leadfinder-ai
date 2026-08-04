// Database client with singleton pattern for dev hot-reload
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// In development, always create a fresh client to pick up schema changes
function createPrismaClient() {
  return new PrismaClient({
    log: ['query'],
  })
}

export const db = createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
