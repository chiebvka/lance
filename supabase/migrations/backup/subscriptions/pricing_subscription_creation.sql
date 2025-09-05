-- Create pricing table
CREATE TABLE pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "stripePriceId" TEXT UNIQUE NOT NULL,
  "productId" UUID REFERENCES products(id) ON DELETE CASCADE,
  "stripeProductId" TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  "unitAmount" INTEGER NOT NULL,
  "billingCycle" TEXT CHECK ("billingCycle" IN ('monthly', 'yearly')),
  "isActive" BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);