export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Collect body from stream
  let raw = '';
  for await (const chunk of req) raw += chunk;
  const { action, code, refresh_token, redirect_uri } = JSON.parse(raw);

  const CLIENT_ID     = process.env.VITE_BOX_CLIENT_ID;
  const CLIENT_SECRET = process.env.BOX_CLIENT_SECRET;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    res.status(500).json({ error: 'Box credentials not configured' });
    return;
  }

  try {
    let params;

    if (action === 'exchange') {
      params = new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri,
      });
    } else if (action === 'refresh') {
      params = new URLSearchParams({
        grant_type:    'refresh_token',
        refresh_token,
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
      });
    } else {
      res.status(400).json({ error: 'Unknown action' });
      return;
    }

    const boxRes = await fetch('https://api.box.com/oauth2/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    params,
    });

    const data = await boxRes.json();
    res.status(boxRes.ok ? 200 : boxRes.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
