-- 확인용: 어제 실행한 SQL이 제대로 반영돼 있는지 본다.
--
-- SQL Editor의 탭 내용은 Save를 누르지 않으면 사라지지만,
-- Run 한 결과(테이블·함수)는 데이터베이스에 영구히 남는다.
-- 이 파일은 그걸 눈으로 확인하기 위한 것이다.

-- 1) 테이블 — households, cats, snacks, household_members, join_attempts
select table_name as 테이블
from information_schema.tables
where table_schema = 'public'
order by table_name;

-- 2) 함수 — create_household, join_household, is_member, gen_household_code
select routine_name as 함수
from information_schema.routines
where routine_schema = 'public'
order by routine_name;

-- 3) 보안 규칙이 켜져 있는지 (전부 true 여야 한다)
select tablename as 테이블, rowsecurity as 보안켜짐
from pg_tables
where schemaname = 'public'
order by tablename;

-- 4) 만들어진 우리집과 코드
select id, code as 코드, created_at as 만든시각 from households;

-- 5) 앱이 쓰는 컬럼이 다 있는지 (04·05 실행 여부) — 둘 다 1 이어야 한다
select
  count(*) filter (where column_name = 'favorite') as 즐겨찾기,
  count(*) filter (where column_name = 'discontinued') as 단종,
  count(*) filter (where column_name = 'photo_path') as 사진경로
from information_schema.columns
where table_schema = 'public' and table_name = 'snacks';

-- 6) 사진 보관함 (06-photos.sql 실행 여부) — 버킷 1, 접근규칙 4 여야 한다
select
  (select count(*) from storage.buckets where id = 'photos') as 버킷,
  (select count(*) from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname like 'photos %') as 접근규칙;
