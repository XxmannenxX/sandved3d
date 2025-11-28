import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { CartItem } from '@/store/cart'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia' as any, 
  typescript: true,
})

export async function POST(request: Request) {
  try {
    const { items } = await request.json() as { items: CartItem[] }
    
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Empty cart' }, { status: 400 })
    }

    const lineItems = items.map((item) => {
       let description = item.product.description || ''
       if (item.customization) {
         if (item.customization.text) description += ` | Text: ${item.customization.text}`
         if (item.customization.image_path) description += ` | Image: Included`
       }

       return {
        price_data: {
          currency: 'nok',
          product_data: {
            name: item.product.name,
            description: description.substring(0, 1000),
            images: item.product.images || [],
            metadata: {
                product_id: item.product.id,
                customization: JSON.stringify(item.customization || {})
            }
          },
          unit_amount: Math.round(item.product.base_price * 100),
        },
        quantity: item.quantity,
      }
    })

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${request.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin')}/cart`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Error creating checkout session:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

