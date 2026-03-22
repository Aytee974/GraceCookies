CREATE TABLE weekly_menu (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pickup_week   DATE NOT NULL,
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity_limit INTEGER NULL,
  UNIQUE (pickup_week, product_id)
);
