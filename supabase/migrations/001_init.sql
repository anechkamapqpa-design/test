create extension if not exists "pgcrypto";

create table leads (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  contact     text not null,
  request     text,
  source      text not null check (source in ('bot','manual','telegram_personal')),
  status      text not null default 'new' check (status in ('new','in_progress','done','rejected')),
  tg_chat_id  bigint,
  tg_username text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table tags (
  id    uuid primary key default gen_random_uuid(),
  name  text not null unique,
  color text not null default 'slate'
);

create table lead_tags (
  lead_id uuid not null references leads(id) on delete cascade,
  tag_id  uuid not null references tags(id)  on delete cascade,
  primary key (lead_id, tag_id)
);

create table bot_sessions (
  chat_id    bigint primary key,
  step       text not null,
  draft      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table events (
  id         bigserial primary key,
  lead_id    uuid references leads(id) on delete cascade,
  kind       text not null,
  payload    jsonb,
  created_at timestamptz not null default now()
);

create index leads_created_at_idx on leads (created_at desc);
create index lead_tags_tag_idx    on lead_tags (tag_id);

alter table leads        enable row level security;
alter table tags         enable row level security;
alter table lead_tags    enable row level security;
alter table bot_sessions enable row level security;
alter table events       enable row level security;

insert into tags (name, color) values
  ('горячий','red'), ('перезвонить','amber'), ('бюджет','emerald'), ('спам','slate');
