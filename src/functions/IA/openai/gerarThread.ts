import Openai from 'openai';

const openai = new Openai({
    apiKey: process.env.OPENAI_API_KEY,
});

export const gerarThread = async () => {
    const thread = await openai.beta.threads.create();
    return thread.id;
}