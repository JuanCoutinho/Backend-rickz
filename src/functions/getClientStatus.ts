import { clients } from '../clientManager';
import path from 'path';
import fs from 'fs';
const SESSIONS_PATH = path.join(__dirname, '/sessions');
import { qrCodeUrls } from '../clientManager';
const STORE_PATH = path.join(__dirname, '/store');

export async function getClientStatus(clientId:any, io:any) {

    const sessionPath = path.join(SESSIONS_PATH, `session-${clientId}.json`);

    if (!clients || !clients[clientId]) return 'Client not found';

    if (!clients[clientId]?.client && !fs.existsSync(sessionPath)) {
        return 'Client not found';
    }
    if (clients[clientId]?.client && clients[clientId]?.client?.user) {
        return 'Authenticated';
    }
    if (qrCodeUrls[clientId]?.client) {
        return 'QR Code generated';
    }
    return 'Pending authentication';
}

