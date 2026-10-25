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
| `06-photos.sql` | 사진 보관함(Storage) + 접근 규칙 | ✅ 실행 완료 (버킷 1 · 규칙 4 확인) |
| `07-code-match.sql` | 코드를 글자 전체로 맞춰보기 | ✅ 실행 완료 ('글자 전체' 확인) |
| `08-reset-attempts.sql` | 쌓인 참여 실패 기록 지우기 | — 필요할 때만 (지금은 불필요) |
| `09-birthday.sql` | 냥이 생년월일 컬럼 | ✅ 실행 완료 (birthday date 확인) |

## 지금 남은 것

- 네이버 쇼핑 검색 설정 (아래 '네이버 쇼핑 검색') — 안 해도 앱은 그대로 동작한다

그 밖에는 없다. 앱이 쓰는 테이블·컬럼·사진 보관함·코드 비교가 모두 서버에 있다.
헷갈리면 `00-verify.sql` 을 돌려서 지금 상태를 눈으로 확인하면 된다.

## 네이버 쇼핑 검색 (서버 함수 `naver-shop`)

새 기록·기록 수정에서 네이버 쇼핑 상품을 찾아 이름·사진·종류·원료·메모를
채운다. 네이버 열쇠는 앱에 넣으면 누구나 볼 수 있으므로, 서버 함수가
열쇠를 들고 대신 검색한다. 설정 전에는 앱이 이 기능을 조용히 숨긴다.

1. **네이버 열쇠 받기** — https://developers.naver.com/apps/#/register
   - 애플리케이션 이름: 얌얌로그
   - 사용 API: **검색**
   - 비로그인 오픈 API 서비스 환경: **WEB 설정** → `https://leedalnim.github.io`
   - 등록하면 **Client ID** 와 **Client Secret** 이 나온다
2. **Supabase 비밀 값 넣기** — Edge Functions → Secrets
   - `NAVER_CLIENT_ID` = Client ID
   - `NAVER_CLIENT_SECRET` = Client Secret
3. **함수 올리기** — Edge Functions → Deploy a new function → Via Editor
   - 이름: `naver-shop` (정확히 이 이름)
   - 내용: `functions/naver-shop/index.ts` 전체를 붙여넣고 Deploy
4. **JWT 확인 끄기** — 함수 `naver-shop` → Details → *Verify JWT with legacy secret* 끔
   - 함수가 안에서 직접 '우리 앱으로 로그인한 기기인지' 확인한다

검색은 하루 25,000번까지 무료. 함수 코드를 고치면 3번을 다시 하면 된다.

## 참여가 안 될 때

코드를 넣어도 참여가 안 되면 순서대로 확인한다.

1. **`08-reset-attempts.sql`** — 한 시간에 10번 실패하면 코드가 맞아도 막힌다.
   코드가 잘려서 가던 시기에 여러 번 시도했다면 여기에 걸려 있을 수 있다.
2. **`07-code-match.sql`** — 코드를 글자 전체로 맞춰보게 한다.
3. 화면에 뜨는 문구를 본다. '그런 코드가 없어요'(코드 문제)와
   '지금 서버에 연결할 수 없어요'(네트워크 문제)는 원인이 전혀 다르다.

사진 경로는 `<우리집 id>/<사진 id>.jpg` 라서, 맨 앞 폴더만 확인하면
남의 집 사진에는 손도 못 대게 된다.

## 대시보드에서 한 설정 (SQL 아님)

- Authentication → Sign In / Providers → **Allow anonymous sign-ins: 켬** ✅
- 캡차는 켜지 않음 (개인 앱이라 불필요, 나중에 필요하면 켠다)

## 사진은 얼마나 들어가나

무료 플랜 저장 용량 1GB. 사진은 올리기 전에 긴 변 1280px · 품질 82% 로
줄여서 넣으므로 한 장에 보통 100~300KB다. 넉넉잡아 **3,000장 이상** 들어간다.
기록을 지우면 서버에 있던 사진도 다음 동기화 때 같이 치워진다.
