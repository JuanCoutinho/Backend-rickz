import axios from 'axios';

export async function sendMsg({ Client, to, body } : { Client: any, to: any, body: any }) {
    const client = Client?.client;
    if (!client) {
        return null;
    }
    return client.sendMessage(to + '@s.whatsapp.net', { text: body });
}

export async function sendMsgImage({Client, to ,url} : {Client: any, to: any, url: any}) {
    const client = Client?.client;

    if (!client) {
        return null;
    }
    const newUrl = await downloadAudio(url);

    return client.sendMessage(to + '@s.whatsapp.net', 
        { 
            image: newUrl, 
            gifPlayback: true,
            ptv: false // if set to true, will send as a `video note`
        }
    )
}

export async function sendMsgVideo({Client, to, url} : {Client: any, to: any, url: any}) {
    const client = Client?.client;
    if (!client) {
        return null;
    }

    const newUrl = await downloadAudio(url);

    return client.sendMessage(to + '@s.whatsapp.net', 
        { 
            video: newUrl, 
            gifPlayback: false,
            ptv: false // if set to true, will send as a `video note`
        }
    );
}

export async function sendMsgAudio({Client, to, url} : {Client: any, to: any, url: any}) {
    const client = Client?.client;
    console.log('client *****************************:',client);
    if (!client) {
        return null;
    }

    const newUrl = await downloadAudio(url);

    console.log('url *****************************:',newUrl);
    return client.sendMessage(to + '@s.whatsapp.net', 
        { audio: newUrl, mimetype: 'audio/mp4' },
    )
}


// const createBase65Midia = (arquivo:any) => {
//     if (!arquivo) return;
//     const reader = new FileReader();
//     reader.readAsArrayBuffer(arquivo);
//     reader.onload = () => {
//         const buffer = Buffer.from(reader.result);
//         const base64 = buffer.toString('base64');
//         return base64;
//     };

//     reader.onerror = (error) => {
//         console.error('Error:', error);
//     };
// }

async function downloadAudio(url:any) {
    const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'arraybuffer'
    });

    return Buffer.from(response.data, 'binary');
}

