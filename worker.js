/**
 * Cloudflare Worker for GÆISHÆ Telegram Bot Integration
 * Handles booking form submissions, saves to D1 database, and forwards to Telegram
 *
 * Environment detection:
 * - Set TEST_MODE=true in .dev.vars for local testing (uses test_bookings table)
 * - Production uses prod_bookings table
 * 
 * Anti-spam protections:
 * - Honeypot field detection
 * - Bad words content filter
 * - Rate limiting (3 requests/hour per IP)
 * - Cloudflare Turnstile verification
 */

// Bad words filter - based on actual spam received
// --- Expanded Anti-Spam Block List ---
const BAD_WORDS = [
    // --- Анатомія (груба та сленг) ---
    'член', 'пеніс', 'фаллос', 'стояк', 
    'піхв', 'вагін', 'клітор', 
    'яєчк', 'яйц', 
    'пісюн', 'пісь', 'пісю', 'циць', 'сісь', 'сись', 
    'сосем', 'смокт',
    'дуп', 'срак', 'жоп', 'анал', 'орал',
    'пупсік', 'сосочк',

    // --- Секс дії та процеси (корені) ---
    'трах', 'секс', 'порно', 'єбл', 'ебл', 'бляд', 
    'дроч', 'мастурб',
    'кінча', 'кінчи', 
    'оргазм', 'збудж', 'заводж', 
    'мінет', 'куні', 'мінєт',
    'сперм', 'насінн', 
    'шлюх', 'хвойд', 'курв', 'сучк', 'шалав', 
    'давал', 'смокт',

    // --- Російський мат/Суржик (найчастіші корені) ---
    'хуй', 'хує', 'хуї', 'хуя', 
    'пізд', 'пизд', 'манда',
    'ебат', 'єбат', 'їбат', 
    'мудак', 'підар', 'гандон', 'залуп',

    // --- English (Expanded) ---
    'pussy', 'dick', 'cock', 'fuck', 'bitch', 'whore', 'slut', 
    'porn', 'sex', 'cum', 'suck', 'penis', 'vagina', 'anal', 
    'boobs', 'tits', 'jerk', 'masturbat', 'orgasm', 'horny'
];

function containsBadWords(text) {
    if (!text) return false;
    const lowerText = text.toLowerCase();
    return BAD_WORDS.some(word => lowerText.includes(word));
}

function checkContentFilter(bookingData) {
    const fieldsToCheck = [
        bookingData.name,
        bookingData.contact,
        bookingData.event,
        bookingData.location,
        bookingData.expectations
    ];
    
    return fieldsToCheck.some(field => containsBadWords(field));
}

async function checkRateLimit(ipAddress, env) {
    const tableName = env.TEST_MODE === 'true' ? 'test_bookings' : 'prod_bookings';
    // SQLite CURRENT_TIMESTAMP is in YYYY-MM-DD HH:MM:SS format
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString().replace('T', ' ').split('.')[0];
    
    try {
        const result = await env.DB.prepare(`
            SELECT COUNT(*) as count FROM ${tableName}
            WHERE ip_address = ? AND created_at > ?
        `).bind(ipAddress, oneHourAgo).first();
        
        return result && result.count >= 3; // Max 3 requests per hour
    } catch (error) {
        console.error('Rate limit check failed:', error);
        return false; // Allow on error
    }
}

async function verifyTurnstile(token, ip, env) {
    const secretKey = env.TURNSTILE_SECRET_KEY;
    if (!secretKey || !token) return true; // Skip if not configured or no token
    
    try {
        const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                secret: secretKey,
                response: token,
                remoteip: ip
            })
        });
        
        const result = await response.json();
        return result.success;
    } catch (error) {
        console.error('Turnstile verification failed:', error);
        return true; // Allow on error to not block legitimate users
    }
}

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env)
  },
}

async function handleRequest(request, env) {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return handleCORS()
  }

  // Only handle POST requests to the booking endpoint
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const url = new URL(request.url)

  // Handle booking submission
  if (url.pathname === '/api/submit-booking') {
    return handleBookingSubmission(request, env)
  }

  return new Response('Not found', { status: 404 })
}

