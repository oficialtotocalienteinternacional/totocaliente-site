const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const { setSession } = require('../lib/auth');
const { sameOrigin, ensureAuthIndexes, enforceLoginLimit } = require('../lib/security');
function getClient() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI no está configurada');
  if (!global._mongoClientPromise) global._mongoClientPromise = new MongoClient(uri, { serverSelectionTimeoutMS: 5000, maxPoolSize: 5 }).connect();
  return global._mongoClientPromise;
}
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Método no permitido' }); }
  if (!sameOrigin(req)) return res.status(403).json({ error: 'Origen no permitido' });
  try {
    const { usuario, password } = req.body || {};
    if (typeof usuario !== 'string' || typeof password !== 'string' || password.length > 128) return res.status(400).json({ error: 'Datos inválidos' });
    const normalized = usuario.trim().replace(/^@/, '');
    if (!/^[a-zA-Z0-9_]{3,24}$/.test(normalized)) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    const db = (await getClient()).db('totocaliente');
    await ensureAuthIndexes(db);
    if (!(await enforceLoginLimit(db, req, normalized))) {
      res.setHeader('Retry-After', '900');
      return res.status(429).json({ error: 'Demasiados intentos. Espera 15 minutos antes de volver a intentarlo.' });
    }
    const account = await db.collection('usuarios').findOne({ usuario: normalized });
    const valid = account && account.passwordHash && await bcrypt.compare(password, account.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    setSession(res, normalized);
    return res.status(200).json({ ok: true, usuario: normalized });
  } catch (error) {
    console.error('Error en login:', error.message);
    return res.status(500).json({ error: 'No se pudo iniciar sesión' });
  }
};
