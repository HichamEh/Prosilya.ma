'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const SIDEBAR_ITEMS = [
  { label: 'Dashboard',    href: '/dashboard',              icon: '▣' },
  { label: 'Orders',       href: '/dashboard/orders',       icon: '◈' },
  { label: 'Confirmation', href: '/dashboard/confirmation', icon: '◉' },
  { label: 'Stock',        href: '/dashboard/stock',        icon: '◫' },
  { label: 'Employees',    href: '/dashboard/employees',    icon: '◎' },
  { label: 'Attendance',   href: '/dashboard/attendance',   icon: '◷' },
  { label: 'Payroll',      href: '/dashboard/payroll',      icon: '◈' },
  { label: 'Blacklist',    href: '/dashboard/blacklist',    icon: '⊘' },
  { label: 'Settings',     href: '/dashboard/settings',     icon: '◌' },
]

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [orgName, setOrgName] = useState('')
  const [orgId, setOrgId] = useState('')
  const [saving, setSaving] = useState(false)
  const [orgSuccess, setOrgSuccess] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [pwSuccess, setPwSuccess] = useState('')
  const [pwError, setPwError] = useState('')
  const [showPw, setShowPw] = useState(false)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (user) {
      const { data: profile } = await supabase.from('users').select('organization_id').eq('id', user.id).single()
      if (profile?.organization_id) {
        setOrgId(profile.organization_id)
        const { data: org } = await supabase.from('organizations').select('name').eq('id', profile.organization_id).single()
        if (org) setOrgName(org.name)
      }
    }
  }

  async function saveOrgName() {
    if (!orgId || !orgName) return
    setSaving(true); setOrgSuccess('')
    await supabase.from('organizations').update({ name: orgName }).eq('id', orgId)
    setSaving(false); setOrgSuccess('Organization name updated!')
    setTimeout(() => setOrgSuccess(''), 3000)
  }

  async function changePassword() {
    if (!newPassword || newPassword.length < 6) { setPwError('Password must be at least 6 characters.'); return }
    setPwError('')
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) { setPwError(error.message) }
    else { setPwSuccess('Password updated successfully!'); setNewPassword(''); setTimeout(() => setPwSuccess(''), 3000) }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #080c10; --surface: #0e1318; --surface2: #131a22;
          --border: rgba(255,255,255,0.06); --border-bright: rgba(255,255,255,0.12);
          --text: #e2e8f0; --text-muted: #64748b; --text-dim: #94a3b8;
          --green: #22c55e; --orange: #f97316; --red: #f87171; --radius: 14px;
        }
        html, body { height: 100%; background: var(--bg); color: var(--text); font-family: 'Syne', sans-serif; }
        .layout { display: flex; height: 100vh; overflow: hidden; }

        .sidebar { width: 240px; flex-shrink: 0; background: var(--surface); border-right: 1px solid var(--border); display: flex; flex-direction: column; }
        .sidebar-brand { padding: 28px 24px 24px; border-bottom: 1px solid var(--border); }
        .brand-logo { font-size: 20px; font-weight: 800; color: #fff; }
        .brand-logo span { color: var(--orange); }
        .brand-org { font-size: 10px; color: var(--text-muted); margin-top: 6px; text-transform: uppercase; letter-spacing: 2px; font-family: 'DM Mono', monospace; }
        .sidebar-nav { flex: 1; padding: 12px 0; overflow-y: auto; }
        .nav-label { font-size: 9px; color: var(--text-muted); letter-spacing: 2px; text-transform: uppercase; padding: 16px 24px 8px; font-family: 'DM Mono', monospace; }
        .nav-item { display: flex; align-items: center; gap: 12px; padding: 10px 24px; color: var(--text-muted); text-decoration: none; font-size: 13px; font-weight: 600; position: relative; transition: all 0.2s; }
        .nav-item:hover { color: var(--text); background: rgba(255,255,255,0.03); }
        .nav-item.active { color: #fff; background: linear-gradient(90deg, rgba(34,197,94,0.1) 0%, transparent 100%); }
        .nav-item.active::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--green); border-radius: 0 2px 2px 0; }
        .nav-icon { font-size: 16px; width: 20px; text-align: center; }
        .sidebar-footer { padding: 16px; border-top: 1px solid var(--border); }
        .logout-btn { width: 100%; padding: 11px; background: rgba(249,115,22,0.1); color: var(--orange); border: 1px solid rgba(249,115,22,0.2); border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 12px; font-family: 'Syne', sans-serif; transition: all 0.2s; text-transform: uppercase; }
        .logout-btn:hover { background: var(--orange); color: #fff; }

        .main { flex: 1; overflow-y: auto; background: var(--bg); }
        .main-inner { padding: 36px 40px; max-width: 620px; }

        .page-title { font-size: 30px; font-weight: 800; color: #fff; letter-spacing: -1px; margin-bottom: 32px; }

        .settings-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; margin-bottom: 20px; }
        .card-bar { height: 3px; }
        .card-inner { padding: 28px; }
        .card-title { font-size: 12px; font-weight: 700; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1.5px; font-family: 'DM Mono', monospace; margin-bottom: 20px; }

        .info-row { display: flex; justify-content: space-between; align-items: center; padding: 11px 0; border-bottom: 1px solid var(--border); }
        .info-row:last-of-type { border-bottom: none; }
        .info-label { font-size: 11px; color: var(--text-muted); font-family: 'DM Mono', monospace; text-transform: uppercase; letter-spacing: 0.5px; }
        .info-value { font-size: 13px; color: var(--text); font-family: 'DM Mono', monospace; text-align: right; max-width: 300px; word-break: break-all; }
        .info-value.dim { font-size: 11px; color: var(--text-muted); }

        .field-label { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1.5px; font-family: 'DM Mono', monospace; margin-bottom: 8px; display: block; }
        .form-input { width: 100%; padding: 10px 14px; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-family: 'DM Mono', monospace; font-size: 13px; outline: none; transition: border-color 0.2s; margin-bottom: 16px; }
        .form-input:focus { border-color: var(--green); }
        .form-input::placeholder { color: var(--text-muted); }

        .pw-wrapper { position: relative; margin-bottom: 16px; }
        .pw-input { width: 100%; padding: 10px 44px 10px 14px; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-family: 'DM Mono', monospace; font-size: 13px; outline: none; transition: border-color 0.2s; }
        .pw-input:focus { border-color: var(--green); }
        .pw-input::placeholder { color: var(--text-muted); }
        .pw-toggle { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 13px; font-family: 'DM Mono', monospace; padding: 0; transition: color 0.15s; }
        .pw-toggle:hover { color: var(--text); }

        .alert { padding: 10px 14px; border-radius: 8px; font-size: 12px; font-family: 'DM Mono', monospace; margin-bottom: 14px; }
        .alert-success { background: rgba(34,197,94,0.1); color: #34d399; border: 1px solid rgba(34,197,94,0.2); }
        .alert-error   { background: rgba(248,113,113,0.1); color: var(--red); border: 1px solid rgba(248,113,113,0.2); }

        .save-btn { padding: 10px 24px; background: rgba(34,197,94,0.1); color: var(--green); border: 1px solid rgba(34,197,94,0.2); border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 12px; font-family: 'Syne', sans-serif; transition: all 0.2s; text-transform: uppercase; }
        .save-btn:hover:not(:disabled) { background: var(--green); color: #fff; }
        .save-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        .danger-card { background: var(--surface); border: 1px solid rgba(248,113,113,0.15); border-radius: var(--radius); overflow: hidden; margin-bottom: 20px; }
        .danger-title { font-size: 12px; font-weight: 700; color: var(--red); text-transform: uppercase; letter-spacing: 1.5px; font-family: 'DM Mono', monospace; margin-bottom: 8px; }
        .danger-desc { font-size: 12px; color: var(--text-muted); font-family: 'DM Mono', monospace; margin-bottom: 18px; }
        .danger-btn { padding: 10px 22px; background: rgba(248,113,113,0.1); color: var(--red); border: 1px solid rgba(248,113,113,0.2); border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 12px; font-family: 'Syne', sans-serif; transition: all 0.2s; text-transform: uppercase; }
        .danger-btn:hover { background: var(--red); color: #fff; border-color: var(--red); }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.35s ease forwards; }
      `}</style>

      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="brand-logo">Pro<span>Silya</span></div>
            <div className="brand-org">Management System</div>
          </div>
          <nav className="sidebar-nav">
            <div className="nav-label">Menu</div>
            {SIDEBAR_ITEMS.map(item => (
              <a key={item.href} href={item.href} className={`nav-item${item.href === '/dashboard/settings' ? ' active' : ''}`}>
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </a>
            ))}
          </nav>
          <div className="sidebar-footer">
            <button className="logout-btn" onClick={handleLogout}>⊗ &nbsp;Logout</button>
          </div>
        </aside>

        <main className="main">
          <div className="main-inner fade-in">
            <div className="page-title">Settings</div>

            {/* Account */}
            <div className="settings-card">
              <div className="card-bar" style={{ background: 'linear-gradient(90deg, #22c55e, #f97316)' }} />
              <div className="card-inner">
                <div className="card-title">◎ Account</div>
                <div className="info-row">
                  <span className="info-label">Email</span>
                  <span className="info-value">{user?.email || '—'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">User ID</span>
                  <span className="info-value dim">{user?.id || '—'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Last Sign In</span>
                  <span className="info-value">{user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('en-GB') : '—'}</span>
                </div>
              </div>
            </div>

            {/* Organization */}
            <div className="settings-card">
              <div className="card-bar" style={{ background: 'linear-gradient(90deg, #f97316, #22c55e)' }} />
              <div className="card-inner">
                <div className="card-title">◫ Organization</div>
                <label className="field-label">Organization Name</label>
                <input
                  className="form-input"
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  placeholder="Your company name"
                />
                {orgSuccess && <div className="alert alert-success">✓ &nbsp;{orgSuccess}</div>}
                <button className="save-btn" onClick={saveOrgName} disabled={saving}>
                  {saving ? 'Saving...' : '◈ Save'}
                </button>
              </div>
            </div>

            {/* Password */}
            <div className="settings-card">
              <div className="card-bar" style={{ background: 'linear-gradient(90deg, #38bdf8, #22c55e)' }} />
              <div className="card-inner">
                <div className="card-title">◉ Change Password</div>
                <label className="field-label">New Password</label>
                <div className="pw-wrapper">
                  <input
                    className="pw-input"
                    type={showPw ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                  <button className="pw-toggle" onClick={() => setShowPw(s => !s)}>
                    {showPw ? 'hide' : 'show'}
                  </button>
                </div>
                {pwSuccess && <div className="alert alert-success">✓ &nbsp;{pwSuccess}</div>}
                {pwError   && <div className="alert alert-error">✕ &nbsp;{pwError}</div>}
                <button className="save-btn" onClick={changePassword}>◉ Update Password</button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="danger-card">
              <div className="card-bar" style={{ background: 'linear-gradient(90deg, #f87171, #f43f5e)' }} />
              <div className="card-inner">
                <div className="danger-title">⊘ Danger Zone</div>
                <div className="danger-desc">Sign out of your account on this device.</div>
                <button className="danger-btn" onClick={handleLogout}>⊗ &nbsp;Logout</button>
              </div>
            </div>

          </div>
        </main>
      </div>
    </>
  )
}