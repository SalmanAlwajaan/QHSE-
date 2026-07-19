import initSqlJs from 'sql.js'
import fs from 'node:fs'
import crypto from 'node:crypto'
import { canWrite, DOMAIN_TO_MODULE } from '../../src/config/permissions.js'

// ---------------------------------------------------------------------------
//  Table registry — single source of truth for the generic CRUD engine.
//  view:   read through a JOIN view (so lists carry employee/project names)
//  order:  default ORDER BY for list queries
// ---------------------------------------------------------------------------
const TABLES = {
  employees: { columns: ['emp_id', 'full_name', 'department', 'position', 'nationality', 'phone', 'email', 'hire_date', 'status'], order: 'full_name ASC' },
  licenses: { columns: ['emp_id', 'license_type', 'license_number', 'issuing_authority', 'issue_date', 'expiry_date', 'notes'], view: 'v_licenses', order: 'expiry_date ASC' },
  id_cards: { columns: ['emp_id', 'card_type', 'card_number', 'issue_date', 'expiry_date', 'notes'], view: 'v_id_cards', order: 'expiry_date ASC' },
  courses: { columns: ['emp_id', 'course_name', 'provider', 'completion_date', 'expiry_date', 'certificate_no', 'notes'], view: 'v_courses', order: 'completion_date DESC' },
  ppe_items: { columns: ['name', 'category', 'unit', 'size_options', 'stock_qty', 'min_stock'], order: 'name ASC' },
  ppe_issues: { columns: ['emp_id', 'ppe_item_id', 'quantity', 'size', 'issue_date', 'expiry_date', 'status', 'acknowledged', 'notes'], view: 'v_ppe_issues', order: 'issue_date DESC' },
  assets: { columns: ['asset_type', 'name', 'identifier', 'tag_type', 'tag_id', 'location', 'status'], order: 'name ASC' },
  inspections: { columns: ['asset_id', 'inspection_type', 'inspector', 'inspection_date', 'result', 'score', 'location', 'notes', 'checklist'], view: 'v_inspections', order: 'inspection_date DESC' },
  documents: { columns: ['title', 'doc_type', 'category', 'version', 'status', 'owner', 'review_date', 'file_path', 'tags'], order: 'title ASC' },
  projects: { columns: ['project_code', 'name', 'client', 'location', 'manager', 'start_date', 'end_date', 'status', 'progress', 'description'], order: 'start_date DESC' },
  tasks: { columns: ['project_id', 'title', 'assigned_to', 'priority', 'status', 'due_date', 'description'], view: 'v_tasks', order: 'due_date ASC' },
  environment_records: { columns: ['record_type', 'location', 'project_id', 'quantity', 'unit', 'scheduled_date', 'completed_date', 'status', 'notes'], view: 'v_environment', order: 'scheduled_date DESC' },
  quality_ncr: { columns: ['ncr_number', 'project_id', 'raised_by', 'date_raised', 'category', 'severity', 'description', 'root_cause', 'corrective_action', 'status', 'closed_date'], view: 'v_ncr', order: 'date_raised DESC' },
  quality_audits: { columns: ['audit_type', 'area', 'auditor', 'audit_date', 'score', 'findings_count', 'status', 'notes'], order: 'audit_date DESC' },
}

