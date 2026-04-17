/**
 * Proyecto B.L.A.S.T - Layer 2: Navigation (Listeners / API)
 * Este archivo implementa Express para escuchar requests externos (vía REST) 
 * y rutea los payloads JSON directamente hacia el tool de MongoDB 
 * (Layer 3: Tools) que construimos analizando la arquitectura de gemini.md.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { insertRecord } = require('./tools/insert_record');
const { getAllRecords } = require('./tools/get_records');
const { updateRecord } = require('./tools/update_record');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Endpoint base
app.get('/', (req, res) => {
    res.status(200).json({ success: true, message: 'B.L.A.S.T Engine IS ONLINE.' });
});

// Endpoint GET: Extraer todo el panorama contable
app.get('/api/records', async (req, res) => {
    try {
        const result = await getAllRecords();
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Enrutador central dinámico para todo el esquema (Entradas, Gastos, Objetivos, Tarjetas)
app.post('/api/records', async (req, res) => {
    try {
        const { tipo_registro, payload } = req.body;
        
        if (!tipo_registro || !payload) {
            return res.status(400).json({ 
                success: false, 
                message: "Faltan parámetros 'tipo_registro' y 'payload'",
                data: null
            });
        }

        // Llamar a nuestro script atómico y determinista (Layer 3)
        const result = await insertRecord(tipo_registro, payload);
        
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

// Endpoint PUT: Actualizar un documento existente por ID y Tipo
app.put('/api/records/:tipo_registro/:id', async (req, res) => {
    try {
        const { tipo_registro, id } = req.params;
        const payload = req.body;
        
        if (!tipo_registro || !id || !payload) {
            return res.status(400).json({ success: false, message: "Parámetros incompletos" });
        }

        const result = await updateRecord(tipo_registro, id, payload);
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        res.status(500).json({ success: false, message: `Error interno de servidor: ${error.message}` });
    }
});

const { onRequest } = require('firebase-functions/v2/https');

// Exportar la App para Firebase Cloud Functions
exports.api = onRequest({
    region: "us-central1", // Ajusta según tu preferencia
    memory: "256MiB",
    timeoutSeconds: 60
}, app);

