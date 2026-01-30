import { supabase } from '../_lib/supabase.js';
import { cors } from '../_lib/cors.js';
import { requireAuth, requireAdmin } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;

  const user = requireAuth(req, res);
  if (!user) return;

  const { id } = req.query;

  try {
    if (req.method === 'GET') {
      const { data: lead, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !lead) {
        return res.status(404).json({ error: 'Lead not found' });
      }

      if (user.role === 'broker' && lead.broker_email !== user.email) {
        return res.status(403).json({ error: 'Access denied' });
      }

      return res.status(200).json(lead);
    }

    if (req.method === 'PUT') {
      if (user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const updates = req.body;
      delete updates.id;
      delete updates.created_at;

      const { data: updated, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!updated) return res.status(404).json({ error: 'Lead not found' });

      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE') {
      if (user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { error } = await supabase.from('leads').delete().eq('id', id);

      if (error) throw error;
      return res.status(200).json({ message: 'Lead deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Lead error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
}
