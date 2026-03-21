export type Product = {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  category: string
  image_url: string | null
  available: boolean
  weekly_quantity: number
  created_at: string
}

export type Recipe = {
  id: string
  product_id: string
  batch_size: number
}

export type RecipeIngredient = {
  id: string
  recipe_id: string
  name: string
  quantity: number
  unit: string
}

export type Order = {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  pickup_week: string
  total: number
  status: 'pending' | 'paid' | 'ready' | 'fulfilled'
  stripe_payment_id: string | null
  access_token: string
  created_at: string
}

export type OrderItem = {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
}

export type CartItem = {
  product: Product
  quantity: number
}
