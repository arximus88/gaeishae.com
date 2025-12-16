-- D1 Database Schema for GÆISHÆ Booking System
-- Two tables: test_bookings (for development) and prod_bookings (for production)

-- Test bookings table (receives messages from developer testing)
CREATE TABLE IF NOT EXISTS test_bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact TEXT NOT NULL,
    event TEXT,
    location TEXT,
    expectations TEXT,
    telegram_sent BOOLEAN DEFAULT 0,
    telegram_error TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Production bookings table (receives real client bookings)
CREATE TABLE IF NOT EXISTS prod_bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact TEXT NOT NULL,
    event TEXT,
    location TEXT,
    expectations TEXT,
    telegram_sent BOOLEAN DEFAULT 0,
    telegram_error TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries by date
CREATE INDEX IF NOT EXISTS idx_test_created_at ON test_bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prod_created_at ON prod_bookings(created_at DESC);

-- Index for tracking Telegram delivery status
CREATE INDEX IF NOT EXISTS idx_test_telegram ON test_bookings(telegram_sent);
CREATE INDEX IF NOT EXISTS idx_prod_telegram ON prod_bookings(telegram_sent);
