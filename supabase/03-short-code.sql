-- 3단계: 우리집 코드를 4자리 숫자로 + 무차별 대입 차단
--
-- 4자리 숫자는 경우의 수가 1만 개뿐이라 그것만으로는 안전하지 않다.
-- 대신 틀린 코드를 반복해서 넣지 못하게 막아, 전부 대입하려면
-- 1000시간이 걸리게 만든다(한 기기당 1시간에 10회).

create or replace function public.gen_household_code()
returns text language sql as $$
  select lpad((floor(random() * 10000))::int::text, 4, '0');
$$;

create table if not exists join_attempts (
  user_id uuid,
  attempted_at timestamptz default now(),
  ok boolean default false
);
create index if not exists join_attempts_user_time
  on join_attempts (user_id, attempted_at desc);
alter table join_attempts enable row level security;

create or replace function public.join_household(p_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_fails int;
begin
  if auth.uid() is null then raise exception '로그인이 필요합니다'; end if;

  select count(*) into v_fails from join_attempts
  where user_id = auth.uid()
    and ok = false
    and attempted_at > now() - interval '1 hour';

  if v_fails >= 10 then
    raise exception '시도가 너무 많아요. 잠시 후 다시 해주세요';
  end if;

  -- 숫자만 남겨서 비교 (사용자가 공백·하이픈을 넣어도 통과)
  select h.id into v_id from households h
  where regexp_replace(h.code, '\D', '', 'g') = regexp_replace(p_code, '\D', '', 'g');

  if v_id is null then
    insert into join_attempts (user_id, ok) values (auth.uid(), false);
    raise exception '그런 코드가 없어요';
  end if;

  insert into household_members (household_id, user_id)
  values (v_id, auth.uid()) on conflict do nothing;
  insert into join_attempts (user_id, ok) values (auth.uid(), true);

  return v_id;
end;
$$;
