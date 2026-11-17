const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const { setSession } = require('../lib/auth');

const uri = process.env.MONGODB_URI;
let clientPromise;

function getClient() {
  if (!uri) throw new Error('MONGODB_URI no está configurada');
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 5
    });
    global._mongoClientPromise = client.connect();
  }
  return global._mongoClientPromise;
}

module.exports = async (req, res) => {
  const allowedOrigin = 'https://totocaliente-site.vercel.app';
  const origin = req.headers.origin;
  if (origin === allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const body = req.body || {};
    const usuario = typeof body.usuario === 'string' ? body.usuario.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!/^[a-zA-Z0-9_]{3,24}$/.test(usuario)) {
      return res.status(400).json({ error: 'El usuario debe tener entre 3 y 24 caracteres alfanuméricos o guion bajo' });
    }
    if (password.length < 12 || password.length > 128) {
      return res.status(400).json({ error: 'La contraseña debe tener entre 12 y 128 caracteres' });
    }
    if (!uri) return res.status(503).json({ error: 'Servicio temporalmente no disponible' });

    const connection = await getClient();
    const collection = connection.db('totocaliente').collection('usuarios');
    const exists = await collection.findOne({ usuario }, { projection: { _id: 1 } });
    if (exists) return res.status(409).json({ error: 'El apodo ya existe' });

    const passwordHash = await bcrypt.hash(password, 12);
    await collection.insertOne({
      usuario,
      passwordHash,
      fechaRegistro: new Date()
    });

    setSession(res, usuario);
    return res.status(201).json({ ok: true, usuario });
  } catch (error) {
    console.error('Error en registro:', error.message);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
