# Supabase 설정 순서

> **SQL Editor의 탭 내용은 Save를 안 누르면 사라진다.**
> 하지만 Run 한 결과(테이블·함수)는 DB에 영구히 남는다 — 다시 실행할 필요 없다.
> 헷갈리면 `00-verify.sql` 을 돌려서 지금 상태를 확인하면 된다.


SQL Editor에 파일 내용을 붙여넣고 Run. **번호 순서대로** 실행해야 한다.

| 파일 | 내용 | 상태 |
| --- | --- | --- |
| `01-tables.sql` | 기본 테이블 (households / cats / snacks) | ✅ 실행 완료 |
| `02-sync.sql` | 가구 코드·구성원·RLS 접근 규칙 | ✅ 실행 완료 |
| `03-short-code.sql` | 우리집 코드 4자리 숫자 + 무차별 대입 차단 | ✅ 실행 완료 |
| `04-favorite.sql` | 즐겨찾기 컬럼 | ✅ 실행 완료 |
| `05-discontinued.sql` | 단종 표시 컬럼 | ✅ 실행 완료 |

## 지금 남은 것

없다. 앱이 쓰는 컬럼은 모두 서버에 있다.

## 대시보드에서 한 설정 (SQL 아님)

- Authentication → Sign In / Providers → **Allow anonymous sign-ins: 켬** ✅
- 캡차는 켜지 않음 (개인 앱이라 불필요, 나중에 필요하면 켠다)

## 아직 안 붙인 것

- **사진 동기화** — `snacks.photo_path` 컬럼은 만들어 뒀지만 아직 안 쓴다.
  지금은 사진이 각자 기기에만 있어서 상대방 폰에서는 기록만 보인다.
  Supabase Storage로 올리는 작업이 남았다.
