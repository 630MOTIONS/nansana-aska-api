// Creates a user and prints a random password ONCE. The person must change it
// after the first sign-in. There is no public sign-up.
//
// Usage:
//   pnpm exec tsx --env-file=.env src/scripts/create-user.ts <email> "<Full name>" [admin|editor]
import { randomBytes } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
import { hashPassword } from '../auth/password.js';

const [emailArg, name, roleArg] = process.argv.slice(2);

if (!emailArg || !name) {
  console.error(
    'Usage: pnpm exec tsx --env-file=.env src/scripts/create-user.ts <email> "<Full name>" [admin|editor]',
  );
  process.exit(1);
}
if (roleArg && roleArg !== 'admin' && roleArg !== 'editor') {
  console.error('The role must be "admin" or "editor".');
  process.exit(1);
}

const email = emailArg.trim().toLowerCase();
const role = roleArg === 'editor' ? 'editor' : 'admin';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL as string,
  }),
});

async function main() {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error(`A user with the email ${email} already exists.`);
  }

  const password = randomBytes(18).toString('base64url');
  await prisma.user.create({
    data: { email, name, role, passwordHash: await hashPassword(password) },
  });

  console.log(`Created ${role} ${email}`);
  console.log(`Temporary password (shown once): ${password}`);
  console.log(
    'Sign in, then change it straight away. Clear this terminal afterwards.',
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
