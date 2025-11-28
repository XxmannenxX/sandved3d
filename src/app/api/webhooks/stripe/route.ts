import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia' as any,
  typescript: true,
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature') as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const supabase = createAdminClient()
    
    // Idempotency Check
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('stripe_session_id', session.id)
      .single()

    if (existingOrder) {
      console.log('Order already exists for session:', session.id)
      return NextResponse.json({ received: true })
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        email: session.customer_details?.email || '',
        stripe_session_id: session.id,
        amount_total: (session.amount_total || 0) / 100,
        status: 'paid',
        shipping_details: session.shipping_details as any,
      })
      .select()
      .single()

    if (orderError) {
      console.error('Error creating order:', orderError)
      return NextResponse.json({ error: 'Error creating order' }, { status: 500 })
    }

    // Retrieve line items to get customization details
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        expand: ['data.price.product']
    })
    
    const orderItems = lineItems.data.map((item: any) => ({
        order_id: order.id,
        product_id: item.price.product.metadata.product_id,
        quantity: item.quantity,
        customization_data: JSON.parse(item.price.product.metadata.customization || '{}')
    }))

    const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

    if (itemsError) {
        console.error('Error creating order items:', itemsError)
    }

    // Fetch order with items and products for email
    const { data: orderWithItems } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          quantity,
          customization_data,
          products (name, base_price, images)
        )
      `)
      .eq('id', order.id)
      .single()

    // Fetch email from settings
    const { data: settings } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'custom_request_email')
      .single()

    const recipientEmail = settings?.value || 'markus.lundevik@gmail.com'

    // Send order notification email
    if (orderWithItems) {
      const orderItemsList = orderWithItems.order_items?.map((item: any) => {
        const product = item.products
        const customization = item.customization_data || {}
        let customText = ''
        if (customization.text) customText = `\n    Custom Text: "${customization.text}"`
        if (customization.image_path) customText += `\n    Custom Image: Uploaded`
        
        return `  - ${product?.name || 'Product'} (x${item.quantity}) - ${product?.base_price || 0} kr${customText}`
      }).join('\n') || 'No items'

      const shippingInfo = order.shipping_details ? `
Shipping Details:
  Name: ${(order.shipping_details as any).name || 'N/A'}
  Address: ${(order.shipping_details as any).address?.line1 || 'N/A'}
  City: ${(order.shipping_details as any).address?.city || 'N/A'}
  Postal Code: ${(order.shipping_details as any).address?.postal_code || 'N/A'}
  Country: ${(order.shipping_details as any).address?.country || 'N/A'}
` : ''

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://your-site.com'

      try {
        await resend.emails.send({
          from: 'Andreas 3D <onboarding@resend.dev>',
          to: [recipientEmail],
          subject: `New Order #${order.id.slice(0, 8)} - ${order.amount_total} kr`,
          text: `New Order Received!

Order ID: ${order.id}
Order Date: ${new Date(order.created_at || Date.now()).toLocaleString('no-NO', { timeZone: 'Europe/Oslo' })}
Customer Email: ${order.email}
Total Amount: ${order.amount_total} kr
Status: ${order.status}

Items:
${orderItemsList}
${shippingInfo}
View order in admin panel: ${siteUrl}/admin`,
        })
      } catch (emailError) {
        console.error('Error sending order notification email:', emailError)
        // Don't fail the webhook if email fails
      }
    }
  }

  return NextResponse.json({ received: true })
}

