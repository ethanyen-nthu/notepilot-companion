import { useEffect } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync } from 'expo-image-manipulator';
import { ImportedStudy } from '../src/components/ImportedStudy';
import { AppStateProvider, useAppState } from '../src/state/AppState';
import { useGatewaySession } from '../src/state/GatewaySession';
import { checkGateway, gatewayUrl, respondToImage } from '../src/providers/vision';
import { cropFromPoints, fullCrop, pixelCrop, resizeCrop } from '../src/domain/crop';
import { mathParts } from '../src/domain/math';
import { analysisSchema } from '../shared/vision';

jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: { JPEG: 'jpeg' },
}));
const session = { url: 'https://gateway.example', token: 'test-token' };
const request = {
  action: 'Next Step' as const,
  includesWork: true,
  consent: true as const,
  image: { base64: '/9j/AA==', mime: 'image/jpeg' as const },
};
const analysis = analysisSchema.parse({
  problem: '3x+5=20',
  reading: 'uncertain',
  uncertainty: ['Confirm the coefficient is 3.'],
  observedSteps: [{ text: '3x=15', verdict: 'correct', reason: 'Subtract 5.' }],
  stoppedAt: '3x=15',
  feedback: ['Divide both sides by 3.'],
  nextStep: 'Divide both sides by 3.',
});
const reply = { id: 'live-1', provider: 'openai', model: 'mock-model', analysis };
function Connected() {
  const { connect } = useGatewaySession();
  const { dispatch, ready } = useAppState();
  useEffect(() => {
    if (!ready) return;
    connect(session);
    dispatch({ type: 'provider', provider: 'openai' });
  }, [connect, dispatch, ready]);
  return <ImportedStudy onDemo={() => {}} />;
}
beforeEach(() => {
  jest.clearAllMocks();
});
test('crop coordinates stay bounded and map to actual pixels', () => {
  expect(pixelCrop(fullCrop, 1000, 500)).toEqual({
    originX: 0,
    originY: 0,
    width: 1000,
    height: 500,
  });
  expect(cropFromPoints({ x: 0.8, y: 0.8 }, { x: 0.2, y: 0.1 })).toEqual({
    x: 0.2,
    y: 0.1,
    width: 0.6000000000000001,
    height: 0.7000000000000001,
  });
  for (const edge of ['left', 'right', 'top', 'bottom'] as const)
    for (const delta of [-2, -0.1, 0.1, 2])
      expect(() => pixelCrop(resizeCrop(fullCrop, edge, delta), 1000, 500)).not.toThrow();
  expect(() => pixelCrop({ ...fullCrop, x: -1 }, 100, 100)).toThrow();
  expect(() => pixelCrop(fullCrop, 0, 100)).toThrow();
});
test('math uses local untrusted-mode rendering and preserves prose', () => {
  const parts = mathParts('Divide: $\\frac{15}{3}$ then check.');
  expect(parts[1].html).toContain('<math');
  expect(parts[0].source).toBe('Divide: ');
  expect(mathParts('$\\href{javascript:alert(1)}{x}$')[0].html).not.toContain('href="javascript:');
});
test('gateway origins reject insecure remote URLs and embedded credentials', () => {
  expect(gatewayUrl('http://localhost:8787')).toBe('http://localhost:8787');
  expect(gatewayUrl('https://gateway.example')).toBe('https://gateway.example');
  for (const bad of [
    'http://remote.example',
    'https://a:b@gateway.example',
    'https://gateway.example/path',
    'https://gateway.example?token=x',
    'https://gateway.example#x',
  ])
    expect(() => gatewayUrl(bad)).toThrow();
});
test('client validates status and structured live responses', async () => {
  const fetcher = jest.spyOn(global, 'fetch');
  fetcher.mockResolvedValue({
    ok: true,
    json: async () => ({ available: true, provider: 'openai' }),
  } as Response);
  await checkGateway(session);
  fetcher.mockResolvedValue({ ok: false } as Response);
  await expect(checkGateway(session)).rejects.toThrow('authentication');
  fetcher.mockResolvedValue({ ok: true, json: async () => ({ available: false }) } as Response);
  await expect(checkGateway(session)).rejects.toThrow('disabled');
  fetcher.mockResolvedValue({ ok: true, json: async () => reply } as Response);
  const live = await respondToImage(session, request, new AbortController().signal);
  expect(live.simulated).toBe(false);
  await expect(
    respondToImage(
      session,
      { ...request, consent: false } as unknown as typeof request,
      new AbortController().signal,
    ),
  ).rejects.toThrow('consent');
  for (const status of [401, 429, 503, 504, 413, 500]) {
    fetcher.mockResolvedValue({ ok: false, status } as Response);
    await expect(respondToImage(session, request, new AbortController().signal)).rejects.toThrow();
  }
  fetcher.mockResolvedValue({
    ok: true,
    json: async () => ({ ...reply, analysis: {} }),
  } as Response);
  await expect(respondToImage(session, request, new AbortController().signal)).rejects.toThrow();
  fetcher.mockRestore();
});
test('import and selection never upload before consent; response and follow-up remain contextual', async () => {
  jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file://sample.jpg', width: 1000, height: 500 }],
  });
  jest
    .mocked(manipulateAsync)
    .mockResolvedValue({ uri: 'file://crop.jpg', width: 1000, height: 500, base64: '/9j/AA==' });
  const fetcher = jest
    .spyOn(global, 'fetch')
    .mockResolvedValue({ ok: true, json: async () => reply } as Response);
  await render(
    <AppStateProvider>
      <Connected />
    </AppStateProvider>,
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Import screenshot or image' }));
  await screen.findByText('Select whole image');
  await fireEvent.press(screen.getByRole('button', { name: 'Move left edge forward' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Next Step' }));
  await screen.findByText('Review before uploading');
  expect(fetcher).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Keep on device' }));
  expect(fetcher).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Next Step' }));
  await fireEvent.press(await screen.findByRole('button', { name: 'Consent and analyze' }));
  await screen.findByText('Recognition: uncertain');
  expect(screen.getByText('Confirm the coefficient is 3.')).toBeTruthy();
  const payload = JSON.parse(fetcher.mock.calls[0][1]?.body as string);
  expect(payload.consent).toBe(true);
  expect(payload.image.base64).toBe('/9j/AA==');
  await fireEvent.press(screen.getByRole('button', { name: 'Explain Further' }));
  await fireEvent.press(await screen.findByRole('button', { name: 'Consent and analyze' }));
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
  const follow = JSON.parse(fetcher.mock.calls[1][1]?.body as string);
  expect(follow.action).toBe('Explain');
  expect(follow.previous.feedback).toEqual(analysis.feedback);
  fetcher.mockRestore();
});
test('cancelling an upload aborts the request and ignores a late answer', async () => {
  jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file://sample.jpg', width: 1000, height: 500 }],
  });
  jest
    .mocked(manipulateAsync)
    .mockResolvedValue({ uri: 'file://crop.jpg', width: 1000, height: 500, base64: '/9j/AA==' });
  let resolve!: (value: Response) => void;
  const fetcher = jest.spyOn(global, 'fetch').mockImplementation(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  await render(
    <AppStateProvider>
      <Connected />
    </AppStateProvider>,
  );
  await fireEvent.press(screen.getByRole('button', { name: 'Import screenshot or image' }));
  await fireEvent.press(await screen.findByRole('button', { name: 'Next Step' }));
  await fireEvent.press(await screen.findByRole('button', { name: 'Consent and analyze' }));
  await fireEvent.press(await screen.findByRole('button', { name: 'Cancel request' }));
  expect(fetcher.mock.calls[0][1]?.signal?.aborted).toBe(true);
  resolve({ ok: true, json: async () => reply } as Response);
  await waitFor(() => expect(screen.queryByText('Temporary explanation')).toBeNull());
  fetcher.mockRestore();
});
