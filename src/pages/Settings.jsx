import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Settings as Cog, Building2, Palette, Database, ScrollText, Sun, Moon, FolderOpen, Save } from 'lucide-react'
import { call, useQuery, revealData } from '../lib/api.js'
import { useApp } from '../lib/store.jsx'
import { PageHeader, Card, Badge } from '../components/ui.jsx'
import { fmtDate } from '../lib/format.js'

function Row({ icon: Icon, title, desc, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="flex items-start gap-3">
        <div className="rounded-lg flex items-center justify-center shrink-0" style={{ width: 34, height: 34, background: 'var(--surface-3)', color: 'var(--muted)' }}><Icon size={17} /></div>
        <div><div className="text-[13.5px] font-medium" style={{ color: 'var(--text)' }}>{title}</div><div className="text-[12px] mt-0.5" style={{ color: 'var(--muted)' }}>{desc}</div></div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

export default function Settings() {
  const { t } = useTranslation()
  const { user, settings, refreshSettings, theme, setTheme, toast, can } = useApp()
  const { data: logs } = useQuery('audit.list')
  const [company, setCompany] = useState(settings.company_name || '')
  const [client, setClient] = useState(settings.client_name || '')
  const canEdit = can('settings')

  const saveCompany = async () => {
    await call('settings.set', { key: 'company_name', value: company, _role: user.role })
    await call('settings.set', { key: 'client_name', value: client, _role: user.role })
    await refreshSettings()
    toast({ title: t('settings.settingsSaved'), tone: 'success' })
  }

  return (
    <div className="fade-in" style={{ maxWidth: 860 }}>
      <PageHeader icon={Cog} title={t('settings.title')} subtitle={t('settings.subtitle')} />

      <Card className="mb-4">
        <div className="flex items-center gap-2 mb-2"><Building2 size={16} style={{ color: 'var(--primary-text)' }} /><span className="font-semibold text-[14px]" style={{ color: 'var(--text)' }}>{t('settings.companyProfile')}</span></div>
        <div className="grid grid-cols-2 gap-4 mt-3">
          <div><label className="label">{t('settings.companyName')}</label><input className="input" value={company} disabled={!canEdit} onChange={(e) => setCompany(e.target.value)} /></div>
          <div><label className="label">{t('settings.mainClient')}</label><input className="input" value={client} disabled={!canEdit} onChange={(e) => setClient(e.target.value)} /></div>
        </div>
        {canEdit && <div className="flex justify-end mt-4"><button className="btn btn-primary btn-sm" onClick={saveCompany}><Save size={15} /> {t('settings.saveProfile')}</button></div>}
      </Card>

      <Card className="mb-4 card-pad" pad={false}>
        <div className="px-5 pt-4 pb-1 flex items-center gap-2"><Palette size={16} style={{ color: 'var(--primary-text)' }} /><span className="font-semibold text-[14px]" style={{ color: 'var(--text)' }}>{t('settings.appearanceData')}</span></div>
        <div className="px-5">
          <Row icon={theme === 'dark' ? Moon : Sun} title={t('settings.theme')} desc={t('settings.themeDesc')}>
            <div className="flex gap-1.5">
              <button className={`btn btn-sm ${theme === 'light' ? 'btn-primary' : ''}`} onClick={() => setTheme('light')}><Sun size={14} /> {t('settings.light')}</button>
              <button className={`btn btn-sm ${theme === 'dark' ? 'btn-primary' : ''}`} onClick={() => setTheme('dark')}><Moon size={14} /> {t('settings.dark')}</button>
            </div>
          </Row>
          <Row icon={Database} title={t('settings.localDatabase')} desc={t('settings.localDatabaseDesc')}>
            <button className="btn btn-sm" onClick={() => revealData()}><FolderOpen size={14} /> {t('settings.openDataFolder')}</button>
          </Row>
          <div className="py-3.5 text-[12px]" style={{ color: 'var(--faint)' }}>{t('settings.backupNote')}</div>
        </div>
      </Card>

      <Card pad={false}>
        <div className="px-5 pt-4 pb-3 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)' }}><ScrollText size={16} style={{ color: 'var(--primary-text)' }} /><span className="font-semibold text-[14px]" style={{ color: 'var(--text)' }}>{t('settings.activityLog')}</span><Badge tone="gray">{t('settings.auditTrail')}</Badge></div>
        <div className="overflow-auto" style={{ maxHeight: 360 }}>
          <table className="tbl">
            <thead><tr><th>{t('settings.colWhen')}</th><th>{t('settings.colUser')}</th><th>{t('settings.colAction')}</th><th>{t('settings.colEntity')}</th></tr></thead>
            <tbody>
              {(logs || []).slice(0, 60).map((l) => (
                <tr key={l.id}>
                  <td style={{ color: 'var(--muted)', whiteSpace: 'nowrap' }}>{l.ts}</td>
                  <td>{l.username}</td>
                  <td><Badge tone={l.action === 'delete' ? 'red' : l.action === 'create' ? 'green' : 'amber'}>{l.action}</Badge></td>
                  <td style={{ color: 'var(--muted)' }}>{l.entity} #{l.entity_id}</td>
                </tr>
              ))}
              {(!logs || logs.length === 0) && <tr><td colSpan={4} className="py-5 text-center text-[12.5px]" style={{ color: 'var(--faint)' }}>{t('settings.noActivity')}</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="text-center text-[11.5px] mt-6" style={{ color: 'var(--faint)' }}>{t('settings.footer', { username: user.username })}</div>
    </div>
  )
}
