'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Employee = { id: string; full_name: string; role: string; salary: number }

type PayrollRow = {
  employee: Employee; workingDays: number; presentDays: number
  absentDays: number; lateDays: number; baseSalary: number
  deductions: number; bonus: number; total: number
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

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

const ROLE_CFG: Record<string, { color: string; bg: string }> = {
  agent:   { color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  manager: { color: '#c084fc', bg: 'rgba(192,132,252,0.12)' },
  admin:   { color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
  driver:  { color: '#fb923c', bg: 'rgba(251,146,60,0.12)' },
  other:   { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function PayrollPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth())
  const [year, setYear] = useState(now.getFullYear())
  const [rows, setRows] = useState<PayrollRow[]>([])
  const [bonuses, setBonuses] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchPayroll() }, [month, year])

  async function fetchPayroll() {
    setLoading(true)
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0]

    const [{ data: emps }, { data: att }] = await Promise.all([
      supabase.from('employees').select('id, full_name, role, salary').eq('status', 'active').order('full_name'),
      supabase.from('attendance').select('employee_id, status').gte('date', startDate).lte('date', endDate),
    ])

    const employees = emps || []
    const attendance = att || []

    let workingDays = 0
    const d = new Date(year, month, 1)
    while (d.getMonth() === month) {
      if (d.getDay() !== 0) workingDays++
      d.setDate(d.getDate() + 1)
    }

    const result: PayrollRow[] = employees.map(emp => {
      const empAtt = attendance.filter(a => a.employee_id === emp.id)
      const presentDays = empAtt.filter(a => ['present', 'half_day'].includes(a.status)).length
      const absentDays = empAtt.filter(a => a.status === 'absent').length
      const lateDays = empAtt.filter(a => a.status === 'late').length
      const dailyRate = emp.salary / workingDays
      const deductions = (absentDays * dailyRate) + (lateDays * dailyRate * 0.25)
      const bonus = parseFloat(bonuses[emp.id] || '0') || 0
      const total = Math.max(0, emp.salary - deductions + bonus)
      return { employee: emp, workingDays, presentDays, absentDays, lateDays, baseSalary: emp.salary, deductions, bonus, total }
    })

    setRows(result)
    setLoading(false)
  }

  const totalPayroll    = rows.reduce((s, r) => s + r.total, 0)
  const totalDeductions = rows.reduce((s, r) => s + r.deductions, 0)
  const totalBase       = rows.reduce((s, r) => s + r.baseSalary, 0)

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
        .main-inner { padding: 36px 40px; }

        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
        .page-title { font-size: 30px; font-weight: 800; color: #fff; letter-spacing: -1px; }
        .page-sub { font-size: 12px; color: var(--text-muted); margin-top: 6px; font-family: 'DM Mono', monospace; }

        .controls { display: flex; gap: 8px; align-items: center; }
        .select-input { padding: 10px 14px; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; color: var(--text); font-family: 'DM Mono', monospace; font-size: 13px; outline: none; cursor: pointer; transition: border-color 0.2s; }
        .select-input:focus { border-color: var(--green); }
        .select-input option { background: var(--surface2); }
        .recalc-btn { padding: 10px 18px; background: rgba(34,197,94,0.1); color: var(--green); border: 1px solid rgba(34,197,94,0.2); border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 12px; font-family: 'Syne', sans-serif; transition: all 0.2s; text-transform: uppercase; white-space: nowrap; }
        .recalc-btn:hover { background: var(--green); color: #fff; }

        .kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 28px; }
        .kpi-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 18px 20px; position: relative; overflow: hidden; }
        .kpi-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--kpi-color); }
        .kpi-label { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1.5px; font-family: 'DM Mono', monospace; margin-bottom: 8px; }
        .kpi-value { font-size: 22px; font-weight: 800; color: var(--kpi-color); letter-spacing: -0.5px; font-family: 'DM Mono', monospace; }
        .kpi-desc { font-size: 10px; color: var(--text-muted); margin-top: 4px; font-family: 'DM Mono', monospace; }

        .table-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: auto; }
        .table-header { padding: 20px 24px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
        .table-title { font-size: 14px; font-weight: 700; color: #fff; }
        .table-sub { font-size: 11px; color: var(--text-muted); font-family: 'DM Mono', monospace; }
        table { width: 100%; border-collapse: collapse; min-width: 860px; }
        thead tr { border-bottom: 1px solid var(--border); }
        th { padding: 11px 16px; text-align: left; font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1.5px; font-family: 'DM Mono', monospace; font-weight: 500; white-space: nowrap; }
        tbody tr { border-bottom: 1px solid rgba(255,255,255,0.03); transition: background 0.15s; }
        tbody tr:hover { background: rgba(255,255,255,0.02); }
        tbody tr:last-child { border-bottom: none; }
        td { padding: 13px 16px; font-size: 13px; vertical-align: middle; }

        tfoot tr { border-top: 1px solid var(--border-bright); background: rgba(255,255,255,0.02); }
        .tfoot-label { font-size: 10px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1.5px; font-family: 'DM Mono', monospace; }
        .tfoot-base { font-weight: 700; color: var(--text-dim); font-family: 'DM Mono', monospace; }
        .tfoot-ded { font-weight: 700; color: var(--red); font-family: 'DM Mono', monospace; }
        .tfoot-total { font-weight: 800; color: var(--green); font-family: 'DM Mono', monospace; font-size: 15px; }

        .emp-cell { display: flex; align-items: center; gap: 12px; }
        .avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; flex-shrink: 0; }
        .emp-name { font-weight: 700; color: #fff; font-size: 13px; }
        .role-chip { display: inline-flex; padding: 3px 9px; border-radius: 20px; font-size: 10px; font-weight: 700; font-family: 'DM Mono', monospace; }

        .stat-present { font-weight: 700; color: #34d399; font-family: 'DM Mono', monospace; }
        .stat-absent  { font-weight: 700; color: var(--red); font-family: 'DM Mono', monospace; }
        .stat-late    { font-weight: 700; color: #fb923c; font-family: 'DM Mono', monospace; }
        .td-base      { color: var(--text-dim); font-family: 'DM Mono', monospace; }
        .td-ded       { color: var(--red); font-family: 'DM Mono', monospace; }
        .td-total     { font-weight: 800; color: var(--green); font-family: 'DM Mono', monospace; font-size: 14px; }

        .bonus-input { width: 88px; padding: 7px 10px; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-family: 'DM Mono', monospace; font-size: 12px; outline: none; transition: border-color 0.2s; }
        .bonus-input:focus { border-color: #a3e635; }
        .bonus-input::placeholder { color: var(--text-muted); }

        .empty-cell { padding: 48px; text-align: center; color: var(--text-muted); font-family: 'DM Mono', monospace; font-size: 12px; }

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
              <a key={item.href} href={item.href} className={`nav-item${item.href === '/dashboard/payroll' ? ' active' : ''}`}>
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
                <div className="page-title">Payroll</div>
                <div className="page-sub">{MONTHS[month]} {year} · {rows.length} active employees</div>
              </div>
              <div className="controls">
                <select className="select-input" value={month} onChange={e => setMonth(parseInt(e.target.value))}>
                  {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                </select>
                <select className="select-input" value={year} onChange={e => setYear(parseInt(e.target.value))}>
                  {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <button className="recalc-btn" onClick={fetchPayroll}>↺ Recalculate</button>
              </div>
            </div>

            {/* KPIs */}
            <div className="kpi-row fade-in fade-in-2">
              {[
                { label: 'Total Payroll',    value: `${totalPayroll.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`, color: '#4ade80',  desc: 'Net to pay' },
                { label: 'Base Salaries',    value: `${totalBase.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`,    color: '#94a3b8',  desc: 'Before deductions' },
                { label: 'Total Deductions', value: `${totalDeductions.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`, color: '#f87171', desc: 'Absent + late' },
                { label: 'Employees',        value: rows.length,                                                                                          color: '#38bdf8',  desc: 'Active this month' },
              ].map(k => (
                <div key={k.label} className="kpi-card" style={{ '--kpi-color': k.color } as React.CSSProperties}>
                  <div className="kpi-label">{k.label}</div>
                  <div className="kpi-value">{k.value}</div>
                  <div className="kpi-desc">{k.desc}</div>
                </div>
              ))}
            </div>

            {/* Table */}
            <div className="table-card fade-in fade-in-3">
              <div className="table-header">
                <span className="table-title">Payroll Breakdown</span>
                <span className="table-sub">{MONTHS[month]} {year}</span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Role</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Late</th>
                    <th>Base (MAD)</th>
                    <th>Deductions</th>
                    <th>Bonus</th>
                    <th>Total (MAD)</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={9} className="empty-cell">Loading...</td></tr>
                  ) : rows.length === 0 ? (
                    <tr><td colSpan={9} className="empty-cell">No active employees found</td></tr>
                  ) : rows.map(row => {
                    const role = ROLE_CFG[row.employee.role] || ROLE_CFG.other
                    return (
                      <tr key={row.employee.id}>
                        <td>
                          <div className="emp-cell">
                            <div className="avatar" style={{ background: role.bg, color: role.color, border: `1px solid ${role.color}30` }}>
                              {initials(row.employee.full_name)}
                            </div>
                            <span className="emp-name">{row.employee.full_name}</span>
                          </div>
                        </td>
                        <td>
                          <span className="role-chip" style={{ background: role.bg, color: role.color }}>
                            {row.employee.role}
                          </span>
                        </td>
                        <td className="stat-present">{row.presentDays}</td>
                        <td className="stat-absent">{row.absentDays}</td>
                        <td className="stat-late">{row.lateDays}</td>
                        <td className="td-base">{row.baseSalary.toFixed(2)}</td>
                        <td className="td-ded">-{row.deductions.toFixed(2)}</td>
                        <td>
                          <input
                            type="number"
                            placeholder="0"
                            className="bonus-input"
                            value={bonuses[row.employee.id] || ''}
                            onChange={e => setBonuses(b => ({ ...b, [row.employee.id]: e.target.value }))}
                            onBlur={fetchPayroll}
                          />
                        </td>
                        <td className="td-total">{row.total.toFixed(2)}</td>
                      </tr>
                    )
                  })}
                </tbody>
                {rows.length > 0 && (
                  <tfoot>
                    <tr>
                      <td colSpan={5}><span className="tfoot-label">Total</span></td>
                      <td className="tfoot-base">{totalBase.toFixed(2)}</td>
                      <td className="tfoot-ded">-{totalDeductions.toFixed(2)}</td>
                      <td></td>
                      <td className="tfoot-total">{totalPayroll.toFixed(2)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

          </div>
        </main>
      </div>
    </>
  )
}