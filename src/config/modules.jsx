import React from 'react'
import {
  LayoutDashboard, Users, IdCard, Award, GraduationCap, HardHat, ShieldCheck,
  Tags, ClipboardCheck, FileText, Leaf, FileWarning, ClipboardList, Briefcase, ListChecks, Settings,
} from 'lucide-react'
import { Badge, Progress } from '../components/ui.jsx'
import { fmtDate, expiryStatus, statusTone } from '../lib/format.js'

// ---- shared cell renderers ----
const emp = (r) => (
  <div className="leading-tight">
    <div style={{ color: 'var(--text)', fontWeight: 500 }}>{r.emp_name || '—'}</div>
    <div style={{ color: 'var(--faint)', fontSize: 11.5 }}>{r.emp_id}</div>
  </div>
)
const dt = (k) => (r) => fmtDate(r[k])
const exp = (k) => (r) => { const s = expiryStatus(r[k]); return <Badge tone={s.tone}>{s.key === 'none' ? '—' : s.label}</Badge> }
const st = (k) => (r) => r[k] ? <Badge tone={statusTone(r[k])}>{r[k]}</Badge> : <span style={{ color: 'var(--faint)' }}>—</span>

// A dropdown option whose stored `value` stays the canonical English enum
// (used in SQL filters / seed data) while the displayed `label` is translated.
const opt = (t, value, key) => ({ value, label: t(`options.${key}`, value) })

