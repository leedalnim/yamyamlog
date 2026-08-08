import { useEffect, useMemo, useState } from 'react'
import { CatPaw, useCatsAndGroups } from '../components/common'
import type { ReactionLevel, Snack } from '../data/types'
import { REACTION_SCORE } from '../data/types'
import { listSnacks } from '../data/repo'
import { CatDoodle, IconChart, IconPaw, IconTag, IconTrophy } from '../components/icons'

export function StatsScreen() {
  const { cats } = useCatsAndGroups()
  const [snacks, setSnacks] = useState<Snack[]>([])

  useEffect(() => {
    ;(async () => setSnacks(await listSnacks()))()
  }, [])

  const allReactions = useMemo(
    () => snacks.flatMap((s) => Object.values(s.reactions) as ReactionLevel[]),
    [snacks],
  )

  // ---- 전체 기호도 (모든 반응 평균) ----
  const overall = allReactions.length
    ? allReactions.reduce((a, lv) => a + REACTION_SCORE[lv], 0) / allReactions.length
    : 0

  // ---- 간식 랭킹 ----
  const ranking = useMemo(() => {
    return snacks
      .map((s) => {
        const vals = Object.values(s.reactions) as ReactionLevel[]
        const score = vals.length ? vals.reduce((a, lv) => a + REACTION_SCORE[lv], 0) / vals.length : 0
        return { snack: s, score, count: vals.length }
      })
      .filter((r) => r.count > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
  }, [snacks])

  // ---- 베이스별 기호성 ----
  const perBase = useMemo(() => {
    const map = new Map<string, { scoreSum: number; count: number; snacks: number }>()
    for (const s of snacks) {
      if (!s.base) continue
      const vals = Object.values(s.reactions) as ReactionLevel[]
      if (vals.length === 0) continue
      const cur = map.get(s.base) ?? { scoreSum: 0, count: 0, snacks: 0 }
      for (const lv of vals) {
        cur.scoreSum += REACTION_SCORE[lv]
        cur.count += 1
      }
      cur.snacks += 1
      map.set(s.base, cur)
    }
    return [...map.entries()]
      .map(([base, v]) => ({ base, score: v.scoreSum / v.count, snacks: v.snacks }))
      .sort((a, b) => b.score - a.score)
  }, [snacks])

  // ---- 고양이별 기호도 ----
  const perCat = useMemo(() => {
    return cats.map((cat) => {
      let sum = 0, total = 0
      for (const s of snacks) {
        const lv = s.reactions[cat.id]
        if (!lv) continue
        sum += REACTION_SCORE[lv]
        total += 1
      }
      return { cat, score: total ? sum / total : 0, total }
    })
  }, [cats, snacks])

  const totalRecords = snacks.length

  if (totalRecords === 0) {
    return (
      <div className="screen">
        <div className="topbar"><h1>통계</h1></div>
        <div className="empty">
          <div className="big"><IconChart size={44} /></div>
          기록이 쌓이면
          <br />
          누가 뭘 잘 먹는지 그래프로 보여드릴게요!
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <div className="topbar"><h1>통계</h1></div>

      {/* 히어로 지표 */}
      <div className="card hero-card">
        <div className="hero-left">
          <div className="hero-label">우리 냥이들 전체 기호도</div>
          <div className="hero-num tabular">
            {Math.round(overall * 100)}
            <span className="hero-unit">점</span>
          </div>
          <div className="hero-cap muted">간식 {totalRecords}개 · 반응 {allReactions.length}번 기록</div>
        </div>
        <div className="hero-art"><CatDoodle size={78} /></div>
      </div>

      {/* 고양이별 기호도 — 세로 막대 */}
      <section className="stat-section">
        <h2 className="stat-title">
          <span className="ti-badge badge-cat"><IconPaw size={15} /></span>고양이별 기호도
        </h2>
        <div className="card cat-bars">
          {perCat.map((p) => (
            <div className="cbar" key={p.cat.id}>
              <div className="cbar-track">
                <div
                  className="cbar-fill"
                  style={{
                    height: `${p.total ? Math.max(12, p.score * 100) : 4}%`,
                    background: p.total ? p.cat.color : 'var(--line)',
                  }}
                >
                  {p.total > 0 && <span className="cbar-pct">{Math.round(p.score * 100)}</span>}
                </div>
              </div>
              <div className="cbar-name">
                <CatPaw cat={p.cat} size={14} />
                {p.cat.name}
              </div>
              <div className="cbar-sub muted">{p.total ? `${p.total}번` : '–'}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 간식 랭킹 */}
      <section className="stat-section">
        <h2 className="stat-title">
          <span className="ti-badge badge-rank"><IconTrophy size={15} /></span>잘 먹는 간식 랭킹
        </h2>
        <div className="card stat-card">
          {ranking.length === 0 ? (
            <div className="muted" style={{ fontSize: 13 }}>아직 반응이 기록된 간식이 없어요.</div>
          ) : (
            ranking.map((r, i) => (
              <div key={r.snack.id} className="rank-row">
                <div className="rank-num">{i + 1}</div>
                <div className="rank-info">
                  <div className="rank-name">{r.snack.name}</div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${Math.max(6, r.score * 100)}%` }} />
                  </div>
                </div>
                <div className="rank-score tabular">{Math.round(r.score * 100)}</div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 베이스별 기호성 */}
      {perBase.length > 0 && (
        <section className="stat-section">
          <h2 className="stat-title">
            <span className="ti-badge badge-base"><IconTag size={15} /></span>베이스(주재료)별 기호성
          </h2>
          <div className="card stat-card">
            {perBase.map((r) => (
              <div key={r.base} className="rank-row">
                <div className="base-badge">{r.base}</div>
                <div className="rank-info">
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ width: `${Math.max(6, r.score * 100)}%`, background: 'var(--accent-2)' }}
                    />
                  </div>
                  <div className="base-sub muted">간식 {r.snacks}종</div>
                </div>
                <div className="rank-score tabular" style={{ color: 'var(--accent-2)' }}>
                  {Math.round(r.score * 100)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
