export default async function handler(req, res) {
  const VERIFY_TOKEN = 'elvora_verify_2026';
  const IG_ID = process.env.IG_ID || '17841442174973604';
  const TOKEN = process.env.PAGE_ACCESS_TOKEN;

  if (req.method === 'GET') {
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === VERIFY_TOKEN) {
      return res.status(200).send(req.query['hub.challenge']);
    }
    return res.status(403).send('Failed');
  }

  if (req.method === 'POST') {
    const body = req.body;
    if (body.object === 'instagram') {
      for (const entry of body.entry || []) {
        for (const event of entry.messaging || []) {
          if (event.message && event.message.text) {
            const senderId = event.sender.id;
            const text = event.message.text.toLowerCase();
            let reply = '';

            if (text.includes('գին') || text.includes('ինչքան') || text.includes('արժե')) {
              reply = 'Բարև Ձեզ! 🤍 ELVORA\n\n🧼 1 օճառ - 2500դ\n🎁 3 օճառ - 7000դ\n✨ Gift Box - 12000դ\n\nԱռաքում Երևանում 7000դ+ անվճար 🚚 Ի՞նչ եք ուզում պատվիրել';
            } else if (text.includes('բաղադր')) {
              reply = '100% բնական 🌿 Շիի յուղ, կոկոսի, ձիթապտղի յուղեր, առանց SLS: Պատրաստված է սիրով Հայաստանում 🇦🇲';
            } else {
              reply = 'Բարև! Ես ELVORA-ի օգնականն եմ 🤍 Գրեք «գին» գնացուցակի համար, կամ ասեք ինչ օճառ եք ուզում 🌸';
            }

            await fetch(`https://graph.instagram.com/v21.0/${IG_ID}/messages`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ recipient: { id: senderId }, message: { text: reply } })
            });
          }
        }
      }
    }
    return res.status(200).send('EVENT_RECEIVED');
  }
}