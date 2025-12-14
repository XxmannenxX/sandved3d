"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Save, Mail } from 'lucide-react'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function SettingsPage() {
  const [customRequestEmail, setCustomRequestEmail] = useState('')
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
        .select('value')
        .eq('key', 'custom_request_email')
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching settings:', error)
      }

      if (data) {
        setCustomRequestEmail(data.value || '')
      } else {
        // Set default if not found
        setCustomRequestEmail('markus.lundevik@gmail.com')
      }
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

    setSaving(true)
    try {
      // Try to update first
      const { error: updateError } = await supabase
        .from('settings')
        .upsert({
          key: 'custom_request_email',
          value: customRequestEmail,
          updated_at: new Date().toISOString()
        })

      if (updateError) {
        // If update fails, try insert
        const { error: insertError } = await supabase
          .from('settings')
          .insert({
            key: 'custom_request_email',
            value: customRequestEmail
          })

        if (insertError) {
          throw insertError
        }
      }

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




