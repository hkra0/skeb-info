const RATE_LIMIT = 6; // Max requests allowed
const TIME_WINDOW = 60 * 1000; // Time window (1 minute)

const requestCounts = new Map(); // Store request counts per IP

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

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
  // Serve the HTML page for the root path
  if (url.pathname === '/' || url.pathname === '') {
    return new Response(homePage, {
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
        const offset = url.searchParams.get('offset');
        if (!['creator', 'client'].includes(role)) {
          return new Response(JSON.stringify({ error: 'Invalid role parameter' }), {
            status: 400,
            headers: responseHeaders,
          });
        }
        if (sort && offset) {
          apiUrl = `https://skeb.jp/api/users/${username}/works?role=${role}&sort=${sort || 'date'}&offset=${offset || '0'}`;
        } else {
          // Step 1: Get user info to determine total works
          const userResponse = await fetch(`https://skeb.jp/api/users/${username}`, { headers: skebHeaders });
          if (!userResponse.ok) {
            return handleApiError(userResponse, 'User in works api');
          }
          const userData = await userResponse.json();
          const totalWorks = role === 'creator' ? userData.received_works_count : userData.sent_public_works_count;
          const perPage = 30;
          const totalPages = Math.ceil(totalWorks / perPage);
          let allWorks = [];
          // Step 2: Fetch all works in batches
          for (let page = 0; page < totalPages; page++) {
            const currentOffset = page * perPage;
            apiUrl = `https://skeb.jp/api/users/${username}/works?role=${role}&sort=date&offset=${currentOffset}`;
            const worksResponse = await fetch(apiUrl, { headers: skebHeaders });
            if (!worksResponse.ok) {
              return handleApiError(worksResponse, 'Works');
            }
            const worksData = await worksResponse.json();
            allWorks = allWorks.concat(worksData);
          }
          // Step 3: Return combined works
          return new Response(JSON.stringify(allWorks), {
            status: 200,
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
  return new Response('Not Found', { status: 404 });
}
// HTML content
const homePage = `
<!DOCTYPE html>
<html lang="en" class="h-full">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔍(๑• . •๑)</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        // Apply dark mode based on system preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    </script>
</head>
<body class="h-full bg-[#e6ecf0] dark:bg-[#181a1b] py-6 text-gray-900 dark:text-gray-100 transition-all duration-200">
    <div class="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-[#292c2e] rounded-lg shadow-lg">
        <noscript>
            <p class="text-red-500 dark:text-red-400 mb-4">JavaScript is disabled. Please enable JavaScript to use this page.</p>
        </noscript>
        <!-- Title and Input -->
        <div class="py-6">
            <h1 class="text-5xl font-bold mb-4 text-center text-[#28837f]">Skeb info</h1>
            <div class="text-4xl mb-4 text-center">🔍(๑• . •๑)</div>
        </div>
        <div class="py-2 px-4">
            <div class="mb-4 relative">
                <input id="username" type="text" placeholder="Skeb link or username" class="w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 pr-10">
                <button id="clearInput" type="button" class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    onclick="document.getElementById('username').value = ''; document.getElementById('username').focus();">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
            <button onclick="fetchArtistInfo()" class="w-full bg-[#28837f] text-white p-2 rounded hover:bg-[#206966] dark:hover:bg-[#206966] transition-colors">Search</button>
        </div>

        <!-- Result Area -->
        <div id="user-info" class="mt-8"></div>
        <div id="sent-works-info" class="mt-8"></div>
        <div id="received-works-info" class="mt-8"></div>
    </div>

    <script>
        document.getElementById('username').addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                fetchArtistInfo();
                document.getElementById('username').blur();
            }
        });
        async function fetchArtistInfo() {
            const userInfoDiv = document.getElementById('user-info');
            const sentWorksDiv = document.getElementById('sent-works-info');
            const receivedWorksDiv = document.getElementById('received-works-info');
            sentWorksDiv.innerHTML = "";
            receivedWorksDiv.innerHTML = "";
            try {
                const usernameInput = document.getElementById('username').value.trim();
                let username = usernameInput;
                if (username.startsWith('https://skeb.jp/')) {
                    username = username.split('/works/')[0].replace('https://skeb.jp/@', '');
                } else if (username.startsWith('https://x.com/')) {
                    username = username.replace('https://x.com/', '');
                } else if (username.startsWith('https://misskey.io/')) {
                    username = username.replace('https://misskey.io/@', '');
                }
                if (username.startsWith('@')) {
                    username = username.slice(1);
                }
                username = username.replace(/\\s+/g, '_');
                username = username.split('?')[0];
                if (!username) {
                    throw new Error('Username required');
                }
                const isValidUsername = /^[a-zA-Z0-9_]+$/.test(username);
                if (!isValidUsername) {
                    throw new Error('Incorrect username format');
                } else {
                    document.getElementById('username').value = username;
                }
                userInfoDiv.innerHTML = '<p class="text-gray-500 dark:text-gray-400 py-2 px-4">Loading...</p>';

                const response = await fetch(\`/api/users/\${username}\`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Unknown error');
                }
                const data = await response.json();
                if (data.error) {
                    throw new Error(data.error);
                }

                console.info("Raw user data is below 📑(๑• . •๑)")
                console.log(data)

                const twitterScreenName = data.user_service_links?.[0]?.screen_name || null;
                const misskeyScreenName = data.user_service_links?.find(link => link.provider === "misskey_io")?.screen_name || null;

                const links = {
                    twitter_url: twitterScreenName ? \`https://x.com/\${twitterScreenName}\` : null,
                    misskey_url: misskeyScreenName ? \`https://misskey.io/@\${misskeyScreenName}\` : null,
                    pixiv_url: data.pixiv_id ? \`https://www.pixiv.net/users/\${data.pixiv_id}\` : null,
                    booth_url: data.booth_id ? \`https://\${data.booth_id}.booth.pm\` : null,
                    fantia_url: data.fantia_id ? \`https://fantia.jp/fanclubs/\${data.fantia_id}\` : null,
                    fanbox_url: data.fanbox_id ? \`https://\${data.fanbox_id}.fanbox.cc\` : null,
                    nijie_url: data.nijie_id ? \`https://nijie.info/members.php?id=\${data.nijie_id}\` : null,
                    dlsite_url: data.dlsite_id ? \`https://www.dlsite.com/home/circle/profile/=/maker_id/\${data.dlsite_id}\` : null,
                    fanza_url: data.fanza_id ? \`https://www.dmm.co.jp/dc/doujin/-/list/=/article=maker/id/\${data.fanza_id}\` : null,
                    skima_url: data.skima_id ? \`https://skima.jp/profile/users/\${data.skima_id}\` : null,
                    coconala_url: data.coconala_id ? \`https://coconala.com/users/\${data.coconala_id}\` : null,
                    patreon_url: data.patreon_id ? \`https://www.patreon.com/\${data.patreon_id}\` : null,
                    youtube_url: data.youtube_id ? \`https://www.youtube.com/\${data.youtube_id}\` : null,
                    wishlist_url: data.wishlist_id ? \`https://www.amazon.jp/hz/wishlist/ls/\${data.wishlist_id}\` : null,
                };

                // Process skills
                let skillsHtml = '';
                if (data.skills?.length) {
                    skillsHtml = data.skills.map(skill => {
                        const genre = skill.genre;
                        return \`<span class="font-bold">\${genre}</span>&nbsp;&nbsp;JPY&nbsp;\${skill.default_amount}\`;
                    }).join('<br>');
                }

                // Convert times from seconds to days
                const avgResponseDays = data.received_requests_average_response_time ? (data.received_requests_average_response_time / 86400).toFixed(2) : null;
                const avgCompletionDays = data.completing_average_time ? (data.completing_average_time / 86400).toFixed(2) : null;

                // Format fields
                userInfoDiv.innerHTML = \`
                    <div class="overflow-x-auto">
                        <div class="py-2 px-4 flex items-baseline">
                            \${data.request_master_rank ?
                            \`
                            <svg width="24" height="24" viewBox="0 0 640 512" xmlns="http://www.w3.org/2000/svg" class="mr-1">
                            <path fill="currentColor" d="M528 448H112c-8.8 0-16 7.2-16 16v32c0 8.8 7.2 16 16 16h416c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16zm64-320c-26.5 0-48 21.5-48 48 0 7.1 1.6 13.7 4.4 19.8L476 239.2c-15.4 9.2-35.3 4-44.2-11.6L350.3 85C361 76.2 368 63 368 48c0-26.5-21.5-48-48-48s-48 21.5-48 48c0 15 7 28.2 17.7 37l-81.5 142.6c-8.9 15.6-28.9 20.8-44.2 11.6l-72.3-43.4c2.7-6 4.4-12.7 4.4-19.8 0-26.5-21.5-48-48-48S0 149.5 0 176s21.5 48 48 48c2.6 0 5.2-.4 7.7-.8L128 416h384l72.3-192.8c2.5.4 5.1.8 7.7.8 26.5 0 48-21.5 48-48s-21.5-48-48-48z"></path>
                            </svg>
                            \`
                            : ""}
                            <a href="https://skeb.jp/@\${data.screen_name}" target="_blank" class="text-2xl font-bold hover:underline">
                                \${data.name}
                            </a>
                            \${skillsHtml ? \`
                              \${data.acceptable ? \`<span class="font-bold text-sm text-green-600 ml-2">seeking</span>\` : \`<span class="font-bold text-sm text-gray-500 ml-2">stopped</span>\`}\`
                              : ""}
                        </div>
                        <p class="py-2 px-4">\${sanitizeDescription(data.description) || '<span class="text-gray-500">no description</span>'}</p>
                        <div class="py-2 px-4 mb-8">
                            \${links.twitter_url ? \`<a href="\${links.twitter_url}" target="_blank" class="text-[#28837f] font-bold hover:underline">Twitter</a>\` : ""}
                            \${links.misskey_url ? \`/&nbsp;<a href="\${links.misskey_url}" target="_blank" class="text-[#28837f] font-bold hover:underline">Misskey</a>\` : ""}
                            \${links.pixiv_url ? \`/&nbsp;<a href="\${links.pixiv_url}" target="_blank" class="text-[#28837f] font-bold hover:underline">Pixiv</a>\` : ""}
                            \${links.booth_url ? \`/&nbsp;<a href="\${links.booth_url}" target="_blank" class="text-[#28837f] font-bold hover:underline">Booth</a>\` : ""}
                            \${links.fantia_url ? \`/&nbsp;<a href="\${links.fantia_url}" target="_blank" class="text-[#28837f] font-bold hover:underline">Fantia</a>\` : ""}
                            \${links.fanbox_url ? \`/&nbsp;<a href="\${links.fanbox_url}" target="_blank" class="text-[#28837f] font-bold hover:underline">Fanbox</a>\` : ""}
                            \${links.nijie_url ? \`/&nbsp;<a href="\${links.nijie_url}" target="_blank" class="text-[#28837f] font-bold hover:underline">Nijie</a>\` : ""}
                            \${links.dlsite_url ? \`/&nbsp;<a href="\${links.dlsite_url}" target="_blank" class="text-[#28837f] font-bold hover:underline">DLsite</a>\` : ""}
                            \${links.fanza_url ? \`/&nbsp;<a href="\${links.fanza_url}" target="_blank" class="text-[#28837f] font-bold hover:underline">Fanza</a>\` : ""}
                            \${links.skima_url ? \`/&nbsp;<a href="\${links.skima_url}" target="_blank" class="text-[#28837f] font-bold hover:underline">Skima</a>\` : ""}
                            \${links.coconala_url ? \`/&nbsp;<a href="\${links.coconala_url}" target="_blank" class="text-[#28837f] font-bold hover:underline">Coconala</a>\` : ""}
                            \${links.patreon_url ? \`/&nbsp;<a href="\${links.patreon_url}" target="_blank" class="text-[#28837f] font-bold hover:underline">Patreon</a>\` : ""}
                            \${links.youtube_url ? \`/&nbsp;<a href="\${links.youtube_url}" target="_blank" class="text-[#28837f] font-bold hover:underline">YouTube</a>\` : ""}
                            \${links.wishlist_url ? \`/&nbsp;<a href="\${links.wishlist_url}" target="_blank" class="text-[#28837f] font-bold hover:underline">Wishlist</a>\` : ""}
                            \${data.url ? \`/&nbsp;<a href="\${data.url}" target="_blank" class="text-[#28837f] font-bold hover:underline">Url (\${new URL(data.url).hostname.split('.').slice(-2).join('.')})</a>\` : ""}
                        </div>
                            <table class="w-full text-left border-collapse">
                            <tbody>
                                \${data.creator ?
                                \`<tr class="separator">
                                  <td colspan="4" class="border-t"></td>
                                </tr>\` : ""}
                                \${skillsHtml ?
                                \`<tr class="border-t border-gray-300 dark:border-gray-600">
                                    <th class="py-2 px-4 font-semibold text-sm sm:text-base">Recommended amount</th>
                                    <td class="py-2 px-4 text-sm sm:text-base">\${skillsHtml}</td>
                                </tr>\` : ""}
                                \${(data.creator && data.accept_expiration_days && data.complete_expiration_days) ?
                                \`<tr class="border-t border-gray-300 dark:border-gray-600">
                                    <th class="py-2 px-4 font-semibold text-sm sm:text-base">Response / Complete expiration days</th>
                                    <td class="py-2 px-4 text-sm sm:text-base">\${data.accept_expiration_days} / \${data.complete_expiration_days}</td>
                                </tr>\` : ""}
                                \${(avgResponseDays && avgCompletionDays) ?
                                \`<tr class="border-t border-gray-300 dark:border-gray-600">
                                    <th class="py-2 px-4 font-semibold text-sm sm:text-base">Response / Complete average days</th>
                                    <td class="py-2 px-4 text-sm sm:text-base">\${avgResponseDays} / \${avgCompletionDays}</td>
                                </tr>\` : ""}
                                \${data.received_works_count ?
                                \`<tr class="border-t border-gray-300 dark:border-gray-600">
                                    <th class="py-2 px-4 font-semibold text-sm sm:text-base">Total</th>
                                    <td class="py-2 px-4 text-sm sm:text-base">
                                        \${data.received_works_count}\${
                                            ((p = data.received_private_works_count, n = data.received_nsfw_works_count) => 
                                                p || n ? \` (\${[p && \`priv \${p}\`, n && \`nsfw \${n}\`].filter(Boolean).join('; ')})\` : ''
                                            )()
                                        }
                                    </td>
                                </tr>\` : ""}
                                \${data.complete_rate ?
                                \`<tr class="border-t border-gray-300 dark:border-gray-600">
                                    <th class="py-2 px-4 font-semibold text-sm sm:text-base">Complete rate</th>
                                    <td class="py-2 px-4 text-sm sm:text-base">\${(data.complete_rate * 100).toFixed(0)}%</td>
                                </tr>\` : ""}
                                \${data.total_appeals_count ?
                                \`<tr class="border-t border-gray-300 dark:border-gray-600">
                                  <th class="py-2 px-4 font-semibold text-sm sm:text-base">Sent appeals</th>
                                  <td class="py-2 px-4 text-sm sm:text-base">\${data.total_appeals_count}</td>
                                </tr>\`: ""}
                                \${data.sent_public_works_count ?
                                \`<tr class="separator">
                                    <td colspan="4" class="border-t"></td>
                                </tr>\`: ""}
                                \${data.request_master_rank ? 
                                \`<tr class="border-t border-gray-300 dark:border-gray-600">
                                    <th class="py-2 px-4 font-semibold text-sm sm:text-base">Request master rank</th>
                                    <td class="py-2 px-4 text-sm sm:text-base">\${data.request_master_rank}</td>
                                </tr>\`: ""}
                                \${data.first_requester_rank ?
                                \`<tr class="border-t border-gray-300 dark:border-gray-600">
                                    <th class="py-2 px-4 font-semibold text-sm sm:text-base">Pioneer rank</th>
                                    <td class="py-2 px-4 text-sm sm:text-base">\${data.first_requester_rank}</td>
                                </tr>\`: ""}
                                \${data.sent_public_works_count ?
                                \`<tr class="border-t border-gray-300 dark:border-gray-600">
                                    <th class="py-2 px-4 font-semibold text-sm sm:text-base">Sent Public Requests</th>
                                    <td class="py-2 px-4 text-sm sm:text-base cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onclick="fetchClientWorks('\${username}')">
                                    \${data.sent_public_works_count} \${data.sent_first_works_count ? \`( first \${data.sent_first_works_count} )\` : ""}
                                    </td>
                                </tr>\`: ""}
                                \${data.sent_requests_average_cancel_time ?
                                \`<tr class="border-t border-gray-300 dark:border-gray-600">
                                    <th class="py-2 px-4 font-semibold text-sm sm:text-base">Sent Requests Average Cancel Time</th>
                                    <td class="py-2 px-4 text-sm sm:text-base">\${(data.sent_requests_average_cancel_time / 86400).toFixed(2)} days</td>
                                </tr>\`: ""}
                            </tbody>
                        </table>
                    </div>
                \`;
            } catch (error) {
                if (error.message.toLowerCase().includes("not found")) {
                    userInfoDiv.innerHTML = \`<p class="text-red-500 dark:text-red-400 py-2 px-4">Error: User not found</p>\`;
                } else {
                    userInfoDiv.innerHTML = \`<p class="text-red-500 dark:text-red-400 py-2 px-4">Error: \${error.message}</p>\`;
                }
            }
        }

        // Sanitize description to prevent XSS and handle newlines
        function sanitizeDescription(description) {
            if (!description) return null;
            const div = document.createElement('div');
            div.textContent = description;
            return div.innerHTML.replace(/\\n/g, '<br>');
        }
        async function fetchClientWorks(username) {
            const sentWorksDiv = document.getElementById('sent-works-info');
            try {
                sentWorksDiv.innerHTML += '<p class="text-gray-500 dark:text-gray-400 py-2 px-4">Loading sent works...</p>';
                
                const response = await fetch(\`/api/users/\${username}/works?role=client\`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to fetch client works');
                }
                const works = await response.json();

                console.info("Raw sent works data is below 📚(๑• . •๑)")
                console.log(works)

                // Aggregate requests and tips by creator
                const creatorStats = {};
                for (const work of works) {
                    const creatorPath = work.path.split('/works/')[0]; // Extract creator username from path (e.g., /@TsukimiSD)
                    const creatorName = creatorPath.replace('/@', '');
                    if (!creatorStats[creatorName]) {
                        creatorStats[creatorName] = { requests: 0, tips: 0 };
                    }
                    creatorStats[creatorName].requests += 1;
                    if (work.tipped) {
                        creatorStats[creatorName].tips += 1;
                    }
                }

                // Convert to array and sort
                const sortedCreators = Object.entries(creatorStats)
                    .map(([name, stats]) => ({ name, ...stats }))
                    .sort((a, b) => {
                        if (a.requests !== b.requests) {
                            return b.requests - a.requests;
                        }
                        if (a.tips !== b.tips) {
                            return b.tips - a.tips;
                        }
                    });

                // Generate table
                const tableHtml = \`
                    <div class="mt-8">
                        <h2 class="text-xl font-bold mb-4 py-2 px-4">Client Requests by Creator</h2>
                        <hr/>
                        <div class="max-h-64 overflow-y-auto">
                            <table class="w-full text-left border-collapse">
                                <thead>
                                    <tr class="border-b border-gray-300 dark:border-gray-600">
                                        <th class="py-2 px-4 font-semibold text-sm sm:text-base">Name</th>
                                        <th class="py-2 px-4 font-semibold text-sm sm:text-base">Tipped / Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    \${sortedCreators.length ? sortedCreators.map(creator => \`
                                        <tr class="border-t border-gray-300 dark:border-gray-600">
                                            <td class="py-2 px-4 text-sm sm:text-base"><a href="https://skeb.jp/@\${creator.name}" target="_blank" class="text-[#28837f] hover:underline">\${creator.name}</a></td>
                                            <td class="py-2 px-4 text-sm sm:text-base">\${creator.tips} / \${creator.requests}</td>
                                        </tr>
                                    \`).join('') : \`
                                        <tr>
                                            <td colspan="3" class="py-2 px-4 text-sm sm:text-base text-gray-500 dark:text-gray-400">No client requests found.</td>
                                        </tr>
                                    \`}
                                </tbody>
                            </table>
                        </div>
                    </div>
                \`;

                // Remove loading message and append table
                sentWorksDiv.innerHTML = tableHtml;
            } catch (error) {
                sentWorksDiv.innerHTML = \`<p class="text-red-500 dark:text-red-400 py-2 px-4">Error fetching client works: \${error.message}</p>\`;
            }
        }
    </script>
</body>
</html>
`;
