import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SearchableProductGrid from '@/components/SearchableProductGrid'

export const revalidate = 60

const labelFromSlug = (slug: string) =>
  slug
    .split('-')
    .map((p) => (p ? p[0].toUpperCase() + p.slice(1) : p))
    .join(' ')

export default async function TypePage({
  params,
}: {
  params: Promise<{ category: string; type: string }>
}) {
  const { category, type } = await params
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('is_archived', false)
    .eq('category_slug', category)
    .eq('type_slug', type)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (!products || products.length === 0) {
    notFound()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/products" className="hover:text-foreground transition-colors">
              Kategorier
            </Link>
            <span className="mx-2">/</span>
            <Link href={`/products/${category}`} className="hover:text-foreground transition-colors">
              {labelFromSlug(category)}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-foreground font-medium">{labelFromSlug(type)}</span>
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-2">
            {labelFromSlug(type)}
          </h1>
          <p className="text-muted-foreground mt-2">
            {products.length} produkt(er) i {labelFromSlug(category)} / {labelFromSlug(type)}.
          </p>
        </div>
        <Link href={`/products/${category}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Tilbake
        </Link>
      </div>

      <SearchableProductGrid products={products} nestedBasePath={`/products/${category}/${type}`} />
    </div>
  )
}


