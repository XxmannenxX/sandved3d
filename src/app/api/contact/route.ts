import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { name, email, description } = await request.json()

    // Fetch email from Supabase settings
    const supabase = await createClient()
    const { data: settings } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'custom_request_email')
      .single()

    const recipientEmail = settings?.value || 'markus.lundevik@gmail.com'

    const { data, error } = await resend.emails.send({
      from: 'Andreas 3D <onboarding@resend.dev>',
      to: [recipientEmail], 
      subject: `New Custom Request from ${name}`,
      text: `
        Name: ${name}
        Email: ${email}
        
        Description:
        ${description}
      `,
      replyTo: email,
    })

    if (error) {
        console.error(error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}




