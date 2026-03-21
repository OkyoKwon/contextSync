-- Team member role with restricted privileges (CRUD only, no schema changes)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'team_member') THEN
    CREATE ROLE team_member WITH LOGIN PASSWORD 'changeme';
  END IF;
END
$$;

GRANT CONNECT ON DATABASE contextsync TO team_member;
GRANT USAGE ON SCHEMA public TO team_member;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO team_member;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO team_member;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO team_member;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO team_member;
