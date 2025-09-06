import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { randomBytes } from 'crypto';
import { unlinkSync } from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const dbName = `test-${randomBytes(8).toString('hex')}.db`;
const dbPath = path.join(path.resolve(), 'tests', dbName);
const testDbUrl = `file:${dbPath}`;

// Set the database URL for Prisma Client
process.env.DATABASE_URL = testDbUrl;

// Global setup runs once before all tests
before(async function() {
  this.timeout(15000); // Increase timeout for setup

  console.log('Setting up test database...');
  
  // Ensure the environment variable is set for the migration command
  const env = { ...process.env, DATABASE_URL: testDbUrl };

  // Run migrations to setup the test database schema
  execSync('npx prisma migrate dev --name init', { env, stdio: 'inherit' });
  
  await prisma.$connect();
  console.log('Test database setup complete.');
});

// Global teardown runs once after all tests
after(async function() {
  this.timeout(10000); // Increase timeout for teardown
  
  console.log('Tearing down test database...');
  await prisma.$disconnect();
  
  // Cleanup the test database file
  try {
    unlinkSync(dbPath);
    console.log('Test database deleted.');
  } catch (error) {
    console.error('Failed to delete test database:', error);
  }
});

// Clean up tables before tests to ensure a clean state
before(async () => {
  // Order of deletion matters due to foreign key constraints
  await prisma.refreshToken.deleteMany();
  await prisma.shortLink.deleteMany();
  await prisma.user.deleteMany();
});