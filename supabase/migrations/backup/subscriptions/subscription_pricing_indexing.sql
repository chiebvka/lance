CREATE INDEX idx_products_stripe_id ON products("stripeProductId");
CREATE INDEX idx_pricing_stripe_id ON pricing("stripePriceId");
CREATE INDEX idx_pricing_product_id ON pricing("productId");
CREATE INDEX idx_pricing_active ON pricing("isActive") WHERE "isActive" = true;
