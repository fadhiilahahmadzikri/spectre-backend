import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import { createServer } from 'node:http'

const PORT = Number(process.env.WEBHOOK_RECEIVER_PORT || 8787)
const WEBHOOK_SECRET = process.env.SPECTRE_WEBHOOK_SECRET || ''
const MAX_EVENTS = 25

/** @type {Array<{
 * id: string;
 * receivedAt: string;
 * signature: string | null;
 * signatureStatus: 'valid' | 'invalid' | 'missing' | 'not_configured';
 * payload: Record<string, unknown>;
 * }>}
 */
const events = []

function canonicalJson(payload) {
  return JSON.stringify(sortJsonValue(payload))
}

function sortJsonValue(value) {
  if (Array.isArray(value)) return value.map(sortJsonValue)
  if (!value || typeof value !== 'object') return value

  return Object.keys(value)
    .sort()
    .reduce((sorted, key) => {
      sorted[key] = sortJsonValue(value[key])
      return sorted
    }, {})
}

function sign(payload) {
  const digest = createHmac('sha256', WEBHOOK_SECRET)
    .update(canonicalJson(payload), 'utf8')
    .digest('hex')

  return `sha256=${digest}`
}

function verifySignature(payload, signature) {
  if (!WEBHOOK_SECRET) return 'not_configured'
  if (!signature) return 'missing'

  const expected = sign(payload)
  const expectedBuffer = Buffer.from(expected)
  const receivedBuffer = Buffer.from(signature)

  if (expectedBuffer.length !== receivedBuffer.length) return 'invalid'
  return timingSafeEqual(expectedBuffer, receivedBuffer) ? 'valid' : 'invalid'
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let rawBody = ''

    request.on('data', (chunk) => {
      rawBody += chunk
      if (rawBody.length > 1024 * 1024) {
        request.destroy()
        reject(new Error('payload_too_large'))
      }
    })

    request.on('end', () => {
      try {
        resolve(rawBody ? JSON.parse(rawBody) : {})
      } catch (error) {
        reject(error)
      }
    })

    request.on('error', reject)
  })
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,X-Spectre-Signature',
    'Content-Type': 'application/json',
  })
  response.end(JSON.stringify(payload))
}

function rememberEvent(payload, signature) {
  const event = {
    id: randomUUID(),
    receivedAt: new Date().toISOString(),
    signature,
    signatureStatus: verifySignature(payload, signature),
    payload,
  }

  events.unshift(event)
  events.splice(MAX_EVENTS)
  return event
}

const server = createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    sendJson(response, 204, {})
    return
  }

  if (request.url === '/health' && request.method === 'GET') {
    sendJson(response, 200, { ok: true, configuredSecret: Boolean(WEBHOOK_SECRET) })
    return
  }

  if (request.url === '/events' && request.method === 'GET') {
    sendJson(response, 200, { events, configuredSecret: Boolean(WEBHOOK_SECRET) })
    return
  }

  if (request.url === '/events' && request.method === 'DELETE') {
    events.splice(0)
    sendJson(response, 200, { events, configuredSecret: Boolean(WEBHOOK_SECRET) })
    return
  }

  if (request.url === '/webhook/spectre' && request.method === 'POST') {
    try {
      const payload = await readJsonBody(request)
      const signature = request.headers['x-spectre-signature']?.toString() ?? null
      const event = rememberEvent(payload, signature)
      sendJson(response, 200, { ok: true, id: event.id, signatureStatus: event.signatureStatus })
    } catch (error) {
      sendJson(response, 400, {
        ok: false,
        error: error instanceof Error ? error.message : 'invalid_payload',
      })
    }
    return
  }

  sendJson(response, 404, { ok: false, error: 'not_found' })
})

server.listen(PORT, () => {
  console.log(`Spectre webhook receiver listening on http://localhost:${PORT}`)
  console.log(`Webhook endpoint: http://localhost:${PORT}/webhook/spectre`)
  console.log(`Signature verification: ${WEBHOOK_SECRET ? 'enabled' : 'not configured'}`)
})
