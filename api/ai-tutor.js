const SYSTEM_PROMPT = 'You are a helpful JAMB/WAEC/NECO tutor for Nigerian secondary school students. Answer exam questions clearly, step-by-step, and concisely.';

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

const getGeminiText = data => data?.candidates?.[0]?.content?.parts
  ?.map(part => part?.text || '')
  .join('')
  .trim() || '';

async function askGemini(message) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }]
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: message }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 700
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Gemini request failed with status ${response.status}${errorText ? `: ${errorText}` : ''}`);
  }

  const data = await response.json();
  const text = getGeminiText(data);

  if (!text) {
    throw new Error('Gemini returned an empty response.');
  }

  return text;
}

export async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const body = getRequestBody(req);
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  try {
    const response = await askGemini(message.slice(0, 4000));
    return res.status(200).json({ response });
  } catch (error) {
    console.error('AI Tutor Gemini API failed:', error);
    return res.status(500).json({ error: 'AI Tutor is unavailable right now. Please try again later.' });
  }
}

export default handler;
