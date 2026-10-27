import { useEffect, useRef, useState } from 'react'
import { useCatsAndGroups, usePhotoURL } from '../components/common'
import { IconCalculator, IconCamera, IconChevronRight, IconPencil, IconTrash } from '../components/icons'
import { compressImage } from '../lib/image'
import catFaceUrl from '../assets/faces/good-white.svg'

/** 냥이별 아바타 원 배경 — 크림색 얼굴과 확실히 구분되는 파스텔 */
const AVATAR_BG = ['#FBCB93', '#F7BFCD', '#B9D8F4', '#C4E4B8', '#DCC8F0', '#F7DC93']
import { dailyKcal } from '../lib/kcal'
import { ageFrom, displayAge, guessBirthday } from '../lib/age'
import { addCat, deleteCat, listCats, savePhoto, updateCat } from '../data/repo'
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
              <CatAvatar cat={cat} bg={AVATAR_BG[i % AVATAR_BG.length]} />
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
          bg={AVATAR_BG[Math.max(0, cats.findIndex((c) => c.id === editing.id)) % AVATAR_BG.length]}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null)
            setCats(await listCats())
          }}
        />
      )}

      {adding && (
        <CatEditSheet
          bg={AVATAR_BG[cats.length % AVATAR_BG.length]}
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
/** 냥이 얼굴 — 사진이 있으면 사진, 없으면 파스텔 원 위 그림 얼굴 */
function CatAvatar({ cat, bg, src, big }: { cat?: Cat; bg: string; src?: string; big?: boolean }) {
  const saved = usePhotoURL(src ? undefined : cat?.photoId)
  const url = src ?? saved
  return (
    <div className={'cat-avatar' + (big ? ' big' : '') + (url ? ' has-photo' : '')} style={{ background: bg }}>
      {url ? <img src={url} alt="" className="cat-avatar-photo" /> : <img src={catFaceUrl} alt="" className="cat-avatar-face" />}
    </div>
  )
}

function CatEditSheet({
  cat,
  bg,
  onClose,
  onSaved,
}: {
  cat?: Cat
  bg: string
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
  // 사진 — 저장을 눌러야 실제로 바뀐다
  const fileRef = useRef<HTMLInputElement>(null)
  const [newPhoto, setNewPhoto] = useState<Blob>()
  const [newPreview, setNewPreview] = useState<string>()
  const [removePhoto, setRemovePhoto] = useState(false)
  const savedUrl = usePhotoURL(cat?.photoId)
  const hasPhoto = !removePhoto && !!(newPreview ?? savedUrl)

  async function pickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // 같은 파일 다시 고를 수 있게
    if (!file) return
    const blob = await compressImage(file)
    if (newPreview) URL.revokeObjectURL(newPreview)
    setNewPhoto(blob)
    setNewPreview(URL.createObjectURL(blob))
    setRemovePhoto(false)
  }
  // 목록에서 빼기: 한 번 누르면 armed, 3초 안에 한 번 더 누르면 뺀다
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 3000)
    return () => clearTimeout(t)
  }, [armed])

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
      const photoId = removePhoto ? undefined : newPhoto ? await savePhoto(newPhoto) : cat?.photoId
      if (cat) {
        await updateCat({
          ...cat,
          name: name.trim() || cat.name,
          weightKg: validWeight ? weightNum : undefined,
          birthday: bd,
          ageYears: bd ? undefined : cat.ageYears,
          photoId,
        })
      } else {
        await addCat({
          name: name.trim(),
          weightKg: validWeight ? weightNum : undefined,
          birthday: bd,
          photoId,
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

        {/* 사진 — 동그라미를 누르면 사진을 넣거나 바꾼다 */}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickPhoto} />
        <div className="cat-photo-pick">
          <button type="button" className="cat-photo-btn" onClick={() => fileRef.current?.click()} aria-label="사진 넣기">
            <CatAvatar bg={bg} src={removePhoto ? undefined : (newPreview ?? savedUrl)} big />
            <span className="cat-photo-cam"><IconCamera size={16} /></span>
          </button>
          {hasPhoto ? (
            <button
              type="button"
              className="cat-photo-remove"
              onClick={() => {
                if (newPreview) URL.revokeObjectURL(newPreview)
                setNewPhoto(undefined)
                setNewPreview(undefined)
                setRemovePhoto(true)
              }}
            >
              사진 빼기
            </button>
          ) : (
            <div className="cat-photo-hint">사진을 눌러 넣어요</div>
          )}
        </div>

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

        {/* 나이·하루 권장 칼로리 — 줄글 대신 숫자가 먼저 보이는 카드 두 장 */}
        <div className="cat-tiles">
          <div className="cat-tile">
            <div className="cat-tile-k">나이</div>
            {computed ? (
              <>
                <div className="cat-tile-v">
                  {computed.years >= 1 ? (
                    <>
                      {computed.years}<small>살</small> {computed.months % 12}<small>개월</small>
                    </>
                  ) : (
                    <>
                      {computed.months}<small>개월</small>
                    </>
                  )}
                </div>
                <div className="cat-tile-s">{birthdayText(birthday)}생</div>
              </>
            ) : (
              <>
                <div className="cat-tile-v none">—</div>
                {/* 정확한 날을 모르는 아이가 많다 — 대충 적어도 된다고 먼저 말해 준다 */}
                <div className={'cat-tile-s' + (badBirthday ? ' bad' : '')}>
                  {badBirthday ? '날짜를 다시 확인해주세요' : '날짜를 몰라도 대략 적으면 돼요'}
                </div>
              </>
            )}
          </div>
          <div className="cat-tile">
            <div className="cat-tile-k">하루 권장 칼로리</div>
            {validWeight ? (
              <>
                <div className="cat-tile-v">
                  {dailyKcal(weightNum)}<small>kcal</small>
                </div>
                <div className="cat-tile-s">{weightNum}kg · 중성화 실내묘 기준</div>
              </>
            ) : (
              <>
                <div className="cat-tile-v none">—</div>
                <div className="cat-tile-s">몸무게를 넣으면 계산해요</div>
              </>
            )}
          </div>
        </div>

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

        {/* 빼기는 수정할 때만. 실수로 빠지지 않게 두 번 눌러야 한다.
            기록의 반응은 그대로 두고 목록에서만 뺀다. */}
        {!isNew && (
          <>
            <button
              className={'cat-del' + (armed ? ' armed' : '')}
              disabled={saving}
              onClick={async () => {
                if (!armed) {
                  setArmed(true)
                  return
                }
                setSaving(true)
                try {
                  await deleteCat(cat.id)
                  onSaved()
                } finally {
                  setSaving(false)
                }
              }}
            >
              <IconTrash size={14} />
              {armed ? '한 번 더 누르면 목록에서 빠져요' : '목록에서 빼기'}
            </button>
            {armed && <div className="cat-del-sub">반응 기록은 그대로 남아요 · 3초 뒤 원래대로</div>}
          </>
        )}
      </div>
    </div>
  )
}

/** '2021-10-01' → '2021년 10월 1일' */
function birthdayText(v: string): string {
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return m ? `${m[1]}년 ${Number(m[2])}월 ${Number(m[3])}일` : v
}
