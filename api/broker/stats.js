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
    const { data: leads, error } = await supabase
      .from('leads')
      .select('status')
      .eq('broker_email', user.email);

    if (error) throw error;

    const stats = {
      total: leads.length,
      by_status: leads.reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
      }, {})
    };

    return res.status(200).json(stats);
  } catch (error) {
    console.error('Broker stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
}
