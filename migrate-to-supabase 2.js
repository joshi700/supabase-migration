#!/usr/bin/env node

/**
 * Data Migration Script - JSON to Supabase
 * 
 * This script migrates existing users and leads from JSON files
 * to your new Supabase database.
 * 
 * Usage:
 *   1. Install dependencies: npm install @supabase/supabase-js dotenv
 *   2. Set environment variables in .env file
 *   3. Run: node migrate-to-supabase.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for admin access

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Paths to JSON files
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');

/**
 * Load JSON data from file
 */
function loadJSONFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error(`❌ Error reading ${filePath}:`, error.message);
    return [];
  }
}

/**
 * Transform user data to match Supabase schema
 */
function transformUser(user) {
  return {
    // Map old fields to new schema
    email: user.email,
    password_hash: user.password, // Already hashed in JSON
    role: user.role || 'broker',
    full_name: user.name || user.fullName || null,
    phone: user.phone || null,
    active: user.active !== undefined ? user.active : true,
  };
}

/**
 * Transform lead data to match Supabase schema
 */
function transformLead(lead) {
  // Helper to parse dates (handles both ISO strings and null/undefined)
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date.toISOString();
    } catch {
      return null;
    }
  };

  return {
    // Remove old _id, let Supabase generate new UUID
    lead_id: lead['Lead ID'] || lead.leadID || lead.lead_id || `LEAD-${Date.now()}`,
    broker_email: lead['Broker Email'] || lead.brokerEmail || lead.broker_email,
    client_name: lead['Client Name'] || lead.clientName || lead.client_name || 'Unknown',
    property_address: lead['Property Address'] || lead.propertyAddress || lead.property_address || 'Unknown',
    status: lead['Status'] || lead.status || 'New',
    
    // Expected dates
    expected_offer_accept_date: parseDate(lead['Expected Offer Accept Date']),
    expected_title_date: parseDate(lead['Expected Title Date']),
    expected_inspection_order_date: parseDate(lead['Expected Inspection Order Date']),
    expected_inspection_complete_date: parseDate(lead['Expected Inspection Complete Date']),
    expected_appraisal_order_date: parseDate(lead['Expected Appraisal Order Date']),
    expected_appraisal_complete_date: parseDate(lead['Expected Appraisal Complete Date']),
    expected_clear_to_close_date: parseDate(lead['Expected Clear to Close Date']),
    expected_closing_scheduled_date: parseDate(lead['Expected Closing Scheduled Date']),
    expected_close_date: parseDate(lead['Expected Close Date']),
    
    // Actual dates
    actual_offer_accept_date: parseDate(lead['Actual Offer Accept Date']),
    actual_title_date: parseDate(lead['Actual Title Date']),
    actual_inspection_order_date: parseDate(lead['Actual Inspection Order Date']),
    actual_inspection_complete_date: parseDate(lead['Actual Inspection Complete Date']),
    actual_appraisal_order_date: parseDate(lead['Actual Appraisal Order Date']),
    actual_appraisal_complete_date: parseDate(lead['Actual Appraisal Complete Date']),
    actual_clear_to_close_date: parseDate(lead['Actual Clear to Close Date']),
    actual_closing_scheduled_date: parseDate(lead['Actual Closing Scheduled Date']),
    actual_close_date: parseDate(lead['Actual Close Date']),
    
    // Metadata
    last_updated: parseDate(lead['Last Updated'] || lead.lastUpdated) || new Date().toISOString(),
  };
}

/**
 * Migrate users to Supabase
 */
async function migrateUsers() {
  console.log('\n📊 Migrating Users...');
  
  const users = loadJSONFile(USERS_FILE);
  
  if (users.length === 0) {
    console.log('⚠️  No users found in JSON file');
    return { success: 0, failed: 0 };
  }

  console.log(`Found ${users.length} users to migrate`);
  
  let success = 0;
  let failed = 0;

  for (const user of users) {
    try {
      const transformedUser = transformUser(user);
      
      // Check if user already exists
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', transformedUser.email)
        .single();

      if (existing) {
        console.log(`⚠️  User ${transformedUser.email} already exists, skipping`);
        continue;
      }

      // Insert user
      const { error } = await supabase
        .from('users')
        .insert([transformedUser]);

      if (error) {
        console.error(`❌ Failed to insert user ${transformedUser.email}:`, error.message);
        failed++;
      } else {
        console.log(`✅ Migrated user: ${transformedUser.email} (${transformedUser.role})`);
        success++;
      }
    } catch (error) {
      console.error(`❌ Error processing user:`, error.message);
      failed++;
    }
  }

  return { success, failed };
}

