const { getSession } = require('../lib/auth');

module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ authenticated: false, error: 'Método no permitido' });
  }

  try {
    const session = getSession(req);
    if (!session) return res.status(401).json({ authenticated: false });
    return res.status(200).json({ authenticated: true, usuario: session.usuario });
  } catch (error) {
    console.error('Error verificando sesión:', error.message);
    return res.status(503).json({
      authenticated: false,
      error: 'Servicio de autenticación temporalmente no disponible'
    });
  }
};
