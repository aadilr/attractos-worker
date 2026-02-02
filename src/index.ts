/**
 * AttractOS Worker - AI Bot & Referral Tracker
 *
 * This Worker tracks:
 * 1. AI bot visits (GPTBot, ClaudeBot, etc.)
 * 2. AI referrals (humans clicking links from ChatGPT, Claude, etc.)
 *
 * Deploy via: https://deploy.workers.cloudflare.com
 */

interface Env {
  ATTRACTOS_KEY: string;
  ATTRACTOS_PLAN: string; // 'free' or 'pro'
}

// 40+ AI bot patterns - kept in sync with attractos.com/lib/bots.ts
const AI_BOTS: Record<string, { name: string; company: string }> = {
  // OpenAI
  GPTBot: { name: "GPTBot", company: "OpenAI" },
  "ChatGPT-User": { name: "ChatGPT-User", company: "OpenAI" },
  "OAI-SearchBot": { name: "OAI-SearchBot", company: "OpenAI" },
  SearchGPT: { name: "SearchGPT", company: "OpenAI" },

  // Anthropic
  "anthropic-ai": { name: "ClaudeBot", company: "Anthropic" },
  "Claude-Web": { name: "Claude-Web", company: "Anthropic" },
  ClaudeBot: { name: "ClaudeBot", company: "Anthropic" },

  // Google
  "Google-Extended": { name: "Google-Extended", company: "Google" },
  Googlebot: { name: "Googlebot", company: "Google" },

  // Perplexity
  PerplexityBot: { name: "PerplexityBot", company: "Perplexity" },

  // Microsoft/Bing
  bingbot: { name: "Bingbot", company: "Microsoft" },
  Copilot: { name: "Copilot", company: "Microsoft" },

  // Meta
  FacebookBot: { name: "FacebookBot", company: "Meta" },
  "meta-externalagent": { name: "Meta AI", company: "Meta" },
  "Meta-ExternalAgent": { name: "Meta AI", company: "Meta" },
  "Meta-ExternalFetcher": { name: "Meta Fetcher", company: "Meta" },

  // Apple
  Applebot: { name: "Applebot", company: "Apple" },
  "Applebot-Extended": { name: "Applebot-Extended", company: "Apple" },
  SiriBot: { name: "SiriBot", company: "Apple" },

  // Amazon
  Amazonbot: { name: "Amazonbot", company: "Amazon" },

  // ByteDance
  Bytespider: { name: "Bytespider", company: "ByteDance" },

  // Common Crawl
  CCBot: { name: "CCBot", company: "Common Crawl" },

  // Cohere
  "cohere-ai": { name: "Cohere", company: "Cohere" },

  // AI21
  AI2Bot: { name: "AI2Bot", company: "AI21 Labs" },

  // Diffbot
  Diffbot: { name: "Diffbot", company: "Diffbot" },

  // You.com
  YouBot: { name: "YouBot", company: "You.com" },

  // Neeva
  NeevaBot: { name: "NeevaBot", company: "Neeva" },

  // Hugging Face
  HuggingFaceBot: { name: "HuggingFaceBot", company: "Hugging Face" },

  // Mistral
  MistralBot: { name: "MistralBot", company: "Mistral AI" },

  // Stability AI
  StabilityBot: { name: "StabilityBot", company: "Stability AI" },

  // xAI (Grok)
  GrokBot: { name: "GrokBot", company: "xAI" },
  "xAI-Grok": { name: "Grok", company: "xAI" },

  // Search engines
  BraveBot: { name: "BraveBot", company: "Brave" },
  DuckDuckBot: { name: "DuckDuckBot", company: "DuckDuckGo" },
  YandexBot: { name: "YandexBot", company: "Yandex" },
  Baiduspider: { name: "Baiduspider", company: "Baidu" },
  Sogou: { name: "Sogou", company: "Sogou" },
  "360Spider": { name: "360Spider", company: "Qihoo 360" },

  // SEO tools
  SemrushBot: { name: "SemrushBot", company: "Semrush" },
  AhrefsBot: { name: "AhrefsBot", company: "Ahrefs" },
  rogerbot: { name: "Rogerbot", company: "Moz" },
  MJ12bot: { name: "MJ12bot", company: "Majestic" },
  "Screaming Frog": { name: "Screaming Frog", company: "Screaming Frog" },
};

// Static asset patterns to skip
const STATIC_ASSET_PATTERN =
  /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|webp|avif|mp4|mp3|webm|pdf|zip|tar|gz)$/i;

// AI referrer patterns - detect humans clicking links from AI chat interfaces
const AI_REFERRERS: Record<string, string> = {
  "chat.openai.com": "chatgpt",
  "chatgpt.com": "chatgpt",
  "openai.com": "chatgpt",
  "claude.ai": "claude",
  "anthropic.com": "claude",
  "perplexity.ai": "perplexity",
  "gemini.google.com": "gemini",
  "bard.google.com": "gemini",
  "copilot.microsoft.com": "copilot",
  "meta.ai": "meta-ai",
  "grok.x.ai": "grok",
  "you.com": "you",
  "phind.com": "phind",
  "kagi.com": "kagi",
  "search.brave.com": "brave-leo",
  "duckduckgo.com": "duckduckgo-ai",
};

