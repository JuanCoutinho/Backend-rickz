import OpenAI from "openai";
import { upload } from "@/functions/IA/cloudinary/upload";

const openai = new OpenAI();


export const gerarAudio = async ({texto} : {texto: string}) => {
    const mp3 = await openai.audio.speech.create({
        model: "tts-1-hd",
        voice: "alloy",
        input: texto,
        response_format: "mp3",
    });
    const arrayBuffer = await mp3.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const criarAudio = await upload(base64, 'video', 'audio/mp3');

    const data = {
        url : criarAudio.url
    }
  return data;
}

