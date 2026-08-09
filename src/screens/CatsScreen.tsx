import { useMemo } from 'react'
import { CAT_BLOB, useCatsAndGroups } from '../components/common'
import { BlobFace } from '../components/icons'

export function CatsScreen() {
  const { cats, groups } = useCatsAndGroups()

  const byGroup = useMemo(
    () => groups.map((g) => ({ group: g, members: cats.filter((c) => c.groupId === g.id) })),
    [cats, groups],
  )

  return (
    <div className="screen">
      <div className="topbar"><h1>냥이들</h1></div>

      {byGroup.map(({ group, members }) => (
        <section className="stat-section" key={group.id}>
          <h2 className="stat-title">{group.name}</h2>
          <div className="card record-list">
            {members.map((cat) => (
              <div className="record-row" key={cat.id}>
                <div className="cat-avatar" style={{ background: 'var(--surface-2)' }}>
                  <BlobFace color={CAT_BLOB} size={30} />
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

      <button
        className="add-cat-btn"
        onClick={() => alert('냥이 추가는 다음 업데이트에서 만들 예정이에요!')}
      >
        + 냥이 추가하기
      </button>
    </div>
  )
}
