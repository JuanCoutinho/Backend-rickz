import path from 'path';
const STORE_PATH = path.join(__dirname, '/store');
export async function markMessagesAsRead(client:any,clientID:any, phone:any, qtd:any) {
    var chatId = phone + '@s.whatsapp.net';


    var store = client?.store;
    var client = client?.client;

    if (!client || !store) {
        return;
    }

    try {
        // Carregar as mensagens do chat especificado
        const chatMessages = store.messages[chatId]?.toJSON();

        if (!chatMessages || chatMessages.length === 0) {
            return;
        }

        // Selecionar a quantidade especificada de mensagens
        const messagesToMark = chatMessages.slice(-qtd);
        const msgKeys = messagesToMark
            .filter((message:any) => !message.key.fromMe && !message.status)
            .map((message:any) => message.key);

        // Marcar as mensagens como lidas no cliente
        await client.readMessages(msgKeys);

        // Atualizar a contagem de não lidas no armazenamento local
        const chat = store.chats.get(chatId);
        if (chat) {
            chat.unreadCount = Math.max(0, chat.unreadCount - msgKeys.length);
        }

        // Escrever as mudanças no arquivo de armazenamento
        store.writeToFile(path.join(STORE_PATH, `store-${clientID}.json`));


    } catch (error) {
        console.log('Erro ao marcar mensagens como lidas:', error);
    }
}
