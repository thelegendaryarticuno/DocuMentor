import { useCallback, useMemo, useState } from 'react';
import { ModelCategory } from '@runanywhere/web';
import { StructuredOutput, TextGeneration } from '@runanywhere/web-llamacpp';
import JSON5 from 'json5';
import { useModelLoader } from './useModelLoader';

export type CardFormat = 'stepper' | 'analogy' | 'compare' | 'quiz';
export type TeachComplexity = 'beginner' | 'intermediate' | 'advanced';
export type TeachStage = 'idle' | 'preparing' | 'teaching' | 'ready' | 'error';

export interface ClassifyPayload {
  concept: string;
  type: string;
  card_format: CardFormat;
  complexity: TeachComplexity;
}

interface TeachOption {
  label: string;
  code: string;
  pros: string[];
}

interface LessonSlide {
  heading: string;
  body: string;
  code?: string;
}

interface CommandTokenHint {
  token: string;
  meaning: string;
}

interface CommandPracticeStep {
  title: string;
  command: string;
  goal: string;
  context: string;
  token_hints: CommandTokenHint[];
  success_message: string;
}

interface CommandLab {
  intro: string;
  steps: CommandPracticeStep[];
}

interface MiniGame {
  prompt: string;
  choices: string[];
  answer_index: number;
  explanation: string;
}

export interface TeachPayload {
  title: string;
  card_format: CardFormat;
  one_liner: string;
  why_this_matters: string;
  memory_hook: string;
  source_snippets: string[];
  key_takeaways: string[];
  common_traps: string[];
  next_try: string;
  mini_game: MiniGame;
  command_lab?: CommandLab;
  steps?: LessonSlide[];
  real_world?: string;
  code_equivalent?: string;
  option_a?: TeachOption;
  option_b?: TeachOption;
  quiz?: { question: string; options: string[]; correct: number; explanation: string }[];
}

interface TeachEnvelope {
  classify: ClassifyPayload;
  lesson: TeachPayload;
}

interface UseTeachResult {
  teach: (input: string) => Promise<void>;
  classifying: boolean;
  teaching: boolean;
  classify: ClassifyPayload | null;
  payload: TeachPayload | null;
  error: string | null;
  stage: TeachStage;
  statusText: string;
  reset: () => void;
}

