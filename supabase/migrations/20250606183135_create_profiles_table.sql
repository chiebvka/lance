create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz default timezone('utc', now())
);


create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (profile_id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;


create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();


