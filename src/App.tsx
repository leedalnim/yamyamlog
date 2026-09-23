import { useEffect, useState, useCallback } from 'react'
import { DEFAULT_SETTINGS, type Settings } from './data/types'
import { readSettings, writeSettings } from './data/db'
import { ensureSeeded } from './data/repo'
import { readLastSyncedAt, syncNow } from './data/sync'
import { FeedScreen } from './screens/FeedScreen'
import { AddScreen } from './screens/AddScreen'
import { StatsScreen } from './screens/StatsScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { CatsScreen } from './screens/CatsScreen'
import { IconHome, IconPlus, IconChart, IconSettings, IconPaw, IconCatFace } from './components/icons'
import { useBackGuard } from './lib/useBackGuard'

/** 이만큼 넘게 서버에 못 닿으면 홈에 알린다 */
const SYNC_STUCK_DAYS = 3

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
  // 서버에 며칠째 못 닿고 있을 때만 홈에 알린다. 한두 번 실패는 흔하고
  // 다음에 알아서 맞춰지므로 조용히 넘긴다. days: 마지막으로 맞춘 뒤 지난 날 (null = 한 번도 못 맞춤)
  const [syncStuck, setSyncStuck] = useState<{ days: number | null } | null>(null)
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [dataVersion, setDataVersion] = useState(0)

  const refresh = useCallback(() => setDataVersion((v) => v + 1), [])

  // 기록 추가 화면도 뒤로 제스처로 닫히게
  useBackGuard(tab === 'add', useCallback(() => setTab('feed'), []))

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

  // 앱을 열 때와 다시 앞으로 돌아올 때 조용히 한 번 맞춘다.
  // 실패해도 아무 일 없다 — 기록은 이 기기에 있고, 다음 기회에 다시 맞춘다.
  useEffect(() => {
    const run = () => {
      void syncNow().then(async (r) => {
        if (r === 'failed') {
          const last = await readLastSyncedAt()
          const days = last === null ? null : Math.floor((Date.now() - last) / 86_400_000)
          setSyncStuck(days === null || days >= SYNC_STUCK_DAYS ? { days } : null)
          return
        }
        if (typeof r === 'string') return
        setSyncStuck(null)
        // 사진만 받아온 경우(pulled === 0)에도 다시 그려야 한다.
        // 안 그러면 이미 있던 기록의 사진이 다음에 들어올 때까지 츄르 그림으로 남는다.
        if (r.pulled > 0 || r.photosDown > 0) refresh()
      })
    }
    run()
    const onVisible = () => {
      if (document.visibilityState === 'visible') run()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [refresh])

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
      {tab === 'feed' && (
        <FeedScreen
          onAdd={() => setTab('add')}
          onChanged={refresh}
          syncStuck={syncStuck}
          onSyncStuck={() => setTab('settings')}
        />
      )}
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
          onDataChanged={() => {
            // 설정에서 직접 맞추는 데 성공했으면 홈의 알림도 내린다
            setSyncStuck(null)
            refresh()
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
          aria-label="기록 추가"
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
