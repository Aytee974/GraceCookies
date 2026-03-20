-- Products
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  category text NOT NULL DEFAULT 'cookies',
  image_url text,
  available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Recipes (one per product)
CREATE TABLE recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
  batch_size integer NOT NULL
);

-- Recipe ingredients
CREATE TABLE recipe_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  name text NOT NULL,
  quantity numeric NOT NULL,
  unit text NOT NULL
);

-- Orders
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  pickup_week date NOT NULL,
  total numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','ready','fulfilled')),
  stripe_payment_id text,
  access_token text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Order items
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id),
  quantity integer NOT NULL,
  unit_price numeric(10,2) NOT NULL
);

-- RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Public can read available products and their recipes
CREATE POLICY "Public read available products" ON products FOR SELECT USING (available = true);
CREATE POLICY "Public read recipes" ON recipes FOR SELECT USING (true);
CREATE POLICY "Public read recipe_ingredients" ON recipe_ingredients FOR SELECT USING (true);
-- orders and order_items: no anon access (all writes use service role key server-side)
