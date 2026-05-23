'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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

const STATUS_META: Record<string, { color: string; bg: string; label: string }> = {
  new:        { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  label: 'NEW' },
  in_queue:   { color: '#22d3ee', bg: 'rgba(34,211,238,0.12)',  label: 'IN QUEUE' },
  calling:    { color: '#fb923c', bg: 'rgba(251,146,60,0.12)',   label: 'CALLING' },
  confirmed:  { color: '#a3e635', bg: 'rgba(163,230,53,0.12)',   label: 'CONFIRMED' },
  cancelled:  { color: '#f87171', bg: 'rgba(248,113,113,0.12)',  label: 'CANCELLED' },
  rescheduled:{ color: '#c084fc', bg: 'rgba(192,132,252,0.12)',  label: 'RESCHEDULED' },
  shipped:    { color: '#38bdf8', bg: 'rgba(56,189,248,0.12)',   label: 'SHIPPED' },
  delivered:  { color: '#86efac', bg: 'rgba(134,239,172,0.12)',  label: 'DELIVERED' },
  returned:   { color: '#fca5a5', bg: 'rgba(252,165,165,0.12)',  label: 'RETURNED' },
}

function AnimatedNumber({ value, loading }: { value: number | string; loading: boolean }) {
  const [display, setDisplay] = useState(0)
  const numVal = typeof value === 'string' ? parseFloat(value) : value
  useEffect(() => {
    if (loading) return
    let start = 0
    const end = numVal
    if (start === end) { setDisplay(end); return }
    const duration = 900
    const step = (timestamp: number, startTime: number) => {
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.floor(eased * end))
      if (progress < 1) requestAnimationFrame(t => step(t, startTime))
      else setDisplay(end)
    }
    requestAnimationFrame(t => step(t, t))
  }, [numVal, loading])
  if (loading) return <span className="skeleton-num" />
  return <span>{display.toLocaleString()}</span>
}

