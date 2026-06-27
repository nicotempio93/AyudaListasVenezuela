-- Enable UUID extension (usually already enabled in Supabase)
create extension if not exists "pgcrypto";

create table if not exists lists (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  file_path     text not null,
  file_url      text,
  file_type     text,
  status        text not null default 'available'
                  check (status in ('available', 'claimed', 'completed')),
  claimed_by    text,
  claimed_contact text,
  claimed_at    timestamptz,
  completed_at  timestamptz,
  notes         text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Auto-update updated_at on any row change
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger lists_updated_at
  before update on lists
  for each row execute procedure update_updated_at();

-- Allow public read and write (no auth for MVP)
alter table lists enable row level security;

create policy "Public read" on lists for select using (true);
create policy "Public insert" on lists for insert with check (true);
create policy "Public update" on lists for update using (true);

-- Storage bucket for list files (run this in Supabase dashboard or via API)
-- insert into storage.buckets (id, name, public) values ('lists', 'lists', true);
-- create policy "Public read storage" on storage.objects for select using (bucket_id = 'lists');
-- create policy "Public upload storage" on storage.objects for insert with check (bucket_id = 'lists');
