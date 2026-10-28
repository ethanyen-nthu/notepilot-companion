export const actions = ['Explain', 'Solve', 'Hint', 'Next Step', 'Check My Work'] as const;
export type TutorAction = (typeof actions)[number];
export type Selection = 'question' | 'question-and-work' | null;
export type ProviderId = 'demo' | 'openai' | 'anthropic';
export type ExampleId = 'linear' | 'quadratic';
export interface TutorRequest {
  exampleId: ExampleId;
  selection: Exclude<Selection, null>;
  action: TutorAction;
}
export interface TutorResponse extends TutorRequest {
  id: string;
  title: string;
  steps: string[];
  simulated: true;
}
export const examples = {
  linear: {
    title: 'A small equation. A clearer next step.',
    topic: 'Algebra · Linear equations',
    question: '2x + 7 = 19',
    work: ['2x = 19 + 7', 'x = 13'],
    description: 'Find x. The sample student has made a sign error.',
  },
  quadratic: {
    title: 'Two roots. One useful pattern.',
    topic: 'Algebra · Factoring',
    question: 'x² - 5x + 6 = 0',
    work: ['(x - 2)(x - 3) = 0', 'x = 2, 3'],
    description: 'Find both roots. The sample student has factored correctly.',
  },
} satisfies Record<
  ExampleId,
  { title: string; topic: string; question: string; work: string[]; description: string }
>;
const answers: Record<ExampleId, Record<TutorAction, string[]>> = {
  linear: {
    Explain: [
      'An equation is a balance: apply the same operation to both sides.',
      'Subtract 7 from both sides to get 2x = 12. Divide both sides by 2: x = 6.',
    ],
    Solve: ['2x + 7 = 19', 'Subtract 7: 2x = 12', 'Divide by 2: x = 6', 'Check: 2(6) + 7 = 19.'],
    Hint: ['What operation undoes adding 7? Apply it to both sides before dealing with the 2.'],
    'Next Step': [
      'Subtract 7 from both sides: 2x + 7 − 7 = 19 − 7.',
      'That leaves 2x = 12. What would undo multiplication by 2?',
    ],
    'Check My Work': [
      'The first step changes +7 to +7 on the other side. That does not preserve equality.',
      'Subtract 7 from both sides instead: 2x = 12, so x = 6.',
      'Your x = 13 gives 33 on the left, not 19.',
    ],
  },
  quadratic: {
    Explain: [
      'Find two numbers whose product is 6 and whose sum is −5: −2 and −3.',
      'So x² − 5x + 6 = (x − 2)(x − 3). A product is zero when at least one factor is zero.',
    ],
    Solve: [
      'Factor: (x − 2)(x − 3) = 0',
      'Set each factor to zero: x − 2 = 0 or x − 3 = 0.',
      'The roots are x = 2 and x = 3.',
      'Check: 4 − 10 + 6 = 0 and 9 − 15 + 6 = 0.',
    ],
    Hint: ['Look for two numbers that multiply to 6 and add to −5. Both numbers must be negative.'],
    'Next Step': [
      'Write the expression as (x − 2)(x − 3) = 0.',
      'Now set each factor equal to zero.',
    ],
    'Check My Work': [
      'Your factorization is correct: expanding gives x² − 5x + 6.',
      'Both roots, 2 and 3, satisfy the original equation. Keep both solutions.',
    ],
  },
};
export function simulateResponse(request: TutorRequest, id: string): TutorResponse {
  if (!examples[request.exampleId] || !actions.includes(request.action))
    throw new Error('Unsupported demo request.');
  if (request.action === 'Check My Work' && request.selection !== 'question-and-work')
    throw new Error('Include the sample work before checking it.');
  return {
    ...request,
    id,
    title: request.action,
    steps: [...answers[request.exampleId][request.action]],
    simulated: true,
  };
}
