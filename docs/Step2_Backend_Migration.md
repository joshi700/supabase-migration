# Step 2: Backend Migration to Supabase

## Overview

In this step, we'll:
1. Install Supabase client library
2. Replace the JSON database with Supabase
3. Update all route handlers
4. Test the API endpoints

**Estimated Time: 4-6 hours**

---

## 2.1 Install Dependencies

```bash
cd backend
npm install @supabase/supabase-js
```

---

## 2.2 Update Environment Variables

Edit your `backend/.env` file:

```bash
# backend/.env

# Existing variables
NODE_ENV=development
PORT=3001
JWT_SECRET=your-jwt-secret-keep-this-same
FRONTEND_URL=http://localhost:3000

# NEW: Add Supabase credentials
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key...
SUPABASE_ANON_KEY=eyJhbGc...your-anon-key...

# Optional: Feature flag to switch between JSON and Supabase
USE_SUPABASE=true
```

**IMPORTANT**: 
- Replace `xxxxxxxxxxxxx` with your actual project reference
- Use the `service_role` key for backend (has admin privileges)
- Never commit the `.env` file to Git!

---

## 2.3 Create Supabase Client

Create a new file `backend/config/supabase.js`:

```javascript
// backend/config/supabase.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key (for backend use)
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test connection
supabase
  .from('leads')
  .select('count', { count: 'exact', head: true })
  .then(({ count, error }) => {
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
    } else {
      console.log(`✅ Supabase connected successfully (${count} leads in database)`);
    }
  });

export default supabase;
```

---

## 2.4 Update Authentication Route

Replace `backend/routes/auth.js`:

```javascript
// backend/routes/auth.js

import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';

const router = express.Router();

/**
 * POST /api/auth/login
 * Login for both admin and broker users
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Find user by email
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !user) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Check if user is active
    if (!user.active) {
      return res.status(403).json({ 
        error: 'Account is deactivated. Contact administrator.' 
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data (without password hash)
    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user info (requires authentication)
 */
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role, full_name, phone, active')
      .eq('id', decoded.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);

  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
```

---

## 2.5 Update Leads Route

Replace `backend/routes/leads.js`:

```javascript
// backend/routes/leads.js

import express from 'express';
import { authMiddleware, adminOnly } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /api/leads
 * Get all leads (admins) or broker's own leads (brokers)
 */
router.get('/', async (req, res) => {
  try {
    let query = supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    // Brokers can only see their own leads
    if (req.user.role === 'broker') {
      query = query.eq('broker_email', req.user.email);
    }

    // Apply filters if provided
    const { status, search } = req.query;
    
    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(
        `client_name.ilike.%${search}%,property_address.ilike.%${search}%,lead_id.ilike.%${search}%`
      );
    }

    const { data: leads, error } = await query;

    if (error) {
      throw error;
    }

    res.json(leads);

  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ 
      error: 'Failed to fetch leads',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/leads/:id
 * Get a specific lead by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { data: lead, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Brokers can only access their own leads
    if (req.user.role === 'broker' && lead.broker_email !== req.user.email) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(lead);

  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
});

/**
 * PUT /api/leads/:id
 * Update a lead (admin only)
 */
router.put('/:id', adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.id;
    delete updates.created_at;

    const { data: updated, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!updated) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json(updated);

  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ 
      error: 'Failed to update lead',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * DELETE /api/leads/:id
 * Delete a lead (admin only)
 */
router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', req.params.id);

    if (error) {
      throw error;
    }

    res.json({ message: 'Lead deleted successfully' });

  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});

/**
 * GET /api/leads/stats/overview
 * Get lead statistics (admin only)
 */
router.get('/stats/overview', adminOnly, async (req, res) => {
  try {
    // Get counts by status
    const { data: stats, error } = await supabase
      .from('leads')
      .select('status');

    if (error) throw error;

    const breakdown = stats.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      total: stats.length,
      by_status: breakdown
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;
```

---

## 2.6 Update Broker Route

Replace `backend/routes/broker.js`:

