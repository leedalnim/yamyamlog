import { useEffect, useState, useCallback } from 'react'
import { DEFAULT_SETTINGS, type Settings } from './data/types'
import { readSettings, writeSettings } from './data/db'
import { ensureSeeded } from './data/repo'
import { FeedScreen } from './screens/FeedScreen'
import { AddScreen } from './screens/AddScreen'
import { StatsScreen } from './screens/StatsScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { CatsScreen } from './screens/CatsScreen'
import { IconHome, IconPlus, IconChart, IconSettings, IconPaw, IconCatFace } from './components/icons'

type Tab = 'feed' | 'add' | 'stats' | 'cats' | 'settings'

function applyTheme(s: Settings) {
  const root = document.documentElement
  root.dataset.theme = 'doodle'
  const mode =
    s.colorMode === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : s.colorMode
  root.dataset.mode = mode
}

export default function App({ onApplyUpdate }: { onApplyUpdate?: () => void }) {
  const [ready, setReady] = useState(false)
  const [tab, setTab] = useState<Tab>('feed')
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [dataVersion, setDataVersion] = useState(0)

  const refresh = useCallback(() => setDataVersion((v) => v + 1), [])

  // 초기 로드
  useEffect(() => {
    // 무슨 일이 있어도 화면은 뜨게 하는 안전 타임아웃
    const safety = setTimeout(() => {
      applyTheme(DEFAULT_SETTINGS)
      setReady(true)
    }, 3500)
    ;(async () => {
      try {
        await ensureSeeded()
        const saved = await readSettings()
        const s = saved ?? DEFAULT_SETTINGS
        setSettings(s)
        applyTheme(s)
      } catch (err) {
        console.error('[얌얌로그] 초기화 실패, 기본값으로 시작합니다.', err)
        applyTheme(DEFAULT_SETTINGS)
      } finally {
        clearTimeout(safety)
        setReady(true)
      }
    })()
    return () => clearTimeout(safety)
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
      {onApplyUpdate && (
        <div className="update-bar">
          새 버전이 준비됐어요
          <button className="update-btn" onClick={onApplyUpdate}>업데이트</button>
        </div>
      )}
      {tab === 'feed' && <FeedScreen onAdd={() => setTab('add')} onChanged={refresh} />}
      {tab === 'add' && <AddScreen onDone={() => { refresh(); setTab('feed') }} onCancel={() => setTab('feed')} />}
      {tab === 'stats' && <StatsScreen key={dataVersion} onAdd={() => setTab('add')} />}
      {tab === 'cats' && <CatsScreen />}
      {tab === 'settings' && (
        <SettingsScreen
          settings={settings}
          onChange={updateSettings}
          onRestored={() => {
            refresh()
            setTab('feed')
          }}
        />
      )}

      <nav className="nav">
        <div className="nav-side">
          <button className={'nav-tab' + (tab === 'feed' ? ' active' : '')} onClick={() => setTab('feed')}>
            <span className="ico"><IconHome /></span>홈
          </button>
          <button className={'nav-tab' + (tab === 'stats' ? ' active' : '')} onClick={() => setTab('stats')}>
            <span className="ico"><IconChart /></span>통계
          </button>
        </div>
        <button
          className={'nav-fab' + (tab === 'add' ? ' active' : '')}
          onClick={() => setTab('add')}
          aria-label="간식 기록 추가"
        >
          <IconPlus size={28} />
        </button>
        <div className="nav-side">
          <button className={'nav-tab' + (tab === 'cats' ? ' active' : '')} onClick={() => setTab('cats')}>
            <span className="ico"><IconCatFace /></span>냥이들
          </button>
          <button className={'nav-tab' + (tab === 'settings' ? ' active' : '')} onClick={() => setTab('settings')}>
            <span className="ico"><IconSettings /></span>설정
          </button>
        </div>
      </nav>
    </div>
  )
}
