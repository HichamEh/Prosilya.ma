import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!serviceKey) {
      return NextResponse.json({ error: 'Missing service key' }, { status: 500 })
    }

    const supabase = createClient(
      'https://tyfhkzupeoabanmzgbug.supabase.co',
      serviceKey
    )

    const order = await req.json()

    const { error } = await supabase.from('orders').insert({
      organization_id: process.env.DEFAULT_ORGANIZATION_ID,
      customer_name: `${order.billing?.first_name || ''} ${order.billing?.last_name || ''}`.trim(),
      customer_phone: order.billing?.phone || '',
      customer_city: order.billing?.city || '',
      customer_address: order.billing?.address_1 || '',
      total_cod: parseFloat(order.total) || 0,
      delivery_company: null,
      notes: 'WooCommerce #' + order.id,
      status: 'new',
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}