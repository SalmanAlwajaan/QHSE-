import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { call } from '../lib/api.js'

const SOURCES = {
  employees: { action: 'options.employees', map: (r) => ({ value: r.emp_id, label: `${r.full_name} · ${r.emp_id}` }) },
  projects: { action: 'options.projects', map: (r) => ({ value: r.id, label: r.name }) },
  ppeItems: { action: 'options.ppeItems', map: (r) => ({ value: r.id, label: `${r.name} (stock ${r.stock_qty})` }) },
  assets: { action: 'options.assets', map: (r) => ({ value: r.id, label: `${r.name} · ${r.identifier}` }) },
}

function normOptions(opts) {
  return (opts || []).map((o) => (typeof o === 'string' ? { value: o, label: o } : o))
}

export default function Form({ fields, initial = {}, onSubmit, onCancel, submitLabel, busy }) {
  const { t } = useTranslation()
  const [values, setValues] = useState(() => ({ ...initial }))
  const [errors, setErrors] = useState({})
  const [remote, setRemote] = useState({})

  useEffect(() => {
    const needed = [...new Set(fields.filter((f) => f.source).map((f) => f.source))]
    needed.forEach((src) => {
      const cfg = SOURCES[src]
      if (!cfg) return
      call(cfg.action).then((rows) => setRemote((r) => ({ ...r, [src]: rows.map(cfg.map) }))).catch(() => {})
    })
  }, [fields])

  const set = (name, v) => setValues((p) => ({ ...p, [name]: v }))

  const submit = () => {
    const errs = {}
    fields.forEach((f) => {
      if (f.required && (values[f.name] === undefined || values[f.name] === '' || values[f.name] === null)) errs[f.name] = true
    })
    setErrors(errs)
    if (Object.keys(errs).length) return
    onSubmit(values)
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
        {fields.map((f) => {
          const opts = f.source ? (remote[f.source] || []) : normOptions(f.options)
          const span = f.full || f.type === 'textarea' ? 'col-span-2' : ''
          const val = values[f.name] ?? ''
          return (
            <div key={f.name} className={span}>
              <label className="label">{f.label}{f.required && <span style={{ color: 'var(--danger)' }}> *</span>}</label>
              {f.type === 'textarea' ? (
                <textarea className="textarea" value={val} placeholder={f.placeholder} onChange={(e) => set(f.name, e.target.value)} />
              ) : f.type === 'select' ? (
                <select className="select" value={val === null || val === undefined ? '' : String(val)} onChange={(e) => set(f.name, e.target.value)} style={errors[f.name] ? { borderColor: 'var(--danger)' } : undefined}>
                  <option value="">{f.placeholder || t('common.select')}</option>
                  {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : f.type === 'checkbox' ? (
                <label className="flex items-center gap-2 h-[38px] text-[13px] cursor-pointer" style={{ color: 'var(--text)' }}>
                  <input type="checkbox" checked={!!values[f.name]} onChange={(e) => set(f.name, e.target.checked ? 1 : 0)} style={{ width: 16, height: 16 }} />
                  {f.checkboxLabel || t('common.yes')}
                </label>
              ) : (
                <input className="input" type={f.type || 'text'} value={val} step={f.step} placeholder={f.placeholder}
                  onChange={(e) => set(f.name, f.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
                  style={errors[f.name] ? { borderColor: 'var(--danger)' } : undefined} />
              )}
            </div>
          )
        })}
      </div>
      <div className="flex items-center justify-end gap-2 mt-5">
        <button className="btn" onClick={onCancel}>{t('common.cancel')}</button>
        <button className="btn btn-primary" onClick={submit} disabled={busy}>{submitLabel || t('common.save')}</button>
      </div>
    </div>
  )
}
