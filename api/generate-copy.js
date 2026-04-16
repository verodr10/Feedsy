export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { description, goal } = req.body;
    if (!description) return res.status(400).json({ error: 'No description provided' });

    const goalInstruction = goal === 'sell'
      ? 'Write posts focused on driving action and sales. Include a clear call to action (e.g., "Order now", "Get yours today", "Link in bio"). Be persuasive and create urgency.'
      : 'Write posts focused on presenting and showcasing the product. Highlight its qualities, uses, and emotional appeal. Inspire, don\'t pressure.';

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
        messages: [{
          role: 'user',
          content: `You are a social media copywriter for small e-commerce businesses.

Product description: ${description}

${goalInstruction}

Write exactly 3 different Instagram post variations. Each should have a different tone or angle.
Use emojis naturally. Keep each post between 2-4 sentences.
Do NOT number them or add labels.
Separate each post with the delimiter: ---POST---`
        }]
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
