export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body;
    const imageBase64 = body && body.imageBase64;
    if (!imageBase64) return res.status(400).json({ error: 'No image provided' });

    // Start prediction
    const startRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': 'Token ' + process.env.REPLICATE_API_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'wait=55'
      },
      body: JSON.stringify({
        version: "fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
        input: { image: imageBase64 }
      })
    });

    const prediction = await startRes.json();

    // If already done (Prefer: wait worked)
    if (prediction.status === 'succeeded') {
      return res.status(200).json({ imageUrl: prediction.output });
    }

    // Otherwise poll for up to 50 seconds
    const id = prediction.id;
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 5000));
      const pollRes = await fetch('https://api.replicate.com/v1/predictions/' + id, {
        headers: { 'Authorization': 'Token ' + process.env.REPLICATE_API_KEY }
      });
      const result = await pollRes.json();
      if (result.status === 'succeeded') {
        return res.status(200).json({ imageUrl: result.output });
      }
      if (result.status === 'failed') {
        return res.status(500).json({ error: 'Background removal failed' });
      }
    }

    return res.status(202).json({ error: 'Still processing, try again' });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