export function useTeach(): UseTeachResult {
  const [classifying, setClassifying] = useState(false);
  const [teaching, setTeaching] = useState(false);
  const [classify, setClassify] = useState<ClassifyPayload | null>(null);
  const [payload, setPayload] = useState<TeachPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<TeachStage>('idle');
  const loader = useModelLoader(ModelCategory.Language);

  const lessonSchema = useMemo(
    () =>
      JSON.stringify({
        type: 'object',
        properties: {
          classify: {
            type: 'object',
            properties: {
              concept: { type: 'string' },
              type: { type: 'string' },
              card_format: { type: 'string', enum: ['stepper', 'analogy', 'compare', 'quiz'] },
              complexity: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
            },
            required: ['concept', 'type', 'card_format', 'complexity'],
          },
          lesson: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              card_format: { type: 'string', enum: ['stepper', 'analogy', 'compare', 'quiz'] },
              one_liner: { type: 'string' },
              why_this_matters: { type: 'string' },
              memory_hook: { type: 'string' },
              source_snippets: {
                type: 'array',
                items: { type: 'string' },
                minItems: 2,
                maxItems: 3,
              },
              key_takeaways: {
                type: 'array',
                items: { type: 'string' },
                minItems: 3,
                maxItems: 4,
              },
              common_traps: {
                type: 'array',
                items: { type: 'string' },
                minItems: 2,
                maxItems: 3,
              },
              next_try: { type: 'string' },
              mini_game: {
                type: 'object',
                properties: {
                  prompt: { type: 'string' },
                  choices: { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 4 },
                  answer_index: { type: 'number' },
                  explanation: { type: 'string' },
                },
                required: ['prompt', 'choices', 'answer_index', 'explanation'],
              },
              command_lab: {
                type: 'object',
                properties: {
                  intro: { type: 'string' },
                  steps: {
                    type: 'array',
                    minItems: 1,
                    maxItems: 3,
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string' },
                        command: { type: 'string' },
                        goal: { type: 'string' },
                        context: { type: 'string' },
                        token_hints: {
                          type: 'array',
                          minItems: 1,
                          maxItems: 6,
                          items: {
                            type: 'object',
                            properties: {
                              token: { type: 'string' },
                              meaning: { type: 'string' },
                            },
                            required: ['token', 'meaning'],
                          },
                        },
                        success_message: { type: 'string' },
                      },
                      required: ['title', 'command', 'goal', 'context', 'token_hints', 'success_message'],
                    },
                  },
                },
                required: ['intro', 'steps'],
              },
              steps: {
                type: 'array',
                minItems: 3,
                maxItems: 5,
                items: {
                  type: 'object',
                  properties: {
                    heading: { type: 'string' },
                    body: { type: 'string' },
                    code: { type: 'string' },
                  },
                  required: ['heading', 'body'],
                },
              },
              real_world: { type: 'string' },
              code_equivalent: { type: 'string' },
              option_a: {
                type: 'object',
                properties: {
                  label: { type: 'string' },
                  code: { type: 'string' },
                  pros: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 3 },
                },
                required: ['label', 'code', 'pros'],
              },
              option_b: {
                type: 'object',
                properties: {
                  label: { type: 'string' },
                  code: { type: 'string' },
                  pros: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 3 },
                },
                required: ['label', 'code', 'pros'],
              },
              quiz: {
                type: 'array',
                minItems: 2,
                maxItems: 3,
                items: {
                  type: 'object',
                  properties: {
                    question: { type: 'string' },
                    options: { type: 'array', items: { type: 'string' }, minItems: 4, maxItems: 4 },
                    correct: { type: 'number' },
                    explanation: { type: 'string' },
                  },
                  required: ['question', 'options', 'correct', 'explanation'],
                },
              },
            },
            required: [
              'title',
              'card_format',
              'one_liner',
              'why_this_matters',
              'memory_hook',
              'source_snippets',
              'key_takeaways',
              'common_traps',
              'next_try',
              'mini_game',
            ],
          },
        },
        required: ['classify', 'lesson'],
      }),
    [],
  );

  const statusText = useMemo(() => {
    if (error) return error;
    if (classifying) return 'Understanding the concept and choosing the best teaching path...';
    if (teaching) return 'Building lesson cards, recap, and mini game...';
    if (payload) return 'Lesson ready.';
    return 'Paste a confusing topic and let DocuMentor teach it.';
  }, [classifying, error, payload, teaching]);

  const reset = useCallback(() => {
    setClassify(null);
    setPayload(null);
    setError(null);
    setClassifying(false);
    setTeaching(false);
    setStage('idle');
  }, []);

  const teach = useCallback(
    async (input: string) => {
      const chunk = input.trim().split(/\s+/).slice(0, 800).join(' ');
      if (!chunk) {
        setError('Please paste or upload text before teaching.');
        setStage('error');
        return;
      }

      setError(null);
      setClassify(null);
      setPayload(null);
      setStage('preparing');

      if (loader.state !== 'ready') {
        const ok = await loader.ensure();
        if (!ok) {
          setError(loader.error ?? 'Model is not ready yet. Please try again.');
          setStage('error');
          return;
        }
      }

      setClassifying(true);
      setTeaching(true);

      try {
        // PERFORMANCE OPTIMIZED: Drastically simplified system prompt (10x shorter)
        const systemPrompt =
          `${StructuredOutput.getSystemPrompt(lessonSchema)}\n\n` +
          'DocuMentor: Return ONLY valid JSON.\n' +
          'Rules:\n' +
          '- Teach fast, use plain language\n' +
          '- title: name the real topic\n' +
          '- card_format: stepper (process), analogy (abstract), compare (contrast), quiz (definitions)\n' +
          '- Include mini_game for practice\n' +
          '- For code/commands: include command_lab\n' +
          '- Keep all fields concise\n' +
          '- source_snippets: 2-3 exact phrases from source';

        // PERFORMANCE OPTIMIZED: Reduced chunk size from unlimited to 400 words max
        const trimmedChunk = chunk.split(' ').slice(0, 400).join(' ');
        const prompt = 'Teach this:\n\n' + trimmedChunk;

        let normalized: TeachEnvelope | null = null;

        try {
          // PERFORMANCE OPTIMIZED: Reduced maxTokens from 700 to 400, faster temp
          const result = await TextGeneration.generate(prompt, {
            systemPrompt,
            maxTokens: 400, // Reduced from 700
            temperature: 0.1, // Lower = faster + more deterministic
            topP: 0.85,
            topK: 30,
          });

          setStage('teaching');

          const validated = StructuredOutput.validate(result.text, { jsonSchema: lessonSchema });
          const rawPayload = validated.extractedJson ?? extractBestJsonCandidate(result.text) ?? result.text;
          const parsed = parseModelJson<unknown>(rawPayload);
          normalized = normalizeTeachEnvelope(parsed, chunk);
          assertValidTeachPayload(normalized.lesson, normalized.classify.card_format);
          assertGroundedLesson(normalized.lesson, chunk);
        } catch {
          normalized = buildFallbackEnvelope(chunk);
        }

        setError(null);
        setClassify(normalized.classify);
        setPayload(normalized.lesson);
        setStage('ready');
      } catch (err) {
        setPayload(null);
        setError(err instanceof Error ? err.message : 'Teaching generation failed.');
        setStage('error');
      } finally {
        setClassifying(false);
        setTeaching(false);
      }
    },
    [lessonSchema, loader],
  );

  return {
    teach,
    classifying,
    teaching,
    classify,
    payload,
    error,
    stage,
    statusText,
    reset,
  };
}

function parseModelJson<T>(raw: string): T {
  const candidates = extractJsonCandidates(raw);

  for (const candidate of candidates) {
    const cleaned = cleanModelJson(candidate);
    try {
      return JSON.parse(cleaned) as T;
    } catch {
      // fall through
    }

    try {
      return JSON5.parse(cleaned) as T;
    } catch {
      // try next
    }
  }

  throw new Error('Model returned invalid JSON. Please try again.');
}

function extractJsonCandidates(text: string): string[] {
  const candidates = [
    text,
    extractBestJsonCandidate(text),
    extractFirstJsonObject(text),
    extractJsonFromCodeFence(text),
  ].filter(Boolean) as string[];

  return Array.from(new Set(candidates.map((candidate) => candidate.trim()).filter(Boolean)));
}

function extractBestJsonCandidate(text: string): string | null {
  const cleaned = String(text ?? '').trim();
  if (!cleaned) return null;

  let start = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < cleaned.length; index += 1) {
    const char = cleaned[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{') {
      if (depth === 0) start = index;
      depth += 1;
      continue;
    }

    if (char === '}') {
      depth -= 1;
      if (depth === 0 && start !== -1) {
        return cleaned.slice(start, index + 1);
      }
    }
  }

  return null;
}

function extractJsonFromCodeFence(text: string): string | null {
  const match = String(text ?? '').match(/```(?:json)?\s*([\s\S]*?)```/i);
  return match?.[1]?.trim() ?? null;
}

