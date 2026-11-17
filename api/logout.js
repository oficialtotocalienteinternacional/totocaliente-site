const { clearSession } = require('../lib/auth');
const { sameOrigin } = require('../lib/security');
module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Método no permitido' }); }
  if (!sameOrigin(req)) return res.status(403).json({ error: 'Origen no permitido' });
  clearSession(res);
  return res.status(200).json({ ok: true });
};
