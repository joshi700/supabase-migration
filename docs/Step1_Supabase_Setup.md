# Step 1: Supabase Project Setup

## 1.1 Create Supabase Account

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub (recommended) or email
4. Verify your email

## 1.2 Create New Project

1. Click "New Project"
2. Fill in details:
   - **Name**: `real-estate-broking`
   - **Database Password**: (generate strong password - SAVE THIS!)
   - **Region**: Choose closest to your users (e.g., US East for USA)
   - **Pricing Plan**: Free tier

3. Click "Create new project"
4. Wait 2-3 minutes for project to provision

## 1.3 Get Your API Keys

1. In your project dashboard, go to **Settings** (gear icon) → **API**
2. Copy and save these values:

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon public key: eyJhbGc...
service_role key: eyJhbGc... (keep this SECRET!)
```

**IMPORTANT**: The `service_role` key has admin access - never expose it in frontend code!

---

## 1.4 Create Database Schema

1. In Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy and paste this ENTIRE script:

```sql
-- ============================================
-- REAL ESTATE BROKING APP - DATABASE SCHEMA
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'broker')),
  full_name TEXT,
  phone TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for fast lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================
-- LEADS TABLE
-- ============================================
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id TEXT NOT NULL,
  broker_email TEXT NOT NULL,
  client_name TEXT NOT NULL,
  property_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'New' CHECK (
    status IN ('New', 'Processing', 'Inspection', 'Appraisal', 
               'Clear to Close', 'Closing', 'Closed', 'Cancelled')
  ),
  
  -- Expected dates (timeline milestones)
  expected_offer_accept_date TIMESTAMPTZ,
  expected_title_date TIMESTAMPTZ,
  expected_inspection_order_date TIMESTAMPTZ,
  expected_inspection_complete_date TIMESTAMPTZ,
  expected_appraisal_order_date TIMESTAMPTZ,
  expected_appraisal_complete_date TIMESTAMPTZ,
  expected_clear_to_close_date TIMESTAMPTZ,
  expected_closing_scheduled_date TIMESTAMPTZ,
  expected_close_date TIMESTAMPTZ,
  
  -- Actual dates (when things actually happened)
  actual_offer_accept_date TIMESTAMPTZ,
  actual_title_date TIMESTAMPTZ,
  actual_inspection_order_date TIMESTAMPTZ,
  actual_inspection_complete_date TIMESTAMPTZ,
  actual_appraisal_order_date TIMESTAMPTZ,
  actual_appraisal_complete_date TIMESTAMPTZ,
  actual_clear_to_close_date TIMESTAMPTZ,
  actual_closing_scheduled_date TIMESTAMPTZ,
  actual_close_date TIMESTAMPTZ,
  
  -- Metadata
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for fast queries
CREATE INDEX idx_leads_broker_email ON leads(broker_email);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_lead_id ON leads(lead_id);
CREATE INDEX idx_leads_client_name ON leads(client_name);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on both tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Users policies
-- Admins can see all users, brokers can only see themselves
CREATE POLICY "Users are viewable by admins or self"
  ON users FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'admin' 
    OR auth.jwt() ->> 'email' = email
  );

-- Only admins can insert/update/delete users
CREATE POLICY "Only admins can modify users"
  ON users FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Leads policies
-- Brokers can only SELECT their own leads
CREATE POLICY "Brokers can view own leads"
  ON leads FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'admin'
    OR broker_email = auth.jwt() ->> 'email'
  );

-- Admins can do everything with leads
CREATE POLICY "Admins can manage all leads"
  ON leads FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Brokers can update their own leads (for mobile app updates)
CREATE POLICY "Brokers can update own leads"
  ON leads FOR UPDATE
  USING (broker_email = auth.jwt() ->> 'email');

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for leads table (updates last_updated)
CREATE OR REPLACE FUNCTION update_lead_last_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_leads_last_updated
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_last_updated();

-- ============================================
-- REALTIME PUBLICATION
-- ============================================

-- Enable realtime for leads table (so iOS app gets instant updates)
ALTER PUBLICATION supabase_realtime ADD TABLE leads;

-- ============================================
-- INITIAL DATA (Optional - for testing)
-- ============================================

-- Create default admin user
-- Password: AdminPass123! (bcrypt hash below)
INSERT INTO users (email, password_hash, role, full_name, active)
VALUES (
  'admin@realestate.com',
  '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', -- Replace with actual bcrypt hash
  'admin',
  'System Administrator',
  true
);

-- Create default broker user
-- Password: BrokerPass123! (bcrypt hash below)
INSERT INTO users (email, password_hash, role, full_name, active)
VALUES (
  'broker@example.com',
  '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', -- Replace with actual bcrypt hash
  'broker',
  'John Broker',
  true
);

