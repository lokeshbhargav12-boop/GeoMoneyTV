const { PrismaClient } = require('@prisma/client')
const { hash } = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdmin() {
  const email = process.argv[2]
  const password = process.argv[3]
  const name = process.argv[4] || 'Admin'

  if (!email || !password) {
    console.error('Usage: node scripts/create-admin.js <email> <password> [name]')
    process.exit(1)
  }

  try {
    const hashedPassword = await hash(password, 12)

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        password: hashedPassword,
        role: 'admin',
        name,
      },
      create: {
        email,
        password: hashedPassword,
        role: 'admin',
        name,
      },
    })

    console.log('✅ Admin user created/updated successfully!')
    console.log('Email:', user.email)
    console.log('Role:', user.role)
    console.log('\nYou can now sign in at /auth/signin')
  } catch (error) {
    console.error('Error creating admin user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
