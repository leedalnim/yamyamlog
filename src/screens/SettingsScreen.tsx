import { useRef, useState } from 'react'
import type { Settings } from '../data/types'
import {
  backupFileName,
  createBackup,
  parseBackup,
  restoreBackup,
  type BackupFile,
  type BackupSummary,
} from '../data/backup'
import { IconTrash } from '../components/icons'
import { isCloudConfigured } from '../lib/supabase'
import {
  createHousehold,
  joinHousehold,
  leaveHousehold,
  readHousehold,
  readLastSyncedAt,
  syncNow,
  type HouseholdInfo,
} from '../data/sync'
import { useEffect } from 'react'

function formatWhen(ts: number): string {
  if (!ts) return '시각 미상'
  const d = new Date(ts)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

export function SettingsScreen({
  settings,
  onChange,
  onRestored,
  onDataChanged,
}: {
  settings: Settings
  onChange: (patch: Partial<Settings>) => void
  /** 백업 복원 후 — 데이터를 다시 읽고 홈으로 보낸다 */
  onRestored?: () => void
  /** 동기화 후 — 데이터만 다시 읽고 설정 화면에 그대로 머문다 */
  onDataChanged?: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<'export' | 'import' | null>(null)
  const [note, setNote] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [pending, setPending] = useState<{ data: BackupFile; summary: BackupSummary } | null>(null)

  // ── 공유(클라우드) ──────────────────────────────────────────
  const [house, setHouse] = useState<HouseholdInfo | null>(null)
  const [lastSync, setLastSync] = useState<number | null>(null)
  const [cloudBusy, setCloudBusy] = useState<'create' | 'join' | 'sync' | null>(null)
  const [cloudNote, setCloudNote] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [joinCode, setJoinCode] = useState('')

  useEffect(() => {
    void (async () => {
      setHouse(await readHousehold())
      setLastSync(await readLastSyncedAt())
    })()
  }, [])

  async function runSync() {
    setCloudBusy('sync')
    setCloudNote(null)
    const r = await syncNow()
    if (typeof r === 'string') {
      setCloudNote({
        kind: 'err',
        text:
          r === 'offline'
            ? '지금은 연결이 안 돼요. 기록은 이 기기에 그대로 있고, 나중에 자동으로 맞춰집니다.'
            : r === 'no-household'
              ? '먼저 우리집을 만들거나 코드로 참여해주세요.'
              : '클라우드가 아직 설정되지 않았어요.',
      })
    } else {
      setLastSync(r.at)
      setCloudNote({
        kind: 'ok',
        text:
          r.pulled === 0 && r.pushed === 0
            ? '이미 최신이에요.'
            : `받은 것 ${r.pulled}건, 보낸 것 ${r.pushed}건 맞췄어요.`,
      })
      onDataChanged?.()
    }
    setCloudBusy(null)
  }

  async function doCreate() {
    setCloudBusy('create')
    setCloudNote(null)
    try {
      const info = await createHousehold()
      setHouse(info)
      setCloudNote({ kind: 'ok', text: '우리집을 만들었어요. 아래 코드를 상대에게 알려주세요.' })
      await runSync()
    } catch (e) {
      setCloudNote({ kind: 'err', text: (e as Error).message })
      setCloudBusy(null)
    }
  }

  async function doJoin() {
    if (!joinCode.trim()) return
    setCloudBusy('join')
    setCloudNote(null)
    try {
      const info = await joinHousehold(joinCode)
      setHouse(info)
      setJoinCode('')
      setCloudNote({ kind: 'ok', text: '우리집에 참여했어요.' })
      await runSync()
    } catch (e) {
      setCloudNote({ kind: 'err', text: (e as Error).message })
      setCloudBusy(null)
    }
  }

  async function doExport() {
    setBusy('export')
    setNote(null)
    try {
      const backup = await createBackup()
      const name = backupFileName()
      const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' })
      const summary = `기록 ${backup.snacks.length}건, 사진 ${backup.photos.length}장`

      // 아이폰 사파리는 blob 링크 다운로드를 무시하고 파일을 그냥 열어버리는
      // 경우가 있다. 공유 시트를 쓸 수 있으면 그쪽을 먼저 쓴다 —
      // '파일에 저장', 에어드롭, 메신저 등 원하는 곳으로 바로 내보낼 수 있다.
      const file = new File([blob], name, { type: 'application/json' })
      const canShare =
        typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })

      if (canShare) {
        try {
          await navigator.share({ files: [file], title: '얌얌로그 백업' })
          setNote({ kind: 'ok', text: `${summary}을 내보냈어요.` })
          return
        } catch (err) {
          // 사용자가 공유를 취소한 경우엔 조용히 끝낸다
          if ((err as Error)?.name === 'AbortError') return
          // 그 밖의 실패는 아래 다운로드 방식으로 이어서 시도
        }
      }

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = name
      document.body.appendChild(a)
      a.click()
      a.remove()
      // 저장이 시작되기 전에 해제되지 않도록 잠시 뒤 정리
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
      setNote({ kind: 'ok', text: `${summary}을 파일로 저장했어요.` })
    } catch (e) {
      setNote({ kind: 'err', text: '백업을 만들지 못했어요. ' + (e as Error).message })
    } finally {
      setBusy(null)
    }
  }

  async function onPickFile(file: File | undefined) {
    if (!file) return
    setNote(null)
    try {
      const parsed = parseBackup(await file.text())
      setPending(parsed)
    } catch (e) {
      setNote({ kind: 'err', text: (e as Error).message })
    }
  }

  async function confirmRestore() {
    if (!pending) return
    setBusy('import')
    try {
      await restoreBackup(pending.data)
      setNote({
        kind: 'ok',
        text: `기록 ${pending.summary.snacks}건을 되돌렸어요.`,
      })
      setPending(null)
      onRestored?.()
    } catch (e) {
      setNote({ kind: 'err', text: '복원에 실패했어요. ' + (e as Error).message })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="screen">
      <div className="topbar"><h1>설정</h1></div>

      {/* 밝기 */}
      <section className="stat-section">
        <h2 className="stat-title">밝기</h2>
        <div className="seg">
          {(['light', 'dark', 'system'] as const).map((m) => (
            <button
              key={m}
              className={'seg-btn' + (settings.colorMode === m ? ' active' : '')}
              onClick={() => onChange({ colorMode: m })}
            >
              {m === 'light' ? '밝게' : m === 'dark' ? '어둡게' : '시스템'}
            </button>
          ))}
        </div>
      </section>

      {/* 백업 */}
      <section className="stat-section">
        <h2 className="stat-title">백업</h2>
        <div className="card" style={{ padding: 16 }}>
          <p className="muted" style={{ margin: '0 0 14px', fontSize: 13.5, lineHeight: 1.7 }}>
            기록은 이 기기에만 저장돼요. 브라우저 데이터를 지우거나 기기를 바꾸면
            사라지니, 가끔 파일로 빼두세요. <b>사진까지 함께</b> 저장됩니다.
            <br />
            파일 이름이 항상 같아서, 같은 자리에 저장하면 <b>덮어쓰기 한 개</b>로 유지돼요.
          </p>

          <button className="btn btn-primary btn-block" onClick={doExport} disabled={busy !== null}>
            {busy === 'export' ? '백업 만드는 중…' : '백업 파일 내보내기'}
          </button>

          <button
            className="btn btn-block"
            style={{ marginTop: 10 }}
            onClick={() => fileRef.current?.click()}
            disabled={busy !== null}
          >
            백업 파일에서 되돌리기
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              void onPickFile(e.target.files?.[0])
              e.target.value = ''
            }}
          />

          {note && (
            <p
              style={{
                margin: '12px 0 0',
                fontSize: 13,
                lineHeight: 1.6,
                fontWeight: 700,
                color: note.kind === 'ok' ? 'var(--primary)' : 'var(--danger)',
              }}
            >
              {note.text}
            </p>
          )}
        </div>
      </section>

      {/* 공유 */}
      <section className="stat-section">
        <h2 className="stat-title">함께 보기</h2>
        <div className="card" style={{ padding: 16 }}>
          {!isCloudConfigured ? (
            <p className="muted" style={{ margin: 0, fontSize: 13.5, lineHeight: 1.7 }}>
              아직 클라우드가 연결되지 않았어요. 지금은 이 기기에만 기록이 저장됩니다.
            </p>
          ) : house ? (
            <>
              <div className="muted" style={{ fontSize: 12.5, fontWeight: 700 }}>우리집 코드</div>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  margin: '4px 0 10px',
                }}
              >
                {house.code || '—'}
              </div>
              <p className="muted" style={{ margin: '0 0 14px', fontSize: 13, lineHeight: 1.7 }}>
                상대방 폰의 <b>함께 보기</b>에서 이 코드를 넣으면 같은 기록을 보게 돼요.
                <br />
                마지막 동기화: {lastSync ? formatWhen(lastSync) : '아직 없음'}
              </p>
              <button
                className="btn btn-primary btn-block"
                onClick={runSync}
                disabled={cloudBusy !== null}
              >
                {cloudBusy === 'sync' ? '맞추는 중…' : '지금 동기화'}
              </button>
              <button
                className="btn btn-block"
                style={{ marginTop: 10, color: 'var(--muted)' }}
                disabled={cloudBusy !== null}
                onClick={async () => {
                  await leaveHousehold()
                  setHouse(null)
                  setLastSync(null)
                  setCloudNote({
                    kind: 'ok',
                    text: '연결을 끊었어요. 기록은 이 기기에 그대로 있어요.',
                  })
                }}
              >
                연결 끊기
              </button>
            </>
          ) : (
            <>
              <p className="muted" style={{ margin: '0 0 14px', fontSize: 13.5, lineHeight: 1.7 }}>
                두 사람이 <b>같은 기록</b>을 보게 만들어요. 한 사람이 우리집을 만들고,
                나온 코드를 상대가 넣으면 됩니다.
              </p>
              <button
                className="btn btn-primary btn-block"
                onClick={doCreate}
                disabled={cloudBusy !== null}
              >
                {cloudBusy === 'create' ? '만드는 중…' : '우리집 만들기'}
              </button>
              <div className="muted" style={{ fontSize: 12.5, margin: '14px 0 8px', fontWeight: 700 }}>
                이미 코드가 있다면
              </div>
              <input
                className="input"
                placeholder="코드 4자리 입력"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                inputMode="numeric"
                style={{ letterSpacing: '0.3em', fontSize: 20, fontWeight: 800 }}
              />
              <button
                className="btn btn-block"
                style={{ marginTop: 10 }}
                onClick={doJoin}
                disabled={cloudBusy !== null || !joinCode.trim()}
              >
                {cloudBusy === 'join' ? '참여하는 중…' : '코드로 참여하기'}
              </button>
            </>
          )}

          {cloudNote && (
            <p
              style={{
                margin: '12px 0 0',
                fontSize: 13,
                lineHeight: 1.6,
                fontWeight: 700,
                color: cloudNote.kind === 'ok' ? 'var(--primary)' : 'var(--danger)',
              }}
            >
              {cloudNote.text}
            </p>
          )}
        </div>
      </section>

      <div className="app-foot muted">얌얌로그 v0.1 · 콩이 · 나물이 · 탱자 · 유자<br />빌드 {__BUILD_ID__}</div>

      {/* 되돌리기 확인 */}
      {pending && (
        <div className="sheet-backdrop" onClick={() => setPending(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <h2 className="sheet-title">이 백업으로 되돌릴까요?</h2>
            <div className="card" style={{ padding: 14, marginTop: 4 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                {formatWhen(pending.summary.exportedAt)} 백업
              </div>
              <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                기록 {pending.summary.snacks}건 · 냥이 {pending.summary.cats}마리 · 사진{' '}
                {pending.summary.photos}장
              </div>
            </div>
            <p
              style={{
                fontSize: 13,
                lineHeight: 1.6,
                fontWeight: 700,
                color: 'var(--danger)',
                margin: '12px 0 0',
              }}
            >
              <IconTrash size={14} /> 지금 이 기기에 있는 기록은 지워지고 백업 내용으로 바뀝니다.
            </p>
            <div className="sheet-actions">
              <button className="btn" onClick={() => setPending(null)} disabled={busy !== null}>
                취소
              </button>
              <button className="btn btn-primary" onClick={confirmRestore} disabled={busy !== null}>
                {busy === 'import' ? '되돌리는 중…' : '되돌리기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
