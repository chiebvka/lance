-- -- Create the profiles table
-- create table if not exists public.profiles (
--   id uuid primary key references auth.users(id) on delete cascade,
--   email text
-- );

-- -- Create the function to insert into profiles after signup
-- create or replace function public.handle_new_user()
-- returns trigger as $$
-- begin
--   insert into public.profiles (id, email)
--   values (new.id, new.email);
--   return new;
-- end;
-- $$ language plpgsql security definer;

-- -- Create the trigger to run the function after user signup
-- drop trigger if exists on_auth_user_created on auth.users;

-- create trigger on_auth_user_created
-- after insert on auth.users
-- for each row execute procedure public.handle_new_user();