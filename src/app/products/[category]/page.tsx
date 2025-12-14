import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 60

type TypeInfo = {
  slug: string
  label: string
  count: number
  image?: string | null
}

const labelFromSlug = (slug: string) =>
  slug
    .split('-')
    .map((p) => (p ? p[0].toUpperCase() + p.slice(1) : p))
    .join(' ')

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('products')
    .select('type_slug, images')
    .eq('is_archived', false)
    .eq('category_slug', category)

  if (!products || products.length === 0) {
    notFound()
  }

  const map = new Map<string, TypeInfo>()
  for (const p of products) {
    const slug = p.type_slug
    if (!slug) continue
    const existing = map.get(slug)
    if (existing) {
      existing.count += 1
      if (!existing.image && p.images?.[0]) existing.image = p.images[0]
    } else {
      map.set(slug, {
        slug,
        label: labelFromSlug(slug),
        count: 1,
        image: p.images?.[0] || null,
      })
    }
  }

  const types = Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label))

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/products" className="hover:text-foreground transition-colors">
              Kategorier
            </Link>
            <span className="mx-2">/</span>
            <span className="text-foreground font-medium">{labelFromSlug(category)}</span>
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mt-2">
            {labelFromSlug(category)}
          </h1>
          <p className="text-muted-foreground mt-2">Velg en type.</p>
        </div>
        <Link href="/products" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Tilbake
        </Link>
      </div>

      {types.length === 0 ? (
        <div className="bg-card/50 border border-border rounded-2xl p-6 text-muted-foreground">
          Ingen typer ennå. Legg til <span className="font-medium text-foreground">type_slug</span> på produkter i admin.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {types.map((t) => (
            <Link key={t.slug} href={`/products/${category}/${t.slug}`} className="group block">
              <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border overflow-hidden hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
                <div className="bg-muted/50 relative w-full overflow-hidden">
                  <img
                    src={t.image || 'https://placehold.co/600x300/18181b/fafafa?text=Type'}
                    alt={t.label}
                    loading="lazy"
                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                    style={{ maxHeight: '280px' }}
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-bold text-foreground group-hover:text-blue-400 transition-colors">
                    {t.label}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">{t.count} produkt(er)</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}


