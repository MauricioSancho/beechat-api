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

/**
 * Chat conversacional con BeeAssist.
 * Detecta el idioma del mensaje y responde en el mismo idioma.
 * Con AI_ENABLED=true usa OpenAI; si no, usa respuestas inteligentes por keywords.
 */
async function chatMessage({ message, history = [] }) {
  if (!message || !message.trim()) {
    return { text: 'No entendí tu mensaje. ¿Puedes repetirlo?', suggestions: ['Intentar de nuevo'], createdAt: new Date().toISOString() };
  }

  if (aiEnabled) {
    const { OpenAI } = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemPrompt = `Eres BeeAssist, el asistente de IA integrado en BeeChat, una aplicación de mensajería.
Eres amigable, conciso y útil. Puedes ayudar a redactar mensajes, resumir conversaciones y responder preguntas generales.
IMPORTANTE: Siempre responde en el mismo idioma que usa el usuario. Si escribe en español, responde en español. Si escribe en inglés, responde en inglés.
Mantén las respuestas cortas (máximo 3-4 oraciones). Al final de cada respuesta incluye 2-3 sugerencias de seguimiento relevantes en formato JSON así:
SUGGESTIONS:["sugerencia1","sugerencia2","sugerencia3"]`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10).map(h => ({ role: h.isUser ? 'user' : 'assistant', content: h.text })),
      { role: 'user', content: message },
    ];

    const response = await openai.chat.completions.create({
      model: process.env.AI_MODEL || 'gpt-4o-mini',
      messages,
      max_tokens: 300,
      temperature: 0.7,
    });

    const raw = response.choices[0].message.content || '';
    const suggMatch = raw.match(/SUGGESTIONS:\[([^\]]+)\]/);
    const suggestions = suggMatch
      ? JSON.parse(`[${suggMatch[1]}]`).map(s => s.trim()).filter(Boolean)
      : [];
    const text = raw.replace(/SUGGESTIONS:\[[^\]]+\]/, '').trim();

    return { text, suggestions, createdAt: new Date().toISOString() };
  }

  // ── Mock inteligente con detección de keywords ──────────────────────────
  return _mockChat(message);
}

function _mockChat(message) {
  const m = (message || '').toLowerCase().trim();

  const greet = ['hola', 'buenas', 'buenos', 'hi ', 'hello', 'hey', 'qué tal', 'que tal', 'cómo estás'];
  if (greet.some(k => m.includes(k) || m === k.trim())) {
    return {
      text: '¡Hola! Soy BeeAssist 🐝, tu asistente de IA en BeeChat. Puedo ayudarte a redactar mensajes, resumir conversaciones y responder preguntas. ¿En qué te ayudo hoy?',
      suggestions: ['¿Qué puedes hacer?', 'Ayúdame a redactar un mensaje', 'Resume una conversación'],
      createdAt: new Date().toISOString(),
    };
  }

  if (['gracias', 'thanks', 'thank you', 'perfecto', 'excelente', 'genial', 'ok gracias'].some(k => m.includes(k))) {
    return {
      text: '¡De nada! 😊 Estoy aquí cuando me necesites. ¿Hay algo más en lo que pueda ayudarte?',
      suggestions: ['Tengo otra pregunta', 'Eso es todo', '¿Qué más puedes hacer?'],
      createdAt: new Date().toISOString(),
    };
  }

  if (['qué puedes', 'que puedes', 'cómo funciona', 'como funciona', 'ayudar', 'what can you', 'funciones', 'capacidades'].some(k => m.includes(k))) {
    return {
      text: 'Puedo ayudarte con:\n• ✍️ Redactar o mejorar mensajes\n• 📋 Resumir conversaciones largas\n• 💬 Sugerir respuestas rápidas\n• ❓ Responder preguntas generales\n\n¿Con qué empezamos?',
      suggestions: ['Redactar un mensaje', 'Resumir una conversación', 'Sugerir respuestas'],
      createdAt: new Date().toISOString(),
    };
  }

  if (['redactar', 'escribir', 'mensaje', 'draft', 'write', 'reply', 'responder', 'contestar'].some(k => m.includes(k))) {
    return {
      text: '¡Con gusto te ayudo a redactar! 📝 Cuéntame el contexto: ¿a quién va dirigido y qué quieres comunicar?',
      suggestions: ['Es para un amigo', 'Es un mensaje formal', 'Es una disculpa'],
      createdAt: new Date().toISOString(),
    };
  }

  if (['resumir', 'resumen', 'resume', 'summarize', 'summary', 'de qué hablan', 'de que hablan'].some(k => m.includes(k))) {
    return {
      text: 'Para resumir una conversación, comparte los mensajes del chat y te daré un resumen claro y conciso. 📋',
      suggestions: ['Aquí están los mensajes', 'Entendido', '¿Cómo los comparto?'],
      createdAt: new Date().toISOString(),
    };
  }

  if (['beechat', 'app', 'aplicación', 'aplicacion', 'funciona', 'usar', 'cómo uso', 'como uso'].some(k => m.includes(k))) {
    return {
      text: 'BeeChat es una app de mensajería segura con cifrado de extremo a extremo. Puedes chatear, crear grupos, compartir historias y más. ¿Sobre qué función quieres saber más?',
      suggestions: ['Sobre grupos', 'Sobre el cifrado', 'Sobre historias'],
      createdAt: new Date().toISOString(),
    };
  }

  if (['grupo', 'group', 'crear grupo', 'miembros', 'agregar'].some(k => m.includes(k))) {
    return {
      text: 'Para crear un grupo en BeeChat ve a Contactos → botón "+" → Nuevo grupo. Puedes agregar hasta los participantes que quieras y asignarle nombre y foto al grupo.',
      suggestions: ['¿Cómo agrego miembros?', 'Entendido', 'Tengo otra pregunta'],
      createdAt: new Date().toISOString(),
    };
  }

  if (['cifrado', 'seguridad', 'seguro', 'privado', 'privacidad', 'encryption', 'e2e'].some(k => m.includes(k))) {
    return {
      text: 'BeeChat usa cifrado de extremo a extremo (E2EE) con X25519 + AES-256-GCM. Esto significa que solo tú y tu contacto pueden leer los mensajes — ni siquiera el servidor puede verlos. 🔒',
      suggestions: ['¿Cómo verifico el cifrado?', 'Entendido, gracias', '¿Qué más es seguro?'],
      createdAt: new Date().toISOString(),
    };
  }

  // Respuesta genérica en español
  return {
    text: `Entendido. Estoy aquí para ayudarte con BeeChat y tus conversaciones. ¿Puedes darme más detalles sobre lo que necesitas? 😊`,
    suggestions: ['Ayúdame a redactar', '¿Qué puedes hacer?', 'Tengo otra pregunta'],
    createdAt: new Date().toISOString(),
  };
}

module.exports = { suggestReplies, summarizeConversation, chatMessage };
