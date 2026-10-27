-- 10단계: 냥이 사진
--
-- 냥이 사진 파일은 간식 사진과 같은 보관함(photos 버킷, 06-photos.sql)에
-- 같은 경로 규칙(<우리집 id>/<사진 id>.jpg)으로 들어간다. 여기서는 냥이
-- 기록표에 '그 사진이 어디 있는지' 적을 칸만 하나 더 만든다.
alter table cats add column if not exists photo_path text;

-- 확인 — photo_path 한 줄이 나오면 된다
select column_name, data_type
from information_schema.columns
where table_name = 'cats' and column_name = 'photo_path';
