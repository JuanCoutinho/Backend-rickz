'use server'


const assistantId = process.env.OPENAI_ASSISTANT_ID;
const apiKey = process.env.OPENAI_API_KEY;

export const editarInstrucao = async (itens : any) => {

  
    const url = `https://api.openai.com/v1/assistants/${assistantId}`;

    const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2',
    };
    const body = JSON.stringify({
        instructions: ``,
        
        
    })
    console.log('body:')
    await fetch(url, {
        method: 'POST',
        headers: headers,
        body: body
    })

    return 'ok';

}