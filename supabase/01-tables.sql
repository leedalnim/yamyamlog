-- 1단계: 기본 테이블 (이미 실행함 — 기록용)
create table households (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now()
);

create table cats (
  id text primary key,
  household_id uuid references households(id) on delete cascade,
  name text not null,
  "order" int default 0,
  color text,
  weight_kg real,
  age_years real,
  updated_at timestamptz default now()
);

create table snacks (
  id text primary key,
  household_id uuid references households(id) on delete cascade,
  name text not null,
  kind text,
  base text,
  memo text,
  photo_path text,
  reactions jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index on cats (household_id);
create index on snacks (household_id, created_at desc);

alter table households enable row level security;
alter table cats       enable row level security;
alter table snacks     enable row level security;
