'use client'
import { useState } from 'react'
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

const DELIVERY_COMPANIES = ['Amana', 'Aramex', 'CTM', 'Primaéro', 'GLS', 'Other']

export default function NewOrderPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    customer_name: '', customer_phone: '', customer_city: '',
    customer_address: '', total_cod: '', delivery_company: '', notes: '',
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit() {
    if (!form.customer_name || !form.customer_phone || !form.total_cod) {
      setError('Name, phone, and total COD are required.')
      return
    }
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('You are not logged in. Please refresh and log in again.'); setLoading(false); return }

    const { data: profile } = await supabase.from('users').select('organization_id').eq('id', user.id).single()

    const { error } = await supabase.from('orders').insert({
      organization_id: profile?.organization_id,
      customer_name: form.customer_name,
      customer_phone: form.customer_phone,
      customer_city: form.customer_city,
      customer_address: form.customer_address,
      total_cod: parseFloat(form.total_cod),
      delivery_company: form.delivery_company || null,
      notes: form.notes || null,
      status: 'new',
    })

    if (error) { setError(error.message); setLoading(false) }
    else router.push('/dashboard/orders')
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

        .form-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; max-width: 680px; }
        .form-bar { height: 3px; background: linear-gradient(90deg, #22c55e, #f97316); }
        .form-inner { padding: 32px; }

        .field-label { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1.5px; font-family: 'DM Mono', monospace; margin-bottom: 8px; display: block; }
        .required { color: var(--orange); margin-left: 2px; }

        .form-input { width: 100%; padding: 10px 14px; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-family: 'DM Mono', monospace; font-size: 13px; outline: none; transition: border-color 0.2s; margin-bottom: 18px; }
        .form-input:focus { border-color: var(--green); }
        .form-input::placeholder { color: var(--text-muted); }
        .form-input option { background: var(--surface2); color: var(--text); }

        .form-textarea { width: 100%; padding: 12px 14px; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-family: 'DM Mono', monospace; font-size: 13px; outline: none; resize: vertical; min-height: 88px; transition: border-color 0.2s; margin-bottom: 18px; }
        .form-textarea:focus { border-color: var(--green); }
        .form-textarea::placeholder { color: var(--text-muted); }

        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }

        .section-divider { border: none; border-top: 1px solid var(--border); margin: 8px 0 24px; }

        .delivery-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
        .delivery-pill { padding: 7px 16px; border-radius: 20px; font-size: 11px; font-weight: 700; cursor: pointer; border: 1px solid; transition: all 0.15s; font-family: 'DM Mono', monospace; background: transparent; color: var(--text-muted); border-color: rgba(255,255,255,0.08); }
        .delivery-pill:hover { border-color: rgba(255,255,255,0.2); color: var(--text-dim); }
        .delivery-pill.selected { border-color: var(--orange); background: rgba(249,115,22,0.12); color: var(--orange); }

        .alert-error { padding: 10px 14px; border-radius: 8px; font-size: 12px; font-family: 'DM Mono', monospace; margin-bottom: 16px; background: rgba(248,113,113,0.1); color: #f87171; border: 1px solid rgba(248,113,113,0.2); }

        .form-actions { display: flex; gap: 10px; margin-top: 4px; }
        .submit-btn { padding: 12px 28px; background: rgba(34,197,94,0.1); color: var(--green); border: 1px solid rgba(34,197,94,0.25); border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 13px; font-family: 'Syne', sans-serif; transition: all 0.2s; text-transform: uppercase; letter-spacing: 0.5px; }
        .submit-btn:hover:not(:disabled) { background: var(--green); color: #fff; border-color: var(--green); }
        .submit-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .cancel-btn { padding: 12px 20px; background: transparent; color: var(--text-muted); border: 1px solid var(--border); border-radius: 10px; cursor: pointer; font-size: 13px; font-family: 'Syne', sans-serif; transition: all 0.2s; }
        .cancel-btn:hover { border-color: var(--border-bright); color: var(--text); }

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
                <div className="page-title">New Order</div>
                <div className="page-sub">Fill in customer details below</div>
              </div>
            </div>

            <div className="form-card fade-in">
              <div className="form-bar" />
              <div className="form-inner">

                {/* Customer */}
                <div className="grid-2">
                  <div>
                    <label className="field-label">Customer Name <span className="required">*</span></label>
                    <input className="form-input" placeholder="Ahmed Benali" value={form.customer_name} onChange={e => set('customer_name', e.target.value)} />
                  </div>
                  <div>
                    <label className="field-label">Phone Number <span className="required">*</span></label>
                    <input className="form-input" placeholder="06XXXXXXXX" value={form.customer_phone} onChange={e => set('customer_phone', e.target.value)} />
                  </div>
                </div>

                <div className="grid-3">
                  <div>
                    <label className="field-label">City</label>
                    <input className="form-input" placeholder="Casablanca" value={form.customer_city} onChange={e => set('customer_city', e.target.value)} />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label className="field-label">Address</label>
                    <input className="form-input" placeholder="Street address..." value={form.customer_address} onChange={e => set('customer_address', e.target.value)} />
                  </div>
                </div>

                <hr className="section-divider" />

                {/* Order */}
                <div className="grid-2">
                  <div>
                    <label className="field-label">Total COD (MAD) <span className="required">*</span></label>
                    <input className="form-input" type="number" placeholder="0.00" value={form.total_cod} onChange={e => set('total_cod', e.target.value)} />
                  </div>
                </div>

                <label className="field-label">Delivery Company</label>
                <div className="delivery-grid">
                  {DELIVERY_COMPANIES.map(co => (
                    <button
                      key={co}
                      type="button"
                      className={`delivery-pill${form.delivery_company === co ? ' selected' : ''}`}
                      onClick={() => set('delivery_company', form.delivery_company === co ? '' : co)}
                    >
                      {co}
                    </button>
                  ))}
                </div>

                <label className="field-label">Notes</label>
                <textarea
                  className="form-textarea"
                  placeholder="Any internal notes..."
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                />

                {error && <div className="alert-error">✕ &nbsp;{error}</div>}

                <div className="form-actions">
                  <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Saving...' : '◈ Create Order'}
                  </button>
                  <button className="cancel-btn" onClick={() => router.push('/dashboard/orders')}>Cancel</button>
                </div>

              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}