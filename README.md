# 🔍 skeb-info
A simple Skeb info lookup tool with wishlist feature. (๑• . •๑)

English | [中文](README.zh-CN.md)

## Features

- 🔍 Search Skeb user profiles by username or link.
- 📑 Displays detailed infomation, get price or expiration time even if user stopped receiving request.
- 🔖 Manage and track infomation of your favorite creators using the wishlist.
- ✨ User-friendly UI.
- 🔗 Skeb user info & works API proxy.

## Usage

- Visit [skebinfo.hkra.xyz](https://skebinfo.hkra.xyz/), enter a username or link, and click Search.
- Click the username to open the user's Skeb profile.
- Click the number of `Sent Public Requests` to view the client's request count by creator.
- Click the bookmark icon to add the user to your wishlist. Once added, the Wishlist section will appear on the bottom of the page.
- You can open the user's Skeb profile, reorder or delete creators in the list. Click the refresh icon to update the wishlist.

### Notes
- Language Support: Currently supports English, Chinese, and Japanese. The interface defaults to your system language (falls back to English if unsupported), or you can manually select a language by adding a suffix to the URL (e.g., `https://skebinfo.hkra.xyz/ja` for Japanese, `en` for English, `zh` for Chinese).
- Username Input: When entering usernames containing underscores (`_`), you can use spaces instead for convenience.

## Disclaimer

This tool is an unofficial interface for retrieving publicly available Skeb artist information. Users must comply with Skeb's terms of service, including restrictions on misuse, fraudulent activities, or actions that may infringe on third-party rights. The tool's developer is not liable for any misuse, or violations of Skeb's guidelines resulting from its use.

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
   - `PAGE_URL`: URL of the hosted HTML files (e.g., `https://<username>.github.io/skeb-info/` for GitHub Pages).  
   - Note: Change `PAGE_URL` in `wrangler.toml`.

### Vercel
- Choose other frameworks and use the default settings for deployment. Includes both API and frontend.

## Limitations

- Rate limit: 100 User info requests per minute, 5 works requests per minute. Requests may fail if data volume is too large.
- Skeb API may be rate limited or unavailable due to changes in fields.

## License
MIT
