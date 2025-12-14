"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Database } from '@/types/supabase'

type Product = Database['public']['Tables']['products']['Row']

type CategoryInfo = {
  slug: string
  label: string
  count: number
}

const labelFromSlug = (slug: string) =>
  slug
    .split('-')
    .map((p) => (p ? p[0].toUpperCase() + p.slice(1) : p))
    .join(' ')

export default function SearchableProductGrid({
  products,
  nestedBasePath,
}: {
  products: Product[]
  nestedBasePath?: string
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [categoryQuery, setCategoryQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const categories: CategoryInfo[] = useMemo(() => {
    const map = new Map<string, CategoryInfo>()
    for (const p of products || []) {
      const slug = p.category_slug
      if (!slug) continue
      const existing = map.get(slug)
      if (existing) {
        existing.count += 1
      } else {
        map.set(slug, { slug, label: labelFromSlug(slug), count: 1 })
      }
    }
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label))
  }, [products])

  // Sync selected category with URL (?category=slug). We keep it single-select in the URL for shareability,
  // but internally we allow multi-select (we store multi only in state for now).
  useEffect(() => {
    const urlCategory = searchParams?.get('category')?.trim()
    if (!urlCategory) return
    setSelectedCategories((prev) => {
      if (prev.has(urlCategory)) return prev
      return new Set([...Array.from(prev), urlCategory])
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const selected = selectedCategories

    return (products || []).filter((product) => {
      if (selected.size > 0) {
        const c = product.category_slug || ''
        if (!c || !selected.has(c)) return false
      }

      if (!q) return true

      const name = product.name?.toLowerCase() || ''
      const desc = product.description?.toLowerCase() || ''
      const categorySlug = product.category_slug?.toLowerCase() || ''
      const categoryLabel = product.category_slug ? labelFromSlug(product.category_slug).toLowerCase() : ''

      return name.includes(q) || desc.includes(q) || categorySlug.includes(q) || categoryLabel.includes(q)
    })
  }, [products, searchQuery, selectedCategories])

  const gridVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0 },
  }

  const baseTransition = { duration: 0.45, ease: [0.4, 0, 0.2, 1] as const }

  const getCustomizationLabel = (product: Product) => {
    if (!product.is_customizable) return null;
    const config = product.customization_config as any || {};
    if (config.allow_text && config.allow_image) return "Custom text & image";
    if (config.allow_text) return "Custom text";
    if (config.allow_image) return "Custom image";
    return "Tilpassbar";
  };

  const selectedCount = selectedCategories.size

  const setSingleCategory = (slug: string | null) => {
    if (!slug) {
      setSelectedCategories(new Set())
      return
    }
    setSelectedCategories(new Set([slug]))
  }

  const toggleCategory = (slug: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  const clearCategories = () => {
    setSelectedCategories(new Set())
  }

  // Keep URL stable and simple: if exactly one category selected, reflect it in the URL.
  // Otherwise, remove the param.
  useEffect(() => {
    const params = new URLSearchParams(searchParams?.toString())
    const desired = selectedCategories.size === 1 ? Array.from(selectedCategories)[0] : null
    const current = params.get('category')

    if (desired) params.set('category', desired)
    else params.delete('category')

    const nextQs = params.toString()
    const nextUrl = nextQs ? `${pathname}?${nextQs}` : pathname
    const currentQs = searchParams?.toString() || ''
    const currentUrl = currentQs ? `${pathname}?${currentQs}` : pathname

    if (nextUrl !== currentUrl) {
      router.replace(nextUrl, { scroll: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategories, pathname, router, searchParams])

  const visibleCategories = useMemo(() => {
    const q = categoryQuery.trim().toLowerCase()
    if (!q) return categories
    return categories.filter((c) => c.label.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q))
  }, [categories, categoryQuery])

  return (
    <div className="space-y-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={baseTransition}
        className="max-w-3xl mx-auto w-full"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search suppressHydrationWarning className="h-5 w-5 text-muted-foreground" />
            </div>
            <input
              type="text"
              className="block w-full pl-12 pr-4 py-2.5 sm:py-3 bg-card/60 backdrop-blur border border-border rounded-xl text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm hover:shadow-md"
              placeholder="Søk produkter eller kategorier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card/60 backdrop-blur px-4 py-2.5 sm:py-3 text-sm sm:text-base text-foreground hover:bg-muted/30 transition-colors shadow-sm"
            aria-haspopup="dialog"
            aria-expanded={isFilterOpen}
          >
            <SlidersHorizontal suppressHydrationWarning className="h-5 w-5 text-muted-foreground" />
            <span>Filter</span>
            {selectedCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold h-5 min-w-5 px-1.5">
                {selectedCount}
              </span>
            )}
          </button>
        </div>

        {/* One-line category preview (mobile-first) */}
        {categories.length > 0 && (
          <div className="mt-3 -mx-1 px-1">
            <div className="flex gap-2 overflow-x-auto whitespace-nowrap pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => setSingleCategory(null)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedCount === 0
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-card/40 text-foreground border-border hover:bg-muted/20'
                }`}
              >
                Alle
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                  selectedCount === 0 ? 'border-white/20 bg-white/10' : 'border-border/60 bg-muted/20 text-muted-foreground'
                }`}>
                  {products?.length ?? 0}
                </span>
              </button>

              {categories.map((c) => {
                const active = selectedCategories.has(c.slug)
                return (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => setSingleCategory(c.slug)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-card/40 text-foreground border-border hover:bg-muted/20'
                    }`}
                    title={c.slug}
                  >
                    <span className="truncate max-w-[160px]">{c.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                      active ? 'border-white/20 bg-white/10' : 'border-border/60 bg-muted/20 text-muted-foreground'
                    }`}>
                      {c.count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {selectedCount > 0 && (
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {Array.from(selectedCategories).slice(0, 8).map((slug) => (
                <button
                  key={slug}
                  type="button"
                  onClick={() => toggleCategory(slug)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/20 px-3 py-1 text-xs text-foreground hover:bg-muted/30 transition-colors"
                  title="Fjern kategori"
                >
                  <span className="truncate max-w-[180px]">{labelFromSlug(slug)}</span>
                  <X suppressHydrationWarning className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              ))}
              {selectedCount > 8 && (
                <span className="text-xs text-muted-foreground px-2 py-1">+{selectedCount - 8}</span>
              )}
            </div>
            <button
              type="button"
              onClick={clearCategories}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
            >
              Fjern alle
            </button>
          </div>
        )}
      </motion.div>

      {/* Filter Drawer */}
      {isFilterOpen && (
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label="Kategori-filter"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsFilterOpen(false)}
            aria-label="Lukk"
          />

          <div className="absolute inset-x-0 bottom-0 sm:inset-y-0 sm:right-0 sm:left-auto w-full sm:w-[420px] bg-background border-t sm:border-t-0 sm:border-l border-border rounded-t-2xl sm:rounded-none shadow-2xl">
            <div className="p-4 border-b border-border flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-foreground">Kategorier</h3>
                <p className="text-xs text-muted-foreground">Velg én eller flere kategorier.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsFilterOpen(false)}
                className="p-2 rounded-lg hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Lukk"
              >
                <X suppressHydrationWarning className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search suppressHydrationWarning className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="text"
                  value={categoryQuery}
                  onChange={(e) => setCategoryQuery(e.target.value)}
                  placeholder="Søk kategorier..."
                  className="block w-full pl-10 pr-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{categories.length} kategori(er)</span>
                {selectedCount > 0 ? (
                  <button
                    type="button"
                    onClick={clearCategories}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Fjern alle
                  </button>
                ) : (
                  <span className="text-xs text-muted-foreground">Ingen valgt</span>
                )}
              </div>
            </div>

            <div className="px-4 pb-6 sm:pb-4 overflow-auto max-h-[55vh] sm:max-h-[calc(100vh-170px)]">
              {visibleCategories.length === 0 ? (
                <div className="text-sm text-muted-foreground py-6">Ingen kategorier matcher søket.</div>
              ) : (
                <ul className="space-y-2">
                  {visibleCategories.map((c) => {
                    const checked = selectedCategories.has(c.slug)
                    return (
                      <li key={c.slug}>
                        <button
                          type="button"
                          onClick={() => toggleCategory(c.slug)}
                          className="w-full flex items-center justify-between gap-3 rounded-xl border border-border bg-card/40 hover:bg-muted/20 transition-colors px-3 py-2"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={`h-4 w-4 rounded border flex items-center justify-center ${
                                checked ? 'bg-blue-600 border-blue-600' : 'border-border bg-background'
                              }`}
                              aria-hidden="true"
                            >
                              {checked && <span className="h-2 w-2 rounded-sm bg-white" />}
                            </span>
                            <div className="min-w-0 text-left">
                              <div className="text-sm font-medium text-foreground truncate">{c.label}</div>
                              <div className="text-xs text-muted-foreground truncate">{c.slug}</div>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">{c.count}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            <div className="p-4 border-t border-border flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                Viser <span className="text-foreground font-medium">{filteredProducts.length}</span> produkt(er)
              </span>
              <button
                type="button"
                onClick={() => setIsFilterOpen(false)}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-bold hover:bg-blue-700 transition-colors"
              >
                Ferdig
              </button>
            </div>
          </div>
        </div>
      )}

      <motion.div
        variants={gridVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
      >
        {filteredProducts.map((product) => {
          const label = getCustomizationLabel(product);
          const href =
            nestedBasePath ? `${nestedBasePath}/${product.id}` : `/products/item/${product.id}`
          const categoryLabel = product.category_slug ? labelFromSlug(product.category_slug) : null
          return (
            <motion.div
              key={product.id}
              variants={cardVariants}
              transition={baseTransition}
            >
              <Link href={href} className="group block h-full">
                <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border overflow-hidden hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 flex flex-col h-full">
                  <div className="bg-muted/50 relative w-full overflow-hidden">
                    <img
                      src={product.images?.[0] || 'https://placehold.co/600x400/18181b/fafafa?text=No+Image'}
                      alt={product.name}
                      loading="lazy"
                      className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                      style={{ maxHeight: '400px' }}
                    />
                    {categoryLabel && (
                      <div className="absolute top-2 left-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-200 border border-emerald-500/25 backdrop-blur-md">
                          {categoryLabel}
                        </span>
                      </div>
                    )}
                    {label && (
                      <div className="absolute top-2 right-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-500/20 text-sky-200 border border-sky-500/25 backdrop-blur-md">
                          {label}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-grow">
                    <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-blue-400 transition-colors">{product.name}</h3>
                    <p className="text-muted-foreground text-sm line-clamp-2 mb-4 flex-grow">{product.description}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <span className="text-xl font-bold text-foreground">{product.base_price} kr</span>
                      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Se</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
