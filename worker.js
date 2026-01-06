/**
 * Cloudflare Worker for GÆISHÆ Telegram Bot Integration
 * Handles booking form submissions, saves to D1 database, and forwards to Telegram
 *
 * Environment detection:
 * - Set TEST_MODE=true in .dev.vars for local testing (uses test_bookings table)
 * - Production uses prod_bookings table
 */

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

    // Validate required fields
    const { name, contact, event, location, expectations } = bookingData

    if (!name || !contact) {
      return createErrorResponse('Name and contact are required', 400)
    }

    // Get request metadata
    const ipAddress = request.headers.get('CF-Connecting-IP') || 'unknown'
    const userAgent = request.headers.get('User-Agent') || 'unknown'

    // Determine environment: check TEST_MODE env variable
    const isTest = env.TEST_MODE === 'true'
    const tableName = isTest ? 'test_bookings' : 'prod_bookings'

    console.log(`Processing booking for ${isTest ? 'TEST' : 'PRODUCTION'} environment`)
    console.log(`Chat ID: ${env.TELEGRAM_CHAT_ID}`)

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
    const telegramSuccess = await sendToTelegram(bookingData, env)
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

async function sendToTelegram(bookingData, env) {
  const botToken = env.TELEGRAM_BOT_TOKEN
  const chatId = env.TELEGRAM_CHAT_ID

  console.log('Bot Token available:', !!botToken)
  console.log('Chat ID available:', !!chatId)
  console.log('Target Chat ID:', chatId)

  if (!botToken || !chatId) {
    console.error('Missing Telegram configuration', {
      botToken: !!botToken,
      chatId: !!chatId
    })
    return false
  }

  // Determine environment for message formatting (check TEST_MODE env variable)
  const isTest = env.TEST_MODE === 'true'
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

    if (response.ok) {
      console.log('Message sent to Telegram successfully')
      return true
    } else {
      const errorData = await response.text()
      console.error('Telegram API error:', errorData)
      return false
    }

  } catch (error) {
    console.error('Error sending to Telegram:', error.message, error.stack)
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

👤 <b>Ім'я:</b> ${escapeHtml(data.name)}
📞 <b>Контакт:</b> ${escapeHtml(data.contact)}
🎪 <b>Подія:</b> ${escapeHtml(data.event || 'Не вказано')}
📍 <b>Місце:</b> ${escapeHtml(data.location || 'Не вказано')}
💭 <b>Очікування:</b> ${escapeHtml(data.expectations || 'Не вказано')}

⏰ <b>Отримано:</b> ${timestamp}`
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
