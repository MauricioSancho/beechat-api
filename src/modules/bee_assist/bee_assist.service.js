/**
 * Bee Assist — Módulo de IA para BeeChat
 *
 * Fase actual: respuestas mock estructuradas.
 * Fase futura: integrar OpenAI / Claude API según AI_ENABLED=true y OPENAI_API_KEY.
 */

const aiEnabled = process.env.AI_ENABLED === 'true' && !!process.env.OPENAI_API_KEY;

/**
 * Sugiere respuestas inteligentes basadas en el contexto del chat
 * @param {{ context: string, draft: string }} params
 */
async function suggestReplies({ context, draft }) {
  if (!aiEnabled) {
    // Respuestas mock para demostración
    return {
      suggestions: [
        '👍 Entendido, gracias!',
        'Claro, con gusto te ayudo.',
        'Perfecto, lo tengo en cuenta.',
      ],
      model: 'mock',
    };
  }

  // Integración real (activar con AI_ENABLED=true)
  // const { OpenAI } = require('openai');
  // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  // const response = await openai.chat.completions.create({
  //   model: process.env.AI_MODEL || 'gpt-4o-mini',
  //   messages: [
  //     { role: 'system', content: 'You are a helpful messaging assistant. Suggest 3 concise reply options in the same language as the context.' },
  //     { role: 'user', content: `Chat context: ${context}\nDraft: ${draft}` }
  //   ],
  //   n: 3,
  //   max_tokens: 150,
  // });
  // return {
  //   suggestions: response.choices.map(c => c.message.content),
  //   model: response.model,
  // };
}

/**
 * Resume una conversación larga
 * @param {{ messages: string[] }} params
 */
async function summarizeConversation({ messages }) {
  if (!messages || messages.length === 0) {
    return { summary: 'No messages to summarize.', model: 'mock' };
  }

  if (!aiEnabled) {
    const count = messages.length;
    return {
      summary: `This conversation has ${count} message${count !== 1 ? 's' : ''}. Topics discussed include general conversation. (Mock summary — enable AI for real summaries)`,
      model: 'mock',
    };
  }

  // Integración real:
  // const joined = messages.slice(-50).join('\n'); // últimos 50 para no exceder contexto
  // const response = await openai.chat.completions.create({...})
  // return { summary: response.choices[0].message.content, model: response.model };
}

module.exports = { suggestReplies, summarizeConversation };
