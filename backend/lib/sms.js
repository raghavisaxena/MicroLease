const https = require('https');

async function sendViaFast2SMS(apiKey, mobile, message) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      route: 'v3',
      sender_id: 'FSTSMS',
      message: message,
      numbers: mobile.replace(/^\+/, '')
    });

    const options = {
      hostname: 'www.fast2sms.com',
      path: '/dev/bulkV2',
      method: 'POST',
      headers: {
        'authorization': apiKey,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body || '{}');
          if (res.statusCode >= 200 && res.statusCode < 300) return resolve(json);
          return reject(new Error(`Fast2SMS error: ${res.statusCode} ${body}`));
        } catch (e) {
          return reject(e);
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(data);
    req.end();
  });
}

async function sendSms(mobile, message) {
  const provider = (process.env.SMS_PROVIDER || '').toLowerCase();
  if (!provider || provider === 'mock') {
    // fallback to console for local dev
    console.log(`SMS (mock) to ${mobile}: ${message}`);
    return { ok: true, provider: 'mock' };
  }

  if (provider === 'fast2sms') {
    const apiKey = process.env.SMS_API_KEY;
    if (!apiKey) throw new Error('SMS_API_KEY not set for fast2sms');
    return await sendViaFast2SMS(apiKey, mobile, message);
  }

  // Unknown provider: throw to let caller fallback or log
  throw new Error(`Unsupported SMS_PROVIDER: ${provider}`);
}

module.exports = { sendSms };
