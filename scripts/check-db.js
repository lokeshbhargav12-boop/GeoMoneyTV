const { PrismaClient } = require('@prisma/client')

async function getPublicIp() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    return 'Unknown (Could not fetch IP)';
  }
}

async function checkDatabase() {
  console.log('\n🔍 Checking database connection to Hostinger...')
  
  // 1. Get Public IP
  const currentIp = await getPublicIp();
  console.log(`\n🌐 Your Current Public IP: ${currentIp}`)
  console.log('   (Make sure this IP is whitelisted in Hostinger > Databases > Remote MySQL)\n')

  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 
    process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@') : 'NOT SET')
  
  const prisma = new PrismaClient()
  
  try {
    // Set a timeout for the connection
    await prisma.$connect()
    console.log('✅ Database connection successful!\n')
    await prisma.$disconnect()
    process.exit(0)
  } catch (error) {
    console.error('❌ Database connection failed!')
    console.error('Error Type:', error.name)
    console.error('Message:', error.message)
    
    if (error.message.includes("Can't reach database server")) {
      console.log('\n⚠️  DIAGNOSIS: CONNECTION BLOCKED')
      console.log('The Hostinger server is blocking the connection from your IP address.')
      console.log(`Please go to Hostinger Panel -> Remote MySQL and add IP: ${currentIp}`)
    }
    
    console.error('\n')
    await prisma.$disconnect()
    process.exit(1)
  }
}

checkDatabase()