function extractFirstJsonObject(text: string): string | null {
  const trimmed = String(text ?? '').trim();
  if (!trimmed) return null;

  const withoutFences = trimmed
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  const start = withoutFences.indexOf('{');
  const end = withoutFences.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  return withoutFences.slice(start, end + 1);
}

function cleanModelJson(text: string): string {
  return text
    .trim()
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/```/g, '')
    .trim();
}

function assertValidClassify(value: unknown): asserts value is ClassifyPayload {
  if (!value || typeof value !== 'object') throw new Error('Model returned invalid classification JSON.');
  const v = value as Partial<ClassifyPayload>;

  const formats: CardFormat[] = ['stepper', 'analogy', 'compare', 'quiz'];
  const complexities: TeachComplexity[] = ['beginner', 'intermediate', 'advanced'];

  if (typeof v.concept !== 'string' || !v.concept.trim()) throw new Error('Classification missing concept.');
  if (typeof v.type !== 'string' || !v.type.trim()) throw new Error('Classification missing type.');
  if (!v.card_format || !formats.includes(v.card_format)) throw new Error('Classification missing card_format.');
  if (!v.complexity || !complexities.includes(v.complexity)) throw new Error('Classification missing complexity.');
}

function assertValidTeachPayload(value: unknown, expectedFormat: CardFormat): asserts value is TeachPayload {
  if (!value || typeof value !== 'object') throw new Error('Model returned invalid teaching card JSON.');
  const v = value as Partial<TeachPayload>;

  if (typeof v.title !== 'string' || !v.title.trim()) throw new Error('Lesson missing title.');
  if (typeof v.one_liner !== 'string' || !v.one_liner.trim()) throw new Error('Lesson missing one_liner.');
  if (typeof v.why_this_matters !== 'string' || !v.why_this_matters.trim()) throw new Error('Lesson missing why_this_matters.');
  if (typeof v.memory_hook !== 'string' || !v.memory_hook.trim()) throw new Error('Lesson missing memory_hook.');
  if (!Array.isArray(v.source_snippets) || v.source_snippets.length < 2) throw new Error('Lesson missing source_snippets.');
  if (!Array.isArray(v.key_takeaways) || v.key_takeaways.length < 3) throw new Error('Lesson missing key_takeaways.');
  if (!Array.isArray(v.common_traps) || v.common_traps.length < 2) throw new Error('Lesson missing common_traps.');
  if (typeof v.next_try !== 'string' || !v.next_try.trim()) throw new Error('Lesson missing next_try.');

  if (!v.mini_game || typeof v.mini_game !== 'object') throw new Error('Lesson missing mini_game.');
  if (!Array.isArray(v.mini_game.choices) || v.mini_game.choices.length < 3) throw new Error('Mini game choices are missing.');

  const format = (v.card_format ?? expectedFormat) as CardFormat;
  if (!['stepper', 'analogy', 'compare', 'quiz'].includes(format)) {
    throw new Error('Lesson missing card_format.');
  }

  if (format === 'stepper') {
    if (!Array.isArray(v.steps) || v.steps.length < 3) throw new Error('Lesson steps are missing.');
  }

  if (format === 'analogy') {
    if (typeof v.real_world !== 'string' || !v.real_world.trim()) throw new Error('Lesson missing real_world.');
    if (typeof v.code_equivalent !== 'string' || !v.code_equivalent.trim()) throw new Error('Lesson missing code_equivalent.');
  }

  if (format === 'compare') {
    if (!v.option_a || !v.option_b) throw new Error('Lesson compare options are missing.');
    if (!Array.isArray(v.option_a.pros) || v.option_a.pros.length < 2) throw new Error('Lesson option_a pros are missing.');
    if (!Array.isArray(v.option_b.pros) || v.option_b.pros.length < 2) throw new Error('Lesson option_b pros are missing.');
  }

  if (format === 'quiz') {
    if (!Array.isArray(v.quiz) || v.quiz.length < 2) throw new Error('Lesson quiz questions are missing.');
  }
}

function normalizeTeachEnvelope(raw: unknown, sourceText: string): TeachEnvelope {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Model returned invalid lesson JSON.');
  }

  const value = raw as Record<string, unknown>;
  const lessonCandidate = pickLessonCandidate(value);
  const lesson = normalizeLessonPayload(lessonCandidate, sourceText);
  const classify = normalizeClassifyPayload(value.classify, lesson, sourceText);

  lesson.card_format = classify.card_format;
  return { classify, lesson };
}

function pickLessonCandidate(value: Record<string, unknown>): unknown {
  if (value.lesson && typeof value.lesson === 'object') return value.lesson;
  if (value.payload && typeof value.payload === 'object') return value.payload;
  return value;
}

function normalizeLessonPayload(value: unknown, sourceText: string): TeachPayload {
  if (!value || typeof value !== 'object') {
    throw new Error('Model returned invalid lesson JSON.');
  }

  const raw = value as Record<string, unknown>;
  const cardFormat = inferCardFormat(raw.card_format, raw);
  const title = resolveLessonTitle(raw, sourceText);
  const oneLiner = pickString(raw.one_liner, raw.summary, raw.aha_moment);
  const whyThisMatters = pickString(
    raw.why_this_matters,
    raw.why_it_matters,
    raw.explanation,
    raw.description,
  );
  const memoryHook = pickString(
    raw.memory_hook,
    raw.analogy_hook,
    raw.quick_memory,
  );
  const sourceSnippets = normalizeStringArray(raw.source_snippets, raw.grounding, raw.evidence, 2);
  const keyTakeaways = normalizeStringArray(raw.key_takeaways, raw.takeaways, raw.main_points, 3);
  const commonTraps = normalizeStringArray(raw.common_traps, raw.mistakes, raw.gotchas, 2);
  const nextTry = pickString(
    raw.next_try,
    raw.next_step,
    raw.try_next,
  );

  const miniGameRaw = asRecord(raw.mini_game) ?? asRecord(raw.game);
  const miniGame: MiniGame = {
    prompt: pickString(
      miniGameRaw?.prompt,
      miniGameRaw?.question,
      `Which choice best matches ${title || 'the source'}?`,
    ),
    choices: normalizeStringArray(miniGameRaw?.choices, miniGameRaw?.options, keyTakeaways, 3),
    answer_index: clampIndex(
      pickNumber(miniGameRaw?.answer_index, miniGameRaw?.correct, 0),
      0,
      Math.max(normalizeStringArray(miniGameRaw?.choices, miniGameRaw?.options, keyTakeaways, 3).length - 1, 0),
    ),
    explanation: pickString(
      miniGameRaw?.explanation,
      miniGameRaw?.why,
    ),
  };

  const commandLab = normalizeCommandLab(raw.command_lab, sourceText);
  const lesson: TeachPayload = {
    title,
    card_format: cardFormat,
    one_liner: oneLiner,
    why_this_matters: whyThisMatters,
    memory_hook: memoryHook,
    source_snippets: sourceSnippets,
    key_takeaways: keyTakeaways,
    common_traps: commonTraps,
    next_try: nextTry,
    mini_game: miniGame,
    command_lab: commandLab,
  };

  if (commandLab?.steps.length) {
    lesson.mini_game = buildCommandMiniGame(commandLab.steps);
  }

  if (cardFormat === 'stepper') {
    lesson.steps = normalizeSteps(raw.steps, title);
  }

  if (cardFormat === 'analogy') {
    lesson.real_world = pickString(
      raw.real_world,
      raw.analogy,
      `${title} is like a guide rail that keeps the flow on track.`,
    );
    lesson.code_equivalent = pickString(
      raw.code_equivalent,
      raw.technical_version,
      `In code terms, ${title} changes how the program behaves when certain inputs or lifecycle moments happen.`,
    );
  }

  if (cardFormat === 'compare') {
    lesson.option_a = normalizeTeachOption(asRecord(raw.option_a), 'Option A');
    lesson.option_b = normalizeTeachOption(asRecord(raw.option_b), 'Option B');
  }

  if (cardFormat === 'quiz') {
    lesson.quiz = normalizeQuiz(raw.quiz, title);
  }

  return lesson;
}

function normalizeClassifyPayload(
  value: unknown,
  lesson: TeachPayload,
  sourceText: string,
): ClassifyPayload {
  const raw = asRecord(value);
  const extractedConcept = extractConceptFromSource(sourceText);
  const classify: ClassifyPayload = {
    concept: pickString(raw?.concept, lesson.title, extractedConcept),
    type: pickString(raw?.type, inferDomain(sourceText, lesson)),
    card_format: inferCardFormat(raw?.card_format, lesson),
    complexity: inferComplexity(raw?.complexity, sourceText),
  };

  assertValidClassify(classify);
  return classify;
}

function normalizeTeachOption(value: Record<string, unknown> | null, fallbackLabel: string): TeachOption {
  return {
    label: pickString(value?.label, fallbackLabel),
    code: pickString(value?.code, value?.snippet, fallbackLabel),
    pros: normalizeStringArray(value?.pros, value?.benefits, [fallbackLabel], 2),
  };
}

function normalizeCommandLab(value: unknown, sourceText: string): CommandLab | undefined {
  const raw = asRecord(value);

  if (raw) {
    const rawSteps = Array.isArray(raw.steps) ? raw.steps : [];
    const steps = rawSteps
      .map((entry, index) => normalizeCommandPracticeStep(asRecord(entry), sourceText, index))
      .filter((entry): entry is CommandPracticeStep => Boolean(entry));

    if (steps.length) {
      return {
        intro: pickString(
          raw.intro,
          raw.description,
          'Practice the real command flow from your source in a safe terminal-style sandbox.',
        ),
        steps: steps.slice(0, 3),
      };
    }
  }

  return buildCommandLabFromSource(sourceText);
}

function normalizeCommandPracticeStep(
  value: Record<string, unknown> | null,
  sourceText: string,
  index: number,
): CommandPracticeStep | null {
  if (!value) return null;

  const command = pickString(value.command, value.snippet);
  if (!command || !looksLikeShellCommand(command)) return null;

  return {
    title: pickString(value.title, `Command ${index + 1}`),
    command,
    goal: pickString(value.goal, value.objective, `Type the command exactly as it appears in the source.`),
    context: pickString(
      value.context,
      value.why,
      extractContextForCommand(sourceText, command) ?? 'This command comes directly from the source text.',
    ),
    token_hints: normalizeTokenHints(value.token_hints, command),
    success_message: pickString(
      value.success_message,
      value.success,
      'Nice. You matched the source command exactly.',
    ),
  };
}

function normalizeSteps(value: unknown, title: string): LessonSlide[] {
  if (Array.isArray(value) && value.length >= 3) {
    return value
      .map((entry, index) => {
        const step = asRecord(entry);
        if (!step) return undefined;
        const normalized: LessonSlide = {
          heading: pickString(step.heading, `Step ${index + 1}`),
          body: pickString(step.body, step.explanation, `${title} continues here.`),
          code: optionalString(step.code) ?? undefined,
        };
        return normalized;
      })
      .filter((entry): entry is LessonSlide => Boolean(entry));
  }

  throw new Error(`Lesson steps are missing for ${title || 'this concept'}.`);
}

function normalizeQuiz(value: unknown, title: string) {
  if (Array.isArray(value) && value.length >= 2) {
    return value
      .map((entry) => {
        const question = asRecord(entry);
        if (!question) return null;
        const options = normalizeStringArray(question.options, question.choices, [], 4);
        return {
          question: pickString(question.question, `Which statement about ${title} is correct?`),
          options: options.length >= 4 ? options.slice(0, 4) : fillChoices(options, title),
          correct: clampIndex(pickNumber(question.correct, question.answer, 0), 0, 3),
          explanation: pickString(
            question.explanation,
            question.why,
            `${title} makes most sense when you focus on what triggers it and what it affects.`,
          ),
        };
      })
      .filter((entry): entry is NonNullable<TeachPayload['quiz']>[number] => Boolean(entry));
  }

  return [
    {
      question: `What is the main job of ${title || 'this source'}?`,
      options: fillChoices([], title),
      correct: 0,
      explanation: 'Use the exact source details to decide what the concept is doing.',
    },
    {
      question: `What is the safest next learning move?`,
      options: [
        'Try a small example and observe the result',
        'Memorize the words without testing them',
        'Ignore the surrounding context',
        'Assume every case behaves the same way',
      ],
      correct: 0,
      explanation: 'Small experiments usually make the concept click faster than memorizing vocabulary.',
    },
  ];
}

function fillChoices(choices: string[], title: string): string[] {
  const seed = choices.filter(Boolean);
  const defaults = [
    `${title || 'This concept'} manages a specific behavior or flow`,
    `${title || 'This concept'} means every value updates automatically`,
    `${title || 'This concept'} removes the need to understand timing`,
    `${title || 'This concept'} makes code run in exactly the same way everywhere`,
  ];
  return [...seed, ...defaults].slice(0, 4);
}

function resolveLessonTitle(raw: Record<string, unknown>, sourceText: string): string {
  const rawTitle = pickString(raw.title, raw.concept, raw.topic);
  const fallback = deriveTitleFromSource(sourceText);

  if (!rawTitle) return fallback;

  const normalized = normalizeForMatch(rawTitle);
  if (normalized.length < 4 || isGenericTitle(normalized)) return fallback;

  return rawTitle;
}

function inferCardFormat(rawFormat: unknown, fallback: Record<string, unknown> | TeachPayload): CardFormat {
  const normalized = optionalString(rawFormat)?.toLowerCase() as CardFormat | undefined;
  if (normalized && ['stepper', 'analogy', 'compare', 'quiz'].includes(normalized)) {
    return normalized;
  }

  if (Array.isArray((fallback as TeachPayload).steps) || Array.isArray((fallback as Record<string, unknown>).steps)) {
    return 'stepper';
  }
  if ((fallback as TeachPayload).real_world || (fallback as Record<string, unknown>).real_world) {
    return 'analogy';
  }
  if ((fallback as TeachPayload).option_a || (fallback as Record<string, unknown>).option_a) {
    return 'compare';
  }
  if (Array.isArray((fallback as TeachPayload).quiz) || Array.isArray((fallback as Record<string, unknown>).quiz)) {
    return 'quiz';
  }

  return 'stepper';
}

function inferComplexity(rawComplexity: unknown, sourceText: string): TeachComplexity {
  const normalized = optionalString(rawComplexity)?.toLowerCase() as TeachComplexity | undefined;
  if (normalized && ['beginner', 'intermediate', 'advanced'].includes(normalized)) {
    return normalized;
  }

  const text = sourceText.toLowerCase();
  if (/(compiler|concurrency|distributed|memory model|vectorized|backpressure|transactional)/.test(text)) {
    return 'advanced';
  }
  if (/(hook|lifecycle|async|closure|pipeline|dependency|subscription|effect)/.test(text)) {
    return 'intermediate';
  }
  return 'beginner';
}

function inferDomain(sourceText: string, lesson: TeachPayload): string {
  const text = `${lesson.title} ${sourceText}`.toLowerCase();
  if (/(<!doctype|<html|<head|<body|<meta|<link|<h1|class=|href=)/.test(text)) return 'HTML/CSS';
  if (/(react|useeffect|hook|jsx|component)/.test(text)) return 'React';
  if (/(typescript|javascript|node|function|code|api)/.test(text)) return 'Programming';
  if (/(algebra|equation|calculus|matrix)/.test(text)) return 'Mathematics';
  if (/(model|neural|embedding|llm|inference)/.test(text)) return 'AI';
  return 'Technical concept';
}

function extractConceptFromSource(sourceText: string): string {
  const titleFromSource = deriveTitleFromSource(sourceText);
  if (titleFromSource && !isGenericTitle(normalizeForMatch(titleFromSource))) {
    return titleFromSource;
  }

  const cleanedSource = stripMarkupPreserveWords(sourceText)
    .replace(/\s+/g, ' ')
    .trim()
    .split(/[.!?\n]/)[0]
    ?.trim();

  const raw = sourceText.replace(/\s+/g, ' ').trim();
  const hookMatch =
    raw.match(/\b(use[A-Z][A-Za-z0-9]+)\b/) ||
    raw.match(/<([a-z][a-z0-9-]*)\b/i) ||
    raw.match(/\b(class|id|meta|viewport|stylesheet|href|body|head|html)\b/i);
  if (hookMatch?.[1]) return hookMatch[1];

  if (!cleanedSource) {
    throw new Error('Could not identify the main concept from the source. Please select a smaller, clearer chunk.');
  }

  const match = cleanedSource.match(/\b([A-Za-z][A-Za-z0-9_.-]{2,})\b/);

  return match?.[1] ?? cleanedSource.slice(0, 48);
}

function normalizeStringArray(...args: unknown[]): string[] {
  const minItems = typeof args[args.length - 1] === 'number' ? (args.pop() as number) : 1;
  const collected: string[] = [];

  for (const candidate of args) {
    if (Array.isArray(candidate)) {
      for (const item of candidate) {
        const text = optionalString(item);
        if (text) collected.push(text);
      }
    }
  }

  const unique = Array.from(new Set(collected.map((item) => item.trim()).filter(Boolean)));
  while (unique.length < minItems) {
    unique.push(`Key idea ${unique.length + 1}`);
  }
  return unique;
}

function pickString(...values: unknown[]): string {
  for (const value of values) {
    const text = optionalString(value);
    if (text) return text;
  }
  return '';
}

function optionalString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function pickNumber(...values: unknown[]): number {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return 0;
}

function clampIndex(value: number, min: number, max: number): number {
  return Math.min(Math.max(Math.round(value), min), max);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function stripMarkupPreserveWords(sourceText: string): string {
  return sourceText
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\b(class|id|href|src|rel|content|name)=["'][^"']*["']/gi, ' ')
    .replace(/[{}<>]/g, ' ')
    .trim();
}

function assertGroundedLesson(lesson: TeachPayload, sourceText: string): void {
  const sourceNormalized = normalizeForMatch(sourceText);
  const snippetMatches = lesson.source_snippets.filter((snippet) =>
    sourceNormalized.includes(normalizeForMatch(snippet)),
  );

  if (snippetMatches.length < 2) {
    throw new Error('Lesson was not grounded in the student source. Please retry with a smaller chunk.');
  }

  const genericFragments = [
    'untitled concept',
    'made simple',
    'shortcut that makes the main idea easier to remember',
    'begin by identifying what',
    'this document',
    'this source',
  ];

  const combined = normalizeForMatch(
    [lesson.title, lesson.one_liner, lesson.why_this_matters, lesson.memory_hook].join(' '),
  );

  const genericHits = genericFragments.filter((fragment) => combined.includes(fragment)).length;
  if (genericHits >= 2) {
    throw new Error('Lesson output was too generic and not clearly tied to the textbox content.');
  }
}

function normalizeForMatch(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function buildFallbackEnvelope(sourceText: string): TeachEnvelope {
  const snippets = collectGroundedSnippets(sourceText);
  const concept = extractConceptFromSource(sourceText);
  const classify: ClassifyPayload = {
    concept,
    type: inferDomain(sourceText, {
      title: concept,
      card_format: inferFallbackCardFormat(sourceText),
      one_liner: snippets[0] ?? concept,
      why_this_matters: snippets[1] ?? snippets[0] ?? concept,
      memory_hook: `Anchor on: ${snippets[0] ?? concept}`,
      source_snippets: snippets,
      key_takeaways: [],
      common_traps: [],
      next_try: '',
      mini_game: {
        prompt: '',
        choices: [],
        answer_index: 0,
        explanation: '',
      },
    } as TeachPayload),
    card_format: inferFallbackCardFormat(sourceText),
    complexity: inferComplexity(undefined, sourceText),
  };

  const lesson = buildFallbackLesson(sourceText, classify, snippets);
  return { classify, lesson };
}

function inferFallbackCardFormat(sourceText: string): CardFormat {
  const text = sourceText.toLowerCase();
  if (/\b(vs|versus|compare|difference|instead of)\b/.test(text)) return 'compare';
  if (/\b(step|first|then|next|finally|after|before|returns|runs)\b/.test(text)) return 'stepper';
  if (/\bwhat|which|why\b/.test(text)) return 'quiz';
  return 'stepper';
}

function buildFallbackLesson(
  sourceText: string,
  classify: ClassifyPayload,
  snippets: string[],
): TeachPayload {
  const lines = extractMeaningfulLines(sourceText);
  const steps = lines.slice(0, 4).map((line, index) => ({
    heading: fallbackHeadingForLine(line, index),
    body: line,
    code: extractCodeSnippet(sourceText, line),
  }));

  const title = deriveTitleFromSource(sourceText);
  const oneLiner = snippets[0] ?? lines[0] ?? title;
  const whyThisMatters =
    lines[1] ??
    `This source is mainly about ${title}, so the lesson stays anchored to those exact details.`;

  const lesson: TeachPayload = {
    title,
    card_format: classify.card_format,
    one_liner: oneLiner,
    why_this_matters: whyThisMatters,
    memory_hook: `Remember these exact source cues: ${snippets.slice(0, 2).join(' | ')}`,
    source_snippets: snippets,
    key_takeaways: buildFallbackTakeaways(lines, snippets),
    common_traps: [
      'Do not ignore the exact words or tags shown in the source.',
      'Do not replace the source with a generic explanation.',
    ],
    next_try: `Ask about one exact part next, such as "${snippets[0] ?? title}".`,
    mini_game: buildFallbackMiniGame(title, snippets),
    command_lab: buildCommandLabFromSource(sourceText),
  };

  if (classify.card_format === 'compare') {
    lesson.option_a = {
      label: 'Source detail A',
      code: snippets[0] ?? title,
      pros: [lines[0] ?? title, 'Pulled directly from the student source'],
    };
    lesson.option_b = {
      label: 'Source detail B',
      code: snippets[1] ?? snippets[0] ?? title,
      pros: [lines[1] ?? snippets[1] ?? title, 'Also grounded in the same source'],
    };
  } else if (classify.card_format === 'quiz') {
    lesson.quiz = [
      {
        question: `Which phrase appears in the student source?`,
        options: fillGroundedChoices(snippets, title),
        correct: 0,
        explanation: 'The correct answer is copied directly from the textbox.',
      },
      {
        question: `What should this lesson stay anchored to?`,
        options: [
          'Exact phrases and code from the textbox',
          'A generic template explanation',
          'Random examples not in the source',
          'Whatever sounds most polished',
        ],
        correct: 0,
        explanation: 'This mode should always stay grounded in the student source.',
      },
    ];
  } else if (classify.card_format === 'analogy') {
    lesson.real_world = `Treat "${snippets[0] ?? title}" as the main clue, then connect the rest of the source around it.`;
    lesson.code_equivalent = lines[0] ?? snippets[0] ?? title;
  } else {
    lesson.steps = steps.length >= 3 ? steps : buildFallbackStepsFromSnippets(snippets, title);
  }

  return lesson;
}

function collectGroundedSnippets(sourceText: string): string[] {
  const candidates = extractMeaningfulLines(sourceText)
    .flatMap((line) => {
      const pieces = [line];
      const quoted = line.match(/"([^"]+)"|'([^']+)'|`([^`]+)`/g) ?? [];
      return [...pieces, ...quoted.map((value) => value.replace(/^["'`]|["'`]$/g, ''))];
    })
    .map((item) => item.trim())
    .filter((item) => item.length >= 4);

  const unique = Array.from(new Set(candidates));
  return unique.slice(0, 3);
}

function extractMeaningfulLines(sourceText: string): string[] {
  const rawLines = sourceText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const lines = rawLines.length > 1
    ? rawLines
    : sourceText
        .split(/(?<=[.!?])\s+/)
        .map((line) => line.trim())
        .filter(Boolean);

  return lines.slice(0, 6);
}

function fallbackHeadingForLine(line: string, index: number): string {
  const tagMatch = line.match(/<([a-z][a-z0-9-]*)\b/i);
  if (tagMatch?.[1]) return `<${tagMatch[1]}>`;
  const hookMatch = line.match(/\b(use[A-Z][A-Za-z0-9]+)\b/);
  if (hookMatch?.[1]) return hookMatch[1];
  const firstWords = line.split(/\s+/).slice(0, 4).join(' ');
  return firstWords || `Step ${index + 1}`;
}

function extractCodeSnippet(sourceText: string, fallbackLine: string): string | undefined {
  const codeyLine = sourceText
    .split('\n')
    .map((line) => line.trim())
    .find((line) => /[<>{}=();/]|class=|href=|content=/.test(line));
  return codeyLine || fallbackLine;
}

function buildFallbackTakeaways(lines: string[], snippets: string[]): string[] {
  const items = [...snippets, ...lines]
    .map((item) => item.trim())
    .filter((item) => item.length >= 4);
  return Array.from(new Set(items)).slice(0, 4);
}

function buildFallbackMiniGame(title: string, snippets: string[]): MiniGame {
  const choices = fillGroundedChoices(snippets, title);
  return {
    prompt: 'Which choice is copied from the student source?',
    choices,
    answer_index: 0,
    explanation: 'The correct choice is grounded in the textbox, which is what this mode should teach from.',
  };
}

function buildCommandMiniGame(steps: CommandPracticeStep[]): MiniGame {
  const [first, second] = steps;
  const correct = first.command;
  const distractors = Array.from(
    new Set([
      second?.command,
      mutateCommandForDistractor(correct),
      'Open the guide and read it without running the command',
      'Type the explanation paragraph instead of the command',
    ].filter(Boolean) as string[]),
  )
    .filter((item) => item !== correct)
    .slice(0, 3);

  return {
    prompt: `Which command should the learner type for "${first.title}"?`,
    choices: [correct, ...distractors].slice(0, 4),
    answer_index: 0,
    explanation: `The correct answer is the exact shell command from the source: ${correct}`,
  };
}

function normalizeTokenHints(value: unknown, command: string): CommandTokenHint[] {
  if (Array.isArray(value)) {
    const normalized = value
      .map((entry) => {
        const item = asRecord(entry);
        if (!item) return null;
        const token = pickString(item.token);
        const meaning = pickString(item.meaning, item.description);
        if (!token || !meaning) return null;
        return { token, meaning };
      })
      .filter((entry): entry is CommandTokenHint => Boolean(entry));

    if (normalized.length) return normalized.slice(0, 6);
  }

  return buildTokenHints(command);
}

function buildCommandLabFromSource(sourceText: string): CommandLab | undefined {
  const commands = extractCommands(sourceText);
  if (!commands.length) return undefined;

  return {
    intro: 'Type the exact commands from your source, then use the token hints to understand what each part is doing.',
    steps: commands.slice(0, 3).map((command, index) => ({
      title: `Terminal drill ${index + 1}`,
      command,
      goal: buildGoalForCommand(sourceText, command),
      context: extractContextForCommand(sourceText, command) ?? 'This command was pulled directly from your source text.',
      token_hints: buildTokenHints(command),
      success_message:
        index === commands.length - 1
          ? 'Nice. You reproduced the command exactly, which is the core habit for installation guides.'
          : 'Nice. That matches the source command.',
    })),
  };
}

function extractCommands(sourceText: string): string[] {
  const inlineMatches = Array.from(sourceText.matchAll(/(?:^|\n)\s*[$#>]\s*([^\n]+)/g))
    .map((match) => sanitizePotentialCommand(match[1] ?? ''))
    .filter((line): line is string => Boolean(line));

  const backtickMatches = Array.from(sourceText.matchAll(/`([^`\n]{2,120})`/g))
    .map((match) => sanitizePotentialCommand(match[1] ?? ''))
    .filter((line): line is string => Boolean(line));

  const lineMatches = sourceText
    .split('\n')
    .map((line) => line.trim())
    .map((line) => sanitizePotentialCommand(line))
    .filter((line): line is string => Boolean(line));

  return Array.from(new Set([...inlineMatches, ...backtickMatches, ...lineMatches]));
}

function buildGoalForCommand(sourceText: string, command: string): string {
  const lower = sourceText.toLowerCase();
  if (/\bverify|signature|checksum|pgp\b/.test(lower) && /\bkey|sig|checksum|verify\b/i.test(command)) {
    return 'Use this command to verify the downloaded image or signature before installing.';
  }
  if (/\bboot|install\b/.test(lower)) {
    return 'Practice the exact command so the install flow feels familiar when you reach this step.';
  }
  return 'Type the exact command from the guide and notice what each token contributes.';
}

function extractContextForCommand(sourceText: string, command: string): string | null {
  const lines = sourceText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const index = lines.findIndex((line) => line.includes(command) || line.includes(`$ ${command}`));

  if (index === -1) return null;

  const previous = lines[index - 1];
  const next = lines[index + 1];
  return pickString(previous, next, 'This command appears directly in the source text.');
}

function buildTokenHints(command: string): CommandTokenHint[] {
  const tokens = command.split(/\s+/).filter(Boolean);
  return tokens.slice(0, 6).map((token, index) => ({
    token,
    meaning: explainCommandToken(token, index),
  }));
}

function explainCommandToken(token: string, index: number): string {
  if (index === 0) return `Runs the ${token} program.`;
  if (/^--?[a-z0-9-]+$/i.test(token)) return `${token} is a flag that modifies how the command runs.`;
  if (/\.sig$/i.test(token)) return 'Points to the signature file being checked.';
  if (/\.iso$/i.test(token)) return 'Points to the ISO image file involved in the guide.';
  if (/[_-]/.test(token)) return `Names a specific file or argument: ${token}.`;
  return `Provides an argument to the command: ${token}.`;
}

function sanitizePotentialCommand(value: string): string | null {
  const cleaned = value
    .replace(/^\s*[$#>]\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!looksLikeShellCommand(cleaned)) return null;
  return cleaned;
}

function looksLikeShellCommand(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.length > 120) return false;
  if (/[.?!]\s+[A-Z]/.test(trimmed)) return false;

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length === 0 || tokens.length > 12) return false;

  const first = tokens[0];
  if (!/^[a-z0-9][a-z0-9+._-]*$/i.test(first)) return false;
  if (/^(this|that|the|for|when|before|after|another|guide|document|note|tip)$/i.test(first)) return false;

  const shellSignals = tokens.slice(1).some((token) =>
    /^-/.test(token) || /\//.test(token) || /\./.test(token) || /=/.test(token),
  );

  return tokens.length === 1 || shellSignals;
}

function mutateCommandForDistractor(command: string): string {
  if (command.includes(' -')) {
    return command.replace(/\s-([A-Za-z0-9-]+)/, ' --help');
  }
  const [first, ...rest] = command.split(/\s+/);
  return [first, '--version', ...rest.slice(1)].join(' ').trim();
}

function deriveTitleFromSource(sourceText: string): string {
  const raw = sourceText.replace(/\s+/g, ' ').trim();
  const installMatch = raw.match(/\bguide for installing ([A-Z][A-Za-z0-9+._-]*(?:\s+[A-Z][A-Za-z0-9+._-]*){0,3})\b/);
  if (installMatch?.[1]) return `${installMatch[1]} Installation Guide`;

  const installAltMatch = raw.match(/\binstall(?:ing|ation of)?\s+([A-Z][A-Za-z0-9+._-]*(?:\s+[A-Z][A-Za-z0-9+._-]*){0,3})\b/);
  if (installAltMatch?.[1]) return `${installAltMatch[1]} Installation Guide`;

  const guideMatch = raw.match(/\b(?:guide to|guide for|overview of|introduction to)\s+([^.!:\n]{4,80})/i);
  if (guideMatch?.[1]) return toReadableTitle(guideMatch[1]);

  const properNounMatch = raw.match(/\b([A-Z][A-Za-z0-9+._-]*(?:\s+[A-Z][A-Za-z0-9+._-]*){1,3})\b/);
  if (properNounMatch?.[1]) return properNounMatch[1];

  const meaningful = stripMarkupPreserveWords(sourceText)
    .split(/[.!?\n]/)
    .map((part) => part.trim())
    .find((part) => part && !/^(this|the|a|an)\b/i.test(part));

  return toReadableTitle(meaningful ?? 'Focused Lesson');
}

function toReadableTitle(value: string): string {
  const cleaned = value
    .replace(/^[^A-Za-z0-9]+/, '')
    .replace(/\s+(using|with|from|via)\b.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return 'Focused Lesson';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function isGenericTitle(value: string): boolean {
  return /^(this|that|guide|document|overview|lesson|topic|concept|source)\b/.test(value);
}

function fillGroundedChoices(snippets: string[], title: string): string[] {
  const first = snippets[0] ?? title;
  const options = [
    first,
    `Generic overview of ${title}`,
    `Placeholder explanation for ${title}`,
    `Untitled concept made simple`,
  ];
  return Array.from(new Set(options)).slice(0, 4);
}

function buildFallbackStepsFromSnippets(snippets: string[], title: string): LessonSlide[] {
  const safe = snippets.length ? snippets : [title];
  return [
    { heading: 'Source clue 1', body: safe[0] },
    { heading: 'Source clue 2', body: safe[1] ?? safe[0] },
    { heading: 'Source clue 3', body: safe[2] ?? safe[0] },
  ];
}
