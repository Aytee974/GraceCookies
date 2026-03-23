CREATE TABLE weekly_menu (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pickup_week   DATE NOT NULL,
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity_limit INTEGER NULL,
  UNIQUE (pickup_week, product_id)
);

ALTER TABLE weekly_menu ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read weekly_menu" ON weekly_menu FOR SELECT USING (true);