export function getModules(t) {
  const CARD_TYPES = [
    opt(t, 'Iqama', 'iqama'), opt(t, 'Industrial Security Card', 'industrial_security_card'),
    opt(t, 'Baladiya (Municipality)', 'baladiya_municipality'), opt(t, 'Passport', 'passport'),
    opt(t, 'Driving License', 'driving_license'), opt(t, 'Health Certificate', 'health_certificate'), opt(t, 'Other', 'other'),
  ]

  return {
    cards: {
      domain: 'cards', table: 'id_cards', title: t('modules.cards.title'), subtitle: t('modules.cards.subtitle'), icon: IdCard,
      canImport: true, importNote: t('modules.cards.importNote'),
      searchKeys: ['emp_name', 'emp_id', 'card_type', 'card_number'],
      columns: [
        { key: 'emp', label: t('modules.cards.columns.emp'), render: emp },
        { key: 'card_type', label: t('modules.cards.columns.card_type'), render: (r) => <Badge tone="blue">{r.card_type}</Badge> },
        { key: 'card_number', label: t('modules.cards.columns.card_number') },
        { key: 'issue_date', label: t('modules.cards.columns.issue_date'), render: dt('issue_date') },
        { key: 'expiry_date', label: t('modules.cards.columns.expiry_date'), render: (r) => <div className="flex items-center gap-2">{fmtDate(r.expiry_date)} {exp('expiry_date')(r)}</div> },
      ],
      fields: [
        { name: 'emp_id', label: t('modules.cards.fields.emp_id'), type: 'select', source: 'employees', required: true },
        { name: 'card_type', label: t('modules.cards.fields.card_type'), type: 'select', options: CARD_TYPES, required: true },
        { name: 'card_number', label: t('modules.cards.fields.card_number'), required: true },
        { name: 'issue_date', label: t('modules.cards.fields.issue_date'), type: 'date' },
        { name: 'expiry_date', label: t('modules.cards.fields.expiry_date'), type: 'date' },
        { name: 'notes', label: t('modules.cards.fields.notes'), type: 'textarea' },
      ],
    },

    licenses: {
      domain: 'licenses', table: 'licenses', title: t('modules.licenses.title'), subtitle: t('modules.licenses.subtitle'), icon: Award,
      canImport: true, searchKeys: ['emp_name', 'license_type', 'license_number', 'issuing_authority'],
      columns: [
        { key: 'emp', label: t('modules.licenses.columns.emp'), render: emp },
        { key: 'license_type', label: t('modules.licenses.columns.license_type') },
        { key: 'license_number', label: t('modules.licenses.columns.license_number') },
        { key: 'issuing_authority', label: t('modules.licenses.columns.issuing_authority') },
        { key: 'expiry_date', label: t('modules.licenses.columns.expiry_date'), render: (r) => <div className="flex items-center gap-2">{fmtDate(r.expiry_date)} {exp('expiry_date')(r)}</div> },
      ],
      fields: [
        { name: 'emp_id', label: t('modules.licenses.fields.emp_id'), type: 'select', source: 'employees', required: true },
        { name: 'license_type', label: t('modules.licenses.fields.license_type'), required: true, placeholder: t('modules.licenses.fields.license_type_ph') },
        { name: 'license_number', label: t('modules.licenses.fields.license_number') },
        { name: 'issuing_authority', label: t('modules.licenses.fields.issuing_authority') },
        { name: 'issue_date', label: t('modules.licenses.fields.issue_date'), type: 'date' },
        { name: 'expiry_date', label: t('modules.licenses.fields.expiry_date'), type: 'date' },
        { name: 'notes', label: t('modules.licenses.fields.notes'), type: 'textarea' },
      ],
    },

    courses: {
      domain: 'courses', table: 'courses', title: t('modules.courses.title'), subtitle: t('modules.courses.subtitle'), icon: GraduationCap,
      canImport: true, searchKeys: ['emp_name', 'course_name', 'provider', 'certificate_no'],
      columns: [
        { key: 'emp', label: t('modules.courses.columns.emp'), render: emp },
        { key: 'course_name', label: t('modules.courses.columns.course_name') },
        { key: 'provider', label: t('modules.courses.columns.provider') },
        { key: 'completion_date', label: t('modules.courses.columns.completion_date'), render: dt('completion_date') },
        { key: 'expiry_date', label: t('modules.courses.columns.expiry_date'), render: exp('expiry_date') },
      ],
      fields: [
        { name: 'emp_id', label: t('modules.courses.fields.emp_id'), type: 'select', source: 'employees', required: true },
        { name: 'course_name', label: t('modules.courses.fields.course_name'), required: true },
        { name: 'provider', label: t('modules.courses.fields.provider') },
        { name: 'completion_date', label: t('modules.courses.fields.completion_date'), type: 'date' },
        { name: 'expiry_date', label: t('modules.courses.fields.expiry_date'), type: 'date' },
        { name: 'certificate_no', label: t('modules.courses.fields.certificate_no') },
        { name: 'notes', label: t('modules.courses.fields.notes'), type: 'textarea' },
      ],
    },

    ppe_stock: {
      domain: 'ppeItems', table: 'ppe_items', title: t('modules.ppe_stock.title'), subtitle: t('modules.ppe_stock.subtitle'), icon: HardHat,
      searchKeys: ['name', 'category'], newLabel: t('modules.ppe_stock.newLabel'),
      columns: [
        { key: 'name', label: t('modules.ppe_stock.columns.name'), render: (r) => <span style={{ fontWeight: 500 }}>{r.name}</span> },
        { key: 'category', label: t('modules.ppe_stock.columns.category'), render: (r) => <Badge tone="gray">{r.category}</Badge> },
        { key: 'size_options', label: t('modules.ppe_stock.columns.size_options') },
        { key: 'stock_qty', label: t('modules.ppe_stock.columns.stock_qty'), align: 'right', render: (r) => <span style={{ color: r.stock_qty <= r.min_stock ? 'var(--danger-text)' : 'var(--text)', fontWeight: 500 }}>{r.stock_qty} {r.unit}</span> },
        { key: 'min_stock', label: t('modules.ppe_stock.columns.min_stock'), align: 'right' },
        { key: 'level', label: t('modules.ppe_stock.columns.level'), render: (r) => r.stock_qty <= r.min_stock ? <Badge tone="red">{t('modules.ppe_stock.lowStock')}</Badge> : <Badge tone="green">{t('modules.ppe_stock.ok')}</Badge> },
      ],
      fields: [
        { name: 'name', label: t('modules.ppe_stock.fields.name'), required: true, full: true },
        { name: 'category', label: t('modules.ppe_stock.fields.category'), type: 'select', options: [opt(t, 'Head', 'head'), opt(t, 'Eye', 'eye'), opt(t, 'Hand', 'hand'), opt(t, 'Body', 'body'), opt(t, 'Foot', 'foot'), opt(t, 'Hearing', 'hearing'), opt(t, 'Respiratory', 'respiratory'), opt(t, 'Fall protection', 'fall_protection'), opt(t, 'Other', 'other')] },
        { name: 'unit', label: t('modules.ppe_stock.fields.unit'), placeholder: t('modules.ppe_stock.fields.unit_ph') },
        { name: 'size_options', label: t('modules.ppe_stock.fields.size_options') },
        { name: 'stock_qty', label: t('modules.ppe_stock.fields.stock_qty'), type: 'number' },
        { name: 'min_stock', label: t('modules.ppe_stock.fields.min_stock'), type: 'number' },
      ],
    },

    ppe_issued: {
      domain: 'ppeIssues', table: 'ppe_issues', title: t('modules.ppe_issued.title'), subtitle: t('modules.ppe_issued.subtitle'), icon: ShieldCheck,
      searchKeys: ['emp_name', 'item_name'], newLabel: t('modules.ppe_issued.newLabel'),
      columns: [
        { key: 'emp', label: t('modules.ppe_issued.columns.emp'), render: emp },
        { key: 'item_name', label: t('modules.ppe_issued.columns.item_name') },
        { key: 'size', label: t('modules.ppe_issued.columns.size') },
        { key: 'quantity', label: t('modules.ppe_issued.columns.quantity'), align: 'right' },
        { key: 'issue_date', label: t('modules.ppe_issued.columns.issue_date'), render: dt('issue_date') },
        { key: 'expiry_date', label: t('modules.ppe_issued.columns.expiry_date'), render: exp('expiry_date') },
        { key: 'acknowledged', label: t('modules.ppe_issued.columns.acknowledged'), render: (r) => r.acknowledged ? <Badge tone="green">{t('modules.ppe_issued.signed')}</Badge> : <Badge tone="amber">{t('modules.ppe_issued.pending')}</Badge> },
        { key: 'status', label: t('modules.ppe_issued.columns.status'), render: st('status') },
      ],
      fields: [
        { name: 'emp_id', label: t('modules.ppe_issued.fields.emp_id'), type: 'select', source: 'employees', required: true },
        { name: 'ppe_item_id', label: t('modules.ppe_issued.fields.ppe_item_id'), type: 'select', source: 'ppeItems', required: true },
        { name: 'size', label: t('modules.ppe_issued.fields.size') },
        { name: 'quantity', label: t('modules.ppe_issued.fields.quantity'), type: 'number' },
        { name: 'issue_date', label: t('modules.ppe_issued.fields.issue_date'), type: 'date' },
        { name: 'expiry_date', label: t('modules.ppe_issued.fields.expiry_date'), type: 'date' },
        { name: 'status', label: t('modules.ppe_issued.fields.status'), type: 'select', options: [opt(t, 'Issued', 'issued'), opt(t, 'Returned', 'returned'), opt(t, 'Lost', 'lost'), opt(t, 'Expired', 'expired')] },
        { name: 'acknowledged', label: t('modules.ppe_issued.fields.acknowledged'), type: 'checkbox', checkboxLabel: t('modules.ppe_issued.fields.acknowledgedLabel') },
        { name: 'notes', label: t('modules.ppe_issued.fields.notes'), type: 'textarea' },
      ],
    },

    assets: {
      domain: 'assets', table: 'assets', title: t('modules.assets.title'), subtitle: t('modules.assets.subtitle'), icon: Tags,
      searchKeys: ['name', 'identifier', 'tag_id', 'location'], newLabel: t('modules.assets.newLabel'),
      columns: [
        { key: 'name', label: t('modules.assets.columns.name'), render: (r) => <span style={{ fontWeight: 500 }}>{r.name}</span> },
        { key: 'asset_type', label: t('modules.assets.columns.asset_type'), render: (r) => <Badge tone="gray">{r.asset_type}</Badge> },
        { key: 'identifier', label: t('modules.assets.columns.identifier') },
        { key: 'tag', label: t('modules.assets.columns.tag'), render: (r) => r.tag_id ? <span className="flex items-center gap-2"><Badge tone="blue">{r.tag_type}</Badge><span style={{ color: 'var(--muted)' }}>{r.tag_id}</span></span> : t('modules.assets.noTag') },
        { key: 'location', label: t('modules.assets.columns.location') },
        { key: 'status', label: t('modules.assets.columns.status'), render: st('status') },
      ],
      fields: [
        { name: 'asset_type', label: t('modules.assets.fields.asset_type'), type: 'select', options: [opt(t, 'Job Site', 'job_site'), opt(t, 'Vehicle', 'vehicle'), opt(t, 'Equipment', 'equipment')], required: true },
        { name: 'name', label: t('modules.assets.fields.name'), required: true, full: true },
        { name: 'identifier', label: t('modules.assets.fields.identifier'), placeholder: t('modules.assets.fields.identifier_ph'), required: true },
        { name: 'tag_type', label: t('modules.assets.fields.tag_type'), type: 'select', options: [opt(t, 'NFC', 'nfc'), opt(t, 'QR', 'qr'), opt(t, 'Barcode', 'barcode'), opt(t, 'None', 'none')] },
        { name: 'tag_id', label: t('modules.assets.fields.tag_id'), placeholder: t('modules.assets.fields.tag_id_ph') },
        { name: 'location', label: t('modules.assets.fields.location') },
        { name: 'status', label: t('modules.assets.fields.status'), type: 'select', options: [opt(t, 'Active', 'active'), opt(t, 'Inactive', 'inactive')] },
      ],
    },

    environment: {
      domain: 'environment', table: 'environment_records', title: t('modules.environment.title'), subtitle: t('modules.environment.subtitle'), icon: Leaf,
      canImport: true, searchKeys: ['record_type', 'location', 'project_name'], newLabel: t('modules.environment.newLabel'),
      columns: [
        { key: 'record_type', label: t('modules.environment.columns.record_type'), render: (r) => <span style={{ fontWeight: 500 }}>{r.record_type}</span> },
        { key: 'location', label: t('modules.environment.columns.location') },
        { key: 'project_name', label: t('modules.environment.columns.project_name') },
        { key: 'quantity', label: t('modules.environment.columns.quantity'), align: 'right', render: (r) => r.quantity != null ? `${r.quantity} ${r.unit || ''}` : '—' },
        { key: 'scheduled_date', label: t('modules.environment.columns.scheduled_date'), render: dt('scheduled_date') },
        { key: 'status', label: t('modules.environment.columns.status'), render: st('status') },
      ],
      fields: [
        { name: 'record_type', label: t('modules.environment.fields.record_type'), type: 'select', options: [opt(t, 'Transformer Cooling Oil Pulled', 'transformer_cooling_oil_pulled'), opt(t, 'Staking Return', 'staking_return'), opt(t, 'Waste Removal', 'waste_removal'), opt(t, 'Spill Report', 'spill_report'), opt(t, 'Emission Log', 'emission_log'), opt(t, 'Other', 'other')], required: true },
        { name: 'location', label: t('modules.environment.fields.location') },
        { name: 'project_id', label: t('modules.environment.fields.project_id'), type: 'select', source: 'projects' },
        { name: 'quantity', label: t('modules.environment.fields.quantity'), type: 'number', step: 'any' },
        { name: 'unit', label: t('modules.environment.fields.unit'), placeholder: t('modules.environment.fields.unit_ph') },
        { name: 'scheduled_date', label: t('modules.environment.fields.scheduled_date'), type: 'date' },
        { name: 'completed_date', label: t('modules.environment.fields.completed_date'), type: 'date' },
        { name: 'status', label: t('modules.environment.fields.status'), type: 'select', options: [opt(t, 'Scheduled', 'scheduled'), opt(t, 'In Progress', 'in_progress'), opt(t, 'Completed', 'completed'), opt(t, 'Overdue', 'overdue')] },
        { name: 'notes', label: t('modules.environment.fields.notes'), type: 'textarea' },
      ],
    },

    ncr: {
      domain: 'ncr', table: 'quality_ncr', title: t('modules.ncr.title'), subtitle: t('modules.ncr.subtitle'), icon: FileWarning,
      searchKeys: ['ncr_number', 'project_name', 'category', 'description'], newLabel: t('modules.ncr.newLabel'),
      columns: [
        { key: 'ncr_number', label: t('modules.ncr.columns.ncr_number'), render: (r) => <span style={{ fontWeight: 500 }}>{r.ncr_number}</span> },
        { key: 'project_name', label: t('modules.ncr.columns.project_name') },
        { key: 'category', label: t('modules.ncr.columns.category') },
        { key: 'severity', label: t('modules.ncr.columns.severity'), render: st('severity') },
        { key: 'date_raised', label: t('modules.ncr.columns.date_raised'), render: dt('date_raised') },
        { key: 'status', label: t('modules.ncr.columns.status'), render: st('status') },
      ],
      fields: [
        { name: 'ncr_number', label: t('modules.ncr.fields.ncr_number'), required: true },
        { name: 'project_id', label: t('modules.ncr.fields.project_id'), type: 'select', source: 'projects' },
        { name: 'raised_by', label: t('modules.ncr.fields.raised_by') },
        { name: 'date_raised', label: t('modules.ncr.fields.date_raised'), type: 'date' },
        { name: 'category', label: t('modules.ncr.fields.category'), type: 'select', options: [opt(t, 'Workmanship', 'workmanship'), opt(t, 'Material', 'material'), opt(t, 'Documentation', 'documentation'), opt(t, 'Safety', 'safety'), opt(t, 'Process', 'process'), opt(t, 'Other', 'other')] },
        { name: 'severity', label: t('modules.ncr.fields.severity'), type: 'select', options: [opt(t, 'Minor', 'minor'), opt(t, 'Major', 'major'), opt(t, 'Critical', 'critical')] },
        { name: 'description', label: t('modules.ncr.fields.description'), type: 'textarea', required: true },
        { name: 'root_cause', label: t('modules.ncr.fields.root_cause'), type: 'textarea' },
        { name: 'corrective_action', label: t('modules.ncr.fields.corrective_action'), type: 'textarea' },
        { name: 'status', label: t('modules.ncr.fields.status'), type: 'select', options: [opt(t, 'Open', 'open'), opt(t, 'In Progress', 'in_progress'), opt(t, 'Closed', 'closed')] },
        { name: 'closed_date', label: t('modules.ncr.fields.closed_date'), type: 'date' },
      ],
    },

    audits: {
      domain: 'audits', table: 'quality_audits', title: t('modules.audits.title'), subtitle: t('modules.audits.subtitle'), icon: ClipboardList,
      searchKeys: ['area', 'auditor', 'audit_type'], newLabel: t('modules.audits.newLabel'),
      columns: [
        { key: 'audit_type', label: t('modules.audits.columns.audit_type'), render: (r) => <Badge tone="blue">{r.audit_type}</Badge> },
        { key: 'area', label: t('modules.audits.columns.area'), render: (r) => <span style={{ fontWeight: 500 }}>{r.area}</span> },
        { key: 'auditor', label: t('modules.audits.columns.auditor') },
        { key: 'audit_date', label: t('modules.audits.columns.audit_date'), render: dt('audit_date') },
        { key: 'score', label: t('modules.audits.columns.score'), align: 'right', render: (r) => r.score != null ? `${r.score}%` : '—' },
        { key: 'findings_count', label: t('modules.audits.columns.findings_count'), align: 'right' },
        { key: 'status', label: t('modules.audits.columns.status'), render: st('status') },
      ],
      fields: [
        { name: 'audit_type', label: t('modules.audits.fields.audit_type'), type: 'select', options: [opt(t, 'Internal', 'internal'), opt(t, 'External', 'external'), opt(t, 'Client', 'client'), opt(t, 'Certification', 'certification')] },
        { name: 'area', label: t('modules.audits.fields.area'), required: true },
        { name: 'auditor', label: t('modules.audits.fields.auditor') },
        { name: 'audit_date', label: t('modules.audits.fields.audit_date'), type: 'date' },
        { name: 'score', label: t('modules.audits.fields.score'), type: 'number' },
        { name: 'findings_count', label: t('modules.audits.fields.findings_count'), type: 'number' },
        { name: 'status', label: t('modules.audits.fields.status'), type: 'select', options: [opt(t, 'Planned', 'planned'), opt(t, 'In Progress', 'in_progress'), opt(t, 'Completed', 'completed')] },
        { name: 'notes', label: t('modules.audits.fields.notes'), type: 'textarea' },
      ],
    },

    projects: {
      domain: 'projects', table: 'projects', title: t('modules.projects.title'), subtitle: t('modules.projects.subtitle'), icon: Briefcase,
      searchKeys: ['project_code', 'name', 'client', 'manager'], newLabel: t('modules.projects.newLabel'),
      columns: [
        { key: 'project_code', label: t('modules.projects.columns.project_code'), render: (r) => <span style={{ fontWeight: 500 }}>{r.project_code}</span> },
        { key: 'name', label: t('modules.projects.columns.name') },
        { key: 'client', label: t('modules.projects.columns.client') },
        { key: 'manager', label: t('modules.projects.columns.manager') },
        { key: 'progress', label: t('modules.projects.columns.progress'), render: (r) => <div className="flex items-center gap-2"><Progress value={r.progress} /><span style={{ color: 'var(--muted)', fontSize: 12 }}>{r.progress}%</span></div> },
        { key: 'status', label: t('modules.projects.columns.status'), render: st('status') },
      ],
      fields: [
        { name: 'project_code', label: t('modules.projects.fields.project_code'), required: true },
        { name: 'name', label: t('modules.projects.fields.name'), required: true, full: true },
        { name: 'client', label: t('modules.projects.fields.client') },
        { name: 'location', label: t('modules.projects.fields.location') },
        { name: 'manager', label: t('modules.projects.fields.manager') },
        { name: 'start_date', label: t('modules.projects.fields.start_date'), type: 'date' },
        { name: 'end_date', label: t('modules.projects.fields.end_date'), type: 'date' },
        { name: 'status', label: t('modules.projects.fields.status'), type: 'select', options: [opt(t, 'Active', 'active'), opt(t, 'On Hold', 'on_hold'), opt(t, 'Completed', 'completed'), opt(t, 'Cancelled', 'cancelled')] },
        { name: 'progress', label: t('modules.projects.fields.progress'), type: 'number' },
        { name: 'description', label: t('modules.projects.fields.description'), type: 'textarea' },
      ],
    },

    tasks: {
      domain: 'tasks', table: 'tasks', title: t('modules.tasks.title'), subtitle: t('modules.tasks.subtitle'), icon: ListChecks,
      searchKeys: ['title', 'project_name', 'assignee_name'], newLabel: t('modules.tasks.newLabel'),
      columns: [
        { key: 'title', label: t('modules.tasks.columns.title'), render: (r) => <span style={{ fontWeight: 500 }}>{r.title}</span> },
        { key: 'project_name', label: t('modules.tasks.columns.project_name') },
        { key: 'assignee_name', label: t('modules.tasks.columns.assignee_name') },
        { key: 'priority', label: t('modules.tasks.columns.priority'), render: (r) => <Badge tone={r.priority === 'Urgent' || r.priority === 'High' ? 'red' : r.priority === 'Medium' ? 'amber' : 'gray'}>{r.priority}</Badge> },
        { key: 'due_date', label: t('modules.tasks.columns.due_date'), render: (r) => <div className="flex items-center gap-2">{fmtDate(r.due_date)} {r.status !== 'Done' && exp('due_date')(r)}</div> },
        { key: 'status', label: t('modules.tasks.columns.status'), render: st('status') },
      ],
      fields: [
        { name: 'project_id', label: t('modules.tasks.fields.project_id'), type: 'select', source: 'projects', required: true },
        { name: 'title', label: t('modules.tasks.fields.title'), required: true, full: true },
        { name: 'assigned_to', label: t('modules.tasks.fields.assigned_to'), type: 'select', source: 'employees' },
        { name: 'priority', label: t('modules.tasks.fields.priority'), type: 'select', options: [opt(t, 'Low', 'low'), opt(t, 'Medium', 'medium'), opt(t, 'High', 'high'), opt(t, 'Urgent', 'urgent')] },
        { name: 'status', label: t('modules.tasks.fields.status'), type: 'select', options: [opt(t, 'Open', 'open'), opt(t, 'In Progress', 'in_progress'), opt(t, 'Done', 'done'), opt(t, 'Blocked', 'blocked')] },
        { name: 'due_date', label: t('modules.tasks.fields.due_date'), type: 'date' },
        { name: 'description', label: t('modules.tasks.fields.description'), type: 'textarea' },
      ],
    },
  }
}

