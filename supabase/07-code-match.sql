-- 코드를 '숫자만'이 아니라 '글자 전체'로 맞춰본다.
--
-- 지금은 코드를 비교할 때 숫자만 남기고 견준다. 코드가 숫자 4자리였을
-- 때를 가정한 방식인데, 실제로 쓰는 코드는 TG7K-JS27 처럼 영문이 섞여 있다.
-- 그러면 비교에 쓰이는 건 '727' 세 글자뿐이라:
--
--   * 서로 다른 두 우리집이 같은 것으로 취급될 수 있다 (TG7K-JS27 / AB7C-DE27)
--   * 아무 코드나 넣어보는 사람 입장에서 맞힐 경우의 수가 확 줄어든다
--
-- 그래서 하이픈·공백만 무시하고 나머지는 전부 대문자로 맞춰 견준다.
-- 사용자가 소문자로 치거나 하이픈을 빼먹어도 그대로 통과한다.

create or replace function public.join_household(p_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_fails int;
  v_key text;
begin
  if auth.uid() is null then raise exception '로그인이 필요합니다'; end if;

  select count(*) into v_fails from join_attempts
  where user_id = auth.uid()
    and ok = false
    and attempted_at > now() - interval '1 hour';

  if v_fails >= 10 then
    raise exception '시도가 너무 많아요. 잠시 후 다시 해주세요';
  end if;

  -- 하이픈·공백만 걷어내고 대문자로 (TG7K-JS27 = tg7kjs27 = TG7K JS27)
  v_key := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));

  -- 빈 값이 통과하면 안 된다. 예전 방식에서는 숫자 없는 코드가 빈 값이 돼
  -- 아무거나 넣어도 그 집에 들어가지는 구멍이 있었다.
  if length(v_key) < 4 then
    insert into join_attempts (user_id, ok) values (auth.uid(), false);
    raise exception '그런 코드가 없어요';
  end if;

  select h.id into v_id from households h
  where upper(regexp_replace(h.code, '[^A-Za-z0-9]', '', 'g')) = v_key;

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

-- 확인 — 아래를 함께 돌리면 새 방식이 들어갔는지 보인다.
-- '글자 전체' 가 나오면 성공.
select case
         when prosrc like '%[^A-Za-z0-9]%' then '글자 전체 ✅'
         else '숫자만 ❌ (아직 예전 방식)'
       end as 코드_비교_방식
from pg_proc
where proname = 'join_household';
