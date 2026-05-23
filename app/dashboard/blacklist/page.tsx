'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type BlacklistEntry = {
  id: string; customer_name: string; customer_phone: string
  reason: string | null; added_by: string | null; created_at: string
}

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

const emptyForm = { customer_name: '', customer_phone: '', reason: '', added_by: '' }

export default function BlacklistPage() {
  const [entries, setEntries] = useState<BlacklistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => { fetchBlacklist() }, [])

  async function fetchBlacklist() {
    setLoading(true)
    const { data } = await supabase.from('blacklist').select('*').order('created_at', { ascending: false })
    setEntries(data || [])
    setLoading(false)
  }

  function set(field: string, value: string) { setForm(f => ({ ...f, [field]: value })) }

  async function handleSave() {
    if (!form.customer_name || !form.customer_phone) { setError('Name and phone are required.'); return }
    setSaving(true); setError('')
    await supabase.from('blacklist').insert({
      customer_name: form.customer_name, customer_phone: form.customer_phone,
      reason: form.reason || null, added_by: form.added_by || null,
    })
    await fetchBlacklist()
    setShowForm(false); setForm(emptyForm); setSaving(false)
  }

  async function handleDelete(id: string) {
    await supabase.from('blacklist').delete().eq('id', id)
    setDeleteConfirm(null); fetchBlacklist()
  }

  const filtered = entries.filter(e =>
    e.customer_name.toLowerCase().includes(search.toLowerCase()) || e.customer_phone.includes(search)
  )

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
        .logout-btn { width: 100%; padding: 11px; background: rgba(249,115,22,0.1); color: var(--orange); border: 1px solid rgba(249,115,22,0.2); border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 12px; letter-spacing: 0.5px; font-family: 'Syne', sans-serif; transition: all 0.2s; text-transform: uppercase; }
        .logout-btn:hover { background: var(--orange); color: #fff; }

        .main { flex: 1; overflow-y: auto; background: var(--bg); }
        .main-inner { padding: 36px 40px; }

        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
        .page-title { font-size: 30px; font-weight: 800; color: #fff; letter-spacing: -1px; }
        .page-sub { font-size: 12px; color: var(--text-muted); margin-top: 6px; font-family: 'DM Mono', monospace; }

        .add-btn { padding: 12px 22px; background: rgba(248,113,113,0.1); color: var(--red); border: 1px solid rgba(248,113,113,0.2); border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 12px; letter-spacing: 0.5px; font-family: 'Syne', sans-serif; transition: all 0.2s; text-transform: uppercase; white-space: nowrap; }
        .add-btn:hover { background: var(--red); color: #fff; border-color: var(--red); }

        .search-box { width: 320px; padding: 10px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; color: var(--text); font-family: 'DM Mono', monospace; font-size: 13px; outline: none; margin-bottom: 20px; transition: border-color 0.2s; }
        .search-box:focus { border-color: var(--red); }
        .search-box::placeholder { color: var(--text-muted); }

        .form-card { background: var(--surface); border: 1px solid rgba(248,113,113,0.2); border-radius: var(--radius); overflow: hidden; margin-bottom: 24px; }
        .form-top-bar { height: 3px; background: linear-gradient(90deg, #f87171, #fb923c); }
        .form-inner { padding: 28px; }
        .form-title { font-size: 14px; font-weight: 700; color: var(--red); margin-bottom: 24px; text-transform: uppercase; letter-spacing: 1px; font-family: 'DM Mono', monospace; }
        .form-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .form-grid-3 { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; margin-bottom: 20px; }
        .form-field label { display: block; font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1.5px; font-family: 'DM Mono', monospace; margin-bottom: 8px; }
        .form-input { width: 100%; padding: 10px 14px; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-family: 'DM Mono', monospace; font-size: 13px; outline: none; transition: border-color 0.2s; }
        .form-input:focus { border-color: var(--red); }
        .form-input::placeholder { color: var(--text-muted); }
        .form-error { font-size: 12px; color: var(--red); font-family: 'DM Mono', monospace; margin-bottom: 16px; }
        .form-actions { display: flex; gap: 10px; }
        .btn-save { padding: 11px 24px; background: rgba(248,113,113,0.15); color: var(--red); border: 1px solid rgba(248,113,113,0.3); border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 12px; font-family: 'Syne', sans-serif; transition: all 0.2s; text-transform: uppercase; letter-spacing: 0.5px; }
        .btn-save:hover:not(:disabled) { background: var(--red); color: #fff; border-color: var(--red); }
        .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-cancel { padding: 11px 18px; background: transparent; color: var(--text-muted); border: 1px solid var(--border); border-radius: 10px; cursor: pointer; font-size: 12px; font-family: 'Syne', sans-serif; transition: all 0.2s; }
        .btn-cancel:hover { border-color: var(--border-bright); color: var(--text); }

        .table-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
        .table-header { padding: 20px 24px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
        .table-title { font-size: 14px; font-weight: 700; color: #fff; }
        .table-badge { padding: 4px 12px; background: rgba(248,113,113,0.1); color: var(--red); border: 1px solid rgba(248,113,113,0.2); border-radius: 20px; font-size: 11px; font-family: 'DM Mono', monospace; }
        table { width: 100%; border-collapse: collapse; }
        thead tr { border-bottom: 1px solid var(--border); }
        th { padding: 12px 20px; text-align: left; font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1.5px; font-family: 'DM Mono', monospace; font-weight: 500; }
        tbody tr { border-bottom: 1px solid rgba(255,255,255,0.03); transition: background 0.15s; }
        tbody tr:hover { background: rgba(255,255,255,0.02); }
        tbody tr:last-child { border-bottom: none; }
        td { padding: 14px 20px; font-size: 13px; vertical-align: middle; }
        .td-name { font-weight: 700; color: var(--red); }
        .td-phone { color: var(--text-dim); font-family: 'DM Mono', monospace; font-size: 12px; }
        .td-reason { color: var(--text-dim); font-size: 12px; max-width: 200px; }
        .td-by { color: var(--text-muted); font-size: 11px; font-family: 'DM Mono', monospace; }
        .td-date { color: var(--text-muted); font-size: 11px; font-family: 'DM Mono', monospace; }
        .empty-cell { padding: 48px; text-align: center; color: var(--text-muted); font-family: 'DM Mono', monospace; font-size: 12px; }

        .remove-btn { padding: 5px 12px; background: transparent; color: var(--text-muted); border: 1px solid var(--border); border-radius: 6px; cursor: pointer; font-size: 11px; font-family: 'DM Mono', monospace; transition: all 0.2s; }
        .remove-btn:hover { border-color: var(--red); color: var(--red); background: rgba(248,113,113,0.08); }
        .confirm-inline { display: flex; align-items: center; gap: 8px; }
        .confirm-yes { padding: 5px 12px; background: rgba(248,113,113,0.15); color: var(--red); border: 1px solid rgba(248,113,113,0.3); border-radius: 6px; cursor: pointer; font-size: 11px; font-family: 'DM Mono', monospace; transition: all 0.2s; }
        .confirm-yes:hover { background: var(--red); color: #fff; }
        .confirm-no { padding: 5px 10px; background: transparent; color: var(--text-muted); border: 1px solid var(--border); border-radius: 6px; cursor: pointer; font-size: 11px; font-family: 'DM Mono', monospace; }

        .bl-badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; background: rgba(248,113,113,0.1); color: var(--red); border-radius: 20px; font-size: 10px; font-family: 'DM Mono', monospace; border: 1px solid rgba(248,113,113,0.2); }
        .bl-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--red); }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.4s ease forwards; }
        .fade-in-1 { animation-delay: 0.05s; opacity: 0; }
        .fade-in-2 { animation-delay: 0.1s; opacity: 0; }
        .fade-in-3 { animation-delay: 0.15s; opacity: 0; }
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
              <a key={item.href} href={item.href} className={`nav-item${item.href === '/dashboard/blacklist' ? ' active' : ''}`}>
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </a>
            ))}
          </nav>
          <div className="sidebar-footer">
            <button className="logout-btn">⊗ &nbsp;Logout</button>
          </div>
        </aside>

        <main className="main">
          <div className="main-inner">
            {/* Header */}
            <div className="page-header fade-in fade-in-1">
              <div>
                <div className="page-title">Blacklist</div>
                <div className="page-sub">{filtered.length} blocked customers</div>
              </div>
              <button className="add-btn" onClick={() => { setShowForm(true); setForm(emptyForm) }}>
                ⊘ &nbsp;Add to Blacklist
              </button>
            </div>

            {/* Search */}
            <input
              className="search-box fade-in fade-in-2"
              placeholder="Search by name or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />

            {/* Form */}
            {showForm && (
              <div className="form-card fade-in fade-in-2">
                <div className="form-top-bar" />
                <div className="form-inner">
                  <div className="form-title">⊘ Add to Blacklist</div>
                  <div className="form-grid-2">
                    <div className="form-field">
                      <label>Customer Name *</label>
                      <input className="form-input" placeholder="Full name" value={form.customer_name} onChange={e => set('customer_name', e.target.value)} />
                    </div>
                    <div className="form-field">
                      <label>Phone Number *</label>
                      <input className="form-input" placeholder="06XXXXXXXX" value={form.customer_phone} onChange={e => set('customer_phone', e.target.value)} />
                    </div>
                  </div>
                  <div className="form-grid-3">
                    <div className="form-field">
                      <label>Reason</label>
                      <input className="form-input" placeholder="Why is this customer blacklisted?" value={form.reason} onChange={e => set('reason', e.target.value)} />
                    </div>
                    <div className="form-field">
                      <label>Added By</label>
                      <input className="form-input" placeholder="Your name" value={form.added_by} onChange={e => set('added_by', e.target.value)} />
                    </div>
                  </div>
                  {error && <div className="form-error">{error}</div>}
                  <div className="form-actions">
                    <button className="btn-save" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : '⊘ Blacklist'}</button>
                    <button className="btn-cancel" onClick={() => { setShowForm(false); setError('') }}>Cancel</button>
                  </div>
                </div>
              </div>
            )}

            {/* Table */}
            <div className="table-card fade-in fade-in-3">
              <div className="table-header">
                <span className="table-title">Blocked Customers</span>
                <span className="table-badge">⊘ {filtered.length} blocked</span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Reason</th>
                    <th>Added By</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="empty-cell">Loading...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={6} className="empty-cell">No blacklisted customers</td></tr>
                  ) : filtered.map(entry => (
                    <tr key={entry.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--red)', flexShrink: 0 }}>
                            {entry.customer_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="td-name">{entry.customer_name}</span>
                        </div>
                      </td>
                      <td className="td-phone">{entry.customer_phone}</td>
                      <td className="td-reason">{entry.reason || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                      <td className="td-by">{entry.added_by || '—'}</td>
                      <td className="td-date">{new Date(entry.created_at).toLocaleDateString('en-GB')}</td>
                      <td>
                        {deleteConfirm === entry.id ? (
                          <div className="confirm-inline">
                            <button className="confirm-yes" onClick={() => handleDelete(entry.id)}>Confirm</button>
                            <button className="confirm-no" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                          </div>
                        ) : (
                          <button className="remove-btn" onClick={() => setDeleteConfirm(entry.id)}>Remove</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}