const RATE_LIMIT = 6;
const TIME_WINDOW = 60 * 1000;

const requestCounts = new Map();

export default async function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const clientIP = req.headers['x-forwarded-for']?.split(',')[0].trim() || 'unknown';
  const skebHeaders = {
    'authorization': 'Bearer null',
    'sec-fetch-site': 'same-origin',
    'sec-fetch-mode': 'cors',
  };
  const responseHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  function setResponseHeaders(res, headers) {
    Object.entries(headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
  }

  function handleApiError(response, resourceType = 'Resource') {
    let errorMessage;
    switch (response.status) {
      case 403:
        errorMessage = 'Access denied by Skeb';
        break;
      case 404:
        errorMessage = `${resourceType} not found`;
        break;
      case 429:
        errorMessage = 'Skeb API rate limit exceeded';
        break;
      case 500:
        errorMessage = 'Skeb API server error';
        break;
      default:
        errorMessage = `Unexpected API error: ${response.status}`;
    }
    res.statusCode = response.status;
    setResponseHeaders(res, responseHeaders);
    res.end(JSON.stringify({ error: errorMessage }));
  }

  const now = Date.now();
  let clientData = requestCounts.get(clientIP) || { count: 0, startTime: now };
  if (now - clientData.startTime > TIME_WINDOW) {
    clientData = { count: 0, startTime: now };
  }
  clientData.count += 1;
  requestCounts.set(clientIP, clientData);

  if (clientData.count > RATE_LIMIT) {
    res.statusCode = 429;
    setResponseHeaders(res, responseHeaders);
    res.end(JSON.stringify({ error: 'Rate limit exceeded' }));
    return;
  }

  const urlPath = req.url.split('?')[0];
  console.log(`req.url: ${req.url}`);
  console.log('req.query.path:', req.query.path);
  console.log('req.query.role:', req.query.role);
  const pathSegments = urlPath.split('/').filter(Boolean).slice(2);
  if (pathSegments.length < 1) {
    res.statusCode = 400;
    setResponseHeaders(res, responseHeaders);
    res.end(JSON.stringify({ error: 'Username is required' }));
    return;
  }
  const username = pathSegments[0].replace(/^@/, '');

  try {
    const apiUrl = `https://skeb.jp/api/users/${username}`;
    const response = await fetch(apiUrl, { headers: skebHeaders });
    if (!response.ok) {
      return handleApiError(response);
    }

    const data = await response.json();
    res.statusCode = 200;
    setResponseHeaders(res, responseHeaders);
    res.end(JSON.stringify(data));
  } catch (error) {
    res.statusCode = 500;
    setResponseHeaders(res, responseHeaders);
    res.end(JSON.stringify({ error: error.message }));
  }
}