const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function clearArticles() {
  try {
    console.log('Deleting all articles...')
    const { count } = await prisma.article.deleteMany({})
    console.log(`Successfully deleted ${count} articles.`)
    console.log('You can now re-sync to fetch fresh data from NewsAPI.')
  } catch (error) {
    console.error('Error deleting articles:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearArticles()
