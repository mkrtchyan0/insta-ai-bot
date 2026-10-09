require('dotenv').config();
const express = require('express');
const axios = require('axios');
const OpenAI = require('openai');

const app = express();
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// 1. Meta-ի ստուգման համար - GET
app.get('/api/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('WEBHOOK VERIFIED');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// 2. Նոր DM գալու համար - POST
app.post('/api/webhook', async (req, res) => {
  try {
    const body = req.body;

    // Ստուգում ենք որ Instagram-ից ա
    if (body.object === 'instagram') {
      for (const entry of body.entry) {
        const messaging = entry.messaging?.[0];
        if (messaging && messaging.message) {
          const senderId = messaging.sender.id;
          const text = messaging.message.text;

          console.log(`Նոր նամակ ${senderId}-ից: ${text}`);

          // 3. Ուղարկում ենք AI-ին
          const aiResponse = await getAIResponse(text);

          // 4. Հետ ենք ուղարկում Instagram
          await sendInstagramMessage(senderId, aiResponse);
        }
      }
      res.status(200).send('EVENT_RECEIVED');
    } else {
      res.sendStatus(404);
    }
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

async function getAIResponse(userMessage) {
  // Այստեղ դնում ես քո բիզնեսի ինֆոն
  const businessInfo = `
    Բիզնեսը: ELVORA - ձեռագործ օճառներ
    Գներ: 1 հատ - 2500 դրամ
    Առաքում: Երևանում 1000 դրամ, մարզերում 1500 դրամ
    Աշխատանքային ժամեր: 24/7 AI
  `;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: `Դու ${businessInfo} բիզնեսի օգնականն ես: Խոսիր հայերեն, շատ ջերմ, կարճ և բարեկամական: Եթե չգիտես պատասխանը, ասա "Մի փոքր սպասեք, մեր մասնագետը շուտով կմիանա"` },
      { role: "user", content: userMessage }
    ]
  });

  return completion.choices[0].message.content;
}

async function sendInstagramMessage(recipientId, text) {
  const url = `https://graph.facebook.com/v19.0/${process.env.IG_ID}/messages`;

  await axios.post(url, {
    recipient: { id: recipientId },
    message: { text: text }
  }, {
    headers: {
      'Authorization': `Bearer ${process.env.PAGE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
  console.log('Պատասխանը ուղարկվեց:', text);
}

// Local-ի համար
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on ${PORT}`));
}

module.exports = app;