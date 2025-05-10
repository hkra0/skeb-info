# 🔍 skeb-info
A simple Skeb info lookup tool with wishlist feature. (๑• . •๑)

English | [中文](README.zh-CN.md)

## Features

- 🔍 Search Skeb user profiles by username or link.
- 📑 Displays detailed infomation, get price or expiration time even if user stopped receiving request.
- 🔖 Manage and track infomation of your favorite creators using the wishlist.
- ✨ User-frendly UI.
- 🔗 Skeb user info & works API proxy.

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

Deploy your own instance to avoid rate limits and for personal use.

### Cloudflare Workers
1. Host HTML files (`index.html`, `wishlist.html`) on a static hosting service (e.g., GitHub Pages, Cloudflare Pages).
2. Create and deploy a Cloudflare Worker (using the `wrangler` CLI or Cloudflare dashboard).
3. Add environment variable:
   - `PAGE_URL`: URL of the hosted HTML files (e.g., `https://afxr17light.github.io/Skeb-info/`).  
   - Note: Change `PAGE_URL` in `wrangler.toml`.

### Vercel
- Choose other frameworks and use the default settings for deployment. Includes both API and frontend.

## Limitations

- Rate limit: 100 User info requests per minute, 5 works requests per minute. Requests may fail if data volume is too large.
- Skeb API may be rate limited or unavailable due to changes in fields.

## License
MIT
