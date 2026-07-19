-- Local dev only: identity comes from Supabase Auth JWTs, so the local database
-- does not need a user directory. Dropping these FKs lets any verified user write
-- without seeding auth.users first.
alter table app.projects drop constraint projects_owner_id_fkey;
alter table app.build_contracts drop constraint build_contracts_created_by_fkey;
