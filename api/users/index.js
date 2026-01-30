import bcrypt from 'bcryptjs';
import { supabase } from '../_lib/supabase.js';
import { cors } from '../_lib/cors.js';
import { requireAdmin } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;

  const user = requireAdmin(req, res);
  if (!user) return;

  try {
    if (req.method === 'GET') {
      const { data: users, error } = await supabase
        .from('users')
        .select('id, email, role, full_name, phone, active, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json(users);
    }

    if (req.method === 'POST') {
      const { email, password, role, full_name, phone } = req.body;

      if (!email || !password || !role) {
        return res.status(400).json({ error: 'Email, password, and role are required' });
      }

      if (!['admin', 'broker'].includes(role)) {
        return res.status(400).json({ error: 'Role must be either "admin" or "broker"' });
      }

      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();

      if (existing) {
        return res.status(409).json({ error: 'User with this email already exists' });
      }

      const password_hash = await bcrypt.hash(password, 10);

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
      return res.status(201).json(newUser);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Users error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
}
