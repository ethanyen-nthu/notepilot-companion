import { Buffer } from 'node:buffer';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { once } from 'node:events';
import { analyzeOpenAI } from '../openai.mjs';
import { createGateway, loadConfig } from '../gateway.mjs';
import { validateJPEG } from '../image.mjs';
import { constrainAnalysis } from '../../shared/vision.ts';

const token = 'test-only-gateway-token-at-least-32-characters';
const config = {
  ...loadConfig({}),
  enabled: true,
  apiKey: 'mock-key-never-used',
  model: 'mock-vision',
  token,
  timeoutMs: 1000,
  dailyLimit: 20,
  minuteLimit: 20,
};
const image = (name) =>
  readFileSync(new URL(`../../tests/fixtures/handwriting/${name}.jpg`, import.meta.url)).toString(
    'base64',
  );
const request = (name = 'correct-partial', action = 'Next Step') => ({
  action,
  includesWork: true,
  consent: true,
  image: { base64: image(name), mime: 'image/jpeg' },
});
const cases = [
  {
    name: 'correct-partial',
    problem: '3x + 5 = 20',
    reading: 'clear',
    uncertainty: [],
    observedSteps: [
      {
        text: '3x = 15',
        verdict: 'correct',
        reason: 'Subtracting 5 from both sides preserves equality.',
      },
    ],
    stoppedAt: '3x = 15',
    feedback: ['Divide both sides by 3.'],
    nextStep: 'Divide both sides of $3x=15$ by 3.',
  },
  {
    name: 'incorrect-partial',
    problem: '2x + 7 = 19',
    reading: 'clear',
    uncertainty: [],
    observedSteps: [
      {
        text: '2x = 19 + 7',
        verdict: 'incorrect',
        reason: 'Subtract 7 from both sides; adding it changes the equation.',
      },
    ],
    stoppedAt: '2x = 26',
    feedback: ['Your first step adds 7. Subtract 7 from both sides instead; revisit that line.'],
    nextStep: 'Replace the first line with $2x=19-7$.',
  },
  {
    name: 'calculus-partial',
    problem: '$\\int x\\cos x\\,dx$',
    reading: 'clear',
    uncertainty: [],
    observedSteps: [
      {
        text: '$x\\sin x-\\int\\sin x\\,dx$',
        verdict: 'correct',
        reason: 'Integration by parts with u=x and dv=cos(x)dx.',
      },
    ],
    stoppedAt: 'Remaining integral of sin(x)',
    feedback: ['Use the antiderivative of sin(x), checking its sign.'],
    nextStep: 'Replace $\\int\\sin x\\,dx$ with $-\\cos x$ in your current expression.',
  },
  {
    name: 'unclear',
    problem: '?x + 7 = 19',
    reading: 'unreadable',
    uncertainty: ['The coefficient and right-hand value cannot be read.'],
    observedSteps: [],
    stoppedAt: 'Unknown',
    feedback: ['Do not trust this invented solution: x=6'],
    nextStep: 'Invented answer',
  },
];
const completed = (analysis) => ({
  ok: true,
  json: async () => ({
    status: 'completed',
    output: [
      { type: 'message', content: [{ type: 'output_text', text: JSON.stringify(analysis) }] },
    ],
  }),
});

for (const fixture of cases)
  test(`mock vision contract: ${fixture.name}`, async () => {
    const { name, ...analysis } = fixture;
    let sent;
    const result = await analyzeOpenAI(
      request(name),
      config,
      new AbortController().signal,
      async (url, init) => {
        assert.equal(url, 'https://api.openai.com/v1/responses');
        sent = JSON.parse(init.body);
        return completed(analysis);
      },
    );
    assert.equal(sent.store, false);
    assert.equal(sent.max_output_tokens, 1800);
    assert.equal(sent.input[0].content[1].image_url, `data:image/jpeg;base64,${image(name)}`);
    assert.equal(sent.text.format.strict, true);
    assert.match(sent.instructions, /ONLY ONE meaningful next step/);
    if (name === 'unclear') {
      assert.equal(result.observedSteps.length, 0);
      assert.equal(result.nextStep, '');
      assert.doesNotMatch(result.feedback.join(), /x=6/);
    } else {
      assert.deepEqual(result.feedback, [analysis.nextStep]);
      assert.equal(result.stoppedAt, analysis.stoppedAt);
    }
  });
