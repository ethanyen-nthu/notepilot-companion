import { z } from 'zod';

export const visionActions = ['Explain', 'Solve', 'Hint', 'Next Step', 'Check My Work'] as const;
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const boundedText = z.string().max(1800);
export const analysisSchema = z
  .object({
    problem: boundedText,
    reading: z.enum(['clear', 'uncertain', 'unreadable']),
    uncertainty: z.array(z.string().max(500)).max(8),
    observedSteps: z
      .array(
        z
          .object({
            text: boundedText,
            verdict: z.enum(['correct', 'incorrect', 'uncertain']),
            reason: boundedText,
          })
          .strict(),
      )
      .max(12),
    stoppedAt: boundedText,
    feedback: z.array(boundedText).min(1).max(8),
    nextStep: boundedText,
  })
  .strict();
export type VisionAnalysis = z.infer<typeof analysisSchema>;
export const visionRequestSchema = z
  .object({
    action: z.enum(visionActions),
    includesWork: z.boolean(),
    consent: z.literal(true),
    image: z
      .object({
        base64: z
          .string()
          .min(4)
          .max(Math.ceil(MAX_IMAGE_BYTES / 3) * 4)
          .regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/),
        mime: z.literal('image/jpeg'),
      })
      .strict(),
    previous: z
      .object({
        action: z.enum(visionActions),
        feedback: z.array(boundedText).min(1).max(8),
        nextStep: boundedText,
      })
      .strict()
      .optional(),
  })
  .strict()
  .refine((r) => r.action !== 'Check My Work' || r.includesWork, {
    message: 'Include your work to check it.',
  });
export type VisionRequest = z.infer<typeof visionRequestSchema>;
export const visionReplySchema = z
  .object({
    id: z.string().max(100),
    provider: z.literal('openai'),
    model: z.string().max(100),
    analysis: analysisSchema,
  })
  .strict();
export type VisionReply = z.infer<typeof visionReplySchema>;

// Treat unreadability as a stop condition even if the model returns a solution.
export function constrainAnalysis(
  input: VisionAnalysis,
  action: VisionRequest['action'],
): VisionAnalysis {
  if (input.reading === 'unreadable')
    return {
      ...input,
      problem: 'Unable to read the selected problem reliably.',
      observedSteps: [],
      stoppedAt: '',
      nextStep: '',
      uncertainty: input.uncertainty.length
        ? input.uncertainty
        : ['Try a clearer image or a larger crop.'],
      feedback: [
        'Please retake or recrop this image. I cannot reliably judge these handwritten steps.',
      ],
    };
  const result = {
    ...input,
    uncertainty:
      input.reading === 'uncertain' && !input.uncertainty.length
        ? ['Some symbols are ambiguous; confirm the transcription before relying on this feedback.']
        : input.uncertainty,
  };
  if (action === 'Next Step')
    return {
      ...result,
      feedback: [input.nextStep || 'Please clarify the uncertain symbols before continuing.'],
    };
  return result;
}
