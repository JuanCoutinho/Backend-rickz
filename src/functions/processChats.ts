const STORE_PATH = path.join(__dirname, '/store');
import path from 'path';

export async function processChats(client:any) {
    const store = client.store;

    const limit = 40; // Número de mensagens a serem mantidas por chat

    if (!store) {
        console.log('Armazenamento não encontrado [ processChats ]');
        return;
    }

    // Iterar por todos os chats
    for (let chatId in store.messages) {
        const chatMessages = store.messages[chatId]?.toJSON();
        
        if (!chatMessages) continue;

        store.messages[chatId] = chatMessages.slice(-limit);
    }

    // Escrever as mudanças no arquivo de armazenamento
    store.writeToFile(path.join(STORE_PATH, `store-${client.user.id}.json`));
}

