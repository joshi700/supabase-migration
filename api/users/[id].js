import bcrypt from 'bcryptjs';
import { supabase } from '../_lib/supabase.js';
import { cors } from '../_lib/cors.js';
import { requireAdmin } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;

  const user = requireAdmin(req, res);
  if (!user) return;

  const { id } = req.query;

  try {
    if (req.method === 'GET') {
      const { data: userData, error } = await supabase
        .from('users')
        .select('id, email, role, full_name, phone, active, created_at')
        .eq('id', id)
        .single();

      if (error || !userData) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json(userData);
    }

    if (req.method === 'PUT') {
      const { email, password, role, full_name, phone, active } = req.body;
      const updates = {};

      if (email) updates.email = email.toLowerCase();
      if (role) updates.role = role;
      if (full_name !== undefined) updates.full_name = full_name;
      if (phone !== undefined) updates.phone = phone;
      if (active !== undefined) updates.active = active;
      if (password) updates.password_hash = await bcrypt.hash(password, 10);

      const { data: updated, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select('id, email, role, full_name, phone, active, created_at')
        .single();

      if (error) throw error;
      if (!updated) return res.status(404).json({ error: 'User not found' });

      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE') {
      if (id === user.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      const { error } = await supabase.from('users').delete().eq('id', id);

      if (error) throw error;
      return res.status(200).json({ message: 'User deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('User error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
}
