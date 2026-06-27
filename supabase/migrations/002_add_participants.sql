-- Add whatsapp group link to lists
alter table lists add column if not exists whatsapp_group text;

-- Participants per list (many people can join one list)
create table if not exists participants (
  id         uuid primary key default gen_random_uuid(),
  list_id    uuid not null references lists(id) on delete cascade,
  name       text not null,
  contact    text,
  joined_at  timestamptz default now()
);

alter table participants enable row level security;
create policy "Public read participants"   on participants for select using (true);
create policy "Public insert participants" on participants for insert with check (true);
create policy "Public delete participants" on participants for delete using (true);

-- Enable realtime for participants too
-- (add this table to supabase_realtime publication in the dashboard)
