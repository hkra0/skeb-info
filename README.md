# 🔍 Skeb-info
A simple Skeb user info lookup tool with wishlist. (๑• . •๑)

English | [中文](README.zh-CN.md)

## Features

- 🔍 Search Skeb artist profiles by username or link.
- 📑 Displays detailed infomation, get price or expiration time even if user stopped request.
- 💝 Manage and track infomation of favorite creators using wishlist.
- 🔗 Rate-limited Skeb user info API proxy.
- ✨ User-frendly UI.

## Usage

### Info Checker
- Visit [skebinfo.hkra.xyz](https://skebinfo.hkra.xyz/), enter a username or link, and click Search.
- Click the username to open the user's Skeb profile.
- Click the number of `Sent Public Requests` to view the client's request count by creator.

### Wishlist
- Visit [skebinfo.hkra.xyz/wishlist](https://skebinfo.hkra.xyz/wishlist), enter a username or link, and click Add Creator.
- Click Update All Creators to update the wishlist.
- You can open the user's Skeb profile, reorder or delete creators in the list.

## Disclaimer

This tool is an unofficial interface for retrieving publicly available Skeb artist information. Users must comply with Skeb's terms of service, including restrictions on misuse, fraudulent activities, or actions that may infringe on third-party rights. The tool's developer are not liable for any misuse, or violations of Skeb's guidelines resulting from its use.

## API endpoints
- User info: `/api/users/<username>`
- All works (creator): `/api/users/<username>/works?role=creator`
- All sent requests (client): `/api/users/<username>/works?role=client`
    - When data volume is too large (exceeds 1200), pagination is required; use `meta.next` from the response as the URL for the next request.

## Deployment

### Cloudflare Workers
1. Clone or fork this repository.
2. Create a Cloudflare Worker, select "Import a repository" and choose the cloned or forked repository.
3. Keep the default settings and click Save and Deploy.
- **Note:** HTML files are not included, host them on your own. (e.g. GitHub Pages, Vercel, etc.)

### Vercel
- Choose other frameworks and use the default settings for deployment. Includes both API and frontend.

## Limitations

- Rate limit: 6 requests per minute per IP.
- Unable to complete requests with excessive data volume (when `Sent Public Requests` exceeds 6,000).
- Relies on Skeb's API: subject to their rate limits and availability.

## License
MIT
