import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/leads', async (req, res) => {
  try {
    if (req.user.role !== 'broker') {
      return res.status(403).json({ error: 'This endpoint is for brokers only. Admins should use /api/leads' });
    }
    const { data: leads, error } = await supabase.from('leads').select('*').eq('broker_email', req.user.email).order('created_at', { ascending: false });
    if (error) throw error;
    res.json(leads);
  } catch (error) {
    console.error('Error fetching broker leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

router.get('/leads/:id', async (req, res) => {
  try {
    const { data: lead, error } = await supabase.from('leads').select('*').eq('id', req.params.id).eq('broker_email', req.user.email).single();
    if (error || !lead) return res.status(404).json({ error: 'Lead not found or not assigned to you' });
    res.json(lead);
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const { data: leads, error } = await supabase.from('leads').select('status').eq('broker_email', req.user.email);
    if (error) throw error;
    const stats = { total: leads.length, by_status: leads.reduce((acc, lead) => { acc[lead.status] = (acc[lead.status] || 0) + 1; return acc; }, {}) };
    res.json(stats);
  } catch (error) {
    console.error('Error fetching broker stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;
