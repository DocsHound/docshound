-- Some code (triggers) taken from here:
-- https://github.com/supabase/supabase/tree/master/examples/nextjs-slack-clone

create or replace function public.is_admin(
  user_id uuid
)
returns boolean as $$
declare
  bind_permissions int;
begin
  select count(*)
  from public."User" 
  where "User".id = is_admin.user_id and "User".role = 'ADMIN'
  into bind_permissions;

  return bind_permissions > 0;
end;
$$ language plpgsql security definer;

alter table public."User" enable row level security;
alter table public."GlobalApiCredential" enable row level security;

create policy "Allow individual read access" on public."User" for select using ( auth.uid() = id );
create policy "Allow admin all access" on public."GlobalApiCredential" for all using (  is_admin(auth.uid()) );

-- inserts a row into public.User
create function public.handle_new_user()
returns trigger as $$
declare is_admin boolean;
begin
  -- The first user created is always an admin.
  select count(*) = 1 from auth.users into is_admin;

  if is_admin then
    insert into public."User" (id, role) values (new.id, 'ADMIN');
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