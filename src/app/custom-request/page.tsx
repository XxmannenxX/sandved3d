"use client"

import { useState } from 'react'
import { Loader2, Send, Wand2 } from 'lucide-react'

export default function CustomRequestPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Failed to send message')
      
      setSuccess(true)
    } catch (error) {
      alert('Feil ved sending av melding. Vennligst prøv igjen.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
    <div className="max-w-3xl mx-auto px-4 py-16 sm:py-20 text-center">
        <div className="bg-green-500/10 border border-green-500/20 p-8 rounded-xl backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
          <h2 className="text-2xl font-bold text-green-400 mb-4">Forespørsel sendt!</h2>
          <p className="text-green-200/80">
            Takk for din interesse. Jeg kommer tilbake til deg via e-post snart.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">
      <div className="text-center mb-10 sm:mb-12">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 mb-4">
          <Wand2 suppressHydrationWarning className="h-6 w-6" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">Custom Request</h1>
        <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
          Har du en spesifikk 3D-print idé? Beskriv den nedenfor så kommer jeg tilbake til deg med et tilbud.
        </p>
      </div>

      <div className="bg-card/50 backdrop-blur-sm border border-border p-6 sm:p-8 rounded-2xl shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                Navn
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                className="block w-full rounded-lg border border-input bg-background/50 px-4 py-3 text-foreground shadow-sm placeholder:text-muted-foreground focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="Ditt navn"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                E-post
              </label>
              <input
                type="email"
                name="email"
                id="email"
                required
                className="block w-full rounded-lg border border-input bg-background/50 px-4 py-3 text-foreground shadow-sm placeholder:text-muted-foreground focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="deg@eksempel.no"
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
              Beskrivelse
            </label>
            <textarea
              name="description"
              id="description"
              rows={6}
              required
              placeholder="Beskriv hva du vil ha trykt. Dimensjoner, farger, lenke til 3D-modell hvis tilgjengelig..."
              className="block w-full rounded-lg border border-input bg-background/50 px-4 py-3 text-foreground shadow-sm placeholder:text-muted-foreground focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-3.5 sm:py-4 px-4 border border-transparent rounded-lg shadow-lg shadow-blue-500/20 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-blue-500 disabled:opacity-50 transition-all hover:-translate-y-0.5"
          >
            {loading ? <Loader2 suppressHydrationWarning className="animate-spin h-5 w-5" /> : (
              <span className="flex items-center">
                Send forespørsel <Send suppressHydrationWarning className="ml-2 h-5 w-5" />
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
