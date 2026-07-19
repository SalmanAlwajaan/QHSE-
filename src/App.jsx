import React, { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { AppContext } from './lib/store.jsx'
import { call, setNativeTheme, useQuery, hasBridge } from './lib/api.js'
import { Modal, Badge, ToastHost } from './components/ui.jsx'
import Sidebar from './components/layout/Sidebar.jsx'
import Topbar from './components/layout/Topbar.jsx'
import ResourcePage from './components/ResourcePage.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Employees from './pages/Employees.jsx'
import Inspections from './pages/Inspections.jsx'
import Documents from './pages/Documents.jsx'
import Settings from './pages/Settings.jsx'
import { getModules } from './config/modules.jsx'
import { fmtDate } from './lib/format.js'
import { canRead, canWrite } from './config/permissions.js'

const CUSTOM = { dashboard: Dashboard, employees: Employees, inspections: Inspections, documents: Documents, settings: Settings }

function AlertsModal({ onClose }) {
  const { t } = useTranslation()
  const { data: wl } = useQuery('compliance.watchlist')
  const items = (wl || []).filter((w) => w.status !== 'valid')
  return (
    <Modal title={t('alerts.title')} subtitle={t('alerts.subtitle', { count: items.length })} onClose={onClose}>
      {items.length === 0 ? <div className="text-[13px] py-3" style={{ color: 'var(--muted)' }}>{t('alerts.allValid')}</div> : (
        <div className="flex flex-col">
          {items.slice(0, 40).map((w, i) => (
            <div key={i} className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2.5">
                <Badge tone="gray">{w.kind}</Badge>
                <div className="leading-tight"><div className="text-[13px]" style={{ color: 'var(--text)', fontWeight: 500 }}>{w.subtype}</div><div className="text-[11.5px]" style={{ color: 'var(--faint)' }}>{w.emp_name || '—'} · {fmtDate(w.expiry_date)}</div></div>
              </div>
              <Badge tone={w.status === 'warning' ? 'amber' : 'red'}>{w.days < 0 ? t('alerts.expiredDays', { days: Math.abs(w.days) }) : t('alerts.daysLeft', { days: w.days })}</Badge>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}

export default function App() {
  const { t } = useTranslation()
  const MODULES = getModules(t)
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('sentinel_user') || 'null') } catch { return null } })
  const [theme, setThemeState] = useState(() => localStorage.getItem('sentinel_theme') || 'dark')
  const [route, setRoute] = useState('dashboard')
  const [settings, setSettings] = useState({})
  const [toasts, setToasts] = useState([])
  const [alertsOpen, setAlertsOpen] = useState(false)
  const [watchCount, setWatchCount] = useState(0)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('sentinel_theme', theme)
    setNativeTheme(theme)
  }, [theme])

  const setTheme = (t) => setThemeState(t)
  const toggleTheme = () => setThemeState((t) => (t === 'dark' ? 'light' : 'dark'))

  const toast = useCallback((t) => {
    const id = Date.now() + Math.random()
    setToasts((arr) => [...arr, { ...t, id }])
    setTimeout(() => setToasts((arr) => arr.filter((x) => x.id !== id)), 3800)
  }, [])
  const dismiss = (id) => setToasts((arr) => arr.filter((x) => x.id !== id))

  const refreshSettings = useCallback(async () => { try { setSettings(await call('settings.all')) } catch { /* noop */ } }, [])

  const refreshWatch = useCallback(async () => {
    try { const wl = await call('compliance.watchlist'); setWatchCount(wl.filter((w) => w.status === 'critical' || w.status === 'expired').length) } catch { /* noop */ }
  }, [])

  useEffect(() => { if (user) { refreshSettings(); refreshWatch() } }, [user, route, refreshSettings, refreshWatch])

  const login = (u) => { setUser(u); localStorage.setItem('sentinel_user', JSON.stringify(u)); setRoute('dashboard') }
  const logout = () => { setUser(null); localStorage.removeItem('sentinel_user') }

  if (!hasBridge) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', textAlign: 'center', padding: 40 }}>
      <div><div className="text-[16px] font-semibold mb-2" style={{ color: 'var(--text)' }}>{t('login.runInsideApp')}</div>{t('login.runInsideAppDesc')} <span className="kbd">npm run dev</span></div>
    </div>
  }

  if (!user) return <Login onLogin={login} theme={theme} onToggleTheme={toggleTheme} />

  let content
  if (CUSTOM[route]) { const C = CUSTOM[route]; content = <C onNavigate={setRoute} /> }
  else if (MODULES[route]) content = <ResourcePage key={route} moduleId={route} {...MODULES[route]} />
  else content = <Dashboard onNavigate={setRoute} />

  const can = (moduleId) => canWrite(user.role, moduleId)
  const canView = (moduleId) => canRead(user.role, moduleId)

  return (
    <AppContext.Provider value={{ user, role: user.role, toast, settings, refreshSettings, theme, setTheme, can, canView }}>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        <Sidebar active={route} onNavigate={setRoute} company={settings.company_name} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
          <Topbar user={user} theme={theme} onToggleTheme={toggleTheme} onLogout={logout} watchCount={watchCount} onBell={() => setAlertsOpen(true)} />
          <main style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>{content}</main>
        </div>
      </div>
      {alertsOpen && <AlertsModal onClose={() => setAlertsOpen(false)} onNavigate={setRoute} />}
      <ToastHost toasts={toasts} dismiss={dismiss} />
    </AppContext.Provider>
  )
}
