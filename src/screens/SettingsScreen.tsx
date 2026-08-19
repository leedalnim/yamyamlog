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
}: {
  settings: Settings
  onChange: (patch: Partial<Settings>) => void
  /** 복원 후 화면들이 새 데이터를 다시 읽도록 알린다 */
  onRestored?: () => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<'export' | 'import' | null>(null)
  const [note, setNote] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [pending, setPending] = useState<{ data: BackupFile; summary: BackupSummary } | null>(null)

  async function doExport() {
    setBusy('export')
    setNote(null)
    try {
      const backup = await createBackup()
      const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = backupFileName(backup.exportedAt)
      document.body.appendChild(a)
      a.click()
      a.remove()
      // 사파리에서 저장이 시작되기 전에 해제되지 않도록 잠시 뒤 정리
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
      setNote({
        kind: 'ok',
        text: `기록 ${backup.snacks.length}건, 사진 ${backup.photos.length}장을 파일로 저장했어요.`,
      })
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

      {/* 안내 */}
      <section className="stat-section">
        <h2 className="stat-title">공유 (예정)</h2>
        <div className="card" style={{ padding: 16, fontSize: 14.5, lineHeight: 1.7 }}>
          <p style={{ margin: 0 }} className="muted">
            지금은 이 기기에만 기록이 저장돼요. 다음 단계에서 무료 클라우드(Supabase)를 연결해,
            둘만 아는 코드로 <b>같은 기록을 두 사람이 함께</b> 볼 수 있게 만들 예정이에요.
          </p>
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
