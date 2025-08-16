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

Deploy your own instance for personal use.

### Cloudflare Workers (recommended)

You can deploy directly to Cloudflare Workers.

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/hkra0/skeb-info)

Or start from Wrangler CLI:

1. Fork this repository.
2. Install [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/).
3. Configure your `wrangler.toml` if needed (e.g. custom rate limits).
4. Run:
   ```bash
   npx wrangler deploy
   ````
   and follow the prompts.

### Vercel

- Fork this repository and import it into [Vercel](https://vercel.com). No extra configuration required.
- Note: rate limiting not supported on Vercel.

## Limitations

- Rate limit: 100 User info requests per minute, 5 works requests per minute. Requests may fail if data volume is too large.
- Skeb API may be rate limited or unavailable due to changes in fields.

## License
MIT
