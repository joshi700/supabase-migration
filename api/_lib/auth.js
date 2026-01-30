import jwt from 'jsonwebtoken';

export function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
}

export function requireAuth(req, res) {
  const user = verifyToken(req);
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  return user;
}

export function requireAdmin(req, res) {
  const user = requireAuth(req, res);
  if (!user) return null;

  if (user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return null;
  }
  return user;
}
