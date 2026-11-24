// Creates QA test users for the local end-to-end run.
const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function upsertUser(email, password, name, role) {
  const hashed = await hash(password, 12);
  const user = await prisma.user.upsert({
    where: { email },
    update: { password: hashed, role, name },
    create: { email, password: hashed, role, name },
  });
  console.log('QA user ready:', user.email, '| role:', user.role, '| id:', user.id);
}

(async () => {
  await upsertUser('qa.free@geomoneytv.test', '<choose-a-password>', 'QA Free Tester', 'user');
  await upsertUser('qa.admin@geomoneytv.test', '<choose-a-password>', 'QA Admin Tester', 'admin');
  await prisma.$disconnect();
})().catch(e => { console.error(e.message); process.exit(1); });
