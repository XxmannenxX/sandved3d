"use client"

import { useState } from 'react'
import { Database } from '@/types/supabase'

type Order = Database['public']['Tables']['orders']['Row'] & {
  order_items: any[]
}

interface OrderStatusSelectorProps {
  order: Order
  onUpdate: (orderId: string, newStatus: string) => Promise<void>
}

export default function OrderStatusSelector({ order, onUpdate }: OrderStatusSelectorProps) {
  const [status, setStatus] = useState(order.status || 'pending')
  const [updating, setUpdating] = useState(false)

  const handleChange = async (newStatus: string) => {
    setStatus(newStatus)
    setUpdating(true)
    try {
      await onUpdate(order.id, newStatus)
    } catch (error) {
      console.error('Failed to update status:', error)
      // Revert on error
      setStatus(order.status || 'pending')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <select 
      value={status}
      onChange={(e) => handleChange(e.target.value)}
      disabled={updating}
      className="text-sm bg-background border border-input text-foreground rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 disabled:opacity-50 cursor-pointer"
    >
      <option value="pending">Venter</option>
      <option value="paid">Betalt</option>
      <option value="shipped">Sendt</option>
      <option value="completed">Fullført</option>
      <option value="refunded">Refundert</option>
    </select>
  )
}




