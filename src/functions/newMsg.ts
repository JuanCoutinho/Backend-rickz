const downloadMediaMessage = require('@whiskeysockets/baileys').downloadMediaMessage;

export async function newMsgText(data:any) {
    const { message, messageTimestamp } = data;
    const { conversation, extendedTextMessage } = message;
    const { text } = extendedTextMessage;
    const { low:time } = messageTimestamp;

    return {
        msg: text || conversation || 'Mensagem recebida...',
        tipo: 'Texto',
        time: new Date(parseInt(time) * 1000).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Sao_Paulo'
        }),
        media: null,
        hasMidia: false
    }
}

export async function newMsgImage(data:any) {
    const { message, messageTimestamp } = data;
    const { imageMessage } = message;
    const { low:time } = messageTimestamp;

    const downloadImage = await downloadMediaMessage(data, 'buffer', {}).catch((err:any) => {
        return null;
    });

    return {
        msg: '🖼 Imagem recebido...',
        tipo: 'Image',
        time: new Date(parseInt(time) * 1000).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Sao_Paulo'
        }),
        media: {
            url: downloadImage,
            tipo: 'Image',
        },
        hasMidia: true
    }
    
}

export async function newMsgVideo(data:any) {
    const { message, messageTimestamp } = data;
    const { videoMessage } = message;
    const { mediaKey, url, mimetype, fileLength, fileSha256, fileEncSha256 } = videoMessage;
    const { low:time } = messageTimestamp;

    const downloadVideo = await downloadMediaMessage(data, 'buffer', {}).catch((err:any) => {
        return null;
    });

    return {
        msg: '📽 Video...',
        tipo: 'Video',
        time: new Date(parseInt(time) * 1000).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Sao_Paulo'
        }),
        media: {
            url: downloadVideo,
            tipo: 'Video',
        },
        hasMidia: true
    }
}

export async function newMsgAudio(data:any) {
    const { message, messageTimestamp } = data;
    const { audioMessage } = message;
    const { mediaKey, url, mimetype, fileLength, fileSha256, fileEncSha256 } = audioMessage;
    const { low:time } = messageTimestamp;

    const downloadAudio = await downloadMediaMessage(data, 'buffer', {}).catch((err:any) => {
        return null;
    });

    return {
        msg: '🔊 Audio...',
        tipo: 'Audio',
        time: new Date(parseInt(time) * 1000).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Sao_Paulo'
        }),
        media: {
            url: downloadAudio,
            tipo: 'Audio'
        },
        hasMidia: true
    }
}
