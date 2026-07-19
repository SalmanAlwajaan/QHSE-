import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Search, Download, Upload, Pencil, Trash2 } from 'lucide-react'
import { call, useQuery, exportExcel, importExcel } from '../lib/api.js'
import { useApp } from '../lib/store.jsx'
import { PageHeader, Card, Spinner, Modal, ConfirmDialog } from './ui.jsx'
import DataTable from './DataTable.jsx'
import Form from './Form.jsx'

export default function ResourcePage(cfg) {
  const { moduleId, domain, table, title, subtitle, icon, columns, fields, searchKeys = [], canImport, importNote, newLabel } = cfg
  const { user, toast, can } = useApp()
  const { t } = useTranslation()
  const { data: rows, loading, error, refresh } = useQuery(`${domain}.list`)
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState(null) // {} for new, row for edit
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(false)

  const filtered = useMemo(() => {
    if (!rows) return []
    if (!q.trim()) return rows
    const t = q.toLowerCase()
    return rows.filter((r) => searchKeys.some((k) => String(r[k] ?? '').toLowerCase().includes(t)))
  }, [rows, q, searchKeys])

  const save = async (values) => {
    setBusy(true)
    try {
      const payload = { ...values, _actor: user.username, _role: user.role }
      if (editing && editing.id) await call(`${domain}.update`, { ...payload, id: editing.id })
      else await call(`${domain}.create`, payload)
      setEditing(null)
      refresh()
      toast({ title: editing && editing.id ? t('common.recordUpdated') : t('common.recordAdded'), tone: 'success' })
    } catch (e) { toast({ title: t('common.saveFailed'), message: e.message, tone: 'error' }) }
    finally { setBusy(false) }
  }

  const remove = async () => {
    try {
      await call(`${domain}.delete`, { id: confirm.id, _actor: user.username, _role: user.role })
      setConfirm(null); refresh()
      toast({ title: t('common.recordDeleted'), tone: 'success' })
    } catch (e) { toast({ title: t('common.deleteFailed'), message: e.message, tone: 'error' }) }
  }

  const doExport = async () => {
    const res = await exportExcel(table, title)
    if (res.canceled) return
    if (res.ok) toast({ title: t('common.exportedToExcel'), message: t('common.exportedRows', { count: res.count }), tone: 'success' })
    else toast({ title: t('common.exportFailed'), message: res.error, tone: 'error' })
  }
  const doImport = async () => {
    const res = await importExcel(table, user.role)
    if (res.canceled) return
    if (res.ok) { refresh(); toast({ title: t('common.importComplete'), message: t('common.importSummary', { inserted: res.inserted, updated: res.updated, skipped: res.skipped }), tone: 'success' }) }
    else toast({ title: t('common.importFailed'), message: res.error, tone: 'error' })
  }

  const canEdit = can(moduleId || domain)

  return (
    <div className="fade-in">
      <PageHeader icon={icon} title={title} subtitle={subtitle}>
        <button className="btn btn-sm" onClick={doExport}><Download size={15} /> {t('common.export')}</button>
        {canImport && canEdit && <button className="btn btn-sm" onClick={doImport}><Upload size={15} /> {t('common.import')}</button>}
        {canEdit && <button className="btn btn-primary btn-sm" onClick={() => setEditing({})}><Plus size={15} /> {newLabel || t('common.new')}</button>}
      </PageHeader>

      <Card pad={false}>
        <div className="flex items-center justify-between gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="relative" style={{ width: 320, maxWidth: '50%' }}>
            <Search size={15} style={{ position: 'absolute', insetInlineStart: 11, top: 11, color: 'var(--faint)' }} />
            <input className="input" style={{ paddingInlineStart: 32, height: 36 }} placeholder={t('common.search')} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="text-[12.5px]" style={{ color: 'var(--muted)' }}>{t('common.recordsCount', { filtered: filtered.length, total: rows ? rows.length : 0 })}</div>
        </div>

        {loading ? <Spinner /> : error ? (
          <div className="p-6 text-[13px]" style={{ color: 'var(--danger-text)' }}>Error: {error}</div>
        ) : (
          <DataTable
            columns={columns}
            rows={filtered}
            actions={canEdit ? (row) => (
              <div className="flex items-center justify-end gap-1">
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditing(row)} title={t('common.saveChanges')}><Pencil size={14} /></button>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setConfirm(row)} title={t('common.delete')}><Trash2 size={14} /></button>
              </div>
            ) : undefined}
          />
        )}
      </Card>

      {editing && (
        <Modal wide title={editing.id ? `${t('common.saveChanges')} — ${title}` : (newLabel || `${t('common.new')} — ${title}`)}
          subtitle={!editing.id ? importNote : undefined} onClose={() => setEditing(null)}>
          <Form fields={fields} initial={editing} onSubmit={save} onCancel={() => setEditing(null)} busy={busy} submitLabel={editing.id ? t('common.saveChanges') : t('common.create')} />
        </Modal>
      )}

      {confirm && (
        <ConfirmDialog title={t('common.confirmDeleteTitle')} message={t('common.confirmDeleteMessage')}
          confirmLabel={t('common.delete')} onConfirm={remove} onClose={() => setConfirm(null)} />
      )}
    </div>
  )
}