// ---- navigation ----
export function getNav(t) {
  return [
    { group: t('nav.groups.overview'), items: [{ id: 'dashboard', label: t('nav.items.dashboard'), icon: LayoutDashboard, custom: true }] },
    { group: t('nav.groups.peopleCompliance'), items: [
      { id: 'employees', label: t('nav.items.employees'), icon: Users, custom: true },
      { id: 'cards', label: t('nav.items.cards'), icon: IdCard },
      { id: 'licenses', label: t('nav.items.licenses'), icon: Award },
      { id: 'courses', label: t('nav.items.courses'), icon: GraduationCap },
      { id: 'ppe_stock', label: t('nav.items.ppe_stock'), icon: HardHat },
      { id: 'ppe_issued', label: t('nav.items.ppe_issued'), icon: ShieldCheck },
    ] },
    { group: t('nav.groups.safety'), items: [
      { id: 'inspections', label: t('nav.items.inspections'), icon: ClipboardCheck, custom: true },
      { id: 'assets', label: t('nav.items.assets'), icon: Tags },
      { id: 'documents', label: t('nav.items.documents'), icon: FileText, custom: true },
    ] },
    { group: t('nav.groups.environment'), items: [{ id: 'environment', label: t('nav.items.environment'), icon: Leaf }] },
    { group: t('nav.groups.quality'), items: [
      { id: 'ncr', label: t('nav.items.ncr'), icon: FileWarning },
      { id: 'audits', label: t('nav.items.audits'), icon: ClipboardList },
    ] },
    { group: t('nav.groups.projects'), items: [
      { id: 'projects', label: t('nav.items.projects'), icon: Briefcase },
      { id: 'tasks', label: t('nav.items.tasks'), icon: ListChecks },
    ] },
    { group: t('nav.groups.system'), items: [{ id: 'settings', label: t('nav.items.settings'), icon: Settings, custom: true }] },
  ]
}
