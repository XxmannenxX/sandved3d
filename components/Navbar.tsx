"use client"

import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/store/cart'
import { useState, useEffect } from 'react'

export default function Navbar() {
  const items = useCartStore((state) => state.items)
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0)
  
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
      setMounted(true)
  }, [])

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex-shrink-0 flex items-center font-bold text-xl text-gray-900">
              Andreas 3D
            </Link>
          </div>
          
          <div className="flex space-x-4 items-center">
            <Link href="/" className="text-gray-900 hover:text-gray-500 px-3 py-2 rounded-md text-sm font-medium">
              Products
            </Link>
            <Link href="/custom-request" className="text-gray-900 hover:text-gray-500 px-3 py-2 rounded-md text-sm font-medium hidden sm:block">
              Custom Request
            </Link>
            <Link href="/cart" className="text-gray-900 hover:text-gray-500 px-3 py-2 rounded-md text-sm font-medium relative">
              <ShoppingCart className="h-6 w-6" />
              {mounted && cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
