import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const order = await req.json()

    const name = (order.billing?.first_name || '') + ' ' + (order.billing?.last_name || '')
    const phone = order.billing?.phone || ''
    const city = order.billing?.city || ''
    const address = order.billing?.address_1 || ''
    const total = parseFloat(order.total) || 0
    const wooId = order.id || ''

    const { error } = await supabase.from('orders').insert({
      organization_id: process.env.DEFAULT_ORGANIZATION_ID,
      customer_name: name.trim(),
      customer_phone: phone,
      customer_city: city,
      customer_address: address,
      total_cod: total,
      delivery_company: null,
      notes: 'WooCommerce #' + wooId,
      status: 'new',
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}