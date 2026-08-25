-- 9단계: 생년월일
--
-- 나이를 손으로 적어 두면 해가 바뀌어도 그대로 남아 틀린다.
-- 생년월일을 넣어 두고 볼 때마다 계산한다.
-- 예전에 적어 둔 age_years 는 지우지 않는다 — 생년월일이 없는 아이의 예비값.
alter table cats add column if not exists birthday date;

-- 확인
select column_name, data_type
from information_schema.columns
where table_name = 'cats' and column_name in ('birthday', 'age_years')
order by column_name;