```javascript
// backend/routes/broker.js

import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

router.use(authMiddleware);

/**
 * GET /api/broker/leads
 * Get leads assigned to the authenticated broker
 */
router.get('/leads', async (req, res) => {
  try {
    // Only brokers should use this endpoint
    if (req.user.role !== 'broker') {
      return res.status(403).json({ 
        error: 'This endpoint is for brokers only. Admins should use /api/leads' 
      });
    }

    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .eq('broker_email', req.user.email)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json(leads);

  } catch (error) {
    console.error('Error fetching broker leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

/**
 * GET /api/broker/leads/:id
 * Get a specific lead (if assigned to this broker)
 */
router.get('/leads/:id', async (req, res) => {
  try {
    const { data: lead, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', req.params.id)
      .eq('broker_email', req.user.email)
      .single();

    if (error || !lead) {
      return res.status(404).json({ error: 'Lead not found or not assigned to you' });
    }

    res.json(lead);

  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
});

/**
 * GET /api/broker/stats
 * Get broker's personal statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const { data: leads, error } = await supabase
      .from('leads')
      .select('status')
      .eq('broker_email', req.user.email);

    if (error) throw error;

    const stats = {
      total: leads.length,
      by_status: leads.reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
      }, {})
    };

    res.json(stats);

  } catch (error) {
    console.error('Error fetching broker stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;
```

---

## 2.7 Update Upload Route

Replace `backend/routes/upload.js`:

