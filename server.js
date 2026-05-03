/**
 * Entry point para desarrollo local.
 * api/index.js es la única fuente de rutas.
 */

require('dotenv').config();
const app = require('./api/index');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`[LOCAL DEV] B.L.A.S.T Engine en puerto ${PORT}`);
    console.log(`Endpoints: GET / | GET /api/records | POST /api/records | PUT /api/records/:tipo/:id | DELETE /api/records/:tipo/:id`);
});