/**
 * Migrate leads to Supabase
 */
async function migrateLeads() {
  console.log('\n📊 Migrating Leads...');
  
  const leads = loadJSONFile(LEADS_FILE);
  
  if (leads.length === 0) {
    console.log('⚠️  No leads found in JSON file');
    return { success: 0, failed: 0 };
  }

  console.log(`Found ${leads.length} leads to migrate`);
  
  let success = 0;
  let failed = 0;

  // Batch insert for better performance (max 1000 per batch)
  const BATCH_SIZE = 100;
  
  for (let i = 0; i < leads.length; i += BATCH_SIZE) {
    const batch = leads.slice(i, i + BATCH_SIZE);
    const transformedLeads = batch.map(transformLead).filter(lead => {
      // Validate required fields
      if (!lead.broker_email || !lead.client_name) {
        console.log(`⚠️  Skipping invalid lead: ${lead.lead_id}`);
        failed++;
        return false;
      }
      return true;
    });

    if (transformedLeads.length === 0) continue;

    try {
      const { data, error } = await supabase
        .from('leads')
        .insert(transformedLeads)
        .select();

      if (error) {
        console.error(`❌ Failed to insert batch:`, error.message);
        failed += transformedLeads.length;
      } else {
        success += transformedLeads.length;
        console.log(`✅ Migrated batch: ${transformedLeads.length} leads (${i + transformedLeads.length}/${leads.length})`);
      }
    } catch (error) {
      console.error(`❌ Error inserting batch:`, error.message);
      failed += transformedLeads.length;
    }
  }

  return { success, failed };
}

/**
 * Verify migration
 */
async function verifyMigration() {
  console.log('\n🔍 Verifying Migration...');
  
  try {
    // Count users
    const { count: userCount, error: userError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (userError) {
      console.error('❌ Error counting users:', userError.message);
    } else {
      console.log(`✅ Total users in Supabase: ${userCount}`);
    }

    // Count leads
    const { count: leadCount, error: leadError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true });

    if (leadError) {
      console.error('❌ Error counting leads:', leadError.message);
    } else {
      console.log(`✅ Total leads in Supabase: ${leadCount}`);
    }

    // Show lead breakdown by status
    const { data: statusBreakdown, error: statusError } = await supabase
      .from('leads')
      .select('status')
      .then(({ data }) => {
        const breakdown = {};
        data?.forEach(lead => {
          breakdown[lead.status] = (breakdown[lead.status] || 0) + 1;
        });
        return { data: breakdown };
      });

    if (!statusError && statusBreakdown) {
      console.log('\n📊 Leads by Status:');
      Object.entries(statusBreakdown).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });
    }

  } catch (error) {
    console.error('❌ Error during verification:', error.message);
  }
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('🚀 Starting Migration to Supabase...');
  console.log(`   Supabase URL: ${supabaseUrl}`);
  console.log(`   Data Directory: ${DATA_DIR}\n`);

  // Check if data files exist
  if (!fs.existsSync(USERS_FILE)) {
    console.log('⚠️  users.json not found, skipping user migration');
  }
  if (!fs.existsSync(LEADS_FILE)) {
    console.log('⚠️  leads.json not found, skipping lead migration');
  }

  const startTime = Date.now();

  // Migrate users first (since leads reference broker emails)
  const userResults = await migrateUsers();
  
  // Then migrate leads
  const leadResults = await migrateLeads();

  // Verify results
  await verifyMigration();

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(50));
  console.log(`Users: ${userResults.success} succeeded, ${userResults.failed} failed`);
  console.log(`Leads: ${leadResults.success} succeeded, ${leadResults.failed} failed`);
  console.log(`Duration: ${duration}s`);
  console.log('='.repeat(50) + '\n');

  if (userResults.failed > 0 || leadResults.failed > 0) {
    console.log('⚠️  Some records failed to migrate. Check the logs above for details.');
    process.exit(1);
  } else {
    console.log('✅ Migration completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Verify data in Supabase dashboard');
    console.log('   2. Update backend to use Supabase');
    console.log('   3. Test API endpoints');
    console.log('   4. Update iOS app\n');
  }
}

// Run migration
migrate().catch(error => {
  console.error('❌ Fatal error during migration:', error);
  process.exit(1);
});
