const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const { setSession } = require('../lib/auth');
const { sameOrigin, ensureAuthIndexes } = require('../lib/security');
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
    const body = req.body || {};
    const usuario = typeof body.usuario === 'string' ? body.usuario.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!/^[a-zA-Z0-9_]{3,24}$/.test(usuario)) return res.status(400).json({ error: 'El usuario debe tener entre 3 y 24 caracteres alfanuméricos o guion bajo' });
    if (password.length < 12 || password.length > 128) return res.status(400).json({ error: 'La contraseña debe tener entre 12 y 128 caracteres' });
    const db = (await getClient()).db('totocaliente');
    await ensureAuthIndexes(db);
    const passwordHash = await bcrypt.hash(password, 12);
    await db.collection('usuarios').insertOne({ usuario, passwordHash, fechaRegistro: new Date() });
    setSession(res, usuario);
    return res.status(201).json({ ok: true, usuario });
  } catch (error) {
    if (error && error.code === 11000) return res.status(409).json({ error: 'El apodo ya existe' });
    console.error('Error en registro:', error.message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
