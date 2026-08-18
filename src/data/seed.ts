import type { Cat, Group, Snack } from './types'

// 우리집 고양이들 초기 데이터
// A 그룹: 탱자, 유자  /  B 그룹: 콩이, 나물이
export const SEED_GROUPS: Group[] = [
  { id: 'g-a', name: '탱자·유자', order: 0 },
  { id: 'g-b', name: '콩이·나물이', order: 1 },
]

export const SEED_CATS: Cat[] = [
  { id: 'c-tangja', name: '탱자', groupId: 'g-a', color: '#E1873F', order: 0, weightKg: 3, ageYears: 5 },
  { id: 'c-yuja', name: '유자', groupId: 'g-a', color: '#E8C05C', order: 1, weightKg: 3, ageYears: 5 },
  { id: 'c-kong', name: '콩이', groupId: 'g-b', color: '#A98868', order: 2, weightKg: 7, ageYears: 9 },
  { id: 'c-namul', name: '나물이', groupId: 'g-b', color: '#93B98C', order: 3, weightKg: 6.5, ageYears: 6.5 },
]

/** 시드 버전 — 올리면 기존 사용자에게도 시드를 한 번 다시 적용 */
export const SEED_VERSION = 6

/** 사진이 있는 시드 기록의 photoId */
export const SEED_PHOTO_ID = 'p-churu-1'

/** 초기 기록 (createdAt은 ensureSeeded에서 agoMs만큼 과거로 설정) */
export type SeedSnack = Omit<Snack, 'createdAt' | 'updatedAt'> & { agoMs: number }

const HOUR = 1000 * 60 * 60
const DAY = HOUR * 24

/**
 * 노션 "🐈‍⬛ 탱자 기호 체크" DB에서 옮겨온 실제 기록.
 * 유형 '약'은 간식/주식 기호도와 성격이 달라 제외했습니다.
 * 노션 기호 5단계 → 앱 3단계 매핑:
 *   너무잘먹음·잘먹음 → good / 조금먹음·한두입먹음 → ok / 안먹음 → bad
 */
export const SEED_SNACKS: SeedSnack[] = [
  // ---- 간식 ----
  {
    id: 's-jogong-sanyangyu',
    name: '조공 네덜란드 산양유 양갱',
    kind: '양갱',
    base: '산양유',
    memo: '부드러운 양갱 타입 · 8g',
    photoId: SEED_PHOTO_ID,
    reactions: { 'c-tangja': 'good', 'c-yuja': 'bad' },
    agoMs: 0,
  },
  {
    id: 's-jogong-okiro-red',
    name: '조공 오키로 레드',
    kind: '양갱',
    reactions: { 'c-tangja': 'good' },
    agoMs: HOUR * 5,
  },
  {
    id: 's-jogong-yellow',
    name: '조공 옐로우',
    kind: '양갱',
    reactions: { 'c-tangja': 'ok' },
    agoMs: HOUR * 9,
  },
  {
    id: 's-jogong-green-hoki',
    name: '조공 그린 호키',
    kind: '양갱',
    base: '호키',
    memo: '기호성이 좋지 않음',
    reactions: { 'c-tangja': 'bad', 'c-yuja': 'bad' },
    agoMs: DAY,
  },
  {
    id: 's-jogong-galchi',
    name: '조공 나갈치좋아해',
    kind: '양갱',
    base: '갈치',
    memo: '15g · 1,125원 · 갈치, 타피오카, 비타민E',
    reactions: { 'c-tangja': 'ok' },
    agoMs: DAY + HOUR * 4,
  },
  {
    id: 's-sig-oramyun-churu',
    name: '시그니처바이 오라뮨 츄르',
    kind: '츄르',
    base: '닭가슴살',
    memo: '10g · 30,600원 · 베타글루칸·타우린·미네랄 합제',
    reactions: { 'c-tangja': 'good' },
    agoMs: DAY * 2,
  },
  {
    id: 's-sig-probiotics-drops',
    name: '시그니처바이 프로바이오틱스 드롭스',
    kind: '트릿',
    base: '명태',
    memo: '4파우치 · 31,500원 · 유익균배양물·산양분유·프락토올리고당',
    reactions: { 'c-tangja': 'good' },
    agoMs: DAY * 3,
  },

  // ---- 주식 ----
  {
    id: 's-boreal-chicken',
    name: '보레알 치킨',
    kind: '주식',
    base: '닭가슴살',
    memo: '80g · 2,000원 · 치킨, 치킨수프, 치킨간, 완두콩',
    reactions: { 'c-tangja': 'good' },
    agoMs: DAY * 4,
  },
  {
    id: 's-lotus-sardine',
    name: '로투스 정어리',
    kind: '주식',
    base: '정어리',
    memo: '78g · 3,300원 · 정어리, 정어리스프, 완두콩, 통아마씨',
    reactions: { 'c-tangja': 'good' },
    agoMs: DAY * 5,
  },
  {
    id: 's-house-gatos-chicken',
    name: '하우스앤가토스 치킨',
    kind: '주식',
    base: '닭가슴살',
    memo: '156g · 단종',
    reactions: { 'c-tangja': 'good' },
    agoMs: DAY * 6,
  },
  {
    id: 's-sig-aa-pa',
    name: '시그니처 바이 A/a p/a',
    kind: '주식',
    base: '닭가슴살',
    memo: '30g · 1,500원 · 식욕·원기회복용 (약재 치킨 육수, 들깨, 진피)',
    reactions: { 'c-tangja': 'ok' },
    agoMs: DAY * 7,
  },
]
