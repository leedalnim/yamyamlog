-- 5단계: 단종 표시
alter table snacks add column if not exists discontinued boolean default false;
