import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Search, Download, Upload, Pencil, Trash2, FileText, History, GitBranch } from 'lucide-react'
import { call, useQuery, exportExcel } from '../lib/api.js'
import { useApp } from '../lib/store.jsx'
import { PageHeader, Card, Spinner, Modal, Badge, ConfirmDialog } from '../components/ui.jsx'
import DataTable from '../components/DataTable.jsx'
import Form from '../components/Form.jsx'
import { fmtDate, expiryStatus, statusTone } from '../lib/format.js'

const docFields = (t) => [
  { name: 'title', label: t('documents.fields.title'), required: true, full: true },
  { name: 'category', label: t('documents.fields.category'), type: 'select', options: [
    { value: 'Safety', label: t('options.safety') }, { value: 'Environment', label: t('nav.items.environment') },
    { value: 'Quality', label: t('options.quality_dept') }, { value: 'HR', label: t('options.hr_dept') }, { value: 'General', label: t('common.all') },
  ], required: true },
  { name: 'doc_type', label: t('documents.fields.doc_type'), type: 'select', options: [opt(t, 'Policy', 'policy'), opt(t, 'Procedure', 'procedure'), opt(t, 'Form', 'form'), opt(t, 'Manual', 'manual'), opt(t, 'Record', 'record'), opt(t, 'Register', 'register'), opt(t, 'Certificate', 'certificate'), opt(t, 'Plan', 'plan')] },
  { name: 'version', label: t('documents.fields.version'), placeholder: '1.0' },
  { name: 'status', label: t('documents.fields.status'), type: 'select', options: [opt(t, 'Active', 'active'), opt(t, 'Draft', 'draft'), opt(t, 'Under Review', 'under_review'), opt(t, 'Archived', 'archived')] },
  { name: 'owner', label: t('documents.fields.owner') },
  { name: 'review_date', label: t('documents.fields.review_date'), type: 'date' },
  { name: 'file_path', label: t('documents.fields.file_path'), full: true, placeholder: 'e.g. /Volumes/HSE/ISO45001/risk-assessment.pdf' },
  { name: 'tags', label: t('documents.fields.tags'), full: true, placeholder: 'ISO 45001, HIRA' },
]
const opt = (t, value, key) => ({ value, label: t(`options.${key}`, value) })
const CAT_TONE = { Safety: 'blue', Environment: 'green', Quality: 'primary', HR: 'amber', General: 'gray' }

