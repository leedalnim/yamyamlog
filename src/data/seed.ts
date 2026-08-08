import type { Cat, Group, Snack } from './types'

// 우리집 고양이들 초기 데이터
// A 그룹: 탱자, 유자  /  B 그룹: 콩이, 나물이
export const SEED_GROUPS: Group[] = [
  { id: 'g-a', name: '탱자·유자', order: 0 },
  { id: 'g-b', name: '콩이·나물이', order: 1 },
]

export const SEED_CATS: Cat[] = [
  { id: 'c-tangja', name: '탱자', groupId: 'g-a', color: '#E8894A', order: 0 },
  { id: 'c-yuja', name: '유자', groupId: 'g-a', color: '#F0B429', order: 1 },
  { id: 'c-kong', name: '콩이', groupId: 'g-b', color: '#9B7A52', order: 2 },
  { id: 'c-namul', name: '나물이', groupId: 'g-b', color: '#6FA76B', order: 3 },
]

/** 사진이 있는 시드 기록의 photoId */
export const SEED_PHOTO_ID = 'p-churu-1'

/** 초기 기록 (createdAt은 ensureSeeded에서 agoMs만큼 과거로 설정) */
export type SeedSnack = Omit<Snack, 'createdAt' | 'updatedAt'> & { agoMs: number }

export const SEED_SNACKS: SeedSnack[] = [
  {
    id: 's-nc-yeongyang',
    name: '조공 네덜란드 산양유 양갱',
    kind: '양갱',
    base: '산양유',
    memo: '부드러운 양갱 타입 · 8g',
    photoId: SEED_PHOTO_ID,
    reactions: { 'c-tangja': 'good', 'c-yuja': 'bad' },
    agoMs: 0,
  },
  {
    id: 's-okiro-red',
    name: '오키로 레드',
    base: '연어',
    reactions: { 'c-tangja': 'good', 'c-yuja': 'good' },
    agoMs: 1000 * 60 * 60 * 24, // 하루 전
  },
]
