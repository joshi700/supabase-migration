#!/usr/bin/env node

/**
 * Create Initial Users Script
 * 
 * This script creates the default admin and broker users
 * with properly hashed passwords.
 * 
 * Run this AFTER:
 * 1. Supabase schema is created
 * 2. Backend .env is configured
 * 3. Backend dependencies are installed (npm install)
 * 
 * Usage:
 *   node create-initial-users.js
 */

import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createInitialUsers() {
  console.log('🔐 Creating initial users...\n');

  // Hash passwords
  const adminPasswordHash = await bcrypt.hash('AdminPass123!', 10);
  const brokerPasswordHash = await bcrypt.hash('BrokerPass123!', 10);

  // Admin user
  try {
    const { data: admin, error: adminError } = await supabase
      .from('users')
      .insert([{
        email: 'admin@realestate.com',
        password_hash: adminPasswordHash,
        role: 'admin',
        full_name: 'System Administrator',
        active: true
      }])
      .select()
      .single();

    if (adminError) {
      if (adminError.code === '23505') { // Unique constraint violation
        console.log('⚠️  Admin user already exists');
      } else {
        throw adminError;
      }
    } else {
      console.log('✅ Created admin user: admin@realestate.com');
      console.log('   Password: AdminPass123!');
    }
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
  }

  // Broker user
  try {
    const { data: broker, error: brokerError } = await supabase
      .from('users')
      .insert([{
        email: 'broker@example.com',
        password_hash: brokerPasswordHash,
        role: 'broker',
        full_name: 'John Broker',
        active: true
      }])
      .select()
      .single();

    if (brokerError) {
      if (brokerError.code === '23505') {
        console.log('⚠️  Broker user already exists');
      } else {
        throw brokerError;
      }
    } else {
      console.log('✅ Created broker user: broker@example.com');
      console.log('   Password: BrokerPass123!');
    }
  } catch (error) {
    console.error('❌ Error creating broker:', error.message);
  }

  console.log('\n🎉 Initial users setup complete!');
  console.log('\nYou can now login:');
  console.log('  Admin:  admin@realestate.com / AdminPass123!');
  console.log('  Broker: broker@example.com / BrokerPass123!');
}

createInitialUsers()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });