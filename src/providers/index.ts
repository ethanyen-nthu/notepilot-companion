import {
  simulateResponse,
  type ProviderId,
  type TutorRequest,
  type TutorResponse,
} from '../domain/tutoring';
export interface TutorProvider {
  readonly id: ProviderId;
  respond(request: TutorRequest, signal?: AbortSignal): Promise<TutorResponse>;
}
export const demoProvider: TutorProvider = {
  id: 'demo',
  async respond(request, signal) {
    if (signal?.aborted) throw new Error('Request cancelled.');
    return simulateResponse(request, `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
  },
};
// Fail closed until an authenticated gateway and per-request consent exist.
// Provider credentials belong on that server, never in Expo public config.
class UnconfiguredProvider implements TutorProvider {
  constructor(readonly id: 'openai' | 'anthropic' | 'gemini') {}
  async respond(): Promise<never> {
    throw new Error('Live AI is not connected. Choose the offline demonstration.');
  }
}
export const providers: Record<ProviderId, TutorProvider> = {
  demo: demoProvider,
  openai: new UnconfiguredProvider('openai'),
  anthropic: new UnconfiguredProvider('anthropic'),
  gemini: new UnconfiguredProvider('gemini'),
};
