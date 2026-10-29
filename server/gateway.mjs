import { Buffer } from 'node:buffer';
import { validateJPEG } from './image.mjs';
import { createServer } from 'node:http';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { MAX_IMAGE_BYTES, visionRequestSchema } from '../shared/vision.ts';
import { analyzeOpenAI, GatewayError } from './openai.mjs';

function integer(value, fallback, max) {
  const n = Number(value ?? fallback);
  if (!Number.isInteger(n) || n < 1 || n > max)
    throw new Error('Invalid gateway limit configuration.');
  return n;
}
export function loadConfig(env = process.env) {
  return {
    apiKey: env.OPENAI_API_KEY || '',
    model: env.OPENAI_MODEL || '',
    enabled: env.ENABLE_PAID_AI === 'true',
    token: env.GATEWAY_ACCESS_TOKEN || '',
    allowedOrigin: env.WEB_ORIGIN || '',
    timeoutMs: integer(env.AI_TIMEOUT_MS, 45000, 120000),
    maxOutputTokens: integer(env.AI_MAX_OUTPUT_TOKENS, 1800, 4000),
    dailyLimit: integer(env.AI_DAILY_REQUEST_LIMIT, 20, 200),
    minuteLimit: integer(env.AI_MINUTE_REQUEST_LIMIT, 3, 20),
  };
}
export function ready(config) {
  return Boolean(config.enabled && config.apiKey && config.model && config.token.length >= 32);
}
function authenticated(req, token) {
  const actual = Buffer.from(req.headers.authorization || '');
  const expected = Buffer.from(`Bearer ${token}`);
  return (
    token.length >= 32 && actual.length === expected.length && timingSafeEqual(actual, expected)
  );
}
async function readBody(req) {
  const parts = [];
  let bytes = 0;
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > (MAX_IMAGE_BYTES * 4) / 3 + 24000)
      throw new GatewayError(413, 'too_large', 'Selection exceeds the upload limit.');
    parts.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(parts).toString('utf8'));
  } catch {
    throw new GatewayError(400, 'invalid_json', 'Invalid request.');
  }
}
export function createGateway(
  config = loadConfig(),
  { analyze = analyzeOpenAI, now = Date.now } = {},
) {
  let day = '',
    daily = 0,
    recent = [],
    active = 0;
  const server = createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const send = (status, body) => {
      if (!res.destroyed) {
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(body));
      }
    };
    const origin = req.headers.origin;
    if (origin && origin !== config.allowedOrigin)
      return send(403, { error: 'Origin not allowed.' });
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
      return send(204, {});
    }
    if (!authenticated(req, config.token))
      return send(401, { error: 'Connect with a valid gateway access token.' });
    if (req.method === 'GET' && req.url === '/v1/status')
      return send(200, {
        available: ready(config),
        provider: 'openai',
        model: ready(config) ? config.model : null,
      });
    if (req.method !== 'POST' || req.url !== '/v1/analyze')
      return send(404, { error: 'Not found.' });
    if (!ready(config))
      return send(503, { error: 'Live AI is disabled or not configured. Use the labeled demo.' });
    if (!req.headers['content-type']?.startsWith('application/json'))
      return send(415, { error: 'Expected JSON.' });
    const time = now();
    const today = new Date(time).toISOString().slice(0, 10);
    if (day !== today) {
      day = today;
      daily = 0;
    }
    recent = recent.filter((t) => time - t < 60000);
    if (daily >= config.dailyLimit || recent.length >= config.minuteLimit || active >= 1)
      return send(429, { error: 'Gateway usage limit reached. Try later.' });
    // Reserve before asynchronous body parsing to prevent parallel limit bypass.
    active++;
    recent.push(time);
    const controller = new AbortController();
    const onClose = () => {
      if (!res.writableEnded) controller.abort();
    };
    res.on('close', onClose);
    const timer = setTimeout(() => controller.abort(), config.timeoutMs);
    try {
      const parsed = visionRequestSchema.safeParse(await readBody(req));
      if (!parsed.success)
        throw new GatewayError(
          400,
          'invalid_input',
          'Review the image, action, work selection, and upload consent.',
        );
      const image = Buffer.from(parsed.data.image.base64, 'base64');
      if (
        image.length > MAX_IMAGE_BYTES ||
        image[0] !== 0xff ||
        image[1] !== 0xd8 ||
        image[2] !== 0xff
      )
        throw new GatewayError(400, 'invalid_image', 'Upload a JPEG selection under 3 MB.');
      validateJPEG(image);
      if (controller.signal.aborted) throw new Error('aborted');
      daily++; // Attempts stay charged to the local allowance even after cancel/failure.
      const analysis = await analyze(parsed.data, config, controller.signal);
      if (controller.signal.aborted) throw new Error('aborted');
      send(200, { id: randomUUID(), provider: 'openai', model: config.model, analysis });
    } catch (error) {
      const known = error instanceof GatewayError;
      send(controller.signal.aborted ? 504 : known ? error.status : 502, {
        error: controller.signal.aborted
          ? 'Request cancelled or timed out.'
          : known
            ? error.message
            : 'Analysis failed. Please try again.',
      });
    } finally {
      clearTimeout(timer);
      res.off('close', onClose);
      active--;
    }
  });
  server.requestTimeout = 60000;
  server.headersTimeout = 10000;
  return server;
}
