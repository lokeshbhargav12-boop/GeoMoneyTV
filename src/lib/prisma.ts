import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    datasources: {
      db: {
        // Append connection pool limits if not already in URL
        url: (() => {
          const url = process.env.DATABASE_URL || ''
          if (url.includes('connection_limit')) return url
          const sep = url.includes('?') ? '&' : '?'
          return `${url}${sep}connection_limit=10&pool_timeout=20&connect_timeout=10`
        })(),
      },
    },
  })
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

// Always persist the singleton to avoid opening new connections on every module evaluation
globalForPrisma.prisma = prisma

export default prisma
