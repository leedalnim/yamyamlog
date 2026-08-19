# Supabase 설정 순서

SQL Editor에 파일 내용을 붙여넣고 Run. **번호 순서대로** 실행해야 한다.

| 파일 | 내용 | 상태 |
| --- | --- | --- |
| `01-tables.sql` | 기본 테이블 (households / cats / snacks) | ✅ 실행 완료 |
| `02-sync.sql` | 가구 코드·구성원·RLS 접근 규칙 | ✅ 실행 완료 |
| `03-short-code.sql` | 우리집 코드 4자리 숫자 + 무차별 대입 차단 | ✅ 실행 완료 |
| `04-favorite.sql` | **즐겨찾기 컬럼** | ⬜ **아직 안 함** |

## 지금 남은 것

`04-favorite.sql` 한 줄만 실행하면 된다.

```sql
alter table snacks add column if not exists favorite boolean default false;
```

안 하면 어떻게 되나 — 즐겨찾기(별)가 **이 기기에만 남고 상대방 폰으로 넘어가지 않는다.**
앱이 즐겨찾기를 서버에 올리려다 컬럼이 없어 실패하므로, 동기화가 통째로
조용히 건너뛰어질 수 있다. 기록이 사라지지는 않지만 두 기기가 안 맞는다.

## 대시보드에서 한 설정 (SQL 아님)

- Authentication → Sign In / Providers → **Allow anonymous sign-ins: 켬** ✅
- 캡차는 켜지 않음 (개인 앱이라 불필요, 나중에 필요하면 켠다)

## 아직 안 붙인 것

- **사진 동기화** — `snacks.photo_path` 컬럼은 만들어 뒀지만 아직 안 쓴다.
  지금은 사진이 각자 기기에만 있어서 상대방 폰에서는 기록만 보인다.
  Supabase Storage로 올리는 작업이 남았다.
