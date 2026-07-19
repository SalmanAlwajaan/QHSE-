import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Search, Download, ClipboardCheck, ScanLine, Check, Minus, X } from 'lucide-react'
import { call, useQuery, exportExcel } from '../lib/api.js'
import { useApp } from '../lib/store.jsx'
import { PageHeader, Card, Spinner, Modal, Badge } from '../components/ui.jsx'
import DataTable from '../components/DataTable.jsx'
import { fmtDate, statusTone } from '../lib/format.js'

// Canonical (English) template keys — stored in inspection_type and matched
// against asset_type from the DB. Display text comes from inspectionTemplates.* via t().
const TEMPLATE_KEYS = { 'Site Safety': 'siteSafety', Vehicle: 'vehicle', Equipment: 'equipment' }
const templatesFor = (t) => Object.fromEntries(Object.entries(TEMPLATE_KEYS).map(([canon, key]) => [canon, t(`inspectionTemplates.${key}.items`, { returnObjects: true })]))
const typeForAsset = (t) => (t === 'Vehicle' ? 'Vehicle' : t === 'Equipment' ? 'Equipment' : 'Site Safety')

function InspectionForm({ onSave, onCancel }) {
  const { t } = useTranslation()
  const TEMPLATES = templatesFor(t)
  const { user } = useApp()
  const [assets, setAssets] = useState([])
  const [assetId, setAssetId] = useState('')
  const [type, setType] = useState('Site Safety')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [inspector, setInspector] = useState(user.full_name)
  const [items, setItems] = useState(TEMPLATES['Site Safety'].map((i) => ({ item: i, result: 'OK', remark: '' })))
  const [notes, setNotes] = useState('')

  useEffect(() => { call('options.assets').then(setAssets).catch(() => {}) }, [])
  const asset = useMemo(() => assets.find((a) => String(a.id) === String(assetId)), [assets, assetId])

  const pickAsset = (id) => {
    setAssetId(id)
    const a = assets.find((x) => String(x.id) === String(id))
    if (a) { const ty = typeForAsset(a.asset_type); setType(ty); setItems(TEMPLATES[ty].map((i) => ({ item: i, result: 'OK', remark: '' }))) }
  }
  const changeType = (ty) => { setType(ty); setItems(TEMPLATES[ty].map((i) => ({ item: i, result: 'OK', remark: '' }))) }
  const setItem = (idx, patch) => setItems((arr) => arr.map((it, i) => (i === idx ? { ...it, ...patch } : it)))

  const { score, result } = useMemo(() => {
    const applic = items.filter((i) => i.result !== 'N/A')
    const ok = applic.filter((i) => i.result === 'OK').length
    const sc = applic.length ? Math.round((ok / applic.length) * 100) : 100
    const anyFail = items.some((i) => i.result === 'Not OK')
    const res = !anyFail ? 'Pass' : sc >= 70 ? 'Conditional' : 'Fail'
    return { score: sc, result: res }
  }, [items])

  const save = () => {
    if (!assetId) return
    onSave({
      asset_id: Number(assetId), inspection_type: type, inspector, inspection_date: date,
      result, score, location: asset?.identifier || '', notes, checklist: JSON.stringify(items), _actor: user.username, _role: user.role,
    })
  }

  const resultBtn = (idx, val, Icon, tone) => {
    const on = items[idx].result === val
    return <button type="button" onClick={() => setItem(idx, { result: val })} className="btn btn-sm" style={{ height: 28, padding: '0 8px', background: on ? `var(--${tone}-soft)` : 'transparent', color: on ? `var(--${tone}-text)` : 'var(--muted)', borderColor: on ? `var(--${tone}-text)` : 'var(--border-strong)' }}><Icon size={13} /></button>
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="col-span-2">
          <label className="label">{t('inspections.assetLabel')}</label>
          <div className="relative">
            <ScanLine size={15} style={{ position: 'absolute', insetInlineStart: 11, top: 12, color: 'var(--primary-text)' }} />
            <select className="select" style={{ paddingInlineStart: 32 }} value={assetId} onChange={(e) => pickAsset(e.target.value)}>
              <option value="">{t('inspections.selectAsset')}</option>
              {assets.map((a) => <option key={a.id} value={a.id}>{a.name} · {a.identifier} {a.tag_id ? `· ${a.tag_type} ${a.tag_id}` : ''}</option>)}
            </select>
          </div>
          {asset && <div className="text-[11.5px] mt-1.5 flex items-center gap-2" style={{ color: 'var(--faint)' }}>{asset.tag_id ? <><Badge tone="blue">{asset.tag_type}</Badge> {t('inspections.tagLogged', { tagId: asset.tag_id })}</> : t('inspections.noTagRegistered')}</div>}
        </div>
        <div><label className="label">{t('inspections.inspectionType')}</label>
          <select className="select" value={type} onChange={(e) => changeType(e.target.value)}>
            {Object.keys(TEMPLATE_KEYS).map((canon) => <option key={canon} value={canon}>{t(`inspectionTemplates.${TEMPLATE_KEYS[canon]}.label`)}</option>)}
          </select>
        </div>
        <div><label className="label">{t('inspections.date')}</label><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <div className="col-span-2"><label className="label">{t('inspections.inspector')}</label><input className="input" value={inspector} onChange={(e) => setInspector(e.target.value)} /></div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="label" style={{ marginBottom: 0 }}>{t('inspections.checklist')}</span>
        <div className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--muted)' }}>{t('inspections.score')} <b style={{ color: 'var(--text)' }}>{score}%</b> <Badge tone={statusTone(result)}>{result}</Badge></div>
      </div>
      <div className="card" style={{ padding: '4px 12px' }}>
        {items.map((it, idx) => (
          <div key={idx} className="flex items-center gap-3 py-2" style={{ borderBottom: idx < items.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div className="flex-1 text-[13px]" style={{ color: 'var(--text)' }}>{it.item}</div>
            {it.result === 'Not OK' && <input className="input" style={{ height: 28, width: 150, fontSize: 12 }} placeholder={t('inspections.remarkPlaceholder')} value={it.remark} onChange={(e) => setItem(idx, { remark: e.target.value })} />}
            <div className="flex items-center gap-1">
              {resultBtn(idx, 'OK', Check, 'success')}
              {resultBtn(idx, 'Not OK', X, 'danger')}
              {resultBtn(idx, 'N/A', Minus, 'warning')}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3"><label className="label">{t('inspections.notes')}</label><textarea className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('inspections.notesPlaceholder')} /></div>

      <div className="flex items-center justify-end gap-2 mt-5">
        <button className="btn" onClick={onCancel}>{t('common.cancel')}</button>
        <button className="btn btn-primary" onClick={save} disabled={!assetId}>{t('inspections.submitInspection')}</button>
      </div>
    </div>
  )
}

function ViewInspection({ row, onClose }) {
  const { t } = useTranslation()
  let items = []
  try { items = JSON.parse(row.checklist || '[]') } catch { /* noop */ }
  return (
    <Modal wide title={`${row.asset_name || t('inspections.title')} — ${fmtDate(row.inspection_date)}`} subtitle={`${row.inspection_type} · ${row.inspector}`} onClose={onClose}>
      <div className="flex items-center gap-3 mb-4">
        <Badge tone={statusTone(row.result)}>{row.result}</Badge>
        <span className="text-[13px]" style={{ color: 'var(--muted)' }}>{t('inspections.score')} {row.score}%</span>
        <span className="text-[13px]" style={{ color: 'var(--muted)' }}>· {row.asset_identifier}</span>
      </div>
      <div className="card" style={{ padding: '4px 14px' }}>
        {items.map((it, i) => (
          <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <span className="text-[13px]" style={{ color: 'var(--text)' }}>{it.item} {it.remark && <span style={{ color: 'var(--faint)' }}>— {it.remark}</span>}</span>
            <Badge tone={it.result === 'OK' ? 'green' : it.result === 'Not OK' ? 'red' : 'amber'}>{it.result}</Badge>
          </div>
        ))}
      </div>
      {row.notes && <div className="mt-4"><div className="label">{t('inspections.notes')}</div><p className="text-[13px]" style={{ color: 'var(--muted)' }}>{row.notes}</p></div>}
    </Modal>
  )
}

export default function Inspections() {
  const { t } = useTranslation()
  const { user, toast, can } = useApp()
  const { data: rows, loading, refresh } = useQuery('inspections.list')
  const [q, setQ] = useState('')
  const [creating, setCreating] = useState(false)
  const [viewing, setViewing] = useState(null)
  const canEdit = can('inspections')

  const filtered = useMemo(() => {
    if (!rows) return []
    if (!q.trim()) return rows
    const s = q.toLowerCase()
    return rows.filter((r) => ['asset_name', 'asset_identifier', 'inspector', 'inspection_type', 'result'].some((k) => String(r[k] ?? '').toLowerCase().includes(s)))
  }, [rows, q])

  const save = async (data) => {
    try { await call('inspections.create', data); setCreating(false); refresh(); toast({ title: t('inspections.inspectionLogged'), tone: 'success' }) }
    catch (e) { toast({ title: t('inspections.failed'), message: e.message, tone: 'error' }) }
  }

  const columns = [
    { key: 'inspection_date', label: t('inspections.colDate'), render: (r) => fmtDate(r.inspection_date) },
    { key: 'asset_name', label: t('inspections.colAsset'), render: (r) => <div className="leading-tight"><div style={{ fontWeight: 500, color: 'var(--text)' }}>{r.asset_name}</div><div style={{ fontSize: 11.5, color: 'var(--faint)' }}>{r.asset_identifier}</div></div> },
    { key: 'inspection_type', label: t('inspections.colType'), render: (r) => <Badge tone="gray">{r.inspection_type}</Badge> },
    { key: 'inspector', label: t('inspections.colInspector') },
    { key: 'score', label: t('inspections.colScore'), align: 'right', render: (r) => `${r.score ?? '—'}%` },
    { key: 'result', label: t('inspections.colResult'), render: (r) => <Badge tone={statusTone(r.result)}>{r.result}</Badge> },
  ]

  return (
    <div className="fade-in">
      <PageHeader icon={ClipboardCheck} title={t('inspections.title')} subtitle={t('inspections.subtitle')}>
        <button className="btn btn-sm" onClick={async () => { const r = await exportExcel('inspections', 'Inspections'); if (r.ok) toast({ title: t('common.exportedToExcel'), message: t('common.exportedRows', { count: r.count }), tone: 'success' }) }}><Download size={15} /> {t('common.export')}</button>
        {canEdit && <button className="btn btn-primary btn-sm" onClick={() => setCreating(true)}><Plus size={15} /> {t('inspections.newInspection')}</button>}
      </PageHeader>

      <Card pad={false}>
        <div className="flex items-center justify-between gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="relative" style={{ width: 320, maxWidth: '50%' }}>
            <Search size={15} style={{ position: 'absolute', insetInlineStart: 11, top: 11, color: 'var(--faint)' }} />
            <input className="input" style={{ paddingInlineStart: 32, height: 36 }} placeholder={t('inspections.searchPlaceholder')} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="text-[12.5px]" style={{ color: 'var(--muted)' }}>{t('inspections.countLabel', { count: filtered.length })}</div>
        </div>
        {loading ? <Spinner /> : <DataTable columns={columns} rows={filtered} onRowClick={(r) => setViewing(r)} />}
      </Card>

      {creating && <Modal wide title={t('inspections.newInspection')} subtitle={t('inspections.newInspectionSubtitle')} onClose={() => setCreating(false)}><InspectionForm onSave={save} onCancel={() => setCreating(false)} /></Modal>}
      {viewing && <ViewInspection row={viewing} onClose={() => setViewing(null)} />}
    </div>
  )
}
