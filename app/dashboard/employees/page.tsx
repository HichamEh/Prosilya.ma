'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Employee = {
  id: string; full_name: string; phone: string | null; role: string
  salary: number; hire_date: string | null; status: string; notes: string | null
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

const ROLE_CFG: Record<string, { color: string; bg: string }> = {
  agent:   { color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  manager: { color: '#c084fc', bg: 'rgba(192,132,252,0.12)' },
  admin:   { color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
  driver:  { color: '#fb923c', bg: 'rgba(251,146,60,0.12)' },
  other:   { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
}

const emptyForm = { full_name: '', phone: '', role: 'agent', salary: '', hire_date: '', status: 'active', notes: '' }

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => { fetchEmployees() }, [])

  async function fetchEmployees() {
    setLoading(true)
    const { data } = await supabase.from('employees').select('*').order('full_name')
    setEmployees(data || [])
    setLoading(false)
  }

  function set(field: string, value: string) { setForm(f => ({ ...f, [field]: value })) }

  function startEdit(emp: Employee) {
    setEditId(emp.id)
    setForm({ full_name: emp.full_name, phone: emp.phone || '', role: emp.role, salary: String(emp.salary), hire_date: emp.hire_date || '', status: emp.status, notes: emp.notes || '' })
    setShowForm(true)
  }

  function cancelForm() { setShowForm(false); setEditId(null); setForm(emptyForm); setError('') }

  async function handleSave() {
    if (!form.full_name) { setError('Full name is required.'); return }
    setSaving(true); setError('')
    const payload = { full_name: form.full_name, phone: form.phone || null, role: form.role, salary: parseFloat(form.salary) || 0, hire_date: form.hire_date || null, status: form.status, notes: form.notes || null }
    if (editId) await supabase.from('employees').update(payload).eq('id', editId)
    else await supabase.from('employees').insert(payload)
    await fetchEmployees(); cancelForm(); setSaving(false)
  }

  async function handleDelete(id: string) {
    await supabase.from('employees').delete().eq('id', id)
    setDeleteConfirm(null); fetchEmployees()
  }

  const filtered = employees.filter(e =>
    e.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (e.phone || '').includes(search) || e.role.toLowerCase().includes(search.toLowerCase())
  )

  const activeCount = employees.filter(e => e.status === 'active').length
  const totalPayroll = employees.filter(e => e.status === 'active').reduce((s, e) => s + e.salary, 0)

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

        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
        .page-title { font-size: 30px; font-weight: 800; color: #fff; letter-spacing: -1px; }
        .page-sub { font-size: 12px; color: var(--text-muted); margin-top: 6px; font-family: 'DM Mono', monospace; }
        .add-btn { padding: 12px 22px; background: rgba(249,115,22,0.1); color: var(--orange); border: 1px solid rgba(249,115,22,0.2); border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 12px; font-family: 'Syne', sans-serif; transition: all 0.2s; text-transform: uppercase; white-space: nowrap; }
        .add-btn:hover { background: var(--orange); color: #fff; border-color: var(--orange); }

        .kpi-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 24px; }
        .kpi-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 18px 20px; position: relative; overflow: hidden; }
        .kpi-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--kpi-color); }
        .kpi-label { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1.5px; font-family: 'DM Mono', monospace; margin-bottom: 8px; }
        .kpi-value { font-size: 28px; font-weight: 800; color: var(--kpi-color); letter-spacing: -1px; }
        .kpi-desc { font-size: 10px; color: var(--text-muted); margin-top: 4px; font-family: 'DM Mono', monospace; }

        .search-box { width: 320px; padding: 10px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; color: var(--text); font-family: 'DM Mono', monospace; font-size: 13px; outline: none; margin-bottom: 20px; transition: border-color 0.2s; }
        .search-box:focus { border-color: var(--green); }
        .search-box::placeholder { color: var(--text-muted); }

        .form-card { background: var(--surface); border: 1px solid rgba(249,115,22,0.15); border-radius: var(--radius); overflow: hidden; margin-bottom: 24px; }
        .form-bar { height: 3px; background: linear-gradient(90deg, #22c55e, #f97316); }
        .form-inner { padding: 28px; }
        .form-title { font-size: 13px; font-weight: 700; color: var(--orange); margin-bottom: 24px; text-transform: uppercase; letter-spacing: 1px; font-family: 'DM Mono', monospace; }
        .form-grid-2 { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; margin-bottom: 16px; }
        .form-grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .form-grid-1 { margin-bottom: 20px; }
        .form-field label { display: block; font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1.5px; font-family: 'DM Mono', monospace; margin-bottom: 8px; }
        .form-input { width: 100%; padding: 10px 14px; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-family: 'DM Mono', monospace; font-size: 13px; outline: none; transition: border-color 0.2s; }
        .form-input:focus { border-color: var(--orange); }
        .form-input::placeholder { color: var(--text-muted); }
        .form-input option { background: var(--surface2); color: var(--text); }
        .form-error { font-size: 12px; color: #f87171; font-family: 'DM Mono', monospace; margin-bottom: 16px; }
        .form-actions { display: flex; gap: 10px; }
        .btn-save { padding: 11px 24px; background: rgba(249,115,22,0.1); color: var(--orange); border: 1px solid rgba(249,115,22,0.25); border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 12px; font-family: 'Syne', sans-serif; transition: all 0.2s; text-transform: uppercase; }
        .btn-save:hover:not(:disabled) { background: var(--orange); color: #fff; }
        .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-cancel { padding: 11px 18px; background: transparent; color: var(--text-muted); border: 1px solid var(--border); border-radius: 10px; cursor: pointer; font-size: 12px; font-family: 'Syne', sans-serif; transition: all 0.2s; }
        .btn-cancel:hover { border-color: var(--border-bright); color: var(--text); }

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
        td { padding: 13px 20px; font-size: 13px; vertical-align: middle; }
        .td-salary { font-weight: 700; color: #fff; font-family: 'DM Mono', monospace; }
        .td-phone { color: var(--text-dim); font-family: 'DM Mono', monospace; font-size: 12px; }
        .td-date { color: var(--text-muted); font-size: 11px; font-family: 'DM Mono', monospace; }
        .empty-cell { padding: 48px; text-align: center; color: var(--text-muted); font-family: 'DM Mono', monospace; font-size: 12px; }

        .avatar { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; flex-shrink: 0; }
        .emp-name-cell { display: flex; align-items: center; gap: 12px; }
        .emp-name { font-weight: 700; color: #fff; font-size: 13px; }
        .emp-notes { font-size: 11px; color: var(--text-muted); font-family: 'DM Mono', monospace; margin-top: 2px; }

        .role-chip { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; letter-spacing: 0.3px; font-family: 'DM Mono', monospace; }
        .status-chip { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; font-family: 'DM Mono', monospace; }
        .status-dot { width: 5px; height: 5px; border-radius: 50%; }

        .row-actions { display: flex; gap: 6px; align-items: center; }
        .edit-btn { padding: 5px 12px; background: transparent; color: var(--text-muted); border: 1px solid var(--border); border-radius: 6px; cursor: pointer; font-size: 11px; font-family: 'DM Mono', monospace; transition: all 0.2s; }
        .edit-btn:hover { border-color: var(--green); color: var(--green); }
        .del-btn { padding: 5px 12px; background: transparent; color: var(--text-muted); border: 1px solid var(--border); border-radius: 6px; cursor: pointer; font-size: 11px; font-family: 'DM Mono', monospace; transition: all 0.2s; }
        .del-btn:hover { border-color: #f87171; color: #f87171; }
        .confirm-inline { display: flex; align-items: center; gap: 6px; }
        .confirm-yes { padding: 5px 10px; background: rgba(248,113,113,0.12); color: #f87171; border: 1px solid rgba(248,113,113,0.25); border-radius: 6px; cursor: pointer; font-size: 11px; font-family: 'DM Mono', monospace; transition: all 0.2s; }
        .confirm-yes:hover { background: #ef4444; color: #fff; }
        .confirm-no { padding: 5px 8px; background: transparent; color: var(--text-muted); border: 1px solid var(--border); border-radius: 6px; cursor: pointer; font-size: 11px; font-family: 'DM Mono', monospace; }

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
              <a key={item.href} href={item.href} className={`nav-item${item.href === '/dashboard/employees' ? ' active' : ''}`}>
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
                <div className="page-title">Employees</div>
                <div className="page-sub">{filtered.length} of {employees.length} shown</div>
              </div>
              <button className="add-btn" onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm) }}>
                + Add Employee
              </button>
            </div>

            {/* KPI Row */}
            <div className="kpi-row fade-in fade-in-2">
              {[
                { label: 'Total Employees', value: employees.length, color: '#34d399', desc: 'All records' },
                { label: 'Active',          value: activeCount,      color: '#a3e635', desc: 'Currently working' },
                { label: 'Monthly Payroll', value: `${totalPayroll.toLocaleString()} MAD`, color: '#f472b6', desc: 'Active staff only' },
              ].map(k => (
                <div key={k.label} className="kpi-card" style={{ '--kpi-color': k.color } as React.CSSProperties}>
                  <div className="kpi-label">{k.label}</div>
                  <div className="kpi-value">{k.value}</div>
                  <div className="kpi-desc">{k.desc}</div>
                </div>
              ))}
            </div>

            {/* Search */}
            <input className="search-box fade-in fade-in-3" placeholder="Search by name, phone or role..." value={search} onChange={e => setSearch(e.target.value)} />

            {/* Form */}
            {showForm && (
              <div className="form-card fade-in fade-in-3">
                <div className="form-bar" />
                <div className="form-inner">
                  <div className="form-title">{editId ? '✎ Edit Employee' : '+ New Employee'}</div>
                  <div className="form-grid-2">
                    <div className="form-field">
                      <label>Full Name *</label>
                      <input className="form-input" placeholder="Ahmed Benali" value={form.full_name} onChange={e => set('full_name', e.target.value)} />
                    </div>
                    <div className="form-field">
                      <label>Phone</label>
                      <input className="form-input" placeholder="06XXXXXXXX" value={form.phone} onChange={e => set('phone', e.target.value)} />
                    </div>
                  </div>
                  <div className="form-grid-4">
                    <div className="form-field">
                      <label>Role</label>
                      <select className="form-input" value={form.role} onChange={e => set('role', e.target.value)}>
                        <option value="agent">Agent</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                        <option value="driver">Driver</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="form-field">
                      <label>Salary (MAD)</label>
                      <input className="form-input" type="number" placeholder="0" value={form.salary} onChange={e => set('salary', e.target.value)} />
                    </div>
                    <div className="form-field">
                      <label>Hire Date</label>
                      <input className="form-input" type="date" value={form.hire_date} onChange={e => set('hire_date', e.target.value)} />
                    </div>
                    <div className="form-field">
                      <label>Status</label>
                      <select className="form-input" value={form.status} onChange={e => set('status', e.target.value)}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-grid-1 form-field">
                    <label>Notes</label>
                    <input className="form-input" placeholder="Optional notes..." value={form.notes} onChange={e => set('notes', e.target.value)} />
                  </div>
                  {error && <div className="form-error">{error}</div>}
                  <div className="form-actions">
                    <button className="btn-save" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : '◈ Save'}</button>
                    <button className="btn-cancel" onClick={cancelForm}>Cancel</button>
                  </div>
                </div>
              </div>
            )}

            {/* Table */}
            <div className="table-card fade-in fade-in-4">
              <div className="table-header">
                <span className="table-title">All Employees</span>
                <span className="table-count">{filtered.length} records</span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Salary</th>
                    <th>Hire Date</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="empty-cell">Loading...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={7} className="empty-cell">No employees found</td></tr>
                  ) : filtered.map(emp => {
                    const role = ROLE_CFG[emp.role] || ROLE_CFG.other
                    const isActive = emp.status === 'active'
                    return (
                      <tr key={emp.id}>
                        <td>
                          <div className="emp-name-cell">
                            <div className="avatar" style={{ background: role.bg, color: role.color, border: `1px solid ${role.color}30` }}>
                              {initials(emp.full_name)}
                            </div>
                            <div>
                              <div className="emp-name">{emp.full_name}</div>
                              {emp.notes && <div className="emp-notes">{emp.notes}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="td-phone">{emp.phone || '—'}</td>
                        <td>
                          <span className="role-chip" style={{ background: role.bg, color: role.color }}>
                            {emp.role}
                          </span>
                        </td>
                        <td className="td-salary">{emp.salary.toLocaleString()} <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 400 }}>MAD</span></td>
                        <td className="td-date">{emp.hire_date ? new Date(emp.hire_date).toLocaleDateString('en-GB') : '—'}</td>
                        <td>
                          <span className="status-chip" style={{ background: isActive ? 'rgba(34,197,94,0.1)' : 'rgba(148,163,184,0.1)', color: isActive ? '#34d399' : '#94a3b8' }}>
                            <span className="status-dot" style={{ background: isActive ? '#34d399' : '#64748b' }} />
                            {emp.status}
                          </span>
                        </td>
                        <td>
                          {deleteConfirm === emp.id ? (
                            <div className="confirm-inline">
                              <button className="confirm-yes" onClick={() => handleDelete(emp.id)}>Confirm</button>
                              <button className="confirm-no" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            </div>
                          ) : (
                            <div className="row-actions">
                              <button className="edit-btn" onClick={() => startEdit(emp)}>Edit</button>
                              <button className="del-btn" onClick={() => setDeleteConfirm(emp.id)}>Del</button>
                            </div>
                          )}
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