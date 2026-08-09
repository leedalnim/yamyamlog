import { useEffect, useMemo, useState } from 'react'
import { useCatsAndGroups } from '../components/common'
import { BlobFace, CAT_CREAM } from '../components/icons'
import { listSnacks } from '../data/repo'
import type { Snack } from '../data/types'

export function CatsScreen() {
  const { cats, groups } = useCatsAndGroups()
  const [snacks, setSnacks] = useState<Snack[]>([])

  useEffect(() => {
    ;(async () => setSnacks(await listSnacks()))()
  }, [])

  const byGroup = useMemo(
    () => groups.map((g) => ({ group: g, members: cats.filter((c) => c.groupId === g.id) })),
    [cats, groups],
  )

  // 한눈에 보기
  const monthStart = useMemo(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1).getTime()
  }, [])
  const totalCount = snacks.length
  const monthCount = snacks.filter((s) => s.createdAt >= monthStart).length

  return (
    <div className="screen">
      <div className="topbar"><h1>우리 냥이들</h1></div>

      {byGroup.map(({ group, members }) => (
        <section className="stat-section" key={group.id}>
          <h2 className="stat-title">{group.name}</h2>
          <div className="card record-list">
            {members.map((cat) => (
              <div className="record-row" key={cat.id}>
                <div className="cat-avatar" style={{ background: 'var(--surface-2)' }}>
                  <BlobFace color={CAT_CREAM} size={30} />
                </div>
                <div className="record-info">
                  <div className="record-name">{cat.name}</div>
                  <div className="record-sub muted">{group.name}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* 한눈에 보기 */}
      <section className="stat-section">
        <h2 className="stat-title">한눈에 보기</h2>
        <div className="glance-grid">
          <div className="card glance-tile">
            <div className="glance-label muted">전체 기록</div>
            <div className="glance-num tabular">{totalCount}</div>
          </div>
          <div className="card glance-tile">
            <div className="glance-label muted">이번 달 기록</div>
            <div className="glance-num tabular">{monthCount}</div>
          </div>
        </div>
      </section>

      <button
        className="add-cat-btn"
        onClick={() => alert('냥이 추가는 다음 업데이트에서 만들 예정이에요!')}
      >
        + 냥이 추가하기
      </button>
    </div>
  )
}
