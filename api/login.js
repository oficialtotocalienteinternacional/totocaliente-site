const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const { setSession } = require('../lib/auth');
let clientPromise;
function getClient() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI no está configurada');
  if (!global._mongoClientPromise) global._mongoClientPromise = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000, maxPoolSize: 5 }).connect();
  return global._mongoClientPromise;
}
module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Método no permitido' }); }
  try {
    const { usuario, password } = req.body || {};
    if (typeof usuario !== 'string' || typeof password !== 'string' || password.length > 128) return res.status(400).json({ error: 'Datos inválidos' });
    const normalized = usuario.trim().replace(/^@/, '');
    if (!/^[a-zA-Z0-9_]{3,24}$/.test(normalized)) return res.status(400).json({ error: 'Usuario o contraseña incorrectos' });
    const db = (await getClient()).db('totocaliente');
    const account = await db.collection('usuarios').findOne({ usuario: normalized });
    if (!account || !account.passwordHash || !(await bcrypt.compare(password, account.passwordHash))) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    setSession(res, normalized);
    return res.status(200).json({ ok: true, usuario: normalized });
  } catch (error) {
    console.error('Error en login:', error.message);
    return res.status(500).json({ error: 'No se pudo iniciar sesión' });
  }
};
