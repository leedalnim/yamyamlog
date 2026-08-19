-- 4단계: 즐겨찾기
alter table snacks add column if not exists favorite boolean default false;