// domain name used in IPC actions -> physical table
const DOMAIN = {
  employees: 'employees', licenses: 'licenses', cards: 'id_cards', courses: 'courses',
  ppeItems: 'ppe_items', ppeIssues: 'ppe_issues', assets: 'assets', inspections: 'inspections',
  documents: 'documents', projects: 'projects', tasks: 'tasks', environment: 'environment_records',
  ncr: 'quality_ncr', audits: 'quality_audits',
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, pass_hash TEXT, full_name TEXT, role TEXT, created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS employees (id INTEGER PRIMARY KEY AUTOINCREMENT, emp_id TEXT UNIQUE, full_name TEXT, department TEXT, position TEXT, nationality TEXT, phone TEXT, email TEXT, hire_date TEXT, status TEXT DEFAULT 'Active', created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS licenses (id INTEGER PRIMARY KEY AUTOINCREMENT, emp_id TEXT, license_type TEXT, license_number TEXT, issuing_authority TEXT, issue_date TEXT, expiry_date TEXT, notes TEXT, created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS id_cards (id INTEGER PRIMARY KEY AUTOINCREMENT, emp_id TEXT, card_type TEXT, card_number TEXT, issue_date TEXT, expiry_date TEXT, notes TEXT, created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS courses (id INTEGER PRIMARY KEY AUTOINCREMENT, emp_id TEXT, course_name TEXT, provider TEXT, completion_date TEXT, expiry_date TEXT, certificate_no TEXT, notes TEXT, created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS ppe_items (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, category TEXT, unit TEXT, size_options TEXT, stock_qty INTEGER DEFAULT 0, min_stock INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS ppe_issues (id INTEGER PRIMARY KEY AUTOINCREMENT, emp_id TEXT, ppe_item_id INTEGER, quantity INTEGER DEFAULT 1, size TEXT, issue_date TEXT, expiry_date TEXT, status TEXT DEFAULT 'Issued', acknowledged INTEGER DEFAULT 0, notes TEXT, created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS assets (id INTEGER PRIMARY KEY AUTOINCREMENT, asset_type TEXT, name TEXT, identifier TEXT, tag_type TEXT, tag_id TEXT, location TEXT, status TEXT DEFAULT 'Active', created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS inspections (id INTEGER PRIMARY KEY AUTOINCREMENT, asset_id INTEGER, inspection_type TEXT, inspector TEXT, inspection_date TEXT, result TEXT, score INTEGER, location TEXT, notes TEXT, checklist TEXT, created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS documents (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, doc_type TEXT, category TEXT, version TEXT DEFAULT '1.0', status TEXT DEFAULT 'Active', owner TEXT, review_date TEXT, file_path TEXT, tags TEXT, created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS document_versions (id INTEGER PRIMARY KEY AUTOINCREMENT, document_id INTEGER, version TEXT, file_path TEXT, changed_by TEXT, note TEXT, changed_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS projects (id INTEGER PRIMARY KEY AUTOINCREMENT, project_code TEXT, name TEXT, client TEXT, location TEXT, manager TEXT, start_date TEXT, end_date TEXT, status TEXT DEFAULT 'Active', progress INTEGER DEFAULT 0, description TEXT, created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER, title TEXT, assigned_to TEXT, priority TEXT DEFAULT 'Medium', status TEXT DEFAULT 'Open', due_date TEXT, description TEXT, created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS environment_records (id INTEGER PRIMARY KEY AUTOINCREMENT, record_type TEXT, location TEXT, project_id INTEGER, quantity REAL, unit TEXT, scheduled_date TEXT, completed_date TEXT, status TEXT DEFAULT 'Scheduled', notes TEXT, created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS quality_ncr (id INTEGER PRIMARY KEY AUTOINCREMENT, ncr_number TEXT, project_id INTEGER, raised_by TEXT, date_raised TEXT, category TEXT, severity TEXT, description TEXT, root_cause TEXT, corrective_action TEXT, status TEXT DEFAULT 'Open', closed_date TEXT, created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS quality_audits (id INTEGER PRIMARY KEY AUTOINCREMENT, audit_type TEXT, area TEXT, auditor TEXT, audit_date TEXT, score INTEGER, findings_count INTEGER DEFAULT 0, status TEXT DEFAULT 'Planned', notes TEXT, created_at TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS audit_log (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, action TEXT, entity TEXT, entity_id INTEGER, details TEXT, ts TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);

CREATE VIEW IF NOT EXISTS v_licenses AS SELECT l.*, e.full_name AS emp_name, e.department AS department FROM licenses l LEFT JOIN employees e ON e.emp_id = l.emp_id;
CREATE VIEW IF NOT EXISTS v_id_cards AS SELECT c.*, e.full_name AS emp_name, e.department AS department FROM id_cards c LEFT JOIN employees e ON e.emp_id = c.emp_id;
CREATE VIEW IF NOT EXISTS v_courses AS SELECT c.*, e.full_name AS emp_name, e.department AS department FROM courses c LEFT JOIN employees e ON e.emp_id = c.emp_id;
CREATE VIEW IF NOT EXISTS v_ppe_issues AS SELECT p.*, e.full_name AS emp_name, it.name AS item_name, it.category AS item_category FROM ppe_issues p LEFT JOIN employees e ON e.emp_id = p.emp_id LEFT JOIN ppe_items it ON it.id = p.ppe_item_id;
CREATE VIEW IF NOT EXISTS v_inspections AS SELECT i.*, a.name AS asset_name, a.identifier AS asset_identifier, a.asset_type AS asset_type FROM inspections i LEFT JOIN assets a ON a.id = i.asset_id;
CREATE VIEW IF NOT EXISTS v_tasks AS SELECT t.*, p.name AS project_name, e.full_name AS assignee_name FROM tasks t LEFT JOIN projects p ON p.id = t.project_id LEFT JOIN employees e ON e.emp_id = t.assigned_to;
CREATE VIEW IF NOT EXISTS v_environment AS SELECT r.*, p.name AS project_name FROM environment_records r LEFT JOIN projects p ON p.id = r.project_id;
CREATE VIEW IF NOT EXISTS v_ncr AS SELECT n.*, p.name AS project_name FROM quality_ncr n LEFT JOIN projects p ON p.id = n.project_id;
`

const clean = (v) => (v === undefined ? null : typeof v === 'boolean' ? (v ? 1 : 0) : v)
const today = () => new Date().toISOString().slice(0, 10)
const d = (offsetDays) => { const t = new Date(); t.setDate(t.getDate() + offsetDays); return t.toISOString().slice(0, 10) }

export class Database {
  async init({ dbPath, wasmPath }) {
    this.dbPath = dbPath
    const SQL = await initSqlJs({ locateFile: () => wasmPath })
    if (fs.existsSync(dbPath)) {
      this.db = new SQL.Database(fs.readFileSync(dbPath))
    } else {
      this.db = new SQL.Database()
    }
    this.db.run('PRAGMA foreign_keys = ON;')
    this.db.run(SCHEMA)
    try { this.db.run('ALTER TABLE users ADD COLUMN emp_id TEXT') } catch { /* column already exists */ }
    const count = this.get('SELECT COUNT(*) AS n FROM employees')
    if (!count || count.n === 0) this.seed()
    this.ensureRoleDemoUsers()
    this.persist()
  }

  // Idempotent: adds the new Phase-0 demo logins (pm/hse/employee) to installs
  // that were seeded before RBAC existed, without touching existing users.
  ensureRoleDemoUsers() {
    const mkUser = (username, pw, full_name, role, emp_id) => {
      if (this.get('SELECT id FROM users WHERE username=?', [username])) return
      this._run('INSERT INTO users (username, pass_hash, full_name, role, emp_id) VALUES (?,?,?,?,?)', [username, this.hashPassword(pw), full_name, role, emp_id || null])
    }
    mkUser('pm', 'pm123', 'Yousef Khan (Project Manager)', 'pm', 'EMP-1004')
    mkUser('hse', 'hse123', 'Omar Farouk (HSE)', 'hse', 'EMP-1007')
    mkUser('employee', 'employee123', 'Ahmed Hassan', 'employee', 'EMP-1002')
  }

  // ---- low level helpers --------------------------------------------------
  all(sql, params = []) {
    const stmt = this.db.prepare(sql)
    try {
      if (params && params.length) stmt.bind(params)
      const out = []
      while (stmt.step()) out.push(stmt.getAsObject())
      return out
    } finally { stmt.free() }
  }
  get(sql, params = []) { return this.all(sql, params)[0] || null }
  _run(sql, params = []) { this.db.run(sql, params.map(clean)) }            // no persist
  run(sql, params = []) { this._run(sql, params); if (!this._tx) this.persist() }
  tx(fn) {
    this._tx = true
    try { this.db.run('BEGIN'); const r = fn(); this.db.run('COMMIT'); return r }
    catch (e) { this.db.run('ROLLBACK'); throw e }
    finally { this._tx = false; this.persist() }
  }
  persist() { try { fs.writeFileSync(this.dbPath, Buffer.from(this.db.export())) } catch (e) { console.error('[persist]', e) } }
  audit(actor, action, entity, entityId, details) {
    if (!actor) return
    this._run('INSERT INTO audit_log (username, action, entity, entity_id, details) VALUES (?,?,?,?,?)',
      [actor, action, entity, entityId, details ? JSON.stringify(details).slice(0, 2000) : null])
  }

  // ---- generic CRUD -------------------------------------------------------
  listTable(table, params = {}) {
    const cfg = TABLES[table]
    const src = cfg.view || table
    const order = params.order || cfg.order || 'id DESC'
    return this.all(`SELECT * FROM ${src} ORDER BY ${order}`)
  }
  createRow(table, data) {
    const cfg = TABLES[table]
    const cols = cfg.columns.filter((c) => data[c] !== undefined)
    this._run(`INSERT INTO ${table} (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`, cols.map((c) => data[c]))
    const id = this.get('SELECT last_insert_rowid() AS id').id   // read BEFORE persist
    this.audit(data._actor, 'create', table, id, data)
    if (!this._tx) this.persist()
    return this.get(`SELECT * FROM ${table} WHERE id=?`, [id])
  }
  updateRow(table, id, data) {
    const cfg = TABLES[table]
    const cols = cfg.columns.filter((c) => data[c] !== undefined)
    if (cols.length) this._run(`UPDATE ${table} SET ${cols.map((c) => `${c}=?`).join(',')} WHERE id=?`, [...cols.map((c) => data[c]), id])
    this.audit(data._actor, 'update', table, id, data)
    if (!this._tx) this.persist()
    return this.get(`SELECT * FROM ${table} WHERE id=?`, [id])
  }
  deleteRow(table, id, actor) {
    this._run(`DELETE FROM ${table} WHERE id=?`, [id])
    this.audit(actor, 'delete', table, id, null)
    if (!this._tx) this.persist()
    return { id }
  }

  // ---- compliance / expiry engine ----------------------------------------
  watchlist() {
    const rows = this.all(`
      SELECT 'ID card' AS kind, card_type AS subtype, card_number AS ref, expiry_date, emp_id,
             (SELECT full_name FROM employees e WHERE e.emp_id=x.emp_id) AS emp_name FROM id_cards x WHERE expiry_date IS NOT NULL AND expiry_date <> ''
      UNION ALL
      SELECT 'License', license_type, license_number, expiry_date, emp_id,
             (SELECT full_name FROM employees e WHERE e.emp_id=x.emp_id) FROM licenses x WHERE expiry_date IS NOT NULL AND expiry_date <> ''
      UNION ALL
      SELECT 'Course', course_name, certificate_no, expiry_date, emp_id,
             (SELECT full_name FROM employees e WHERE e.emp_id=x.emp_id) FROM courses x WHERE expiry_date IS NOT NULL AND expiry_date <> ''
      UNION ALL
      SELECT 'PPE', (SELECT name FROM ppe_items it WHERE it.id=x.ppe_item_id), size, expiry_date, emp_id,
             (SELECT full_name FROM employees e WHERE e.emp_id=x.emp_id) FROM ppe_issues x WHERE expiry_date IS NOT NULL AND expiry_date <> ''
    `)
    const now = new Date(today())
    return rows.map((r) => {
      const exp = new Date(r.expiry_date)
      const days = Math.round((exp - now) / 86400000)
      let status = 'valid'
      if (days < 0) status = 'expired'
      else if (days <= 30) status = 'critical'
      else if (days <= 90) status = 'warning'
      return { ...r, days, status }
    }).sort((a, b) => a.days - b.days)
  }

  dashboard() {
    const wl = this.watchlist()
    const counts = (st) => wl.filter((w) => st.includes(w.status)).length
    const empByDept = this.all("SELECT department, COUNT(*) AS n FROM employees WHERE status='Active' GROUP BY department ORDER BY n DESC")
    const requiredInspections = this.get("SELECT COUNT(*) AS n FROM assets WHERE status='Active' AND asset_type IN ('Job Site','Vehicle')")?.n || 0
    const doneToday = this.get('SELECT COUNT(*) AS n FROM inspections WHERE inspection_date=?', [today()])?.n || 0
    const trend = []
    for (let i = 6; i >= 0; i--) {
      const day = d(-i)
      trend.push({ date: day, count: this.get('SELECT COUNT(*) AS n FROM inspections WHERE inspection_date=?', [day])?.n || 0 })
    }
    const kindAgg = {}
    wl.forEach((w) => {
      if (w.status === 'valid') return
      kindAgg[w.kind] = kindAgg[w.kind] || { kind: w.kind, expiring: 0, expired: 0 }
      if (w.status === 'expired') kindAgg[w.kind].expired++
      else kindAgg[w.kind].expiring++
    })
    return {
      activeEmployees: this.get("SELECT COUNT(*) AS n FROM employees WHERE status='Active'")?.n || 0,
      totalEmployees: this.get('SELECT COUNT(*) AS n FROM employees')?.n || 0,
      expiringSoon: counts(['critical']),
      expiringWarning: counts(['warning']),
      expired: counts(['expired']),
      valid: counts(['valid']),
      openNCRs: this.get("SELECT COUNT(*) AS n FROM quality_ncr WHERE status <> 'Closed'")?.n || 0,
      activeProjects: this.get("SELECT COUNT(*) AS n FROM projects WHERE status='Active'")?.n || 0,
      projectProgress: Math.round(this.get("SELECT AVG(progress) AS p FROM projects WHERE status='Active'")?.p || 0),
      ppeLowStock: this.get('SELECT COUNT(*) AS n FROM ppe_items WHERE stock_qty <= min_stock')?.n || 0,
      openTasks: this.get("SELECT COUNT(*) AS n FROM tasks WHERE status <> 'Done'")?.n || 0,
      environmentDue: this.get("SELECT COUNT(*) AS n FROM environment_records WHERE status <> 'Completed'")?.n || 0,
      inspectionRate: requiredInspections ? Math.round((doneToday / requiredInspections) * 100) : 0,
      requiredInspections, doneToday,
      empByDept,
      complianceBreakdown: [
        { name: 'Valid', value: counts(['valid']) },
        { name: 'Expiring', value: counts(['critical', 'warning']) },
        { name: 'Expired', value: counts(['expired']) },
      ],
      expiryByKind: Object.values(kindAgg),
      inspectionTrend: trend,
      watchTop: wl.filter((w) => w.status !== 'valid').slice(0, 8),
    }
  }

  // ---- auth ---------------------------------------------------------------
  hashPassword(pw, salt = crypto.randomBytes(16).toString('hex')) {
    const hash = crypto.scryptSync(pw, salt, 32).toString('hex')
    return `${salt}:${hash}`
  }
  verifyPassword(pw, stored) {
    if (!stored) return false
    const [salt, hash] = stored.split(':')
    const test = crypto.scryptSync(pw, salt, 32).toString('hex')
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(test))
  }
  login(username, password) {
    const u = this.get('SELECT * FROM users WHERE username=?', [String(username || '').toLowerCase().trim()])
    if (!u || !this.verifyPassword(password, u.pass_hash)) throw new Error('Invalid username or password')
    return { id: u.id, username: u.username, full_name: u.full_name, role: u.role, emp_id: u.emp_id }
  }

  // ---- the IPC router -----------------------------------------------------
  async call(action, params = {}) {
    const [domain, op] = action.split('.')
    const role = params._role
    const requireWrite = (moduleId) => { if (!canWrite(role, moduleId)) throw new Error('Not authorized for this action') }

    // ---- special endpoints ----
    switch (action) {
      case 'auth.login': return this.login(params.username, params.password)
      case 'dashboard.kpis': return this.dashboard()
      case 'compliance.watchlist': return this.watchlist()
      case 'audit.list': return this.all('SELECT * FROM audit_log ORDER BY id DESC LIMIT 300')
      case 'settings.all': return Object.fromEntries(this.all('SELECT key, value FROM settings').map((r) => [r.key, r.value]))
      case 'settings.set': requireWrite('settings'); this.run('INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', [params.key, String(params.value)]); return { ok: true }
      case 'options.employees': return this.all("SELECT emp_id, full_name, department FROM employees WHERE status='Active' ORDER BY full_name")
      case 'options.projects': return this.all('SELECT id, name, project_code FROM projects ORDER BY name')
      case 'options.ppeItems': return this.all('SELECT id, name, category, size_options, stock_qty FROM ppe_items ORDER BY name')
      case 'options.assets': return this.all('SELECT id, name, identifier, asset_type, tag_id, tag_type FROM assets ORDER BY name')
      case 'employees.detail': {
        const emp = this.get('SELECT * FROM employees WHERE emp_id=?', [params.emp_id])
        if (!emp) throw new Error('Employee not found')
        return {
          ...emp,
          licenses: this.all('SELECT * FROM licenses WHERE emp_id=? ORDER BY expiry_date', [params.emp_id]),
          cards: this.all('SELECT * FROM id_cards WHERE emp_id=? ORDER BY expiry_date', [params.emp_id]),
          courses: this.all('SELECT * FROM courses WHERE emp_id=? ORDER BY completion_date DESC', [params.emp_id]),
          ppe: this.all('SELECT p.*, it.name AS item_name FROM ppe_issues p LEFT JOIN ppe_items it ON it.id=p.ppe_item_id WHERE p.emp_id=? ORDER BY issue_date DESC', [params.emp_id]),
        }
      }
      case 'documents.versions': return this.all('SELECT * FROM document_versions WHERE document_id=? ORDER BY id DESC', [params.document_id])
      case 'documents.addVersion': {
        requireWrite('documents')
        const doc = this.get('SELECT * FROM documents WHERE id=?', [params.document_id])
        if (!doc) throw new Error('Document not found')
        this.run('UPDATE documents SET version=?, file_path=COALESCE(?, file_path), status=? WHERE id=?', [params.version, params.file_path, params.status || doc.status, params.document_id])
        this.run('INSERT INTO document_versions (document_id, version, file_path, changed_by, note) VALUES (?,?,?,?,?)', [params.document_id, params.version, params.file_path || doc.file_path, params._actor || 'system', params.note])
        return this.get('SELECT * FROM documents WHERE id=?', [params.document_id])
      }
      default: break
    }

    // ---- generic CRUD by domain ----
    const table = DOMAIN[domain]
    if (!table) throw new Error(`Unknown action: ${action}`)
    const moduleId = DOMAIN_TO_MODULE[domain] || domain
    switch (op) {
      case 'list': return this.listTable(table, params)
      case 'get': return this.get(`SELECT * FROM ${TABLES[table].view || table} WHERE id=?`, [params.id])
      case 'create': {
        requireWrite(moduleId)
        const row = this.createRow(table, params)
        if (table === 'documents') this.run('INSERT INTO document_versions (document_id, version, file_path, changed_by, note) VALUES (?,?,?,?,?)', [row.id, row.version, row.file_path, params._actor || 'system', 'Initial version'])
        return row
      }
      case 'update': requireWrite(moduleId); return this.updateRow(table, params.id, params)
      case 'delete': requireWrite(moduleId); return this.deleteRow(table, params.id, params._actor)
      default: throw new Error(`Unknown op: ${action}`)
    }
  }

  // ---- Excel import / export (called from main) ---------------------------
  exportRows(table) {
    const cfg = TABLES[table]
    if (!cfg) throw new Error('Unknown table for export: ' + table)
    return this.all(`SELECT * FROM ${cfg.view || table} ORDER BY ${cfg.order || 'id DESC'}`)
  }
  importRows(table, rows) {
    const cfg = TABLES[table]
    if (!cfg) throw new Error('Unknown table for import: ' + table)
    const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
    const colMap = {}
    cfg.columns.forEach((c) => { colMap[norm(c)] = c })
    // friendly aliases
    Object.assign(colMap, { name: cfg.columns.includes('full_name') ? 'full_name' : colMap.name, id: cfg.columns.includes('emp_id') ? 'emp_id' : colMap.id, employee_id: 'emp_id', iqama: 'card_number', expiry: 'expiry_date', expire_date: 'expiry_date' })
    let inserted = 0, updated = 0, skipped = 0
    this.tx(() => {
      for (const raw of rows) {
        const data = {}
        for (const [k, v] of Object.entries(raw)) {
          const target = colMap[norm(k)]
          if (target && v !== null && v !== undefined && v !== '') data[target] = v
        }
        if (!Object.keys(data).length) { skipped++; continue }
        if (table === 'employees' && data.emp_id) {
          const existing = this.get('SELECT id FROM employees WHERE emp_id=?', [data.emp_id])
          if (existing) { this.updateRow('employees', existing.id, data); updated++; continue }
        }
        this.createRow(table, data)
        inserted++
      }
    })
    return { inserted, updated, skipped, total: rows.length }
  }

  // ---- demo data ----------------------------------------------------------
  seed() {
    this.tx(() => {
      // users
      const mkUser = (username, pw, full_name, role) => this.run('INSERT INTO users (username, pass_hash, full_name, role) VALUES (?,?,?,?)', [username, this.hashPassword(pw), full_name, role])
      mkUser('admin', 'admin123', 'Salman (Head of Safety)', 'admin')
      mkUser('hr', 'hr123', 'HR Department', 'hr')
      mkUser('ceo', 'ceo123', 'Chief Executive', 'ceo')

      const settings = { company_name: 'Your Electrical Contracting Co.', client_name: 'National Electric Company', alert_critical: '30', alert_warning: '90' }
      for (const [k, v] of Object.entries(settings)) this.run('INSERT INTO settings (key,value) VALUES (?,?)', [k, v])

      // employees
      const emps = [
        ['EMP-1001', 'Salman Al-Otaibi', 'Safety', 'Head of Safety', 'Saudi', '0551000001', 'salman@example.com', '2019-03-01'],
        ['EMP-1002', 'Ahmed Hassan', 'Electrical', 'Senior HV Technician', 'Egyptian', '0551000002', 'ahmed@example.com', '2020-06-15'],
        ['EMP-1003', 'Khalid Al-Shehri', 'Electrical', 'Lineman', 'Saudi', '0551000003', 'khalid@example.com', '2021-01-10'],
        ['EMP-1004', 'Yousef Khan', 'Projects', 'Project Engineer', 'Pakistani', '0551000004', 'yousef@example.com', '2018-09-20'],
        ['EMP-1005', 'Rana Mohammed', 'HR', 'HR Officer', 'Jordanian', '0551000005', 'rana@example.com', '2022-02-01'],
        ['EMP-1006', 'Bilal Ahmad', 'Electrical', 'Cable Jointer', 'Indian', '0551000006', 'bilal@example.com', '2021-07-12'],
        ['EMP-1007', 'Omar Farouk', 'Safety', 'Safety Officer', 'Sudanese', '0551000007', 'omar@example.com', '2020-11-05'],
        ['EMP-1008', 'Tariq Aziz', 'Environment', 'Environmental Officer', 'Pakistani', '0551000008', 'tariq@example.com', '2022-08-18'],
        ['EMP-1009', 'Mahmoud Saleh', 'Quality', 'QA/QC Inspector', 'Egyptian', '0551000009', 'mahmoud@example.com', '2021-04-22'],
        ['EMP-1010', 'Fahad Al-Dossari', 'Projects', 'Site Supervisor', 'Saudi', '0551000010', 'fahad@example.com', '2019-12-01'],
        ['EMP-1011', 'Imran Sheikh', 'Electrical', 'Electrician', 'Bangladeshi', '0551000011', 'imran@example.com', '2023-03-15'],
        ['EMP-1012', 'Nasser Al-Qahtani', 'Admin', 'Admin Coordinator', 'Saudi', '0551000012', 'nasser@example.com', '2020-05-30'],
      ]
      emps.forEach((e) => this.run('INSERT INTO employees (emp_id, full_name, department, position, nationality, phone, email, hire_date, status) VALUES (?,?,?,?,?,?,?,?,?)', [...e, 'Active']))

      // id cards — Iqama for all, Industrial Security Card + Baladiya for some; some expiring/expired
      const cards = [
        ['EMP-1001', 'Iqama', '2412345601', '2023-04-01', d(400)],
        ['EMP-1001', 'Industrial Security Card', 'ISC-7781', '2024-01-01', d(120)],
        ['EMP-1002', 'Iqama', '2412345602', '2023-02-10', d(5)],     // critical
        ['EMP-1002', 'Industrial Security Card', 'ISC-7782', '2024-03-01', d(28)], // critical
        ['EMP-1003', 'Iqama', '2412345603', '2023-05-20', d(210)],
        ['EMP-1004', 'Iqama', '2412345604', '2022-09-01', d(-12)],   // expired
        ['EMP-1004', 'Industrial Security Card', 'ISC-7784', '2023-09-01', d(75)],
        ['EMP-1005', 'Iqama', '2412345605', '2023-08-15', d(300)],
        ['EMP-1006', 'Iqama', '2412345606', '2023-03-03', d(60)],
        ['EMP-1007', 'Iqama', '2412345607', '2023-06-06', d(18)],    // critical
        ['EMP-1008', 'Iqama', '2412345608', '2023-07-07', d(500)],
        ['EMP-1009', 'Industrial Security Card', 'ISC-7789', '2024-02-02', d(45)],
        ['EMP-1010', 'Baladiya (Municipality)', 'BAL-3310', '2024-01-15', d(25)], // critical
        ['EMP-1011', 'Iqama', '2412345611', '2023-09-09', d(150)],
        ['EMP-1012', 'Iqama', '2412345612', '2023-10-10', d(-30)],   // expired
      ]
      cards.forEach((c) => this.run('INSERT INTO id_cards (emp_id, card_type, card_number, issue_date, expiry_date) VALUES (?,?,?,?,?)', c))

      // licenses
      const lic = [
        ['EMP-1002', 'HV Switching License', 'HV-2201', 'National Electric Company', '2023-01-01', d(21)], // critical
        ['EMP-1003', 'Working at Height', 'WAH-118', 'NEBOSH Partner', '2023-06-01', d(140)],
        ['EMP-1004', 'Driving License', 'DL-9920', 'Saudi Traffic Dept.', '2022-04-01', d(-40)], // expired
        ['EMP-1006', 'Cable Jointing Cert.', 'CJ-551', 'Manufacturer', '2023-03-15', d(220)],
        ['EMP-1007', 'First Aid Trainer', 'FAT-77', 'Saudi Red Crescent', '2023-09-01', d(80)],
        ['EMP-1010', 'Crane Operator', 'CO-330', 'TUV', '2023-02-20', d(15)], // critical
      ]
      lic.forEach((l) => this.run('INSERT INTO licenses (emp_id, license_type, license_number, issuing_authority, issue_date, expiry_date) VALUES (?,?,?,?,?,?)', l))

      // courses
      const crs = [
        ['EMP-1001', 'ISO 45001 Lead Auditor', 'IRCA', '2023-05-10', d(700), 'C-4501'],
        ['EMP-1002', 'H2S Awareness', 'OPITO', '2023-08-01', d(40), 'C-H2S-2'],
        ['EMP-1003', 'Confined Space Entry', 'IOSH', '2023-04-12', d(-20), 'C-CSE-3'], // expired
        ['EMP-1006', 'Arc Flash Safety', 'NFPA 70E', '2024-01-05', d(180), 'C-AF-6'],
        ['EMP-1007', 'Fire Warden', 'Civil Defense', '2023-10-01', d(95), 'C-FW-7'],
        ['EMP-1009', 'ISO 9001 Internal Auditor', 'BSI', '2023-11-11', null, 'C-9001-9'],
        ['EMP-1008', 'ISO 14001 Awareness', 'BSI', '2023-12-01', null, 'C-14001-8'],
        ['EMP-1011', 'Basic First Aid', 'SRC', '2024-02-20', d(300), 'C-BFA-11'],
      ]
      crs.forEach((c) => this.run('INSERT INTO courses (emp_id, course_name, provider, completion_date, expiry_date, certificate_no) VALUES (?,?,?,?,?,?)', c))

      // ppe items
      const items = [
        ['CAT-1 Insulating Helmet', 'Head', 'pcs', 'M,L,XL', 4, 6],   // low stock
        ['Arc Flash Suit 8cal', 'Body', 'set', 'M,L,XL', 9, 4],
        ['Insulating Gloves Class 0', 'Hand', 'pair', '9,10,11', 12, 8],
        ['Safety Glasses', 'Eye', 'pcs', 'Std', 40, 15],
        ['Safety Boots S3', 'Foot', 'pair', '40,41,42,43,44', 18, 10],
        ['Hi-Vis Vest', 'Body', 'pcs', 'M,L,XL', 30, 12],
      ]
      const itemIds = items.map((it) => { this.run('INSERT INTO ppe_items (name, category, unit, size_options, stock_qty, min_stock) VALUES (?,?,?,?,?,?)', it); return this.get('SELECT last_insert_rowid() AS id').id })

      // ppe issues
      const issues = [
        ['EMP-1002', itemIds[0], 1, 'L', d(-120), d(245), 'Issued', 1],
        ['EMP-1003', itemIds[2], 1, '10', d(-30), d(15), 'Issued', 1],  // critical (gloves retest)
        ['EMP-1006', itemIds[1], 1, 'L', d(-60), d(300), 'Issued', 0],
        ['EMP-1007', itemIds[0], 1, 'M', d(-10), d(355), 'Issued', 1],
        ['EMP-1010', itemIds[4], 1, '43', d(-200), null, 'Issued', 1],
      ]
      issues.forEach((i) => this.run('INSERT INTO ppe_issues (emp_id, ppe_item_id, quantity, size, issue_date, expiry_date, status, acknowledged) VALUES (?,?,?,?,?,?,?,?)', i))

      // assets
      const assets = [
        ['Job Site', 'Substation 132/13.8kV — Riyadh North', 'SITE-RYD-01', 'NFC', 'NFC-A1001', 'Riyadh North', 'Active'],
        ['Job Site', 'OHL Tower Line — Sector 7', 'SITE-OHL-07', 'NFC', 'NFC-A1002', 'Sector 7', 'Active'],
        ['Job Site', 'Distribution Yard — Diriyah', 'SITE-DIR-03', 'NFC', 'NFC-A1003', 'Diriyah', 'Active'],
        ['Vehicle', 'Bucket Truck', 'PLATE 4821-RYD', 'QR', 'QR-V2001', 'Fleet', 'Active'],
        ['Vehicle', 'Cable Pulling Rig', 'PLATE 9930-RYD', 'QR', 'QR-V2002', 'Fleet', 'Active'],
        ['Equipment', 'Mobile Generator 250kVA', 'GEN-250-01', 'Barcode', 'BC-E3001', 'Store', 'Active'],
      ]
      const assetIds = assets.map((a) => { this.run('INSERT INTO assets (asset_type, name, identifier, tag_type, tag_id, location, status) VALUES (?,?,?,?,?,?,?)', a); return this.get('SELECT last_insert_rowid() AS id').id })

      // inspections (recent)
      const chk = JSON.stringify([
        { item: 'PPE worn correctly', result: 'OK', remark: '' },
        { item: 'Work area barricaded', result: 'OK', remark: '' },
        { item: 'Permit to work valid', result: 'OK', remark: '' },
        { item: 'Earthing applied', result: 'OK', remark: '' },
      ])
      const insp = [
        [assetIds[0], 'Site Safety', 'Salman Al-Otaibi', today(), 'Pass', 96, 'Riyadh North', 'Routine daily inspection', chk],
        [assetIds[1], 'Site Safety', 'Omar Farouk', today(), 'Pass', 88, 'Sector 7', '', chk],
        [assetIds[3], 'Vehicle', 'Omar Farouk', today(), 'Conditional', 72, 'Fleet', 'Brake light fault — work order raised', chk],
        [assetIds[0], 'Site Safety', 'Salman Al-Otaibi', d(-1), 'Pass', 94, 'Riyadh North', '', chk],
        [assetIds[2], 'Site Safety', 'Omar Farouk', d(-1), 'Fail', 58, 'Diriyah', 'Missing earthing — stopped work', chk],
        [assetIds[4], 'Vehicle', 'Omar Farouk', d(-2), 'Pass', 90, 'Fleet', '', chk],
      ]
      insp.forEach((i) => this.run('INSERT INTO inspections (asset_id, inspection_type, inspector, inspection_date, result, score, location, notes, checklist) VALUES (?,?,?,?,?,?,?,?,?)', i))

      // documents (ISO 45001 / 14001 / 9001)
      const docs = [
        ['HSE Policy Statement', 'Policy', 'Safety', '2.1', 'Active', 'Salman Al-Otaibi', d(180), '', 'ISO 45001, policy'],
        ['Risk Assessment Procedure', 'Procedure', 'Safety', '3.0', 'Active', 'Salman Al-Otaibi', d(90), '', 'ISO 45001, HIRA'],
        ['Permit to Work Form', 'Form', 'Safety', '1.4', 'Active', 'Omar Farouk', d(60), '', 'PTW, form'],
        ['Incident Reporting Procedure', 'Procedure', 'Safety', '2.0', 'Active', 'Omar Farouk', d(-15), '', 'incident, ISO 45001'], // review overdue
        ['Environmental Aspects & Impacts Register', 'Record', 'Environment', '1.2', 'Active', 'Tariq Aziz', d(120), '', 'ISO 14001'],
        ['Waste Management Procedure', 'Procedure', 'Environment', '1.0', 'Active', 'Tariq Aziz', d(200), '', 'ISO 14001, waste'],
        ['Quality Manual', 'Manual', 'Quality', '4.0', 'Active', 'Mahmoud Saleh', d(150), '', 'ISO 9001'],
        ['Inspection & Test Plan (ITP)', 'Form', 'Quality', '2.2', 'Active', 'Mahmoud Saleh', d(75), '', 'ISO 9001, ITP'],
      ]
      docs.forEach((doc) => {
        this.run('INSERT INTO documents (title, doc_type, category, version, status, owner, review_date, file_path, tags) VALUES (?,?,?,?,?,?,?,?,?)', doc)
        const id = this.get('SELECT last_insert_rowid() AS id').id
        this.run('INSERT INTO document_versions (document_id, version, file_path, changed_by, note) VALUES (?,?,?,?,?)', [id, doc[3], '', 'system', 'Imported'])
      })

      // projects
      const projects = [
        ['PRJ-2401', '132kV Substation Upgrade — Riyadh North', 'National Electric Company', 'Riyadh North', 'Yousef Khan', '2024-01-15', d(120), 'Active', 65, 'Upgrade of protection and HV switchgear'],
        ['PRJ-2402', 'OHL Reconductoring — Sector 7', 'National Electric Company', 'Sector 7', 'Fahad Al-Dossari', '2024-03-01', d(60), 'Active', 40, 'Reconductoring 15 km overhead line'],
        ['PRJ-2403', 'Distribution Network Extension — Diriyah', 'National Electric Company', 'Diriyah', 'Yousef Khan', '2023-09-01', d(-10), 'Active', 88, 'New 13.8kV feeders and RMUs'],
        ['PRJ-2404', 'Cable Fault Maintenance Contract', 'National Electric Company', 'Riyadh', 'Fahad Al-Dossari', '2024-02-01', d(300), 'Active', 25, 'Annual cable fault response'],
      ]
      const projIds = projects.map((p) => { this.run('INSERT INTO projects (project_code, name, client, location, manager, start_date, end_date, status, progress, description) VALUES (?,?,?,?,?,?,?,?,?,?)', p); return this.get('SELECT last_insert_rowid() AS id').id })

      // tasks / work orders
      const tasks = [
        [projIds[0], 'Submit method statement for HV switching', 'EMP-1002', 'High', 'In Progress', d(3), ''],
        [projIds[0], 'Toolbox talk — arc flash', 'EMP-1007', 'Medium', 'Open', d(1), ''],
        [projIds[1], 'Mobilize cable pulling rig', 'EMP-1010', 'High', 'Open', d(2), ''],
        [projIds[1], 'Weekly progress report to client', 'EMP-1004', 'Medium', 'Open', d(5), ''],
        [projIds[2], 'Close out punch list items', 'EMP-1010', 'High', 'In Progress', d(-2), 'Overdue'],
        [projIds[3], 'Stock standby cable joints', 'EMP-1006', 'Low', 'Done', d(-5), ''],
      ]
      tasks.forEach((t) => this.run('INSERT INTO tasks (project_id, title, assigned_to, priority, status, due_date, description) VALUES (?,?,?,?,?,?,?)', t))

      // environment records (oil, staking, waste — the "extractor" data)
      const env = [
        ['Transformer Cooling Oil Pulled', 'Substation RYD North', projIds[0], 1200, 'litre', d(-5), d(-5), 'Completed', 'Sent to licensed recycler'],
        ['Transformer Cooling Oil Pulled', 'Diriyah Yard', projIds[2], 800, 'litre', d(7), null, 'Scheduled', ''],
        ['Staking Return', 'Sector 7', projIds[1], 35, 'units', d(3), null, 'Scheduled', 'Return surplus stakes to store'],
        ['Staking Return', 'Riyadh North', projIds[0], 50, 'units', d(-10), d(-9), 'Completed', ''],
        ['Waste Removal', 'Diriyah Yard', projIds[2], 2.5, 'tonne', d(2), null, 'Scheduled', 'Mixed construction waste'],
        ['Waste Removal', 'Sector 7', projIds[1], 1.1, 'tonne', d(-3), null, 'Overdue', 'Hazardous — contaminated soil'],
      ]
      env.forEach((r) => this.run('INSERT INTO environment_records (record_type, location, project_id, quantity, unit, scheduled_date, completed_date, status, notes) VALUES (?,?,?,?,?,?,?,?,?)', r))

      // quality NCRs + audits
      const ncrs = [
        ['NCR-2401', projIds[0], 'Mahmoud Saleh', d(-12), 'Workmanship', 'Major', 'Incorrect torque on busbar bolts', 'Calibrated torque wrench not used', 'Re-torque all bolts; retrain crew', 'Open', null],
        ['NCR-2402', projIds[2], 'Mahmoud Saleh', d(-25), 'Material', 'Minor', 'Cable drum without test certificate', 'Supplier documentation gap', 'Obtain MTC from supplier', 'In Progress', null],
        ['NCR-2403', projIds[1], 'Fahad Al-Dossari', d(-40), 'Documentation', 'Minor', 'As-built drawings not updated', 'Process not followed', 'Update and re-submit', 'Closed', d(-20)],
      ]
      ncrs.forEach((n) => this.run('INSERT INTO quality_ncr (ncr_number, project_id, raised_by, date_raised, category, severity, description, root_cause, corrective_action, status, closed_date) VALUES (?,?,?,?,?,?,?,?,?,?,?)', n))

      const audits = [
        ['Internal', 'Substation RYD North', 'Mahmoud Saleh', d(-8), 82, 3, 'Completed', 'ISO 9001 internal audit — 3 minor findings'],
        ['External', 'Head Office', 'BSI', d(30), null, 0, 'Planned', 'ISO 45001 surveillance audit'],
        ['Internal', 'Fleet & Stores', 'Omar Farouk', d(14), null, 0, 'Planned', 'HSE inspection'],
      ]
      audits.forEach((a) => this.run('INSERT INTO quality_audits (audit_type, area, auditor, audit_date, score, findings_count, status, notes) VALUES (?,?,?,?,?,?,?,?)', a))
    })
    console.log('[db] seeded demo data')
  }
}
