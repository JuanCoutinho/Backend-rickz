"use server"
import OpenAI from "openai";
import fs from "fs";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function transcribeImage(file:any) {

    try {
      // Lendo o arquivo como um buffer
      const transcriptionResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Descreva tudo que você vê na imagem de forma objetiva e clara mas foque apenas em produtos que estão sendo mostrados, separe os textos que tem nela e depois as caracteristicas focando nos frascos e caixas que contém na imagem,caso tenha uma caixa e um frasco forneça a descrição de ambos.Desde cor a textos de forma separada." },
              {
                type: "image_url",
                image_url: {
                  "url": file
                },
              },
            ],
          },
        ],
      });
      return transcriptionResponse;
  
    } catch (error) {
      console.error('_____Erro ao transcrever o áudio_____-:', error);
      throw error;
    }
}
    