export default function Dashboard() {
  const router = useRouter()
  const [stats, setStats] = useState({
    totalOrders: 0, confirmedToday: 0, pendingCalls: 0,
    stockItems: 0, totalRevenue: 0, delivered: 0,
  })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [orgName, setOrgName] = useState('ProSilya')
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeHover, setActiveHover] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true); fetchStats() }, [])

  async function fetchStats() {
    const today = new Date().toISOString().split('T')[0]
    const [
      { count: totalOrders },
      { data: confirmedTodayData },
      { count: pendingCalls },
      { count: stockItems },
      { data: revenueData },
      { count: delivered },
      { data: recent },
      { data: userProfile },
    ] = await Promise.all([
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('id').eq('status', 'confirmed').gte('created_at', today),
      supabase.from('orders').select('*', { count: 'exact', head: true }).in('status', ['new', 'in_queue', 'rescheduled']),
      supabase.from('stock').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('total_cod').eq('status', 'delivered'),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'delivered'),
      supabase.from('orders').select('id, customer_name, customer_phone, total_cod, status, created_at').order('created_at', { ascending: false }).limit(8),
      supabase.from('users').select('organization_id').single(),
    ])
    const totalRevenue = (revenueData || []).reduce((sum: number, o: any) => sum + o.total_cod, 0)
    if (userProfile?.organization_id) {
      const { data: org } = await supabase.from('organizations').select('name').eq('id', userProfile.organization_id).single()
      if (org) setOrgName(org.name)
    }
    setStats({
      totalOrders: totalOrders || 0,
      confirmedToday: confirmedTodayData?.length || 0,
      pendingCalls: pendingCalls || 0,
      stockItems: stockItems || 0,
      totalRevenue,
      delivered: delivered || 0,
    })
    setRecentOrders(recent || [])
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const cards = [
    { label: 'Total Orders',     value: stats.totalOrders,              accent: '#34d399', glow: 'rgba(52,211,153,0.25)',  icon: '◈', href: '/dashboard/orders',       sub: 'All time' },
    { label: 'Confirmed Today',  value: stats.confirmedToday,           accent: '#a3e635', glow: 'rgba(163,230,53,0.25)',   icon: '◉', href: '/dashboard/orders',       sub: 'Today' },
    { label: 'Pending Calls',    value: stats.pendingCalls,             accent: '#fb923c', glow: 'rgba(251,146,60,0.25)',    icon: '◷', href: '/dashboard/confirmation', sub: 'Awaiting' },
    { label: 'Stock Products',   value: stats.stockItems,               accent: '#22d3ee', glow: 'rgba(34,211,238,0.25)',   icon: '◫', href: '/dashboard/stock',        sub: 'In warehouse' },
    { label: 'Delivered',        value: stats.delivered,                accent: '#818cf8', glow: 'rgba(129,140,248,0.25)', icon: '◎', href: '/dashboard/orders',       sub: 'Completed' },
    { label: 'Revenue',          value: stats.totalRevenue.toFixed(0),  accent: '#f472b6', glow: 'rgba(244,114,182,0.25)', icon: '◈', href: '/dashboard/orders',       sub: 'MAD total', prefix: '' },
  ]

  const deliveryRate = stats.totalOrders > 0 ? Math.round((stats.delivered / stats.totalOrders) * 100) : 0

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #080c10;
          --surface: #0e1318;
          --surface2: #131a22;
          --border: rgba(255,255,255,0.06);
          --border-bright: rgba(255,255,255,0.12);
          --text: #e2e8f0;
          --text-muted: #64748b;
          --text-dim: #94a3b8;
          --green: #22c55e;
          --orange: #f97316;
          --sidebar-w: 240px;
          --radius: 14px;
        }
        html, body { height: 100%; background: var(--bg); color: var(--text); font-family: 'Syne', sans-serif; }
        .mono { font-family: 'DM Mono', monospace; }

        /* Layout */
        .layout { display: flex; height: 100vh; overflow: hidden; }

        /* Sidebar */
        .sidebar {
          width: var(--sidebar-w); flex-shrink: 0;
          background: var(--surface);
          border-right: 1px solid var(--border);
          display: flex; flex-direction: column;
          transition: width 0.3s cubic-bezier(.4,0,.2,1);
          position: relative; z-index: 10;
          overflow: hidden;
        }
        .sidebar-brand {
          padding: 28px 24px 24px;
          border-bottom: 1px solid var(--border);
        }
        .brand-logo {
          font-size: 20px; font-weight: 800; letter-spacing: -0.5px;
          color: #fff; line-height: 1;
        }
        .brand-logo span { color: var(--orange); }
        .brand-org {
          font-size: 10px; color: var(--text-muted); margin-top: 6px;
          text-transform: uppercase; letter-spacing: 2px; font-family: 'DM Mono', monospace;
        }
        .sidebar-nav { flex: 1; padding: 12px 0; overflow-y: auto; }
        .nav-section-label {
          font-size: 9px; color: var(--text-muted); letter-spacing: 2px;
          text-transform: uppercase; padding: 16px 24px 8px;
          font-family: 'DM Mono', monospace;
        }
        .nav-item {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 24px; color: var(--text-muted);
          text-decoration: none; font-size: 13px; font-weight: 600;
          position: relative; transition: all 0.2s;
          white-space: nowrap;
        }
        .nav-item:hover { color: var(--text); background: rgba(255,255,255,0.03); }
        .nav-item.active {
          color: #fff;
          background: linear-gradient(90deg, rgba(34,197,94,0.1) 0%, transparent 100%);
        }
        .nav-item.active::before {
          content: ''; position: absolute; left: 0; top: 0; bottom: 0;
          width: 3px; background: var(--green); border-radius: 0 2px 2px 0;
        }
        .nav-icon { font-size: 16px; width: 20px; text-align: center; flex-shrink: 0; }
        .sidebar-footer { padding: 16px; border-top: 1px solid var(--border); }
        .logout-btn {
          width: 100%; padding: 11px; background: rgba(249,115,22,0.1);
          color: var(--orange); border: 1px solid rgba(249,115,22,0.2);
          border-radius: 10px; cursor: pointer; font-weight: 700;
          font-size: 12px; letter-spacing: 0.5px; font-family: 'Syne', sans-serif;
          transition: all 0.2s; text-transform: uppercase;
        }
        .logout-btn:hover { background: var(--orange); color: #fff; border-color: var(--orange); }

        /* Main */
        .main { flex: 1; overflow-y: auto; background: var(--bg); position: relative; }
        .main-inner { padding: 36px 40px; max-width: 1400px; }

        /* Header */
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 36px; }
        .header-left h1 {
          font-size: 32px; font-weight: 800; color: #fff;
          letter-spacing: -1px; line-height: 1;
        }
        .header-left .date {
          font-size: 12px; color: var(--text-muted); margin-top: 8px;
          font-family: 'DM Mono', monospace; letter-spacing: 0.5px;
        }
        .header-right { display: flex; align-items: center; gap: 12px; }
        .header-badge {
          padding: 8px 16px; background: var(--surface);
          border: 1px solid var(--border); border-radius: 40px;
          font-size: 12px; color: var(--text-dim); font-family: 'DM Mono', monospace;
          display: flex; align-items: center; gap: 8px;
        }
        .pulse { width: 6px; height: 6px; border-radius: 50%; background: var(--green);
          box-shadow: 0 0 0 0 rgba(34,197,94,0.4);
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
          70% { box-shadow: 0 0 0 8px rgba(34,197,94,0); }
          100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
        }

        /* Stat Cards */
        .cards-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;
          margin-bottom: 28px;
        }
        .stat-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 24px;
          position: relative; overflow: hidden; cursor: pointer;
          transition: all 0.25s cubic-bezier(.4,0,.2,1);
          text-decoration: none; display: block;
        }
        .stat-card:hover {
          border-color: var(--border-bright);
          transform: translateY(-2px);
        }
        .stat-card::before {
          content: ''; position: absolute;
          top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, var(--card-accent), transparent);
          opacity: 0.6;
        }
        .stat-card::after {
          content: ''; position: absolute;
          top: -40px; right: -40px; width: 120px; height: 120px;
          border-radius: 50%;
          background: radial-gradient(circle, var(--card-glow) 0%, transparent 70%);
          pointer-events: none;
        }
        .card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        .card-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1.5px; font-family: 'DM Mono', monospace; }
        .card-icon {
          width: 36px; height: 36px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 17px; background: var(--card-icon-bg);
          color: var(--card-accent); border: 1px solid var(--card-icon-border);
        }
        .card-value {
          font-size: 38px; font-weight: 800; color: #fff;
          letter-spacing: -2px; line-height: 1;
          font-variant-numeric: tabular-nums;
        }
        .card-sub { font-size: 11px; color: var(--text-muted); margin-top: 8px; font-family: 'DM Mono', monospace; }
        .skeleton-num {
          display: inline-block; width: 80px; height: 38px;
          background: linear-gradient(90deg, var(--surface2) 25%, rgba(255,255,255,0.04) 50%, var(--surface2) 75%);
          background-size: 200% 100%; border-radius: 6px;
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

        /* KPI Row */
        .kpi-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 28px; }
        .kpi-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 20px 24px;
          display: flex; align-items: center; gap: 16px;
        }
        .kpi-ring { position: relative; width: 48px; height: 48px; flex-shrink: 0; }
        .kpi-ring svg { transform: rotate(-90deg); }
        .kpi-ring-label {
          position: absolute; inset: 0; display: flex;
          align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; font-family: 'DM Mono', monospace;
        }
        .kpi-info { flex: 1; min-width: 0; }
        .kpi-title { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1.5px; font-family: 'DM Mono', monospace; }
        .kpi-val { font-size: 22px; font-weight: 800; color: #fff; margin-top: 2px; letter-spacing: -0.5px; }
        .kpi-desc { font-size: 11px; color: var(--text-muted); margin-top: 2px; font-family: 'DM Mono', monospace; }

        /* Table */
        .table-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--radius); overflow: hidden; margin-bottom: 24px;
        }
        .table-header {
          padding: 20px 24px; border-bottom: 1px solid var(--border);
          display: flex; justify-content: space-between; align-items: center;
        }
        .table-title { font-size: 14px; font-weight: 700; color: #fff; }
        .table-link {
          font-size: 11px; color: var(--orange); text-decoration: none;
          font-family: 'DM Mono', monospace; letter-spacing: 0.5px;
          opacity: 0.8; transition: opacity 0.2s;
        }
        .table-link:hover { opacity: 1; }
        table { width: 100%; border-collapse: collapse; }
        thead tr { border-bottom: 1px solid var(--border); }
        th {
          padding: 12px 20px; text-align: left;
          font-size: 10px; color: var(--text-muted);
          text-transform: uppercase; letter-spacing: 1.5px;
          font-family: 'DM Mono', monospace; font-weight: 500;
        }
        tbody tr { border-bottom: 1px solid rgba(255,255,255,0.03); transition: background 0.15s; }
        tbody tr:hover { background: rgba(255,255,255,0.02); }
        tbody tr:last-child { border-bottom: none; }
        td { padding: 14px 20px; font-size: 13px; }
        .td-name { font-weight: 700; color: #fff; }
        .td-phone { color: var(--text-dim); font-family: 'DM Mono', monospace; font-size: 12px; }
        .td-amount { font-weight: 700; color: #fff; font-family: 'DM Mono', monospace; }
        .td-date { color: var(--text-muted); font-family: 'DM Mono', monospace; font-size: 11px; }
        .status-chip {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 10px; border-radius: 20px;
          font-size: 10px; font-weight: 700; letter-spacing: 0.5px;
          font-family: 'DM Mono', monospace;
        }
        .status-dot { width: 5px; height: 5px; border-radius: 50%; }
        .empty-row td { padding: 40px; text-align: center; color: var(--text-muted); font-family: 'DM Mono', monospace; font-size: 12px; }

        /* Quick Actions */
        .actions-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .action-btn {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 8px; padding: 20px 16px;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--radius); text-decoration: none;
          transition: all 0.2s; cursor: pointer; color: var(--text-dim);
        }
        .action-btn:hover { border-color: var(--action-accent); background: var(--action-bg); color: #fff; transform: translateY(-1px); }
        .action-icon { font-size: 20px; }
        .action-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; font-family: 'DM Mono', monospace; text-align: center; }

        /* Background orbs */
        .bg-orb {
          position: fixed; border-radius: 50%; filter: blur(80px);
          pointer-events: none; z-index: 0; opacity: 0.4;
        }

        /* Animations */
        .fade-in { animation: fadeIn 0.5s ease forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in-1 { animation-delay: 0.05s; opacity: 0; }
        .fade-in-2 { animation-delay: 0.1s;  opacity: 0; }
        .fade-in-3 { animation-delay: 0.15s; opacity: 0; }
        .fade-in-4 { animation-delay: 0.2s;  opacity: 0; }
        .fade-in-5 { animation-delay: 0.25s; opacity: 0; }
      `}</style>

      {/* Background orbs */}
      <div className="bg-orb" style={{ width: 400, height: 400, background: 'rgba(34,197,94,0.06)', top: -100, left: 200 }} />
      <div className="bg-orb" style={{ width: 300, height: 300, background: 'rgba(249,115,22,0.05)', bottom: 100, right: 100 }} />

      <div className="layout">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="brand-logo">Pro<span>Silya</span></div>
            <div className="brand-org">{orgName}</div>
          </div>
          <nav className="sidebar-nav">
            <div className="nav-section-label">Menu</div>
            {SIDEBAR_ITEMS.map(item => (
              <a
                key={item.href}
                href={item.href}
                className={`nav-item${item.href === '/dashboard' ? ' active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </a>
            ))}
          </nav>
          <div className="sidebar-footer">
            <button onClick={handleLogout} className="logout-btn">
              ⊗ &nbsp;Logout
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <main className="main">
          <div className="main-inner">
            {/* Header */}
            <div className="header fade-in fade-in-1">
              <div className="header-left">
                <h1>Dashboard</h1>
                <div className="date mono">
                  {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}
                </div>
              </div>
              <div className="header-right">
                <div className="header-badge">
                  <div className="pulse" />
                  <span>LIVE</span>
                </div>
              </div>
            </div>

            {/* Stat cards */}
            <div className="cards-grid fade-in fade-in-2">
              {cards.map((card) => (
                <a
                  key={card.label}
                  href={card.href}
                  className="stat-card"
                  style={{
                    '--card-accent': card.accent,
                    '--card-glow': card.glow,
                    '--card-icon-bg': card.glow,
                    '--card-icon-border': card.accent + '30',
                  } as React.CSSProperties}
                >
                  <div className="card-top">
                    <span className="card-label">{card.label}</span>
                    <div className="card-icon">{card.icon}</div>
                  </div>
                  <div className="card-value">
                    <AnimatedNumber value={typeof card.value === 'string' ? parseFloat(card.value) : card.value} loading={loading} />
                  </div>
                  <div className="card-sub">{card.sub}</div>
                </a>
              ))}
            </div>

            {/* KPI Row */}
            <div className="kpi-row fade-in fade-in-3">
              {/* Delivery Rate Ring */}
              <div className="kpi-card">
                <div className="kpi-ring">
                  <svg width="48" height="48" viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                    <circle
                      cx="24" cy="24" r="20" fill="none"
                      stroke="#a3e635" strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 20}`}
                      strokeDashoffset={`${2 * Math.PI * 20 * (1 - deliveryRate / 100)}`}
                      style={{ transition: 'stroke-dashoffset 1s ease' }}
                    />
                  </svg>
                  <div className="kpi-ring-label" style={{ color: '#a3e635', fontSize: 10 }}>{deliveryRate}%</div>
                </div>
                <div className="kpi-info">
                  <div className="kpi-title">Delivery Rate</div>
                  <div className="kpi-val">{deliveryRate}%</div>
                  <div className="kpi-desc">{stats.delivered} of {stats.totalOrders} orders</div>
                </div>
              </div>

              {/* Pending */}
              <div className="kpi-card">
                <div className="kpi-ring">
                  <svg width="48" height="48" viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                    <circle
                      cx="24" cy="24" r="20" fill="none"
                      stroke="#fb923c" strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 20}`}
                      strokeDashoffset={`${2 * Math.PI * 20 * (1 - Math.min(stats.pendingCalls / Math.max(stats.totalOrders, 1), 1))}`}
                      style={{ transition: 'stroke-dashoffset 1s ease' }}
                    />
                  </svg>
                  <div className="kpi-ring-label" style={{ color: '#fb923c', fontSize: 10 }}>
                    {stats.totalOrders > 0 ? Math.round((stats.pendingCalls / stats.totalOrders) * 100) : 0}%
                  </div>
                </div>
                <div className="kpi-info">
                  <div className="kpi-title">Pending Rate</div>
                  <div className="kpi-val">{stats.pendingCalls}</div>
                  <div className="kpi-desc">Orders need attention</div>
                </div>
              </div>

              {/* Revenue per order */}
              <div className="kpi-card">
                <div className="kpi-ring">
                  <svg width="48" height="48" viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                    <circle
                      cx="24" cy="24" r="20" fill="none"
                      stroke="#f472b6" strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 20}`}
                      strokeDashoffset={`${2 * Math.PI * 20 * 0.3}`}
                      style={{ transition: 'stroke-dashoffset 1s ease' }}
                    />
                  </svg>
                  <div className="kpi-ring-label" style={{ color: '#f472b6', fontSize: 9 }}>AVG</div>
                </div>
                <div className="kpi-info">
                  <div className="kpi-title">Avg Order Value</div>
                  <div className="kpi-val">
                    {stats.delivered > 0 ? (stats.totalRevenue / stats.delivered).toFixed(0) : '0'} <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)' }}>MAD</span>
                  </div>
                  <div className="kpi-desc">Per delivered order</div>
                </div>
              </div>
            </div>

            {/* Recent Orders Table */}
            <div className="table-card fade-in fade-in-4">
              <div className="table-header">
                <span className="table-title">Recent Orders</span>
                <a href="/dashboard/orders" className="table-link">VIEW ALL →</a>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.length === 0 ? (
                    <tr className="empty-row"><td colSpan={5}>No orders yet — start by creating one below</td></tr>
                  ) : recentOrders.map((order) => {
                    const meta = STATUS_META[order.status] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', label: order.status.toUpperCase() }
                    return (
                      <tr key={order.id}>
                        <td className="td-name">{order.customer_name}</td>
                        <td className="td-phone">{order.customer_phone}</td>
                        <td className="td-amount">{Number(order.total_cod).toFixed(2)} <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 400 }}>MAD</span></td>
                        <td>
                          <span className="status-chip" style={{ background: meta.bg, color: meta.color }}>
                            <span className="status-dot" style={{ background: meta.color }} />
                            {meta.label}
                          </span>
                        </td>
                        <td className="td-date">{new Date(order.created_at).toLocaleDateString('en-GB')}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Quick Actions */}
            <div className="actions-grid fade-in fade-in-5">
              {[
                { label: 'New Order',      href: '/dashboard/orders/new',   accent: '#34d399', bg: 'rgba(52,211,153,0.08)',  icon: '+' },
                { label: 'Start Calling',  href: '/dashboard/confirmation', accent: '#fb923c', bg: 'rgba(251,146,60,0.08)',   icon: '◷' },
                { label: 'Add Product',    href: '/dashboard/stock',        accent: '#22d3ee', bg: 'rgba(34,211,238,0.08)',   icon: '◫' },
                { label: 'Add Employee',   href: '/dashboard/employees',    accent: '#c084fc', bg: 'rgba(192,132,252,0.08)',  icon: '◎' },
              ].map(action => (
                <a
                  key={action.label}
                  href={action.href}
                  className="action-btn"
                  style={{
                    '--action-accent': action.accent,
                    '--action-bg': action.bg,
                  } as React.CSSProperties}
                >
                  <span className="action-icon" style={{ color: action.accent }}>{action.icon}</span>
                  <span className="action-label">{action.label}</span>
                </a>
              ))}
            </div>

          </div>
        </main>
      </div>
    </>
  )
}