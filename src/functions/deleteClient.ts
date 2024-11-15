const { clients , qrCodeUrls } = require('../clientManager');
import path from 'path';
import fs from 'fs';
const SESSIONS_PATH = path.join(__dirname, '/sessions');
import Prisma from '@prisma/client';

const { PrismaClient } = Prisma;
const prisma = new PrismaClient();

export async function deleteClient(client:any,clientId:any, io:any) {
    
    if (!client) {
        return null;
    }
    try {
        
        client?.end();
        delete clients[clientId];
        delete qrCodeUrls[clientId];

        const sessionPath = path.join(SESSIONS_PATH, `session-${clientId}`);
        if (fs.existsSync(sessionPath)) {
            fs.rmdirSync(sessionPath, { recursive: true });
        }

        const storePath = path.join(__dirname, `store-${clientId}`);
        if (fs.existsSync(storePath)) {
            fs.unlinkSync(storePath );
        }

        await prisma.sessionWhatsapp.update({
            where: {
                sessionId: clientId
            },
            data: {
                status: 'Inativo'
            }
        }).catch((err) => {
            console.log(`Failed to update status of client ${clientId}: ${err.message}`);
        });
        prisma.$disconnect();

    } catch (err:any) {
        console.log(`Error deleting client ${clientId}: ${err.message}`);
        return null;
    }
}

