import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, DollarSign, ShoppingBag } from 'lucide-react'
import StatsCharts from './StatsCharts'

export const dynamic = 'force-dynamic'

export default async function StatsPage() {
  const supabase = await createClient()

  // Fetch all completed orders
  const { data: orders } = await supabase
    .from('orders')
    .select('created_at, amount_total, status')
    .neq('status', 'cancelled') // Exclude cancelled orders
    .order('created_at', { ascending: true })

  if (!orders) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin" className="p-2 hover:bg-muted rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold">Statistikk</h1>
        </div>
        <p>Ingen data funnet.</p>
      </div>
    )
  }

  // Calculate totals
  const totalRevenue = orders.reduce((acc, order) => acc + (order.amount_total || 0), 0)
  const totalOrders = orders.length
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // Process Daily Data (last 30 days)
  const dailyDataMap = new Map<string, { sales: number; orders: number }>()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Initialize last 30 days with 0
  for (let i = 0; i < 30; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    dailyDataMap.set(dateStr, { sales: 0, orders: 0 })
  }

  // Process Monthly Data
  const monthlyDataMap = new Map<string, { sales: number; orders: number }>()

  orders.forEach(order => {
    if (!order.created_at) return
    const date = new Date(order.created_at)
    const dateStr = date.toISOString().split('T')[0]
    const monthStr = date.toLocaleString('nb-NO', { month: 'short', year: '2-digit' }) // e.g. "jan. 24"

    // Daily stats (only if within last 30 days)
    if (date >= thirtyDaysAgo) {
      if (dailyDataMap.has(dateStr)) {
        const current = dailyDataMap.get(dateStr)!
        dailyDataMap.set(dateStr, {
          sales: current.sales + (order.amount_total || 0),
          orders: current.orders + 1
        })
      }
    }

    // Monthly stats
    if (!monthlyDataMap.has(monthStr)) {
      monthlyDataMap.set(monthStr, { sales: 0, orders: 0 })
    }
    const currentMonthly = monthlyDataMap.get(monthStr)!
    monthlyDataMap.set(monthStr, {
      sales: currentMonthly.sales + (order.amount_total || 0),
      orders: currentMonthly.orders + 1
    })
  })

  // Convert maps to sorted arrays
  const dailyData = Array.from(dailyDataMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // For monthly data, we rely on the order of insertion if we iterate chronologically from the query, 
  // but better to sort by date if we had the raw date key.
  // Since we used a formatted string as key, let's re-process slightly differently to ensure sort order or just trust the query order (ascending).
  // The query is ascending, so the map insertion order should be correct for chronological months.
  const monthlyData = Array.from(monthlyDataMap.entries())
    .map(([month, data]) => ({ month, ...data }))

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin" className="p-2 hover:bg-muted rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-bold">Statistikk</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-12">
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Total Omsetning</h3>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{totalRevenue.toLocaleString('nb-NO')} kr</div>
        </div>
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Antall Ordre</h3>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{totalOrders}</div>
        </div>
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Snittordre</h3>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{Math.round(averageOrderValue).toLocaleString('nb-NO')} kr</div>
        </div>
      </div>

      <StatsCharts dailyData={dailyData} monthlyData={monthlyData} />
    </div>
  )
}

