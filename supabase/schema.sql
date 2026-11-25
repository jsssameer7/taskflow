-- TaskFlow Supabase PostgreSQL Schema
-- Run this SQL in your Supabase Dashboard -> SQL Editor

-- 1. Tasks table
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) > 0 and char_length(title) <= 200),
  description text not null default '' check (char_length(description) <= 2000),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  category text not null default 'General' check (char_length(category) <= 60),
  due_date timestamptz,
  reminder_timing text not null default 'default' check (reminder_timing in ('default', 'at_due', '15m', '30m', '1h', '1d', 'never')),
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for fast filtering & sorting
create index if not exists idx_tasks_completed on public.tasks (completed);
create index if not exists idx_tasks_priority on public.tasks (priority);
create index if not exists idx_tasks_due_date on public.tasks (due_date);
create index if not exists idx_tasks_created_at on public.tasks (created_at desc);

-- 2. Workspace settings table
create table if not exists public.settings (
  key text primary key default 'default',
  display_name text not null default 'Alex Morgan' check (char_length(trim(display_name)) > 0 and char_length(display_name) <= 80),
  email text not null default 'alex@taskflow.app' check (char_length(email) <= 120),
  role text not null default 'Product Manager' check (char_length(role) <= 80),
  default_priority text not null default 'medium' check (default_priority in ('low', 'medium', 'high')),
  default_category text not null default 'Work' check (char_length(default_category) <= 60),
  notifications_enabled boolean not null default true,
  alert_timing text not null default '15m' check (alert_timing in ('at_due', '15m', '30m', '1h', '1d', 'never')),
  alert_overdue boolean not null default true,
  sound_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

-- 3. Automatic updated_at timestamp trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_tasks_updated_at on public.tasks;
create trigger trg_tasks_updated_at
  before update on public.tasks
  for each row
  execute function public.set_updated_at();

drop trigger if exists trg_settings_updated_at on public.settings;
create trigger trg_settings_updated_at
  before update on public.settings
  for each row
  execute function public.set_updated_at();

-- 4. Enable Row Level Security (server accesses Supabase via SUPABASE_SERVICE_ROLE_KEY,
-- which securely bypasses RLS while keeping public/browser anon access locked down)
alter table public.tasks enable row level security;
alter table public.settings enable row level security;

-- Seed default settings row if absent
insert into public.settings (key, display_name, email, role, default_priority, default_category)
values ('default', 'Alex Morgan', 'alex@taskflow.app', 'Product Manager', 'medium', 'Work')
on conflict (key) do nothing;
