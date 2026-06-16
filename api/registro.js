const { MongoClient } = require('mongodb');

// Tu enlace de conexión con el usuario y contraseña que me pasaste
const uri = "mongodb+srv://totocalienteinternacionalbooking_db_user:5lcXpMT3yBXDrgAc@cluster0.1fzqg8u.mongodb.net/totocaliente?appName=Cluster0";
let client;
let clientPromise;

if (!global._mongoClientPromise) {
  client = new MongoClient(uri);
  global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { usuario, password } = req.body;
    
    if (!usuario || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    const connection = await clientPromise;
    const db = connection.db('totocaliente');
    const collection = db.collection('usuarios');

    // Verificar si el usuario ya existe en Atlas para no duplicarlo
    const usuarioExiste = await collection.findOne({ usuario });
    if (usuarioExiste) {
      return res.status(400).json({ error: 'El apodo ya existe' });
    }

    // Insertar el nuevo usuario en MongoDB Atlas
    await collection.insertOne({
      usuario,
      password, 
      fechaRegistro: new Date()
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
