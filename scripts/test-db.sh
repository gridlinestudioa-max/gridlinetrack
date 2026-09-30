#!/usr/bin/env bash
# Apply the migrations to a throwaway Postgres database (with stand-ins for
# Supabase's auth/storage schemas), then run the tenant isolation test.
# Exits non-zero if any check fails.
#
#   DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres scripts/test-db.sh
#
# Runs automatically on every push via .github/workflows/db-tests.yml.
set -euo pipefail
: "${DATABASE_URL:?set DATABASE_URL to a disposable Postgres (15+) server}"
DB=gridline_isolation_test
psql "$DATABASE_URL" -qc "drop database if exists $DB" -c "create database $DB"
TEST_URL="${DATABASE_URL%/*}/$DB"
psql "$TEST_URL" -q -v ON_ERROR_STOP=1 -f supabase/tests/stub_supabase.sql
for f in supabase/migrations/*.sql; do psql "$TEST_URL" -q -v ON_ERROR_STOP=1 -f "$f"; done
psql "$TEST_URL" -q -v ON_ERROR_STOP=1 -f supabase/tests/tenant_isolation.sql
