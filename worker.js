const RATE_LIMIT = 6; // Max requests allowed
const TIME_WINDOW = 60 * 1000; // Time window (1 minute)
const SUBREQUEST_LIMIT = 40;
const perPage = 30;

const requestCounts = new Map(); // Store request counts per IP

// Cache for HTML content
let infoPage = null;
let wishlistPage = null;

export default {
  async fetch(request) {
    // Preload HTML content if not already loaded
    if (infoPage === null || wishlistPage === null) {
      const infoResponse = await fetch(`https://afxr17light.github.io/Skeb-info/`);
      const wishlistResponse = await fetch(`https://afxr17light.github.io/Skeb-info/wishlist`);
      infoPage = await infoResponse.text();
      wishlistPage = await wishlistResponse.text();
    }

    return handleRequest(request);
  }
};

async function handleRequest(request) {
  const url = new URL(request.url);
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
  const skebHeaders = {
    'authorization': 'Bearer null',
    'sec-fetch-site': 'same-origin',
    'sec-fetch-mode': 'cors',
  };
  const responseHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  // Handle API errors
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
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: response.status,
      headers: responseHeaders,
    });
  }

  // Rate limiting logic
  if (url.pathname.startsWith('/api')) {
    const now = Date.now();
    let clientData = requestCounts.get(clientIP) || { count: 0, startTime: now };
    // Reset count if time window has passed
    if (now - clientData.startTime > TIME_WINDOW) {
      clientData = { count: 0, startTime: now };
    }
    // Increment request count
    clientData.count += 1;
    // Update map
    requestCounts.set(clientIP, clientData);

    // Check if rate limit exceeded
    if (clientData.count > RATE_LIMIT) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: responseHeaders,
      });
    }
  }

  // Home & user page
  if (url.pathname === '/' || url.pathname === '' || url.pathname.startsWith('/@')) {
    return new Response(infoPage, {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // Wishlist page
  if (url.pathname === '/wishlist' || url.pathname === '/wishlist/') {
    return new Response(wishlistPage, {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/users/')) {
    // Extract username from path
    const pathParts = url.pathname.split('/');
    const username = pathParts[3]?.replace(/^@/, '');
    if (!username) {
      return new Response(JSON.stringify({ error: 'Username is required' }), {
        status: 400,
        headers: responseHeaders,
      });
    }

    try {
      let apiUrl;
      // Handle user info request: /api/users/${username}
      if (pathParts.length === 4) {
        apiUrl = `https://skeb.jp/api/users/${username}`;
      }
      // Handle works requests: /api/users/${username}/works
      else if (pathParts.length === 5 && pathParts[4] === 'works') {
        const role = url.searchParams.get('role');
        const sort = url.searchParams.get('sort');
        let offset = url.searchParams.get('offset');
        let limit = url.searchParams.get('limit');
        let status = 400;

        if (!['creator', 'client'].includes(role)) {
          return new Response(JSON.stringify({ error: 'Invalid role parameter' }), {
            status: status,
            headers: responseHeaders,
          });
        }

        if (sort && offset) { // Normal Skeb webpage request
          apiUrl = `https://skeb.jp/api/users/${username}/works?role=${role}&sort=${sort || 'date'}&offset=${offset || '0'}`;
        } else {
          let next = null;
          let remain = null;

          // Step 1: Determine total works
          if (!limit) {
            const userResponse = await fetch(`https://skeb.jp/api/users/${username}`, { headers: skebHeaders });
            if (!userResponse.ok) {
              return handleApiError(userResponse, 'User in works api');
            }
            const userData = await userResponse.json();
            limit = role === 'creator' ? userData.received_works_count : userData.sent_public_works_count;
          }

          if (!offset) {
            offset = 0;
          }

          let totalPages = Math.ceil(limit / perPage);
          if (totalPages > SUBREQUEST_LIMIT) {
            remain = Math.ceil((totalPages - SUBREQUEST_LIMIT) / SUBREQUEST_LIMIT);
            totalPages = SUBREQUEST_LIMIT;
            status = 206;
            const maxSingleRequest = perPage * SUBREQUEST_LIMIT;
            const newOffset = maxSingleRequest + parseInt(offset);
            next = `/api/users/${username}/works?role=${role}&offset=${newOffset}&limit=${limit - maxSingleRequest}`;
          }

          let allWorks = [];
          // Step 2: Fetch all works in batches
          for (let page = 0; page < totalPages; page++) {
            const currentOffset = page * perPage + parseInt(offset);
            apiUrl = `https://skeb.jp/api/users/${username}/works?role=${role}&sort=date&offset=${currentOffset}`;
            const worksResponse = await fetch(apiUrl, { headers: skebHeaders });
            if (!worksResponse.ok) {
              return handleApiError(worksResponse, 'Works');
            }
            const worksData = await worksResponse.json();
            allWorks = allWorks.concat(worksData);
            status = 200;
          }

          // Step 3: Return result
          const responseBody = {
            data: allWorks,
            meta: {
              total: limit,
              returned: allWorks.length,
              next: next,
              remain: remain,
            },
          };

          return new Response(JSON.stringify(responseBody), {
            status: status,
            headers: responseHeaders,
          });
        }
      } else {
        return new Response(JSON.stringify({ error: 'Invalid API path' }), {
          status: 400,
          headers: responseHeaders,
        });
      }

      const response = await fetch(apiUrl, { headers: skebHeaders });
      if (!response.ok) {
        return handleApiError(response);
      }

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: responseHeaders,
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: responseHeaders,
      });
    }
  }

  // Return 404 for unknown paths
  return new Response('?(๑• . •๑)', { status: 404 });
}