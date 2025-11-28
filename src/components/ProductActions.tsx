"use client"

import { useState } from 'react'
import { useCartStore } from '@/store/cart'
import { Database } from '@/types/supabase'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Product = Database['public']['Tables']['products']['Row']

export default function ProductActions({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem)
  const [loading, setLoading] = useState(false)
  const [customText, setCustomText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  
  const config = product.customization_config as any || {}
  const allowText = product.is_customizable && config.allow_text
  const allowImage = product.is_customizable && config.allow_image

  const handleAddToCart = async () => {
    setLoading(true)
    try {
      let imageUrl = null
      
      if (allowImage && file) {
        // Upload file
        const supabase = createClient()
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${fileName}`
        
        const { error: uploadError, data } = await supabase.storage
          .from('customer-uploads')
          .upload(filePath, file)

        if (uploadError) throw uploadError
        
        imageUrl = data.path
      }

      const customization = product.is_customizable ? {
        text: allowText ? customText : undefined,
        image_path: imageUrl
      } : undefined

      addItem(product, 1, customization)
      // alert('Added to cart!') // Removed per user request
      setCustomText('')
      setFile(null)
    } catch (error: any) {
      console.error(error)
      alert('Feil ved å legge til i handlekurv: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {product.is_customizable && (
        <div className="bg-muted/50 border border-border p-4 rounded-xl space-y-4">
          <h3 className="font-bold text-foreground">Tilpasning</h3>
          
          {allowText && (
            <div>
              <label htmlFor="custom-text" className="block text-sm font-medium text-muted-foreground mb-1">
                Tilpasset tekst
              </label>
              <div>
                <input
                  type="text"
                  id="custom-text"
                  className="block w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground shadow-sm placeholder:text-muted-foreground focus:border-blue-500 focus:ring-1 focus:ring-blue-500 sm:text-sm transition-colors"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Skriv inn din tekst her"
                />
              </div>
            </div>
          )}

          {allowImage && (
            <div>
              <label htmlFor="custom-image" className="block text-sm font-medium text-muted-foreground mb-1">
                Last opp bilde
              </label>
              <div>
                <input
                  type="file"
                  id="custom-image"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500/10 file:text-blue-400 hover:file:bg-blue-500/20 transition-colors"
                />
              </div>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={handleAddToCart}
        disabled={loading}
        className="w-full bg-blue-600 border border-transparent rounded-lg py-4 px-8 flex items-center justify-center text-base font-bold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-900/20"
      >
        {loading && <Loader2 suppressHydrationWarning className="animate-spin mr-2 h-5 w-5" />}
        Legg i handlekurv
      </button>
    </div>
  )
}
