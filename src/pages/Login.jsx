import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Shield, Sun, Moon, LogIn } from 'lucide-react'
import { call } from '../lib/api.js'

export default function Login({ onLogin, theme, onToggleTheme }) {
  const { t } = useTranslation()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e?.preventDefault()
    setBusy(true); setError('')
    try {
      const user = await call('auth.login', { username, password })
      onLogin(user)
    } catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <button className="btn btn-ghost btn-icon" style={{ position: 'fixed', top: 18, insetInlineEnd: 18 }} onClick={onToggleTheme}>{theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</button>
      <div className="card elev fade-in" style={{ width: 400, padding: '34px 32px' }}>
        <div className="flex flex-col items-center text-center mb-7">
          <div className="rounded-2xl flex items-center justify-center mb-4" style={{ width: 56, height: 56, background: 'var(--primary)', color: '#fff' }}><Shield size={28} /></div>
          <h1 className="text-[22px] font-semibold" style={{ color: 'var(--text)' }}>{t('app.name')}</h1>
          <p className="text-[13px] mt-1" style={{ color: 'var(--muted)' }}>{t('login.tagline')}</p>
        </div>
        <form onSubmit={submit}>
          <label className="label">{t('login.username')}</label>
          <input className="input mb-3" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
          <label className="label">{t('login.password')}</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <div className="mt-3 text-[12.5px]" style={{ color: 'var(--danger-text)' }}>{error}</div>}
          <button className="btn btn-primary w-full mt-5" type="submit" disabled={busy} style={{ height: 42 }}><LogIn size={16} /> {busy ? t('login.signingIn') : t('login.signIn')}</button>
        </form>
        <div className="mt-6 pt-4 text-center" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="text-[11.5px]" style={{ color: 'var(--faint)' }}>{t('login.demoAccounts')}</div>
          <div className="text-[12px] mt-1.5 flex flex-wrap gap-x-3 gap-y-1 justify-center" style={{ color: 'var(--muted)' }}>
            <span><b style={{ color: 'var(--text)' }}>admin</b> / admin123</span>
            <span><b style={{ color: 'var(--text)' }}>hr</b> / hr123</span>
            <span><b style={{ color: 'var(--text)' }}>pm</b> / pm123</span>
            <span><b style={{ color: 'var(--text)' }}>hse</b> / hse123</span>
            <span><b style={{ color: 'var(--text)' }}>ceo</b> / ceo123</span>
            <span><b style={{ color: 'var(--text)' }}>employee</b> / employee123</span>
          </div>
        </div>
      </div>
    </div>
  )
}
