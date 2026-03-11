-- Create tables for the Cinemar Scripter

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Scripts table
create table public.scripts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default 'Untitled Screenplay',
  content jsonb default '[]'::jsonb, -- Storing blocks as JSON
  last_modified timestamptz default now(),
  created_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table public.scripts enable row level security;

-- Create policies
create policy "Users can view their own scripts"
  on public.scripts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own scripts"
  on public.scripts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own scripts"
  on public.scripts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own scripts"
  on public.scripts for delete
  using (auth.uid() = user_id);

-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.last_modified = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_scripts_updated_at
  before update on public.scripts
  for each row
  execute procedure public.handle_updated_at();
