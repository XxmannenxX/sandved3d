"use client"

import { useCartStore } from '@/store/cart'
import Link from 'next/link'
import { Trash2, ShoppingBag, ArrowRight, CreditCard } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function CartPage() {
  const { items, removeItem } = useCartStore()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const total = items.reduce((acc, item) => acc + item.product.base_price * item.quantity, 0)

  const handleCheckout = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items }),
      })

      if (!response.ok) throw new Error('Checkout failed')

      const { url } = await response.json()
      
      if (url) {
        window.location.href = url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-8 flex items-center gap-3">
        <ShoppingBag suppressHydrationWarning className="h-8 w-8 text-blue-500" /> 
        Din handlekurv
      </h1>

      {items.length === 0 ? (
        <div className="text-center py-16 sm:py-20 bg-card/50 backdrop-blur-sm border border-border rounded-2xl shadow-sm">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted/50 mb-6 text-muted-foreground animate-in zoom-in-95 duration-500">
            <ShoppingBag suppressHydrationWarning className="h-10 w-10" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Handlekurven din er tom</h2>
          <p className="text-muted-foreground mb-8 text-base">Det ser ut til at du ikke har lagt til noe ennå.</p>
          <Link href="/" className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all hover:-translate-y-0.5 shadow-lg shadow-blue-500/20">
            Start å handle <ArrowRight suppressHydrationWarning className="ml-2 h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-8">
            <div className="bg-card/50 backdrop-blur-sm border border-border shadow-sm overflow-hidden rounded-2xl">
              <ul className="divide-y divide-border">
                {items.map((item, index) => (
                  <li key={index} className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-4 w-full">
                      <div className="flex-shrink-0 h-24 w-24 bg-muted/50 rounded-xl overflow-hidden border border-border/50">
                         <img 
                           src={item.product.images?.[0] || 'https://placehold.co/100/18181b/fafafa'} 
                           alt={item.product.name}
                           className="h-full w-full object-cover"
                         />
                      </div>
                      <div className="flex-grow space-y-3">
                        <div className="flex w-full items-start justify-between gap-2">
                          <div>
                            <h3 className="text-base sm:text-lg font-bold text-foreground mb-1">{item.product.name}</h3>
                            <p className="text-blue-400 font-medium mb-2">{item.product.base_price} kr <span className="text-muted-foreground text-sm">x {item.quantity}</span></p>
                          </div>
                          <button
                            onClick={() => removeItem(item.product.id)}
                            className="text-muted-foreground hover:text-red-500 transition-colors p-2 hover:bg-red-500/10 rounded-full sm:hidden"
                          >
                            <Trash2 suppressHydrationWarning className="h-5 w-5" />
                          </button>
                        </div>
                        
                        {item.customization && (
                          <div className="text-sm bg-muted/30 p-3 rounded-lg border border-border/50 space-y-2">
                            {item.customization.text && (
                              <div className="flex gap-2">
                                <span className="text-muted-foreground min-w-[60px]">Tekst:</span>
                                <span className="text-foreground font-medium">{item.customization.text}</span>
                              </div>
                            )}
                            {item.customization.image_path && (
                              <div className="flex gap-2">
                                <span className="text-muted-foreground min-w-[60px]">Bilde:</span>
                                <span className="text-blue-400 text-xs bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">Lastet opp</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="text-muted-foreground hover:text-red-500 transition-colors p-2 hover:bg-red-500/10 rounded-full hidden sm:block"
                      aria-label="Fjern vare"
                    >
                      <Trash2 suppressHydrationWarning className="h-5 w-5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="lg:col-span-4">
            <div className="bg-card/50 backdrop-blur-sm border border-border p-5 sm:p-6 rounded-2xl shadow-sm lg:sticky lg:top-24">
              <h2 className="text-lg font-bold text-foreground mb-6">Ordreoppsummering</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delsum</span>
                  <span className="text-foreground font-medium">{total.toFixed(2)} kr</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Frakt</span>
                  <span className="text-foreground font-medium">Beregnes ved kassen</span>
                </div>
                <div className="border-t border-border pt-4 flex justify-between items-center">
                  <span className="text-base font-bold text-foreground">Totalt</span>
                  <span className="text-2xl font-bold text-blue-400">{total.toFixed(2)} kr</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full bg-blue-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-all hover:-translate-y-0.5 shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
              >
                {loading ? (
                  'Behandler...'
                ) : (
                  <>
                    Gå til kassen <CreditCard suppressHydrationWarning className="w-4 h-4" />
                  </>
                )}
              </button>
              
              <p className="text-xs text-center text-muted-foreground mt-4">
                Sikker betaling via Stripe
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
