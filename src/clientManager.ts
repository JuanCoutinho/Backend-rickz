import { makeWASocket, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, makeInMemoryStore, useMultiFileAuthState } from '@whiskeysockets/baileys';

import {deleteClient} from '@/functions/deleteClient';
import {processChats} from '@/functions/processChats';
import { newMsgText, newMsgImage, newMsgVideo, newMsgAudio } from '@/functions/newMsg';
import { main_function } from '@/functions/IA/main_function';

import fs from 'fs';
import path from 'path';
import Prisma from '@prisma/client';
import { Boom } from '@hapi/boom';
import P from 'pino';
import NodeCache from 'node-cache';
import pino from "pino";

const logger = pino({ level: 'info' }) as any

const { PrismaClient } = Prisma;
const prisma = new PrismaClient();

const SESSIONS_PATH = path.join(__dirname, '/sessions');
const STORE_PATH = path.join(__dirname, '/store');
export const clients = {} as any;
export const qrCodeUrls = {} as any;
export const authTimeouts = {} as any;

const msgRetryCounterCache = new NodeCache()

// Initialize in-memory store


export function initializeClients(io:any) {
    if (!fs.existsSync(SESSIONS_PATH)) {
        fs.mkdirSync(SESSIONS_PATH, { recursive: true });
    }

    if (!fs.existsSync(STORE_PATH)) {
        fs.mkdirSync(STORE_PATH, { recursive: true });
    }

    const sessionFiles = fs.readdirSync(SESSIONS_PATH).filter(file => file.startsWith('session-'));
    sessionFiles.forEach(file => {
        const clientId = file.split('-')[1];
        createClient({ clientId, io, assistenteId: null });
    });
}


var tipos = {
    'imageMessage': 'Imagem',
    'videoMessage': 'Vídeo',
    'audioMessage': 'Áudio',
    'stickerMessage': 'Sticker',
    'documentMessage': 'Documento',
    'productMessage': 'Produto',
}

export async function createClient({ clientId, io, assistenteId } : { clientId: string, io: any, assistenteId?: string | null }) {

    const { state, saveCreds } = await useMultiFileAuthState(path.join(SESSIONS_PATH, `session-${clientId}`));
    const { version, isLatest } = await fetchLatestBaileysVersion()
    
    const client = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        version,
        browser: ['Baileys', 'BOT' , '1.0.0'],
        logger: logger,
        msgRetryCounterCache,
        // mediaCache: NodeCache,
        mediaCache: new Map() as any,
        markOnlineOnConnect: false,
        syncFullHistory: true,


        // defaultQueryTimeoutMs: undefined,
    }) as any;

    const store = makeInMemoryStore({
        logger: P().child({ level: "silent", stream: "store" }) as any,
    });

    const storeFilePath = path.join(STORE_PATH, `store-${clientId}.json`);

    if (fs.existsSync(storeFilePath)) {
        store.readFromFile(storeFilePath);
    }

    

    store?.bind(client.ev)

    client.ev.on('creds.update', saveCreds);

    client.ev.on('connection.update', async (update:any) => {
        const { connection, lastDisconnect, qr } = update as any;

        if (qr) {
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qr)}&size=200x200`;
            qrCodeUrls[clientId] = qrUrl;
            io.emit(`qr-${clientId}`, qrUrl);

            authTimeouts[clientId] = setTimeout(async () => {
                if (connection !== 'open') {
                    await deleteClient(client,clientId , io);
                    io.emit(`sessao-finalizada-${clientId}`);
                }
            }, 5 * 60 * 1000); // 5 minutos
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error instanceof Boom) && lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                createClient({ clientId, io, assistenteId });
            } else {
                await deleteClient(client,clientId , io);
                io.emit(`disconnect-${clientId}`);
            }
        }

        if (connection === 'open') {
            delete qrCodeUrls[clientId];
            clearTimeout(authTimeouts[clientId]);

            try {
                const imgProfileEu = await client.profilePictureUrl(client.user.id);
                io.emit(`session-${clientId}`, 'Ativo');
                io.emit(`imgProfile-${clientId}`, imgProfileEu);

                await prisma.sessionWhatsapp.update({
                    where: {
                        sessionId: clientId
                    },
                    data: {
                        status: 'Ativo',
                        imageProfile: imgProfileEu
                    }
                }).catch((err) => {
                    console.log(`Failed to update status of client ${clientId}: ${err.message}`);
                });
                prisma.$disconnect();

                await processChats(client)
            } catch (error:any) {
                console.log(`Failed to notify authentication failure of client ${clientId}: ${error.message}`);
            }
        }
    });

    client.ev.on('messages.upsert', async (msg:any) => {
        const message = msg.messages[0]

        const userPhone = String(message.key.remoteJid).replace('@s.whatsapp.net', '');
        const itsMe = message.key.fromMe;

        var jsonMsg = null , tipo
        if (String(Object.keys(message.message)) === 'extendedTextMessage') { jsonMsg = await newMsgText(message) , tipo = 'Texto' }
        if (String(Object.keys(message.message)) === 'imageMessage') { jsonMsg = await newMsgImage(message)  , tipo = 'Imagem' }
        if (String(Object.keys(message.message)) === 'videoMessage') { jsonMsg = await newMsgVideo(message) , tipo = 'Vídeo' }
        if (String(Object.keys(message.message)) === 'audioMessage') { jsonMsg = await newMsgAudio(message) , tipo = 'Áudio' }
   

        console.log(`Mensagem recebida5: ${jsonMsg}`);
        if(!jsonMsg) return

        const contact = await store?.contacts[message.key.remoteJid]
        const name = contact?.name || contact?.notify || String(userPhone);


        const chatData = {
            nome:name,
            userPhone: userPhone,
            role: message.key.fromMe ? 'eu' : 'cliente',
            message: [jsonMsg],
        } as any;
        
        if (message?.message === undefined || !message?.message || !String(message?.key?.remoteJid)?.includes('s.whatsapp.net')) return
        store?.writeToFile(storeFilePath)

        if (itsMe) return io.emit(`new-msg-${clientId}`, [...chatData]);




        // let getChat = await getChatsWithMessages({ clientId, io, user: message.key.remoteJid });

    
        io.emit(`new-msg-${clientId}`, [...chatData]);

        if(tipo === 'vídeo' || tipo === 'imagem') {
            client.sendText(message.key.remoteJid, `Desculpe, aqui no sistema não consigo processar ${tipo} ainda!, mas consigo em texto e áudio!`);
            return
        }

        const data = {
            chatData: chatData,
            client : client,
            io: io,
            clientId: clientId,
        } as any;

        await main_function(data)
    });


    clients[clientId] = {client,store};
}

