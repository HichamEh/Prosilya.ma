'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'

type Order = {
  id: string; customer_name: string; customer_phone: string
  customer_city: string; customer_address: string; total_cod: number
  status: string; delivery_company: string | null; notes: string | null; created_at: string
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

const STATUSES = [
  'new', 'in_queue', 'calling', 'confirmed',
  'cancelled', 'rescheduled', 'shipped', 'delivered', 'returned'
]

const STATUS_CFG: Record<string, { color: string; bg: string }> = {
  new:         { color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  in_queue:    { color: '#22d3ee', bg: 'rgba(34,211,238,0.12)' },
  calling:     { color: '#fb923c', bg: 'rgba(251,146,60,0.12)' },
  confirmed:   { color: '#a3e635', bg: 'rgba(163,230,53,0.12)' },
  cancelled:   { color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  rescheduled: { color: '#c084fc', bg: 'rgba(192,132,252,0.12)' },
  shipped:     { color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
  delivered:   { color: '#4ade80', bg: 'rgba(74,222,128,0.12)' },
  returned:    { color: '#f43f5e', bg: 'rgba(244,63,94,0.12)' },
}

export default function OrderDetailPage() {
  const router = useRouter()
  const { id } = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [notes, setNotes] = useState('')
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { fetchOrder() }, [id])

  async function fetchOrder() {
    const { data } = await supabase.from('orders').select('*').eq('id', id).single()
    if (data) { setOrder(data); setStatus(data.status); setNotes(data.notes || '') }
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true); setSuccess(''); setError('')
    const { error } = await supabase.from('orders').update({ status, notes: notes || null }).eq('id', id)
    if (error) { setError(error.message) } else { setSuccess('Order updated successfully!'); fetchOrder() }
    setSaving(false)
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
          --green: #22c55e; --orange: #f97316; --radius: 14px;
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
        .main-inner { padding: 36px 40px; }

        .page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; }
        .back-btn { width: 38px; height: 38px; border-radius: 10px; background: var(--surface); border: 1px solid var(--border); color: var(--text-dim); font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0; }
        .back-btn:hover { border-color: var(--green); color: var(--green); }
        .page-title { font-size: 30px; font-weight: 800; color: #fff; letter-spacing: -1px; }
        .page-sub { font-size: 12px; color: var(--text-muted); margin-top: 4px; font-family: 'DM Mono', monospace; }

        .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; max-width: 900px; }

        .panel { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
        .panel-bar { height: 3px; }
        .panel-inner { padding: 28px; }
        .panel-title { font-size: 13px; font-weight: 700; color: #fff; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px; font-family: 'DM Mono', monospace; }

        .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 11px 0; border-bottom: 1px solid var(--border); }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { font-size: 11px; color: var(--text-muted); font-family: 'DM Mono', monospace; text-transform: uppercase; letter-spacing: 0.5px; }
        .detail-value { font-size: 13px; font-weight: 600; color: var(--text); font-family: 'DM Mono', monospace; text-align: right; max-width: 220px; word-break: break-word; }
        .detail-value.highlight { color: var(--orange); font-size: 16px; font-weight: 800; }

        .call-link { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 13px; background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2); color: var(--green); border-radius: 10px; text-decoration: none; font-weight: 800; font-size: 14px; font-family: 'DM Mono', monospace; margin-bottom: 20px; transition: all 0.2s; letter-spacing: 0.5px; }
        .call-link:hover { background: var(--green); color: #fff; border-color: var(--green); }

        .field-label { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1.5px; font-family: 'DM Mono', monospace; margin-bottom: 8px; display: block; }

        .status-grid { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 20px; }
        .status-pill { padding: 6px 13px; border-radius: 20px; font-size: 10px; font-weight: 700; cursor: pointer; border: 1px solid; transition: all 0.15s; font-family: 'DM Mono', monospace; letter-spacing: 0.3px; text-transform: uppercase; }

        .notes-input { width: 100%; padding: 12px 14px; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-family: 'DM Mono', monospace; font-size: 13px; outline: none; resize: vertical; min-height: 96px; transition: border-color 0.2s; margin-bottom: 20px; }
        .notes-input:focus { border-color: var(--green); }
        .notes-input::placeholder { color: var(--text-muted); }

        .save-btn { width: 100%; padding: 13px; background: rgba(34,197,94,0.1); color: var(--green); border: 1px solid rgba(34,197,94,0.25); border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 13px; font-family: 'Syne', sans-serif; transition: all 0.2s; text-transform: uppercase; letter-spacing: 0.5px; }
        .save-btn:hover:not(:disabled) { background: var(--green); color: #fff; border-color: var(--green); }
        .save-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        .alert { padding: 10px 14px; border-radius: 8px; font-size: 12px; font-family: 'DM Mono', monospace; margin-bottom: 14px; }
        .alert-success { background: rgba(34,197,94,0.1); color: #34d399; border: 1px solid rgba(34,197,94,0.2); }
        .alert-error { background: rgba(248,113,113,0.1); color: #f87171; border: 1px solid rgba(248,113,113,0.2); }

        .loading-text { color: var(--text-muted); font-family: 'DM Mono', monospace; font-size: 13px; }

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
              <a key={item.href} href={item.href} className={`nav-item${item.href === '/dashboard/orders' ? ' active' : ''}`}>
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
            <div className="page-header fade-in">
              <button className="back-btn" onClick={() => router.push('/dashboard/orders')}>←</button>
              <div>
                <div className="page-title">Order Detail</div>
                <div className="page-sub">View and update order info</div>
              </div>
            </div>

            {loading ? (
              <p className="loading-text">Loading...</p>
            ) : !order ? (
              <p style={{ color: '#f87171', fontFamily: 'DM Mono, monospace', fontSize: 13 }}>Order not found.</p>
            ) : (
              <div className="detail-grid fade-in">

                {/* LEFT — Customer Info */}
                <div className="panel">
                  <div className="panel-bar" style={{ background: 'linear-gradient(90deg, #22c55e, #f97316)' }} />
                  <div className="panel-inner">
                    <div className="panel-title">◎ Customer Info</div>

                    <a href={`tel:${order.customer_phone}`} className="call-link">
                      ◉ &nbsp;{order.customer_phone}
                    </a>

                    {[
                      ['Name',         order.customer_name,                                      false],
                      ['City',         order.customer_city || '—',                               false],
                      ['Address',      order.customer_address || '—',                            false],
                      ['Delivery Co.', order.delivery_company || '—',                            false],
                      ['Total COD',    `${order.total_cod.toFixed(2)} MAD`,                      true],
                      ['Created',      new Date(order.created_at).toLocaleDateString('en-GB'),   false],
                    ].map(([label, value, highlight]) => (
                      <div key={label as string} className="detail-row">
                        <span className="detail-label">{label}</span>
                        <span className={`detail-value${highlight ? ' highlight' : ''}`}>{value as string}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RIGHT — Update */}
                <div className="panel">
                  <div className="panel-bar" style={{ background: 'linear-gradient(90deg, #f97316, #22c55e)' }} />
                  <div className="panel-inner">
                    <div className="panel-title">◈ Update Order</div>

                    <span className="field-label">Status</span>
                    <div className="status-grid">
                      {STATUSES.map(s => {
                        const cfg = STATUS_CFG[s] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' }
                        const isActive = status === s
                        return (
                          <button
                            key={s}
                            onClick={() => setStatus(s)}
                            className="status-pill"
                            style={isActive ? {
                              borderColor: cfg.color,
                              background: cfg.bg,
                              color: cfg.color,
                            } : {
                              borderColor: 'rgba(255,255,255,0.08)',
                              background: 'transparent',
                              color: 'var(--text-muted)',
                            }}
                          >
                            {s.replace('_', ' ')}
                          </button>
                        )
                      })}
                    </div>

                    <span className="field-label">Notes</span>
                    <textarea
                      className="notes-input"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Internal notes..."
                    />

                    {success && <div className="alert alert-success">✓ &nbsp;{success}</div>}
                    {error   && <div className="alert alert-error">✕ &nbsp;{error}</div>}

                    <button className="save-btn" onClick={handleSave} disabled={saving}>
                      {saving ? 'Saving...' : '◈ Save Changes'}
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>
        </main>
      </div>
    </>
  )
}