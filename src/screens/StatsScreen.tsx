import { useEffect, useMemo, useState } from 'react'
import { useCatsAndGroups, usePhotoURL } from '../components/common'
import type { ReactionLevel, Snack } from '../data/types'
import { REACTION_META, REACTION_SCORE } from '../data/types'
import { listSnacks } from '../data/repo'
import { SnackDetail } from './FeedScreen'
import { useBackGuard } from '../lib/useBackGuard'
import { splitBase } from '../lib/base'
import { shortDate } from '../lib/date'
import { IconChart, IconHeart, IconPencil, ReactionIcon } from '../components/icons'
import heroUrl from '../assets/cat-cushion.png'
import roomBgUrl from '../assets/room-bg.jpg'
import noPhotoUrl from '../assets/no-photo.svg'
import rank1Url from '../assets/badges/rank1.png'
import rank2Url from '../assets/badges/rank2.png'
import rank3Url from '../assets/badges/rank3.png'

const RANK_BADGES = [rank1Url, rank2Url, rank3Url]



export function StatsScreen({ onAdd }: { onAdd?: () => void }) {
  const { cats } = useCatsAndGroups()
  const [snacks, setSnacks] = useState<Snack[]>([])
  const [catId, setCatId] = useState<string>('')
  // 통계에서 바로 기록을 열어볼 수 있게 — 홈으로 돌아갈 필요가 없다
  const [viewing, setViewing] = useState<Snack | null>(null)
  // 기록 목록의 기호성 필터 ('' = 전체)
  const [levelFilter, setLevelFilter] = useState<'' | ReactionLevel>('')
  // 기록 목록은 쌓일수록 끝없이 길어진다 — 처음엔 몇 개만
  const [showAllRecords, setShowAllRecords] = useState(false)
  // 원료가 여럿이 되면서 범례가 길어졌다 — 기본은 상위 몇 개만
  const [allBases, setAllBases] = useState(false)

  async function reload() {
    setSnacks(await listSnacks())
  }

  useBackGuard(!!viewing, () => setViewing(null))

  useEffect(() => {
    ;(async () => setSnacks(await listSnacks()))()
  }, [])

  // 첫 고양이를 기본 선택
  useEffect(() => {
    if (!catId && cats.length) setCatId(cats[0].id)
  }, [cats, catId])

  // 냥이를 바꾸면 필터를 푼다 — 그 아이에겐 그 반응이 하나도 없어서
  // 빈 목록만 보이면 고장난 것처럼 느껴진다
  useEffect(() => {
    setLevelFilter('')
  }, [catId])

  // 보는 대상이 바뀌면 다시 처음 몇 개부터
  useEffect(() => {
    setShowAllRecords(false)
  }, [catId, levelFilter])

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

  // 가장 좋아하는 원료 = '잘 먹음'이 가장 많은 원료.
  // 도넛처럼 기록 개수로만 세면 안 먹은 원료도 올라올 수 있어서 반응을 가려 센다.
  // 같으면 그 원료가 들어간 기록 중 잘 먹은 비율이 높은 쪽.
  const favBase = useMemo(() => {
    const m = new Map<string, { good: number; all: number }>()
    for (const r of records) {
      for (const b of splitBase(r.snack.base)) {
        const cur = m.get(b) ?? { good: 0, all: 0 }
        cur.all += 1
        if (r.level === 'good') cur.good += 1
        m.set(b, cur)
      }
    }
    let best: string | null = null
    let bg = 0, br = 0
    for (const [b, v] of m) {
      if (v.good === 0) continue
      const rate = v.good / v.all
      if (v.good > bg || (v.good === bg && rate > br)) { best = b; bg = v.good; br = rate }
    }
    return best
  }, [records])

  // 선택한 냥이의 베이스 분포 (잘먹음·보통 위주 = 좋아하는 베이스)
  const perBase = useMemo(() => {
    if (!cat) return []
    const map = new Map<string, { sum: number; n: number }>()
    for (const r of records) {
      // 원료가 여럿이면 각각에 한 번씩 센다 (칠면조+연어 → 둘 다)
      for (const base of splitBase(r.snack.base)) {
        const cur = map.get(base) ?? { sum: 0, n: 0 }
        cur.sum += REACTION_SCORE[r.level]
        cur.n += 1
        map.set(base, cur)
      }
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

  // 좋아하는 것 TOP 3 (잘먹음 우선, 최신순)
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

  // 피하는 것 (안먹음)
  const avoid = useMemo(() => records.filter((r) => r.level === 'bad'), [records])

  // 도넛은 조각이 많아질수록 읽기 어려워진다. 상위 5개만 두고 나머지는
  // '기타' 한 조각으로 묶는다. 차트와 범례가 같은 데이터를 봐야 하므로
  // 여기서 한 번에 만든다.
  const TOP_BASES = 5
  const donutData = useMemo<Slice[]>(() => {
    if (allBases || perBase.length <= TOP_BASES + 1) return perBase
    const head = perBase.slice(0, TOP_BASES)
    const rest = perBase.slice(TOP_BASES)
    return [
      ...head,
      {
        base: `기타 ${rest.length}가지`,
        score: 0,
        n: rest.reduce((a, r) => a + r.n, 0),
        share: rest.reduce((a, r) => a + r.share, 0),
        rest: true,
      },
    ]
  }, [perBase, allBases])

  const foldedCount = perBase.length - TOP_BASES

  const shownRecords = useMemo(
    () => (levelFilter ? records.filter((r) => r.level === levelFilter) : records),
    [records, levelFilter],
  )

  // 기록을 열어보는 중이면 상세 화면을 그대로 보여준다 (홈과 같은 화면)
  if (viewing) {
    return (
      <SnackDetail
        snack={viewing}
        cats={cats}
        onBack={() => setViewing(null)}
        onSaved={async (updated) => {
          setViewing(updated)
          await reload()
        }}
        onDeleted={async () => {
          setViewing(null)
          await reload()
        }}
      />
    )
  }

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
            {c.name}
          </button>
        ))}
      </div>

      {cat && (
        <>
          {/* 히어로 — 냥이 장면 + 오늘 상태 패널 (가이드 구조) */}
          <div className="stat-hero" style={{ backgroundImage: `url(${roomBgUrl})` }}>
            <div className="stat-hero-scene">
              <img src={heroUrl} alt="" className="hero-img" />
            </div>
            <div className="stat-hero-panel">
              {/* 제목('탱자의 요즘 상태')은 뺐다 — 위 탭이 이미 누구인지 말해 주고,
                  기록이 기간 단위로 쌓이는 게 아니라 '요즘'이라 부를 근거도 없다 */}
              <div className="panel-fav">
                <span className="panel-fav-k">가장 좋아하는 원료</span>
                {favBase ? (
                  <span className="panel-fav-v">{favBase}</span>
                ) : (
                  <span className="panel-fav-v empty">아직 없어요</span>
                )}
              </div>
              <div className="panel-row">
                <ReactionIcon level="good" size={20} />
                잘먹음 <b className="tabular">{counts.good}개</b>
              </div>
              <div className="panel-row">
                <ReactionIcon level="ok" size={20} />
                보통 <b className="tabular">{counts.ok}개</b>
              </div>
              <div className="panel-row">
                <ReactionIcon level="bad" size={20} />
                안먹음 <b className="tabular">{counts.bad}개</b>
              </div>
              {onAdd && (
                <button className="panel-btn" onClick={onAdd}><IconPencil size={15} /> 기록 남기기</button>
              )}
            </div>
          </div>

          {/* 좋아하는 것 TOP 3 */}
          {top3.length > 0 && (
            <section className="stat-section">
              <h2 className="stat-title">좋아하는 것 TOP {top3.length}</h2>
              <div className="top3-grid">
                {top3.map((r, i) => (
                  <Top3Card
                    key={r.snack.id}
                    snack={r.snack}
                    rank={i + 1}
                    onOpen={() => setViewing(r.snack)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* 좋아하는 베이스 — 도넛 차트 */}
          {perBase.length > 0 && (
            <section className="stat-section">
              <h2 className="stat-title">{cat.name}가 좋아하는 원료</h2>
              <div className="card donut-card">
                <Donut data={donutData} />
                <div className="donut-legend">
                  {donutData.map((r, i) => (
                    <div key={r.base} className="donut-leg-row">
                      <i style={{ background: sliceColor(r, i) }} />
                      <span className="donut-leg-name">{r.base}</span>
                      <span className="donut-leg-pct tabular">{Math.round(r.share * 100)}%</span>
                    </div>
                  ))}
                  {foldedCount > 1 && (
                    <button className="donut-more" onClick={() => setAllBases((v) => !v)}>
                      {allBases ? '접기' : `${foldedCount}가지 더 보기`}
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* 피하는 것 */}
          {avoid.length > 0 && (
            <section className="stat-section">
              <h2 className="stat-title">피하는 것</h2>
              <div className="card record-list">
                {avoid.map((r) => (
                  <button
                    className="record-row"
                    key={r.snack.id}
                    onClick={() => setViewing(r.snack)}
                  >
                    <ReactionIcon level="bad" size={26} />
                    <div className="record-info">
                      <div className="record-name">{r.snack.name}</div>
                    </div>
                    <span className="avoid-note"><IconHeart size={13} /> {cat.name}가 안 먹어요</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* 기록 리스트 */}
          <section className="stat-section" id="record-list-sec">
            {/* 제목과 필터를 한 줄에 — 목록 위 공간을 줄이 두 개나 먹지 않게 */}
            <div className="stat-title-row">
              <h2 className="stat-title">{cat.name}의 기록</h2>
              {/* 개수를 같이 보여줘야 누르기 전에 몇 개인지 감이 온다 */}
              {records.length > 0 && (
              <div className="rx-filter">
                {([
                  ['', '전체', counts.total],
                  ['good', REACTION_META.good.label, counts.good],
                  ['ok', REACTION_META.ok.label, counts.ok],
                  ['bad', REACTION_META.bad.label, counts.bad],
                ] as const).map(([lv, text, n]) => (
                  <button
                    key={lv || 'all'}
                    className={'rx-chip' + (levelFilter === lv ? ' on' : '')}
                    data-level={lv || undefined}
                    onClick={() => setLevelFilter(lv as '' | ReactionLevel)}
                  >
                    {text} <i>{n}</i>
                  </button>
                ))}
              </div>
              )}
            </div>

            <div className="card record-list">
              {records.length === 0 ? (
                <div className="muted" style={{ fontSize: 13.5, padding: '14px 16px' }}>
                  아직 {cat.name} 반응이 기록된 게 없어요.
                </div>
              ) : shownRecords.length === 0 ? (
                <div className="muted" style={{ fontSize: 13.5, padding: '14px 16px' }}>
                  {levelFilter ? REACTION_META[levelFilter].label : ''}으로 기록된 게 없어요.
                </div>
              ) : null}
              {(showAllRecords ? shownRecords : shownRecords.slice(0, RECORDS_PREVIEW)).map((r) => (
                <RecordRow
                  key={r.snack.id}
                  snack={r.snack}
                  level={r.level}
                  onOpen={() => setViewing(r.snack)}
                />
              ))}
              {shownRecords.length > RECORDS_PREVIEW && (
                <button className="records-more" onClick={() => setShowAllRecords((v) => !v)}>
                  {showAllRecords ? '접기' : `${shownRecords.length - RECORDS_PREVIEW}개 더 보기`}
                </button>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

/** 기록 목록을 처음에 몇 개까지 보여줄지 */
const RECORDS_PREVIEW = 5

const DONUT_COLORS = ['#7FB3E8', '#FBC15E', '#F9A8C4', '#DCD8D3', '#FA7F38', '#F2BC57']
/** 묶어 놓은 '기타' 는 재료 하나가 아니므로 색을 주지 않는다 (무채색) */
const REST_COLOR = '#c9c3bb'

/** 도넛 한 조각 = 원료 하나, 또는 나머지를 묶은 '기타' */
type Slice = { base: string; score: number; n: number; share: number; rest?: boolean }

const sliceColor = (d: Slice, i: number) =>
  d.rest ? REST_COLOR : DONUT_COLORS[i % DONUT_COLORS.length]

/** 도넛 차트 — 베이스 분포 */
function Donut({ data }: { data: Slice[] }) {
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
            stroke={sliceColor(d, i)}
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

function Top3Card({
  snack,
  rank,
  onOpen,
}: {
  snack: Snack
  rank: number
  onOpen: () => void
}) {
  const url = usePhotoURL(snack.photoId)
  return (
    <button className="card top3-card" onClick={onOpen}>
      <img src={RANK_BADGES[rank - 1] ?? rank3Url} alt={rank + "위"} className="top3-medal" />
      <div className="top3-thumb">
        {url ? <img src={url} alt={snack.name} loading="lazy" /> : <img src={noPhotoUrl} alt="" className="no-photo" />}
      </div>
      <div className="top3-name">{snack.name}</div>
      <span className="top3-love"><IconHeart size={12} /> 좋아해요</span>
    </button>
  )
}

function RecordRow({
  snack,
  level,
  onOpen,
}: {
  snack: Snack
  level: ReactionLevel
  onOpen: () => void
}) {
  const url = usePhotoURL(snack.photoId)
  return (
    <button className="record-row" onClick={onOpen}>
      <div className="record-thumb">
        {url ? <img src={url} alt={snack.name} loading="lazy" /> : <img src={noPhotoUrl} alt="" className="no-photo" />}
      </div>
      <div className="record-info">
        <div className="record-name">{snack.name}</div>
        <div className="record-sub muted">
          {shortDate(snack.createdAt)}
          {splitBase(snack.base).map((b) => ` · ${b}`).join('')}
        </div>
      </div>
      {/* 얼굴만으로는 표정을 구별하기 어렵다 — 글자를 같이 둔다 */}
      <span className="rx-tag" data-level={level}>{REACTION_META[level].label}</span>
      <ReactionIcon level={level} size={30} />
    </button>
  )
}
