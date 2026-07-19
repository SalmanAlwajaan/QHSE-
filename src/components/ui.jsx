import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Inbox, Loader2, AlertTriangle } from 'lucide-react'
import { initials } from '../lib/format.js'

export function Badge({ tone = 'gray', children, className = '' }) {
  return <span className={`badge badge-${tone} ${className}`}>{children}</span>
}

export function Card({ children, className = '', pad = true }) {
  return <div className={`card ${pad ? 'card-pad' : ''} ${className}`}>{children}</div>
}

export function Avatar({ name, size = 34 }) {
  return (
    <div style={{ width: size, height: size, fontSize: size * 0.36, background: 'var(--primary-soft)', color: 'var(--primary-text)' }}
      className="rounded-full flex items-center justify-center font-semibold shrink-0"
    >{initials(name)}</div>
  )
}

export function StatCard({ label, value, icon: Icon, tone = 'primary', hint, onClick }) {
  const toneVar = { primary: 'var(--primary-text)', red: 'var(--danger-text)', amber: 'var(--warning-text)', green: 'var(--success-text)', blue: 'var(--info-text)' }[tone]
  const toneBg = { primary: 'var(--primary-soft)', red: 'var(--danger-soft)', amber: 'var(--warning-soft)', green: 'var(--success-soft)', blue: 'var(--info-soft)' }[tone]
  return (
    <div className={`card card-pad ${onClick ? 'cursor-pointer hover:border-[var(--border-strong)]' : ''}`} onClick={onClick} style={{ transition: 'border .14s' }}>
      <div className="flex items-start justify-between">
        <div className="text-[12.5px] font-medium" style={{ color: 'var(--muted)' }}>{label}</div>
        {Icon && <div className="rounded-lg flex items-center justify-center" style={{ width: 30, height: 30, background: toneBg, color: toneVar }}><Icon size={16} /></div>}
      </div>
      <div className="text-[26px] font-semibold mt-1.5 leading-none" style={{ color: 'var(--text)' }}>{value}</div>
      {hint && <div className="text-[11.5px] mt-2" style={{ color: 'var(--faint)' }}>{hint}</div>}
    </div>
  )
}

export function PageHeader({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5">
      <div className="flex items-start gap-3">
        {Icon && <div className="rounded-xl flex items-center justify-center shrink-0" style={{ width: 40, height: 40, background: 'var(--primary-soft)', color: 'var(--primary-text)' }}><Icon size={20} /></div>}
        <div>
          <h1 className="text-[20px] font-semibold leading-tight" style={{ color: 'var(--text)' }}>{title}</h1>
          {subtitle && <p className="text-[13px] mt-0.5" style={{ color: 'var(--muted)' }}>{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">{children}</div>
    </div>
  )
}

export function EmptyState({ icon: Icon = Inbox, title, subtitle, action }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-2xl flex items-center justify-center mb-4" style={{ width: 56, height: 56, background: 'var(--surface-3)', color: 'var(--faint)' }}><Icon size={26} /></div>
      <div className="font-semibold text-[15px]" style={{ color: 'var(--text)' }}>{title || t('common.nothingHere')}</div>
      <div className="text-[13px] mt-1 max-w-sm" style={{ color: 'var(--muted)' }}>{subtitle || t('common.addFirstRecord')}</div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Spinner({ label }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-center gap-2 py-16" style={{ color: 'var(--muted)' }}>
      <Loader2 size={18} className="animate-spin" /> {label || t('common.loading')}
    </div>
  )
}

export function Progress({ value = 0 }) {
  return <div className="progress" style={{ width: 90 }}><span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>
}

export function Modal({ title, subtitle, onClose, children, footer, wide }) {
  const { t } = useTranslation()
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="card elev m-auto fade-in" style={{ width: wide ? 720 : 520, maxWidth: '94vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <div className="font-semibold text-[15px]" style={{ color: 'var(--text)' }}>{title}</div>
            {subtitle && <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--muted)' }}>{subtitle}</div>}
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label={t('common.close')}><X size={16} /></button>
        </div>
        <div className="px-5 py-4 overflow-auto">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 px-5 py-3.5" style={{ borderTop: '1px solid var(--border)' }}>{footer}</div>}
      </div>
    </div>
  )
}

export function ConfirmDialog({ title, message, confirmLabel, danger = true, onConfirm, onClose }) {
  const { t } = useTranslation()
  return (
    <Modal title={title} onClose={onClose} footer={(
      <>
        <button className="btn" onClick={onClose}>{t('common.cancel')}</button>
        <button className={danger ? 'btn btn-danger' : 'btn btn-primary'} onClick={onConfirm}>{confirmLabel || t('common.delete')}</button>
      </>
    )}>
      <div className="flex gap-3">
        <div className="rounded-lg flex items-center justify-center shrink-0" style={{ width: 38, height: 38, background: 'var(--danger-soft)', color: 'var(--danger-text)' }}><AlertTriangle size={18} /></div>
        <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>{message}</p>
      </div>
    </Modal>
  )
}

export function ToastHost({ toasts, dismiss }) {
  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 100, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map((t) => (
        <div key={t.id} className="card elev fade-in" style={{ padding: '11px 14px', minWidth: 240, maxWidth: 360, borderLeft: `3px solid var(--${t.tone === 'error' ? 'danger' : t.tone === 'success' ? 'success' : 'primary'})` }} onClick={() => dismiss(t.id)}>
          <div className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>{t.title}</div>
          {t.message && <div className="text-[12px] mt-0.5" style={{ color: 'var(--muted)' }}>{t.message}</div>}
        </div>
      ))}
    </div>
  )
}
