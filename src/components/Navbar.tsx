"use client"

import Link from 'next/link'
import { useCartStore } from '@/store/cart'
import { useState, useEffect } from 'react'
import { ShoppingCart, Printer, Menu, X, ChevronRight, LayoutDashboard, ScrollText, Package, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

export default function Navbar() {
  const items = useCartStore((state) => state.items)
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0)
  const pathname = usePathname()
  
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

  const navLinks = [
    { href: '/', label: 'Hjem' },
    { href: '/products', label: 'Butikk' },
    { href: '/custom-request', label: 'Custom Request' },
  ]

  const adminLinks = [
    { href: '/admin', label: 'Admin', icon: LayoutDashboard },
    { href: '/admin/logs', label: 'Logs', icon: ScrollText },
    { href: '/admin/products', label: 'Produkter', icon: Package },
  ]

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#09090b]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group z-50 relative" onClick={closeMenu}>
              <div className="p-1.5 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                <Printer className="w-6 h-6 text-blue-500" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">sandved3d</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              <div className="flex items-center gap-1 bg-white/5 rounded-full px-2 py-1.5 border border-white/5">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href
                  return (
                    <Link 
                      key={link.href}
                      href={link.href} 
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                        isActive 
                          ? 'bg-white text-black shadow-sm' 
                          : 'text-muted-foreground hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {link.label}
                    </Link>
                  )
                })}
              </div>

              {isAdmin && (
                <div className="flex items-center gap-4 border-l border-white/10 pl-4">
                  {adminLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-sm font-medium text-muted-foreground hover:text-blue-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                  <Link
                    href="/api/auth/signout"
                    className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
                  >
                    Logg ut
                  </Link>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Link
                href="/cart"
                className="group relative inline-flex items-center justify-center p-2 text-muted-foreground hover:text-white transition-colors"
                aria-label="Se handlekurv"
                onClick={closeMenu}
              >
                <div className="relative">
                  <ShoppingCart className="h-6 w-6" />
                  {mounted && cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center ring-2 ring-[#09090b]">
                      {cartCount}
                    </span>
                  )}
                </div>
              </Link>

              {/* Mobile Menu Button */}
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden relative z-50 p-2 text-muted-foreground hover:text-white transition-colors"
                aria-label="Veksle meny"
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 lg:hidden bg-[#09090b] pt-20 px-4 pb-8 overflow-y-auto"
          >
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">Meny</span>
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMenu}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 active:bg-white/10 transition-colors"
                  >
                    <span className="text-lg font-medium text-white">{link.label}</span>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </Link>
                ))}
              </div>

              {isAdmin && (
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider px-2">Admin</span>
                  {adminLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={closeMenu}
                      className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 active:bg-blue-500/10 transition-colors"
                    >
                      <link.icon className="w-5 h-5 text-blue-400" />
                      <span className="text-lg font-medium text-blue-100">{link.label}</span>
                    </Link>
                  ))}
                  <Link
                    href="/api/auth/signout"
                    onClick={closeMenu}
                    className="flex items-center gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/10 active:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-5 h-5 text-red-400" />
                    <span className="text-lg font-medium text-red-100">Logg ut</span>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
