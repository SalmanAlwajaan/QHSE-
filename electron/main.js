import { app, BrowserWindow, ipcMain, dialog, nativeTheme, shell } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import ExcelJS from 'exceljs'
import { Database } from './db/database.js'
import { canWrite, TABLE_TO_MODULE } from '../src/config/permissions.js'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isDev = !app.isPackaged

let win = null
let db = null

async function initDatabase() {
  const dataDir = app.getPath('userData')
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  const dbPath = path.join(dataDir, 'sentinel-qhse.sqlite')
  const wasmPath = require.resolve('sql.js/dist/sql-wasm.wasm')
  db = new Database()
  await db.init({ dbPath, wasmPath })
  console.log('[db] ready at', dbPath)
}

function createWindow() {
  win = new BrowserWindow({
    width: 1340,
    height: 860,
    minWidth: 1040,
    minHeight: 680,
    backgroundColor: '#0b1220',
    title: 'Sentinel — QHSE Operations Platform',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  if (isDev) {
    win.loadURL('http://127.0.0.1:5273')
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

// ---- IPC: the single data channel ----------------------------------------
ipcMain.handle('api', async (_e, { action, params }) => {
  try {
    const data = await db.call(action, params || {})
    return { ok: true, data }
  } catch (err) {
    console.error('[api error]', action, err)
    return { ok: false, error: String(err && err.message ? err.message : err) }
  }
})

// ---- IPC: Excel export ----------------------------------------------------
ipcMain.handle('excel:export', async (_e, { table, title }) => {
  try {
    const rows = db.exportRows(table)
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet((title || table).slice(0, 28))
    if (rows.length) {
      ws.columns = Object.keys(rows[0]).map((k) => ({ header: k, key: k, width: 18 }))
      ws.addRows(rows)
      ws.getRow(1).font = { bold: true }
      ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }
      ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
    }
    const stamp = new Date().toISOString().slice(0, 10)
    const res = await dialog.showSaveDialog(win, {
      title: 'Export to Excel',
      defaultPath: `${table}-${stamp}.xlsx`,
      filters: [{ name: 'Excel', extensions: ['xlsx'] }],
    })
    if (res.canceled || !res.filePath) return { ok: false, canceled: true }
    await wb.xlsx.writeFile(res.filePath)
    return { ok: true, count: rows.length, path: res.filePath }
  } catch (err) {
    return { ok: false, error: String(err.message || err) }
  }
})

// ---- IPC: Excel import ----------------------------------------------------
ipcMain.handle('excel:import', async (_e, { table, role }) => {
  try {
    if (!canWrite(role, TABLE_TO_MODULE[table] || table)) return { ok: false, error: 'Not authorized to import this data.' }
    const res = await dialog.showOpenDialog(win, {
      title: 'Import from Excel',
      properties: ['openFile'],
      filters: [{ name: 'Spreadsheets', extensions: ['xlsx', 'xls', 'csv'] }],
    })
    if (res.canceled || !res.filePaths.length) return { ok: false, canceled: true }
    const wb = new ExcelJS.Workbook()
    const file = res.filePaths[0]
    if (file.toLowerCase().endsWith('.csv')) await wb.csv.readFile(file)
    else await wb.xlsx.readFile(file)
    const ws = wb.worksheets[0]
    if (!ws) return { ok: false, error: 'No sheet found in file.' }

    const headers = []
    ws.getRow(1).eachCell((cell, col) => { headers[col] = String(cell.value || '').trim() })
    const rows = []
    ws.eachRow((row, idx) => {
      if (idx === 1) return
      const obj = {}
      row.eachCell((cell, col) => {
        const h = headers[col]
        if (!h) return
        let v = cell.value
        if (v && typeof v === 'object' && v.text) v = v.text // hyperlink/richtext
        if (v instanceof Date) v = v.toISOString().slice(0, 10)
        obj[h] = v
      })
      if (Object.keys(obj).length) rows.push(obj)
    })
    const result = db.importRows(table, rows)
    return { ok: true, ...result, file }
  } catch (err) {
    return { ok: false, error: String(err.message || err) }
  }
})

ipcMain.handle('app:revealData', async () => {
  shell.openPath(app.getPath('userData'))
  return { ok: true }
})

ipcMain.handle('app:setTheme', async (_e, mode) => {
  nativeTheme.themeSource = mode === 'dark' ? 'dark' : mode === 'light' ? 'light' : 'system'
  return { ok: true }
})

app.whenReady().then(async () => {
  await initDatabase()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
