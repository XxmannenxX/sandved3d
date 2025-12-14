"use client"

import { useCartStore } from '@/store/cart'
import Link from 'next/link'
import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle } from 'lucide-react'

export const runtime = 'edge'

function SuccessContent() {
  const clearCart = useCartStore((state) => state.clearCart)
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')
  const orderNo = orderId ? orderId.slice(0, 8) : null

  useEffect(() => {
    if (orderId) {
      clearCart()
    }
  }, [orderId, clearCart])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
      <div className="flex justify-center mb-6 sm:mb-8">
        <div className="h-20 w-20 sm:h-24 sm:w-24 bg-green-500/10 rounded-full flex items-center justify-center">
          <CheckCircle suppressHydrationWarning className="h-10 w-10 sm:h-12 sm:w-12 text-green-500" />
        </div>
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Bestilling mottatt!</h1>
      <div className="max-w-2xl mx-auto text-left">
        <p className="text-muted-foreground mb-6 text-base sm:text-lg text-center">
          Takk! Vi sender deg en e-postbekreftelse og oppdateringer på bestillingen din.
        </p>

        <div className="border-2 border-green-500/40 bg-green-500/10 rounded-2xl p-5 sm:p-6 mb-5">
          <p className="font-extrabold text-foreground mb-2">VIKTIG – BETALING (VIPPS)</p>
          <p className="text-foreground">
            Vipps til <span className="font-bold">Andreas Lundevik (94067616)</span>
          </p>
          {orderNo && (
            <p className="text-muted-foreground mt-2">
              Melding: <span className="font-semibold text-foreground">Bestilling #{orderNo}</span>
            </p>
          )}
        </div>

        <p className="text-sm text-muted-foreground text-center mb-10 sm:mb-12">
          Hvis du heller vil betale ved levering, går det fint – men bestillingen din kan bli behandlet litt senere enn de som er betalt med Vipps.
        </p>
      </div>
      <Link href="/" className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
        Tilbake til hjem
      </Link>
    </div>
  )
}

export default function SuccessPage() {
  return (
      <Suspense fallback={<div>Laster...</div>}>
      <SuccessContent />
    </Suspense>
  )
}
