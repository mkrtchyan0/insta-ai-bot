export default function handler(req, res) {
  const VERIFY_TOKEN = 'elvora_verify_2026';
  if (req.method === 'GET') {
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === VERIFY_TOKEN) {
      return res.status(200).send(req.query['hub.challenge']);
    }
    return res.status(403).send('Failed');
  }
  if (req.method === 'POST') {
    return res.status(200).send('EVENT_RECEIVED');
  }
}