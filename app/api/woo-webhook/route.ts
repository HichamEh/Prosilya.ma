import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    
    // Handle WooCommerce ping (not JSON)
    if (!body || !body.startsWith('{')) {
      return NextResponse.json({ success: true, message: 'ping received' })
    }

    const order = JSON.parse(body)
    
    // Only process actual orders
    if (!order.billing) {
      return NextResponse.json({ success: true, message: 'not an order' })
    }

    const supabase = createClient(
      'https://tyfhkzupeoabanmzgbug.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { error } = await supabase.rpc('insert_woo_order', {
      p_organization_id: process.env.DEFAULT_ORGANIZATION_ID,
      p_customer_name: `${order.billing?.first_name || ''} ${order.billing?.last_name || ''}`.trim(),
      p_customer_phone: order.billing?.phone || '',
      p_customer_city: order.billing?.city || '',
      p_customer_address: order.billing?.address_1 || '',
      p_total_cod: parseFloat(order.total) || 0,
      p_notes: 'WooCommerce #' + order.id,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}