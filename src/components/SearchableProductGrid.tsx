"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, SlidersHorizontal, X, Tag } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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

  useEffect(() => {
    const urlCategory = searchParams?.get('category')?.trim()
    if (!urlCategory) return
    setSelectedCategories((prev) => {
      if (prev.has(urlCategory)) return prev
      return new Set([...Array.from(prev), urlCategory])
    })
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
  }, [selectedCategories, pathname, router, searchParams])

  const visibleCategories = useMemo(() => {
    const q = categoryQuery.trim().toLowerCase()
    if (!q) return categories
    return categories.filter((c) => c.label.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q))
  }, [categories, categoryQuery])

  const selectedCount = selectedCategories.size

  const getCustomizationLabel = (product: Product) => {
    if (!product.is_customizable) return null;
    const config = product.customization_config as any || {};
    if (config.allow_text && config.allow_image) return "Tekst & Bilde";
    if (config.allow_text) return "Tekst";
    if (config.allow_image) return "Bilde";
    return "Tilpassbar";
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        {/* Search and Filter Bar */}
        <div className="flex gap-3">
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-muted-foreground focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-white/10 transition-all outline-none"
              placeholder="Søk i produkter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 font-medium transition-all ${
              selectedCount > 0 
                ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' 
                : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
            }`}
          >
            <SlidersHorizontal className="h-5 w-5" />
            <span className="hidden sm:inline">Filter</span>
            {selectedCount > 0 && (
              <span className="flex items-center justify-center bg-white text-blue-600 text-xs font-bold rounded-full h-5 w-5">
                {selectedCount}
              </span>
            )}
          </button>
        </div>

        {/* Horizontal Category Scroll */}
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
             <button
                type="button"
                onClick={() => setSingleCategory(null)}
                className={`flex-none inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCount === 0
                    ? 'bg-white text-black border-white'
                    : 'bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                Alle
              </button>
              {categories.map((c) => {
                const active = selectedCategories.has(c.slug)
                return (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => setSingleCategory(c.slug)}
                    className={`flex-none inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-white text-black border-white'
                        : 'bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {c.label}
                  </button>
                )
              })}
          </div>
        )}
      </div>

      {/* Filter Modal */}
      <AnimatePresence>
        {isFilterOpen && (
          <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsFilterOpen(false)}
            />
            
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute inset-x-0 bottom-0 sm:inset-y-0 sm:right-0 sm:left-auto sm:w-[400px] bg-[#18181b] sm:border-l border-white/10 shadow-2xl flex flex-col h-[85vh] sm:h-full rounded-t-3xl sm:rounded-none"
            >
               <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Filter</h3>
                  <p className="text-sm text-muted-foreground">Velg kategorier</p>
                </div>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="p-5 space-y-4 flex-1 overflow-y-auto">
                {categories.map((c) => {
                  const checked = selectedCategories.has(c.slug)
                  return (
                    <label 
                      key={c.slug}
                      className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                        checked 
                          ? 'bg-blue-600/10 border-blue-600/50' 
                          : 'bg-white/5 border-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          checked ? 'bg-blue-600 border-blue-600' : 'border-white/30'
                        }`}>
                          {checked && <div className="w-2.5 h-2.5 rounded-[1px] bg-white" />}
                        </div>
                        <span className={`font-medium ${checked ? 'text-white' : 'text-muted-foreground'}`}>
                          {c.label}
                        </span>
                      </div>
                      <span className="text-xs font-mono bg-white/10 text-muted-foreground px-2 py-1 rounded">
                        {c.count}
                      </span>
                      <input 
                        type="checkbox" 
                        className="hidden"
                        checked={checked}
                        onChange={() => toggleCategory(c.slug)}
                      />
                    </label>
                  )
                })}
              </div>

              <div className="p-5 border-t border-white/10 bg-[#18181b]">
                <div className="flex gap-3">
                  <button
                    onClick={clearCategories}
                    className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 transition-colors"
                  >
                    Nullstill
                  </button>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="flex-[2] py-3 px-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors"
                  >
                    Vis {filteredProducts.length} produkter
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => {
          const label = getCustomizationLabel(product);
          const href = nestedBasePath ? `${nestedBasePath}/${product.id}` : `/products/item/${product.id}`
          
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              key={product.id}
            >
              <Link href={href} className="group block h-full">
                <div className="h-full bg-[#121215] rounded-2xl border border-white/5 overflow-hidden hover:border-blue-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/10 flex flex-col">
                  {/* Image Container */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-white/5">
                    <img
                      src={product.images?.[0] || 'https://placehold.co/600x400/18181b/fafafa?text=No+Image'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    <div className="absolute top-3 left-3 flex gap-2">
                       {product.category_slug && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-white border border-white/10">
                          {labelFromSlug(product.category_slug)}
                        </span>
                      )}
                    </div>

                    {label && (
                      <div className="absolute bottom-3 right-3">
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-600/90 text-white backdrop-blur-md shadow-sm">
                          <Tag className="w-3 h-3" />
                          {label}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors mb-2">
                      {product.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                      {product.description}
                    </p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                      <span className="text-lg font-bold text-white">
                        {product.base_price} kr
                      </span>
                      <span className="text-sm font-medium text-blue-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 flex items-center gap-1">
                        Se produkt <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-white">Ingen produkter funnet</h3>
          <p className="text-muted-foreground mt-1">Prøv å endre søkeord eller filtre.</p>
          <button 
            onClick={() => {
              setSearchQuery('')
              clearCategories()
            }}
            className="mt-4 text-blue-400 hover:text-blue-300 font-medium"
          >
            Nullstill alt
          </button>
        </div>
      )}
    </div>
  )
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m9 18 6-6-6-6"/>
    </svg>
  )
}
