import { createClient } from '@/lib/supabase/server'
import SearchableProductGrid from '@/components/SearchableProductGrid'

export const runtime = 'edge'

export const revalidate = 60

export default async function ProductsIndexPage() {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('is_archived', false)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Produkter</h1>
          <p className="text-muted-foreground mt-2">Søk og filtrer etter kategori.</p>
        </div>
      </div>

      <SearchableProductGrid products={(products as any) || []} />
    </div>
  )
}



