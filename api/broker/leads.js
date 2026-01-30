import { supabase } from '../_lib/supabase.js';
import { cors } from '../_lib/cors.js';
import { requireAuth } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;

  const user = requireAuth(req, res);
  if (!user) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (user.role !== 'broker') {
      return res.status(403).json({ error: 'This endpoint is for brokers only. Admins should use /api/leads' });
    }

    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .eq('broker_email', user.email)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.status(200).json(leads);
  } catch (error) {
    console.error('Broker leads error:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
}
