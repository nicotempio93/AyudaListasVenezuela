alter table lists add column if not exists total_records int;
alter table lists add column if not exists block_size int;

alter table participants add column if not exists range_from int;
alter table participants add column if not exists range_to int;
