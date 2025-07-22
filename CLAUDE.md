# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a holographic business card website for artist GÆISHÆ. The site features:
- Animated holographic business card with color-shifting effects (green/red)
- Card flip animation revealing contact form and action buttons
- Sound effects for interactions (optional, user-controllable)
- Telegram bot integration for booking form submissions
- Links to music, social media (Linktree), and booking

## Architecture

**Frontend Stack:**
- Vanilla HTML/CSS/JavaScript (no frameworks by design choice)
- CSS 3D transforms for card flip animations
- Web Audio API for sound effects
- Holographic effects using CSS gradients and animations

**Backend/Integration:**
- Cloudflare Pages for static hosting
- Cloudflare Workers for Telegram bot webhook
- Telegram Bot API for form submission handling

**File Structure:**
```
├── index.html          # Main holographic card page
├── styles.css          # CSS animations and holographic effects
├── script.js           # Card flip logic and sound handling
├── sounds/             # Audio files for interactions
├── assets/             # Images and logos
└── worker.js           # Cloudflare Worker for Telegram integration
```

## Key Technical Requirements

**Holographic Effects:**
- Card should shimmer/transition between green and red colors
- Use CSS linear-gradients with animation keyframes
- Chrome-like or digital oil effect appearance

**Card Animation:**
- 3D flip animation using CSS transforms
- Front: GÆISHÆ logo with holographic effect
- Back: Brief description + action buttons (Book Show, Listen to Song, Social Links)

**Sound Integration:**
- Brief "ding" or magical sound on color transitions
- Card flip sound effect
- All sounds must be optional with mute capability
- Keep audio files small (50-200ms duration)

**Telegram Bot Integration:**
- Booking form captures: name, contact, event details, expectations
- Form submission triggers Cloudflare Worker
- Worker forwards data to Telegram bot as private message
- No personal contact exposure, bot-mediated communication only

## Development Commands

**Local Development:**
```bash
# Serve locally (any simple HTTP server)
python -m http.server 8000
# or
npx http-server

# Test Cloudflare Worker locally
npx wrangler dev worker.js
```

**Deployment:**
```bash
# Deploy to Cloudflare Pages
npx wrangler pages deploy

# Deploy Worker
npx wrangler deploy worker.js
```

## Important Notes

- **No Tailwind CSS** - Project specifically avoids CSS frameworks
- **Cloudflare-first architecture** - Optimized for Cloudflare Pages + Workers
- **Performance-focused** - Minimal dependencies, fast loading
- **Sound UX** - Audio plays only on user interaction, never autoplay
- **Mobile-responsive** - Card animations must work on touch devices

## Environment Variables

**Required for Telegram integration:**
- `TELEGRAM_BOT_TOKEN` - Bot token from @BotFather
- `TELEGRAM_CHAT_ID` - Target chat for form submissions

## Browser Support

Target modern browsers with CSS 3D transform support:
- Chrome 36+
- Firefox 10+  
- Safari 9+
- Edge 12+