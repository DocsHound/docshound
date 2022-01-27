-- We specify parts of the supabase schema here so that we can resolve
-- it in our prisma migrations when running in migrate dev mode.
-- This is copied from a part of docker/db/volumes/init/01-auth-schema.sql
-- with some additions of IF NOT EXISTS.

CREATE SCHEMA IF NOT EXISTS auth AUTHORIZATION supabase_admin;

-- auth.users definition

CREATE TABLE IF NOT EXISTS auth.users (
	instance_id uuid NULL,
	id uuid NOT NULL UNIQUE,
	aud varchar(255) NULL,
	"role" varchar(255) NULL,
	email varchar(255) NULL UNIQUE,
	encrypted_password varchar(255) NULL,
	confirmed_at timestamptz NULL,
	invited_at timestamptz NULL,
	confirmation_token varchar(255) NULL,
	confirmation_sent_at timestamptz NULL,
	recovery_token varchar(255) NULL,
	recovery_sent_at timestamptz NULL,
	email_change_token varchar(255) NULL,
	email_change varchar(255) NULL,
	email_change_sent_at timestamptz NULL,
	last_sign_in_at timestamptz NULL,
	raw_app_meta_data jsonb NULL,
	raw_user_meta_data jsonb NULL,
	is_super_admin bool NULL,
	created_at timestamptz NULL,
	updated_at timestamptz NULL,
	CONSTRAINT users_pkey PRIMARY KEY (id)
);

create or replace function auth.uid() 
returns uuid 
language sql stable
as $$
  select 
  	coalesce(
		current_setting('request.jwt.claim.sub', true),
		(current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
	)::uuid
$$;

create or replace function auth.role() 
returns text 
language sql stable
as $$
  select 
  	coalesce(
		current_setting('request.jwt.claim.role', true),
		(current_setting('request.jwt.claims', true)::jsonb ->> 'role')
	)::text
$$;