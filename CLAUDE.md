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
├── script.js           # HolographicCard class and main logic
├── localization.js     # Multi-language support (UK/EN translations)
├── logo.mp4           # Video logo for holographic effect
├── batter-video.mp4   # Alternative video asset
├── images/            # Icon assets for buttons (SVG/PNG variants)
├── neuro-noise-glsl-shader/  # GLSL shader effects (NeuroShader class)
│   ├── src/script.js   # WebGL shader implementation
│   └── src/style.css   # Shader-specific styles
├── package.json       # Dependencies: Playwright, dotenv, node-fetch
├── worker.js          # Cloudflare Worker for Telegram integration
├── wrangler.toml      # Cloudflare Worker configuration
├── task.md            # Ukrainian technical specification
└── CLAUDE.md          # This documentation file
```

## Key Technical Requirements

**Holographic Effects:**
- Card should shimmer/transition between green and red colors
- Use CSS linear-gradients with animation keyframes
- Chrome-like or digital oil effect appearance

**Card Animation:**
- 3D flip animation using CSS transforms
- Front: GÆISHÆ logo with holographic effect (video with fallback text)
- Back: Brief description + action buttons (Book Show, Listen to Song, Social Links)

**Multilingual Support:**
- Ukrainian (default) and English languages
- Automatic language detection from browser/URL/localStorage
- Dynamic content switching with localization.js
- Language toggle button with flag indicators

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

## Technical Architecture Deep Dive

### Animation System Architecture

**Card Flip Animation (3D Transform Pipeline):**
- Uses CSS `transform-style: preserve-3d` on container for 3D space
- Flip timing: `0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)` for bounce effect
- Desktop vs Mobile differentiated behavior:
  - Desktop: Instant flip on click with hover effects
  - Mobile: Multi-phase animation (scale → neuro → flip) over 2.2 seconds
- Card faces use `backface-visibility: hidden` for clean transitions
- Z-index management: `.neuro-canvas.clicked` drops to `-1` during flip

**Mobile Animation Sequence:**
```
Phase 1 (0-200ms): Scale down to 0.92, activate neuro effect
Phase 2 (200-1700ms): Hold effect at full intensity  
Phase 3 (1700-2200ms): Scale back to 1.0
Phase 4 (2000ms): Hide neuro, execute flip, reset state
```

**Responsive Breakpoints:**
- `768px`: Mobile detection threshold
- `500px`: Reduced card size (280px → 260px)
- `350px`: Minimum size (240px) with adjusted controls

### GLSL Shader Integration Architecture

**Neuro Effect Pipeline:**
- Canvas positioned absolutely, overlay on card with `pointer-events: none`
- WebGL context with fallback: `webgl` || `experimental-webgl`
- Mobile optimization: Max devicePixelRatio capped at 1, desktop at 2
- Shader uniforms: `u_time`, `u_ratio`, `u_pointer_position`, `u_intensity`

**Performance Optimizations:**
- Reduced iteration count on mobile (15 vs higher on desktop)
- Lower canvas resolution on mobile devices
- Intensity smoothing: `intensity += (target - current) * 0.1`
- Animation loop uses `requestAnimationFrame` for 60fps

**Shader State Management:**
- Show/Hide: Controls `targetIntensity` (0-1.0)
- Pointer tracking: Normalized coordinates (0-1) for shader uniforms
- Blur effect: `.neuro-canvas.clicked` applies 24px blur during card flip

### Localization System Architecture

**Language Detection Hierarchy:**
1. URL parameter: `?lang=uk/en` (highest priority)
2. localStorage: `gaeishae-lang` key
3. Browser language: `navigator.language` check for 'uk' prefix
4. Default fallback: Ukrainian ('uk')

**Translation Application:**
- `[data-i18n]` attributes for text content replacement
- `[data-i18n-title]` attributes for title/tooltip attributes  
- Special handling for form placeholders (input/textarea elements)
- Dynamic HTML `lang` attribute updates for accessibility
- URL state synchronization via `history.replaceState`

### Sound System Architecture

**Web Audio API Implementation:**
- Context creation: `AudioContext || webkitAudioContext` with fallback
- No external audio files - all sounds generated programmatically
- Frequency mapping for different interaction types:
  ```javascript
  flip: [440, 550]        // Card flip action
  click: [660, 440]       // Button interactions  
  success: [440, 550, 660, 880]  // Form success (chord)
  error: [220, 165, 110]  // Error tone (descending)
  ```

**Audio Generation Pipeline:**
- Multiple oscillators per sound for harmony
- Gain envelope: 0 → 0.1 → 0.001 (attack → sustain → release)
- Duration-based complexity: Simple tones (0.3s) vs chords (0.8s)
- Frequency modulation: ±10% variation during playback

**User Control Integration:**
- Sound toggle state persisted in memory (not localStorage)
- Context resume handling for browser autoplay policies
- One-time user gesture listener for context initialization

### Event Handling Architecture

**Multi-Input Support:**
- `pointermove` + `mousemove` for desktop hover tracking
- `click` events with button exclusion logic (`!e.target.closest('.btn')`)
- Keyboard navigation: `Space`/`Enter` for card flip, `Escape` for modals
- Touch-specific: `touchmove` handled separately from mouse events

**Pointer Tracking System:**
- CSS custom properties: `--x`, `--y` (absolute), `--xp`, `--yp` (percentage)
- Card-relative coordinates for mouse glow effects (`--mouse-x`, `--mouse-y`)
- WebGL shader coordinate conversion: `(clientX - rect.left) / rect.width`

**State Management:**
```javascript
// Central state object in HolographicCard class
{
  soundEnabled: boolean,     // Audio toggle state
  isFlipped: boolean,        // Card orientation
  touchActive: boolean,      // Mobile interaction lock
  mobileAnimationActive: boolean,  // Animation state guard
  audioContext: AudioContext,     // Web Audio API context  
  neuroShader: NeuroShader        // WebGL shader instance
}
```

### Performance Considerations

**Mobile Optimizations:**
- Device detection: User agent + orientation + media queries
- Reduced shader complexity and canvas resolution
- Animation state guards prevent double-tap issues
- Hover effects disabled on touch devices

**Memory Management:**
- Oscillators properly disposed after sound completion
- Canvas resize handling for responsive behavior
- WebGL context error handling with graceful degradation
- No memory leaks in animation loops (proper cleanup)

**Loading Strategy:**
- Video logo with text fallback system
- Lazy shader initialization with error boundaries
- Progressive enhancement: Core functionality works without WebGL

## Development Commands

**Local Development:**
```bash
# Serve locally (any simple HTTP server)
python -m http.server 8000
# or
npx http-server
# or use VS Code Live Server extension