test('hint and check prompts explicitly prevent unwanted full solutions; context is supplied', async () => {
  const { name: _name, ...analysis } = cases[1];
  await analyzeOpenAI(
    {
      ...request('incorrect-partial', 'Check My Work'),
      previous: { action: 'Hint', feedback: ['Consider equality'], nextStep: '' },
    },
    config,
    new AbortController().signal,
    async (_url, init) => {
      const body = JSON.parse(init.body);
      assert.match(body.instructions, /never the final answer/);
      assert.match(body.instructions, /do not complete the remaining solution/);
      assert.match(body.input[0].content[0].text, /Consider equality/);
      return completed(analysis);
    },
  );
});
test('uncertain handwriting always gets an explicit uncertainty warning', () => {
  const { name: _name, ...analysis } = cases[0];
  assert.equal(
    constrainAnalysis({ ...analysis, reading: 'uncertain' }, 'Hint').uncertainty.length,
    1,
  );
});
test('provider errors, refusal, incomplete and malformed output are sanitized', async () => {
  for (const reply of [
    { ok: false, status: 500 },
    { ok: false, status: 429 },
    { ok: true, json: async () => ({ status: 'incomplete' }) },
    {
      ok: true,
      json: async () => ({ status: 'completed', output: [{ content: [{ type: 'refusal' }] }] }),
    },
    { ok: true, json: async () => ({ status: 'completed', output: [] }) },
  ]) {
    await assert.rejects(
      analyzeOpenAI(request(), config, new AbortController().signal, async () => reply),
    );
  }
});
test('provider cancellation uses the caller signal', async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    analyzeOpenAI(request(), config, controller.signal, async (_url, init) => {
      assert.equal(init.signal, controller.signal);
      init.signal.throwIfAborted();
    }),
    { name: 'AbortError' },
  );
});
async function gateway(
  t,
  overrides = {},
  analyze = async () => {
    const { name: _name, ...a } = cases[0];
    return a;
  },
) {
  const server = createGateway({ ...config, ...overrides }, { analyze });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => {
    server.closeAllConnections();
    server.close();
  });
  const origin = `http://127.0.0.1:${server.address().port}`;
  return (body = request(), options = {}) =>
    fetch(origin + '/v1/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
      body: JSON.stringify(body),
      signal: options.signal,
    });
}
test('authenticated consented image reaches adapter; response contains no image', async (t) => {
  const send = await gateway(t, {}, async (input) => {
    assert.equal(input.consent, true);
    assert.equal(input.image.base64, image('correct-partial'));
    const { name: _n, ...a } = cases[0];
    return a;
  });
  const res = await send();
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.provider, 'openai');
  assert.equal(body.image, undefined);
});
test('missing credentials or explicit enable flag never invokes provider', async (t) => {
  for (const overrides of [{ apiKey: '' }, { enabled: false }, { model: '' }]) {
    const send = await gateway(t, overrides, () => {
      assert.fail('Must not call provider');
    });
    assert.equal((await send()).status, 503);
  }
});
test('authentication, consent, work selection, origin, and image validation fail closed', async (t) => {
  const send = await gateway(t, {}, () => {
    assert.fail('Must not call provider');
  });
  assert.equal((await send(request(), { headers: { Authorization: 'Bearer wrong' } })).status, 401);
  assert.equal((await send({ ...request(), consent: false })).status, 400);
  assert.equal(
    (await send({ ...request(), action: 'Check My Work', includesWork: false })).status,
    400,
  );
  assert.equal(
    (await send(request(), { headers: { Origin: 'https://untrusted.example' } })).status,
    403,
  );
  assert.equal(
    (await send({ ...request(), image: { mime: 'image/jpeg', base64: 'AAAA' } })).status,
    400,
  );
  assert.equal(
    (
      await send({
        ...request(),
        image: { mime: 'image/jpeg', base64: 'A'.repeat(4 * 1024 * 1024 + 4) },
      })
    ).status,
    400,
  );
});
test('daily and concurrency caps reserve requests before awaiting provider', async (t) => {
  let release;
  const pending = new Promise((resolve) => {
    release = resolve;
  });
  const send = await gateway(t, { dailyLimit: 1 }, async () => {
    await pending;
    const { name: _n, ...a } = cases[0];
    return a;
  });
  const first = send();
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal((await send()).status, 429);
  release();
  assert.equal((await first).status, 200);
  assert.equal((await send()).status, 429);
});
test('timeout aborts upstream and returns a bounded error', async (t) => {
  const send = await gateway(t, { timeoutMs: 20 }, async (_r, _c, signal) => {
    await new Promise((_resolve, reject) =>
      signal.addEventListener('abort', () => reject(new Error('sensitive upstream detail'))),
    );
  });
  const res = await send();
  assert.equal(res.status, 504);
  assert.doesNotMatch(await res.text(), /sensitive/);
});
test('disconnect cancellation reaches upstream', async (t) => {
  let started, aborted;
  const began = new Promise((r) => {
    started = r;
  });
  const stopped = new Promise((r) => {
    aborted = r;
  });
  const send = await gateway(t, {}, async (_r, _c, signal) => {
    started();
    await new Promise((_r, reject) =>
      signal.addEventListener('abort', () => {
        aborted();
        reject(new Error('cancelled'));
      }),
    );
  });
  const c = new AbortController();
  const promise = send(request(), { signal: c.signal });
  await began;
  c.abort();
  await assert.rejects(promise);
  await stopped;
});
test('JPEG dimensions reject invalid headers and oversized frames', () => {
  const bytes = Buffer.from(image('correct-partial'), 'base64');
  assert.deepEqual(validateJPEG(bytes), { width: 1000, height: 480 });
  assert.throws(() => validateJPEG(Buffer.from('invalid')));
  const huge = Buffer.from([255, 216, 255, 192, 0, 8, 8, 16, 0, 16, 0, 3]);
  assert.throws(() => validateJPEG(huge));
});
