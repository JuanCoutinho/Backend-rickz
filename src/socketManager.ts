const { Server } = require('socket.io');
import { clients, qrCodeUrls, createClient } from './clientManager';

import {deleteClient} from '@/functions/deleteClient';
import {getChatsWithMessages} from '@/functions/getChatsWithMessages';
import {getClientStatus} from '@/functions/getClientStatus';
import {markMessagesAsRead} from '@/functions/markMessagesAsRead';

import { sendMsg, sendMsgImage, sendMsgVideo, sendMsgAudio } from './functions/sendMsgs';

const Prisma = require('@prisma/client');
const { PrismaClient } = Prisma;
const prisma = new PrismaClient();



export function initializeSocket(server: any) {
    const io = new Server(server, {
        maxHttpBufferSize: 1e8,
        cors: {
            // origin: "https://pedro-sass-chatbot-whatsapp-qrcode.vercel.app/",
            origin: process.env.URL || "https://pedro-sass-chatbot-whatsapp-qrcode.vercel.app/",
            methods: ["GET", "POST"],
            allowedHeaders: ["Content-Type", "Authorization"],
            credentials: false
        },
        transports: ['websocket']
    });

    io.on('connection', (socket: any) => {
        socket.on('createClient', async ({ sessionId, assistenteId } : { sessionId: string, assistenteId: string }) => {
            console.log(`[[[[ Received sessionId: ${sessionId}, assistenteId: ${assistenteId} ]]]]`);
            const client = clients[sessionId]?.client;
            const assistente = assistenteId;
            console.log(client);
            if (client) await deleteClient(client,sessionId, socket);
            
            if (!clients[sessionId]) {
                console.log(`[[[[ Creating client ${sessionId} ]]]]`);
                try {
                    await createClient({ clientId: sessionId, io, assistenteId: assistente });
                    console.log(`###[Client ${client} is being initialized. Please wait for the QR code....]###`);
                } catch (err:any) {
                    console.log(`<<<<<<<<<<<<<<<<<<<<<>>>>>>>>>>>>>>>>>>>>>t err: ${err.message}`);
                }

            }
        });

        socket.on('sendMessage', (data: any) => {
            const { clientId, to, body, media } = data as any;
            const client = clients?.[clientId]

            var send

            if (media) {
                if(String(media.type).includes('image')) send = sendMsgImage({Client: client, to, url: media.url});
                
                if (String(media.type).includes('video')) send = sendMsgVideo({Client: client, to, url: media.url});
                
                if (String(media.type).includes('audio')) send = sendMsgAudio({Client: client, to, url: media.url});
            } 

            if (!media) send = sendMsg({Client: client, to, body});


            if(!send) {
                socket.emit(`sessao-finalizada-${clientId}`);
            }
        });

        socket.on('getLastConversations', async (sessionId: any) => {
            console.log(`BUSCANDO MENSAGENS PARA :${sessionId}`);
            
            const clientId = sessionId;
            if (!clientId) {
                socket.emit(`disconnect-${sessionId}`, 'Erro ao buscar mensagens, tente novamente!');
                return; 
            }

            const client = clients[clientId];
            const chats = await getChatsWithMessages(client, clientId, socket) as any;

            if (chats) {
                socket.emit(`chats-${clientId}`, chats.chatData);
                return socket.emit(`img-profile-${clientId}`, chats.imgProfileEu);
            }

            return
            await prisma.sessionWhatsapp.update({
                where: {
                    sessionId: clientId
                },
                data: {
                    status: 'Inativo'
                }
            }).catch((err: any) => {
                console.log(`Failed to update status of client ${clientId}: ${err.message}`);
            }).then(() => { 
                console.log(`Client ${clientId} status updated to Inativo -------`);
            }).finally(() => {
                prisma.$disconnect();
            });

            socket.emit(`disconnect-${clientId}`, 'Erro ao buscar mensagens, tente novamente!');
        });

        socket.on('close-qr-generate', async (clientId: any) => {
            console.log(`Received request to close QR generation for client ${clientId}`);
            const client = clients[clientId]?.client;
            const status = await getClientStatus(clientId, socket);
            console.log(`Status: ${status}`);
            if (client && status === 'QR Code generated') {
                try {
                    deleteClient(client,clientId, io);
                } catch (err:any) {
                    console.log(`Error destroying client ${clientId}: ${err.message}`);
                }
                console.log(`Client ${clientId} session destroyed`);
            }
        });

        socket.on('getStatus', async (clientId: any) => {
            console.log(`Received request to get status for client ${clientId}`);
            const status = await getClientStatus(clientId,socket);
            socket.emit(`status-${clientId}`, status);
        });

        socket.on('readMessages', async (data: any) => {
            const { clientId, phone , qtd } = data;
            const client = clients[clientId];
            console.log(`readMessages : ${clientId} - ${phone}`);
            await markMessagesAsRead(client,clientId, phone , qtd);
        })


        socket.on('disconnect', () => {
            // console.log('Client disconnected', socket.id);
            socket.removeAllListeners();
        });

        socket.on(`ping`, (data: any) => {
            socket.emit(`pong-${data}`, `pong-${data}`);
        });
    });

    return io;
}

