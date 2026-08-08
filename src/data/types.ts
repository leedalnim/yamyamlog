// 얌로그 데이터 모델
// 나중에 Supabase(클라우드 공유)로 옮겨도 그대로 쓸 수 있도록
// 순수 데이터 형태로만 정의합니다.

/** 간식 반응 3단계 */
export type ReactionLevel = 'good' | 'ok' | 'bad'

/** 고양이 그룹 (같이 사는 아이들 묶음) */
export interface Group {
  id: string
  name: string
  /** 정렬 순서 */
  order: number
}

/** 고양이 */
export interface Cat {
  id: string
  name: string
  groupId: string
  /** 아이콘 색상 포인트 */
  color: string
  order: number
}

/** 간식 기록 1건 */
export interface Snack {
  id: string
  name: string
  /** 종류(형태). 예: 츄르, 캔, 파우치(습식), 건식, 트릿 */
  kind?: string
  /** 주재료(베이스). 예: 참치, 닭가슴살, 연어. 통계 그룹핑에 사용 */
  base?: string
  /** 브랜드/맛 등 메모 */
  memo?: string
  /** 사진 (IndexedDB Blob 참조 키). 없으면 undefined */
  photoId?: string
  createdAt: number
  updatedAt: number
  /** 고양이별 반응 (catId -> level). 아직 체크 안한 고양이는 없음 */
  reactions: Record<string, ReactionLevel>
}

/** 사진 원본 (별도 저장소) */
export interface Photo {
  id: string
  blob: Blob
}

/** 앱 설정 */
export interface Settings {
  /** 화면 테마 */
  theme: 'cozy' | 'clean'
  /** 다크/라이트/시스템 (테마 색감과 별개로 밝기) */
  colorMode: 'light' | 'dark' | 'system'
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'cozy',
  colorMode: 'system',
}

export const REACTION_META: Record<ReactionLevel, { label: string; short: string }> = {
  good: { label: '잘 먹음', short: '잘먹음' },
  ok: { label: '보통', short: '보통' },
  bad: { label: '안 먹음', short: '안먹음' },
}

/** 간식 종류(형태) 프리셋 */
export const KIND_PRESETS = ['츄르', '캔', '파우치(습식)', '건식', '트릿', '양갱', '동결건조'] as const

/** 자주 쓰는 베이스(주재료) 프리셋 */
export const BASE_PRESETS = [
  '참치',
  '닭가슴살',
  '연어',
  '게살',
  '새우',
  '가리비',
  '소고기',
  '북어',
] as const

/** 기호성 점수화 (통계용): good=1, ok=0.5, bad=0 */
export const REACTION_SCORE: Record<ReactionLevel, number> = {
  good: 1,
  ok: 0.5,
  bad: 0,
}
