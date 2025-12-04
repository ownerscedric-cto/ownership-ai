/**
 * Script to create customer_programs table using Prisma raw SQL
 * Workaround for Supabase Pooler connection limitations with migrations
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createCustomerProgramsTable() {
  console.log('🔄 Creating customer_programs table...');

  try {
    // Create customer_programs table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS customer_programs (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "customerId" TEXT NOT NULL,
        "programId" TEXT NOT NULL,
        "addedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        notes TEXT,
        CONSTRAINT customer_programs_customerId_fkey FOREIGN KEY ("customerId") REFERENCES customers(id) ON DELETE CASCADE,
        CONSTRAINT customer_programs_programId_fkey FOREIGN KEY ("programId") REFERENCES programs(id) ON DELETE CASCADE
      );
    `);

    console.log('✅ customer_programs table created');

    // Create unique constraint (한 고객당 같은 프로그램 한 번만)
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS customer_programs_customerId_programId_key
      ON customer_programs("customerId", "programId");
    `);
    console.log('✅ Unique constraint created (customerId, programId)');

    // Create index on customerId
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS customer_programs_customerId_idx ON customer_programs("customerId");
    `);
    console.log('✅ customerId index created');

    // Create index on programId
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS customer_programs_programId_idx ON customer_programs("programId");
    `);
    console.log('✅ programId index created');

    // Create index on addedAt
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS customer_programs_addedAt_idx ON customer_programs("addedAt");
    `);
    console.log('✅ addedAt index created');

    // Verify table was created
    interface ColumnInfo {
      table_name: string;
      column_name: string;
      data_type: string;
      is_nullable: string;
    }

    const result = await prisma.$queryRawUnsafe<ColumnInfo[]>(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'customer_programs'
      ORDER BY ordinal_position;
    `);

    console.log('\n📊 customer_programs table structure:');
    console.table(result);

    console.log('\n🎉 customer_programs table successfully created!');
  } catch (error) {
    console.error('❌ Error creating customer_programs table:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createCustomerProgramsTable();
