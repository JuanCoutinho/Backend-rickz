import fs from "fs";
import path from "path";
import os from 'os';

export async function criarFile(blob:any, mediaId:any, tipo: 'mp3' | 'jpeg' | 'opus') {

    try {
        const tempDir = os.tmpdir();
        const filePath = path.join(tempDir, `${mediaId}.${tipo}`);
        await fs.promises.writeFile(filePath, Buffer.from(blob));
        console.log('Arquivo salvo em:', filePath);

        return filePath;
    } catch (err) {
        console.error('Erro ao salvar o arquivo:', err);
        throw err;
    }
}