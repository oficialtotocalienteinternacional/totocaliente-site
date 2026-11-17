const crypto = require('crypto');

const COOKIE_NAME = 'toto_session';
const MAX_AGE = 60 * 60 * 24 * 7;

function secret() {
  const value = process.env.AUTH_SECRET || process.env.MONGODB_URI;
  if (!value) throw new Error('AUTH_SECRET no está configurado');
  return crypto.createHash('sha256').update(value).digest();
}
function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  return body + '.' + sig;
}
function verify(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const expected = crypto.createHmac('sha256', secret()).update(parts[0]).digest();
  let actual;
  try { actual = Buffer.from(parts[1], 'base64url'); } catch (_) { return null; }
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    if (!data.usuario || !Number.isFinite(data.exp) || data.exp < Date.now()) return null;
    return { usuario: data.usuario };
  } catch (_) { return null; }
}
function cookieOptions(maxAge) {
  return `${COOKIE_NAME}=${maxAge ? '' : ''}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}
function setSession(res, usuario) {
  const token = sign({ usuario, exp: Date.now() + MAX_AGE * 1000 });
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`);
}
function clearSession(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
}
function getSession(req) {
  const raw = req.headers.cookie || '';
  const entry = raw.split(';').map(x => x.trim()).find(x => x.startsWith(COOKIE_NAME + '='));
  return entry ? verify(entry.slice(COOKIE_NAME.length + 1)) : null;
}
module.exports = { setSession, clearSession, getSession };
