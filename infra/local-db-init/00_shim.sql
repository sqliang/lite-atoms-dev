-- Local-dev shims for Supabase-specific objects referenced by the migrations.
-- Vanilla Postgres lacks the `anon`/`authenticated` roles and the `auth` schema;
-- the API enforces ownership itself, so these stubs only satisfy the DDL.
create role anon nologin;
create role authenticated nologin;

create schema if not exists auth;
create table if not exists auth.users (id uuid primary key);

-- RLS policies reference auth.uid(); the backend connects as the table owner
-- (RLS bypassed), so the function body is irrelevant locally.
create or replace function auth.uid() returns uuid
language sql stable as $$ select null::uuid $$;

-- The migration seeds Supabase Storage buckets; locally, artifacts live on the
-- Docker volume, so only the table shape is needed to satisfy the DDL.
create schema if not exists storage;
create table if not exists storage.buckets (
  id text primary key,
  name text,
  public boolean
);
