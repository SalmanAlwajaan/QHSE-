import React from 'react'
import { useTranslation } from 'react-i18next'
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from 'recharts'
import { Users, AlertTriangle, CalendarX, ClipboardCheck, FileWarning, HardHat, Leaf, ListChecks } from 'lucide-react'
import { useQuery } from '../lib/api.js'
import { useApp } from '../lib/store.jsx'
import { StatCard, Card, Spinner, Badge } from '../components/ui.jsx'
import { fmtDate } from '../lib/format.js'

const C = { green: '#22c55e', amber: '#f59e0b', red: '#ef4444', blue: '#3b82f6' }
const tooltipStyle = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontSize: 12, boxShadow: 'var(--shadow)' }

function ChartCard({ title, children, action }) {
  return (
    <Card pad={false}>
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="font-semibold text-[14px]" style={{ color: 'var(--text)' }}>{title}</div>
        {action}
      </div>
      <div className="px-3 pb-3">{children}</div>
    </Card>
  )
}

export default function Dashboard({ onNavigate }) {
  const { t } = useTranslation()
  const { user, settings } = useApp()
  const { data: k, loading } = useQuery('dashboard.kpis')
  if (loading || !k) return <Spinner label={t('common.loading')} />

  const compColors = { Valid: C.green, Expiring: C.amber, Expired: C.red }
  const legendLabel = { Valid: t('dashboard.legendValid'), Expiring: t('dashboard.legendExpiring'), Expired: t('dashboard.legendExpired') }

  return (
    <div className="fade-in">
      <div className="mb-5">
        <h1 className="text-[22px] font-semibold leading-tight" style={{ color: 'var(--text)' }}>
          {t('dashboard.welcome', { name: user.full_name.split(' ')[0] })}
        </h1>
        <p className="text-[13px] mt-1" style={{ color: 'var(--muted)' }}>
          {t('dashboard.subtitle', { company: settings.company_name || t('dashboard.yourCompany') })}
        </p>
      </div>

      <div className="grid gap-3.5 mb-3.5" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <StatCard label={t('dashboard.statActiveEmployees')} value={k.activeEmployees} icon={Users} tone="primary" hint={t('dashboard.statActiveEmployeesHint', { count: k.totalEmployees })} onClick={() => onNavigate('employees')} />
        <StatCard label={t('dashboard.statExpiring30')} value={k.expiringSoon} icon={AlertTriangle} tone="amber" hint={t('dashboard.statExpiringHint')} onClick={() => onNavigate('cards')} />
        <StatCard label={t('dashboard.statExpired')} value={k.expired} icon={CalendarX} tone="red" hint={t('dashboard.statExpiredHint')} onClick={() => onNavigate('cards')} />
        <StatCard label={t('dashboard.statInspectionsToday')} value={`${k.inspectionRate}%`} icon={ClipboardCheck} tone="green" hint={t('dashboard.statInspectionsHint', { done: k.doneToday, required: k.requiredInspections })} onClick={() => onNavigate('inspections')} />
      </div>

      <div className="grid gap-3.5 mb-3.5" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <StatCard label={t('dashboard.statOpenNCRs')} value={k.openNCRs} icon={FileWarning} tone="amber" onClick={() => onNavigate('ncr')} />
        <StatCard label={t('dashboard.statPpeLowStock')} value={k.ppeLowStock} icon={HardHat} tone="red" onClick={() => onNavigate('ppe_stock')} />
        <StatCard label={t('dashboard.statEnvironmentDue')} value={k.environmentDue} icon={Leaf} tone="green" onClick={() => onNavigate('environment')} />
        <StatCard label={t('dashboard.statOpenWorkOrders')} value={k.openTasks} icon={ListChecks} tone="blue" onClick={() => onNavigate('tasks')} />
      </div>

      <div className="grid gap-3.5 mb-3.5" style={{ gridTemplateColumns: '1fr 1fr 1.2fr' }}>
        <ChartCard title={t('dashboard.chartCompliance')}>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={k.complianceBreakdown} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={2} stroke="none">
                {k.complianceBreakdown.map((e) => <Cell key={e.name} fill={compColors[e.name]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-1.5 px-2 pb-1">
            {k.complianceBreakdown.map((e) => (
              <div key={e.name} className="flex items-center justify-between text-[12.5px]">
                <span className="flex items-center gap-2" style={{ color: 'var(--muted)' }}><span className="dot" style={{ background: compColors[e.name] }} />{legendLabel[e.name] || e.name}</span>
                <span style={{ color: 'var(--text)', fontWeight: 500 }}>{e.value}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title={t('dashboard.chartInspections7d')}>
          <ResponsiveContainer width="100%" height={232}>
            <AreaChart data={k.inspectionTrend} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.blue} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={C.blue} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString('en-GB', { weekday: 'short' })} tick={{ fill: 'var(--faint)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: 'var(--faint)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={(d) => fmtDate(d)} />
              <Area type="monotone" dataKey="count" stroke={C.blue} strokeWidth={2} fill="url(#g1)" name={t('nav.items.inspections')} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t('dashboard.chartExpiryByType')} action={<span className="linkish text-[12px]" onClick={() => onNavigate('cards')}>{t('dashboard.viewAll')}</span>}>
          <ResponsiveContainer width="100%" height={232}>
            <BarChart data={k.expiryByKind} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="kind" tick={{ fill: 'var(--faint)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: 'var(--faint)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--surface-2)' }} />
              <Bar dataKey="expiring" stackId="a" fill={C.amber} name={t('dashboard.legendExpiring')} radius={[0, 0, 0, 0]} />
              <Bar dataKey="expired" stackId="a" fill={C.red} name={t('dashboard.legendExpired')} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <Card pad={false}>
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <div className="font-semibold text-[14px]" style={{ color: 'var(--text)' }}>{t('dashboard.tableExpiringTitle')}</div>
          <span className="linkish text-[12px]" onClick={() => onNavigate('cards')}>{t('dashboard.openCompliance')}</span>
        </div>
        {k.watchTop.length === 0 ? (
          <div className="px-5 pb-5 text-[13px]" style={{ color: 'var(--muted)' }}>{t('dashboard.tableEverythingValid')}</div>
        ) : (
          <table className="tbl">
            <thead><tr><th>{t('dashboard.colType')}</th><th>{t('dashboard.colItem')}</th><th>{t('dashboard.colEmployee')}</th><th>{t('dashboard.colExpiry')}</th><th>{t('dashboard.colStatus')}</th></tr></thead>
            <tbody>
              {k.watchTop.map((w, i) => (
                <tr key={i}>
                  <td><Badge tone="gray">{w.kind}</Badge></td>
                  <td style={{ fontWeight: 500 }}>{w.subtype}</td>
                  <td style={{ color: 'var(--muted)' }}>{w.emp_name || '—'}</td>
                  <td style={{ color: 'var(--muted)' }}>{fmtDate(w.expiry_date)}</td>
                  <td><Badge tone={w.status === 'expired' || w.status === 'critical' ? 'red' : 'amber'}>{w.days < 0 ? t('alerts.expiredDays', { days: Math.abs(w.days) }) : t('alerts.daysLeft', { days: w.days })}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
