import { createClient } from '@/lib/supabase/server'
import SearchableProductGrid from '@/components/SearchableProductGrid'
import HeroSection from '@/components/HeroSection'

export const revalidate = 60 // Revalidate every minute

export default async function Home() {
  const supabase = await createClient()
  
  // Try to fetch with display_order if it exists, otherwise fall back to created_at
  // Since we can't conditionally select in the query builder easily without risking error,
  // we'll just try to select * and order by created_at for now, 
  // and let the user run the migration.
  // If the column exists, we can update this query later.
  // For now, stick to created_at to avoid breakage until migration is run.
  
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen">
      <HeroSection />

      {/* Products Section */}
      <section id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20 sm:pt-8">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Alle produkter</h2>
            <p className="text-muted-foreground mt-2">Søk og filtrer etter kategori.</p>
          </div>
        </div>
        <SearchableProductGrid products={products || []} />
      </section>
    </div>
  )
}
