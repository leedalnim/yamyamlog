-- 사진 동기화용 저장소.
--
-- 사진은 DB 테이블이 아니라 Supabase Storage(파일 보관함)에 넣는다.
-- 경로 규칙:  <우리집 id>/<사진 id>.jpg
-- 맨 앞 폴더 이름이 곧 우리집 id라서, 그것만 확인하면 남의 집 사진에는
-- 손도 못 대게 만들 수 있다.

-- 1) 버킷 만들기 (비공개 — 로그인한 우리집 식구만 열 수 있다)
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

-- 2) 접근 규칙
--   (storage.foldername(name))[1] = 경로의 첫 폴더 = 우리집 id
--   is_member() 는 02-sync.sql 에서 만든 함수다.

drop policy if exists "photos read" on storage.objects;
create policy "photos read" on storage.objects
  for select using (
    bucket_id = 'photos'
    and public.is_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "photos insert" on storage.objects;
create policy "photos insert" on storage.objects
  for insert with check (
    bucket_id = 'photos'
    and public.is_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "photos update" on storage.objects;
create policy "photos update" on storage.objects
  for update using (
    bucket_id = 'photos'
    and public.is_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "photos delete" on storage.objects;
create policy "photos delete" on storage.objects
  for delete using (
    bucket_id = 'photos'
    and public.is_member(((storage.foldername(name))[1])::uuid)
  );
