import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 60

type CategoryInfo = {
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

export default async function CategoryFolderGrid() {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from('products')
    .select('category_slug, images')
    .eq('is_archived', false)

  const map = new Map<string, CategoryInfo>()
  for (const p of products || []) {
    const slug = p.category_slug
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

  const categories = Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label))

  if (categories.length === 0) {
    return (
      <div className="bg-card/50 border border-border rounded-2xl p-6 text-muted-foreground">
        Ingen kategorier ennå. Legg til <span className="font-medium text-foreground">category_slug</span> på produkter i
        admin.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
      {categories.map((c) => (
        <Link key={c.slug} href={`/products/${c.slug}`} className="group block h-full">
          <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border overflow-hidden hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 flex flex-col h-full">
            <div className="bg-muted/50 relative w-full overflow-hidden">
              <img
                src={c.image || 'https://placehold.co/600x400/18181b/fafafa?text=Folder'}
                alt={c.label}
                loading="lazy"
                className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                style={{ maxHeight: '400px' }}
              />
              <div className="absolute top-2 left-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-200 border border-emerald-500/25 backdrop-blur-md">
                  Mappe
                </span>
              </div>
            </div>
            <div className="p-5 flex flex-col flex-grow">
              <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-blue-400 transition-colors">
                {c.label}
              </h3>
              <p className="text-muted-foreground text-sm mb-4 flex-grow">{c.count} produkt(er)</p>
              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  Åpne mappe
                </span>
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Se</span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}


