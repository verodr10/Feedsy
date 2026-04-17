export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { description, goal, tone } = req.body;
    if (!description) return res.status(400).json({ error: 'No description provided' });

    const toneMap = {
      warm: 'Tono cálido y cercano, como una amiga que te cuenta algo. Conversacional, natural.',
      direct: 'Tono directo y seguro. Pocas palabras, alto impacto. Sin rodeos.',
      playful: 'Tono juguetón, divertido, con humor. Irreverente pero amable.',
      minimal: 'Tono minimalista, elegante, aspiracional. Pocas palabras, mucho espacio.'
    };
    const toneInstruction = toneMap[tone] || toneMap.warm;

    const goalInstruction = goal === 'sell'
      ? 'Cada post debe empujar a la acción de compra. Incluye un CTA específico (comprar, escribir por DM, link en bio). Crea sensación de oportunidad sin sonar desesperado.'
      : 'Cada post presenta el producto sin empujar la venta. Enfócate en el contexto, el uso, la emoción de tenerlo.';

    const systemPrompt = `Eres una copywriter experta en redes sociales para pequeñas marcas de e-commerce en Latinoamérica. Tu trabajo es escribir copy que NO suene a IA genérica.

REGLAS CRÍTICAS:
- PROHIBIDO empezar posts con: "Imagine", "Imagina", "Picture this", "There's something magical", "Hay algo mágico", "Descubre", "En un mundo donde"
- PROHIBIDO usar frases vacías tipo: "transformar tu vida", "momentos inolvidables", "experiencia única", "calidad premium"
- PROHIBIDO los 3 posts sonar iguales — cada uno debe tener un ángulo completamente distinto
- PROHIBIDO más de 1 emoji por post (y solo si aporta algo real)
- PROHIBIDO terminar con preguntas retóricas tipo "¿lista para...?"

LO QUE SÍ HACER:
- Escribir como habla una persona real en Instagram, no como una marca corporativa
- Empezar con observaciones concretas, detalles específicos, o afirmaciones directas
- Cada post con una estructura diferente (uno puede ser historia corta, otro lista, otro afirmación directa)
- Usar el idioma del input del usuario (si la descripción está en español, responde en español)
- Los posts deben sonar como si los hubiera escrito la dueña del negocio, no una agencia`;

    const userPrompt = `PRODUCTO: ${description}

TONO DESEADO: ${toneInstruction}

OBJETIVO: ${goalInstruction}

Escribe exactamente 3 posts de Instagram. Cada uno debe:
- Usar una estructura diferente al resto
- Tener entre 2 y 4 oraciones
- Sonar humano, no corporativo ni IA
- No llevar etiquetas ni numeración

Separa cada post con el delimitador: ---POST---`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'API error');
    }

    const data = await response.json();
    const text = data.content[0].text;
    const posts = text.split('---POST---').map(p => p.trim()).filter(p => p.length > 0).slice(0, 3);

    return res.status(200).json({ posts });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
