import { clients } from '../clientManager';
import path from 'path';
import { newMsgText, newMsgImage, newMsgVideo, newMsgAudio } from '@/functions/newMsg';

const STORE_PATH = path.join(__dirname, '/store');

export async function getChatsWithMessages(Client:any, clientId:any, user:any) {

    console.log('Buscando mensagens para em getChatsWithMessages:', clientId);
    const storeFilePath = path.join(STORE_PATH, `store-${clientId}.json`);

    if ((!clients?.[clientId]) && (!Client?.client)){ 
        console.log('Cliente não encontrado:',Client?.[clientId]);
        console.log('Cliente não encontrado2:',clients?.[clientId]);
        return null;
    }


    const client = Client.client || clients[clientId].client

    const store = Client.store || clients[clientId].store

    store?.readFromFile(storeFilePath)

    if (!client || !store) {
        return null;
    }

    console.log('Buscando mensagens para:', clientId);

    const clientIdNumber = client?.user.id || client?.user?.lid

    const chatData = {} as any;
    let imgProfileEu;

    try {
        imgProfileEu = await client.profilePictureUrl(clientIdNumber);
    } catch (error) {
        console.log(`Error fetching profile picture: ${error}`);
        imgProfileEu = null;
    }

    const chats = !user ? 
        store.chats.all()
            .filter((chat:any) => 
                !String(chat.id).includes('@g.us') &&
                !String(chat.id).includes('@broadcast') &&
                String(chat.id) !== '0@s.whatsapp.net' &&
                chat?.tcTokenSenderTimestamp?.low !== undefined
            )
            .map((chat:any) => { 
                return { 
                    id: chat?.id, 
                    name: chat?.name, 
                    lidJid: chat?.lidJid,
                    timestamp: chat?.conversationTimestamp?.low, // Adicione o timestamp para ordenação
                    unreadCount : chat?.unreadCount
                };
            })
            .sort((a:any, b:any) => b.timestamp - a.timestamp) // Ordene pelo timestamp, do mais recente ao mais antigo
            .slice(0, 20)
        : (Array.isArray(store.chats.get(user)) ? store.chats.get(user) : [store.chats.get(user)])
            .map((chat:any) => {

                return { 
                    id: chat?.id, 
                    name: chat?.name, 
                    lidJid: chat?.lidJid,
                    timestamp: chat?.conversationTimestamp?.low, // Adicione o timestamp para ordenação
                    unreadCount: chat?.unreadCount
                };
            })
            .sort((a:any, b:any) => b.timestamp - a.timestamp) // Ordene pelo timestamp, do mais recente ao mais antigo
            .slice(0, 20);
    
            

    for await (const chat of chats) {
        const remoteId = chat?.id

        const chatMessages = store.messages[remoteId]?.toJSON()
        const contact = await store?.contacts[remoteId]
        
        if (!chatMessages) return 'Sem mensagens...'
        
        var profilePicUrl, msgChat = []
        var name = contact?.name || contact?.notify || String(remoteId).replace('@s.whatsapp.net', '');
        var unreadCount = chat?.unreadCount
        try {
            profilePicUrl = await client.profilePictureUrl(remoteId);
        } catch (error) {
            console.log(`Erro ao buscar imagem de perfil: ${error}`);
            profilePicUrl = undefined;
        }

        
        for (const message of chatMessages.slice(-30)) { // Process only the last messages

            const messageKey = message?.message && Object.keys(message?.message)[0]

            if(!messageKey) continue

            var jsonMsg = null

            if (String(messageKey) === 'extendedTextMessage') jsonMsg = await newMsgText(message) 
            if (String(messageKey) === 'imageMessage') jsonMsg = await newMsgImage(message) 
            if (String(messageKey) === 'videoMessage') jsonMsg = await newMsgVideo(message)
            if (String(messageKey) === 'audioMessage') jsonMsg = await newMsgAudio(message)
                        
            if (!jsonMsg) continue

            msgChat.push(jsonMsg)
        }

        const numberID = String(chat.id).replace('@s.whatsapp.net', '');
        if(!numberID || numberID === 'undefined'|| msgChat.length === 0) continue
        chatData[numberID] = {
            nome: name,
            image: profilePicUrl || '/perfil-img-default/default.png',
            novaMsg: unreadCount,
            messages: msgChat
        };
    }

    return { chatData, imgProfileEu };
}

