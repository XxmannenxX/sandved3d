"use client"

import Link from 'next/link'
import { useCartStore } from '@/store/cart'
import { useState, useEffect } from 'react'
import { ShoppingCart, Printer, Menu, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function Navbar() {
  const items = useCartStore((state) => state.items)
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0)
  
  const [mounted, setMounted] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  useEffect(() => {
      setMounted(true)
      const supabase = createClient()
      let isMounted = true

      const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (isMounted) {
          setIsAdmin(!!session?.user)
        }
      }

      checkSession()

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (isMounted) {
          setIsAdmin(!!session?.user)
        }
      })

      return () => {
        isMounted = false
        subscription?.unsubscribe()
      }
  }, [])

  useEffect(() => {
    if (!isMenuOpen) {
      document.body.style.removeProperty('overflow')
      return
    }

    document.body.style.overflow = 'hidden'
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMenuOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      document.body.style.removeProperty('overflow')
      window.removeEventListener('resize', handleResize)
    }
  }, [isMenuOpen])

  const closeMenu = () => setIsMenuOpen(false)

  const navLinks = (
    <>
      <Link 
        href="/" 
        className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        onClick={closeMenu}
      >
        Produkter
      </Link>
      <Link 
        href="/products" 
        className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        onClick={closeMenu}
      >
        Kategorier
      </Link>
      <Link 
        href="/custom-request" 
        className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        onClick={closeMenu}
      >
        Custom Request
      </Link>
      {isAdmin && (
        <>
          <Link 
            href="/admin"
            className="px-3 py-2 rounded-md text-sm font-semibold bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 transition-colors"
            onClick={closeMenu}
          >
            Admin
          </Link>
          <Link 
            href="/admin/products"
            className="px-3 py-2 rounded-md text-sm font-semibold bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 transition-colors"
            onClick={closeMenu}
          >
            Produkter
          </Link>
          <Link 
            href="/api/auth/signout"
            className="px-3 py-2 rounded-md text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
            onClick={closeMenu}
          >
            Logg ut
          </Link>
        </>
      )}
    </>
  )

  const cartButton = (
    <Link
      href="/cart"
      className="relative inline-flex items-center justify-center rounded-full border border-border px-2.5 py-2 text-muted-foreground hover:text-foreground hover:border-blue-400 transition-colors lg:px-3 lg:py-2 lg:rounded-md lg:border-transparent lg:hover:border-transparent lg:text-sm lg:font-medium"
      aria-label="Se handlekurv"
      onClick={closeMenu}
    >
      <ShoppingCart suppressHydrationWarning className="h-5 w-5" />
      {mounted && cartCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center ring-2 ring-background">
          {cartCount}
        </span>
      )}
    </Link>
  )

  return (
    <nav className="bg-background/85 backdrop-blur-xl border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-foreground hover:opacity-80 transition-opacity">
              <Printer suppressHydrationWarning className="w-6 h-6 text-blue-500" />
              <span>sandved3d</span>
            </Link>
          </div>

          <div className="hidden lg:flex items-center gap-4">
            {navLinks}
            {cartButton}
          </div>

          <div className="flex items-center gap-3 lg:hidden">
            {cartButton}
            <button
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-label="Veksle meny"
              className="inline-flex items-center justify-center rounded-full border border-border p-2 text-muted-foreground hover:text-foreground hover:border-blue-400 transition-colors"
            >
              {isMenuOpen ? (
                <X suppressHydrationWarning className="h-5 w-5" />
              ) : (
                <Menu suppressHydrationWarning className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="lg:hidden border-t border-border bg-background/95 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-2">
            {navLinks}
          </div>
        </div>
      )}
    </nav>
  )
}
