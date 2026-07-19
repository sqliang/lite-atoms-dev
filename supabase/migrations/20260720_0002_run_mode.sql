-- Per-Run execution mode: 'build' auto-approves the planned Contract (default),
-- 'plan' pauses the initial Run at awaiting_approval for user review and editing.
alter table app.agent_runs
  add column mode text not null default 'build' check (mode in ('build', 'plan'));
