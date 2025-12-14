import { NextResponse } from 'next/server'
import { CartItem } from '@/store/cart'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendCustomerOrderConfirmationEmail } from '@/lib/email/resend'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const { items, customer } = (await request.json()) as {
      items: CartItem[]
      customer?: { name?: string; email?: string }
    }
    
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Empty cart' }, { status: 400 })
    }

    const customerName = (customer?.name || '').trim()
    const customerEmail = (customer?.email || '').trim().toLowerCase()

    if (!customerName) {
      return NextResponse.json({ error: 'Missing name' }, { status: 400 })
    }
    if (!customerEmail || !customerEmail.includes('@')) {
      return NextResponse.json({ error: 'Missing or invalid email' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const productIds = Array.from(new Set(items.map((i) => i.product?.id).filter(Boolean))) as string[]

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, base_price, is_archived')
      .in('id', productIds)

    if (productsError) {
      console.error('Error fetching products for checkout:', productsError)
      return NextResponse.json({ error: 'Failed to validate cart' }, { status: 500 })
    }

    const productById = new Map(products?.map((p: any) => [p.id, p]))

    // Validate and compute total on the server (never trust client totals/prices)
    let amountTotal = 0
    for (const item of items) {
      const productId = item.product?.id
      const quantity = Number(item.quantity || 0)
      if (!productId || !Number.isFinite(quantity) || quantity <= 0) {
        return NextResponse.json({ error: 'Invalid cart item' }, { status: 400 })
      }

      const product = productById.get(productId)
      if (!product) {
        return NextResponse.json({ error: 'Unknown product in cart' }, { status: 400 })
      }
      if (product.is_archived) {
        return NextResponse.json({ error: 'Product no longer available' }, { status: 400 })
      }

      amountTotal += Number(product.base_price || 0) * quantity
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        email: customerEmail,
        customer_name: customerName,
        amount_total: amountTotal,
        status: 'pending',
      } as any)
      .select('id')
      .single()

    if (orderError || !order?.id) {
      console.error('Error creating order:', orderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.product.id,
      quantity: item.quantity,
      customization_data: item.customization || null,
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems as any)
    if (itemsError) {
      console.error('Error creating order items:', itemsError)
      // Keep the order row; customer support can still see it and follow up.
    }

    // Transactional email confirmation to customer (best-effort; order should still succeed if email fails)
    try {
      await sendCustomerOrderConfirmationEmail(order.id)
    } catch (e) {
      console.error('Failed to send customer order confirmation email:', e)
    }

    return NextResponse.json({ orderId: order.id })
  } catch (err: any) {
    console.error('Error creating order:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

