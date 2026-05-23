'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Order = {
  id: string; customer_name: string; customer_phone: string
  customer_city: string; customer_address?: string; total_cod: number
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

const STATUS_CHIP: Record<string, { color: string; bg: string }> = {
  new:         { color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  in_queue:    { color: '#22d3ee', bg: 'rgba(34,211,238,0.12)' },
  rescheduled: { color: '#c084fc', bg: 'rgba(192,132,252,0.12)' },
}

export default function ConfirmationPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [current, setCurrent] = useState<Order | null>(null)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [idx, setIdx] = useState(0)

  useEffect(() => { fetchQueue() }, [])

  async function fetchQueue() {
    const { data } = await supabase
      .from('orders').select('*')
      .in('status', ['new', 'in_queue', 'rescheduled'])
      .order('created_at', { ascending: true })
    const list = data || []
    setOrders(list); setIdx(0)
    setCurrent(list[0] || null)
    setNotes(list[0]?.notes || '')
    setDone(list.length === 0)
  }

  function openOrder(order: Order, i: number) {
    setCurrent(order); setNotes(order.notes || ''); setIdx(i)
  }

  async function updateStatus(newStatus: string) {
    if (!current) return
    setSaving(true)
    await supabase.from('orders').update({ status: newStatus, notes: notes || null }).eq('id', current.id)
    const remaining = orders.filter(o => o.id !== current.id)
    setOrders(remaining)
    const next = remaining[0] || null
    setCurrent(next); setNotes(next?.notes || ''); setIdx(0)
    setDone(remaining.length === 0); setSaving(false)
  }

  const progress = orders.length > 0 ? Math.round(((idx) / (orders.length + idx)) * 100) : 100

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #080c10; --surface: #0e1318; --surface2: #131a22; --surface3: #0b1015;
          --border: rgba(255,255,255,0.06); --border-bright: rgba(255,255,255,0.12);
          --text: #e2e8f0; --text-muted: #64748b; --text-dim: #94a3b8;
          --green: #22c55e; --orange: #f97316; --radius: 14px;
        }
        html, body { height: 100%; background: var(--bg); color: var(--text); font-family: 'Syne', sans-serif; }
        .layout { display: flex; height: 100vh; overflow: hidden; }

        /* Sidebar */
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

        /* Content */
        .content { flex: 1; display: flex; overflow: hidden; }

        /* Queue panel */
        .queue-panel { width: 280px; flex-shrink: 0; background: var(--surface); border-right: 1px solid var(--border); display: flex; flex-direction: column; overflow: hidden; }
        .queue-header { padding: 20px 20px 16px; border-bottom: 1px solid var(--border); }
        .queue-title { font-size: 13px; font-weight: 700; color: #fff; }
        .queue-sub { font-size: 11px; color: var(--text-muted); margin-top: 4px; font-family: 'DM Mono', monospace; }
        .queue-progress { height: 3px; background: rgba(255,255,255,0.06); border-radius: 3px; margin-top: 12px; overflow: hidden; }
        .queue-progress-fill { height: 100%; background: var(--green); border-radius: 3px; transition: width 0.5s ease; }
        .queue-list { flex: 1; overflow-y: auto; }
        .queue-item { padding: 14px 20px; cursor: pointer; border-bottom: 1px solid var(--border); position: relative; transition: background 0.15s; }
        .queue-item:hover { background: rgba(255,255,255,0.02); }
        .queue-item.active { background: rgba(34,197,94,0.05); }
        .queue-item.active::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--orange); }
        .qi-name { font-weight: 700; font-size: 13px; color: #fff; }
        .qi-phone { font-size: 11px; color: var(--text-muted); margin-top: 3px; font-family: 'DM Mono', monospace; }
        .qi-meta { font-size: 11px; color: var(--text-muted); margin-top: 3px; font-family: 'DM Mono', monospace; display: flex; align-items: center; gap: 8px; }
        .status-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
        .queue-empty { padding: 32px; text-align: center; color: var(--text-muted); font-size: 12px; font-family: 'DM Mono', monospace; }

        /* Call panel */
        .call-panel { flex: 1; overflow-y: auto; padding: 36px 40px; background: var(--bg); }

        /* Done state */
        .done-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 60px; text-align: center; max-width: 480px; }
        .done-icon { font-size: 48px; margin-bottom: 20px; }
        .done-title { font-size: 22px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
        .done-sub { font-size: 13px; color: var(--text-muted); margin-top: 8px; font-family: 'DM Mono', monospace; }
        .refresh-btn { margin-top: 24px; padding: 12px 28px; background: rgba(34,197,94,0.1); color: var(--green); border: 1px solid rgba(34,197,94,0.2); border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 12px; font-family: 'Syne', sans-serif; transition: all 0.2s; text-transform: uppercase; }
        .refresh-btn:hover { background: var(--green); color: #fff; }

        /* Order card */
        .order-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; margin-bottom: 16px; max-width: 560px; }
        .order-card-bar { height: 3px; background: linear-gradient(90deg, #22c55e, #f97316); }
        .order-card-inner { padding: 28px; }
        .order-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .order-name { font-size: 22px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
        .order-city { font-size: 12px; color: var(--text-muted); margin-top: 4px; font-family: 'DM Mono', monospace; }
        .order-amount { font-size: 24px; font-weight: 800; color: var(--orange); letter-spacing: -1px; font-family: 'DM Mono', monospace; }
        .order-amount-label { font-size: 10px; color: var(--text-muted); text-align: right; font-family: 'DM Mono', monospace; }

        .call-btn { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 16px; background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.25); color: var(--green); border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 17px; font-family: 'DM Mono', monospace; margin-bottom: 24px; transition: all 0.2s; letter-spacing: 1px; }
        .call-btn:hover { background: var(--green); color: #fff; border-color: var(--green); }
        .call-icon { font-size: 20px; }

        .order-detail { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border); font-size: 13px; }
        .order-detail:last-child { border-bottom: none; }
        .detail-label { color: var(--text-muted); font-family: 'DM Mono', monospace; font-size: 11px; }
        .detail-value { font-weight: 600; color: var(--text); }

        /* Notes */
        .notes-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; margin-bottom: 16px; max-width: 560px; }
        .notes-label { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1.5px; font-family: 'DM Mono', monospace; margin-bottom: 12px; }
        .notes-input { width: 100%; padding: 12px 14px; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-family: 'DM Mono', monospace; font-size: 13px; outline: none; resize: vertical; min-height: 88px; transition: border-color 0.2s; }
        .notes-input:focus { border-color: var(--green); }
        .notes-input::placeholder { color: var(--text-muted); }

        /* Action buttons */
        .action-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; max-width: 560px; }
        .action-btn { padding: 16px; border-radius: 12px; cursor: pointer; font-weight: 700; font-size: 13px; font-family: 'Syne', sans-serif; border: 1px solid; transition: all 0.2s; text-transform: uppercase; letter-spacing: 0.5px; }
        .action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-confirm { background: rgba(34,197,94,0.1); color: #34d399; border-color: rgba(52,211,153,0.25); }
        .btn-confirm:hover:not(:disabled) { background: #22c55e; color: #fff; border-color: #22c55e; }
        .btn-reschedule { background: rgba(192,132,252,0.1); color: #c084fc; border-color: rgba(192,132,252,0.25); }
        .btn-reschedule:hover:not(:disabled) { background: #a855f7; color: #fff; border-color: #a855f7; }
        .btn-cancel { background: rgba(248,113,113,0.1); color: #f87171; border-color: rgba(248,113,113,0.25); }
        .btn-cancel:hover:not(:disabled) { background: #ef4444; color: #fff; border-color: #ef4444; }

        .page-title { font-size: 30px; font-weight: 800; color: #fff; letter-spacing: -1px; margin-bottom: 28px; }

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
              <a key={item.href} href={item.href} className={`nav-item${item.href === '/dashboard/confirmation' ? ' active' : ''}`}>
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </a>
            ))}
          </nav>
          <div className="sidebar-footer">
            <button className="logout-btn">⊗ &nbsp;Logout</button>
          </div>
        </aside>

        <div className="content">
          {/* Queue Panel */}
          <div className="queue-panel">
            <div className="queue-header">
              <div className="queue-title">Call Queue</div>
              <div className="queue-sub">{orders.length} orders pending</div>
              <div className="queue-progress">
                <div className="queue-progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <div className="queue-list">
              {orders.length === 0 ? (
                <div className="queue-empty">Queue is empty</div>
              ) : orders.map((order, i) => {
                const chip = STATUS_CHIP[order.status] || STATUS_CHIP.new
                return (
                  <div key={order.id} className={`queue-item${current?.id === order.id ? ' active' : ''}`} onClick={() => openOrder(order, i)}>
                    <div className="qi-name">{order.customer_name}</div>
                    <div className="qi-phone">{order.customer_phone}</div>
                    <div className="qi-meta">
                      <span className="status-dot" style={{ background: chip.color }} />
                      <span>{order.status.replace('_', ' ')}</span>
                      <span>·</span>
                      <span>{order.total_cod.toFixed(0)} MAD</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Call Panel */}
          <div className="call-panel">
            <div className="page-title">Confirmation</div>

            {done ? (
              <div className="done-card fade-in">
                <div className="done-icon">◉</div>
                <div className="done-title">Queue complete!</div>
                <div className="done-sub">All orders have been processed.</div>
                <button className="refresh-btn" onClick={fetchQueue}>↺ Refresh Queue</button>
              </div>
            ) : current ? (
              <div className="fade-in" key={current.id}>
                {/* Order card */}
                <div className="order-card">
                  <div className="order-card-bar" />
                  <div className="order-card-inner">
                    <div className="order-top">
                      <div>
                        <div className="order-name">{current.customer_name}</div>
                        <div className="order-city">{current.customer_city || 'No city'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="order-amount">{current.total_cod.toFixed(2)}</div>
                        <div className="order-amount-label">MAD</div>
                      </div>
                    </div>

                    <a href={`tel:${current.customer_phone}`} className="call-btn">
                      <span className="call-icon">◉</span>
                      {current.customer_phone}
                    </a>

                    {[
                      ['Delivery company', current.delivery_company || '—'],
                      ['Address', current.customer_address || '—'],
                      ['Order date', new Date(current.created_at).toLocaleDateString('en-GB')],
                      ['Status', current.status.replace('_', ' ')],
                    ].map(([label, value]) => (
                      <div key={label} className="order-detail">
                        <span className="detail-label">{label}</span>
                        <span className="detail-value">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div className="notes-card">
                  <div className="notes-label">Call Notes</div>
                  <textarea
                    className="notes-input"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="What did the customer say?"
                  />
                </div>

                {/* Actions */}
                <div className="action-grid">
                  <button className="action-btn btn-confirm" onClick={() => updateStatus('confirmed')} disabled={saving}>
                    ◉ Confirmed
                  </button>
                  <button className="action-btn btn-reschedule" onClick={() => updateStatus('rescheduled')} disabled={saving}>
                    ↺ Reschedule
                  </button>
                  <button className="action-btn btn-cancel" onClick={() => updateStatus('cancelled')} disabled={saving}>
                    ⊘ Cancel
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  )
}