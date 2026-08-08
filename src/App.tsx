import { useEffect, useState, useCallback } from 'react'
import { DEFAULT_SETTINGS, type Settings } from './data/types'
import { readSettings, writeSettings } from './data/db'
import { ensureSeeded } from './data/repo'
import { FeedScreen } from './screens/FeedScreen'
import { AddScreen } from './screens/AddScreen'
import { StatsScreen } from './screens/StatsScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { IconHome, IconPlus, IconChart, IconSettings, IconPaw } from './components/icons'

type Tab = 'feed' | 'add' | 'stats' | 'settings'

function applyTheme(s: Settings) {
  const root = document.documentElement
  root.dataset.theme = s.theme
  const mode =
    s.colorMode === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : s.colorMode
  root.dataset.mode = mode
}

export default function App() {
  const [ready, setReady] = useState(false)
  const [tab, setTab] = useState<Tab>('feed')
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [dataVersion, setDataVersion] = useState(0)

  const refresh = useCallback(() => setDataVersion((v) => v + 1), [])

  // 초기 로드
  useEffect(() => {
    ;(async () => {
      try {
        await ensureSeeded()
        const saved = await readSettings()
        const s = saved ?? DEFAULT_SETTINGS
        setSettings(s)
        applyTheme(s)
      } catch (err) {
        // 저장소 초기화가 실패해도 앱은 뜨게 한다
        console.error('[얌로그] 초기화 실패, 기본값으로 시작합니다.', err)
        applyTheme(DEFAULT_SETTINGS)
      } finally {
        setReady(true)
      }
    })()
  }, [])

  // 시스템 다크모드 변화 반영
  useEffect(() => {
    if (settings.colorMode !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme(settings)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [settings])

  const updateSettings = useCallback(async (patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      applyTheme(next)
      void writeSettings(next)
      return next
    })
  }, [])

  if (!ready) {
    return (
      <div className="app">
        <div className="empty" style={{ marginTop: '40vh' }}>
          <div className="big" style={{ color: 'var(--primary)' }}><IconPaw size={44} /></div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      {tab === 'feed' && <FeedScreen key={dataVersion} onAdd={() => setTab('add')} onChanged={refresh} />}
      {tab === 'add' && <AddScreen onDone={() => { refresh(); setTab('feed') }} onCancel={() => setTab('feed')} />}
      {tab === 'stats' && <StatsScreen key={dataVersion} />}
      {tab === 'settings' && <SettingsScreen settings={settings} onChange={updateSettings} />}

      <nav className="nav">
        <button className={tab === 'feed' ? 'active' : ''} onClick={() => setTab('feed')}>
          <span className="ico"><IconHome /></span>홈
        </button>
        <button className={tab === 'add' ? 'active' : ''} onClick={() => setTab('add')}>
          <span className="ico"><IconPlus /></span>추가
        </button>
        <button className={tab === 'stats' ? 'active' : ''} onClick={() => setTab('stats')}>
          <span className="ico"><IconChart /></span>통계
        </button>
        <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>
          <span className="ico"><IconSettings /></span>설정
        </button>
      </nav>
    </div>
  )
}
