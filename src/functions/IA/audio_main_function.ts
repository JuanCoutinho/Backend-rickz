import { getTextoDoAudio } from "@/functions/IA/openai/getTextoDoAudio";
import { put_getMensagem } from "@/functions/IA/openai/put_getMensagem";
import { gerarAudio } from "@/functions/IA/openai/gerarAudio";
import { threadId } from "worker_threads";



export const audio_main_function = async ({url, thread, assistantId } : {url: string, thread: string, assistantId: string}) => {
    const audio = url
    console.log(audio);
    if(!audio) return null;
    
    const texto = await getTextoDoAudio({audio: audio}) as any;
    if(!texto) return null;

    const resposta = await put_getMensagem({msg: texto, threadUser: thread , assistantId}) as any;


    const createAudio = await gerarAudio({texto: resposta as string});
    // const createAudio = await gerarAudio({texto: resposta, User});


    return createAudio;
}