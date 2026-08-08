import { useEffect, useMemo, useState } from 'react'
import { CatPaw, useCatsAndGroups } from '../components/common'
import type { Cat, ReactionLevel, Snack } from '../data/types'
import { REACTION_SCORE } from '../data/types'
import { listSnacks } from '../data/repo'
import { IconChart, IconPaw, IconTag, IconTrophy } from '../components/icons'

export function StatsScreen() {
  const { cats } = useCatsAndGroups()
  const [snacks, setSnacks] = useState<Snack[]>([])

  useEffect(() => {
    ;(async () => setSnacks(await listSnacks()))()
  }, [])

  // ---- 간식 랭킹 (평균 기호성 점수) ----
  const ranking = useMemo(() => {
    return snacks
      .map((s) => {
        const vals = Object.values(s.reactions) as ReactionLevel[]
        const score = vals.length
          ? vals.reduce((a, lv) => a + REACTION_SCORE[lv], 0) / vals.length
          : 0
        return { snack: s, score, count: vals.length }
      })
      .filter((r) => r.count > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
  }, [snacks])

  // ---- 베이스(주재료)별 기호성 ----
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

  // ---- 고양이별 반응 집계 ----
  const perCat = useMemo(() => {
    return cats.map((cat) => {
      let good = 0, ok = 0, bad = 0
      for (const s of snacks) {
        const lv = s.reactions[cat.id]
        if (lv === 'good') good++
        else if (lv === 'ok') ok++
        else if (lv === 'bad') bad++
      }
      return { cat, good, ok, bad, total: good + ok + bad }
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
      <div className="topbar">
        <div>
          <h1>통계</h1>
          <div className="sub">총 {totalRecords}개 간식 기록</div>
        </div>
      </div>

      {/* 간식 랭킹 */}
      <section className="stat-section">
        <h2 className="stat-title"><IconTrophy size={18} />잘 먹는 간식 랭킹</h2>
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
                    <div
                      className="bar-fill"
                      style={{ width: `${Math.max(6, r.score * 100)}%` }}
                    />
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
          <h2 className="stat-title"><IconTag size={18} />베이스(주재료)별 기호성</h2>
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

      {/* 고양이별 선호 */}
      <section className="stat-section">
        <h2 className="stat-title"><IconPaw size={18} />고양이별 반응</h2>
        <div className="cat-stat-grid">
          {perCat.map((p) => (
            <CatStat key={p.cat.id} data={p} />
          ))}
        </div>
      </section>
    </div>
  )
}

function CatStat({
  data,
}: {
  data: { cat: Cat; good: number; ok: number; bad: number; total: number }
}) {
  const { cat, good, ok, bad, total } = data
  const pct = (n: number) => (total ? (n / total) * 100 : 0)
  return (
    <div className="card cat-stat">
      <div className="cat-stat-head">
        <CatPaw cat={cat} size={18} />
        <span className="cat-stat-name">{cat.name}</span>
        <span className="muted tabular" style={{ marginLeft: 'auto', fontSize: 12 }}>{total}건</span>
      </div>
      {total === 0 ? (
        <div className="muted" style={{ fontSize: 12 }}>기록 없음</div>
      ) : (
        <>
          <div className="stack-bar">
            {good > 0 && <div style={{ width: `${pct(good)}%`, background: 'var(--good)' }} />}
            {ok > 0 && <div style={{ width: `${pct(ok)}%`, background: 'var(--ok)' }} />}
            {bad > 0 && <div style={{ width: `${pct(bad)}%`, background: 'var(--bad)' }} />}
          </div>
          <div className="stack-legend">
            <span><i style={{ background: 'var(--good)' }} />잘먹음 {good}</span>
            <span><i style={{ background: 'var(--ok)' }} />보통 {ok}</span>
            <span><i style={{ background: 'var(--bad)' }} />안먹음 {bad}</span>
          </div>
        </>
      )}
    </div>
  )
}
