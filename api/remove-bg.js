export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET: check prediction status
  if (req.method === 'GET') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'No prediction ID provided' });

    const poll = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: { 'Authorization': `Token ${process.env.REPLICATE_API_KEY}` }
    });
    const result = await poll.json();
    return res.status(200).json(result);
  }

  // POST: start prediction
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'No image provided' });

    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: "fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
        input: { image: imageBase64 }
      })
    });

    const prediction = await response.json();
    return res.status(200).json({ id: prediction.id, status: prediction.status });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
