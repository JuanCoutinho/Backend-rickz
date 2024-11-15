import { put_getMensagem } from "@/functions/IA/openai/put_getMensagem";

export const texto_main_function = async ({text, thread, assistantId} : {text: string, thread: any, assistantId: string}) => {

    const resposta = await put_getMensagem({msg: text, threadUser: thread, assistantId}) as any;
    return resposta;
}