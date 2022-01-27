alter table public."UserApiCredential" enable row level security;
create policy "Allow individual all access" on public."UserApiCredential" for all using (  auth.uid() = "userId" );