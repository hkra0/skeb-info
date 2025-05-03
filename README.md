# Skeb-info
A simple Skeb user info lookup tool using Cloudflare worker. (๑• . •๑)

English | [中文](README.zh-CN.md)

## Features

- 🔍 Search Skeb artist profiles by username or link.
- 📑 Displays detailed infomation, get price or expiration time even if user stopped request.
- 🔗 Rate-limited Skeb user info API proxy.
- ❤️ User-frendly UI.

## Usage

- Visit [skebinfo.hkra.xyz](https://skebinfo.hkra.xyz/).  
- API endpoint: `/api?username=<username>`.

## Disclaimer

This tool is an unofficial interface for retrieving publicly available Skeb artist information. Users must comply with Skeb's terms of service, including restrictions on misuse, fraudulent activities, or actions that may infringe on third-party rights. The tool's developer are not liable for any misuse, or violations of Skeb's guidelines resulting from its use.

## Deployment

- Deploy the script as a Cloudflare Worker.
- No external dependencies required.

## Limitations

- Rate limit: 10 requests per minute per IP.  
- Relies on Skeb's API: subject to their rate limits and availability.

## License
MIT
