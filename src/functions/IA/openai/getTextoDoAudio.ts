import OpenAI from "openai";
import fs from "fs";
import { Blob } from "fetch-blob";
import { File } from "fetch-blob/file";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const getTextoDoAudio = async ({audio} : {audio: any}) => {

  try {
    // Baixar o arquivo de áudio da URL do Cloudinary
    const response = await fetch(audio);
    const arrayBuffer = await response.arrayBuffer();

    // Criar um Blob a partir do ArrayBuffer
    const audioBlob = new Blob([arrayBuffer], { type: 'audio/wav' });

    // Criar um objeto File a partir do Blob
    const audioFile = new File([audioBlob], 'audio.wav', { type: 'audio/wav' });

    // Usar a API do OpenAI para criar a transcrição
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
    });

    if (!transcription.text) return null;

    return transcription.text;
  } catch (err) {
    console.error(err);
    return null;
  }
}
