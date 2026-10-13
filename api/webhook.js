export default async function handler(req, res) {
  const VERIFY_TOKEN = 'elvora_verify_2026';
  const IG_ID = '17841442174973604';
  const TOKEN = process.env.PAGE_ACCESS_TOKEN;

  if (req.method === 'GET') {
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === VERIFY_TOKEN) {
      return res.status(200).send(req.query['hub.challenge']);
    }
    return res.status(403).send('Fail');
  }

  if (req.method === 'POST') {
    const body = req.body;
    if (body.object === 'instagram') {
      for (const entry of body.entry || []) {
        for (const ev of entry.messaging || []) {
          if (ev.message?.text) {
            const sender = ev.sender.id;
            const txt = ev.message.text.toLowerCase();
            let reply = 'Բարև! 🤍 ELVORA-ի օգնականն եմ։ Գրեք «գին» 🌸';

            if (txt.includes('գին') || txt.includes('արժե') || txt.includes('ինչքան') || txt.includes('price') || txt.includes('цена')) {
              reply = 'ELVORA 🤍\n\n🧼 1 օճառ - 2500դ\n🎁 3 օճառ - 7000դ\n✨ Box - 12000դ\n\nԱռաքում Երևանում 7000դ+ անվճար 🚚';
            }

            await fetch(`https://graph.instagram.com/v21.0/${IG_ID}/messages`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ recipient: { id: sender }, message: { text: reply } })
            });
          }
        }
      }
    }
    return res.status(200).send('EVENT_RECEIVED');
  }
}