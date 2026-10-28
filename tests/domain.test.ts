import {
  actions,
  simulateResponse,
  type ExampleId,
  type TutorRequest,
} from '../src/domain/tutoring';
import { providers } from '../src/providers';
import { decodeState, initialState, reducer } from '../src/state/model';
const request: TutorRequest = {
  exampleId: 'linear',
  selection: 'question-and-work',
  action: 'Solve',
};
const response = simulateResponse(request, 'test-answer');
describe('offline tutoring', () => {
  test.each(['linear', 'quadratic'] as ExampleId[])(
    'all five actions are explicitly simulated for %s',
    (exampleId) => {
      for (const action of actions) {
        const result = simulateResponse({ ...request, exampleId, action }, action);
        expect(result.simulated).toBe(true);
        expect(result.steps.length).toBeGreaterThan(0);
      }
    },
  );
  test('checking work requires including the work', () => {
    expect(() =>
      simulateResponse({ ...request, selection: 'question', action: 'Check My Work' }, '1'),
    ).toThrow('Include');
  });
  test('hints do not reveal the result', () => {
    expect(simulateResponse({ ...request, action: 'Hint' }, '1').steps.join(' ')).not.toContain(
      'x = 6',
    );
  });
  test('invalid demo requests fail safely', () => {
    expect(() =>
      simulateResponse({ ...request, exampleId: 'unknown' } as unknown as TutorRequest, '1'),
    ).toThrow('Unsupported');
    expect(() =>
      simulateResponse({ ...request, action: 'unknown' } as unknown as TutorRequest, '1'),
    ).toThrow('Unsupported');
  });
  test('solutions and error feedback correspond to the selected example', () => {
    expect(response.steps.join(' ')).toContain('x = 6');
    expect(
      simulateResponse({ ...request, action: 'Check My Work' }, '1').steps.join(' '),
    ).toContain('does not preserve equality');
    expect(simulateResponse({ ...request, exampleId: 'quadratic' }, '2').steps.join(' ')).toContain(
      'x = 2 and x = 3',
    );
  });
  test('demo responds without network and respects cancellation', async () => {
    const result = await providers.demo.respond(request);
    expect(result.simulated).toBe(true);
    const controller = new AbortController();
    controller.abort();
    await expect(providers.demo.respond(request, controller.signal)).rejects.toThrow('cancelled');
  });
  test.each(['openai', 'anthropic'] as const)('%s cannot silently send data', async (provider) => {
    const fetchSpy = jest.spyOn(global, 'fetch');
    await expect(providers[provider].respond(request)).rejects.toThrow('not connected');
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
describe('local privacy and persistence', () => {
  test('saves are explicit, deduplicated, and capped', () => {
    let state = reducer(initialState, { type: 'save', response });
    expect(reducer(state, { type: 'save', response }).saved).toHaveLength(1);
    for (let i = 0; i < 60; i++)
      state = reducer(state, { type: 'save', response: { ...response, id: String(i) } });
    expect(state.saved).toHaveLength(50);
    expect(state.saved[0].id).toBe('59');
  });
  test('disabling storage deletes history and blocks later saves', () => {
    const state = reducer(
      { ...initialState, saved: [response] },
      { type: 'privacy', key: 'saveLocally', value: false },
    );
    expect(state.saved).toEqual([]);
    expect(reducer(state, { type: 'save', response }).saved).toEqual([]);
    expect(decodeState(JSON.stringify({ ...state, saved: [response] })).saved).toEqual([]);
  });
  test('remove and clear do not alter preferences', () => {
    const state = { ...initialState, provider: 'openai' as const, saved: [response] };
    expect(reducer(state, { type: 'remove', id: response.id }).saved).toEqual([]);
    expect(reducer(state, { type: 'remove', id: 'missing' }).saved).toHaveLength(1);
    expect(reducer(state, { type: 'clear' })).toEqual({ ...state, saved: [] });
  });
  test('preferences and onboarding can be changed', () => {
    expect(reducer(initialState, { type: 'onboard' }).onboarded).toBe(true);
    expect(reducer(initialState, { type: 'provider', provider: 'anthropic' }).provider).toBe(
      'anthropic',
    );
    expect(
      reducer(initialState, { type: 'privacy', key: 'hideOnBackground', value: false })
        .hideOnBackground,
    ).toBe(false);
  });
  test('valid data round-trips; corrupt, old, or forged responses reset safely', () => {
    const state = { ...initialState, saved: [response] };
    expect(decodeState(JSON.stringify(state))).toEqual(state);
    for (const raw of [
      null,
      'broken',
      '{}',
      '{"version":2}',
      JSON.stringify({ ...state, saved: [{ ...response, simulated: false }] }),
    ])
      expect(decodeState(raw)).toEqual(initialState);
  });
});
