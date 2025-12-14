import { createClient } from '@/lib/supabase/server'
import ProductActions from '@/components/ProductActions'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function ProductByIdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: product } = await supabase.from('products').select('*').eq('id', id).single()

  if (!product) {
    notFound()
  }

  const getCustomizationLabel = () => {
    if (!product.is_customizable) return null
    const config = (product.customization_config as any) || {}
    if (config.allow_text && config.allow_image) return 'Custom text & image'
    if (config.allow_text) return 'Custom text'
    if (config.allow_image) return 'Custom image'
    return 'Tilpassbar'
  }

  const label = getCustomizationLabel()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      <Link
        href="/products"
        className="inline-flex items-center text-sm sm:text-base text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ChevronLeft suppressHydrationWarning className="w-4 h-4 mr-1" />
        Tilbake til produkter
      </Link>

      <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-5 sm:p-8 shadow-sm">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12 lg:items-start">
          <div className="flex flex-col gap-4">
            <div className="aspect-w-1 aspect-h-1 w-full bg-muted/50 border border-border/50 rounded-2xl overflow-hidden relative group">
              <img
                src={product.images?.[0] || 'https://placehold.co/600x400/18181b/fafafa?text=No+Image'}
                alt={product.name}
                className="w-full h-full object-center object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          </div>

          <div className="mt-8 sm:mt-10 lg:mt-0 lg:px-4 space-y-6">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">{product.name}</h1>

            <div className="flex flex-wrap items-center gap-3">
              <h2 className="sr-only">Produktinformasjon</h2>
              <p className="text-2xl sm:text-3xl font-bold text-blue-400">{product.base_price} kr</p>
              {label && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-500/10 text-sky-300 border border-sky-500/25">
                  {label}
                </span>
              )}
            </div>

            <div className="prose prose-invert max-w-none">
              <h3 className="sr-only">Beskrivelse</h3>
              <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">{product.description}</p>
            </div>

            <div className="pt-6 border-t border-border/50">
              <ProductActions product={product} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


