'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Employee = { id: string; full_name: string; role: string }
type AttendanceRecord = {
  id: string; employee_id: string; date: string; status: string
  check_in: string | null; check_out: string | null; notes: string | null
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

const STATUS_CFG: Record<string, { color: string; bg: string; label: string }> = {
  present:  { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  label: 'Present' },
  absent:   { color: '#f87171', bg: 'rgba(248,113,113,0.12)', label: 'Absent' },
  late:     { color: '#fb923c', bg: 'rgba(251,146,60,0.12)',  label: 'Late' },
  half_day: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', label: 'Half Day' },
  off:      { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', label: 'Off' },
}

function todayStr() { return new Date().toISOString().split('T')[0] }

export default function AttendancePage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [selectedDate, setSelectedDate] = useState(todayStr())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => { fetchData() }, [selectedDate])

  async function fetchData() {
    setLoading(true)
    const [{ data: emps }, { data: recs }] = await Promise.all([
      supabase.from('employees').select('id, full_name, role').eq('status', 'active').order('full_name'),
      supabase.from('attendance').select('*').eq('date', selectedDate),
    ])
    setEmployees(emps || [])
    setRecords(recs || [])
    setLoading(false)
  }

  function getRecord(employeeId: string) {
    return records.find(r => r.employee_id === employeeId)
  }

  async function setStatus(employeeId: string, status: string) {
    setSaving(employeeId)
    const existing = getRecord(employeeId)
    if (existing) {
      await supabase.from('attendance').update({ status }).eq('id', existing.id)
    } else {
      await supabase.from('attendance').insert({ employee_id: employeeId, date: selectedDate, status })
    }
    await fetchData()
    setSaving(null)
  }

  async function updateTime(employeeId: string, field: 'check_in' | 'check_out', value: string) {
    const existing = getRecord(employeeId)
    if (existing) {
      await supabase.from('attendance').update({ [field]: value || null }).eq('id', existing.id)
    } else {
      await supabase.from('attendance').insert({ employee_id: employeeId, date: selectedDate, status: 'present', [field]: value || null })
    }
    await fetchData()
  }

  const presentCount  = records.filter(r => r.status === 'present').length
  const absentCount   = records.filter(r => r.status === 'absent').length
  const lateCount     = records.filter(r => r.status === 'late').length
  const offCount      = records.filter(r => r.status === 'off').length
  const attendanceRate = employees.length > 0 ? Math.round(((presentCount + lateCount) / employees.length) * 100) : 0

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
        .mono { font-family: 'DM Mono', monospace; }
        .layout { display: flex; height: 100vh; overflow: hidden; }

        .sidebar { width: 240px; flex-shrink: 0; background: var(--surface); border-right: 1px solid var(--border); display: flex; flex-direction: column; }
        .sidebar-brand { padding: 28px 24px 24px; border-bottom: 1px solid var(--border); }
        .brand-logo { font-size: 20px; font-weight: 800; color: #fff; }
        .brand-logo span { color: var(--orange); }
        .brand-org { font-size: 10px; color: var(--text-muted); margin-top: 6px; text-transform: uppercase; letter-spacing: 2px; font-family: 'DM Mono', monospace; }
        .sidebar-nav { flex: 1; padding: 12px 0; overflow-y: auto; }
        .nav-section-label { font-size: 9px; color: var(--text-muted); letter-spacing: 2px; text-transform: uppercase; padding: 16px 24px 8px; font-family: 'DM Mono', monospace; }
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

        .date-picker {
          padding: 10px 16px; background: var(--surface); border: 1px solid var(--border);
          border-radius: 10px; color: var(--text); font-family: 'DM Mono', monospace;
          font-size: 13px; outline: none; cursor: pointer;
          transition: border-color 0.2s;
        }
        .date-picker:focus { border-color: var(--green); }
        .date-picker::-webkit-calendar-picker-indicator { filter: invert(1); opacity: 0.5; }

        .kpi-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; margin-bottom: 28px; }
        .kpi-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 18px 20px; position: relative; overflow: hidden; }
        .kpi-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--kpi-color); }
        .kpi-label { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1.5px; font-family: 'DM Mono', monospace; margin-bottom: 10px; }
        .kpi-value { font-size: 30px; font-weight: 800; color: var(--kpi-color); letter-spacing: -1px; }
        .kpi-desc { font-size: 10px; color: var(--text-muted); margin-top: 4px; font-family: 'DM Mono', monospace; }

        .table-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
        .table-header { padding: 20px 24px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
        .table-title { font-size: 14px; font-weight: 700; color: #fff; }
        .table-count { font-size: 11px; color: var(--text-muted); font-family: 'DM Mono', monospace; }
        table { width: 100%; border-collapse: collapse; }
        thead tr { border-bottom: 1px solid var(--border); }
        th { padding: 12px 20px; text-align: left; font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1.5px; font-family: 'DM Mono', monospace; font-weight: 500; }
        tbody tr { border-bottom: 1px solid rgba(255,255,255,0.03); transition: background 0.15s; }
        tbody tr:hover { background: rgba(255,255,255,0.02); }
        tbody tr:last-child { border-bottom: none; }
        td { padding: 14px 20px; font-size: 13px; }
        .td-name { font-weight: 700; color: #fff; }
        .td-role { font-size: 11px; color: var(--text-muted); font-family: 'DM Mono', monospace; }
        .td-hours { font-weight: 700; color: #fff; font-family: 'DM Mono', monospace; font-size: 13px; }
        .empty-cell { padding: 48px; text-align: center; color: var(--text-muted); font-family: 'DM Mono', monospace; font-size: 12px; }

        .status-btns { display: flex; gap: 5px; flex-wrap: wrap; }
        .status-btn {
          padding: 5px 11px; border-radius: 20px; font-size: 10px; font-weight: 700;
          cursor: pointer; border: 1px solid; transition: all 0.15s;
          font-family: 'DM Mono', monospace; letter-spacing: 0.3px;
        }
        .status-btn.inactive { border-color: rgba(255,255,255,0.08); background: transparent; color: var(--text-muted); }
        .status-btn.inactive:hover { border-color: rgba(255,255,255,0.2); color: var(--text-dim); }

        .time-input {
          background: var(--surface2); border: 1px solid var(--border);
          border-radius: 8px; color: var(--text); font-family: 'DM Mono', monospace;
          font-size: 12px; padding: 7px 10px; outline: none; width: 100px;
          transition: border-color 0.2s;
        }
        .time-input:focus { border-color: var(--green); }
        .time-input::-webkit-calendar-picker-indicator { filter: invert(1); opacity: 0.3; }

        .attendance-bar { height: 4px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden; margin-top: 8px; }
        .attendance-bar-fill { height: 100%; border-radius: 4px; background: var(--green); transition: width 1s ease; }

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
            <div className="nav-section-label">Menu</div>
            {SIDEBAR_ITEMS.map(item => (
              <a key={item.href} href={item.href} className={`nav-item${item.href === '/dashboard/attendance' ? ' active' : ''}`}>
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
                <div className="page-title">Attendance</div>
                <div className="page-sub">{employees.length} active employees · {attendanceRate}% attendance rate</div>
                <div className="attendance-bar" style={{ width: 200 }}>
                  <div className="attendance-bar-fill" style={{ width: `${attendanceRate}%` }} />
                </div>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="date-picker"
              />
            </div>

            {/* KPI Row */}
            <div className="kpi-row fade-in fade-in-2">
              {[
                { label: 'Present',  value: presentCount,  color: '#34d399', desc: 'On time' },
                { label: 'Absent',   value: absentCount,   color: '#f87171', desc: 'Not in' },
                { label: 'Late',     value: lateCount,     color: '#fb923c', desc: 'Delayed' },
                { label: 'Off',      value: offCount,      color: '#94a3b8', desc: 'Day off' },
                { label: 'Rate',     value: `${attendanceRate}%`, color: '#a3e635', desc: 'Attendance' },
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
                <span className="table-title">Employee Attendance</span>
                <span className="table-count">{selectedDate}</span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="empty-cell">Loading...</td></tr>
                  ) : employees.length === 0 ? (
                    <tr><td colSpan={6} className="empty-cell">No active employees found</td></tr>
                  ) : employees.map(emp => {
                    const rec = getRecord(emp.id)
                    const status = rec?.status || ''
                    let hours = '—'
                    if (rec?.check_in && rec?.check_out) {
                      const [h1, m1] = rec.check_in.split(':').map(Number)
                      const [h2, m2] = rec.check_out.split(':').map(Number)
                      const diff = (h2 * 60 + m2) - (h1 * 60 + m1)
                      if (diff > 0) hours = `${Math.floor(diff / 60)}h ${diff % 60}m`
                    }
                    return (
                      <tr key={emp.id}>
                        <td>
                          <div className="td-name">{emp.full_name}</div>
                        </td>
                        <td><span className="td-role">{emp.role}</span></td>
                        <td>
                          <div className="status-btns">
                            {Object.entries(STATUS_CFG).map(([key, cfg]) => {
                              const isActive = status === key
                              return (
                                <button
                                  key={key}
                                  disabled={saving === emp.id}
                                  onClick={() => setStatus(emp.id, key)}
                                  className={`status-btn ${isActive ? 'active' : 'inactive'}`}
                                  style={isActive ? {
                                    borderColor: cfg.color,
                                    background: cfg.bg,
                                    color: cfg.color,
                                  } : {}}
                                >
                                  {cfg.label}
                                </button>
                              )
                            })}
                          </div>
                        </td>
                        <td>
                          <input
                            type="time"
                            defaultValue={rec?.check_in || ''}
                            onBlur={e => updateTime(emp.id, 'check_in', e.target.value)}
                            className="time-input"
                          />
                        </td>
                        <td>
                          <input
                            type="time"
                            defaultValue={rec?.check_out || ''}
                            onBlur={e => updateTime(emp.id, 'check_out', e.target.value)}
                            className="time-input"
                          />
                        </td>
                        <td className="td-hours">{hours}</td>
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