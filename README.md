# GÆISHÆ - Holographic Business Card

Interactive digital business card for artist GÆISHÆ, featuring holographic visual effects, 3D interactivity, and direct booking integration.

## 🌟 Features

-   **Holographic Visuals**: Custom WebGL/GLSL shaders creating a dynamic "digital oil" and chrome effect.
-   **Interactive 3D Card**: Flip animation with physics-based interactions.
-   **Audio Experience**: Sound effects for interactions (flip, hover, click).
-   **Booking System**: Integrated form that sends booking requests directly to Telegram.
-   **Media Portfolio**: Dynamic image and video slider powered by Cloudinary.
-   **Localization**: Support for Ukrainian and English languages.
-   **Responsive Design**: Optimized for both desktop and mobile devices.

## 🛠 Tech Stack

-   **Frontend**: HTML5, CSS3, Vanilla JavaScript
-   **Graphics**: WebGL, GLSL Shaders
-   **Backend**: Cloudflare Workers (Serverless function for Telegram integration)
-   **Hosting**: Cloudflare Pages
-   **Media Storage**: Cloudinary
-   **Domain**: Hostinger (DNS managed via Cloudflare)

## 🚀 Getting Started

### Prerequisites

-   Node.js & npm
-   Cloudflare account
-   Telegram Bot Token
-   Cloudinary account

### Local Development

1. **Clone the repository**

    ```bash
    git clone https://github.com/arximus88/gaeishae.com.git
    cd gaeishae.com
    ```

2. **Install dependencies**

    ```bash
    npm install
    ```

3. **Run local server**
   You can use any static file server or Wrangler for the full experience.
    ```bash
    npx wrangler pages dev .
    ```

### Backend (Worker) Setup

The backend logic resides in `worker.js`. It handles form submissions and forwards them to Telegram.

1. **Configure Wrangler**
   Ensure `wrangler.toml` is set up correctly.

2. **Set Secrets**
   For local development, create a `.dev.vars` file (do not commit this):

    ```ini
    TELEGRAM_BOT_TOKEN=your_bot_token
    TELEGRAM_CHAT_ID=your_chat_id
    ```

    For production, set secrets via Cloudflare Dashboard or CLI:

    ```bash
    npx wrangler secret put TELEGRAM_BOT_TOKEN
    npx wrangler secret put TELEGRAM_CHAT_ID
    ```

3. **Deploy Worker**
    ```bash
    npx wrangler deploy
    ```

## 🌐 Deployment & Configuration

### 1. Hosting (Cloudflare Pages)

The static site is hosted on Cloudflare Pages.

-   Connect your GitHub repository to Cloudflare Pages.
-   Set the build command to `exit 0` (since it's a static site) or leave empty.
-   Output directory: `/` (root).

### 2. Domain Configuration

-   **Registrar**: Hostinger
-   **DNS**: Managed by Cloudflare
-   **Setup**:
    1. In Cloudflare Dashboard, add your site (`gaeishae.com`).
    2. Cloudflare will provide nameservers (e.g., `ns1.cloudflare.com`).
    3. Go to Hostinger -> Domain Management -> DNS/Nameservers.
    4. Change nameservers to the ones provided by Cloudflare.
    5. In Cloudflare Pages settings, add the Custom Domain `gaeishae.com`.

### 3. Media (Cloudinary)

-   Media assets are hosted on Cloudinary.
-   The site fetches assets with the tag `geashae`.
-   Ensure your Cloudinary Cloud Name is updated in `script.js` if changed.

### 4. Telegram Bot

-   Create a bot via [@BotFather](https://t.me/BotFather).
-   Get the **API Token**.
-   Get your **Chat ID** (you can use [@userinfobot](https://t.me/userinfobot)).
-   Add these credentials to Cloudflare Worker secrets.

## 📁 Project Structure

```
├── index.html          # Main entry point
├── styles.css          # Global styles & animations
├── script.js           # Main logic (UI, WebGL, Audio)
├── worker.js           # Cloudflare Worker (Backend API)
├── localization.js     # Translation logic
├── task.md             # Original technical requirements
├── wrangler.toml       # Worker configuration
└── images/             # Static assets
```

## 📄 License

[MIT](LICENSE)
