import { analysisSchema } from '../../shared/vision';
import { z } from 'zod';
import { actions, type ProviderId, type TutorResponse } from '../domain/tutoring';
const demoResponseSchema = z.object({
  id: z.string().max(100),
  title: z.string().max(100),
  steps: z.array(z.string().max(2000)).max(10),
  action: z.enum(actions),
  exampleId: z.enum(['linear', 'quadratic']),
  selection: z.enum(['question', 'question-and-work']),
  simulated: z.literal(true),
});
export const responseSchema = z.discriminatedUnion('simulated', [
  demoResponseSchema,
  demoResponseSchema.extend({
    simulated: z.literal(false),
    exampleId: z.literal('image'),
    provider: z.literal('openai'),
    model: z.string().max(100),
    analysis: analysisSchema,
  }),
]);
export const stateSchema = z.object({
  version: z.literal(1),
  onboarded: z.boolean(),
  saveLocally: z.boolean(),
  hideOnBackground: z.boolean(),
  provider: z.enum(['demo', 'openai', 'anthropic', 'gemini']),
  saved: z.array(responseSchema).max(50),
});
export type AppState = z.infer<typeof stateSchema>;
export const initialState: AppState = {
  version: 1,
  onboarded: false,
  saveLocally: true,
  hideOnBackground: true,
  provider: 'demo',
  saved: [],
};
export type StateAction =
  | { type: 'hydrate'; state: AppState }
  | { type: 'onboard' }
  | { type: 'provider'; provider: ProviderId }
  | { type: 'privacy'; key: 'saveLocally' | 'hideOnBackground'; value: boolean }
  | { type: 'save'; response: TutorResponse }
  | { type: 'remove'; id: string }
  | { type: 'clear' };
export function reducer(state: AppState, action: StateAction): AppState {
  switch (action.type) {
    case 'hydrate':
      return action.state.saveLocally ? action.state : { ...action.state, saved: [] };
    case 'onboard':
      return { ...state, onboarded: true };
    case 'provider':
      return { ...state, provider: action.provider };
    case 'privacy':
      return {
        ...state,
        [action.key]: action.value,
        saved: action.key === 'saveLocally' && !action.value ? [] : state.saved,
      };
    case 'save':
      return !state.saveLocally || state.saved.some((item) => item.id === action.response.id)
        ? state
        : { ...state, saved: [action.response, ...state.saved].slice(0, 50) };
    case 'remove':
      return { ...state, saved: state.saved.filter((item) => item.id !== action.id) };
    case 'clear':
      return { ...state, saved: [] };
  }
}
export function decodeState(raw: string | null): AppState {
  if (!raw) return initialState;
  try {
    const parsed = stateSchema.safeParse(JSON.parse(raw));
    return parsed.success
      ? reducer(initialState, { type: 'hydrate', state: parsed.data })
      : initialState;
  } catch {
    return initialState;
  }
}
