import { PrismaClient } from "@prisma/client";
import { audio_main_function } from "@/functions/IA/audio_main_function";
import { texto_main_function } from "@/functions/IA/texto_main_function";
const prisma = new PrismaClient()


export const main_function = async ({ data} : {data : any}) => {

    const { client, clientId, userPhone, chatData, io } = data;
    const { userPhone: phone, message} = chatData;
    const { media, msg } = message[0];

    var sessaoAssistente = await prisma.sessionWhatsappMsgs.findFirst({
        where: {
            sessionId: clientId,
            userPhone: userPhone
        },
    }).catch((error) => null).then((response) => response) as any
 
    var { assistenteId, threadId } = sessaoAssistente

    if (!sessaoAssistente) {
        [assistenteId, threadId] = await Promise.all([
            prisma.sessionWhatsapp.findUnique({
                where: {
                    sessionId: clientId
                },
                select: {
                    assistenteId: true
                }
            }).catch((error) => null)
                .finally(() => prisma.$disconnect())
            ,
            fetch(`https://pedro-sass-chatbot-whatsapp-qrcode.vercel.app/api/bot/${clientId}/thread`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Session-Id': clientId,
                }
            })
                .then(response => response.json()) // Assuming the response is in JSON format
                .catch((error) => {
                    console.log(`Erro ao enviar mensagem1`);
                })
        ]);

        if (!assistenteId || !threadId) return

        sessaoAssistente = await prisma.sessionWhatsappMsgs.create({
            data: {
                sessionId: clientId,
                userPhone: userPhone,
                threadId: threadId,
                assistenteId: assistenteId.assistenteId
            }
        }).catch((error) => {
            console.log(`Erro ao salvar mensagem: ${error}`);
        }).finally(() => prisma.$disconnect())
    }
    if (sessaoAssistente?.status === 'Inativo') return

    const { tipo } = media

    var resposta = null

    if (tipo === 'texto') {
        resposta = await texto_main_function({ text: msg, thread: threadId, assistantId: assistenteId })
        console.log('resposta texto', resposta);

        const newChatData = {
            ...chatData,
            message: [
                {
                    msg: resposta || 'Mensagem recebida...',
                    tipo: 'Texto',
                    time: new Date().toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'America/Sao_Paulo'
                    }),
                    media: null,
                    hasMidia: false
                }
            ]
        }
        client.sendMessage(data.key.remoteJid, { text: resposta })
        io.emit(`new-msg-${clientId}`, [...newChatData]);
    }
    
    if (tipo === 'audio') {
        resposta = await audio_main_function({ url: media.url, thread: threadId , assistantId: assistenteId })
        console.log('resposta audio', resposta);
        const newChatData = {
            ...chatData,
            message: [
                {
                    msg: '🔊 Audio...',
                    tipo: 'Audio',
                    time: new Date().toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'America/Sao_Paulo'
                    }),
                    media: {
                        url: resposta,
                        tipo: 'Audio'
                    },
                    hasMidia: true
                }
            ]
        }
        client.sendVoice(data.key.remoteJid, { url: resposta })
        io.emit(`new-msg-${clientId}`, [...newChatData]);
    }
     
    // client.sendMessage(data.key.remoteJid, { text: iaText });

    return;
}