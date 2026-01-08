---
description: Initialize context for the GÆISHÆ holographic business card website project
---

# Project Initialization

This workflow helps you get oriented with the GÆISHÆ project codebase.

## Project Overview

GÆISHÆ is a holographic business card website for an artist. It features:

- Animated holographic card with color-shifting effects (green/red)
- 3D card flip animation with contact form and action buttons
- Programmatic sound effects (Web Audio API)
- Telegram bot integration for booking submissions
- Multi-language support (Ukrainian/English)

## Key Files

| File              | Purpose                                            |
| ----------------- | -------------------------------------------------- |
| `index.html`      | Main page structure with card markup and modals    |
| `styles.css`      | CSS animations, holographic effects, 3D transforms |
| `script.js`       | `HolographicCard` class, main logic, form handling |
| `localization.js` | UK/EN translations and language detection          |
| `worker.js`       | Cloudflare Worker for Telegram bot webhook         |
| `wrangler.toml`   | Cloudflare Worker/Pages configuration              |

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JavaScript (no frameworks)
- **Hosting**: Cloudflare Pages
- **Backend**: Cloudflare Workers
- **Integration**: Telegram Bot API

## Development Commands

```bash
# Local development server
// turbo
python -m http.server 8000

# Test Cloudflare Worker locally
npx wrangler dev worker.js

# Deploy to Cloudflare Pages
npx wrangler pages deploy

# Deploy Worker
npx wrangler deploy worker.js
```

## Important Design Principles

1. **No CSS Frameworks** - Pure vanilla CSS with custom holographic effects
2. **No JS Frameworks** - Vanilla JavaScript with Web Audio API
3. **Progressive Enhancement** - Core works without WebGL/advanced features
4. **Mobile-first** - Touch-optimized animation sequences
5. **Performance** - Reduced shader complexity on mobile devices

## Environment Variables

For Telegram integration (set via `npx wrangler secret put`):

- `TELEGRAM_BOT_TOKEN` - Bot token from @BotFather
- `TELEGRAM_CHAT_ID` - Target chat for form submissions

For local development, use `.dev.vars` file.

## Quick Reference

- **Card flip duration**: 0.8s with bounce easing
- **Mobile animation**: 2.2s multi-phase sequence
- **Breakpoints**: 768px (mobile), 500px (small), 350px (minimum)
- **Default language**: Ukrainian

See `CLAUDE.md` for comprehensive technical documentation.
