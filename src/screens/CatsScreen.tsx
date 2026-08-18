import { useEffect, useMemo, useState } from 'react'
import { useCatsAndGroups } from '../components/common'
import { BlobFace, CAT_CREAM, IconCalculator, IconChevronRight, IconPencil } from '../components/icons'

/** 냥이별 아바타 원 배경 — 크림색 얼굴과 확실히 구분되는 파스텔 */
const AVATAR_BG = ['#FBCB93', '#F7BFCD', '#B9D8F4', '#C4E4B8', '#DCC8F0', '#F7DC93']
import { listCats, listSnacks, updateCat } from '../data/repo'
import type { Cat, Snack } from '../data/types'

const CALC_URL = 'https://leedalnim.github.io/pet-food-calc/'

/** 몸무게 기반 하루 권장 칼로리 (RER = 70 × kg^0.75) */
function dailyKcal(weightKg: number): number {
  return Math.round(70 * Math.pow(weightKg, 0.75))
}

export function CatsScreen() {
  const { cats: initialCats } = useCatsAndGroups()
  const [cats, setCats] = useState<Cat[]>([])
  const [snacks, setSnacks] = useState<Snack[]>([])
  const [calcOpen, setCalcOpen] = useState(false)
  const [editing, setEditing] = useState<Cat | null>(null)

  useEffect(() => {
    ;(async () => setSnacks(await listSnacks()))()
  }, [])
  useEffect(() => {
    setCats(initialCats)
  }, [initialCats])

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
          {cats.map((cat, i) => (
            <button className="record-row cat-row" key={cat.id} onClick={() => setEditing(cat)}>
              <div className="cat-avatar" style={{ background: AVATAR_BG[i % AVATAR_BG.length] }}>
                <BlobFace color={CAT_CREAM} size={30} />
              </div>
              <div className="record-info">
                <div className="record-name">{cat.name}</div>
                {(cat.ageYears != null || cat.weightKg != null) && (
                  <div className="record-sub muted">
                    {[
                      cat.ageYears != null ? `${cat.ageYears}살` : null,
                      cat.weightKg != null ? `${cat.weightKg}kg` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                )}
              </div>
              {cat.weightKg != null && (
                <span className="cat-kcal muted">하루 {dailyKcal(cat.weightKg)}kcal</span>
              )}
              <span className="cat-row-edit"><IconPencil size={15} /></span>
            </button>
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
            <span className="tool-ico"><IconCalculator size={22} /></span>
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

      {/* 냥이 정보 수정 */}
      {editing && (
        <CatEditSheet
          cat={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null)
            setCats(await listCats())
          }}
        />
      )}

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

function CatEditSheet({
  cat,
  onClose,
  onSaved,
}: {
  cat: Cat
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(cat.name)
  const [weight, setWeight] = useState(cat.weightKg != null ? String(cat.weightKg) : '')
  const [age, setAge] = useState(cat.ageYears != null ? String(cat.ageYears) : '')
  const [saving, setSaving] = useState(false)

  const weightNum = Number(weight)
  const ageNum = Number(age)
  const validWeight = weight.trim() !== '' && !Number.isNaN(weightNum) && weightNum > 0
  const validAge = age.trim() !== '' && !Number.isNaN(ageNum) && ageNum >= 0

  async function save() {
    setSaving(true)
    try {
      await updateCat({
        ...cat,
        name: name.trim() || cat.name,
        weightKg: validWeight ? weightNum : undefined,
        ageYears: validAge ? ageNum : undefined,
      })
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2 className="sheet-title">{cat.name} 정보</h2>

        <div className="field">
          <label>이름</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="cat-edit-row">
          <div className="field">
            <label>나이 (살)</label>
            <input
              className="input"
              type="number"
              inputMode="decimal"
              step="0.5"
              min="0"
              placeholder="예: 5"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </div>
          <div className="field">
            <label>몸무게 (kg)</label>
            <input
              className="input"
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              placeholder="예: 3.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
        </div>

        {validWeight && (
          <p className="cat-edit-hint muted">
            하루 권장 칼로리 약 <b>{dailyKcal(weightNum)}kcal</b> (중성화한 실내묘 기준)
          </p>
        )}

        <div className="sheet-actions">
          <button className="btn" style={{ flex: 1 }} onClick={onClose}>취소</button>
          <button className="btn btn-primary" style={{ flex: 2 }} disabled={saving} onClick={save}>
            {saving ? '저장중…' : '저장하기'}
          </button>
        </div>
      </div>
    </div>
  )
}