// Badge HTML - injected for free tier
const BADGE_HTML = `
<a href="https://attractos.com?ref=badge"
   target="_blank"
   rel="noopener"
   style="position:fixed!important;bottom:12px!important;right:12px!important;background:#0a0a0a!important;color:#a3a3a3!important;padding:6px 12px!important;border-radius:4px!important;font-size:11px!important;text-decoration:none!important;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif!important;z-index:2147483647!important;box-shadow:0 2px 8px rgba(0,0,0,0.3)!important;display:flex!important;align-items:center!important;gap:6px!important;border:1px solid #262626!important;">
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0">
    <rect x="3" y="11" width="18" height="10" rx="2"/>
    <circle cx="12" cy="5" r="3"/>
  </svg>
  <span>Bot Traffic by AttractOS</span>
</a>
`;

/**
 * Detect bot from User-Agent string
 */
function detectBot(
  userAgent: string
): { name: string; company: string } | null {
  if (!userAgent) return null;

  const ua = userAgent.toLowerCase();

  for (const [pattern, info] of Object.entries(AI_BOTS)) {
    if (ua.includes(pattern.toLowerCase())) {
      return info;
    }
  }

  return null;
}

/**
 * Detect AI referral from Referer header
 */
function detectAIReferral(referer: string): string | null {
  if (!referer) return null;

  try {
    const url = new URL(referer);
    const hostname = url.hostname.toLowerCase();

    // Check hostname patterns
    for (const [pattern, source] of Object.entries(AI_REFERRERS)) {
      if (hostname.includes(pattern)) {
        return source;
      }
    }

    // Special case: bing.com/chat
    if (hostname.includes("bing.com") && url.pathname.startsWith("/chat")) {
      return "copilot";
    }
  } catch {
    // Invalid URL
  }

  return null;
}

/**
 * Track bot visit to AttractOS
 */
async function trackBot(
  key: string,
  path: string,
  ua: string,
  bot: { name: string; company: string },
  cf: IncomingRequestCfProperties | undefined
): Promise<void> {
  try {
    await fetch("https://attractos.com/api/t", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        t: "bot",
        k: key,
        p: path,
        ua: ua,
        bot: bot.name,
        company: bot.company,
        country: cf?.country,
        city: cf?.city,
        asn: cf?.asn,
      }),
    });
  } catch {
    // Fail silently - don't break the site for tracking errors
  }
}

/**
 * Track AI referral to AttractOS
 */
async function trackReferral(
  key: string,
  path: string,
  llmSource: string,
  cf: IncomingRequestCfProperties | undefined
): Promise<void> {
  try {
    await fetch("https://attractos.com/api/t", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        t: "referral",
        k: key,
        p: path,
        s: llmSource, // LLM source (chatgpt, claude, perplexity, etc.)
        country: cf?.country,
      }),
    });
  } catch {
    // Fail silently - don't break the site for tracking errors
  }
}

/**
 * Verify Worker deployment with AttractOS
 */
async function verifyDeployment(key: string, domain: string): Promise<void> {
  try {
    await fetch("https://attractos.com/api/integrations/cloudflare/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key,
        domain,
        type: "worker",
      }),
    });
  } catch {
    // Fail silently
  }
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);
    const ua = request.headers.get("user-agent") || "";
    const referer = request.headers.get("referer") || "";
    const cf = request.cf as IncomingRequestCfProperties | undefined;

    // Skip static assets
    if (STATIC_ASSET_PATTERN.test(url.pathname)) {
      return fetch(request);
    }

    // Detect bot
    const bot = detectBot(ua);

    if (bot && env.ATTRACTOS_KEY) {
      // Track bot visit (non-blocking)
      ctx.waitUntil(trackBot(env.ATTRACTOS_KEY, url.pathname, ua, bot, cf));
    } else if (env.ATTRACTOS_KEY && referer) {
      // Not a bot - check for AI referral (human clicking link from ChatGPT, etc.)
      const llmSource = detectAIReferral(referer);
      if (llmSource) {
        ctx.waitUntil(trackReferral(env.ATTRACTOS_KEY, url.pathname, llmSource, cf));
      }
    }

    // Verify deployment on first request (one-time, non-blocking)
    // Uses a simple approach - AttractOS will dedupe these
    if (env.ATTRACTOS_KEY && url.pathname === "/") {
      ctx.waitUntil(verifyDeployment(env.ATTRACTOS_KEY, url.hostname));
    }

    // Fetch origin response
    const response = await fetch(request);

    // Only modify HTML responses for badge injection
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      return response;
    }

    // Inject badge for free tier only
    if (env.ATTRACTOS_PLAN === "free") {
      return new HTMLRewriter()
        .on("body", {
          element(el) {
            el.append(BADGE_HTML, { html: true });
          },
        })
        .transform(response);
    }

    return response;
  },
};
