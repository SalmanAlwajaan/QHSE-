import React from 'react'
import { useTranslation } from 'react-i18next'
import { Shield } from 'lucide-react'
import { getNav } from '../../config/modules.jsx'
import { useApp } from '../../lib/store.jsx'

export default function Sidebar({ active, onNavigate, company }) {
  const { t } = useTranslation()
  const { canView } = useApp()
  const NAV = getNav(t)
    .map((grp) => ({ ...grp, items: grp.items.filter((it) => canView(it.id)) }))
    .filter((grp) => grp.items.length)

  return (
    <aside style={{ width: 232, flexShrink: 0, background: 'var(--surface)', borderInlineEnd: '1px solid var(--border)', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="flex items-center gap-2.5 px-4" style={{ height: 60, borderBottom: '1px solid var(--border)' }}>
        <div className="rounded-xl flex items-center justify-center" style={{ width: 34, height: 34, background: 'var(--primary)', color: '#fff' }}><Shield size={19} /></div>
        <div className="leading-tight overflow-hidden">
          <div className="font-semibold text-[15px]" style={{ color: 'var(--text)' }}>{t('app.name')}</div>
          <div className="text-[11px] truncate" style={{ color: 'var(--faint)', maxWidth: 160 }}>{company || t('app.tagline')}</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {NAV.map((grp) => (
          <div key={grp.group}>
            <div className="nav-group">{grp.group}</div>
            {grp.items.map((it) => {
              const Icon = it.icon
              return (
                <div key={it.id} className={`nav-item ${active === it.id ? 'active' : ''}`} onClick={() => onNavigate(it.id)}>
                  <Icon size={17} /> {it.label}
                </div>
              )
            })}
          </div>
        ))}
      </nav>
    </aside>
  )
}
