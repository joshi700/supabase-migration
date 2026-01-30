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

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'leads-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) cb(null, true);
    else cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
  }
});

router.post('/excel', authMiddleware, adminOnly, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    console.log('📁 Processing uploaded file:', req.file.originalname);
    
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames.find(name => name.toLowerCase() !== 'instructions') || workbook.SheetNames[0];
    console.log('📄 Using sheet:', sheetName);
    
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet, { raw: false, dateNF: 'yyyy-mm-dd' });
    
    if (jsonData.length === 0) return res.status(400).json({ error: 'Excel file is empty' });
    console.log(`📊 Found ${jsonData.length} rows in Excel file`);
    
    // Helper function to parse dates safely
    const parseExcelDate = (dateValue) => {
      if (!dateValue || dateValue === '') return null;
      
      try {
        // If it's already a Date object
        if (dateValue instanceof Date) {
          return dateValue.toISOString();
        }
        
        // If it's a string
        if (typeof dateValue === 'string') {
          // Try parsing YYYY-MM-DD format
          const date = new Date(dateValue);
          if (!isNaN(date.getTime())) {
            return date.toISOString();
          }
        }
        
        // If it's a number (Excel serial date)
        if (typeof dateValue === 'number') {
          const excelEpoch = new Date(1899, 11, 30); // Excel's epoch
          const date = new Date(excelEpoch.getTime() + dateValue * 86400000);
          if (!isNaN(date.getTime())) {
            return date.toISOString();
          }
        }
        
        return null;
      } catch (error) {
        console.warn(`⚠️ Failed to parse date: ${dateValue}`, error.message);
        return null;
      }
    };
    
    const leads = jsonData.map((row, index) => {
      const lead = {
        lead_id: row['Lead ID'] || `LEAD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        broker_email: row['Broker Email']?.trim(),
        client_name: row['Client Name']?.trim(),
        property_address: row['Property Address']?.trim(),
        status: row['Status']?.trim() || 'New',
        expected_offer_accept_date: parseExcelDate(row['Expected Offer Accept Date']),
        expected_title_date: parseExcelDate(row['Expected Title Date']),
        expected_inspection_order_date: parseExcelDate(row['Expected Inspection Order Date']),
        expected_inspection_complete_date: parseExcelDate(row['Expected Inspection Complete Date']),
        expected_appraisal_order_date: parseExcelDate(row['Expected Appraisal Order Date']),
        expected_appraisal_complete_date: parseExcelDate(row['Expected Appraisal Complete Date']),
        expected_clear_to_close_date: parseExcelDate(row['Expected Clear to Close Date']),
        expected_closing_scheduled_date: parseExcelDate(row['Expected Closing Scheduled Date']),
        expected_close_date: parseExcelDate(row['Expected Close Date']),
        actual_offer_accept_date: parseExcelDate(row['Actual Offer Accept Date']),
        actual_title_date: parseExcelDate(row['Actual Title Date']),
        actual_inspection_order_date: parseExcelDate(row['Actual Inspection Order Date']),
        actual_inspection_complete_date: parseExcelDate(row['Actual Inspection Complete Date']),
        actual_appraisal_order_date: parseExcelDate(row['Actual Appraisal Order Date']),
        actual_appraisal_complete_date: parseExcelDate(row['Actual Appraisal Complete Date']),
        actual_clear_to_close_date: parseExcelDate(row['Actual Clear to Close Date']),
        actual_closing_scheduled_date: parseExcelDate(row['Actual Closing Scheduled Date']),
        actual_close_date: parseExcelDate(row['Actual Close Date']),
      };
      
      // Log if missing required fields
      if (!lead.broker_email || !lead.client_name) {
        console.warn(`⚠️ Row ${index + 2} missing required fields:`, {
          lead_id: lead.lead_id,
          broker_email: lead.broker_email || 'MISSING',
          client_name: lead.client_name || 'MISSING'
        });
      }
      
      return lead;
    });
    
    const invalidLeads = leads.filter(lead => !lead.broker_email || !lead.client_name);
    
    if (invalidLeads.length > 0) {
      console.error(`❌ ${invalidLeads.length} leads have missing required fields`);
      return res.status(400).json({ 
        error: 'Some leads are missing required fields (Broker Email, Client Name)', 
        invalid_count: invalidLeads.length,
        invalid_lead_ids: invalidLeads.map(l => l.lead_id),
        hint: 'Check that all rows have Broker Email and Client Name filled in'
      });
    }
    
    const { data: inserted, error } = await supabase.from('leads').insert(leads).select();
    
    if (error) {
      console.error('❌ Supabase insert error:', error);
      throw error;
    }
    
    fs.unlinkSync(req.file.path);
    console.log(`✅ Successfully inserted ${inserted.length} leads into Supabase`);
    res.json({ 
      message: 'Excel file uploaded and processed successfully', 
      leads_imported: inserted.length, 
      leads: inserted 
    });
  } catch (error) {
    console.error('❌ Error processing Excel upload:', error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ 
      error: 'Failed to process Excel file', 
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      details: error.message
    });
  }
});

router.get('/template', (req, res) => {
  const templatePath = path.join(__dirname, '..', 'leads_template_complete.xlsx');
  if (fs.existsSync(templatePath)) res.download(templatePath);
  else res.status(404).json({ error: 'Template file not found' });
});

export default router;