const SYSTEM_PROMPT = 'You are a helpful JAMB/WAEC/NECO tutor for Nigerian secondary school students. Answer exam questions clearly, step-by-step, and concisely.';

const normalizeMessages = messages => Array.isArray(messages)
  ? messages
      .filter(message => message && ['user', 'assistant'].includes(message.role) && typeof message.content === 'string')
      .map(message => ({ role: message.role, content: message.content.slice(0, 4000) }))
  : [];

const getRequestBody = req => {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
};

const getMessageText = data => data?.candidates?.[0]?.content?.parts
  ?.map(part => part?.text || '')
  .join('')
  .trim()
  || data?.choices?.[0]?.message?.content?.trim()
  || data?.choices?.[0]?.text?.trim()
  || '';

async function requestGemini(message, history) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini API key is not configured.');

  const contents = [
    ...history.map(item => ({
      role: item.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: item.content }]
    })),
    { role: 'user', parts: [{ text: message }] }
  ];

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }]
      },
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 700
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini request failed with status ${response.status}.`);
  }

  const data = await response.json();
  const text = getMessageText(data);
  if (!text) throw new Error('Gemini returned an empty response.');
  return text;
}

async function requestGroq(message, history) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('Groq API key is not configured.');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history,
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 700
    })
  });

  if (!response.ok) {
    throw new Error(`Groq request failed with status ${response.status}.`);
  }

  const data = await response.json();
  const text = getMessageText(data);
  if (!text) throw new Error('Groq returned an empty response.');
  return text;
}

async function requestOpenAI(message, history) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key is not configured.');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history,
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 700
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with status ${response.status}.`);
  }

  const data = await response.json();
  const text = getMessageText(data);
  if (!text) throw new Error('OpenAI returned an empty response.');
  return text;
}

async function askTutor(message, history) {
  const providers = [requestGemini, requestGroq, requestOpenAI];
  let lastError;

  for (const provider of providers) {
    try {
      return await provider(message, history);
    } catch (error) {
      lastError = error;
      console.info('AI Tutor API provider fallback triggered:', error?.message || error);
    }
  }

  throw lastError || new Error('No AI provider is available.');
}

export async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const body = getRequestBody(req);
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const history = normalizeMessages(body.history);

  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  try {
    const response = await askTutor(message.slice(0, 4000), history);
    return res.status(200).json({ response });
  } catch (error) {
    console.error('AI Tutor API failed:', error);
    return res.status(500).json({ error: 'AI Tutor is unavailable right now. Please try again later.' });
  }
}

export default handler;
