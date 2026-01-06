# D1 Database Setup Instructions

## Step 1: Create D1 Database

```bash
# Create the database
npx wrangler d1 create gaeishae-bookings
```

This will output something like:
```
✅ Successfully created DB 'gaeishae-bookings'!

[[d1_databases]]
binding = "DB"
database_name = "gaeishae-bookings"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**Copy the `database_id` from the output!**

## Step 2: Update wrangler.toml

Replace `TO_BE_FILLED_AFTER_CREATION` in `wrangler.toml` with your actual `database_id`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "gaeishae-bookings"
database_id = "YOUR_ACTUAL_DATABASE_ID_HERE"
```

## Step 3: Initialize Database Schema

```bash
# Apply the schema to create tables
npx wrangler d1 execute gaeishae-bookings --remote --file=./schema.sql
```

## Step 4: Verify Tables Were Created

```bash
# List all tables in the database
npx wrangler d1 execute gaeishae-bookings --remote --command="SELECT name FROM sqlite_master WHERE type='table';"
```

You should see:
- `test_bookings`
- `prod_bookings`

## Step 5: Test Local Development

For local testing with D1, use:

```bash
# Apply schema to local database (creates .wrangler/state/v3/d1/ folder)
npx wrangler d1 execute gaeishae-bookings --local --file=./schema.sql

# Start local dev server
npx wrangler dev worker.js
```

## Step 6: Deploy Updated Worker

```bash
# Deploy worker with D1 binding
npx wrangler deploy worker.js
```

## Useful D1 Commands

### Query test bookings:
```bash
npx wrangler d1 execute gaeishae-bookings --remote --command="SELECT * FROM test_bookings ORDER BY created_at DESC LIMIT 10;"
```

### Query production bookings:
```bash
npx wrangler d1 execute gaeishae-bookings --remote --command="SELECT * FROM prod_bookings ORDER BY created_at DESC LIMIT 10;"
```

### Count bookings:
```bash
# Test bookings count
npx wrangler d1 execute gaeishae-bookings --remote --command="SELECT COUNT(*) as total FROM test_bookings;"

# Production bookings count
npx wrangler d1 execute gaeishae-bookings --remote --command="SELECT COUNT(*) as total FROM prod_bookings;"
```

### Check Telegram delivery status:
```bash
# Failed Telegram deliveries in production
npx wrangler d1 execute gaeishae-bookings --remote --command="SELECT * FROM prod_bookings WHERE telegram_sent = 0;"
```

## How It Works

### Environment Detection:
- **Test Environment**: When `TELEGRAM_CHAT_ID` = `594236669` (your ID)
  - Saves to `test_bookings` table
  - Message includes 🧪 TEST ENVIRONMENT badge
  - Messages go to you (Borys)

- **Production Environment**: When `TELEGRAM_CHAT_ID` = client's ID
  - Saves to `prod_bookings` table
  - Normal message format
  - Messages go to Gaeishae

### Data Flow:
1. Form submission received
2. **FIRST**: Save to D1 database (so nothing is lost)
3. **THEN**: Try to send to Telegram
4. **FINALLY**: Update D1 record with Telegram delivery status

### Advantages:
- ✅ No data loss even if Telegram API fails
- ✅ Audit trail of all booking requests
- ✅ Can retry failed Telegram deliveries
- ✅ Separate test and production data
- ✅ IP address and User Agent tracking
- ✅ Timestamp for all requests

## Troubleshooting

### If database queries fail:
```bash
# Check if database exists
npx wrangler d1 list

# Check if tables exist
npx wrangler d1 execute gaeishae-bookings --remote --command="SELECT name FROM sqlite_master WHERE type='table';"
```

### If worker deployment fails:
- Make sure `database_id` in `wrangler.toml` matches your actual database ID
- Make sure you've run the schema.sql file
- Check that binding name is "DB" (case-sensitive)
