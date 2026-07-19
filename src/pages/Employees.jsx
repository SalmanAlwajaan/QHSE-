import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Search, Download, Upload, Pencil, X, Phone, Mail, Calendar, IdCard, Award, GraduationCap, ShieldCheck, Users } from 'lucide-react'
import { call, useQuery, exportExcel, importExcel } from '../lib/api.js'
import { useApp } from '../lib/store.jsx'
import { PageHeader, Card, Spinner, Modal, Badge, Avatar } from '../components/ui.jsx'
import DataTable from '../components/DataTable.jsx'
import Form from '../components/Form.jsx'
import { fmtDate, expiryStatus, statusTone } from '../lib/format.js'

const empFields = (t) => [
  { name: 'emp_id', label: t('employees.fields.emp_id'), required: true, placeholder: 'e.g. EMP-1013' },
  { name: 'full_name', label: t('employees.fields.full_name'), required: true, full: true },
  { name: 'department', label: t('employees.fields.department'), type: 'select', options: [
    { value: 'Safety', label: t('options.safety') }, { value: 'Electrical', label: t('options.electrical') },
    { value: 'Projects', label: t('options.projects_dept') }, { value: 'Environment', label: t('nav.items.environment') },
    { value: 'Quality', label: t('options.quality_dept') }, { value: 'HR', label: t('options.hr_dept') },
    { value: 'Admin', label: t('options.admin_dept') }, { value: 'Stores', label: t('options.stores') },
  ] },
  { name: 'position', label: t('employees.fields.position') },
  { name: 'nationality', label: t('employees.fields.nationality') },
  { name: 'phone', label: t('employees.fields.phone') },
  { name: 'email', label: t('employees.fields.email'), type: 'email' },
  { name: 'hire_date', label: t('employees.fields.hire_date'), type: 'date' },
  { name: 'status', label: t('employees.fields.status'), type: 'select', options: [
    { value: 'Active', label: t('options.active') }, { value: 'On Leave', label: t('options.on_leave') }, { value: 'Inactive', label: t('options.inactive') },
  ] },
]

function CredRow({ left, mid, date }) {
  const s = expiryStatus(date)
  return (
    <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="leading-tight">
        <div className="text-[13px]" style={{ color: 'var(--text)', fontWeight: 500 }}>{left}</div>
        {mid && <div className="text-[11.5px]" style={{ color: 'var(--faint)' }}>{mid}</div>}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[12px]" style={{ color: 'var(--muted)' }}>{fmtDate(date)}</span>
        <Badge tone={s.tone}>{s.key === 'none' ? '—' : s.label}</Badge>
      </div>
    </div>
  )
}

function Section({ icon: Icon, title, count, children }) {
  const { t } = useTranslation()
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={15} style={{ color: 'var(--primary-text)' }} />
        <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{title}</span>
        <Badge tone="gray">{count}</Badge>
      </div>
      {count === 0 ? <div className="text-[12.5px] py-1" style={{ color: 'var(--faint)' }}>{t('employees.noneOnRecord')}</div> : children}
    </div>
  )
}

