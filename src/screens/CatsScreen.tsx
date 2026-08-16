import { useEffect, useMemo, useState } from 'react'
import { useCatsAndGroups } from '../components/common'
import { BlobFace, CAT_CREAM, IconChevronRight } from '../components/icons'
import { listSnacks } from '../data/repo'
import type { Snack } from '../data/types'

const CALC_URL = 'https://leedalnim.github.io/pet-food-calc/'

export function CatsScreen() {
  const { cats, groups } = useCatsAndGroups()
  const [snacks, setSnacks] = useState<Snack[]>([])
  const [calcOpen, setCalcOpen] = useState(false)

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

      <section className="stat-section">
        <div className="card record-list">
          {byGroup.map(({ group, members }) => (
            <div className="cat-group" key={group.id}>
              <div className="cat-group-label">{group.name}</div>
              {members.map((cat) => (
                <div className="record-row" key={cat.id}>
                  <div className="cat-avatar" style={{ background: 'var(--surface-2)' }}>
                    <BlobFace color={CAT_CREAM} size={30} />
                  </div>
                  <div className="record-info">
                    <div className="record-name">{cat.name}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

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

      {/* 도구 */}
      <section className="stat-section">
        <h2 className="stat-title">도구</h2>
        <div className="card record-list">
          <button className="record-row tool-row" onClick={() => setCalcOpen(true)}>
            <span className="tool-ico">🧮</span>
            <div className="record-info">
              <div className="record-name">용품 최저가 · 몸무게 계산기</div>
              <div className="record-sub muted">직접 만든 계산기를 앱에서 바로</div>
            </div>
            <IconChevronRight size={16} />
          </button>
        </div>
      </section>

      <button
        className="add-cat-btn"
        onClick={() => alert('냥이 추가는 다음 업데이트에서 만들 예정이에요!')}
      >
        + 냥이 추가하기
      </button>

      {/* 계산기 레이어 팝업 */}
      {calcOpen && (
        <div className="sheet-backdrop" onClick={() => setCalcOpen(false)}>
          <div className="sheet calc-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="calc-sheet-head">
              계산기
              <button className="link-btn" onClick={() => setCalcOpen(false)}>닫기</button>
            </div>
            <p className="calc-note">화면이 비어 보이면 네트워크 문제예요. 잠시 후 다시 열어주세요.</p>
            <iframe src={CALC_URL} className="calc-frame" title="용품 최저가 · 몸무게 계산기" />
          </div>
        </div>
      )}
    </div>
  )
}
