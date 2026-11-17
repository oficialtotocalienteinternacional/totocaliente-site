const crypto = require('crypto');

function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return false;
  try {
    const parsed = new URL(origin);
    return parsed.protocol === 'https:' && parsed.host === req.headers.host;
  } catch (_) {
    return false;
  }
}

async function ensureAuthIndexes(db) {
  if (!global._totoAuthIndexesPromise) {
    global._totoAuthIndexesPromise = Promise.all([
      db.collection('usuarios').createIndex({ usuario: 1 }, { unique: true, name: 'uniq_usuario' }),
      db.collection('auth_rate_limits').createIndex({ key: 1 }, { unique: true, name: 'uniq_auth_rate_key' }),
      db.collection('auth_rate_limits').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'ttl_auth_rate_limits' })
    ]).catch(error => {
      global._totoAuthIndexesPromise = null;
      throw error;
    });
  }
  return global._totoAuthIndexesPromise;
}

async function enforceLoginLimit(db, req, usuario) {
  const windowMs = 15 * 60 * 1000;
  const now = Date.now();
  const bucket = Math.floor(now / windowMs);
  const forwarded = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || 'unknown';
  const ip = String(forwarded).split(',')[0].trim();
  const key = crypto.createHash('sha256').update(ip + ':' + usuario.toLowerCase() + ':' + bucket).digest('hex');
  const collection = db.collection('auth_rate_limits');
  await collection.updateOne(
    { key },
    { $inc: { attempts: 1 }, $setOnInsert: { expiresAt: new Date((bucket + 2) * windowMs) } },
    { upsert: true }
  );
  const record = await collection.findOne({ key }, { projection: { attempts: 1 } });
  return !(record && record.attempts > 8);
}

module.exports = { sameOrigin, ensureAuthIndexes, enforceLoginLimit };
