'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type StockItem = {
  id: string; product_name: string; sku: string | null
  quantity: number; unit: string; cost_price: number
  sell_price: number; notes: string | null
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

const UNITS = ['pcs', 'kg', 'box', 'pair', 'set']
const emptyForm = { product_name: '', sku: '', quantity: '', unit: 'pcs', cost_price: '', sell_price: '', notes: '' }

export default function StockPage() {
  const [items, setItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => { fetchStock() }, [])

  async function fetchStock() {
    setLoading(true)
    const { data } = await supabase.from('stock').select('*').order('product_name')
    setItems(data || [])
    setLoading(false)
  }

  function set(field: string, value: string) { setForm(f => ({ ...f, [field]: value })) }

  function startEdit(item: StockItem) {
    setEditId(item.id)
    setForm({ product_name: item.product_name, sku: item.sku || '', quantity: String(item.quantity), unit: item.unit, cost_price: String(item.cost_price), sell_price: String(item.sell_price), notes: item.notes || '' })
    setShowForm(true)
  }

  function cancelForm() { setShowForm(false); setEditId(null); setForm(emptyForm); setError('') }

  async function handleSave() {
    if (!form.product_name || !form.quantity) { setError('Product name and quantity are required.'); return }
    setSaving(true); setError('')
    const payload = { product_name: form.product_name, sku: form.sku || null, quantity: parseInt(form.quantity), unit: form.unit, cost_price: parseFloat(form.cost_price) || 0, sell_price: parseFloat(form.sell_price) || 0, notes: form.notes || null }
    if (editId) await supabase.from('stock').update(payload).eq('id', editId)
    else await supabase.from('stock').insert(payload)
    await fetchStock(); cancelForm(); setSaving(false)
  }

  async function handleDelete(id: string) {
    await supabase.from('stock').delete().eq('id', id)
    setDeleteConfirm(null); fetchStock()
  }

  const filtered = items.filter(i =>
    i.product_name.toLowerCase().includes(search.toLowerCase()) ||
    (i.sku || '').toLowerCase().includes(search.toLowerCase())
  )

  const totalStockValue = items.reduce((s, i) => s + i.cost_price * i.quantity, 0)
  const lowStockCount = items.filter(i => i.quantity < 5).length

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

        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .page-title { font-size: 30px; font-weight: 800; color: #fff; letter-spacing: -1px; }
        .page-sub { font-size: 12px; color: var(--text-muted); margin-top: 6px; font-family: 'DM Mono', monospace; }
        .add-btn { padding: 12px 22px; background: rgba(249,115,22,0.1); color: var(--orange); border: 1px solid rgba(249,115,22,0.2); border-radius: 10px; cursor: pointer; font-weight: 700; font-size: 12px; font-family: 'Syne', sans-serif; transition: all 0.2s; text-transform: uppercase; white-space: nowrap; }
        .add-btn:hover { background: var(--orange); color: #fff; border-color: var(--orange); }

        .kpi-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 24px; }
        .kpi-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 18px 20px; position: relative; overflow: hidden; }
        .kpi-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--kpi-color); }
        .kpi-label { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1.5px; font-family: 'DM Mono', monospace; margin-bottom: 8px; }
        .kpi-value { font-size: 26px; font-weight: 800; color: var(--kpi-color); letter-spacing: -0.5px; }
        .kpi-desc { font-size: 10px; color: var(--text-muted); margin-top: 4px; font-family: 'DM Mono', monospace; }

        .search-box { width: 300px; padding: 10px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; color: var(--text); font-family: 'DM Mono', monospace; font-size: 13px; outline: none; margin-bottom: 20px; transition: border-color 0.2s; }
        .search-box:focus { border-color: var(--green); }
        .search-box::placeholder { color: var(--text-muted); }

        .form-card { background: var(--surface); border: 1px solid rgba(249,115,22,0.15); border-radius: var(--radius); overflow: hidden; margin-bottom: 24px; }
        .form-bar { height: 3px; background: linear-gradient(90deg, #22c55e, #f97316); }
        .form-inner { padding: 28px; }
        .form-title { font-size: 13px; font-weight: 700; color: var(--orange); margin-bottom: 24px; text-transform: uppercase; letter-spacing: 1px; font-family: 'DM Mono', monospace; }
        .form-grid-2 { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; margin-bottom: 16px; }
        .form-grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .form-grid-1 { margin-bottom: 20px; }
        .field-label { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1.5px; font-family: 'DM Mono', monospace; margin-bottom: 8px; display: block; }
        .required { color: var(--orange); }
        .form-input { width: 100%; padding: 10px 14px; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; color: var(--text); font-family: 'DM Mono', monospace; font-size: 13px; outline: none; transition: border-color 0.2s; }
        .form-input:focus { border-color: var(--orange); }
        .form-input::placeholder { color: var(--text-muted); }
        .form-input option { background: var(--surface2); }
        .form-error { font-size: 12px; color: var(--red); font-family: 'DM Mono', monospace; margin-bottom: 16px; }
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

        .td-name { font-weight: 700; color: #fff; }
        .td-sku { color: var(--text-muted); font-family: 'DM Mono', monospace; font-size: 11px; }
        .td-qty-ok  { font-weight: 800; color: #34d399; font-family: 'DM Mono', monospace; }
        .td-qty-low { font-weight: 800; color: var(--red); font-family: 'DM Mono', monospace; }
        .td-unit { color: var(--text-muted); font-family: 'DM Mono', monospace; font-size: 12px; }
        .td-cost { color: var(--text-dim); font-family: 'DM Mono', monospace; }
        .td-sell { font-weight: 700; color: var(--orange); font-family: 'DM Mono', monospace; }
        .empty-cell { padding: 48px; text-align: center; color: var(--text-muted); font-family: 'DM Mono', monospace; font-size: 12px; }

        .margin-chip { display: inline-flex; padding: 3px 9px; border-radius: 20px; font-size: 10px; font-weight: 700; font-family: 'DM Mono', monospace; }

        .row-actions { display: flex; gap: 6px; align-items: center; }
        .edit-btn { padding: 5px 12px; background: transparent; color: var(--text-muted); border: 1px solid var(--border); border-radius: 6px; cursor: pointer; font-size: 11px; font-family: 'DM Mono', monospace; transition: all 0.2s; }
        .edit-btn:hover { border-color: var(--green); color: var(--green); }
        .del-btn { padding: 5px 12px; background: transparent; color: var(--text-muted); border: 1px solid var(--border); border-radius: 6px; cursor: pointer; font-size: 11px; font-family: 'DM Mono', monospace; transition: all 0.2s; }
        .del-btn:hover { border-color: var(--red); color: var(--red); }
        .confirm-inline { display: flex; align-items: center; gap: 6px; }
        .confirm-yes { padding: 5px 10px; background: rgba(248,113,113,0.12); color: var(--red); border: 1px solid rgba(248,113,113,0.25); border-radius: 6px; cursor: pointer; font-size: 11px; font-family: 'DM Mono', monospace; transition: all 0.2s; }
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
              <a key={item.href} href={item.href} className={`nav-item${item.href === '/dashboard/stock' ? ' active' : ''}`}>
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

            <div className="page-header fade-in fade-in-1">
              <div>
                <div className="page-title">Stock</div>
                <div className="page-sub">{filtered.length} products · {lowStockCount > 0 ? `${lowStockCount} low stock` : 'all stocked'}</div>
              </div>
              <button className="add-btn" onClick={() => { setShowForm(true); setEditId(null); setForm(emptyForm) }}>+ Add Product</button>
            </div>

            <div className="kpi-row fade-in fade-in-2">
              {[
                { label: 'Total Products', value: items.length,                                                              color: '#34d399', desc: 'SKUs in stock' },
                { label: 'Stock Value',    value: `${totalStockValue.toLocaleString('en', { maximumFractionDigits: 0 })} MAD`, color: '#f97316', desc: 'At cost price' },
                { label: 'Low Stock',      value: lowStockCount,                                                              color: lowStockCount > 0 ? '#f87171' : '#34d399', desc: 'Below 5 units' },
              ].map(k => (
                <div key={k.label} className="kpi-card" style={{ '--kpi-color': k.color } as React.CSSProperties}>
                  <div className="kpi-label">{k.label}</div>
                  <div className="kpi-value">{k.value}</div>
                  <div className="kpi-desc">{k.desc}</div>
                </div>
              ))}
            </div>

            <input className="search-box fade-in fade-in-3" placeholder="Search by name or SKU..." value={search} onChange={e => setSearch(e.target.value)} />

            {showForm && (
              <div className="form-card fade-in fade-in-3">
                <div className="form-bar" />
                <div className="form-inner">
                  <div className="form-title">{editId ? '✎ Edit Product' : '+ New Product'}</div>
                  <div className="form-grid-2">
                    <div>
                      <label className="field-label">Product Name <span className="required">*</span></label>
                      <input className="form-input" placeholder="e.g. Blue T-Shirt" value={form.product_name} onChange={e => set('product_name', e.target.value)} />
                    </div>
                    <div>
                      <label className="field-label">SKU</label>
                      <input className="form-input" placeholder="e.g. TS-001" value={form.sku} onChange={e => set('sku', e.target.value)} />
                    </div>
                  </div>
                  <div className="form-grid-4">
                    <div>
                      <label className="field-label">Quantity <span className="required">*</span></label>
                      <input className="form-input" type="number" placeholder="0" value={form.quantity} onChange={e => set('quantity', e.target.value)} />
                    </div>
                    <div>
                      <label className="field-label">Unit</label>
                      <select className="form-input" value={form.unit} onChange={e => set('unit', e.target.value)}>
                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="field-label">Cost Price (MAD)</label>
                      <input className="form-input" type="number" placeholder="0.00" value={form.cost_price} onChange={e => set('cost_price', e.target.value)} />
                    </div>
                    <div>
                      <label className="field-label">Sell Price (MAD)</label>
                      <input className="form-input" type="number" placeholder="0.00" value={form.sell_price} onChange={e => set('sell_price', e.target.value)} />
                    </div>
                  </div>
                  <div className="form-grid-1">
                    <label className="field-label">Notes</label>
                    <input className="form-input" placeholder="Optional notes..." value={form.notes} onChange={e => set('notes', e.target.value)} />
                  </div>
                  {error && <div className="form-error">✕ &nbsp;{error}</div>}
                  <div className="form-actions">
                    <button className="btn-save" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : '◈ Save'}</button>
                    <button className="btn-cancel" onClick={cancelForm}>Cancel</button>
                  </div>
                </div>
              </div>
            )}

            <div className="table-card fade-in fade-in-4">
              <div className="table-header">
                <span className="table-title">All Products</span>
                <span className="table-count">{filtered.length} records</span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Cost (MAD)</th>
                    <th>Sell (MAD)</th>
                    <th>Margin</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} className="empty-cell">Loading...</td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={8} className="empty-cell">No products yet</td></tr>
                  ) : filtered.map(item => {
                    const margin = item.sell_price > 0 ? Math.round(((item.sell_price - item.cost_price) / item.sell_price) * 100) : 0
                    const marginColor = margin > 20 ? '#34d399' : margin > 0 ? '#fbbf24' : '#f87171'
                    const marginBg = margin > 20 ? 'rgba(52,211,153,0.1)' : margin > 0 ? 'rgba(251,191,36,0.1)' : 'rgba(248,113,113,0.1)'
                    return (
                      <tr key={item.id}>
                        <td className="td-name">{item.product_name}</td>
                        <td className="td-sku">{item.sku || '—'}</td>
                        <td className={item.quantity < 5 ? 'td-qty-low' : 'td-qty-ok'}>{item.quantity}</td>
                        <td className="td-unit">{item.unit}</td>
                        <td className="td-cost">{item.cost_price.toFixed(2)}</td>
                        <td className="td-sell">{item.sell_price.toFixed(2)}</td>
                        <td>
                          <span className="margin-chip" style={{ background: marginBg, color: marginColor }}>
                            {margin}%
                          </span>
                        </td>
                        <td>
                          {deleteConfirm === item.id ? (
                            <div className="confirm-inline">
                              <button className="confirm-yes" onClick={() => handleDelete(item.id)}>Confirm</button>
                              <button className="confirm-no" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            </div>
                          ) : (
                            <div className="row-actions">
                              <button className="edit-btn" onClick={() => startEdit(item)}>Edit</button>
                              <button className="del-btn" onClick={() => setDeleteConfirm(item.id)}>Del</button>
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