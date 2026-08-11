import type { Settings } from '../data/types'

export function SettingsScreen({
  settings,
  onChange,
}: {
  settings: Settings
  onChange: (patch: Partial<Settings>) => void
}) {
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

      <div className="app-foot muted">얌얌로그 v0.1 · 콩이 · 나물이 · 탱자 · 유자</div>
    </div>
  )
}
