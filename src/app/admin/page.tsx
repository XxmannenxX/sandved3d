import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { Package, LogOut, Settings, TrendingUp, DollarSign, Clock } from 'lucide-react'
import OrderStatusSelector from '@/components/OrderStatusSelector'
import { sendCustomerOrderStatusUpdateEmail } from '@/lib/email/resend'

export default async function AdminDashboard() {
  const supabase = await createClient()
  
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        quantity,
        customization_data,
        products (name, images)
      )
    `)
    .order('created_at', { ascending: false })

  async function updateOrderStatus(orderId: string, newStatus: string) {
    "use server"
    
    const supabase = await createClient()
    const { data: existing } = await supabase.from('orders').select('status').eq('id', orderId).single()
    const previousStatus = existing?.status || null

    if (previousStatus === newStatus) {
      revalidatePath('/admin')
      return
    }

    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)

    // Best-effort: notify customer about status update (email failures shouldn't break admin UX)
    try {
      await sendCustomerOrderStatusUpdateEmail(orderId, newStatus)
    } catch (e) {
      console.error('Failed to send order status update email:', e)
    }
    
    revalidatePath('/admin')
  }

  const activeOrders = orders?.filter(
    (order) => order.status !== 'completed' && order.status !== 'cancelled'
  ) || []
  const completedOrders = orders?.filter(
    (order) => order.status === 'completed' || order.status === 'cancelled'
  ) || []

  const activeOrderCount = activeOrders.length
  const completedOrderCount = completedOrders.length
  const totalRevenue = orders?.reduce((acc, order) => acc + (order.amount_total || 0), 0) ?? 0

  const renderOrderItems = (order: any) => (
    <div className="mt-4 grid gap-3">
      {order.order_items.map((item: any, idx: number) => {
        const customization = item.customization_data || {}
        const imageUrl = item.products?.images?.[0]
        const customImageUrl = customization.image_path
          ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/customer-uploads/${customization.image_path}`
          : null

        return (
          <div
            key={`${order.id}-${idx}`}
            className="flex flex-col sm:flex-row sm:items-start gap-3 p-3 rounded-lg border border-border/60 bg-background/50"
          >
            <div className="w-full sm:w-14 sm:h-14 rounded-md overflow-hidden border border-border/50 bg-muted flex-shrink-0">
              <img
                src={imageUrl || 'https://placehold.co/80/18181b/fafafa?text=No+Img'}
                alt={item.products?.name || 'Produkt'}
                className="w-full h-32 sm:h-full object-cover"
              />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm text-foreground">
                    {item.products?.name || 'Produkt'}
                  </p>
                  <p className="text-xs text-muted-foreground">Antall {item.quantity}</p>
                </div>
                {customImageUrl && (
                  <a
                    href={customImageUrl}
                    target="_blank"
                    className="text-xs text-blue-400 hover:text-blue-300 underline"
                  >
                    Tilpasset bilde
                  </a>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                <span className="uppercase tracking-wider text-[11px]">Tilpasset tekst:</span>{' '}
                <span className="text-foreground font-medium">
                  {customization.text ? `"${customization.text}"` : '—'}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin-dashboard</h1>
          <p className="text-muted-foreground mt-1">Administrer ordrer og produkter</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <Link href="/admin/products" className="inline-flex w-full sm:w-auto items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 font-medium">
              <Settings suppressHydrationWarning className="w-4 h-4 mr-2" />
              Administrer produkter
            </Link>
            <Link href="/admin/settings" className="inline-flex w-full sm:w-auto items-center justify-center bg-card border border-border text-foreground hover:bg-muted px-4 py-2 rounded-lg transition-colors font-medium">
              <Settings suppressHydrationWarning className="w-4 h-4 mr-2" />
              Innstillinger
            </Link>
            <Link href="/api/auth/signout" className="inline-flex w-full sm:w-auto items-center justify-center text-muted-foreground hover:text-red-400 transition-colors px-4 py-2 border border-border rounded-lg hover:bg-red-500/10">
               <LogOut suppressHydrationWarning className="w-4 h-4 mr-2" />
               Logg ut
            </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
              <Package suppressHydrationWarning className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Aktive ordrer</p>
              <p className="text-2xl font-bold text-foreground">{activeOrderCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/10 text-green-400 rounded-lg">
              <DollarSign suppressHydrationWarning className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Omsetning</p>
              <p className="text-2xl font-bold text-foreground">
                {totalRevenue.toFixed(2)} kr
              </p>
            </div>
          </div>
        </div>
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg">
              <Clock suppressHydrationWarning className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fullførte ordrer</p>
              <p className="text-2xl font-bold text-foreground">{completedOrderCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card/50 backdrop-blur-sm border border-border shadow-sm overflow-hidden rounded-xl">
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <h3 className="text-lg leading-6 font-bold text-foreground flex items-center gap-2">
            <TrendingUp suppressHydrationWarning className="w-5 h-5 text-blue-400" />
            Aktive ordrer
          </h3>
        </div>
        {activeOrders.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            Ingen aktive ordrer akkurat nå.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {activeOrders.map((order) => (
              <li key={order.id} className="p-6 hover:bg-muted/30 transition-colors space-y-4">
                <div className="flex flex-wrap gap-4 justify-between items-start">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap gap-3 items-center">
                      <p className="text-base font-bold text-foreground">
                        Ordre #{order.id.slice(0, 8)}
                      </p>
                      <OrderStatusSelector order={order} onUpdate={updateOrderStatus} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {order.customer_name ? `${order.customer_name} · ` : ''}
                        {order.email}
                      </p>
                      {order.customer_phone && (
                        <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                      )}
                      <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                        {new Date(order.created_at!).toLocaleDateString()} ·{' '}
                        {new Date(order.created_at!).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${
                          order.status === 'pending'
                            ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}
                    >
                      {order.status}
                    </span>
                    <p className="text-2xl font-bold text-foreground">{order.amount_total} kr</p>
                  </div>
                </div>

                {renderOrderItems(order)}

              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-card/50 backdrop-blur-sm border border-border shadow-sm overflow-hidden rounded-xl mt-8">
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <h3 className="text-lg leading-6 font-bold text-foreground">Fullførte ordrer</h3>
        </div>
        {completedOrders.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            Ingen fullførte ordrer ennå.
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {completedOrders.map((order) => (
              <li key={order.id} className="p-6 space-y-4">
                <div className="flex flex-wrap gap-4 justify-between items-start">
                  <div>
                    <p className="text-base font-bold text-foreground">
                      Ordre #{order.id.slice(0, 8)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.customer_name ? `${order.customer_name} · ` : ''}
                      {order.email}
                    </p>
                    {order.customer_phone && (
                      <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                    )}
                    <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                      {new Date(order.created_at!).toLocaleDateString()} ·{' '}
                      {new Date(order.created_at!).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20 capitalize">
                      {order.status}
                    </span>
                    <p className="text-2xl font-bold text-foreground">{order.amount_total} kr</p>
                  </div>
                </div>
                {renderOrderItems(order)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
