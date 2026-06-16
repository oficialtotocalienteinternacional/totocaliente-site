const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://totocalienteinternacionalbooking_db_user:5lcXpMT3yBXDrgAc@cluster0.1fzqg8u.mongodb.net/totocaliente?appName=Cluster0";

module.exports = async (req, res) => {
  // Contraseña de seguridad para que solo TÚ puedas ver los logs de contraseñas
  const { claveAdmin } = req.query;
  if (claveAdmin !== "TuClaveSecreta777") { 
    return res.status(403).json({ error: "Acceso denegado. No eres el administrador." });
  }

  try {
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('totocaliente');
    const collection = db.collection('usuarios');

    // Trae todos los usuarios con sus credenciales y fechas
    const listaUsuarios = await collection.find({}).toArray();

    return res.status(200).json({
      total: listaUsuarios.length,
      usuarios: listaUsuarios.map(u => ({
        usuario: u.usuario,
        password: u.password, // Aquí ves la clave si se le olvidó al usuario
        registrado: u.fechaRegistro
      }))
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
