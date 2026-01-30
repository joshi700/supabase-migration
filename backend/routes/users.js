import express from 'express';
import bcrypt from 'bcryptjs';
import { authMiddleware, adminOnly } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();
router.use(authMiddleware, adminOnly);

router.get('/', async (req, res) => {
  try {
    const { data: users, error } = await supabase.from('users').select('id, email, role, full_name, phone, active, created_at').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { data: user, error } = await supabase.from('users').select('id, email, role, full_name, phone, active, created_at').eq('id', req.params.id).single();
    if (error || !user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { email, password, role, full_name, phone } = req.body;
    if (!email || !password || !role) return res.status(400).json({ error: 'Email, password, and role are required' });
    if (!['admin', 'broker'].includes(role)) return res.status(400).json({ error: 'Role must be either "admin" or "broker"' });
    const { data: existing } = await supabase.from('users').select('id').eq('email', email.toLowerCase()).single();
    if (existing) return res.status(409).json({ error: 'User with this email already exists' });
    const password_hash = await bcrypt.hash(password, 10);
    const { data: newUser, error } = await supabase.from('users').insert([{ email: email.toLowerCase(), password_hash, role, full_name: full_name || null, phone: phone || null, active: true }]).select('id, email, role, full_name, phone, active, created_at').single();
    if (error) throw error;
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user', message: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, role, full_name, phone, active } = req.body;
    const updates = {};
    if (email) updates.email = email.toLowerCase();
    if (role) updates.role = role;
    if (full_name !== undefined) updates.full_name = full_name;
    if (phone !== undefined) updates.phone = phone;
    if (active !== undefined) updates.active = active;
    if (password) updates.password_hash = await bcrypt.hash(password, 10);
    const { data: updated, error } = await supabase.from('users').update(updates).eq('id', id).select('id, email, role, full_name, phone, active, created_at').single();
    if (error) throw error;
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json(updated);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account' });
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
