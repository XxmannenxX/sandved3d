"use client"

import { useMemo, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Image as ImageIcon, Pencil, ArrowUp, ArrowDown, Save, X, Archive } from 'lucide-react'
import { Database } from '@/types/supabase'

type Product = Database['public']['Tables']['products']['Row']

function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replaceAll(/['"]/g, '')
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '')
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Form State
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [categorySlug, setCategorySlug] = useState('')
  const [typeSlug, setTypeSlug] = useState('')
  const [isCustomizable, setIsCustomizable] = useState(false)
  const [allowText, setAllowText] = useState(false)
  const [allowImage, setAllowImage] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchProducts()
  }, [])

  const existingCategorySlugs = useMemo(() => {
    const set = new Set<string>()
    for (const p of products) {
      if (p.category_slug) set.add(p.category_slug)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [products])

  const existingTypeSlugsForCategory = useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const p of products) {
      const c = p.category_slug || ''
      const t = p.type_slug || ''
      if (!c || !t) continue
      if (!map.has(c)) map.set(c, new Set())
      map.get(c)!.add(t)
    }
    return map
  }, [products])

  const suggestedTypeSlugs = useMemo(() => {
    const c = categorySlug.trim()
    if (!c) {
      const set = new Set<string>()
      for (const p of products) {
        if (p.type_slug) set.add(p.type_slug)
      }
      return Array.from(set).sort((a, b) => a.localeCompare(b))
    }
    const set = existingTypeSlugsForCategory.get(c)
    return set ? Array.from(set).sort((a, b) => a.localeCompare(b)) : []
  }, [products, categorySlug, existingTypeSlugsForCategory])

  const fetchProducts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('display_order', { ascending: true }) 
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching products:', error)
    } else if (data) {
      setProducts(data)
    }
    setLoading(false)
  }

  const resetForm = () => {
    setName('')
    setDescription('')
    setPrice('')
    setCategorySlug('')
    setTypeSlug('')
    setIsCustomizable(false)
    setAllowText(false)
    setAllowImage(false)
    setImageFile(null)
    setEditingId(null)
  }

  const handleEdit = (product: Product) => {
    setEditingId(product.id)
    setName(product.name)
    setDescription(product.description || '')
    setPrice(product.base_price.toString())
    setCategorySlug(product.category_slug || '')
    setTypeSlug(product.type_slug || '')
    setIsCustomizable(product.is_customizable || false)
    const config = product.customization_config as any || {}
    setAllowText(config.allow_text || false)
    setAllowImage(config.allow_image || false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Er du sikker på at du vil arkivere dette produktet? Det vil bli skjult for kunder, men bevart for ordrehistorikk.')) return

    try {
      const { error } = await supabase
        .from('products')
        .update({ is_archived: true })
        .eq('id', id)

      if (error) {
        alert('Error archiving product: ' + error.message)
        return
      }

      fetchProducts()
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  const handleArchive = async (id: string) => {
      const { error } = await supabase.from('products').update({ is_archived: true }).eq('id', id)
      if (error) {
          alert('Feil ved arkivering av produkt: ' + error.message)
      } else {
          fetchProducts()
      }
  }

  const handleRestore = async (id: string) => {
      const { error } = await supabase.from('products').update({ is_archived: false }).eq('id', id)
      if (error) {
          alert('Feil ved gjenoppretting av produkt: ' + error.message)
      } else {
          fetchProducts()
      }
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)

    try {
        const normalizedCategory = categorySlug.trim() ? slugify(categorySlug) : ''
        const normalizedType = typeSlug.trim() ? slugify(typeSlug) : ''

        let imageUrls: string[] | null = null
        
        // Upload new image if selected
        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
            const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(fileName, imageFile)
            
            if (uploadError) throw new Error('Failed to upload image: ' + uploadError.message)
            
            const { data: { publicUrl } } = supabase.storage
                .from('product-images')
                .getPublicUrl(fileName)
                
            imageUrls = [publicUrl]
        }

        const productData = {
            name,
            description,
            base_price: parseFloat(price),
            category_slug: normalizedCategory ? normalizedCategory : null,
            type_slug: normalizedType ? normalizedType : null,
            is_customizable: isCustomizable,
            customization_config: isCustomizable ? {
                allow_text: allowText,
                allow_image: allowImage
            } : null,
        }

        if (imageUrls) {
            // @ts-ignore
            productData.images = imageUrls
        }

        if (editingId) {
            const { error } = await supabase
                .from('products')
                .update(productData)
                .eq('id', editingId)
            if (error) throw error
        } else {
            const { error } = await supabase
                .from('products')
                .insert({
                    ...productData,
                    display_order: getNextDisplayOrder()
                })
            if (error) throw error
        }
        
        resetForm()
        fetchProducts()
    } catch (error: any) {
        alert(error.message)
    } finally {
        setFormLoading(false)
    }
  }

  // Quick reorder helper
  const updateOrder = async (id: string, newOrder: number) => {
    const { error } = await supabase.from('products').update({ display_order: newOrder }).eq('id', id)
    if (!error) fetchProducts()
  }

  const getNextDisplayOrder = () => {
    const activeOrders = products
      .filter(product => !product.is_archived)
      .map(product => (typeof product.display_order === 'number' ? product.display_order : 0))

    if (activeOrders.length === 0) {
      return 0
    }

    return Math.min(...activeOrders) - 1
  }

  const getCustomizationLabel = (product: Product) => {
    if (!product.is_customizable) return null;
    const config = product.customization_config as any || {};
    if (config.allow_text && config.allow_image) return "Tekst og bilde";
    if (config.allow_text) return "Tekst";
    if (config.allow_image) return "Bilde";
    return "Tilpassbar";
  };

  const activeProducts = products.filter(p => !p.is_archived)
  const archivedProducts = products.filter(p => p.is_archived)
  const archivedCount = archivedProducts.length

  const renderProductRow = (product: Product) => {
    const customLabel = getCustomizationLabel(product);
    return (
      <li
        key={product.id}
        className={`p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-muted/20 transition-colors ${product.is_archived ? 'opacity-60 bg-muted/10' : ''}`}
      >
        <div className="w-full sm:w-12 sm:h-12 bg-muted rounded-lg overflow-hidden flex-shrink-0 border border-border/50">
          <img
            src={product.images?.[0] || 'https://placehold.co/100/18181b/fafafa'}
            alt={product.name}
            className="w-full h-40 sm:h-full object-cover"
          />
        </div>

        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-foreground truncate">{product.name}</h4>
            {product.is_archived && (
              <span className="text-[10px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20">
                Arkivert
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{product.base_price} kr</p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {product.description || 'Ingen beskrivelse gitt ennå.'}
          </p>
          {(product.category_slug || product.type_slug) && (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {product.category_slug && (
                <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/25">
                  Mappe: {product.category_slug}
                </span>
              )}
              {product.type_slug && (
                <span className="text-[10px] bg-purple-500/10 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/25">
                  Undermappe: {product.type_slug}
                </span>
              )}
            </div>
          )}
          <div className="flex items-center gap-2 mt-1">
            {customLabel && (
              <span className="text-[10px] bg-sky-500/10 text-sky-300 px-1.5 py-0.5 rounded border border-sky-500/25">
                {customLabel}
              </span>
            )}
            <span className="text-[10px] bg-muted/60 text-muted-foreground px-1.5 py-0.5 rounded border border-border/60">
              Indeks: {product.display_order || 0}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {!product.is_archived && (
            <div className="flex flex-col mr-2">
              <button
                onClick={() => updateOrder(product.id, (product.display_order || 0) - 1)}
                className="p-1 text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 rounded"
                title="Flytt opp"
              >
                <ArrowUp suppressHydrationWarning className="w-3 h-3" />
              </button>
              <button
                onClick={() => updateOrder(product.id, (product.display_order || 0) + 1)}
                className="p-1 text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 rounded"
                title="Flytt ned"
              >
                <ArrowDown suppressHydrationWarning className="w-3 h-3" />
              </button>
            </div>
          )}

          <button
            onClick={() => handleEdit(product)}
            className="p-2 text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
            title="Rediger"
          >
            <Pencil suppressHydrationWarning className="w-4 h-4" />
          </button>

          {product.is_archived ? (
            <button
              onClick={() => handleRestore(product.id)}
              className="p-2 text-muted-foreground hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
              title="Gjenopprett"
            >
              <Archive suppressHydrationWarning className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => handleDelete(product.id)}
              className="p-2 text-muted-foreground hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors"
              title="Arkiver"
            >
              <Archive suppressHydrationWarning className="w-4 h-4" />
            </button>
          )}
        </div>
      </li>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 sm:py-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Administrer produkter</h1>
          {archivedCount > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {archivedCount} arkiverte produkt{archivedCount > 1 ? 'er' : ''} (bevart for ordrehistorikk)
            </p>
          )}
        </div>
        <div className="w-full sm:w-auto">
          <button 
            onClick={resetForm}
            className="w-full bg-card border border-border text-foreground hover:bg-muted px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
          >
            <Plus suppressHydrationWarning className="w-4 h-4 mr-2" /> Nytt produkt
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Form Section */}
        <div className="lg:col-span-1">
            <div className="bg-card border border-border p-6 rounded-xl lg:sticky lg:top-24 shadow-sm">
                <h2 className="text-xl font-bold text-foreground mb-6 flex items-center">
                    {editingId ? <Pencil suppressHydrationWarning className="w-5 h-5 mr-2" /> : <Plus suppressHydrationWarning className="w-5 h-5 mr-2" />}
                    {editingId ? 'Rediger produkt' : 'Legg til produkt'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Navn</label>
                        <input 
                          type="text" 
                          value={name} 
                          onChange={e => setName(e.target.value)} 
                          required 
                          className="block w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground shadow-sm focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Mappe (kategori)</label>
                            <input
                              type="text"
                              value={categorySlug}
                              onChange={e => setCategorySlug(e.target.value)}
                              onBlur={(e) => setCategorySlug(e.target.value ? slugify(e.target.value) : '')}
                              list="category-slugs"
                              placeholder="f.eks. keychains"
                              className="block w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground shadow-sm focus:ring-1 focus:ring-blue-500"
                            />
                            <datalist id="category-slugs">
                              {existingCategorySlugs.map((slug) => (
                                <option key={slug} value={slug} />
                              ))}
                            </datalist>
                            <p className="text-[11px] text-muted-foreground mt-1">
                              Dette er “mappen” på forsiden. Bruk små bokstaver og bindestrek.
                            </p>
                            {existingCategorySlugs.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {existingCategorySlugs.slice(0, 8).map((slug) => (
                                  <button
                                    key={slug}
                                    type="button"
                                    onClick={() => setCategorySlug(slug)}
                                    className="text-[11px] bg-emerald-500/10 text-emerald-300 px-2 py-1 rounded border border-emerald-500/25 hover:bg-emerald-500/15 transition-colors"
                                    title="Bruk eksisterende mappe"
                                  >
                                    {slug}
                                  </button>
                                ))}
                                {existingCategorySlugs.length > 8 && (
                                  <span className="text-[11px] text-muted-foreground px-2 py-1">…</span>
                                )}
                              </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Undermappe (type)</label>
                            <input
                              type="text"
                              value={typeSlug}
                              onChange={e => setTypeSlug(e.target.value)}
                              onBlur={(e) => setTypeSlug(e.target.value ? slugify(e.target.value) : '')}
                              list="type-slugs"
                              placeholder="f.eks. classic"
                              className="block w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground shadow-sm focus:ring-1 focus:ring-blue-500"
                            />
                            <datalist id="type-slugs">
                              {suggestedTypeSlugs.map((slug) => (
                                <option key={slug} value={slug} />
                              ))}
                            </datalist>
                            <p className="text-[11px] text-muted-foreground mt-1">
                              Valgfritt. Brukes som undermappe inne i en mappe.
                            </p>
                            {suggestedTypeSlugs.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {suggestedTypeSlugs.slice(0, 8).map((slug) => (
                                  <button
                                    key={slug}
                                    type="button"
                                    onClick={() => setTypeSlug(slug)}
                                    className="text-[11px] bg-purple-500/10 text-purple-300 px-2 py-1 rounded border border-purple-500/25 hover:bg-purple-500/15 transition-colors"
                                    title="Bruk eksisterende undermappe"
                                  >
                                    {slug}
                                  </button>
                                ))}
                                {suggestedTypeSlugs.length > 8 && (
                                  <span className="text-[11px] text-muted-foreground px-2 py-1">…</span>
                                )}
                              </div>
                            )}
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Beskrivelse</label>
                        <textarea 
                          value={description} 
                          onChange={e => setDescription(e.target.value)} 
                          className="block w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground shadow-sm focus:ring-1 focus:ring-blue-500"
                          rows={3}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Pris (NOK)</label>
                        <input 
                          type="number" 
                          step="0.01" 
                          value={price} 
                          onChange={e => setPrice(e.target.value)} 
                          required 
                          className="block w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground shadow-sm focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Bilde</label>
                        <div className="flex items-center space-x-2">
                          <label className="cursor-pointer flex-1 flex items-center justify-center px-3 py-2 border border-input rounded-lg text-sm font-medium text-foreground bg-background hover:bg-muted transition-colors">
                            <ImageIcon suppressHydrationWarning className="mr-2 h-4 w-4 text-muted-foreground" />
                            {imageFile ? 'Endre bilde' : 'Last opp bilde'}
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={e => setImageFile(e.target.files?.[0] || null)} 
                              className="hidden" 
                            />
                          </label>
                        </div>
                        {imageFile && <p className="text-xs text-muted-foreground mt-1 truncate">{imageFile.name}</p>}
                    </div>

                    <div className="bg-muted/20 p-3 rounded-lg border border-border/50">
                        <div className="flex items-center mb-2">
                            <input 
                              type="checkbox" 
                              id="custom" 
                              checked={isCustomizable} 
                              onChange={e => setIsCustomizable(e.target.checked)} 
                              className="h-4 w-4 text-blue-600 border-input rounded bg-background focus:ring-blue-500" 
                            />
                            <label htmlFor="custom" className="ml-2 block text-sm font-medium text-foreground">Tilpassbar?</label>
                        </div>

                        {isCustomizable && (
                            <div className="ml-6 space-y-2">
                                <div className="flex items-center">
                                    <input 
                                      type="checkbox" 
                                      id="allowText" 
                                      checked={allowText} 
                                      onChange={e => setAllowText(e.target.checked)} 
                                      className="h-4 w-4 text-blue-600 border-input rounded bg-background focus:ring-blue-500" 
                                    />
                                    <label htmlFor="allowText" className="ml-2 block text-sm text-muted-foreground">Tillat tekst</label>
                                </div>
                                <div className="flex items-center">
                                    <input 
                                      type="checkbox" 
                                      id="allowImage" 
                                      checked={allowImage} 
                                      onChange={e => setAllowImage(e.target.checked)} 
                                      className="h-4 w-4 text-blue-600 border-input rounded bg-background focus:ring-blue-500" 
                                    />
                                    <label htmlFor="allowImage" className="ml-2 block text-sm text-muted-foreground">Tillat bilde</label>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <button 
                          type="submit" 
                          disabled={formLoading} 
                          className="flex-1 flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                        >
                            {formLoading ? <Loader2 suppressHydrationWarning className="animate-spin h-4 w-4" /> : (editingId ? <><Save suppressHydrationWarning className="mr-2 h-4 w-4" /> Oppdater</> : <><Plus suppressHydrationWarning className="mr-2 h-4 w-4" /> Opprett</>)}
                        </button>
                        {editingId && (
                            <button 
                              type="button" 
                              onClick={resetForm}
                              className="px-3 border border-border rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X suppressHydrationWarning className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>

        {/* List Section */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border bg-muted/10">
                    <h3 className="font-bold text-foreground">Aktive produkter</h3>
                </div>
                {loading ? (
                    <div className="p-8 text-center">
                        <Loader2 suppressHydrationWarning className="w-8 h-8 animate-spin mx-auto text-blue-500" />
                        <p className="text-muted-foreground mt-2">Laster produkter...</p>
                    </div>
                ) : activeProducts.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        Ingen aktive produkter. Opprett ett for å komme i gang.
                    </div>
                ) : (
                    <ul className="divide-y divide-border">
                        {activeProducts.map(renderProductRow)}
                    </ul>
                )}
            </div>

            {archivedProducts.length > 0 && (
              <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border bg-muted/10 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-foreground">Arkiverte produkter</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Skjult fra butikken, men beholdt for ordrehistorikk.
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-border/50 text-muted-foreground">
                    {archivedProducts.length}
                  </span>
                </div>
                <ul className="divide-y divide-border">
                  {archivedProducts.map(renderProductRow)}
                </ul>
              </div>
            )}
        </div>
      </div>
    </div>
  )
}
