import { PrismaClient } from '@prisma/client'
import { isProduction } from '../config/env'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

import { isDevelopment } from '../config/env'

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isDevelopment ? ['query', 'error', 'warn'] : ['error'],
  })

if (!isProduction) {
  globalForPrisma.prisma = prisma
}
