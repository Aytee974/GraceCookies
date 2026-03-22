import { createAdminClient } from '@/lib/supabase/admin'

export interface OrderSummary {
  id: string
  created_at: string
  pickup_week: string
  total: number
  status: string
  items: { name: string; quantity: number }[]
}

export async function getOrdersByEmail(email: string): Promise<OrderSummary[]> {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('orders')
    .select(`
      id,
      created_at,
      pickup_week,
      total,
      status,
      order_items (
        quantity,
        products ( name )
      )
    `)
    .eq('customer_email', email)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  type RawItem = { quantity: number; products: { name: string } | null }

  return data.map((order) => ({
    id: order.id,
    created_at: order.created_at,
    pickup_week: order.pickup_week,
    total: Number(order.total),
    status: order.status,
    items: ((order.order_items ?? []) as unknown as RawItem[]).map((item) => ({
      name: item.products?.name ?? 'Unknown',
      quantity: item.quantity,
    })),
  }))
}
