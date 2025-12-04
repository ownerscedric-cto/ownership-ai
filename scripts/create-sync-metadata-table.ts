/**
 * Script to create sync_metadata table using Prisma raw SQL
 * Workaround for Supabase Pooler connection limitations with migrations
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createSyncMetadataTable() {
  console.log('🔄 Creating sync_metadata table...');

  try {
    // Create sync_metadata table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS sync_metadata (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "dataSource" TEXT UNIQUE NOT NULL,
        "lastSyncedAt" TIMESTAMPTZ NOT NULL,
        "syncCount" INTEGER DEFAULT 0 NOT NULL,
        "lastResult" TEXT,
        "createdAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL,
        "updatedAt" TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
    `);

    console.log('✅ sync_metadata table created');

    // Create indexes
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS sync_metadata_dataSource_idx ON sync_metadata("dataSource");
    `);
    console.log('✅ dataSource index created');

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS sync_metadata_lastSyncedAt_idx ON sync_metadata("lastSyncedAt");
    `);
    console.log('✅ lastSyncedAt index created');

    // Create trigger function for auto-updating updatedAt
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION update_sync_metadata_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW."updatedAt" = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✅ Trigger function created');

    // Create trigger
    await prisma.$executeRawUnsafe(`
      DROP TRIGGER IF EXISTS sync_metadata_updated_at ON sync_metadata;
      CREATE TRIGGER sync_metadata_updated_at
        BEFORE UPDATE ON sync_metadata
        FOR EACH ROW
        EXECUTE FUNCTION update_sync_metadata_updated_at();
    `);
    console.log('✅ Trigger created');

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
      WHERE table_name = 'sync_metadata'
      ORDER BY ordinal_position;
    `);

    console.log('\n📊 sync_metadata table structure:');
    console.table(result);

    console.log('\n🎉 sync_metadata table successfully created!');
  } catch (error) {
    console.error('❌ Error creating sync_metadata table:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createSyncMetadataTable();
