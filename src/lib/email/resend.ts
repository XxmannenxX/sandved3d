import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'

type SettingsMap = Record<string, string>

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('Missing RESEND_API_KEY')
  return new Resend(apiKey)
}

function getFromAddress() {
  const from = process.env.RESEND_FROM
  if (!from) {
    throw new Error('Missing RESEND_FROM (e.g. "Andreas 3D <no-reply@yourdomain.com>")')
  }
  return from
}

function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return ''
}

function escapeHtml(input: string) {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    pending: 'Venter',
    processing: 'Behandles',
    shipped: 'Sendt',
    completed: 'Fullført',
    cancelled: 'Avbrutt',
  }
  return map[status] || status
}

async function getSettings(keys: string[]): Promise<SettingsMap> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('settings').select('key,value').in('key', keys)
  if (error) {
    console.error('Failed to load settings for email templates:', error)
    return {}
  }
  const map: SettingsMap = {}
  for (const row of data || []) {
    if (row?.key && typeof row.value === 'string') map[row.key] = row.value
  }
  return map
}

function renderTemplate(template: string, vars: Record<string, string>) {
  let out = template
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{{${k}}}`, v)
  }
  return out
}

export async function sendCustomerOrderConfirmationEmail(orderId: string) {
  const supabase = createAdminClient()

  const { data: order } = await supabase
    .from('orders')
    .select(
      `
        id,
        created_at,
        email,
        customer_name,
        customer_phone,
        amount_total,
        status,
        order_items (
          quantity,
          customization_data,
          products (name, base_price)
        )
      `
    )
    .eq('id', orderId)
    .single()

  if (!order?.email) return

  const orderNo = String(order.id).slice(0, 8)
  const siteUrl = getSiteUrl()
  const from = getFromAddress()
  const resend = getResendClient()
  const vippsAmount = Number(order.amount_total ?? 0).toFixed(2)

  const settings = await getSettings([
    'vipps_recipient_name',
    'vipps_number',
    'email_order_confirmation_subject',
    'email_order_confirmation_delivery_note',
  ])

  const vippsRecipientName = settings.vipps_recipient_name || 'Andreas Lundevik'
  const vippsNumber = settings.vipps_number || '94067616'

  const vars = {
    orderNo,
    amount: vippsAmount,
    status: statusLabel(order.status || 'pending'),
    vippsRecipientName,
    vippsNumber,
  }

  const itemsText =
    (order as any).order_items
      ?.map((item: any) => {
        const p = item.products
        const customization = item.customization_data || {}
        const parts = [`- ${p?.name || 'Produkt'} (x${item.quantity || 0})`]
        if (customization?.text) parts.push(`  Tekst: "${customization.text}"`)
        if (customization?.image_path) parts.push(`  Bilde: lastet opp`)
        return parts.join('\n')
      })
      .join('\n') || '- (ingen varer)'

  const subject = renderTemplate(settings.email_order_confirmation_subject || 'Bestilling mottatt #{{orderNo}}', vars)
  const deliveryNote =
    settings.email_order_confirmation_delivery_note ||
    'Hvis du heller vil betale ved levering, går det fint – men bestillingen din kan bli behandlet litt senere enn de som er betalt med Vipps.'

  const text = `Hei ${order.customer_name || ''}!

Vi har mottatt bestillingen din.

VIKTIG – BETALING (VIPPS):
Vipps ${vippsAmount} kr til ${vippsRecipientName} (${vippsNumber})
Melding: Bestilling #${orderNo}

${deliveryNote}

Ordre: #${orderNo}
Status: ${statusLabel(order.status || 'pending')}
Sum: ${order.amount_total ?? 0} kr
Telefon: ${order.customer_phone || ''}

Varer:
${itemsText}

${siteUrl ? `Du kan kontakte oss via nettsiden: ${siteUrl}\n` : ''}`.trim()

  const htmlItems =
    (order as any).order_items?.length
      ? (order as any).order_items
          .map((item: any) => {
            const p = item.products
            const customization = item.customization_data || {}
            const rows: string[] = []
            rows.push(`<li><strong>${escapeHtml(p?.name || 'Produkt')}</strong> (x${Number(item.quantity || 0)})</li>`)
            if (customization?.text) rows.push(`<div>Tekst: “${escapeHtml(String(customization.text))}”</div>`)
            if (customization?.image_path) rows.push(`<div>Bilde: lastet opp</div>`)
            return `<div style="margin: 8px 0;">${rows.join('')}</div>`
          })
          .join('')
      : '<li>(ingen varer)</li>'

  const html = `
  <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;">
    <h2 style="margin:0 0 12px;">Bestilling mottatt</h2>
    <p style="margin:0 0 12px;">Hei ${escapeHtml(order.customer_name || '')}!</p>
    <p style="margin:0 0 16px;">Vi har mottatt bestillingen din.</p>
    <div style="border:2px solid #22c55e; background:#052e16; color:#dcfce7; padding:12px 14px; border-radius:10px; margin:0 0 16px;">
      <div style="font-weight:800; letter-spacing:0.2px; margin-bottom:6px;">VIKTIG – BETALING (VIPPS)</div>
      <div style="font-size:16px;"><strong>Vipps ${escapeHtml(vippsAmount)} kr</strong> til <strong>${escapeHtml(vippsRecipientName)} (${escapeHtml(vippsNumber)})</strong></div>
      <div style="margin-top:6px;">Melding: <strong>Bestilling #${escapeHtml(orderNo)}</strong></div>
    </div>
    <div style="background:#0b1220; color:#e5e7eb; padding:12px 14px; border-radius:10px; margin:0 0 16px;">
      ${escapeHtml(deliveryNote)}
    </div>
    <div style="background:#0b1220; color:#e5e7eb; padding:12px 14px; border-radius:10px; margin:0 0 16px;">
      <div><strong>Ordre:</strong> #${escapeHtml(orderNo)}</div>
      <div><strong>Status:</strong> ${escapeHtml(statusLabel(order.status || 'pending'))}</div>
      <div><strong>Sum:</strong> ${Number(order.amount_total ?? 0).toFixed(2)} kr</div>
      ${order.customer_phone ? `<div><strong>Telefon:</strong> ${escapeHtml(String(order.customer_phone))}</div>` : ''}
    </div>
    <h3 style="margin:0 0 8px;">Varer</h3>
    <ul style="padding-left:18px; margin:0 0 16px;">
      ${htmlItems}
    </ul>
    ${siteUrl ? `<p style="margin:0;">Nettside: <a href="${escapeHtml(siteUrl)}">${escapeHtml(siteUrl)}</a></p>` : ''}
  </div>`.trim()

  await resend.emails.send(
    {
      from,
      to: [order.email],
      subject,
      text,
      html,
      headers: {
        'X-Order-Id': order.id,
      },
      tags: [
        { name: 'type', value: 'order_confirmation' },
        { name: 'order_id', value: order.id },
      ],
    },
    { idempotencyKey: `order-confirmation/${order.id}` }
  )
}

export async function sendCustomerOrderStatusUpdateEmail(orderId: string, newStatus: string) {
  const supabase = createAdminClient()

  const { data: order } = await supabase
    .from('orders')
    .select('id, email, customer_name, status')
    .eq('id', orderId)
    .single()

  if (!order?.email) return

  const orderNo = String(order.id).slice(0, 8)
  const from = getFromAddress()
  const resend = getResendClient()

  const settings = await getSettings(['email_order_status_update_subject', 'email_order_status_update_line'])
  const vars = { orderNo, status: statusLabel(newStatus) }

  const subject = renderTemplate(
    settings.email_order_status_update_subject || 'Oppdatering på bestilling #{{orderNo}}',
    vars
  )

  const statusLine = renderTemplate(
    settings.email_order_status_update_line || 'Statusen på bestillingen din er oppdatert til: {{status}}.',
    vars
  )

  const text = `Hei ${order.customer_name || ''}!

${statusLine}

Ordre: #${orderNo}`.trim()

  const html = `
  <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;">
    <p style="margin:0 0 12px;">Hei ${escapeHtml(order.customer_name || '')}!</p>
    <p style="margin:0 0 12px;">${escapeHtml(statusLine)}</p>
    <p style="margin:0;">Ordre: #${escapeHtml(orderNo)}</p>
  </div>`.trim()

  await resend.emails.send(
    {
      from,
      to: [order.email],
      subject,
      text,
      html,
      headers: {
        'X-Order-Id': order.id,
      },
      tags: [
        { name: 'type', value: 'order_status_update' },
        { name: 'order_id', value: order.id },
        { name: 'status', value: newStatus },
      ],
    },
    { idempotencyKey: `order-status/${order.id}/${newStatus}` }
  )
}