function DocDetail({ doc, onClose, onEdit, canEdit }) {
  const { t } = useTranslation()
  const { user, toast } = useApp()
  const { data: versions, refresh } = useQuery('documents.versions', { document_id: doc.id }, [doc.id])
  const [adding, setAdding] = useState(false)
  const [v, setV] = useState({ version: '', note: '', status: doc.status })

  const addVersion = async () => {
    if (!v.version) return
    try {
      await call('documents.addVersion', { document_id: doc.id, version: v.version, note: v.note, status: v.status, _actor: user.username, _role: user.role })
      setAdding(false); setV({ version: '', note: '', status: doc.status }); refresh()
      toast({ title: t('documents.newVersionRecorded'), message: t('documents.nowAtVersion', { version: v.version }), tone: 'success' })
    } catch (e) { toast({ title: t('inspections.failed'), message: e.message, tone: 'error' }) }
  }

  return (
    <Modal wide title={doc.title} subtitle={`${doc.doc_type} · ${doc.category}`} onClose={onClose} footer={canEdit && <>
      <button className="btn" onClick={() => setAdding((a) => !a)}><GitBranch size={15} /> {t('documents.newVersion')}</button>
      <button className="btn btn-primary" onClick={() => onEdit(doc)}><Pencil size={15} /> {t('documents.editDetails')}</button>
    </>}>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div><div className="label">{t('documents.currentVersion')}</div><div className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>v{doc.version}</div></div>
        <div><div className="label">{t('documents.status')}</div><Badge tone={statusTone(doc.status)}>{doc.status}</Badge></div>
        <div><div className="label">{t('documents.owner')}</div><div className="text-[13px]" style={{ color: 'var(--text)' }}>{doc.owner || '—'}</div></div>
        <div><div className="label">{t('documents.nextReview')}</div><div className="text-[13px] flex items-center gap-2" style={{ color: 'var(--text)' }}>{fmtDate(doc.review_date)} {(() => { const s = expiryStatus(doc.review_date); return s.key !== 'none' && s.key !== 'ok' ? <Badge tone={s.tone}>{s.key === 'expired' ? t('documents.overdue') : t('documents.soon')}</Badge> : null })()}</div></div>
        <div className="col-span-2"><div className="label">{t('documents.file')}</div><div className="text-[13px] truncate" style={{ color: 'var(--muted)' }}>{doc.file_path || t('documents.noFileLinked')}</div></div>
      </div>
      {doc.tags && <div className="flex flex-wrap gap-1.5 mb-4">{doc.tags.split(',').map((tag) => <Badge key={tag} tone="gray">{tag.trim()}</Badge>)}</div>}

      {adding && (
        <div className="card card-pad mb-4">
          <div className="grid grid-cols-3 gap-3">
            <div><label className="label">{t('documents.newVersionLabel')}</label><input className="input" placeholder="e.g. 2.1" value={v.version} onChange={(e) => setV({ ...v, version: e.target.value })} /></div>
            <div className="col-span-2"><label className="label">{t('documents.changeNote')}</label><input className="input" placeholder={t('documents.whatChanged')} value={v.note} onChange={(e) => setV({ ...v, note: e.target.value })} /></div>
          </div>
          <div className="flex justify-end mt-3"><button className="btn btn-primary btn-sm" onClick={addVersion}>{t('documents.recordVersion')}</button></div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-2"><History size={15} style={{ color: 'var(--primary-text)' }} /><span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{t('documents.versionHistory')}</span></div>
      <div className="card" style={{ padding: '4px 14px' }}>
        {(versions || []).map((ver, i) => (
          <div key={ver.id} className="flex items-center justify-between py-2.5" style={{ borderBottom: i < versions.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div className="flex items-center gap-3">
              <Badge tone={i === 0 ? 'green' : 'gray'}>v{ver.version}</Badge>
              <span className="text-[13px]" style={{ color: 'var(--text)' }}>{ver.note || '—'}</span>
            </div>
            <span className="text-[12px]" style={{ color: 'var(--faint)' }}>{ver.changed_by} · {fmtDate(ver.changed_at)}</span>
          </div>
        ))}
        {(!versions || versions.length === 0) && <div className="py-3 text-[12.5px]" style={{ color: 'var(--faint)' }}>{t('documents.noVersions')}</div>}
      </div>
    </Modal>
  )
}

export default function Documents() {
  const { t } = useTranslation()
  const { user, toast, can } = useApp()
  const { data: rows, loading, refresh } = useQuery('documents.list')
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('All')
  const [editing, setEditing] = useState(null)
  const [detail, setDetail] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const canEdit = can('documents')

  const filtered = useMemo(() => {
    if (!rows) return []
    return rows.filter((r) => (cat === 'All' || r.category === cat) && (!q.trim() || ['title', 'owner', 'tags', 'doc_type'].some((k) => String(r[k] ?? '').toLowerCase().includes(q.toLowerCase()))))
  }, [rows, q, cat])

  const save = async (values) => {
    try {
      const payload = { ...values, _actor: user.username, _role: user.role }
      if (editing.id) await call('documents.update', { ...payload, id: editing.id })
      else await call('documents.create', payload)
      setEditing(null); refresh(); toast({ title: editing.id ? t('documents.documentUpdated') : t('documents.documentAdded'), tone: 'success' })
    } catch (e) { toast({ title: t('common.saveFailed'), message: e.message, tone: 'error' }) }
  }
  const remove = async () => { await call('documents.delete', { id: confirm.id, _actor: user.username, _role: user.role }); setConfirm(null); refresh(); toast({ title: t('documents.documentDeleted'), tone: 'success' }) }

  const columns = [
    { key: 'title', label: t('documents.colTitle'), render: (r) => <div className="flex items-center gap-2.5"><FileText size={16} style={{ color: 'var(--faint)' }} /><span style={{ fontWeight: 500, color: 'var(--text)' }}>{r.title}</span></div> },
    { key: 'category', label: t('documents.colCategory'), render: (r) => <Badge tone={CAT_TONE[r.category] || 'gray'}>{r.category}</Badge> },
    { key: 'doc_type', label: t('documents.colType') },
    { key: 'version', label: t('documents.colVersion'), render: (r) => <span style={{ fontWeight: 500 }}>v{r.version}</span> },
    { key: 'owner', label: t('documents.colOwner') },
    { key: 'review_date', label: t('documents.colNextReview'), render: (r) => { const s = expiryStatus(r.review_date); return <span className="flex items-center gap-2">{fmtDate(r.review_date)} {s.key === 'expired' && <Badge tone="red">{t('documents.overdue')}</Badge>}{s.key === 'critical' && <Badge tone="amber">{t('documents.soon')}</Badge>}</span> } },
    { key: 'status', label: t('documents.colStatus'), render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
  ]
  const cats = [
    { value: 'All', label: t('common.all') }, { value: 'Safety', label: t('options.safety') }, { value: 'Environment', label: t('nav.items.environment') },
    { value: 'Quality', label: t('options.quality_dept') }, { value: 'HR', label: t('options.hr_dept') }, { value: 'General', label: t('common.all') },
  ]

  return (
    <div className="fade-in">
      <PageHeader icon={FileText} title={t('documents.title')} subtitle={t('documents.subtitle')}>
        <button className="btn btn-sm" onClick={async () => { const r = await exportExcel('documents', 'Documents'); if (r.ok) toast({ title: t('common.exportedToExcel'), message: t('common.exportedRows', { count: r.count }), tone: 'success' }) }}><Download size={15} /> {t('common.export')}</button>
        {canEdit && <button className="btn btn-primary btn-sm" onClick={() => setEditing({ version: '1.0', status: 'Active' })}><Plus size={15} /> {t('documents.newDocument')}</button>}
      </PageHeader>

      <Card pad={false}>
        <div className="flex items-center justify-between gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <div className="relative" style={{ width: 260 }}>
              <Search size={15} style={{ position: 'absolute', insetInlineStart: 11, top: 11, color: 'var(--faint)' }} />
              <input className="input" style={{ paddingInlineStart: 32, height: 36 }} placeholder={t('documents.searchPlaceholder')} value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <select className="select" style={{ height: 36, width: 150 }} value={cat} onChange={(e) => setCat(e.target.value)}>{cats.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select>
          </div>
          <div className="text-[12.5px]" style={{ color: 'var(--muted)' }}>{t('documents.countLabel', { count: filtered.length })}</div>
        </div>
        {loading ? <Spinner /> : (
          <DataTable columns={columns} rows={filtered} onRowClick={(r) => setDetail(r)}
            actions={canEdit ? (r) => <div className="flex justify-end gap-1"><button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditing(r)}><Pencil size={14} /></button><button className="btn btn-ghost btn-icon btn-sm" onClick={() => setConfirm(r)}><Trash2 size={14} /></button></div> : undefined} />
        )}
      </Card>

      {detail && <DocDetail doc={detail} canEdit={canEdit} onClose={() => setDetail(null)} onEdit={(d) => { setDetail(null); setEditing(d) }} />}
      {editing && <Modal wide title={editing.id ? t('documents.editDocument') : t('documents.newDocument')} onClose={() => setEditing(null)}><Form fields={docFields(t)} initial={editing} onSubmit={save} onCancel={() => setEditing(null)} submitLabel={editing.id ? t('common.saveChanges') : t('common.create')} /></Modal>}
      {confirm && <ConfirmDialog title={t('documents.deleteTitle')} message={t('documents.deleteMessage')} confirmLabel={t('common.delete')} onConfirm={remove} onClose={() => setConfirm(null)} />}
    </div>
  )
}
