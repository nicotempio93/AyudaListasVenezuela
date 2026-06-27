# Coordinador de listas

Simple public coordination board for volunteer list-loading. Prevents duplicated work by letting volunteers claim lists atomically.

## Setup

### 1. Supabase project

Create a free project at [supabase.com](https://supabase.com).

**Run the SQL migration** in the Supabase SQL editor:

```
supabase/migrations/001_create_lists.sql
```

**Create the storage bucket** in the Supabase dashboard:
- Go to Storage → New bucket
- Name: `lists`
- Public: ✅ enabled

Or run in the SQL editor:
```sql
insert into storage.buckets (id, name, public) values ('lists', 'lists', true);
create policy "Public read storage" on storage.objects for select using (bucket_id = 'lists');
create policy "Public upload storage" on storage.objects for insert with check (bucket_id = 'lists');
```

**Enable Realtime** for the `lists` table:
- Go to Database → Replication
- Enable replication for the `lists` table

### 2. Environment variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Both values are found in Supabase → Project Settings → API.

### 3. Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

### 4. Deploy

Deploy to Vercel, Netlify, or any platform that supports Next.js. Add the two env vars in the platform's dashboard.

## Usage

- **Subir lista** (top-right): Upload a file and give it a title. Accepted formats: images, PDF, Excel, CSV, Word.
- **Tomar lista**: Volunteer enters their name/team and optional contact to claim a list.
- **Completar**: Marks the list as fully loaded.
- **Liberar**: Returns a claimed list to available (if a volunteer can no longer work it).
- Updates are real-time — all volunteers see changes without refreshing.

## Architecture

```
app/
  page.tsx              — main dashboard (client, realtime)
  api/
    lists/route.ts       — GET all, POST create
    lists/[id]/claim/    — atomic claim (only if status=available)
    lists/[id]/release/  — release back to available
    lists/[id]/complete/ — mark completed
    upload/route.ts      — upload to Supabase Storage + insert row
components/
  ListCard.tsx           — card with all actions
  ClaimModal.tsx         — claim form modal
  CompleteModal.tsx      — confirm complete modal
  UploadForm.tsx         — upload modal
  StatusBadge.tsx        — colored status chip
lib/
  types.ts               — shared TypeScript types
  supabase/client.ts     — browser Supabase client
  supabase/server.ts     — server Supabase client
supabase/
  migrations/001_create_lists.sql
```
