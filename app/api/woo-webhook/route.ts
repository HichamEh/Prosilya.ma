import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  console.log('Webhook received')
  
  try {
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const orgId = process.env.DEFAULT_ORGANIZATION_ID
    
    console.log('anonKey exists:', !!anonKey)
    console.log('orgId:', orgId)

    const supabase = createClient(
      'https://tyfhkzupeoabanmzgbug.supabase.co',
      anonKey!
    )

    const body = await req.text()
    console.log('body received, length:', body.length)
    
    const order = JSON.parse(body)
    console.log('order id:', order.id)

    const { error } = await supabase.rpc('insert_woo_order', {
      p_organization_id: orgId,
      p_customer_name: `${order.billing?.first_name || ''} ${order.billing?.last_name || ''}`.trim(),
      p_customer_phone: order.billing?.phone || '',
      p_customer_city: order.billing?.city || '',
      p_customer_address: order.billing?.address_1 || '',
      p_total_cod: parseFloat(order.total) || 0,
      p_notes: 'WooCommerce #' + order.id,
    })

    console.log('rpc error:', error)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.log('catch error:', String(err))
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}