```javascript
// backend/routes/upload.js

import express from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authMiddleware, adminOnly } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'leads-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
    }
  }
});

/**
 * POST /api/upload/excel
 * Upload Excel file with leads (admin only)
 */
router.post('/excel', authMiddleware, adminOnly, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('📁 Processing uploaded file:', req.file.originalname);

    // Read Excel file
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      return res.status(400).json({ error: 'Excel file is empty' });
    }

    console.log(`📊 Found ${jsonData.length} rows in Excel file`);

    // Transform Excel data to match Supabase schema
    const leads = jsonData.map(row => ({
      lead_id: row['Lead ID'] || `LEAD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      broker_email: row['Broker Email'],
      client_name: row['Client Name'],
      property_address: row['Property Address'],
      status: row['Status'] || 'New',
      
      // Expected dates
      expected_offer_accept_date: row['Expected Offer Accept Date'] ? new Date(row['Expected Offer Accept Date']).toISOString() : null,
      expected_title_date: row['Expected Title Date'] ? new Date(row['Expected Title Date']).toISOString() : null,
      expected_inspection_order_date: row['Expected Inspection Order Date'] ? new Date(row['Expected Inspection Order Date']).toISOString() : null,
      expected_inspection_complete_date: row['Expected Inspection Complete Date'] ? new Date(row['Expected Inspection Complete Date']).toISOString() : null,
      expected_appraisal_order_date: row['Expected Appraisal Order Date'] ? new Date(row['Expected Appraisal Order Date']).toISOString() : null,
      expected_appraisal_complete_date: row['Expected Appraisal Complete Date'] ? new Date(row['Expected Appraisal Complete Date']).toISOString() : null,
      expected_clear_to_close_date: row['Expected Clear to Close Date'] ? new Date(row['Expected Clear to Close Date']).toISOString() : null,
      expected_closing_scheduled_date: row['Expected Closing Scheduled Date'] ? new Date(row['Expected Closing Scheduled Date']).toISOString() : null,
      expected_close_date: row['Expected Close Date'] ? new Date(row['Expected Close Date']).toISOString() : null,
      
      // Actual dates
      actual_offer_accept_date: row['Actual Offer Accept Date'] ? new Date(row['Actual Offer Accept Date']).toISOString() : null,
      actual_title_date: row['Actual Title Date'] ? new Date(row['Actual Title Date']).toISOString() : null,
      actual_inspection_order_date: row['Actual Inspection Order Date'] ? new Date(row['Actual Inspection Order Date']).toISOString() : null,
      actual_inspection_complete_date: row['Actual Inspection Complete Date'] ? new Date(row['Actual Inspection Complete Date']).toISOString() : null,
      actual_appraisal_order_date: row['Actual Appraisal Order Date'] ? new Date(row['Actual Appraisal Order Date']).toISOString() : null,
      actual_appraisal_complete_date: row['Actual Appraisal Complete Date'] ? new Date(row['Actual Appraisal Complete Date']).toISOString() : null,
      actual_clear_to_close_date: row['Actual Clear to Close Date'] ? new Date(row['Actual Clear to Close Date']).toISOString() : null,
      actual_closing_scheduled_date: row['Actual Closing Scheduled Date'] ? new Date(row['Actual Closing Scheduled Date']).toISOString() : null,
      actual_close_date: row['Actual Close Date'] ? new Date(row['Actual Close Date']).toISOString() : null,
    }));

    // Validate required fields
    const invalidLeads = leads.filter(lead => !lead.broker_email || !lead.client_name);
    if (invalidLeads.length > 0) {
      return res.status(400).json({ 
        error: 'Some leads are missing required fields (Broker Email, Client Name)',
        invalid_count: invalidLeads.length
      });
    }

    // Insert into Supabase (batch insert)
    const { data: inserted, error } = await supabase
      .from('leads')
      .insert(leads)
      .select();

    if (error) {
      throw error;
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    console.log(`✅ Successfully inserted ${inserted.length} leads into Supabase`);

    res.json({
      message: 'Excel file uploaded and processed successfully',
      leads_imported: inserted.length,
      leads: inserted
    });

  } catch (error) {
    console.error('Error processing Excel upload:', error);
    
    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ 
      error: 'Failed to process Excel file',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/upload/template
 * Download Excel template
 */
router.get('/template', (req, res) => {
  const templatePath = path.join(__dirname, '..', 'leads_template_complete.xlsx');
  
  if (fs.existsSync(templatePath)) {
    res.download(templatePath);
  } else {
    res.status(404).json({ error: 'Template file not found' });
  }
});

export default router;
```

---

## 2.8 Update Users Route

Replace `backend/routes/users.js`:

```javascript
// backend/routes/users.js

import express from 'express';
import bcrypt from 'bcryptjs';
import { authMiddleware, adminOnly } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// All routes require admin privileges
router.use(authMiddleware, adminOnly);

/**
 * GET /api/users
 * Get all users
 */
router.get('/', async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, role, full_name, phone, active, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(users);

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * GET /api/users/:id
 * Get a specific user
 */
router.get('/:id', async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role, full_name, phone, active, created_at')
      .eq('id', req.params.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);

  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * POST /api/users
 * Create a new user
 */
router.post('/', async (req, res) => {
  try {
    const { email, password, role, full_name, phone } = req.body;

    // Validate input
    if (!email || !password || !role) {
      return res.status(400).json({ 
        error: 'Email, password, and role are required' 
      });
    }

    if (!['admin', 'broker'].includes(role)) {
      return res.status(400).json({ 
        error: 'Role must be either "admin" or "broker"' 
      });
    }

    // Check if user already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([{
        email: email.toLowerCase(),
        password_hash,
        role,
        full_name: full_name || null,
        phone: phone || null,
        active: true
      }])
      .select('id, email, role, full_name, phone, active, created_at')
      .single();

    if (error) throw error;

    res.status(201).json(newUser);

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ 
      error: 'Failed to create user',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * PUT /api/users/:id
 * Update a user
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, role, full_name, phone, active } = req.body;

    const updates = {};

    if (email) updates.email = email.toLowerCase();
    if (role) updates.role = role;
    if (full_name !== undefined) updates.full_name = full_name;
    if (phone !== undefined) updates.phone = phone;
    if (active !== undefined) updates.active = active;

    // Hash new password if provided
    if (password) {
      updates.password_hash = await bcrypt.hash(password, 10);
    }

    const { data: updated, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select('id, email, role, full_name, phone, active, created_at')
      .single();

    if (error) throw error;

    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(updated);

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * DELETE /api/users/:id
 * Delete a user
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'User deleted successfully' });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
```

---

## 2.9 Update Timeline Route

Replace `backend/routes/timeline.js`:

```javascript
// backend/routes/timeline.js

import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

router.use(authMiddleware);

/**
 * GET /api/timeline/:leadId
 * Get timeline milestones for a lead
 */
router.get('/:leadId', async (req, res) => {
  try {
    const { data: lead, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', req.params.leadId)
      .single();

    if (error || !lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    // Check permissions
    if (req.user.role === 'broker' && lead.broker_email !== req.user.email) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Build timeline milestones
    const milestones = [
      {
        title: 'Offer Accept',
        expectedDate: lead.expected_offer_accept_date,
        actualDate: lead.actual_offer_accept_date,
        isCompleted: !!lead.actual_offer_accept_date
      },
      {
        title: 'Title',
        expectedDate: lead.expected_title_date,
        actualDate: lead.actual_title_date,
        isCompleted: !!lead.actual_title_date
      },
      {
        title: 'Inspection Order',
        expectedDate: lead.expected_inspection_order_date,
        actualDate: lead.actual_inspection_order_date,
        isCompleted: !!lead.actual_inspection_order_date
      },
      {
        title: 'Inspection Complete',
        expectedDate: lead.expected_inspection_complete_date,
        actualDate: lead.actual_inspection_complete_date,
        isCompleted: !!lead.actual_inspection_complete_date
      },
      {
        title: 'Appraisal Order',
        expectedDate: lead.expected_appraisal_order_date,
        actualDate: lead.actual_appraisal_order_date,
        isCompleted: !!lead.actual_appraisal_order_date
      },
      {
        title: 'Appraisal Complete',
        expectedDate: lead.expected_appraisal_complete_date,
        actualDate: lead.actual_appraisal_complete_date,
        isCompleted: !!lead.actual_appraisal_complete_date
      },
      {
        title: 'Clear to Close',
        expectedDate: lead.expected_clear_to_close_date,
        actualDate: lead.actual_clear_to_close_date,
        isCompleted: !!lead.actual_clear_to_close_date
      },
      {
        title: 'Closing Scheduled',
        expectedDate: lead.expected_closing_scheduled_date,
        actualDate: lead.actual_closing_scheduled_date,
        isCompleted: !!lead.actual_closing_scheduled_date
      },
      {
        title: 'Close Date',
        expectedDate: lead.expected_close_date,
        actualDate: lead.actual_close_date,
        isCompleted: !!lead.actual_close_date
      }
    ];

    res.json({
      leadId: lead.id,
      clientName: lead.client_name,
      propertyAddress: lead.property_address,
      status: lead.status,
      milestones
    });

  } catch (error) {
    console.error('Error fetching timeline:', error);
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
});

export default router;
```

---

## 2.10 Update server.js

Update your `backend/server.js` to import Supabase config:

```javascript
// backend/server.js

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { authMiddleware } from './middleware/auth.js';

// Import Supabase client (this tests the connection on startup)
import './config/supabase.js';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import leadRoutes from './routes/leads.js';
import uploadRoutes from './routes/upload.js';
import brokerRoutes from './routes/broker.js';
import timelineRoutes from './routes/timeline.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.'
});

app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    database: 'Supabase (PostgreSQL)',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/leads', authMiddleware, leadRoutes);
app.use('/api/upload', authMiddleware, uploadRoutes);
app.use('/api/broker', authMiddleware, brokerRoutes);
app.use('/api/timeline', authMiddleware, timelineRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Maximum size is 50MB.' });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║   Real Estate Broking Portal               ║
║   Powered by Supabase                      ║
╚════════════════════════════════════════════╝

🚀 Server running on port ${PORT}
📍 Environment: ${process.env.NODE_ENV || 'development'}
🔗 API: http://localhost:${PORT}
💾 Database: Supabase (PostgreSQL)
⚡ Realtime: Enabled
📱 iOS App Support: Enabled

Ready to accept requests!
  `);
});

export default app;
```

---

## 2.11 Run the Migration Script

Now migrate your existing JSON data:

```bash
cd backend

# Make sure you have the migration script from earlier
# If not, I'll provide it again

# Run the migration
node migrate-to-supabase.js
```

Expected output:
```
🚀 Starting Migration to Supabase...
📊 Migrating Users...
✅ Migrated user: admin@realestate.com (admin)
✅ Migrated user: broker@example.com (broker)
📊 Migrating Leads...
✅ Migrated batch: 100 leads (100/500)
✅ Migrated batch: 100 leads (200/500)
...
✅ Migration completed successfully!
```

---

## 2.12 Test the Backend

Start the server:

```bash
npm start
```

You should see:
```
✅ Supabase connected successfully (500 leads in database)
🚀 Server running on port 3001
```

Test API endpoints:

```bash
# Test login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@realestate.com","password":"AdminPass123!"}'

# Should return:
# {"token":"eyJhbGc...","user":{...}}

# Test getting leads (replace TOKEN with actual token from login)
curl http://localhost:3001/api/leads \
  -H "Authorization: Bearer TOKEN"

# Should return array of leads
```

---

## Testing Checklist

- [ ] Server starts without errors
- [ ] Supabase connection succeeds
- [ ] Login works for admin
- [ ] Login works for broker
- [ ] GET /api/leads returns all leads (admin)
- [ ] GET /api/broker/leads returns only broker's leads
- [ ] Excel upload creates new leads
- [ ] Lead updates work
- [ ] Real-time updates trigger (check Supabase dashboard)

---

## Next Steps

✅ Backend migrated to Supabase  
✅ All routes updated  
✅ Data migrated  

**Ready for Step 3: iOS App Integration!**

---

## Troubleshooting

### "Supabase connection failed"
- Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
- Verify project is not paused in Supabase dashboard

### "Missing Supabase credentials"
- Make sure .env file exists and has correct values
- Restart server after updating .env

### "RLS policy violation"
- Check that JWT contains correct `role` and `email` fields
- Verify RLS policies in Supabase SQL Editor

### "Cannot find module @supabase/supabase-js"
- Run: `npm install @supabase/supabase-js`

---

Let me know when you've completed Step 2 and I'll provide Step 3: iOS Integration!
