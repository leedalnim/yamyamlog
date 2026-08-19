/**
 * 병합 규칙 (네트워크와 무관한 순수 로직 — 그래서 따로 테스트할 수 있다).
 *
 * 두 기기가 같은 기록을 각자 고쳤을 때 무엇을 남길지 정한다.
 * 규칙은 하나: **마지막으로 고친 쪽이 이긴다**(updatedAt 비교).
 *
 * 삭제도 '수정'의 한 종류로 본다. 지운 기록은 사라지지 않고 deletedAt이
 * 찍힌 채로 남아, 상대 기기로 "이건 지워졌다"는 사실이 전달된다.
 * 이게 없으면 한쪽에서 지운 기록이 다음 동기화 때 되살아난다.
 */

export interface Mergeable {
  id: string
  updatedAt?: number
  deletedAt?: number
}

/** 두 판본 중 살아남을 쪽. 같은 시각이면 지운 쪽을 택한다(되살아남 방지). */
export function pickWinner<T extends Mergeable>(local: T | undefined, remote: T | undefined): T | undefined {
  if (!local) return remote
  if (!remote) return local
  const lt = local.updatedAt ?? 0
  const rt = remote.updatedAt ?? 0
  if (lt > rt) return local
  if (rt > lt) return remote
  // 시각이 같으면 삭제를 우선 — 지운 걸 되살리는 쪽이 더 나쁘다
  if (local.deletedAt && !remote.deletedAt) return local
  if (remote.deletedAt && !local.deletedAt) return remote
  return local
}

export interface MergeResult<T> {
  /** 로컬에 반영할 것 (원격이 이겼거나 로컬에 없던 것) */
  toLocal: T[]
  /** 원격에 올릴 것 (로컬이 이겼거나 원격에 없던 것) */
  toRemote: T[]
}

/** 로컬 목록과 원격 목록을 맞춘다 */
export function mergeLists<T extends Mergeable>(local: T[], remote: T[]): MergeResult<T> {
  const localById = new Map(local.map((r) => [r.id, r]))
  const remoteById = new Map(remote.map((r) => [r.id, r]))
  const ids = new Set([...localById.keys(), ...remoteById.keys()])

  const toLocal: T[] = []
  const toRemote: T[] = []

  for (const id of ids) {
    const l = localById.get(id)
    const r = remoteById.get(id)
    const winner = pickWinner(l, r)
    if (!winner) continue

    if (!r) {
      toRemote.push(winner)
    } else if (!l) {
      toLocal.push(winner)
    } else if (winner === l) {
      // 로컬이 이겼는데 내용이 다르면 원격을 갱신
      if ((l.updatedAt ?? 0) !== (r.updatedAt ?? 0)) toRemote.push(l)
    } else {
      toLocal.push(r)
    }
  }

  return { toLocal, toRemote }
}
