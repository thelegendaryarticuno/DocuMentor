import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { ClassifyPayload, TeachPayload, TeachStage } from '../hooks/useTeach';

interface TeachCardProps {
  classify: ClassifyPayload | null;
  payload: TeachPayload | null;
  classifying: boolean;
  teaching: boolean;
  stage: TeachStage;
  statusText: string;
}

type PanelKey = 'lesson' | 'practice' | 'recap';

export function TeachCard({
  classify,
  payload,
  classifying,
  teaching,
  stage,
  statusText,
}: TeachCardProps) {
  const [lessonIndex, setLessonIndex] = useState(0);
  const [lessonAutoPlay, setLessonAutoPlay] = useState(true);
  const [activePanel, setActivePanel] = useState<PanelKey>('lesson');
  const [slideVisible, setSlideVisible] = useState(true);
  const [miniGameAnswer, setMiniGameAnswer] = useState<number | null>(null);
  const [quizSelections, setQuizSelections] = useState<Record<number, number>>({});
  const [commandInputs, setCommandInputs] = useState<Record<number, string>>({});
  const [commandResults, setCommandResults] = useState<Record<number, 'idle' | 'correct' | 'wrong'>>({});

  const lessonSlides = useMemo(() => buildLessonSlides(payload), [payload]);
  const hasQuizDeck = Boolean(payload?.card_format === 'quiz' && payload.quiz?.length);

  useEffect(() => {
    setLessonIndex(0);
    setLessonAutoPlay(true);
    setActivePanel('lesson');
    setSlideVisible(true);
    setMiniGameAnswer(null);
    setQuizSelections({});
    setCommandInputs({});
    setCommandResults({});
  }, [payload?.title, payload?.card_format]);

  useEffect(() => {
    setSlideVisible(false);
    const timer = window.setTimeout(() => setSlideVisible(true), 40);
    return () => window.clearTimeout(timer);
  }, [lessonIndex]);

  useEffect(() => {
    if (!lessonAutoPlay || activePanel !== 'lesson' || lessonSlides.length <= 1) return undefined;
    if (classifying || teaching) return undefined;

    const timer = window.setInterval(() => {
      setLessonIndex((current) => (current >= lessonSlides.length - 1 ? 0 : current + 1));
    }, 3600);

    return () => window.clearInterval(timer);
  }, [activePanel, classifying, lessonAutoPlay, lessonSlides.length, teaching]);

  if (!classify && !payload && !classifying && !teaching) {
    return (
      <div style={shellStyle}>
        <p style={eyebrowStyle}>Interactive teacher</p>
        <h3 style={emptyTitleStyle}>Turn dense docs into something that clicks.</h3>
        <p style={emptyTextStyle}>
          Paste a confusing section, or upload a text-like file. This mode keeps the source only in the
          current browser session and transforms it into lesson cards, recap cues, and a quick mini-game.
        </p>
      </div>
    );
  }

  const title = payload?.title ?? classify?.concept ?? 'Preparing your lesson...';
  const oneLiner = payload?.one_liner ?? 'Finding the clearest teaching path.';
  const hasCommandLab = Boolean(payload?.command_lab?.steps?.length);
  const miniGameResult =
    payload && miniGameAnswer !== null && miniGameAnswer === payload.mini_game.answer_index
      ? 'correct'
      : miniGameAnswer !== null
      ? 'wrong'
      : 'idle';

  return (
    <div style={shellStyle}>
      <div style={heroStyle}>
        <div style={{ flex: 1 }}>
          <p style={eyebrowStyle}>Guided Study</p>
          <h3 style={titleStyle}>{title}</h3>
          <p style={oneLinerStyle}>{oneLiner}</p>
        </div>
        <div style={statusAreaStyle}>
          <span style={statusChipStyle(stage)}>{stageLabel(stage)}</span>
          {classify && (
            <div style={tagRowStyle}>
              <span style={tagStyle}>{classify.type}</span>
              <span style={tagStyle}>{classify.card_format}</span>
              <span style={tagStyle}>{classify.complexity}</span>
            </div>
          )}
        </div>
      </div>

      <div style={headlineCardStyle}>
        <div>
          <p style={sectionKickerStyle}>Why it matters</p>
          <p style={headlineBodyStyle}>{payload?.why_this_matters ?? statusText}</p>
        </div>
        {payload?.memory_hook && (
          <div style={memoryHookStyle}>
            <span style={memoryHookLabelStyle}>Memory hook</span>
            <span>{payload.memory_hook}</span>
          </div>
        )}
      </div>

      {payload?.source_snippets?.length ? (
        <div style={groundingBoxStyle}>
          <p style={sectionKickerStyle}>Grounded in your source</p>
          <div style={groundingChipRowStyle}>
            {payload.source_snippets.map((snippet, index) => (
              <span key={`${snippet}-${index}`} style={groundingChipStyle}>
                {snippet}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {(classifying || teaching) && (
        <div style={{ marginTop: '18px' }}>
          <div style={progressTrackStyle}>
            <div
              style={{
                ...progressBarStyle,
                width: classifying ? '44%' : '82%',
              }}
            />
          </div>
          <p style={progressTextStyle}>{statusText}</p>
        </div>
      )}

      {payload && (
        <>
          <div style={panelTabsStyle}>
            {(['lesson', 'practice', 'recap'] as PanelKey[]).map((panel) => (
              <button
                key={panel}
                onClick={() => setActivePanel(panel)}
                style={panelButtonStyle(activePanel === panel)}
              >
                {panel === 'lesson' ? 'Lesson Cards' : panel === 'practice' ? 'Practice Lab' : 'Recap'}
              </button>
            ))}
          </div>

          {activePanel === 'lesson' && (
            <>
              <div style={deckFrameStyle}>
                <div
                  style={{
                    opacity: slideVisible ? 1 : 0,
                    transform: slideVisible ? 'translateY(0px)' : 'translateY(8px)',
                    transition: 'opacity 220ms ease, transform 220ms ease',
                  }}
                >
                  {lessonSlides[lessonIndex]}
                </div>
              </div>

              {lessonSlides.length > 1 && (
                <div style={deckFooterStyle}>
                  <div style={dotRowStyle}>
                    {lessonSlides.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setLessonIndex(idx)}
                        style={dotStyle(idx === lessonIndex)}
                      />
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button onClick={() => setLessonAutoPlay((value) => !value)} style={deckButtonStyle}>
                      {lessonAutoPlay ? 'Pause' : 'Autoplay'}
                    </button>
                    <button
                      onClick={() =>
                        setLessonIndex((idx) => (idx === 0 ? lessonSlides.length - 1 : idx - 1))
                      }
                      style={deckButtonStyle}
                    >
                      Prev
                    </button>
                    <button
                      onClick={() =>
                        setLessonIndex((idx) => (idx >= lessonSlides.length - 1 ? 0 : idx + 1))
                      }
                      style={deckButtonStyle}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {activePanel === 'practice' && payload && (
            <div style={gameLayoutStyle}>
              {hasCommandLab && (
                <article style={commandLabStyle}>
                  <p style={sectionKickerStyle}>Command lab</p>
                  <h4 style={gamePromptStyle}>Practice the real command flow</h4>
                  <p style={commandLabIntroStyle}>{payload.command_lab?.intro}</p>

                  <div style={{ display: 'grid', gap: '14px' }}>
                    {payload.command_lab?.steps.map((step, index) => {
                      const input = commandInputs[index] ?? '';
                      const normalizedInput = normalizeCommandValue(input);
                      const normalizedExpected = normalizeCommandValue(step.command);
                      const result = commandResults[index] ?? 'idle';

                      return (
                        <div key={`${step.command}-${index}`} style={commandStepStyle}>
                          <div style={{ display: 'grid', gap: '6px' }}>
                            <p style={commandStepTitleStyle}>{step.title}</p>
                            <p style={commandGoalStyle}>{step.goal}</p>
                            <p style={commandContextStyle}>{step.context}</p>
                          </div>

                          <div style={terminalStyle}>
                            <span style={terminalPromptStyle}>$</span>
                            <input
                              value={input}
                              onChange={(event) =>
                                setCommandInputs((prev) => ({ ...prev, [index]: event.target.value }))
                              }
                              placeholder="Type the command here"
                              style={terminalInputStyle}
                              spellCheck={false}
                            />
                          </div>

                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() =>
                                setCommandResults((prev) => ({
                                  ...prev,
                                  [index]: normalizedInput === normalizedExpected ? 'correct' : 'wrong',
                                }))
                              }
                              style={deckButtonStyle}
                            >
                              Check command
                            </button>
                            <button
                              onClick={() =>
                                setCommandInputs((prev) => ({ ...prev, [index]: step.command }))
                              }
                              style={deckButtonStyle}
                            >
                              Reveal command
                            </button>
                          </div>

                          <div style={tokenHintWrapStyle}>
                            {step.token_hints.map((hint, hintIndex) => (
                              <div key={`${hint.token}-${hintIndex}`} style={tokenHintStyle}>
                                <strong>{hint.token}</strong> {hint.meaning}
                              </div>
                            ))}
                          </div>

                          {result !== 'idle' && (
                            <div style={feedbackStyle(result === 'correct')}>
                              <strong>{result === 'correct' ? 'Nice.' : 'Try again.'}</strong>{' '}
                              {result === 'correct'
                                ? step.success_message
                                : `Expected: ${step.command}`}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </article>
              )}

              <article style={gameCardStyle}>
                <p style={sectionKickerStyle}>{hasCommandLab ? 'Quick check' : 'Mini game'}</p>
                <h4 style={gamePromptStyle}>{payload.mini_game.prompt}</h4>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {payload.mini_game.choices.map((choice, index) => {
                    const isSelected = miniGameAnswer === index;
                    const isCorrect = payload.mini_game.answer_index === index;
                    return (
                      <button
                        key={`${choice}-${index}`}
                        onClick={() => setMiniGameAnswer(index)}
                        style={choiceButtonStyle(isSelected, miniGameAnswer !== null, isCorrect)}
                      >
                        {choice}
                      </button>
                    );
                  })}
                </div>

                {miniGameAnswer !== null && (
                  <div style={feedbackStyle(miniGameResult === 'correct')}>
                    <strong>{miniGameResult === 'correct' ? 'Nice.' : 'Almost.'}</strong> {payload.mini_game.explanation}
                  </div>
                )}
              </article>

              {hasQuizDeck && (
                <article style={quizDeckStyle}>
                  <p style={sectionKickerStyle}>Check yourself</p>
                  <div style={{ display: 'grid', gap: '14px' }}>
                    {payload.quiz?.map((q, idx) => {
                      const selected = quizSelections[idx];
                      return (
                        <div key={`${q.question}-${idx}`} style={quizCardStyle}>
                          <h4 style={quizQuestionStyle}>{q.question}</h4>
                          <div style={{ display: 'grid', gap: '8px' }}>
                            {q.options.map((option, optionIdx) => {
                              const isSelected = selected === optionIdx;
                              const isCorrect = q.correct === optionIdx;
                              return (
                                <button
                                  key={`${option}-${optionIdx}`}
                                  onClick={() =>
                                    setQuizSelections((prev) => ({ ...prev, [idx]: optionIdx }))
                                  }
                                  style={choiceButtonStyle(isSelected, selected !== undefined, isCorrect)}
                                >
                                  {option}
                                </button>
                              );
                            })}
                          </div>
                          {selected !== undefined && (
                            <p style={quizExplanationStyle}>
                              {q.explanation}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </article>
              )}
            </div>
          )}

          {activePanel === 'recap' && (
            <div style={recapGridStyle}>
              <article style={recapCardStyle}>
                <p style={sectionKickerStyle}>Key takeaways</p>
                <ul style={recapListStyle}>
                  {payload.key_takeaways.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              </article>

              <article style={recapCardStyle}>
                <p style={sectionKickerStyle}>Common traps</p>
                <ul style={recapListStyle}>
                  {payload.common_traps.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              </article>

              <article style={nextTryCardStyle}>
                <p style={sectionKickerStyle}>Next try</p>
                <p style={nextTryTextStyle}>{payload.next_try}</p>
              </article>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function normalizeCommandValue(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function buildLessonSlides(payload: TeachPayload | null): ReactNode[] {
  if (!payload) return [];

  if (payload.card_format === 'stepper' && payload.steps?.length) {
    return payload.steps.map((step, index) => (
      <article key={`${step.heading}-${index}`} style={lessonCardStyle}>
        <div style={lessonStepHeaderStyle}>
          <span style={stepNumberStyle}>{index + 1}</span>
          <h4 style={slideTitleStyle}>{step.heading}</h4>
        </div>
        <p style={slideBodyStyle}>{step.body}</p>
        {step.code && (
          <pre style={codeBlockStyle}>
            <code>{step.code}</code>
          </pre>
        )}
      </article>
    ));
  }

  if (payload.card_format === 'analogy') {
    return [
      <article key="analogy-real" style={lessonCardStyle}>
        <p style={sectionKickerStyle}>Real-world view</p>
        <h4 style={slideTitleStyle}>Make the idea concrete</h4>
        <p style={slideBodyStyle}>{payload.real_world}</p>
      </article>,
      <article key="analogy-code" style={lessonCardStyle}>
        <p style={sectionKickerStyle}>Code view</p>
        <h4 style={slideTitleStyle}>Translate the analogy back</h4>
        <p style={slideBodyStyle}>{payload.code_equivalent}</p>
      </article>,
    ];
  }

  if (payload.card_format === 'compare' && payload.option_a && payload.option_b) {
    return [payload.option_a, payload.option_b].map((option, index) => (
      <article key={`${option.label}-${index}`} style={lessonCardStyle}>
        <p style={sectionKickerStyle}>{index === 0 ? 'Option A' : 'Option B'}</p>
        <h4 style={slideTitleStyle}>{option.label}</h4>
        <pre style={codeBlockStyle}>
          <code>{option.code}</code>
        </pre>
        <ul style={recapListStyle}>
          {option.pros.map((pro, idx) => (
            <li key={`${pro}-${idx}`}>{pro}</li>
          ))}
        </ul>
      </article>
    ));
  }

  if (payload.card_format === 'quiz' && payload.quiz?.length) {
    return payload.quiz.map((question, index) => (
      <article key={`${question.question}-${index}`} style={lessonCardStyle}>
        <p style={sectionKickerStyle}>Question {index + 1}</p>
        <h4 style={slideTitleStyle}>{question.question}</h4>
        <ol style={orderedListStyle}>
          {question.options.map((option, idx) => (
            <li key={`${option}-${idx}`}>{option}</li>
          ))}
        </ol>
        <p style={quizExplanationStyle}>{question.explanation}</p>
      </article>
    ));
  }

  return [];
}

function stageLabel(stage: TeachStage) {
  switch (stage) {
    case 'preparing':
      return 'Preparing';
    case 'teaching':
      return 'Teaching';
    case 'ready':
      return 'Ready';
    case 'error':
      return 'Retry needed';
    default:
      return 'Waiting';
  }
}

function panelButtonStyle(active: boolean): CSSProperties {
  return {
    border: 'none',
    borderRadius: '999px',
    padding: '10px 14px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    background: active ? '#0F172A' : '#E2E8F0',
    color: active ? '#FFFFFF' : '#334155',
  };
}

function statusChipStyle(stage: TeachStage): CSSProperties {
  const palette =
    stage === 'ready'
      ? { background: '#DCFCE7', color: '#166534' }
      : stage === 'error'
      ? { background: '#FEE2E2', color: '#991B1B' }
      : { background: '#DBEAFE', color: '#1D4ED8' };

  return {
    borderRadius: '999px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 800,
    ...palette,
  };
}

function dotStyle(active: boolean): CSSProperties {
  return {
    width: active ? '22px' : '8px',
    height: '8px',
    borderRadius: '999px',
    border: 'none',
    background: active ? '#0284C7' : '#CBD5E1',
    cursor: 'pointer',
    transition: 'all 180ms ease',
  };
}

function choiceButtonStyle(selected: boolean, answered: boolean, correct: boolean): CSSProperties {
  const background = answered
    ? correct
      ? '#DCFCE7'
      : selected
      ? '#FEE2E2'
      : '#FFFFFF'
    : selected
    ? '#DBEAFE'
    : '#FFFFFF';

  const border = answered
    ? correct
      ? '#22C55E'
      : selected
      ? '#F87171'
      : '#CBD5E1'
    : selected
    ? '#0EA5E9'
    : '#CBD5E1';

  return {
    textAlign: 'left',
    padding: '12px 14px',
    borderRadius: '12px',
    border: `1px solid ${border}`,
    background,
    color: '#0F172A',
    cursor: 'pointer',
    fontSize: '14px',
    lineHeight: 1.5,
  };
}

function feedbackStyle(success: boolean): CSSProperties {
  return {
    marginTop: '14px',
    borderRadius: '14px',
    padding: '12px 14px',
    background: success ? '#DCFCE7' : '#FEF3C7',
    color: success ? '#166534' : '#92400E',
    lineHeight: 1.6,
  };
}

const shellStyle: CSSProperties = {
  background: 'linear-gradient(160deg, #FFFFFF 0%, #F8FAFC 45%, #EEF2FF 100%)',
  border: '1px solid #CBD5E1',
  borderRadius: '24px',
  padding: '22px',
  boxShadow: '0 18px 45px rgba(15, 23, 42, 0.10)',
  minHeight: '320px',
  overflow: 'visible',
};

const heroStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '18px',
  alignItems: 'flex-start',
  flexWrap: 'wrap',
};

const eyebrowStyle: CSSProperties = {
  margin: 0,
  color: '#0284C7',
  fontWeight: 800,
  fontSize: '12px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
};

const titleStyle: CSSProperties = {
  margin: '8px 0 8px 0',
  color: '#0F172A',
  fontSize: '30px',
  lineHeight: 1.1,
};

const emptyTitleStyle: CSSProperties = {
  margin: '10px 0 8px 0',
  color: '#0F172A',
  fontSize: '28px',
  lineHeight: 1.15,
};

const emptyTextStyle: CSSProperties = {
  margin: 0,
  color: '#475569',
  lineHeight: 1.7,
  maxWidth: '58ch',
};

const oneLinerStyle: CSSProperties = {
  margin: 0,
  color: '#334155',
  lineHeight: 1.6,
  maxWidth: '62ch',
};

const statusAreaStyle: CSSProperties = {
  display: 'grid',
  gap: '10px',
  justifyItems: 'end',
};

const tagRowStyle: CSSProperties = {
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
};

const tagStyle: CSSProperties = {
  borderRadius: '999px',
  background: '#E2E8F0',
  color: '#334155',
  padding: '5px 10px',
  fontSize: '12px',
  fontWeight: 700,
};

const headlineCardStyle: CSSProperties = {
  marginTop: '18px',
  borderRadius: '20px',
  padding: '16px',
  background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.10), rgba(99, 102, 241, 0.08))',
  border: '1px solid rgba(14, 165, 233, 0.18)',
  display: 'grid',
  gap: '14px',
};

const sectionKickerStyle: CSSProperties = {
  margin: 0,
  color: '#0284C7',
  fontWeight: 800,
  fontSize: '12px',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

const headlineBodyStyle: CSSProperties = {
  margin: '8px 0 0 0',
  color: '#0F172A',
  lineHeight: 1.6,
  fontSize: '15px',
};

const memoryHookStyle: CSSProperties = {
  borderRadius: '16px',
  padding: '14px 16px',
  background: '#FFFFFF',
  color: '#334155',
  display: 'grid',
  gap: '6px',
  border: '1px solid rgba(148, 163, 184, 0.35)',
};

const memoryHookLabelStyle: CSSProperties = {
  fontSize: '12px',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: '#7C3AED',
};

const progressTrackStyle: CSSProperties = {
  width: '100%',
  height: '10px',
  borderRadius: '999px',
  background: '#E2E8F0',
  overflow: 'hidden',
};

const progressBarStyle: CSSProperties = {
  height: '100%',
  borderRadius: '999px',
  background: 'linear-gradient(90deg, #0284C7, #14B8A6)',
  transition: 'width 0.45s ease',
};

const progressTextStyle: CSSProperties = {
  margin: '10px 0 0 0',
  color: '#475569',
  fontSize: '14px',
};

const groundingBoxStyle: CSSProperties = {
  marginTop: '14px',
  borderRadius: '18px',
  padding: '14px',
  background: '#FFFFFF',
  border: '1px solid rgba(148, 163, 184, 0.28)',
  display: 'grid',
  gap: '10px',
};

const groundingChipRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
};

const groundingChipStyle: CSSProperties = {
  borderRadius: '999px',
  padding: '8px 12px',
  background: '#EFF6FF',
  color: '#1E3A8A',
  border: '1px solid #BFDBFE',
  fontSize: '13px',
  lineHeight: 1.4,
  fontWeight: 600,
};

const panelTabsStyle: CSSProperties = {
  marginTop: '20px',
  display: 'flex',
  gap: '8px',
  flexWrap: 'wrap',
};

const deckFrameStyle: CSSProperties = {
  marginTop: '18px',
  minHeight: '250px',
};

const deckFooterStyle: CSSProperties = {
  marginTop: '12px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '12px',
  flexWrap: 'wrap',
};

const dotRowStyle: CSSProperties = {
  display: 'flex',
  gap: '6px',
  alignItems: 'center',
};

const deckButtonStyle: CSSProperties = {
  border: '1px solid #94A3B8',
  borderRadius: '999px',
  background: '#FFFFFF',
  color: '#0F172A',
  padding: '8px 12px',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: '12px',
};

const lessonCardStyle: CSSProperties = {
  border: '1px solid rgba(148, 163, 184, 0.28)',
  borderRadius: '22px',
  padding: '18px',
  background: '#FFFFFF',
  minHeight: '250px',
  boxShadow: '0 16px 36px rgba(15, 23, 42, 0.08)',
};

const lessonStepHeaderStyle: CSSProperties = {
  display: 'flex',
  gap: '12px',
  alignItems: 'center',
  marginBottom: '10px',
};

const stepNumberStyle: CSSProperties = {
  width: '30px',
  height: '30px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '999px',
  background: '#0EA5E9',
  color: '#FFFFFF',
  fontWeight: 800,
  fontSize: '13px',
};

const slideTitleStyle: CSSProperties = {
  margin: 0,
  color: '#0F172A',
  fontSize: '22px',
};

const slideBodyStyle: CSSProperties = {
  margin: 0,
  color: '#334155',
  lineHeight: 1.7,
  fontSize: '15px',
};

const codeBlockStyle: CSSProperties = {
  marginTop: '14px',
  borderRadius: '14px',
  background: '#0F172A',
  color: '#E2E8F0',
  padding: '12px',
  overflowX: 'auto',
  fontSize: '12px',
  lineHeight: 1.6,
};

const gameLayoutStyle: CSSProperties = {
  marginTop: '18px',
  display: 'grid',
  gap: '16px',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
};

const gameCardStyle: CSSProperties = {
  borderRadius: '22px',
  padding: '18px',
  background: '#FFFFFF',
  border: '1px solid rgba(148, 163, 184, 0.28)',
  boxShadow: '0 16px 36px rgba(15, 23, 42, 0.08)',
};

const commandLabStyle: CSSProperties = {
  ...gameCardStyle,
  display: 'grid',
  gap: '14px',
};

const commandLabIntroStyle: CSSProperties = {
  margin: '-2px 0 0 0',
  color: '#475569',
  lineHeight: 1.6,
  fontSize: '14px',
};

const commandStepStyle: CSSProperties = {
  borderRadius: '18px',
  padding: '16px',
  background: '#F8FAFC',
  border: '1px solid #E2E8F0',
  display: 'grid',
  gap: '12px',
};

const commandStepTitleStyle: CSSProperties = {
  margin: 0,
  color: '#0F172A',
  fontWeight: 800,
  fontSize: '16px',
};

const commandGoalStyle: CSSProperties = {
  margin: 0,
  color: '#0F172A',
  lineHeight: 1.6,
  fontSize: '14px',
};

const commandContextStyle: CSSProperties = {
  margin: 0,
  color: '#64748B',
  lineHeight: 1.6,
  fontSize: '13px',
};

const terminalStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  borderRadius: '14px',
  background: '#0F172A',
  padding: '12px 14px',
  border: '1px solid #1E293B',
};

const terminalPromptStyle: CSSProperties = {
  color: '#22C55E',
  fontWeight: 800,
  fontSize: '14px',
};

const terminalInputStyle: CSSProperties = {
  flex: 1,
  background: 'transparent',
  border: 'none',
  outline: 'none',
  color: '#E2E8F0',
  fontSize: '14px',
  lineHeight: 1.5,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
};

const tokenHintWrapStyle: CSSProperties = {
  display: 'grid',
  gap: '8px',
};

const tokenHintStyle: CSSProperties = {
  borderRadius: '12px',
  padding: '10px 12px',
  background: '#FFFFFF',
  border: '1px solid #E2E8F0',
  color: '#334155',
  lineHeight: 1.6,
  fontSize: '13px',
};

const gamePromptStyle: CSSProperties = {
  margin: '8px 0 14px 0',
  color: '#0F172A',
  fontSize: '20px',
  lineHeight: 1.35,
};

const quizDeckStyle: CSSProperties = {
  borderRadius: '22px',
  padding: '18px',
  background: '#F8FAFC',
  border: '1px solid rgba(148, 163, 184, 0.28)',
};

const quizCardStyle: CSSProperties = {
  borderRadius: '18px',
  padding: '14px',
  background: '#FFFFFF',
  border: '1px solid #E2E8F0',
};

const quizQuestionStyle: CSSProperties = {
  margin: '0 0 12px 0',
  color: '#0F172A',
  fontSize: '17px',
  lineHeight: 1.4,
};

const quizExplanationStyle: CSSProperties = {
  margin: '12px 0 0 0',
  color: '#475569',
  lineHeight: 1.6,
  fontSize: '14px',
};

const orderedListStyle: CSSProperties = {
  margin: '12px 0 0 18px',
  color: '#334155',
  lineHeight: 1.7,
  display: 'grid',
  gap: '6px',
};

const recapGridStyle: CSSProperties = {
  marginTop: '18px',
  display: 'grid',
  gap: '16px',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
};

const recapCardStyle: CSSProperties = {
  borderRadius: '20px',
  padding: '18px',
  background: '#FFFFFF',
  border: '1px solid rgba(148, 163, 184, 0.28)',
};

const nextTryCardStyle: CSSProperties = {
  borderRadius: '20px',
  padding: '18px',
  background: 'linear-gradient(135deg, #0F172A, #1E293B)',
  color: '#E2E8F0',
};

const recapListStyle: CSSProperties = {
  margin: '12px 0 0 18px',
  color: '#334155',
  lineHeight: 1.7,
  display: 'grid',
  gap: '6px',
};

const nextTryTextStyle: CSSProperties = {
  margin: '10px 0 0 0',
  lineHeight: 1.7,
  color: '#E2E8F0',
};
