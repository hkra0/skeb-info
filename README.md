# Skeb-info 🔍(๑• . •๑)
A simple Skeb user info lookup tool using Cloudflare worker.

English | [中文](README.zh-CN.md)

## Features

- 🔍 Search Skeb artist profiles by username or link.
- 📑 Displays detailed infomation, get price or expiration time even if user stopped request.
- 🔗 Rate-limited Skeb user info API proxy.
- ❤️ User-frendly UI.

## Usage

- Visit [skebinfo.hkra.xyz](https://skebinfo.hkra.xyz/), enter a username or link, and click Search.
- Click the username to open the user's Skeb profile.
- Click the number of `Sent Public Requests` to view the client's request count by creator.

New chat

## Disclaimer

This tool is an unofficial interface for retrieving publicly available Skeb artist information. Users must comply with Skeb's terms of service, including restrictions on misuse, fraudulent activities, or actions that may infringe on third-party rights. The tool's developer are not liable for any misuse, or violations of Skeb's guidelines resulting from its use.

## API endpoints
- User info: `/api/users/<username>`
- All works (creator): `/api/users/<username>/works?role=creator`
- All sent requests (client): `/api/users/<username>/works?role=client`
    - When data volume is too large (exceeds 1200), pagination is required; use `meta.next` from the response as the URL for the next request.

## Deployment
### git
1. Clone or fork this repo.
2. Create a Cloudflare Worker, choose "Import a repository" and select the cloned or forked repo.
3. Save and deploy.
### manual
1. Create a Cloudflare Worker, choose "Start with Hello World!"
2. Replace the content of `worker.js` with [worker.js](worker.js) in this repo.
3. Deploy.
### Wrangler CLI
- Download code and run `weangler deploy`.

## Limitations

- Rate limit: 6 requests per minute per IP.
- Unable to complete requests with excessive data volume (when `Sent Public Requests` exceeds 6,000).
- Relies on Skeb's API: subject to their rate limits and availability.

## License
MIT
