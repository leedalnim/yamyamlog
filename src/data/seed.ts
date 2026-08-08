import type { Cat, Group } from './types'

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
