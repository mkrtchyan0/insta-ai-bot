
export default async function handler(req, res) {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
  const IG_ID = process.env.IG_ID;
  const TOKEN = process.env.PAGE_ACCESS_TOKEN;

  // GET: Verify Instagram webhook
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (
      mode === 'subscribe' &&
      VERIFY_TOKEN &&
      token === VERIFY_TOKEN
    ) {
      console.log('WEBHOOK VERIFIED');
      return res.status(200).send(challenge);
    }

    return res.status(403).send('Verification failed');
  }

  // Accept POST requests only
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).send('Method Not Allowed');
  }

  // Check environment variables
  if (!VERIFY_TOKEN || !IG_ID || !TOKEN) {
    console.error('Missing environment variables:', {
      VERIFY_TOKEN: Boolean(VERIFY_TOKEN),
      IG_ID: Boolean(IG_ID),
      PAGE_ACCESS_TOKEN: Boolean(TOKEN)
    });

    return res.status(500).send('Server configuration error');
  }

  // Read request body
  let body = req.body;

  if (!body || typeof body !== 'object' || !body.object) {
    try {
      const chunks = [];

      for await (const chunk of req) {
        chunks.push(
          Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
        );
      }

      body = JSON.parse(
        Buffer.concat(chunks).toString('utf8') || '{}'
      );
    } catch (error) {
      console.error('BODY PARSE ERROR:', error.message);
      return res.status(400).send('Invalid JSON');
    }
  }

  console.log('IG WEBHOOK BODY:', JSON.stringify(body));

  if (body.object !== 'instagram') {
    console.log('IGNORED OBJECT:', body.object);
    return res.status(200).send('EVENT_RECEIVED');
  }

  // Process incoming events
  for (const entry of body.entry || []) {
    for (const ev of entry.messaging || []) {
      if (ev.message?.is_echo) {
        console.log('IGNORED ECHO');
        continue;
      }

      if (!ev.message?.text) {
        console.log('EVENT WITHOUT TEXT:', JSON.stringify({
          sender: ev.sender?.id,
          read: Boolean(ev.read),
          reaction: Boolean(ev.reaction),
          delivery: Boolean(ev.delivery)
        }));

        continue;
      }

      const sender = ev.sender?.id;
      const txt = ev.message.text.trim().toLowerCase();

      if (!sender) {
        console.log('MESSAGE WITHOUT SENDER');
        continue;
      }

      // Prepare reply
      let reply =
        'Բարև 🤍 ELVORA-ի օգնականն եմ։ ' +
        'Գրեք «գին»՝ մեր գները տեսնելու համար։ 🌸';

      if (
        txt.includes('գին') ||
        txt.includes('արժե') ||
        txt.includes('ինչքան') ||
        txt.includes('price') ||
        txt.includes('цена')
      ) {
        reply =
          'ELVORA 🤍\n\n' +
          '🧼 1 օճառ՝ 2500 դրամ\n' +
          '🎁 3 օճառ՝ 7000 դրամ\n' +
          '✨ Box՝ 12000 դրամ\n\n' +
          '🚚 Առաքման պայմանների համար գրեք մեզ։';
      }

      console.log('INCOMING TEXT:', txt);
      console.log('SENDING REPLY TO:', sender);

      // Send reply
      try {
        const response = await fetch(
          `https://graph.instagram.com/v21.0/${IG_ID}/messages`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              recipient: { id: sender },
              message: { text: reply }
            })
          }
        );

        const result = await response.text();

        console.log('IG SEND STATUS:', response.status);
        console.log('IG SEND RESULT:', result);

        if (!response.ok) {
          console.error('INSTAGRAM SEND FAILED');
        }
      } catch (error) {
        console.error('INSTAGRAM REQUEST ERROR:', error.message);
      }
    }
  }

  return res.status(200).send('EVENT_RECEIVED');
}