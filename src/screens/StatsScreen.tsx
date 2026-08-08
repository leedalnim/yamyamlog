import { useEffect, useMemo, useState } from 'react'
import { CatPaw, useCatsAndGroups, usePhotoURL } from '../components/common'
import type { ReactionLevel, Snack } from '../data/types'
import { REACTION_META, REACTION_SCORE } from '../data/types'
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

  // 선택한 냥이의 베이스별 기호성
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
    return [...map.entries()]
      .map(([base, v]) => ({ base, score: Math.round((v.sum / v.n) * 100), n: v.n }))
      .sort((a, b) => b.score - a.score)
  }, [records, cat])

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
            </div>
            <div className="stat-hero-chara">
              <ReactionIcon
                level={score >= 70 ? 'good' : score >= 40 ? 'ok' : counts.total ? 'bad' : 'ok'}
                size={86}
              />
            </div>
          </div>

          {/* 베이스별 (선택 냥이 기준) */}
          {perBase.length > 0 && (
            <section className="stat-section">
              <h2 className="stat-title">{cat.name}가 좋아하는 베이스</h2>
              <div className="card stat-card">
                {perBase.map((r) => (
                  <div key={r.base} className="rank-row">
                    <div className="base-badge">{r.base}</div>
                    <div className="rank-info">
                      <div className="bar-track">
                        <div
                          className="bar-fill"
                          style={{ width: `${Math.max(6, r.score)}%`, background: 'var(--accent-2)' }}
                        />
                      </div>
                    </div>
                    <div className="rank-score tabular" style={{ color: 'var(--accent-2)' }}>{r.score}</div>
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

function RecordRow({ snack, level }: { snack: Snack; level: ReactionLevel }) {
  const url = usePhotoURL(snack.photoId)
  const m = REACTION_META[level]
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
      <span className="react-pill" data-level={level}>
        <ReactionIcon level={level} size={15} />
        {m.short}
      </span>
    </div>
  )
}
