import { supabase } from '../_lib/supabase.js';
import { cors } from '../_lib/cors.js';
import { requireAuth } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;

  const user = requireAuth(req, res);
  if (!user) return;

  try {
    if (req.method === 'GET') {
      let query = supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (user.role === 'broker') {
        query = query.eq('broker_email', user.email);
      }

      const { status, search } = req.query;

      if (status) {
        query = query.eq('status', status);
      }

      if (search) {
        query = query.or(`client_name.ilike.%${search}%,property_address.ilike.%${search}%,lead_id.ilike.%${search}%`);
      }

      const { data: leads, error } = await query;

      if (error) throw error;
      return res.status(200).json(leads);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Leads error:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
}
