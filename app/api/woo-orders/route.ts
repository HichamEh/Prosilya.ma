import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role key here (bypasses RLS) — keep this server-side only
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  // Optional: verify WooCommerce webhook secret
  const secret = req.headers.get('x-wc-webhook-secret')
  if (secret !== process.env.WOO_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const order = await req.json()

  // Map WooCommerce order fields → your orders table
  const { error } = await supabase.from('orders').insert({
    organization_id: process.env.DEFAULT_ORGANIZATION_ID, // your org
    customer_name: `${order.billing.first_name} ${order.billing.last_name}`,
    customer_phone: order.billing.phone,
    customer_city: order.billing.city,
    customer_address: `${order.billing.address_1} ${order.billing.address_2 || ''}`.trim(),
    total_cod: parseFloat(order.total),
    delivery_company: null,
    notes: `WooCommerce #${order.id} — ${order.payment_method_title}`,
    status: 'new',
  })

  if (error) {
    console.error('Supabase insert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}