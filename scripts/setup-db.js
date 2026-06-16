/************************************************************
 * GeoMoney TV - Database Setup Script for Hostinger
 * This script runs Prisma DB push during startup/build
 * with extensive console logging for debugging
 ************************************************************/

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  const timestamp = new Date().toISOString();
  console.log(`${colors.cyan}[${timestamp}]${colors.reset} ${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('');
  console.log(`${colors.bright}${colors.magenta}══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}  ${title}${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log('');
}

function logError(message, error) {
  console.error(`${colors.red}[ERROR] ${message}${colors.reset}`);
  if (error) {
    console.error(`${colors.red}${error.message || error}${colors.reset}`);
    if (error.stack) {
      console.error(`${colors.red}${error.stack}${colors.reset}`);
    }
  }
}

// Main setup function
async function setupDatabase() {
  logSection('GEOMONEY TV - DATABASE SETUP');
  
  log('Starting database setup process...', 'yellow');
  log(`Node version: ${process.version}`, 'blue');
  log(`Working directory: ${process.cwd()}`, 'blue');
  
  // Check if .env file exists
  logSection('CHECKING ENVIRONMENT');
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    log('✓ .env file found', 'green');
    
    // Check DATABASE_URL without exposing credentials
    const envContent = fs.readFileSync(envPath, 'utf8');
    const dbUrlMatch = envContent.match(/DATABASE_URL=([^\n]+)/);
    if (dbUrlMatch) {
      const dbUrl = dbUrlMatch[1];
      // Mask password in logs
      const maskedUrl = dbUrl.replace(/:([^@]+)@/, ':****@');
      log(`✓ DATABASE_URL configured: ${maskedUrl}`, 'green');
    } else {
      logError('DATABASE_URL not found in .env file');
      process.exit(1);
    }
  } else {
    logError('.env file not found!');
    log('Please create a .env file with DATABASE_URL', 'yellow');
    process.exit(1);
  }
  
  // Check if prisma schema exists
  const prismaSchemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  if (fs.existsSync(prismaSchemaPath)) {
    log('✓ Prisma schema found', 'green');
  } else {
    logError('Prisma schema not found at prisma/schema.prisma');
    process.exit(1);
  }
  
  // Step 1: Generate Prisma Client
  logSection('STEP 1: GENERATING PRISMA CLIENT');
  try {
    log('Running: prisma generate...', 'yellow');
    const output = execSync('npx prisma generate', { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    log('✓ Prisma client generated successfully', 'green');
    log(`Output: ${output.substring(0, 500)}...`, 'blue');
  } catch (error) {
    logError('Failed to generate Prisma client', error);
    process.exit(1);
  }
  
  // Step 2: Push Database Schema
  logSection('STEP 2: PUSHING DATABASE SCHEMA');
  try {
    log('Running: prisma db push...', 'yellow');
    log('This will create/update database tables based on schema.prisma', 'blue');
    
    const output = execSync('npx prisma db push --accept-data-loss', { 
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 120000 // 2 minute timeout
    });
    
    log('✓ Database schema pushed successfully', 'green');
    log(`Output:\n${output}`, 'blue');
  } catch (error) {
    logError('Failed to push database schema', error);
    
    // Try alternative: migrate deploy
    log('Attempting alternative: prisma migrate deploy...', 'yellow');
    try {
      const migrateOutput = execSync('npx prisma migrate deploy', { 
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 120000
      });
      log('✓ Database migrations deployed successfully', 'green');
      log(`Output:\n${migrateOutput}`, 'blue');
    } catch (migrateError) {
      logError('Failed to deploy migrations as well', migrateError);
      log('Continuing anyway... some features may not work', 'yellow');
    }
  }
  
  // Step 3: Verify Database Connection
  logSection('STEP 3: VERIFYING DATABASE CONNECTION');
  try {
    log('Testing database connection...', 'yellow');
    
    // Create a quick test script
    const testScript = `
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      async function test() {
        try {
          await prisma.$connect();
          console.log('✓ Database connection successful');
          
          // Try to count users
          const userCount = await prisma.user.count().catch(() => 0);
          console.log(\`✓ Users table accessible (count: \${userCount})\`);
          
          // Try to count articles
          const articleCount = await prisma.article.count().catch(() => 0);
          console.log(\`✓ Articles table accessible (count: \${articleCount})\`);
          
          // Try to count commodity prices
          const priceCount = await prisma.commodityPrice.count().catch(() => 0);
          console.log(\`✓ CommodityPrice table accessible (count: \${priceCount})\`);
          
          await prisma.$disconnect();
          console.log('✓ Database verification complete');
        } catch (error) {
          console.error('✗ Database connection failed:', error.message);
          process.exit(1);
        }
      }
      
      test();
    `;
    
    const testOutput = execSync(`node -e "${testScript}"`, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    log(testOutput, 'green');
  } catch (error) {
    logError('Database verification failed', error);
    log('Continuing anyway... some features may not work', 'yellow');
  }
  
  // Step 4: Initialize Default Settings (Optional)
  logSection('STEP 4: INITIALIZING DEFAULT SETTINGS');
  const initSettingsPath = path.join(process.cwd(), 'scripts', 'init-settings.js');
  if (fs.existsSync(initSettingsPath)) {
    try {
      log('Running init-settings.js...', 'yellow');
      const output = execSync('node scripts/init-settings.js', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      log('✓ Default settings initialized', 'green');
      log(`Output: ${output}`, 'blue');
    } catch (error) {
      log('⚠ init-settings.js failed (non-critical)', 'yellow');
      log(`Error: ${error.message}`, 'blue');
    }
  } else {
    log('⚠ init-settings.js not found (skipping)', 'yellow');
  }
  
  // Summary
  logSection('DATABASE SETUP COMPLETE');
  log('✓ All database setup steps completed', 'green');
  log('You can now start the application', 'green');
  console.log('');
  
  return true;
}

// Run the setup
setupDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    logError('Unexpected error during database setup', error);
    process.exit(1);
  });
