import { createClient } from '@/lib/supabase/server'
import SearchableProductGrid from '@/components/SearchableProductGrid'
import HeroSection from '@/components/HeroSection'

export const runtime = 'edge'
export const revalidate = 60

export default async function Home() {
  const supabase = await createClient()
  
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('is_archived', false)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen">
      <HeroSection />

      {/* Featured Categories / Stats or Benefits could go here */}

      {/* Products Section */}
      <section id="products" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white">Våre Produkter</h2>
          </div>
        </div>
        
        <SearchableProductGrid products={products || []} />
      </section>
    </div>
  )
}
