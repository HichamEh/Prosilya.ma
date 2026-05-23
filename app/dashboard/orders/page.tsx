'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Order = {
  id: string; customer_name: string; customer_phone: string
  customer_city: string; total_cod: number; status: string
  delivery_company: string | null; created_at: string
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

const ALL_STATUSES = ['new','in_queue','calling','confirmed','cancelled','rescheduled','shipped','delivered','returned']

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

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => { fetchOrders() }, [])

  async function fetchOrders() {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('id, customer_name, customer_phone, customer_city, total_cod, status, delivery_company, created_at')
      .order('created_at', { ascending: false })
      .limit(100)
    setOrders(data || [])
    setLoading(false)
  }

  const filtered = orders.filter(o => {
    const matchSearch = o.customer_name.toLowerCase().includes(search.toLowerCase()) || o.customer_phone.includes(search)
    const matchStatus = statusFilter === 'all' || o.status === statusFilter
    return matchSearch && matchStatus
  })

  const totalCOD = filtered.reduce((s, o) => s + o.total_cod, 0)
  const confirmedCount = filtered.filter(o => o.status === 'confirmed').length
  const deliveredCount = filtered.filter(o => o.status === 'delivered').length

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

        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .page-title { font-size: 30px; font-weight: 800; color: #fff; letter-spacing: -1px; }
        .page-sub { font-size: 12px; color: var(--text-muted); margin-top: 6px; font-family: 'DM Mono', monospace; }
        .new-btn { padding: 12px 22px; background: rgba(249,115,22,0.1); color: var(--orange); border: 1px solid rgba(249,115,22,0.2); border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 12px; font-family: 'Syne', sans-serif; transition: all 0.2s; text-transform: uppercase; white-space: nowrap; }
        .new-btn:hover { background: var(--orange); color: #fff; border-color: var(--orange); }

        .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
        .kpi-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 18px 20px; position: relative; overflow: hidden; }
        .kpi-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--kpi-color); }
        .kpi-label { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1.5px; font-family: 'DM Mono', monospace; margin-bottom: 8px; }
        .kpi-value { font-size: 26px; font-weight: 800; color: var(--kpi-color); letter-spacing: -1px; }
        .kpi-desc { font-size: 10px; color: var(--text-muted); margin-top: 4px; font-family: 'DM Mono', monospace; }

        .filters-row { display: flex; gap: 10px; align-items: center; margin-bottom: 20px; flex-wrap: wrap; }
        .search-input { padding: 10px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; color: var(--text); font-family: 'DM Mono', monospace; font-size: 13px; outline: none; width: 280px; transition: border-color 0.2s; }
        .search-input:focus { border-color: var(--green); }
        .search-input::placeholder { color: var(--text-muted); }

        .status-filter-pills { display: flex; gap: 6px; flex-wrap: wrap; flex: 1; }
        .filter-pill { padding: 6px 13px; border-radius: 20px; font-size: 10px; font-weight: 700; cursor: pointer; border: 1px solid rgba(255,255,255,0.08); background: transparent; color: var(--text-muted); font-family: 'DM Mono', monospace; transition: all 0.15s; text-transform: uppercase; }
        .filter-pill:hover { border-color: rgba(255,255,255,0.2); color: var(--text-dim); }
        .filter-pill.active-all { border-color: var(--green); background: rgba(34,197,94,0.1); color: var(--green); }

        .refresh-btn { padding: 10px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; color: var(--text-muted); font-family: 'DM Mono', monospace; font-size: 12px; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .refresh-btn:hover { border-color: var(--border-bright); color: var(--text); }

        .table-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
        .table-header { padding: 18px 24px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
        .table-title { font-size: 14px; font-weight: 700; color: #fff; }
        .table-count { font-size: 11px; color: var(--text-muted); font-family: 'DM Mono', monospace; }
        table { width: 100%; border-collapse: collapse; }
        thead tr { border-bottom: 1px solid var(--border); }
        th { padding: 11px 20px; text-align: left; font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1.5px; font-family: 'DM Mono', monospace; font-weight: 500; }
        tbody tr { border-bottom: 1px solid rgba(255,255,255,0.03); transition: background 0.15s; cursor: pointer; }
        tbody tr:hover { background: rgba(255,255,255,0.025); }
        tbody tr:last-child { border-bottom: none; }
        td { padding: 13px 20px; font-size: 13px; vertical-align: middle; }
        .td-name { font-weight: 700; color: #fff; }
        .td-phone { color: var(--text-dim); font-family: 'DM Mono', monospace; font-size: 12px; }
        .td-city { color: var(--text-dim); font-size: 12px; }
        .td-cod { font-weight: 800; color: var(--orange); font-family: 'DM Mono', monospace; }
        .td-delivery { color: var(--text-muted); font-size: 12px; font-family: 'DM Mono', monospace; }
        .td-date { color: var(--text-muted); font-size: 11px; font-family: 'DM Mono', monospace; }
        .empty-cell { padding: 48px; text-align: center; color: var(--text-muted); font-family: 'DM Mono', monospace; font-size: 12px; }

        .status-chip { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; letter-spacing: 0.3px; font-family: 'DM Mono', monospace; }
        .chip-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }

        .view-btn { padding: 5px 14px; background: transparent; color: var(--text-muted); border: 1px solid var(--border); border-radius: 6px; cursor: pointer; font-size: 11px; font-family: 'DM Mono', monospace; transition: all 0.2s; }
        .view-btn:hover { border-color: var(--green); color: var(--green); }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.4s ease forwards; }
        .fade-in-1 { animation-delay: 0.05s; opacity: 0; }
        .fade-in-2 { animation-delay: 0.1s; opacity: 0; }
        .fade-in-3 { animation-delay: 0.15s; opacity: 0; }
        .fade-in-4 { animation-delay: 0.2s; opacity: 0; }
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

            {/* Header */}
            <div className="page-header fade-in fade-in-1">
              <div>
                <div className="page-title">Orders</div>
                <div className="page-sub">{filtered.length} orders · {statusFilter === 'all' ? 'all statuses' : statusFilter.replace('_', ' ')}</div>
              </div>
              <button className="new-btn" onClick={() => router.push('/dashboard/orders/new')}>+ New Order</button>
            </div>

            {/* KPIs */}
            <div className="kpi-row fade-in fade-in-2">
              {[
                { label: 'Total Orders',  value: filtered.length,                          color: '#34d399', desc: 'In current view' },
                { label: 'Confirmed',     value: confirmedCount,                           color: '#a3e635', desc: 'Ready to ship' },
                { label: 'Delivered',     value: deliveredCount,                           color: '#4ade80', desc: 'Completed' },
                { label: 'Total COD',     value: `${totalCOD.toLocaleString()} MAD`,       color: '#f97316', desc: 'Cash on delivery' },
              ].map(k => (
                <div key={k.label} className="kpi-card" style={{ '--kpi-color': k.color } as React.CSSProperties}>
                  <div className="kpi-label">{k.label}</div>
                  <div className="kpi-value">{k.value}</div>
                  <div className="kpi-desc">{k.desc}</div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="filters-row fade-in fade-in-3">
              <input
                className="search-input"
                placeholder="Search by name or phone..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <div className="status-filter-pills">
                <button
                  className={`filter-pill${statusFilter === 'all' ? ' active-all' : ''}`}
                  onClick={() => setStatusFilter('all')}
                >All</button>
                {ALL_STATUSES.map(s => {
                  const cfg = STATUS_CFG[s]
                  const isActive = statusFilter === s
                  return (
                    <button
                      key={s}
                      className="filter-pill"
                      onClick={() => setStatusFilter(isActive ? 'all' : s)}
                      style={isActive ? {
                        borderColor: cfg.color,
                        background: cfg.bg,
                        color: cfg.color,
                      } : {}}
                    >
                      {s.replace('_', ' ')}
                    </button>
                  )
                })}
              </div>
              <button className="refresh-btn" onClick={fetchOrders}>↺ Refresh</button>
            </div>

            {/* Table */}
            <div className="table-card fade-in fade-in-4">
              <div className="table-header">
                <span className="table-title">All Orders</span>
                <span className="table-count">{filtered.length} records</span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>City</th>
                    <th>COD</th>
                    <th>Status</th>
                    <th>Delivery</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} className="empty-cell">Loading...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={8} className="empty-cell">No orders found</td></tr>
                  ) : filtered.map(order => {
                    const cfg = STATUS_CFG[order.status] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' }
                    return (
                      <tr key={order.id} onClick={() => router.push(`/dashboard/orders/${order.id}`)}>
                        <td className="td-name">{order.customer_name}</td>
                        <td className="td-phone">{order.customer_phone}</td>
                        <td className="td-city">{order.customer_city || '—'}</td>
                        <td className="td-cod">{order.total_cod.toFixed(2)} <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 400 }}>MAD</span></td>
                        <td>
                          <span className="status-chip" style={{ background: cfg.bg, color: cfg.color }}>
                            <span className="chip-dot" style={{ background: cfg.color }} />
                            {order.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="td-delivery">{order.delivery_company || '—'}</td>
                        <td className="td-date">{new Date(order.created_at).toLocaleDateString('en-GB')}</td>
                        <td onClick={e => e.stopPropagation()}>
                          <button className="view-btn" onClick={() => router.push(`/dashboard/orders/${order.id}`)}>View</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

          </div>
        </main>
      </div>
    </>
  )
}