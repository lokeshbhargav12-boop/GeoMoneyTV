/************************************************************
 * GeoMoney TV - Create Default Admin User
 * This script creates a default admin account
 ************************************************************/

const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function createDefaultAdmin() {
  try {
    const hashedPassword = await hash('admin123', 12);
    
    const user = await prisma.user.upsert({
      where: { email: 'admin@geomoneytv.com' },
      update: {
        password: hashedPassword,
        role: 'admin',
        name: 'Administrator',
      },
      create: {
        email: 'admin@geomoneytv.com',
        password: hashedPassword,
        role: 'admin',
        name: 'Administrator',
      },
    });
    
    console.log('✓ Admin user created/updated successfully');
    console.log('  Email: admin@geomoneytv.com');
    console.log('  Password: admin123');
    console.log('  Role: ' + user.role);
    console.log('');
    console.log('⚠ IMPORTANT: Change the default password after first login!');
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('✗ Failed to create admin:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

createDefaultAdmin();
