import React from 'react'
import { useTranslation } from 'react-i18next'
import { EmptyState } from './ui.jsx'

export default function DataTable({ columns, rows, rowKey = 'id', onRowClick, actions, empty }) {
  const { t } = useTranslation()
  if (!rows || rows.length === 0) {
    return empty || <EmptyState />
  }
  return (
    <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
      <table className="tbl">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={{ width: c.width, textAlign: c.align || 'start' }}>{c.label}</th>
            ))}
            {actions && <th style={{ width: 96, textAlign: 'end' }}>{t('common.actions')}</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[rowKey]} onClick={onRowClick ? () => onRowClick(row) : undefined} style={onRowClick ? { cursor: 'pointer' } : undefined}>
              {columns.map((c) => (
                <td key={c.key} style={{ textAlign: c.align || 'start' }} className={c.className}>
                  {c.render ? c.render(row) : (row[c.key] ?? '—')}
                </td>
              ))}
              {actions && <td style={{ textAlign: 'end' }} onClick={(e) => e.stopPropagation()}>{actions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
