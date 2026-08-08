import { useMemo } from 'react'
import { CatPaw, useCatsAndGroups } from '../components/common'

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
                <div className="cat-avatar" style={{ background: cat.color }}>
                  <CatPaw cat={{ ...cat, color: '#FFFFFF' }} size={22} />
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

      <p className="muted" style={{ fontSize: 13.5, marginTop: 18, lineHeight: 1.6 }}>
        고양이 추가·이름 바꾸기·그룹 바꾸기는 다음 업데이트에서 만들 예정이에요.
      </p>
    </div>
  )
}
