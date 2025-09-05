-- Add UNIQUE constraints for Stripe IDs to enable proper upsert operations

-- Add UNIQUE constraint to products table for stripeProductId
ALTER TABLE products ADD CONSTRAINT products_stripe_product_id_unique UNIQUE ("stripeProductId");

-- Add UNIQUE constraint to pricing table for stripePriceId
ALTER TABLE pricing ADD CONSTRAINT pricing_stripe_price_id_unique UNIQUE ("stripePriceId");

-- Add UNIQUE constraint to pricing table for stripeProductId (in case we need it)
ALTER TABLE pricing ADD CONSTRAINT pricing_stripe_product_id_unique UNIQUE ("stripeProductId");
