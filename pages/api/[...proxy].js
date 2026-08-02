import { withAdminRole } from '@/lib/auth';

const WORKER_URL = 'http://localhost:8787';

async function handler(req, res) {
  const path = req.url;
  const url = `${WORKER_URL}${path}`;

  try {
    const headers = {};
    if (req.headers.authorization) headers.authorization = req.headers.authorization;
    if (req.headers.cookie) headers.cookie = req.headers.cookie;
    headers['content-type'] = req.headers['content-type'] || 'application/json';

    const options = { method: req.method, headers };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      options.body = JSON.stringify(req.body);
    }

    const response = await fetch(url, options);

    response.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (lowerKey !== 'content-length' && lowerKey !== 'transfer-encoding') {
        res.setHeader(key, value);
      }
    });

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      res.status(response.status).json(data);
    } else {
      const text = await response.text();
      res.status(response.status).send(text);
    }
  } catch (error) {
    res.status(503).json({
      error: 'Worker erişilemedi. Worker\'ı başlatın: cd altincag-worker && npx wrangler dev'
    });
  }
}

export default withAdminRole()(handler);

export const config = {
  api: { bodyParser: true },
};
