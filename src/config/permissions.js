// Capability map for RBAC — module-level (not per-field) read/write grants.
// 'write' implies 'read'. Missing entries default to 'none'.
export const ROLES = ['admin', 'hr', 'pm', 'hse', 'ceo', 'employee']

const W = 'write', R = 'read', N = 'none'

export const PERMISSIONS = {
  // Super-role: the user's own login, full access everywhere.
  admin: { '*': W },

  // HR: full employee records + team/expiry updates; read-only elsewhere.
  hr: {
    dashboard: R, employees: W, cards: W, licenses: W, courses: R,
    ppe_stock: R, ppe_issued: R, inspections: R, assets: R, documents: R,
    environment: R, ncr: R, audits: R, projects: R, tasks: R, settings: N,
  },

  // Project Manager & department: owns projects/work orders + employee role assignment.
  pm: {
    dashboard: R, employees: W, cards: R, licenses: R, courses: R,
    ppe_stock: R, ppe_issued: R, inspections: R, assets: R, documents: R,
    environment: R, ncr: R, audits: R, projects: W, tasks: W, settings: N,
  },

  // HSE / Safety department: owns credentials, inspections, assets, documents, environment, quality.
  hse: {
    dashboard: R, employees: R, cards: W, licenses: W, courses: W,
    ppe_stock: W, ppe_issued: W, inspections: W, assets: W, documents: W,
    environment: W, ncr: W, audits: W, projects: R, tasks: R, settings: N,
  },

  // Executive: read-only aggregated view across everything.
  ceo: {
    dashboard: R, employees: R, cards: R, licenses: R, courses: R,
    ppe_stock: R, ppe_issued: R, inspections: R, assets: R, documents: R,
    environment: R, ncr: R, audits: R, projects: R, tasks: R, settings: N,
  },

  // Employee self-service: read-only, own record only (page lands in a later phase).
  employee: { dashboard: R },
}

export function getPermission(role, moduleId) {
  const map = PERMISSIONS[role]
  if (!map) return N
  if (map['*']) return map['*']
  return map[moduleId] || N
}
export const canRead = (role, moduleId) => { const p = getPermission(role, moduleId); return p === R || p === W }
export const canWrite = (role, moduleId) => getPermission(role, moduleId) === W

// domain/table <-> moduleId (nav/permission id) — single source of truth so the
// backend IPC router and the Excel import path can resolve a physical table
// or IPC domain name back to the permission key without duplicating this map.
export const MODULE_MAP = {
  employees: { domain: 'employees', table: 'employees' },
  cards: { domain: 'cards', table: 'id_cards' },
  licenses: { domain: 'licenses', table: 'licenses' },
  courses: { domain: 'courses', table: 'courses' },
  ppe_stock: { domain: 'ppeItems', table: 'ppe_items' },
  ppe_issued: { domain: 'ppeIssues', table: 'ppe_issues' },
  assets: { domain: 'assets', table: 'assets' },
  inspections: { domain: 'inspections', table: 'inspections' },
  documents: { domain: 'documents', table: 'documents' },
  projects: { domain: 'projects', table: 'projects' },
  tasks: { domain: 'tasks', table: 'tasks' },
  environment: { domain: 'environment', table: 'environment_records' },
  ncr: { domain: 'ncr', table: 'quality_ncr' },
  audits: { domain: 'audits', table: 'quality_audits' },
}
export const DOMAIN_TO_MODULE = Object.fromEntries(Object.entries(MODULE_MAP).map(([m, v]) => [v.domain, m]))
export const TABLE_TO_MODULE = Object.fromEntries(Object.entries(MODULE_MAP).map(([m, v]) => [v.table, m]))
