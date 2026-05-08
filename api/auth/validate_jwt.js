const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const { getDb } = require('../db');

const validateJWT = async (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token requerido', data: null });
  }

  const token = authHeader.replace(/^Bearer\s+/, '');

  try {
    const { uid } = jwt.verify(token, process.env.JWT_SECRET);

    if (!ObjectId.isValid(uid)) {
      return res.status(401).json({ success: false, message: 'Token inválido', data: null });
    }

    const db = await getDb();
    const user = await db.collection('users').findOne({ _id: new ObjectId(uid) });

    if (!user || !user.status) {
      return res.status(401).json({ success: false, message: 'Usuario no encontrado o inactivo', data: null });
    }

    req.uid = uid;
    req.usuario = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token inválido o expirado', data: null });
  }
};

module.exports = { validateJWT };