function ProfileDrawer({ emp_id, onClose, onEdit }) {
  const { t } = useTranslation()
  const { data: d, loading } = useQuery('employees.detail', { emp_id }, [emp_id])
  return (
    <div className="overlay" style={{ justifyContent: 'flex-end' }} onMouseDown={onClose}>
      <div className="fade-in" style={{ width: 540, maxWidth: '94vw', height: '100vh', background: 'var(--surface)', borderLeft: '1px solid var(--border)', overflow: 'auto' }} onMouseDown={(e) => e.stopPropagation()}>
        {loading || !d ? <Spinner /> : (
          <>
            <div className="flex items-start justify-between p-5" style={{ borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--surface)' }}>
              <div className="flex items-center gap-3">
                <Avatar name={d.full_name} size={48} />
                <div>
                  <div className="text-[17px] font-semibold" style={{ color: 'var(--text)' }}>{d.full_name}</div>
                  <div className="text-[12.5px]" style={{ color: 'var(--muted)' }}>{d.position} · {d.emp_id}</div>
                  <div className="mt-1.5 flex gap-2"><Badge tone="primary">{d.department}</Badge><Badge tone={statusTone(d.status)}>{d.status}</Badge></div>
                </div>
              </div>
              <div className="flex gap-1">
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onEdit(d)} title="Edit"><Pencil size={15} /></button>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="flex items-center gap-2 text-[12.5px]" style={{ color: 'var(--muted)' }}><Phone size={14} /> {d.phone || '—'}</div>
                <div className="flex items-center gap-2 text-[12.5px]" style={{ color: 'var(--muted)' }}><Mail size={14} /> {d.email || '—'}</div>
                <div className="flex items-center gap-2 text-[12.5px]" style={{ color: 'var(--muted)' }}><Calendar size={14} /> {t('employees.hired', { date: fmtDate(d.hire_date) })}</div>
                <div className="flex items-center gap-2 text-[12.5px]" style={{ color: 'var(--muted)' }}>🌍 {d.nationality || '—'}</div>
              </div>
              <Section icon={IdCard} title={t('employees.sectionIdCards')} count={d.cards.length}>
                {d.cards.map((c) => <CredRow key={c.id} left={c.card_type} mid={c.card_number} date={c.expiry_date} />)}
              </Section>
              <Section icon={Award} title={t('employees.sectionLicenses')} count={d.licenses.length}>
                {d.licenses.map((c) => <CredRow key={c.id} left={c.license_type} mid={c.license_number} date={c.expiry_date} />)}
              </Section>
              <Section icon={GraduationCap} title={t('employees.sectionCourses')} count={d.courses.length}>
                {d.courses.map((c) => <CredRow key={c.id} left={c.course_name} mid={c.provider} date={c.expiry_date} />)}
              </Section>
              <Section icon={ShieldCheck} title={t('employees.sectionPpeIssued')} count={d.ppe.length}>
                {d.ppe.map((c) => <CredRow key={c.id} left={c.item_name} mid={`${c.size || '—'} · ${c.status}`} date={c.expiry_date} />)}
              </Section>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function Employees() {
  const { t } = useTranslation()
  const { user, toast, can } = useApp()
  const { data: rows, loading, refresh } = useQuery('employees.list')
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState(null)
  const [openId, setOpenId] = useState(null)
  const canEdit = can('employees')

  const filtered = useMemo(() => {
    if (!rows) return []
    if (!q.trim()) return rows
    const s = q.toLowerCase()
    return rows.filter((r) => ['full_name', 'emp_id', 'department', 'position', 'nationality'].some((k) => String(r[k] ?? '').toLowerCase().includes(s)))
  }, [rows, q])

  const save = async (values) => {
    try {
      const payload = { ...values, _actor: user.username, _role: user.role }
      if (editing.id) await call('employees.update', { ...payload, id: editing.id })
      else await call('employees.create', payload)
      setEditing(null); refresh()
      toast({ title: editing.id ? t('employees.employeeUpdated') : t('employees.employeeAdded'), tone: 'success' })
    } catch (e) { toast({ title: t('common.saveFailed'), message: e.message, tone: 'error' }) }
  }
  const doExport = async () => { const r = await exportExcel('employees', 'Employees'); if (r.ok) toast({ title: t('common.exportedToExcel'), message: t('common.exportedRows', { count: r.count }), tone: 'success' }) }
  const doImport = async () => { const r = await importExcel('employees', user.role); if (r.ok) { refresh(); toast({ title: t('common.importComplete'), message: t('common.importSummary', { inserted: r.inserted, updated: r.updated, skipped: 0 }), tone: 'success' }) } else if (!r.canceled) toast({ title: t('common.importFailed'), message: r.error, tone: 'error' }) }

  const columns = [
    { key: 'name', label: t('employees.colEmployee'), render: (r) => <div className="flex items-center gap-2.5"><Avatar name={r.full_name} size={32} /><div className="leading-tight"><div style={{ fontWeight: 500, color: 'var(--text)' }}>{r.full_name}</div><div style={{ fontSize: 11.5, color: 'var(--faint)' }}>{r.emp_id}</div></div></div> },
    { key: 'department', label: t('employees.colDepartment'), render: (r) => <Badge tone="primary">{r.department}</Badge> },
    { key: 'position', label: t('employees.colPosition') },
    { key: 'nationality', label: t('employees.colNationality') },
    { key: 'phone', label: t('employees.colPhone') },
    { key: 'status', label: t('employees.colStatus'), render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
  ]

  return (
    <div className="fade-in">
      <PageHeader icon={Users} title={t('employees.title')} subtitle={t('employees.subtitle')}>
        <button className="btn btn-sm" onClick={doExport}><Download size={15} /> {t('common.export')}</button>
        {canEdit && <button className="btn btn-sm" onClick={doImport}><Upload size={15} /> {t('employees.importExcel')}</button>}
        {canEdit && <button className="btn btn-primary btn-sm" onClick={() => setEditing({})}><Plus size={15} /> {t('employees.newEmployee')}</button>}
      </PageHeader>

      <Card pad={false}>
        <div className="flex items-center justify-between gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="relative" style={{ width: 320, maxWidth: '50%' }}>
            <Search size={15} style={{ position: 'absolute', insetInlineStart: 11, top: 11, color: 'var(--faint)' }} />
            <input className="input" style={{ paddingInlineStart: 32, height: 36 }} placeholder={t('employees.searchPlaceholder')} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="text-[12.5px]" style={{ color: 'var(--muted)' }}>{t('employees.countLabel', { count: filtered.length })}</div>
        </div>
        {loading ? <Spinner /> : (
          <DataTable columns={columns} rows={filtered} onRowClick={(r) => setOpenId(r.emp_id)}
            actions={canEdit ? (r) => <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditing(r)}><Pencil size={14} /></button> : undefined} />
        )}
      </Card>

      {openId && <ProfileDrawer emp_id={openId} onClose={() => setOpenId(null)} onEdit={(d) => { setOpenId(null); setEditing(d) }} />}
      {editing && (
        <Modal wide title={editing.id ? t('employees.editEmployee') : t('employees.newEmployee')} onClose={() => setEditing(null)}>
          <Form fields={empFields(t)} initial={editing} onSubmit={save} onCancel={() => setEditing(null)} submitLabel={editing.id ? t('common.saveChanges') : t('common.create')} />
        </Modal>
      )}
    </div>
  )
}
