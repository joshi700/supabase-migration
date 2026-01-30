import express from 'express';
import { authMiddleware, adminOnly } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    let query = supabase.from('leads').select('*').order('created_at', { ascending: false });
    if (req.user.role === 'broker') {
      query = query.eq('broker_email', req.user.email);
    }
    const { status, search } = req.query;
    if (status) query = query.eq('status', status);
    if (search) query = query.or(`client_name.ilike.%${search}%,property_address.ilike.%${search}%,lead_id.ilike.%${search}%`);
    const { data: leads, error } = await query;
    if (error) throw error;
    res.json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads', message: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { data: lead, error } = await supabase.from('leads').select('*').eq('id', req.params.id).single();
    if (error || !lead) return res.status(404).json({ error: 'Lead not found' });
    if (req.user.role === 'broker' && lead.broker_email !== req.user.email) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json(lead);
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
});

router.put('/:id', adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    delete updates.id;
    delete updates.created_at;
    const { data: updated, error } = await supabase.from('leads').update(updates).eq('id', id).select().single();
    if (error) throw error;
    if (!updated) return res.status(404).json({ error: 'Lead not found' });
    res.json(updated);
  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ error: 'Failed to update lead', message: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
});

router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const { error } = await supabase.from('leads').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});

export default router;
