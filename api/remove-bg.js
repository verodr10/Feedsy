export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'No image provided' });

    // Strip the data:image/...;base64, prefix if present
    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

    const formData = new FormData();
    formData.append('image_file_b64', base64Data);
    formData.append('size', 'auto');

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': process.env.REMOVEBG_API_KEY,
      },
      body: formData
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error('Remove.bg error: ' + err);
    }

    const buffer = await response.arrayBuffer();
    const base64Result = Buffer.from(buffer).toString('base64');
    const imageUrl = 'data:image/png;base64,' + base64Result;

    return res.status(200).json({ imageUrl });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
