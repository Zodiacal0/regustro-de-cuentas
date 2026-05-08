const jwt = require('jsonwebtoken');

const generateJWT = (uid) => new Promise((resolve, reject) => {
  jwt.sign(
    { uid },
    process.env.JWT_SECRET,
    { expiresIn: '12h' },
    (err, token) => {
      if (err) reject(err);
      else resolve(token);
    }
  );
});

module.exports = { generateJWT };
