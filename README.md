# 얌로그 (Yumlog) 🐾

우리집 고양이들이 어떤 간식(츄루 등)을 잘 먹는지 기록하는 모바일 앱.

- 간식 사진 찍기 + **사진에서 제품명 자동 읽기(OCR)**
- 고양이별 반응 3단계 체크 (잘 먹음 / 보통 / 안 먹음)
- 그래프로 기호성 통계 보기 (간식 랭킹, 고양이별 반응)
- 고양이 그룹핑 — **탱자·유자** / **콩이·나물이**
- 테마 2종: **말랑 코지** / **미니 화이트** (설정에서 전환)
- PWA — 폰 홈화면에 앱처럼 설치

## 기술

- React + Vite + TypeScript, PWA
- 저장: 브라우저 IndexedDB (지금은 기기 내 저장)
- OCR: tesseract.js (무료, 기기 내 처리)
- 데이터 접근은 `src/data/repo.ts` 한 곳으로 모음 →
  나중에 **Supabase**(무료 클라우드)로 갈아끼워 두 사람이 공유 예정

## 개발

```bash
npm install
npm run dev      # 로컬 개발 서버
npm run build    # 배포용 빌드 (dist/)
```

## 폰에서 설치하기

`main` 브랜치에 올리면 GitHub Actions가 자동으로 GitHub Pages에 배포합니다.

1. GitHub 저장소 → **Settings → Pages → Source: GitHub Actions** 로 설정
2. `main`에 push하면 배포됨
3. 폰 브라우저로 배포된 주소 접속 → **홈 화면에 추가**

> 다른 곳(Netlify/Vercel)에 올릴 땐 `vite.config.ts`의 `base`를 `'/'`로 바꾸세요.

## 로드맵

- **Phase 1 (현재):** 로컬 저장 MVP — 기록/사진/OCR/그래프/테마
- **Phase 2:** Supabase 연결 — 둘만의 코드로 두 사람 실시간 공유
- **Phase 3:** 고양이 추가/편집, 브랜드별 통계, 즐겨찾기, 백업
