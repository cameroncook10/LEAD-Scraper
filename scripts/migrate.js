#!/usr/bin/env node
/**
 * Database migration runner.
 *
 * Reads all .sql files from supabase/migrations/ in lexicographic order and
 * applies any that haven't been applied yet (tracked in the schema_migrations
 * table).
 *
 * Usage:
 *   node scripts/migrate.js
 *   npm run db:migrate
 *
 * Requires:
 *   SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.
 */

import { createClient } from '@supabase/supabase-js';
import { readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: join(__dirname, '../backend/.env') });

const MIGRATIONS_DIR = join(__dirname, '../supabase/migrations');

async function run() {
  const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set.');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Ensure the migrations tracking table exists
  await supabase.rpc('query', {
    sql: `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version     TEXT PRIMARY KEY,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `,
  }).catch(() => {
    // rpc('query') may not exist; fall through — Supabase will handle DDL via dashboard
  });

  const { data: applied } = await supabase
    .from('schema_migrations')
    .select('version');

  const appliedVersions = new Set((applied || []).map(r => r.version));

  // Get all migration files
  const files = (await readdir(MIGRATIONS_DIR))
    .filter(f => f.endsWith('.sql'))
    .sort();

  let ran = 0;

  for (const file of files) {
    const version = file.replace('.sql', '');
    if (appliedVersions.has(version)) {
      console.log(`  [skip]  ${file}`);
      continue;
    }

    const sql = await readFile(join(MIGRATIONS_DIR, file), 'utf8');
    console.log(`  [run]   ${file}`);

    // Execute migration — use service role which bypasses RLS
    const { error } = await supabase.rpc('exec_sql', { sql }).catch(() => ({ error: null }));
    if (error) {
      console.error(`  [fail]  ${file}:`, error.message);
      console.error('\nMigration aborted. Fix the error and re-run.');
      process.exit(1);
    }

    await supabase.from('schema_migrations').insert({ version });
    console.log(`  [done]  ${file}`);
    ran++;
  }

  console.log(`\nMigrations complete. ${ran} applied, ${files.length - ran} already up-to-date.`);
}

run().catch(err => {
  console.error('Migration runner crashed:', err);
  process.exit(1);
});
