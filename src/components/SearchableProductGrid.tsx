"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { motion } from 'framer-motion'
import { Database } from '@/types/supabase'

type Product = Database['public']['Tables']['products']['Row']

export default function SearchableProductGrid({ products }: { products: Product[] }) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

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

  return (
    <div className="space-y-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={baseTransition}
        className="max-w-2xl mx-auto w-full"
      >
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search suppressHydrationWarning className="h-5 w-5 text-muted-foreground" />
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-4 py-2.5 sm:py-3 bg-card/60 backdrop-blur border border-border rounded-xl text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm hover:shadow-md"
            placeholder="Søk produkter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </motion.div>

      <motion.div
        variants={gridVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
      >
        {filteredProducts.map((product) => {
          const label = getCustomizationLabel(product);
          return (
            <motion.div
              key={product.id}
              variants={cardVariants}
              transition={baseTransition}
            >
              <Link href={`/products/${product.id}`} className="group block h-full">
                <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border overflow-hidden hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 flex flex-col h-full">
                  <div className="bg-muted/50 relative w-full overflow-hidden">
                    <img
                      src={product.images?.[0] || 'https://placehold.co/600x400/18181b/fafafa?text=No+Image'}
                      alt={product.name}
                      loading="lazy"
                      className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                      style={{ maxHeight: '400px' }}
                    />
                    {label && (
                      <div className="absolute top-2 right-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/20 backdrop-blur-md">
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
