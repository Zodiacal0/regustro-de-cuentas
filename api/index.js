/**
 * Proyecto B.L.A.S.T - Layer 2: Navigation (Listeners / API)
 * Rutea payloads REST hacia los tools MongoDB (Layer 3).
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { insertRecord } = require('./tools/insert_record');
const { getAllRecords } = require('./tools/get_records');
const { updateRecord } = require('./tools/update_record');
const { deleteRecord } = require('./tools/delete_record');
const authRoutes = require('./auth/auth_routes');
const { validateJWT } = require('./auth/validate_jwt');

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/', (req, res) => {
    res.status(200).json({ success: true, message: 'B.L.A.S.T Engine IS ONLINE.' });
});

// Rutas públicas de autenticación
app.use('/api/auth', authRoutes);

// GET: Extraer todo el panorama contable
app.get('/api/records', validateJWT, async (req, res) => {
    try {
        const result = await getAllRecords(req.uid);
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(500).json({ success: false, message: result.message, data: null });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message, data: null });
    }
});

// POST: Crear un nuevo registro
app.post('/api/records', validateJWT, async (req, res) => {
    try {
        const { tipo_registro, payload } = req.body;

        if (!tipo_registro || !payload) {
            return res.status(400).json({
                success: false,
                message: "Faltan parámetros 'tipo_registro' y 'payload'",
                data: null
            });
        }

        const result = await insertRecord(tipo_registro, payload, req.uid);

        if (result.success) {
            res.status(201).json(result);
        } else {
            res.status(400).json(result);
        }

    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Error interno de servidor: ${error.message}`,
            data: null
        });
    }
});

// PUT: Actualizar un documento existente por ID y Tipo
app.put('/api/records/:tipo_registro/:id', validateJWT, async (req, res) => {
    try {
        const { tipo_registro, id } = req.params;
        const payload = req.body;

        if (!tipo_registro || !id || !payload || Object.keys(payload).length === 0) {
            return res.status(400).json({
                success: false,
                message: "Parámetros incompletos",
                data: null
            });
        }

        const result = await updateRecord(tipo_registro, id, payload, req.uid);
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Error interno de servidor: ${error.message}`,
            data: null
        });
    }
});

// DELETE: Eliminar un registro por ID y Tipo
app.delete('/api/records/:tipo_registro/:id', validateJWT, async (req, res) => {
    try {
        const { tipo_registro, id } = req.params;

        if (!tipo_registro || !id) {
            return res.status(400).json({
                success: false,
                message: "Faltan parámetros 'tipo_registro' o 'id'",
                data: null
            });
        }

        const result = await deleteRecord(tipo_registro, id, req.uid);
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Error interno de servidor: ${error.message}`,
            data: null
        });
    }
});

module.exports = app;
