
import Openai from 'openai';
import fs from 'fs';
import { uuid } from 'uuidv4';
import path from 'path';

const openai = new Openai({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function transcribeAudio(file:any) {
    try {
        // Lendo o arquivo como um buffer          
        const transcriptionResponse = await openai.audio.transcriptions.create({
            file: fs.createReadStream(file),
            model: "whisper-1",
        })
        fs.unlinkSync(file);
        return transcriptionResponse;
  
    } catch (error) {
        return new Response('ok');
    }
}