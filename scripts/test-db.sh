#!/usr/bin/env bash
# Apply the migrations + seed to a throwaway Postgres database with Supabase
# stubs, then run the RLS smoke test.
#   DATABASE_URL=postgres://postgres@localhost:5432/postgres scripts/test-db.sh
set -euo pipefail
: "${DATABASE_URL:?set DATABASE_URL to a disposable Postgres (15+) server}"
DB=gridline_rls_test
psql "$DATABASE_URL" -qc "drop database if exists $DB" -c "create database $DB"
TEST_URL="${DATABASE_URL%/*}/$DB"
psql "$TEST_URL" -q -v ON_ERROR_STOP=1 -f supabase/tests/stub_supabase.sql
for f in supabase/migrations/*.sql supabase/seed.sql; do psql "$TEST_URL" -q -v ON_ERROR_STOP=1 -f "$f"; done
psql "$TEST_URL" -f supabase/tests/rls_smoke.sql
