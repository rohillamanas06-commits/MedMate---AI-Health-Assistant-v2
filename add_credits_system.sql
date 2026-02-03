-- Migration to add credits system to MedMate users table
-- Run this SQL script on your PostgreSQL database

-- Add credits column to user table with default 5 free credits
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 5 NOT NULL;

-- Add credits_used column to track total credits used by user
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS credits_used INTEGER DEFAULT 0 NOT NULL;

-- Create credits_transactions table to track all credit transactions
CREATE TABLE IF NOT EXISTS credits_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL, -- 'purchase', 'deduct', 'refund', 'bonus'
    credits_amount INTEGER NOT NULL,
    credits_before INTEGER NOT NULL,
    credits_after INTEGER NOT NULL,
    description TEXT,
    payment_id VARCHAR(255), -- Razorpay payment ID
    order_id VARCHAR(255), -- Razorpay order ID
    amount_paid DECIMAL(10, 2), -- Amount in rupees
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_credits_transactions_user_id ON credits_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credits_transactions_created_at ON credits_transactions(created_at);

-- Create payment_orders table to track Razorpay orders
CREATE TABLE IF NOT EXISTS payment_orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    order_id VARCHAR(255) UNIQUE NOT NULL, -- Razorpay order ID
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    credits_amount INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'created', -- 'created', 'paid', 'failed', 'expired'
    payment_id VARCHAR(255),
    payment_signature VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_order_id ON payment_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);

-- Update existing users to have 5 free credits
UPDATE "user" SET credits = 5 WHERE credits IS NULL OR credits = 0;

COMMENT ON TABLE credits_transactions IS 'Tracks all credit transactions for users';
COMMENT ON TABLE payment_orders IS 'Tracks Razorpay payment orders for credit purchases';
