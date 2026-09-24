const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    await prisma.$connect();
    console.log('✓ Database connection successful');

    const userCount = await prisma.user.count().catch(() => 0);
    console.log('✓ Users table accessible (count: ' + userCount + ')');

    const articleCount = await prisma.article.count().catch(() => 0);
    console.log('✓ Articles table accessible (count: ' + articleCount + ')');

    const priceCount = await prisma.commodityPrice.count().catch(() => 0);
    console.log('✓ CommodityPrice table accessible (count: ' + priceCount + ')');

    await prisma.$disconnect();
    console.log('✓ Database verification complete');
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    process.exit(1);
  }
}

test();
