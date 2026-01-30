import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // 1. Create Users
    console.log('👥 Creating users...');
    
    const adminPassword = await bcrypt.hash('admin123', 10);
    const brokerPassword = await bcrypt.hash('broker123', 10);

    const users = [
      {
        email: 'admin@realestate.com',
        password_hash: adminPassword,
        role: 'admin',
        full_name: 'Admin User',
        phone: '+1-555-0100',
        active: true
      },
      {
        email: 'broker1@realestate.com',
        password_hash: brokerPassword,
        role: 'broker',
        full_name: 'John Broker',
        phone: '+1-555-0101',
        active: true
      },
      {
        email: 'broker2@realestate.com',
        password_hash: brokerPassword,
        role: 'broker',
        full_name: 'Sarah Johnson',
        phone: '+1-555-0102',
        active: true
      }
    ];

    // Check if users already exist
    const { data: existingUsers } = await supabase
      .from('users')
      .select('email');

    const existingEmails = existingUsers?.map(u => u.email) || [];

    for (const user of users) {
      if (!existingEmails.includes(user.email)) {
        const { error } = await supabase.from('users').insert(user);
        if (error) {
          console.error(`  ❌ Failed to create ${user.email}:`, error.message);
        } else {
          console.log(`  ✅ Created user: ${user.email} (password: ${user.role}123)`);
        }
      } else {
        console.log(`  ⏭️  User already exists: ${user.email}`);
      }
    }

    // 2. Create Sample Leads
    console.log('\n📋 Creating sample leads...');

    const leads = [
      {
        lead_id: 'L2026-001',
        broker_email: 'broker1@realestate.com',
        client_name: 'Michael Rodriguez',
        property_address: '123 Oak Street, San Francisco, CA 94102',
        status: 'New',
        expected_offer_accept_date: '2026-02-01T00:00:00Z',
        expected_title_date: '2026-02-08T00:00:00Z',
        expected_inspection_order_date: '2026-02-12T00:00:00Z',
        expected_inspection_complete_date: '2026-02-19T00:00:00Z',
        expected_appraisal_order_date: '2026-02-20T00:00:00Z',
        expected_appraisal_complete_date: '2026-02-27T00:00:00Z',
        expected_clear_to_close_date: '2026-03-03T00:00:00Z',
        expected_closing_scheduled_date: '2026-03-05T00:00:00Z',
        expected_close_date: '2026-03-08T00:00:00Z',
        last_updated: new Date().toISOString()
      },
      {
        lead_id: 'L2026-002',
        broker_email: 'broker1@realestate.com',
        client_name: 'Emily Chen',
        property_address: '456 Pine Avenue, Los Angeles, CA 90012',
        status: 'Processing',
        expected_offer_accept_date: '2026-01-20T00:00:00Z',
        expected_title_date: '2026-01-27T00:00:00Z',
        expected_inspection_order_date: '2026-01-30T00:00:00Z',
        expected_inspection_complete_date: '2026-02-05T00:00:00Z',
        expected_appraisal_order_date: '2026-02-06T00:00:00Z',
        expected_appraisal_complete_date: '2026-02-13T00:00:00Z',
        expected_clear_to_close_date: '2026-02-17T00:00:00Z',
        expected_closing_scheduled_date: '2026-02-19T00:00:00Z',
        expected_close_date: '2026-02-22T00:00:00Z',
        actual_offer_accept_date: '2026-01-20T00:00:00Z',
        actual_title_date: '2026-01-27T00:00:00Z',
        last_updated: new Date().toISOString()
      },
      {
        lead_id: 'L2026-003',
        broker_email: 'broker2@realestate.com',
        client_name: 'David Williams',
        property_address: '789 Maple Drive, San Diego, CA 92101',
        status: 'Inspection',
        expected_offer_accept_date: '2026-01-15T00:00:00Z',
        expected_title_date: '2026-01-22T00:00:00Z',
        expected_inspection_order_date: '2026-01-25T00:00:00Z',
        expected_inspection_complete_date: '2026-02-01T00:00:00Z',
        expected_appraisal_order_date: '2026-02-02T00:00:00Z',
        expected_appraisal_complete_date: '2026-02-09T00:00:00Z',
        expected_clear_to_close_date: '2026-02-13T00:00:00Z',
        expected_closing_scheduled_date: '2026-02-15T00:00:00Z',
        expected_close_date: '2026-02-18T00:00:00Z',
        actual_offer_accept_date: '2026-01-15T00:00:00Z',
        actual_title_date: '2026-01-22T00:00:00Z',
        actual_inspection_order_date: '2026-01-25T00:00:00Z',
        last_updated: new Date().toISOString()
      },
      {
        lead_id: 'L2026-004',
        broker_email: 'broker2@realestate.com',
        client_name: 'Jessica Martinez',
        property_address: '321 Elm Court, Sacramento, CA 95814',
        status: 'Appraisal',
        expected_offer_accept_date: '2026-01-10T00:00:00Z',
        expected_title_date: '2026-01-17T00:00:00Z',
        expected_inspection_order_date: '2026-01-20T00:00:00Z',
        expected_inspection_complete_date: '2026-01-26T00:00:00Z',
        expected_appraisal_order_date: '2026-01-27T00:00:00Z',
        expected_appraisal_complete_date: '2026-02-03T00:00:00Z',
        expected_clear_to_close_date: '2026-02-07T00:00:00Z',
        expected_closing_scheduled_date: '2026-02-10T00:00:00Z',
        expected_close_date: '2026-02-12T00:00:00Z',
        actual_offer_accept_date: '2026-01-10T00:00:00Z',
        actual_title_date: '2026-01-17T00:00:00Z',
        actual_inspection_order_date: '2026-01-20T00:00:00Z',
        actual_inspection_complete_date: '2026-01-26T00:00:00Z',
        actual_appraisal_order_date: '2026-01-27T00:00:00Z',
        last_updated: new Date().toISOString()
      },
      {
        lead_id: 'L2026-005',
        broker_email: 'broker1@realestate.com',
        client_name: 'Robert Taylor',
        property_address: '567 Birch Lane, Oakland, CA 94612',
        status: 'Clear to Close',
        expected_offer_accept_date: '2026-01-05T00:00:00Z',
        expected_title_date: '2026-01-12T00:00:00Z',
        expected_inspection_order_date: '2026-01-15T00:00:00Z',
        expected_inspection_complete_date: '2026-01-21T00:00:00Z',
        expected_appraisal_order_date: '2026-01-22T00:00:00Z',
        expected_appraisal_complete_date: '2026-01-29T00:00:00Z',
        expected_clear_to_close_date: '2026-02-02T00:00:00Z',
        expected_closing_scheduled_date: '2026-02-04T00:00:00Z',
        expected_close_date: '2026-02-07T00:00:00Z',
        actual_offer_accept_date: '2026-01-05T00:00:00Z',
        actual_title_date: '2026-01-12T00:00:00Z',
        actual_inspection_order_date: '2026-01-15T00:00:00Z',
        actual_inspection_complete_date: '2026-01-21T00:00:00Z',
        actual_appraisal_order_date: '2026-01-22T00:00:00Z',
        actual_appraisal_complete_date: '2026-01-29T00:00:00Z',
        actual_clear_to_close_date: '2026-02-02T00:00:00Z',
        last_updated: new Date().toISOString()
      }
    ];

    // Check if leads already exist
    const { data: existingLeads } = await supabase
      .from('leads')
      .select('lead_id');

    const existingLeadIds = existingLeads?.map(l => l.lead_id) || [];

    for (const lead of leads) {
      if (!existingLeadIds.includes(lead.lead_id)) {
        const { error } = await supabase.from('leads').insert(lead);
        if (error) {
          console.error(`  ❌ Failed to create ${lead.lead_id}:`, error.message);
        } else {
          console.log(`  ✅ Created lead: ${lead.lead_id} - ${lead.client_name} (${lead.status})`);
        }
      } else {
        console.log(`  ⏭️  Lead already exists: ${lead.lead_id}`);
      }
    }

    console.log('\n✨ Database seeding completed!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 LOGIN CREDENTIALS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('👤 Admin Account:');
    console.log('   Email: admin@realestate.com');
    console.log('   Password: admin123');
    console.log('');
    console.log('👤 Broker Account 1:');
    console.log('   Email: broker1@realestate.com');
    console.log('   Password: broker123');
    console.log('');
    console.log('👤 Broker Account 2:');
    console.log('   Email: broker2@realestate.com');
    console.log('   Password: broker123');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('   1. Start the backend: npm start');
    console.log('   2. Start the frontend: cd ../frontend && npm start');
    console.log('   3. Login with one of the accounts above');
    console.log('   4. Use iOS app with broker accounts');
    console.log('');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();