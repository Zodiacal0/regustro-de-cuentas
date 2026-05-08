const argon2 = require('argon2');
const { getDb } = require('../db');
const { generateJWT } = require('./generate_jwt');

const COLLECTIONS = ['entradas', 'gastos', 'objetivos', 'tarjetas', 'cuentas', 'deudas'];

// POST /api/auth/register
const register = async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ success: false, message: 'email, password y name son requeridos', data: null });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres', data: null });
  }

  try {
    const db = await getDb();
    const usersCol = db.collection('users');

    const existing = await usersCol.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'El correo ya está registrado', data: null });
    }

    const hashedPassword = await argon2.hash(password);

    const result = await usersCol.insertOne({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      status: true,
      createdAt: new Date()
    });

    const uid = result.insertedId.toString();

    // Migración: el primer usuario hereda todos los registros existentes sin uid
    const userCount = await usersCol.countDocuments();
    if (userCount === 1) {
      await Promise.all(
        COLLECTIONS.map(col =>
          db.collection(col).updateMany(
            { uid: { $exists: false } },
            { $set: { uid } }
          )
        )
      );
    }

    const token = await generateJWT(uid);

    return res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: { uid, name, email: email.toLowerCase(), token }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message, data: null });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'email y password son requeridos', data: null });
  }

  try {
    const db = await getDb();
    const user = await db.collection('users').findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Credenciales incorrectas', data: null });
    }
    if (!user.status) {
      return res.status(401).json({ success: false, message: 'Cuenta deshabilitada', data: null });
    }

    const passwordMatch = await argon2.verify(user.password, password);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Credenciales incorrectas', data: null });
    }

    const uid = user._id.toString();
    const token = await generateJWT(uid);

    return res.status(200).json({
      success: true,
      message: 'Login exitoso',
      data: { uid, name: user.name, email: user.email, token }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message, data: null });
  }
};

module.exports = { register, login };