async function handleBookingSubmission(request, env) {
  try {
    // Parse the booking form data
    const bookingData = await request.json()

    // Get request metadata
    const ipAddress = request.headers.get('CF-Connecting-IP') || 'unknown'
    const userAgent = request.headers.get('User-Agent') || 'unknown'

    // === ANTI-SPAM CHECKS ===
    
    // 1. Honeypot check - bots fill hidden fields
    if (bookingData.website_url) {
        console.log('Honeypot triggered - bot detected from IP:', ipAddress);
        // Return fake success to fool bots
        return createSuccessResponse('Booking request submitted successfully');
    }
    
    // 2. Turnstile verification
    if (bookingData.turnstileToken) {
        const isValid = await verifyTurnstile(bookingData.turnstileToken, ipAddress, env);
        if (!isValid) {
            console.log('Turnstile verification failed for IP:', ipAddress);
            return createErrorResponse('Верифікація не пройдена', 400);
        }
    }
    
    // 3. Content filter check
    if (checkContentFilter(bookingData)) {
        console.log('Content filter triggered for IP:', ipAddress);
        return createErrorResponse('Заявка містить неприйнятний вміст', 400);
    }
    
    // 4. Rate limiting check
    const isRateLimited = await checkRateLimit(ipAddress, env);
    if (isRateLimited) {
        console.log('Rate limit exceeded for IP:', ipAddress);
        return createErrorResponse('Забагато запитів. Спробуйте пізніше.', 429);
    }

    // === END ANTI-SPAM CHECKS ===

    // Validate required fields
    const { name, contact, event, location, expectations } = bookingData

    if (!name || !contact) {
      return createErrorResponse('Name and contact are required', 400)
    }

    // Environment detection logic
    const DEV_CHAT_ID = '276882687';
    const CLIENT_CHAT_ID = '594236669';
    const currentChatId = String(env.TELEGRAM_CHAT_ID);

    // If it's explicitly set to developer ID, it's a test environment
    // OR if TEST_MODE is explicitly true AND it's not the real client ID
    const isTest = (currentChatId === DEV_CHAT_ID) || 
                   (env.TEST_MODE === 'true' && currentChatId !== CLIENT_CHAT_ID);
    
    const tableName = isTest ? 'test_bookings' : 'prod_bookings'

    console.log(`Processing booking for ${isTest ? 'TEST' : 'PRODUCTION'} environment`)
    console.log(`Chat ID: ${currentChatId}`)

    // Save to D1 database first (so we don't lose data even if Telegram fails)
    let dbSuccess = false

    try {
      await env.DB.prepare(`
        INSERT INTO ${tableName} (name, contact, event, location, expectations, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        name,
        contact,
        event || null,
        location || null,
        expectations || null,
        ipAddress,
        userAgent
      ).run()

      dbSuccess = true
      console.log(`Booking saved to ${tableName} successfully`)
    } catch (error) {
      console.error('Failed to save to database:', error)
      // Continue anyway to try sending to Telegram
    }

    // Send to Telegram
    const telegramSuccess = await sendToTelegram(bookingData, env, isTest)
    const telegramError = telegramSuccess ? null : 'Failed to send to Telegram'

    // Update database with Telegram delivery status if DB save was successful
    if (dbSuccess) {
      try {
        await env.DB.prepare(`
          UPDATE ${tableName}
          SET telegram_sent = ?, telegram_error = ?
          WHERE id = (SELECT MAX(id) FROM ${tableName})
        `).bind(
          telegramSuccess ? 1 : 0,
          telegramError
        ).run()
      } catch (error) {
        console.error('Failed to update Telegram status:', error)
      }
    }

    // Return success if either DB or Telegram worked
    if (dbSuccess || telegramSuccess) {
      return createSuccessResponse('Booking request submitted successfully')
    } else {
      return createErrorResponse('Failed to process booking request', 500)
    }

  } catch (error) {
    console.error('Error processing booking:', error)
    return createErrorResponse('Internal server error', 500)
  }
}

async function sendToTelegram(bookingData, env, isTest) {
  const botToken = env.TELEGRAM_BOT_TOKEN
  const chatId = env.TELEGRAM_CHAT_ID

  if (!botToken || !chatId) {
    console.error('Missing Telegram configuration')
    return false
  }

  const message = formatBookingMessage(bookingData, isTest)
  const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`

  try {
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    })

    return response.ok;
  } catch (error) {
    console.error('Error sending to Telegram:', error.message)
    return false
  }
}

function formatBookingMessage(data, isTest = false) {
  const timestamp = new Date().toLocaleString('uk-UA', {
    timeZone: 'Europe/Kiev',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })

  const envBadge = isTest ? '🧪 <b>TEST ENVIRONMENT</b>\n\n' : ''

  return `${envBadge}🎭 <b>НОВЕ БРОНЮВАННЯ ШОУ</b>

<b>Ім'я:</b> ${escapeHtml(data.name)}
<b>Контакт:</b> ${escapeHtml(data.contact)}
<b>Подія:</b> ${escapeHtml(data.event || 'Не вказано')}
<b>Місце:</b> ${escapeHtml(data.location || 'Не вказано')}
<b>Очікування:</b> ${escapeHtml(data.expectations || 'Не вказано')}

<b>Отримано:</b> ${timestamp}`
}

function escapeHtml(text) {
  if (!text) return 'Не вказано'

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function createSuccessResponse(message) {
  return new Response(JSON.stringify({ success: true, message }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...getCORSHeaders()
    }
  })
}

function createErrorResponse(message, status = 400) {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...getCORSHeaders()
    }
  })
}

function handleCORS() {
  return new Response(null, {
    status: 200,
    headers: getCORSHeaders()
  })
}

function getCORSHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  }
}
