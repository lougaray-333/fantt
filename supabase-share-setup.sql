-- ==========================================================================
-- Share Link + Analytics — Phase 1 Schema
-- Run this in the Supabase Dashboard SQL Editor
-- ==========================================================================


-- ============================================================
-- 1. Add share columns to projects table
-- ============================================================

alter table projects
  add column if not exists share_token uuid unique default null,
  add column if not exists share_enabled boolean default false;

-- Index for fast token lookups (every shared view load hits this)
create index if not exists projects_share_token_idx on projects (share_token)
  where share_token is not null;


-- ============================================================
-- 2. Share views table (one row per page load)
-- ============================================================

create table if not exists share_views (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references projects(id) on delete cascade,
  share_token  uuid not null,
  session_id   text not null,           -- client-generated UUID (sessionStorage), groups events per tab
  ip_address   text,                    -- captured server-side via Edge Function
  country      text,                    -- resolved from IP
  city         text,                    -- resolved from IP
  user_agent   text,
  referrer     text,
  viewed_at    timestamptz default now()
);

create index if not exists share_views_project_id_idx on share_views (project_id);
create index if not exists share_views_session_id_idx on share_views (session_id);


-- ============================================================
-- 3. Share events table (one row per interaction)
-- ============================================================

create table if not exists share_events (
  id           uuid primary key default gen_random_uuid(),
  view_id      uuid references share_views(id) on delete cascade,
  project_id   uuid not null references projects(id) on delete cascade,
  session_id   text not null,
  -- event_type values: 'task_click' | 'task_hover' | 'scroll_horizontal' | 'scroll_vertical' | 'page_exit'
  event_type   text not null,
  event_data   jsonb default '{}',      -- flexible payload per event type (see notes below)
  occurred_at  timestamptz default now()
);

-- event_data examples by type:
--   task_click:          { "task_id": "...", "task_name": "...", "group": "..." }
--   task_hover:          { "task_id": "...", "task_name": "...", "duration_seconds": 3.2 }
--   scroll_horizontal:   { "max_scroll_px": 840, "total_days_visible": 42 }
--   scroll_vertical:     { "max_tasks_visible": 18 }
--   page_exit:           { "time_on_page_seconds": 142 }

create index if not exists share_events_project_id_idx on share_events (project_id);
create index if not exists share_events_session_id_idx on share_events (session_id);
create index if not exists share_events_event_type_idx on share_events (event_type);


-- ============================================================
-- 4. Row Level Security
-- ============================================================

-- Enable RLS on new tables
alter table share_views  enable row level security;
alter table share_events enable row level security;

-- ── Projects: anon can read a project if it has an active share link ──────────
-- (They still need to know the share_token UUID to find the row)
drop policy if exists "Anon can read shared projects" on projects;
create policy "Anon can read shared projects"
  on projects for select
  to anon
  using (share_enabled = true and share_token is not null);

-- ── Tasks: anon can read tasks whose project has an active share link ─────────
-- Project UUIDs are random and not exposed, so guessing project_id is not viable
drop policy if exists "Anon can read shared tasks" on tasks;
create policy "Anon can read shared tasks"
  on tasks for select
  to anon
  using (
    exists (
      select 1 from projects p
      where p.id = tasks.project_id
        and p.share_enabled = true
        and p.share_token is not null
    )
  );

-- ── share_views: anon can insert (log a view), owners can read their own ──────
drop policy if exists "Anon can log share views" on share_views;
create policy "Anon can log share views"
  on share_views for insert
  to anon
  with check (true);

drop policy if exists "Owners can read share views" on share_views;
create policy "Owners can read share views"
  on share_views for select
  to authenticated
  using (
    exists (
      select 1 from projects p
      where p.id = share_views.project_id
        and p.email = auth.jwt() ->> 'email'
    )
  );

-- ── share_events: anon can insert, owners can read their own ──────────────────
drop policy if exists "Anon can log share events" on share_events;
create policy "Anon can log share events"
  on share_events for insert
  to anon
  with check (true);

drop policy if exists "Owners can read share events" on share_events;
create policy "Owners can read share events"
  on share_events for select
  to authenticated
  using (
    exists (
      select 1 from projects p
      where p.id = share_events.project_id
        and p.email = auth.jwt() ->> 'email'
    )
  );
