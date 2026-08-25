import { useEffect, useState } from 'react'
import { useCatsAndGroups } from '../components/common'
import { IconCalculator, IconChevronRight, IconPencil, IconTrash } from '../components/icons'
import catFaceUrl from '../assets/faces/good-white.svg'

/** 냥이별 아바타 원 배경 — 크림색 얼굴과 확실히 구분되는 파스텔 */
const AVATAR_BG = ['#FBCB93', '#F7BFCD', '#B9D8F4', '#C4E4B8', '#DCC8F0', '#F7DC93']
import { dailyKcal } from '../lib/kcal'
import { ageFrom, displayAge, guessBirthday } from '../lib/age'
import { addCat, deleteCat, listCats, updateCat } from '../data/repo'
import type { Cat } from '../data/types'
import { useBackGuard } from '../lib/useBackGuard'

const CALC_URL = 'https://leedalnim.github.io/pet-food-calc/'

export function CatsScreen() {
  const { cats: initialCats } = useCatsAndGroups()
  const [cats, setCats] = useState<Cat[]>([])
  const [editing, setEditing] = useState<Cat | null>(null)
  // 'new' 면 추가 시트, Cat 이면 수정 시트
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    setCats(initialCats)
  }, [initialCats])

  useBackGuard(!!editing, () => setEditing(null))
  useBackGuard(adding, () => setAdding(false))

  return (
    <div className="screen">
      <div className="topbar"><h1>우리 냥이들</h1></div>

      <section className="stat-section">
        <div className="card record-list">
          {cats.map((cat, i) => (
            <button className="record-row cat-row" key={cat.id} onClick={() => setEditing(cat)}>
              <div className="cat-avatar" style={{ background: AVATAR_BG[i % AVATAR_BG.length] }}>
                <img src={catFaceUrl} alt="" className="cat-avatar-face" />
              </div>
              <div className="record-info">
                <div className="record-name">{cat.name}</div>
                {(displayAge(cat) || cat.weightKg != null) && (
                  <div className="record-sub muted">
                    {[displayAge(cat), cat.weightKg != null ? `${cat.weightKg}kg` : null]
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

      <button
        className="add-cat-btn"
        onClick={() => setAdding(true)}
      >
        + 냥이 추가하기
      </button>

      {/* 도구 */}
      <section className="stat-section">
        <h2 className="stat-title">도구</h2>
        <div className="card record-list">
          {/*
            예전에는 앱 안에 iframe 으로 띄웠는데, 사파리에서 빈 화면이 되는
            일이 잦았고 모래·건식 얘기라 이 앱과는 다른 일이다. 새 창으로 연다.
          */}
          <a
            className="record-row tool-row"
            href={CALC_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="tool-ico"><IconCalculator size={22} /></span>
            <div className="record-info">
              <div className="record-name">용품 최저가 · 몸무게 계산기</div>
              <div className="record-sub muted">새 창에서 열려요</div>
            </div>
            <IconChevronRight size={16} />
          </a>
        </div>
      </section>



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

      {adding && (
        <CatEditSheet
          onClose={() => setAdding(false)}
          onSaved={async () => {
            setAdding(false)
            setCats(await listCats())
          }}
        />
      )}

    </div>
  )
}

/** cat 이 없으면 '추가', 있으면 '수정' */
function CatEditSheet({
  cat,
  onClose,
  onSaved,
}: {
  cat?: Cat
  onClose: () => void
  onSaved: () => void
}) {
  const isNew = !cat
  const [name, setName] = useState(cat?.name ?? '')
  const [weight, setWeight] = useState(cat?.weightKg != null ? String(cat.weightKg) : '')
  // 생년월일이 없고 예전에 적어 둔 나이만 있으면, 그 나이로 어림한 날짜를
  // 미리 채워 준다. 그대로 저장해도 예전과 같은 나이가 나오고, 아는 사람은
  // 실제 날짜로 고치면 된다.
  const [birthday, setBirthday] = useState(
    cat?.birthday ?? (cat?.ageYears != null ? guessBirthday(cat.ageYears) : ''),
  )
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const weightNum = Number(weight)
  const validWeight = weight.trim() !== '' && !Number.isNaN(weightNum) && weightNum > 0
  const computed = ageFrom(birthday)
  const badBirthday = birthday.trim() !== '' && !computed

  async function save() {
    setSaving(true)
    try {
      // 생년월일이 있으면 나이는 거기서 계산하므로 적어 둔 나이는 지운다.
      // 둘 다 남으면 어느 쪽이 맞는지 알 수 없게 된다.
      const bd = computed ? birthday.trim() : undefined
      if (cat) {
        await updateCat({
          ...cat,
          name: name.trim() || cat.name,
          weightKg: validWeight ? weightNum : undefined,
          birthday: bd,
          ageYears: bd ? undefined : cat.ageYears,
        })
      } else {
        await addCat({
          name: name.trim(),
          weightKg: validWeight ? weightNum : undefined,
          birthday: bd,
        })
      }
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2 className="sheet-title">{isNew ? '냥이 추가' : `${cat.name} 정보`}</h2>

        <div className="field">
          <label>이름</label>
          <input
            className="input"
            autoFocus={isNew}
            placeholder="예: 탱자"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="cat-edit-row">
          <div className="field">
            <label>생년월일</label>
            <input
              className="input"
              type="date"
              max={new Date().toISOString().slice(0, 10)}
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
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

        {/* 정확한 날을 모르는 아이가 많다 — 대충 적어도 된다고 먼저 말해 준다 */}
        <p className="cat-edit-hint muted">
          {computed ? (
            <>
              지금 <b>{computed.long}</b>이에요. 나이는 생년월일에서 계산해요.
            </>
          ) : badBirthday ? (
            '날짜를 다시 확인해주세요.'
          ) : (
            '정확한 날짜를 몰라도 괜찮아요. 대략 이맘때로 적어두면 나이가 알아서 올라가요.'
          )}
        </p>

        {validWeight && (
          <p className="cat-edit-hint muted">
            하루 권장 칼로리 약 <b>{dailyKcal(weightNum)}kcal</b> (중성화한 실내묘 기준)
          </p>
        )}

        <div className="sheet-actions">
          <button className="btn" style={{ flex: 1 }} onClick={onClose}>취소</button>
          <button
            className="btn btn-primary"
            style={{ flex: 2 }}
            disabled={saving || (isNew && !name.trim())}
            onClick={save}
          >
            {saving ? '저장중…' : isNew ? '추가하기' : '저장하기'}
          </button>
        </div>

        {/* 삭제는 수정할 때만. 기록의 반응은 그대로 두고 목록에서만 뺀다. */}
        {!isNew && (
          confirmDelete ? (
            // 취소는 위 시트 버튼이 이미 맡고 있으므로 여기서는 '빼기'만 둔다.
            <div className="cat-delete-confirm">
              <p>
                <b>{cat.name}</b>를 목록에서 뺄까요?
                <br />
                지금까지의 반응 기록은 그대로 남아요.
              </p>
              <button
                className="btn cat-delete-go"
                disabled={saving}
                onClick={async () => {
                  setSaving(true)
                  try {
                    await deleteCat(cat.id)
                    onSaved()
                  } finally {
                    setSaving(false)
                  }
                }}
              >
                빼기
              </button>
            </div>
          ) : (
            <button
              className="btn btn-icon btn-block"
              style={{ marginTop: 10, color: 'var(--muted)' }}
              onClick={() => setConfirmDelete(true)}
            >
              <IconTrash size={16} />
              목록에서 빼기
            </button>
          )
        )}
      </div>
    </div>
  )
}