# Test Cloudflare Worker locally (requires wrangler.toml config)
npx wrangler dev worker.js
```

**Testing:**
```bash
# Install Playwright browsers first (if needed)
npx playwright install

# Run Playwright tests (no test files currently exist)
npx playwright test

# Run tests in headed mode
npx playwright test --headed

# Note: Test files would need to be created in a tests/ directory
# or with .test.js/.spec.js naming convention
```

**Linting & Validation:**
```bash
# No formal linting setup - project uses browser DevTools for validation
# Check browser console for JavaScript errors
# Validate HTML at https://validator.w3.org/
# Check CSS at https://jigsaw.w3.org/css-validator/
```

**Deployment:**
```bash
# Deploy to Cloudflare Pages
npx wrangler pages deploy

# Deploy Worker (requires environment variables to be set first)
npx wrangler deploy worker.js

# Set production secrets for Worker (one-time setup)
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
```

## Important Notes

- **No CSS Frameworks** - Project specifically avoids Tailwind, Bootstrap, etc.
- **Vanilla JavaScript Only** - No React, Vue, jQuery, or other frameworks
- **Cloudflare-first architecture** - Optimized for Cloudflare Pages + Workers
- **Performance-focused** - Minimal dependencies (only Playwright for testing)
- **Sound UX** - Audio plays only on user interaction, never autoplay
- **Mobile-responsive** - Card animations must work on touch devices
- **Progressive Enhancement** - Core functionality works without WebGL/advanced features

## Environment Variables

**Required for Telegram integration (Cloudflare Worker):**
- `TELEGRAM_BOT_TOKEN` - Bot token from @BotFather
- `TELEGRAM_CHAT_ID` - Target chat for form submissions

**Setting secrets for production:**
```bash
# Set each secret individually (will prompt for value)
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
```

**Local development:**
- For local worker testing, create a `.env` file (not tracked in git)
- Or use wrangler.toml `[env.dev.vars]` section (see wrangler.toml for template)

## Core Architecture Details

**Animation System:**
- **Card Flip**: 0.8s duration with `cubic-bezier(0.175, 0.885, 0.32, 1.275)` for bouncy effect
- **Mobile vs Desktop**: Mobile gets 4-phase animation (2.2s total: scale→hold→scale→flip) vs instant desktop flip
- **3D Pipeline**: Uses `perspective: 960px` with `preserve-3d` and `backface-visibility: hidden`
- **State Management**: Animation locks prevent double-tap issues; transforms reset before flips

**GLSL Shader Integration:**
- **Performance**: Mobile devices get capped `devicePixelRatio` and reduced shader iterations (15 vs higher)  
- **WebGL Pipeline**: 4 uniforms (time, ratio, pointer, intensity) with custom neuro shape algorithm
- **Layering**: Canvas overlays card with `pointer-events: none`, z-index switches during interactions

**Localization Architecture:**
- **Detection Chain**: URL params → localStorage → browser language → Ukrainian default
- **Dynamic Updates**: `data-i18n` attributes with special form field placeholder handling
- **State Sync**: URL and localStorage kept synchronized, HTML lang attribute updated

**Sound System:**
- **Programmatic Generation**: Web Audio API oscillators (no audio files)
- **Frequency Mapping**: Different interactions use specific combinations (flip: [440,550], success: [440,550,660,880])
- **Multi-Oscillator**: Harmonic sound generation with attack-sustain-release envelopes

**Event Handling:**
- **Multi-Input**: Mouse, touch, pointer, keyboard with proper fallbacks
- **Coordinate Tracking**: Both absolute and percentage-based for different effects
- **Button Exclusion**: Prevents card flip when clicking action buttons

## Browser Support

Target modern browsers with CSS 3D transform support:
- Chrome 36+
- Firefox 10+  
- Safari 9+
- Edge 12+