alter table lists add column if not exists assignment_type text not null default 'records'
  check (assignment_type in ('records', 'pages'));