-- ============================================
-- VIEWS (Optional - for analytics)
-- ============================================

-- View for lead statistics
CREATE OR REPLACE VIEW lead_stats AS
SELECT
  status,
  COUNT(*) as count,
  COUNT(DISTINCT broker_email) as unique_brokers
FROM leads
GROUP BY status;

-- View for broker performance
CREATE OR REPLACE VIEW broker_performance AS
SELECT
  broker_email,
  COUNT(*) as total_leads,
  COUNT(*) FILTER (WHERE status = 'Closed') as closed_leads,
  COUNT(*) FILTER (WHERE status = 'Cancelled') as cancelled_leads,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'Closed')::NUMERIC / 
    NULLIF(COUNT(*), 0) * 100, 
    2
  ) as close_rate_percent
FROM leads
GROUP BY broker_email;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant necessary permissions to authenticated users
GRANT SELECT ON lead_stats TO authenticated;
GRANT SELECT ON broker_performance TO authenticated;

-- ============================================
-- COMMENTS (Documentation)
-- ============================================

COMMENT ON TABLE users IS 'User accounts for admins and brokers';
COMMENT ON TABLE leads IS 'Real estate leads with timeline tracking';
COMMENT ON COLUMN leads.lead_id IS 'External lead identifier from Excel upload';
COMMENT ON COLUMN leads.broker_email IS 'Email of assigned broker';
COMMENT ON COLUMN leads.status IS 'Current status in the sales pipeline';
```

4. Click **RUN** (or press Ctrl+Enter)
5. You should see "Success. No rows returned" - this is correct!

---

## 1.5 Verify Schema Creation

1. Click **Table Editor** (left sidebar)
2. You should see two tables:
   - `users`
   - `leads`

3. Click on `leads` table
4. You should see all columns listed

---

## 1.6 Enable Realtime

1. Go to **Database** → **Replication** (left sidebar)
2. Find the `leads` table
3. Toggle **Realtime** to ON (it may already be enabled)
4. This allows iOS app to receive instant updates

---

## 1.7 Configure Storage (Optional - for Excel uploads)

If you want to store uploaded Excel files in Supabase Storage:

1. Go to **Storage** (left sidebar)
2. Click **Create bucket**
3. Name: `excel-uploads`
4. Public: **No** (private bucket)
5. Click **Create bucket**

---

## 1.8 Save Your Credentials

Create a file to save your credentials securely:

```bash
# supabase-credentials.txt (DO NOT COMMIT TO GIT!)

Project Name: real-estate-broking
Project URL: https://xxxxxxxxxxxxx.supabase.co
Database Password: [your-db-password]

API Keys:
---------
anon (public): eyJhbGc...
service_role (secret): eyJhbGc...

Region: us-east-1
Created: 2024-01-22
```

**IMPORTANT**: Add this file to your `.gitignore`!

---

## 1.9 Test Database Connection

Let's verify everything works:

1. In SQL Editor, run this query:

```sql
-- Test query
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('users', 'leads');
```

Expected output:
```
table_name | column_count
-----------+-------------
users      | 8
leads      | 27
```

2. Test RLS policies:

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

Expected output shows `rowsecurity = true` for both tables.

---

## Next Steps

✅ Supabase project created  
✅ Database schema deployed  
✅ RLS policies configured  
✅ Realtime enabled  
✅ Credentials saved  

**You're ready for Step 2: Backend Migration!**

---

## Troubleshooting

### Issue: "Password authentication failed"
- Make sure you saved the database password from project creation
- You can reset it in Settings → Database

### Issue: "Permission denied for table"
- Make sure RLS policies are created
- Check if policies reference correct JWT fields

### Issue: "Table does not exist"
- Verify SQL script ran successfully
- Check for any error messages in SQL Editor

### Issue: "Realtime not working"
- Go to Database → Replication
- Make sure `leads` table has Realtime toggled ON

---

## Security Checklist

- [ ] Database password is strong and saved securely
- [ ] Service role key is not committed to Git
- [ ] RLS policies are enabled on both tables
- [ ] Only necessary permissions granted
- [ ] Realtime only enabled for `leads` table (not `users`)

---

## Resources

- Supabase Dashboard: https://app.supabase.com
- Documentation: https://supabase.com/docs
- SQL Editor: https://supabase.com/docs/guides/database/overview
- Row Level Security: https://supabase.com/docs/guides/auth/row-level-security

---

Ready to proceed? Let me know when you've completed these steps and I'll provide Step 2: Backend Migration code!
