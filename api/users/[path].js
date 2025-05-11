export default async function handler(req, res) {
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

  const urlPath = req.url.split('?')[0];
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