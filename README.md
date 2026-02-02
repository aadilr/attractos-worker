# AttractOS Worker

Track AI bot visits to your website with zero code changes.

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/AadilRazvi/attractos-worker)

## What This Does

This Cloudflare Worker intercepts requests to your site and:

1. **Detects 40+ AI bots** - GPTBot, ClaudeBot, PerplexityBot, and more
2. **Tracks visits** - Sends bot data to your AttractOS dashboard
3. **Injects badge** (free tier) - Tamper-proof "Bot Traffic by AttractOS" badge

## Quick Start

### Option 1: Deploy Button (Recommended)

1. Click the "Deploy to Cloudflare Workers" button above
2. Log into your Cloudflare account
3. Enter your **AttractOS site key** when prompted (find it at [attractos.com/dashboard/settings](https://attractos.com/dashboard/settings))
4. Click Deploy
5. Configure a route to your domain in the Cloudflare dashboard

### Option 2: Manual Deploy

```bash
# Clone this repo
git clone https://github.com/AadilRazvi/attractos-worker.git
cd attractos-worker

# Install dependencies
npm install

# Set your site key
wrangler secret put ATTRACTOS_KEY

# Deploy
npm run deploy
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ATTRACTOS_KEY` | Yes | Your site key from AttractOS dashboard |
| `ATTRACTOS_PLAN` | No | `free` (default) or `pro` - controls badge injection |

### Routes

After deployment, configure routes in your Cloudflare dashboard:

1. Go to Workers & Pages > Your Worker > Triggers
2. Add route: `yourdomain.com/*`

## Bots Detected

This worker detects 40+ AI and search bots:

- **OpenAI**: GPTBot, ChatGPT-User, OAI-SearchBot, SearchGPT
- **Anthropic**: ClaudeBot, Claude-Web
- **Google**: Google-Extended, Googlebot
- **Perplexity**: PerplexityBot
- **Microsoft**: Bingbot, Copilot
- **Meta**: FacebookBot, Meta AI
- **Apple**: Applebot, Applebot-Extended
- **xAI**: GrokBot
- **And 25+ more...**

## Badge (Free Tier)

Free tier users display a small badge:

```
┌─────────────────────────────────────┐
│ 🤖 Bot Traffic by AttractOS        │
└─────────────────────────────────────┘
```

- Fixed position (bottom-right)
- Dark theme
- Cannot be removed via CSS (inline styles)
- Upgrade to Pro to remove

## How It Works

```
Request → Worker → Detect Bot? → Track (async) → Origin Response
                                     ↓
                              [Badge injection for free tier]
```

1. Worker intercepts all requests
2. Checks User-Agent against 40+ bot patterns
3. If bot detected, sends tracking event to AttractOS (non-blocking)
4. Fetches response from your origin
5. For HTML responses on free tier, injects badge before `</body>`

## Performance

- **Bot detection**: ~0.1ms (string matching)
- **Tracking**: Non-blocking via `ctx.waitUntil()`
- **Badge injection**: Streaming via HTMLRewriter (no buffering)

Total added latency: <1ms

## Support

- Dashboard: [attractos.com](https://attractos.com)
- Documentation: [attractos.com/docs](https://attractos.com/docs)

## License

MIT
