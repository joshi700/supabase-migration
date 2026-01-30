import { cors } from './_lib/cors.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;

  res.status(200).json({
    status: 'OK',
    database: 'Supabase (PostgreSQL)',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
}
