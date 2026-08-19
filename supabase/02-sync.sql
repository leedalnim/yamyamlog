-- 2단계: 공유·보안 설정
--
-- 목표
--   · 우리집(household) 코드를 아는 사람만 그 집 기록에 접근한다
--   · 공개 키(sb_publishable_...)가 노출돼도 남의 기록은 못 읽는다
--   · 회원가입 없이 쓴다 — 익명 로그인으로 기기마다 신원만 만든다
--
-- 먼저 대시보드에서 익명 로그인을 켜야 한다:
--   Authentication → Sign In / Providers → Anonymous sign-ins → Enable
--
-- SQL Editor에 통째로 붙여넣고 Run.

-- ── 스키마 보강 ────────────────────────────────────────────────
alter table households add column if not exists code text unique;

-- 삭제는 지우지 않고 표시만 한다(툼스톤).
-- 안 그러면 한쪽에서 지운 기록이 다음 동기화 때 되살아난다.
alter table cats   add column if not exists deleted_at timestamptz;
alter table snacks add column if not exists deleted_at timestamptz;

create table if not exists household_members (
  household_id uuid references households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (household_id, user_id)
);
alter table household_members enable row level security;

-- ── 헬퍼 ──────────────────────────────────────────────────────
-- 내가 이 집 구성원인가. security definer 라서 정책 안에서 재귀하지 않는다.
create or replace function public.is_member(h uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from household_members m
    where m.household_id = h and m.user_id = auth.uid()
  );
$$;

-- 사람이 불러주기 쉬운 코드. 헷갈리는 글자(0/O/1/I)는 뺐다.
create or replace function public.gen_household_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  out text := '';
  i int;
begin
  for i in 1..8 loop
    out := out || substr(chars, floor(random() * length(chars))::int + 1, 1);
    if i = 4 then out := out || '-'; end if;
  end loop;
  return out;
end;
$$;

-- ── 가구 만들기 / 참여하기 ────────────────────────────────────
-- 둘 다 security definer — 정책에 막히지 않고 딱 필요한 일만 한다.
create or replace function public.create_household()
returns table (id uuid, code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_code text;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다';
  end if;

  loop
    v_code := gen_household_code();
    exit when not exists (select 1 from households h where h.code = v_code);
  end loop;

  insert into households (code) values (v_code) returning households.id into v_id;
  insert into household_members (household_id, user_id) values (v_id, auth.uid());

  return query select v_id, v_code;
end;
$$;

create or replace function public.join_household(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다';
  end if;

  select h.id into v_id
  from households h
  where upper(replace(h.code, '-', '')) = upper(replace(p_code, '-', ''));

  if v_id is null then
    raise exception '그런 코드가 없어요';
  end if;

  insert into household_members (household_id, user_id)
  values (v_id, auth.uid())
  on conflict do nothing;

  return v_id;
end;
$$;

-- ── 접근 규칙 ─────────────────────────────────────────────────
drop policy if exists households_select on households;
create policy households_select on households
  for select using (is_member(id));

drop policy if exists members_select on household_members;
create policy members_select on household_members
  for select using (user_id = auth.uid());

drop policy if exists cats_all on cats;
create policy cats_all on cats
  for all using (is_member(household_id)) with check (is_member(household_id));

drop policy if exists snacks_all on snacks;
create policy snacks_all on snacks
  for all using (is_member(household_id)) with check (is_member(household_id));

-- 익명 사용자도 위 함수는 부를 수 있어야 한다(내부에서 auth.uid()로 검사함)
grant execute on function public.create_household() to anon, authenticated;
grant execute on function public.join_household(text) to anon, authenticated;
grant execute on function public.is_member(uuid) to anon, authenticated;
