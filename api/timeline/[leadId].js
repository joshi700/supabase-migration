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

  const { leadId } = req.query;

  try {
    const { data: lead, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (error || !lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    if (user.role === 'broker' && lead.broker_email !== user.email) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const milestones = [
      { title: 'Offer Accept', expectedDate: lead.expected_offer_accept_date, actualDate: lead.actual_offer_accept_date, isCompleted: !!lead.actual_offer_accept_date },
      { title: 'Title', expectedDate: lead.expected_title_date, actualDate: lead.actual_title_date, isCompleted: !!lead.actual_title_date },
      { title: 'Inspection Order', expectedDate: lead.expected_inspection_order_date, actualDate: lead.actual_inspection_order_date, isCompleted: !!lead.actual_inspection_order_date },
      { title: 'Inspection Complete', expectedDate: lead.expected_inspection_complete_date, actualDate: lead.actual_inspection_complete_date, isCompleted: !!lead.actual_inspection_complete_date },
      { title: 'Appraisal Order', expectedDate: lead.expected_appraisal_order_date, actualDate: lead.actual_appraisal_order_date, isCompleted: !!lead.actual_appraisal_order_date },
      { title: 'Appraisal Complete', expectedDate: lead.expected_appraisal_complete_date, actualDate: lead.actual_appraisal_complete_date, isCompleted: !!lead.actual_appraisal_complete_date },
      { title: 'Clear to Close', expectedDate: lead.expected_clear_to_close_date, actualDate: lead.actual_clear_to_close_date, isCompleted: !!lead.actual_clear_to_close_date },
      { title: 'Closing Scheduled', expectedDate: lead.expected_closing_scheduled_date, actualDate: lead.actual_closing_scheduled_date, isCompleted: !!lead.actual_closing_scheduled_date },
      { title: 'Close Date', expectedDate: lead.expected_close_date, actualDate: lead.actual_close_date, isCompleted: !!lead.actual_close_date }
    ];

    return res.status(200).json({
      leadId: lead.id,
      clientName: lead.client_name,
      propertyAddress: lead.property_address,
      status: lead.status,
      milestones
    });
  } catch (error) {
    console.error('Timeline error:', error);
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
}
