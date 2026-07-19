import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bell, Sun, Moon, LogOut, Database, ChevronDown, Languages } from 'lucide-react'
import { Avatar } from '../ui.jsx'
import { revealData } from '../../lib/api.js'
import { ROLE_LABEL } from '../../lib/format.js'
import { setAppLanguage } from '../../i18n/index.js'

export default function Topbar({ user, theme, onToggleTheme, onLogout, watchCount, onBell }) {
  const { t, i18n } = useTranslation()
  const [menu, setMenu] = useState(false)
  const dateLocale = i18n.language === 'ar' ? 'ar-SA' : 'en-GB'
  return (
    <header className="flex items-center justify-between px-6" style={{ height: 60, borderBottom: '1px solid var(--border)', background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 20 }}>
      <div className="text-[13px]" style={{ color: 'var(--muted)' }}>
        {new Date().toLocaleDateString(dateLocale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </div>
      <div className="flex items-center gap-1.5">
        <button className="btn btn-ghost btn-icon" title={t('topbar.language')} onClick={() => setAppLanguage(i18n.language === 'ar' ? 'en' : 'ar')}><Languages size={17} /></button>
        <button className="btn btn-ghost btn-icon" title={t('topbar.openDataFolder')} onClick={() => revealData()}><Database size={17} /></button>
        <button className="btn btn-ghost btn-icon relative" title={t('topbar.complianceAlerts')} onClick={onBell}>
          <Bell size={17} />
          {watchCount > 0 && <span style={{ position: 'absolute', top: 4, insetInlineEnd: 4, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 999, background: 'var(--danger)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{watchCount}</span>}
        </button>
        <button className="btn btn-ghost btn-icon" title={t('topbar.toggleTheme')} onClick={onToggleTheme}>{theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</button>
        <div className="relative" style={{ marginInlineStart: 4 }}>
          <button className="btn btn-ghost" style={{ height: 42, paddingInlineStart: 6, paddingInlineEnd: 10 }} onClick={() => setMenu((m) => !m)}>
            <Avatar name={user.full_name} size={30} />
            <div className="text-left leading-tight hidden sm:block">
              <div className="text-[12.5px] font-medium" style={{ color: 'var(--text)' }}>{user.full_name}</div>
              <div className="text-[11px]" style={{ color: 'var(--faint)' }}>{t(`roles.${user.role}`, ROLE_LABEL[user.role] || user.role)}</div>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--faint)' }} />
          </button>
          {menu && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 30 }} onClick={() => setMenu(false)} />
              <div className="card elev" style={{ position: 'absolute', insetInlineEnd: 0, top: 50, width: 180, zIndex: 40, padding: 6 }}>
                <div className="nav-item" onClick={() => { setMenu(false); onLogout() }} style={{ color: 'var(--danger-text)' }}><LogOut size={16} /> {t('common.signOut')}</div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
