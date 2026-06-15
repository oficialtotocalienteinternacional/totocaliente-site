// api/usuarios.js
// Backend serverless para Vercel usando almacenamiento interno temporal o persistente

let usuariosRegistrados = []; // Nota: En entornos Serverless puros se recomienda conectar a MongoDB o Vercel KV.

export default async function handler(req, res) {
    // Permitir cabeceras de origen (CORS)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'GET') {
        // Devuelve el número total real de la lista de registrados
        // Usamos una base inicial de tu red (ej. 1,420 usuarios iniciales) + los nuevos registrados
        const totalReal = 1420 + usuariosRegistrados.length;
        return res.status(200).json({ total: totalReal });
    }

    if (req.method === 'POST') {
        const { usuario, password } = req.body;

        if (!usuario || !password) {
            return res.status(400).json({ error: 'Faltan datos de registro.' });
        }

        // Comprobar si el apodo ya existe
        const existe = usuariosRegistrados.find(u => u.usuario.toLowerCase() === usuario.toLowerCase());
        if (existe) {
            return res.status(400).json({ error: 'Ese apodo ya está registrado.' });
        }

        // Guardar usuario en el registro activo
        usuariosRegistrados.push({
            usuario,
            password, // En producciones masivas se encripta con bcrypt
            fecha: new Date()
        });

        const totalReal = 1420 + usuariosRegistrados.length;
        return res.status(200).json({ success: true, total: totalReal });
    }

    return res.status(405).json({ error: 'Método no permitido.' });
}
