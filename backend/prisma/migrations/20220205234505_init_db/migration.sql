-- CreateEnum
CREATE TYPE "AppRole" AS ENUM ('SUPERADMIN', 'ADMIN', 'USER');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "role" "AppRole" NOT NULL DEFAULT E'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlobalApiCredential" (
    "id" SERIAL NOT NULL,
    "provider" TEXT NOT NULL,
    "encryptionIV" TEXT NOT NULL,
    "encryptedCredentials" TEXT NOT NULL,
    "encryptedSharedUserCredentials" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GlobalApiCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserApiCredential" (
    "id" SERIAL NOT NULL,
    "provider" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "encryptionIV" TEXT NOT NULL,
    "encryptedCredentials" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserApiCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlackChannelIndexLog" (
    "channelID" TEXT NOT NULL,
    "latestTS" TEXT NOT NULL,
    "nMessages" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SlackChannelIndexLog_pkey" PRIMARY KEY ("channelID","latestTS")
);

-- CreateIndex
CREATE UNIQUE INDEX "GlobalApiCredential_provider_key" ON "GlobalApiCredential"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "UserApiCredential_userId_provider_key" ON "UserApiCredential"("userId", "provider");

-- AddForeignKey
ALTER TABLE "UserApiCredential" ADD CONSTRAINT "UserApiCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- >>>>>>>>>>>>>>>>>>> BEGIN MANUAL STATEMENTS <<<<<<<<<<<<<<<<<<<

-- >>> BEGIN SUPABASE DEFNS <<< 
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

-- >>> BEGIN SUPABASE DEFNS <<< 


-- >>> BEGIN POLICY TRIGGERS/HELPERS <<< 
-- Some code (triggers) taken from here:
-- https://github.com/supabase/supabase/tree/master/examples/nextjs-slack-clone

-- Checks if user is a superadmin
create or replace function public.is_role(
  role "AppRole",
  user_id uuid
)
returns boolean as $$
declare
  bind_permissions int;
begin
  select count(*)
  from public."User" 
  where "User".id = is_role.user_id and "User".role = is_role.role
  into bind_permissions;

  return bind_permissions > 0;
end;
$$ language plpgsql security definer;

-- inserts a row into public.User
create function public.handle_new_user()
returns trigger as $$
declare is_admin boolean;
begin
  -- The first user created is always an admin.
  select count(*) = 1 from auth.users into is_admin;

  if is_admin then
    insert into public."User" (id, role) values (new.id, 'SUPERADMIN');
  else 
    insert into public."User" (id) values (new.id);
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- trigger the function every time a Supabase user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- >>> END POLICY TRIGGERS/HELPERS <<< 

--- >>> BEGIN PRISMA DEFNS <<< 

-- Dummy table for shadow database.
CREATE TABLE IF NOT EXISTS public."_prisma_migrations" ();

--- >>> END PRISMA DEFNS <<< 

-- >>> BEGIN RLS/POLICY <<< 

alter table public."_prisma_migrations" enable row level security;
alter table public."User" enable row level security;
alter table public."GlobalApiCredential" enable row level security;
alter table public."UserApiCredential" enable row level security;
alter table public."SlackChannelIndexLog" enable row level security;

create policy "Allow individual read access" on public."User" for select using ( auth.uid() = id );
create policy "Allow superadmin all access" on public."User" for all using ( is_role('SUPERADMIN', auth.uid()) );
create policy "Allow admin all read access" on public."User" for select using ( is_role('ADMIN', auth.uid()) );
create policy "Allow admin insert except for superadmin" on public."User" for insert with check ( role != 'SUPERADMIN' AND is_role('ADMIN', auth.uid()) );
-- using expr is also applied for with check here.
create policy "Allow admin update except for superadmin" on public."User" for update using ( role != 'SUPERADMIN' AND is_role('ADMIN', auth.uid()) );
create policy "Allow admin delete except for superadmin" on public."User" for delete using ( role != 'SUPERADMIN' AND is_role('ADMIN', auth.uid()) );

-- >>> END RLS/POLICY <<< 

-- >>>>>>>>>>>>>>>>>>> END MANUAL STATEMENTS <<<<<<<<<<<<<<<<<<<