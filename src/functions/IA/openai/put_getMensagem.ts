import OpenAI from "openai";
import { gerarThread } from "./gerarThread";


const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});


export const put_getMensagem = async ({ msg, threadUser , type, caption, assistantId}: {msg: any, threadUser: string | null, type?: string , caption?: string , assistantId: string}) => {
    const tipo = type || 'text';
    const thread = threadUser || await gerarThread();


    tipo === 'text' ? await criarMensagemTexto(thread, msg) : await criarMensagemImagem({threadId: thread, image: msg, caption: caption || 'SEM LEGENDA'});
    const texto = await runThread(thread, msg,assistantId);
    return texto.resposta;

}



const criarMensagemTexto = async (threadId: string, msg: string) => {

    const text = {texto: msg}

    const threadMessages = await openai.beta.threads.messages.create(
        threadId,
        { role: "user", content:  JSON.stringify(text) }
    );
    return threadMessages.id;
}

const criarMensagemImagem = async ({threadId, image, caption}: {threadId: string, image: string, caption: string}) => {

    console.log(image)
    const threadMessages = await openai.beta.threads.messages.create(
        threadId,
        {
            role: "user",
            content: [
              { type: "text", text: 'LEGENDA DA IMAGEM: '+caption },
              {
                type: "image_url",
                image_url: {
                  "url": image
                },
              },
            ],
        },
    );
    return threadMessages.id;
}

const runThread = async (threadId: string, msg: string, assistantId: string) => {
    const stream = await openai.beta.threads.runs.create(
        threadId,
        { assistant_id: String(assistantId), stream: true }
    );
    
    for await (const event of stream) {
        event;
    }

    const getMsg = await openai.beta.threads.messages.list(threadId);
    const lastMessage = getMsg?.data[0] as any;
    const textContent = JSON.parse(lastMessage.content[0].text.value);
    return textContent
  
}



