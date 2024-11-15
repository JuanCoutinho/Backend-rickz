import express from 'express';
import http from 'http';
import cors from 'cors';

import { initializeClients, createClient, clients , qrCodeUrls } from './clientManager';
import { initializeSocket } from './socketManager';
require('dotenv').config();

const app = express();
const server = http.createServer(app);


const allowedOrigin = process.env.URL || 'https://pedro-sass-chatbot-whatsapp-qrcode.vercel.app/';

console.log('DATABASE_URL:', process.env.DATABASE_URL);

// Middleware
app.use(cors({
    origin: allowedOrigin,
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false
}));
app.use(express.json());

// Initialize Socket.io
const io = initializeSocket(server);

// Initialize clients from saved sessions with socket.io
initializeClients(io);

// Rota para criar um cliente e obter o QR code
app.get('/api/v1/qr/:id', (req:any, res:any) => {
    const clientId = req.params.id;
    if (!clients[clientId]) {
        createClient({ clientId, io, assistenteId: null });
        res.status(200).send(`Client ${clientId} is being initialized. Please wait for the QR code.`);
    } else {
        const qrUrl = qrCodeUrls[clientId];
        if (qrUrl) {
            res.status(200).json({ qrCode: qrUrl });
        } else {
            res.status(200).send(`Client ${clientId} is already initialized and authenticated.`);
        }
    }
});

// Rota para verificar o status de um cliente
// app.get('/api/v1/status/:id', (req:any, res:any) => {
//     const clientId = req.params.id;
//     const status = getClientStatus(clientId);
//     res.status(200).send(`Status for client ${clientId}: ${status}`);
// });

// Rota para excluir uma sessão de cliente
// app.delete('/api/v1/session/:id', async (req:any, res:any) => {
//     const clientId = req.params.id;
//     try {
//         await deleteClient(clientId);
//         res.status(200).send(`Client ${clientId} session deleted`);
//     } catch (error:any) {
//         res.status(500).send(`Error deleting client ${clientId}: ${error.message}`);
//     }
// });

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
