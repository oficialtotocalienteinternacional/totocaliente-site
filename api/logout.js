const { clearSession } = require('../lib/auth');
module.exports = (req, res) => {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Método no permitido' }); }
  clearSession(res);
  return res.status(200).json({ ok: true });
};
