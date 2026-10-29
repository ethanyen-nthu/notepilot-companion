import { visionReplySchema, type VisionRequest } from '../../shared/vision';
import type { TutorResponse } from '../domain/tutoring';
export type GatewaySession = { url: string; token: string };
export function gatewayUrl(input: string) {
  const url = new URL(input.trim());
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (
    (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/'
  )
    throw new Error('Use an HTTPS gateway origin, or HTTP localhost for desktop development.');
  return url.origin;
}
export async function checkGateway(session: GatewaySession, signal?: AbortSignal) {
  const response = await fetch(`${gatewayUrl(session.url)}/v1/status`, {
    headers: { Authorization: `Bearer ${session.token}` },
    signal,
  });
  if (!response.ok) throw new Error('Gateway authentication failed or the service is unavailable.');
  const body = await response.json();
  if (body.available !== true || body.provider !== 'openai')
    throw new Error(
      'Live AI is disabled or missing server credentials. The demo remains available.',
    );
}
export async function respondToImage(
  session: GatewaySession,
  request: VisionRequest,
  signal: AbortSignal,
): Promise<TutorResponse> {
  if (!request.consent) throw new Error('Review and consent before uploading.');
  const response = await fetch(`${gatewayUrl(session.url)}/v1/analyze`, {
    method: 'POST',
    signal,
    headers: { Authorization: `Bearer ${session.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const messages: Record<number, string> = {
      401: 'Gateway session expired. Reconnect in Settings.',
      429: 'Usage limit reached. Wait before trying again.',
      503: 'Live AI is disabled. Try the labeled demo.',
      504: 'Analysis timed out. Try a smaller selection.',
      413: 'The selected image is too large.',
    };
    throw new Error(
      messages[response.status] ?? 'The AI request failed. Nothing was saved; you can retry.',
    );
  }
  const result = visionReplySchema.parse(await response.json());
  return {
    id: result.id,
    exampleId: 'image',
    action: request.action,
    selection: request.includesWork ? 'question-and-work' : 'question',
    title: request.action,
    steps: result.analysis.feedback,
    simulated: false,
    analysis: result.analysis,
    provider: result.provider,
    model: result.model,
  };
}
