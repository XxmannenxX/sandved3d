"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Save, Mail } from 'lucide-react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export const runtime = 'edge'

export default function SettingsPage() {
  const [customRequestEmail, setCustomRequestEmail] = useState('')

  const [vippsRecipientName, setVippsRecipientName] = useState('Andreas Lundevik')
  const [vippsNumber, setVippsNumber] = useState('94067616')
  const [orderConfirmationSubject, setOrderConfirmationSubject] = useState('Bestilling mottatt #{{orderNo}}')
  const [orderConfirmationDeliveryNote, setOrderConfirmationDeliveryNote] = useState(
    'Hvis du heller vil betale ved levering, går det fint – men bestillingen din kan bli behandlet litt senere enn de som er betalt med Vipps.'
  )
  const [orderStatusUpdateSubject, setOrderStatusUpdateSubject] = useState('Oppdatering på bestilling #{{orderNo}}')
  const [orderStatusUpdateLine, setOrderStatusUpdateLine] = useState(
    'Statusen på bestillingen din er oppdatert til: {{status}}.'
  )

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('key,value')
        .in('key', [
          'custom_request_email',
          'vipps_recipient_name',
          'vipps_number',
          'email_order_confirmation_subject',
          'email_order_confirmation_delivery_note',
          'email_order_status_update_subject',
          'email_order_status_update_line',
        ])

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching settings:', error)
      }

      const map: Record<string, string> = {}
      for (const row of data || []) {
        if (row?.key && typeof row.value === 'string') map[row.key] = row.value
      }

      setCustomRequestEmail(map.custom_request_email || 'markus.lundevik@gmail.com')

      setVippsRecipientName(map.vipps_recipient_name || 'Andreas Lundevik')
      setVippsNumber(map.vipps_number || '94067616')
      setOrderConfirmationSubject(map.email_order_confirmation_subject || 'Bestilling mottatt #{{orderNo}}')
      setOrderConfirmationDeliveryNote(
        map.email_order_confirmation_delivery_note ||
          'Hvis du heller vil betale ved levering, går det fint – men bestillingen din kan bli behandlet litt senere enn de som er betalt med Vipps.'
      )
      setOrderStatusUpdateSubject(map.email_order_status_update_subject || 'Oppdatering på bestilling #{{orderNo}}')
      setOrderStatusUpdateLine(
        map.email_order_status_update_line || 'Statusen på bestillingen din er oppdatert til: {{status}}.'
      )
    } catch (error) {
      console.error('Error:', error)
      setCustomRequestEmail('markus.lundevik@gmail.com')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!customRequestEmail || !customRequestEmail.includes('@')) {
      alert('Vennligst oppgi en gyldig e-postadresse')
      return
    }
    if (!vippsRecipientName.trim()) {
      alert('Vennligst oppgi Vipps mottakernavn')
      return
    }
    if (!vippsNumber.trim()) {
      alert('Vennligst oppgi Vipps-nummer')
      return
    }

    setSaving(true)
    try {
      const payload = [
        { key: 'custom_request_email', value: customRequestEmail, updated_at: new Date().toISOString() },

        { key: 'vipps_recipient_name', value: vippsRecipientName, updated_at: new Date().toISOString() },
        { key: 'vipps_number', value: vippsNumber, updated_at: new Date().toISOString() },

        { key: 'email_order_confirmation_subject', value: orderConfirmationSubject, updated_at: new Date().toISOString() },
        {
          key: 'email_order_confirmation_delivery_note',
          value: orderConfirmationDeliveryNote,
          updated_at: new Date().toISOString(),
        },

        { key: 'email_order_status_update_subject', value: orderStatusUpdateSubject, updated_at: new Date().toISOString() },
        { key: 'email_order_status_update_line', value: orderStatusUpdateLine, updated_at: new Date().toISOString() },
      ]

      const { error: upsertError } = await supabase.from('settings').upsert(payload as any)
      if (upsertError) throw upsertError

      alert('Innstillinger lagret!')
    } catch (error: any) {
      console.error('Error saving settings:', error)
      alert('Feil ved lagring av innstillinger: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      <Link href="/admin" className="inline-flex items-center text-sm sm:text-base text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ChevronLeft suppressHydrationWarning className="w-4 h-4 mr-1" />
        Tilbake til admin
      </Link>

      <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-foreground mb-2">Innstillinger</h1>
        <p className="text-muted-foreground mb-8">Administrer systeminnstillinger</p>

        <div className="space-y-6">
          <div>
            <label htmlFor="custom-request-email" className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <Mail suppressHydrationWarning className="w-4 h-4" />
              E-post for Custom Request
            </label>
            <p className="text-xs text-muted-foreground mb-3">
              E-postadressen som skal motta Custom Request-forespørsler
            </p>
            <input
              type="email"
              id="custom-request-email"
              value={customRequestEmail}
              onChange={(e) => setCustomRequestEmail(e.target.value)}
              className="block w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground shadow-sm placeholder:text-muted-foreground focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="markus.lundevik@gmail.com"
            />
          </div>

          <div className="pt-4 border-t border-border">
            <h2 className="text-lg font-bold text-foreground mb-1">E-postmeldinger</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Du kan bruke plassholdere: <span className="font-mono">{'{{orderNo}}'}</span>,{' '}
              <span className="font-mono">{'{{amount}}'}</span>, <span className="font-mono">{'{{status}}'}</span>.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Vipps mottaker</label>
                <input
                  value={vippsRecipientName}
                  onChange={(e) => setVippsRecipientName(e.target.value)}
                  className="block w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="Andreas Lundevik"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Vipps nummer</label>
                <input
                  value={vippsNumber}
                  onChange={(e) => setVippsNumber(e.target.value)}
                  className="block w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="94067616"
                />
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Emne: ordrebekreftelse</label>
                <input
                  value={orderConfirmationSubject}
                  onChange={(e) => setOrderConfirmationSubject(e.target.value)}
                  className="block w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tekst: “betale ved levering”-notis (ordrebekreftelse)
                </label>
                <textarea
                  value={orderConfirmationDeliveryNote}
                  onChange={(e) => setOrderConfirmationDeliveryNote(e.target.value)}
                  rows={3}
                  className="block w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Emne: statusoppdatering</label>
                <input
                  value={orderStatusUpdateSubject}
                  onChange={(e) => setOrderStatusUpdateSubject(e.target.value)}
                  className="block w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Tekstlinje: statusoppdatering</label>
                <textarea
                  value={orderStatusUpdateLine}
                  onChange={(e) => setOrderStatusUpdateLine(e.target.value)}
                  rows={2}
                  className="block w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-border">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 suppressHydrationWarning className="animate-spin h-4 w-4 mr-2" />
                  Lagrer...
                </>
              ) : (
                <>
                  <Save suppressHydrationWarning className="h-4 w-4 mr-2" />
                  Lagre innstillinger
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}





