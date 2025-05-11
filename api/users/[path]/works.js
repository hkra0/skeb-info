const SUBREQUEST_LIMIT = 40;
const perPage = 30;

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
        let apiUrl;
        const role = url.searchParams.get('role');
        const sort = url.searchParams.get('sort');
        let offset = url.searchParams.get('offset');
        let limit = url.searchParams.get('limit');
        let status = 400;

        if (!['creator', 'client'].includes(role)) {
            res.statusCode = status;
            setResponseHeaders(res, responseHeaders);
            res.end(JSON.stringify({ error: 'Invalid role parameter' }));
            return;
        }

        if (sort && offset) {
            apiUrl = `https://skeb.jp/api/users/${username}/works?role=${role}&sort=${sort || 'date'}&offset=${offset || '0'}`;
        } else {
            let next = null;
            let remain = null;

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

            const responseBody = {
                data: allWorks,
                meta: {
                    total: limit,
                    returned: allWorks.length,
                    next: next,
                    remain: remain,
                },
            };

            res.statusCode = status;
            setResponseHeaders(res, responseHeaders);
            res.end(JSON.stringify(responseBody));
            return;
        }

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