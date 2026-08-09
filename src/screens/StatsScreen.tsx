import { useEffect, useMemo, useState } from 'react'
import { CatPaw, useCatsAndGroups, usePhotoURL } from '../components/common'
import type { ReactionLevel, Snack } from '../data/types'
import { REACTION_SCORE } from '../data/types'
import { listSnacks } from '../data/repo'
import { IconChart, ReactionIcon } from '../components/icons'

function formatDate(ts: number): string {
  const d = new Date(ts)
  return `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, '0')}`
}

export function StatsScreen() {
  const { cats } = useCatsAndGroups()
  const [snacks, setSnacks] = useState<Snack[]>([])
  const [catId, setCatId] = useState<string>('')

  useEffect(() => {
    ;(async () => setSnacks(await listSnacks()))()
  }, [])

  // 첫 고양이를 기본 선택
  useEffect(() => {
    if (!catId && cats.length) setCatId(cats[0].id)
  }, [cats, catId])

  const cat = cats.find((c) => c.id === catId)

  // 선택한 냥이의 기록
  const records = useMemo(() => {
    if (!cat) return []
    return snacks
      .filter((s) => s.reactions[cat.id])
      .map((s) => ({ snack: s, level: s.reactions[cat.id] as ReactionLevel }))
  }, [snacks, cat])

  const counts = useMemo(() => {
    let good = 0, ok = 0, bad = 0
    for (const r of records) {
      if (r.level === 'good') good++
      else if (r.level === 'ok') ok++
      else bad++
    }
    return { good, ok, bad, total: records.length }
  }, [records])

  const score = counts.total
    ? Math.round(
        (records.reduce((a, r) => a + REACTION_SCORE[r.level], 0) / counts.total) * 100,
      )
    : 0

  // 선택한 냥이의 베이스 분포 (잘먹음·보통 위주 = 좋아하는 베이스)
  const perBase = useMemo(() => {
    if (!cat) return []
    const map = new Map<string, { sum: number; n: number }>()
    for (const r of records) {
      const base = r.snack.base
      if (!base) continue
      const cur = map.get(base) ?? { sum: 0, n: 0 }
      cur.sum += REACTION_SCORE[r.level]
      cur.n += 1
      map.set(base, cur)
    }
    const total = [...map.values()].reduce((a, v) => a + v.n, 0)
    return [...map.entries()]
      .map(([base, v]) => ({
        base,
        score: Math.round((v.sum / v.n) * 100),
        n: v.n,
        share: total ? v.n / total : 0,
      }))
      .sort((a, b) => b.share - a.share)
  }, [records, cat])

  // 최근 7일 반응 요약
  const week = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
    let good = 0, ok = 0, bad = 0
    for (const r of records) {
      if (r.snack.createdAt < cutoff) continue
      if (r.level === 'good') good++
      else if (r.level === 'ok') ok++
      else bad++
    }
    return { good, ok, bad, total: good + ok + bad }
  }, [records])

  // 좋아하는 간식 TOP 3 (잘먹음 우선, 최신순)
  const top3 = useMemo(
    () =>
      [...records]
        .sort(
          (a, b) =>
            REACTION_SCORE[b.level] - REACTION_SCORE[a.level] ||
            b.snack.createdAt - a.snack.createdAt,
        )
        .filter((r) => r.level === 'good')
        .slice(0, 3),
    [records],
  )

  // 피하는 간식 (안먹음)
  const avoid = useMemo(() => records.filter((r) => r.level === 'bad'), [records])

  const heroComment = !counts.total
    ? '기록이 쌓이면 알려드릴게요'
    : score >= 80
      ? '아주 좋은 편이에요!'
      : score >= 60
        ? '좋은 편이에요!'
        : score >= 40
          ? '보통이에요'
          : '취향이 아닌가 봐요…'

  if (snacks.length === 0) {
    return (
      <div className="screen">
        <div className="topbar"><h1>통계</h1></div>
        <div className="empty">
          <div className="big"><IconChart size={44} /></div>
          기록이 쌓이면
          <br />
          누가 뭘 잘 먹는지 보여드릴게요!
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <div className="topbar"><h1>통계</h1></div>

      {/* 냥이 선택 */}
      <div className="tabs">
        {cats.map((c) => (
          <button
            key={c.id}
            className={'chip-tab cat-chip' + (c.id === catId ? ' active' : '')}
            onClick={() => setCatId(c.id)}
          >
            <CatPaw cat={c} size={15} />
            {c.name}
          </button>
        ))}
      </div>

      {cat && (
        <>
          {/* 히어로 — 기호도 요약 카드 */}
          <div className="stat-hero">
            <div className="stat-hero-info">
              <div className="stat-hero-label">{cat.name}의 기호도</div>
              <div className="stat-hero-num tabular">
                {counts.total ? score : '–'}
                {counts.total > 0 && <span className="stat-hero-unit">점</span>}
              </div>
              <div className="stat-hero-cap">
                {counts.total
                  ? `간식 ${counts.total}개 중 잘먹음 ${counts.good} · 보통 ${counts.ok} · 안먹음 ${counts.bad}`
                  : '아직 기록이 없어요'}
              </div>
              <div className="stat-hero-track">
                <div className="stat-hero-fill" style={{ width: `${Math.max(4, score)}%` }} />
              </div>
              <div className="stat-hero-comment">{heroComment}</div>
            </div>
            <div className="stat-hero-chara">
              <ReactionIcon
                level={score >= 70 ? 'good' : score >= 40 ? 'ok' : counts.total ? 'bad' : 'ok'}
                size={86}
              />
            </div>
          </div>

          {/* 최근 7일 반응 요약 */}
          {week.total > 0 && (
            <section className="stat-section">
              <h2 className="stat-title">최근 7일 반응 요약</h2>
              <div className="card week-card">
                <div className="week-bar">
                  {week.good > 0 && <i style={{ flex: week.good, background: 'var(--primary)' }} />}
                  {week.ok > 0 && <i style={{ flex: week.ok, background: 'var(--ok)' }} />}
                  {week.bad > 0 && <i style={{ flex: week.bad, background: 'var(--bad)' }} />}
                </div>
                <div className="week-cells">
                  <div className="week-cell">
                    <ReactionIcon level="good" size={30} />
                    <span className="week-label">잘먹음</span>
                    <span className="week-count" style={{ color: 'var(--primary)' }}>{week.good}회</span>
                  </div>
                  <div className="week-cell">
                    <ReactionIcon level="ok" size={30} />
                    <span className="week-label">보통</span>
                    <span className="week-count muted">{week.ok}회</span>
                  </div>
                  <div className="week-cell">
                    <ReactionIcon level="bad" size={30} />
                    <span className="week-label">안먹음</span>
                    <span className="week-count muted">{week.bad}회</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 좋아하는 간식 TOP 3 */}
          {top3.length > 0 && (
            <section className="stat-section">
              <h2 className="stat-title">좋아하는 간식 TOP {top3.length}</h2>
              <div className="top3-grid">
                {top3.map((r, i) => (
                  <Top3Card key={r.snack.id} snack={r.snack} rank={i + 1} />
                ))}
              </div>
            </section>
          )}

          {/* 좋아하는 베이스 — 도넛 차트 */}
          {perBase.length > 0 && (
            <section className="stat-section">
              <h2 className="stat-title">{cat.name}가 좋아하는 베이스</h2>
              <div className="card donut-card">
                <Donut data={perBase} />
                <div className="donut-legend">
                  {perBase.map((r, i) => (
                    <div key={r.base} className="donut-leg-row">
                      <i style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                      <span className="donut-leg-name">{r.base}</span>
                      <span className="donut-leg-pct tabular">{Math.round(r.share * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* 피하는 간식 */}
          {avoid.length > 0 && (
            <section className="stat-section">
              <h2 className="stat-title">피하는 간식</h2>
              <div className="card record-list">
                {avoid.map((r) => (
                  <div className="record-row" key={r.snack.id}>
                    <ReactionIcon level="bad" size={26} />
                    <div className="record-info">
                      <div className="record-name">{r.snack.name}</div>
                    </div>
                    <span className="avoid-note">{cat.name}가 안 먹어요</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 기록 리스트 */}
          <section className="stat-section">
            <h2 className="stat-title">{cat.name}의 간식 기록</h2>
            <div className="card record-list">
              {records.length === 0 && (
                <div className="muted" style={{ fontSize: 13.5, padding: '14px 16px' }}>
                  아직 {cat.name} 반응이 기록된 간식이 없어요.
                </div>
              )}
              {records.map((r) => (
                <RecordRow key={r.snack.id} snack={r.snack} level={r.level} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

const DONUT_COLORS = ['#E5B958', '#7FA3D7', '#F49CB1', '#93B98C', '#E1873F', '#C9C2B6']

/** 도넛 차트 — 베이스 분포 */
function Donut({ data }: { data: { base: string; share: number }[] }) {
  const R = 34
  const C = 2 * Math.PI * R
  let acc = 0
  return (
    <svg width={110} height={110} viewBox="0 0 100 100" className="donut">
      {data.map((d, i) => {
        const dash = d.share * C
        const el = (
          <circle
            key={d.base}
            cx="50"
            cy="50"
            r={R}
            fill="none"
            stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
            strokeWidth="16"
            strokeDasharray={`${dash} ${C - dash}`}
            strokeDashoffset={-acc}
            transform="rotate(-90 50 50)"
          />
        )
        acc += dash
        return el
      })}
    </svg>
  )
}

function Top3Card({ snack, rank }: { snack: Snack; rank: number }) {
  const url = usePhotoURL(snack.photoId)
  return (
    <div className="card top3-card">
      <span className={'top3-medal rank-' + rank}>{rank}</span>
      <div className="top3-thumb">
        {url ? <img src={url} alt={snack.name} loading="lazy" /> : <ReactionIcon level="good" size={34} />}
      </div>
      <div className="top3-name">{snack.name}</div>
    </div>
  )
}

function RecordRow({ snack, level }: { snack: Snack; level: ReactionLevel }) {
  const url = usePhotoURL(snack.photoId)
  return (
    <div className="record-row">
      <div className="record-thumb">
        {url ? <img src={url} alt={snack.name} loading="lazy" /> : <ReactionIcon level={level} size={26} />}
      </div>
      <div className="record-info">
        <div className="record-name">{snack.name}</div>
        <div className="record-sub muted">
          {formatDate(snack.createdAt)}
          {snack.base ? ` · ${snack.base}` : ''}
        </div>
      </div>
      <ReactionIcon level={level} size={30} />
    </div>
  )
}
