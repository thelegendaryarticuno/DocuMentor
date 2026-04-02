import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getHardwareAccelerationInfo } from '../runanywhere';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const gpuInfo = getHardwareAccelerationInfo();

  const modeCards = [
    {
      id: 'research',
      title: 'Research',
      kicker: 'Challenge the argument',
      description: 'Load a thesis, debate it, then switch to writing help without leaving the same chatbot workspace.',
      bullets: ['Counterarguments on demand', 'Writing improvement mode', 'Single `/chatbot` route'],
      preview: 'Prompt changes from critique to editing help.',
      accentColor: '#D85A30',
      cta: () => navigate('/chatbot?mode=research'),
      demo: () => navigate('/chatbot?mode=research&demo=1'),
    },
    {
      id: 'guided-learning',
      title: 'Guided Learning',
      kicker: 'Learn from your own text',
      description: 'Paste notes, docs, or code and get the same teach-card experience in the new unified chatbot shell.',
      bullets: ['Teach selection or full source', 'Session-aware local source memory', 'Lesson cards grounded in your text'],
      preview: 'Input turns into a teaching workspace with source-aware controls.',
      accentColor: '#378ADD',
      cta: () => navigate('/chatbot?mode=guided-learning'),
      demo: () => navigate('/chatbot?mode=guided-learning&demo=1'),
    },
    {
      id: 'smart-highlights',
      title: 'Smart Highlights',
      kicker: 'Surface the important parts',
      description: 'Keep the dedicated document-analysis flow for automatically finding the most important sections in long files.',
      bullets: ['PDF and DOCX ready', 'Importance analysis', 'Exportable highlights'],
      preview: 'Dedicated route stays available for document review.',
      accentColor: '#1D9E75',
      cta: () => navigate('/highlights'),
      demo: () => navigate('/highlights'),
    },
  ];

  return (
    <div
      style={{
        height: '100vh',
        overflowY: 'auto',
        minHeight: '100vh',
        background: 'var(--bg-page)',
        color: 'var(--text-primary)',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '36px 20px 40px' }}>
        <header style={{ display: 'grid', gap: '22px', marginBottom: '34px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ maxWidth: '760px' }}>
              <p style={heroEyebrowStyle}>On-device AI for studying and research</p>
              <h1 style={{ margin: '12px 0 14px', fontSize: 'clamp(3rem, 6vw, 5.6rem)', lineHeight: 0.94, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                DocuMentor
              </h1>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '18px', lineHeight: 1.7, fontFamily: 'var(--font-body)' }}>
                Pick a mode card, open the unified chatbot at <code>/chatbot</code>, and switch between research and guided learning with mode-specific inputs that behave like the current dedicated routes.
              </p>
            </div>

            <div style={statusPanelStyle}>
              <p style={miniLabelStyle}>Runtime</p>
              <p style={{ margin: '8px 0 0', color: 'var(--text-primary)', fontSize: '16px', fontWeight: 800 }}>
                {gpuInfo.isActive ? 'GPU Accelerated' : 'CPU Mode'}
              </p>
              <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '14px' }}>
                {gpuInfo.gpuInfo?.description ?? 'All inference runs locally in the browser.'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/chatbot?mode=research&demo=1')} style={primaryHeroButtonStyle}>
              Try chatbot demo
            </button>
            <button onClick={() => navigate('/chatbot?mode=guided-learning')} style={secondaryHeroButtonStyle}>
              Open guided learning
            </button>
          </div>
        </header>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '18px',
            marginBottom: '34px',
          }}
        >
          {modeCards.map((card) => (
            <article
              key={card.id}
              style={{
                borderRadius: 'var(--rl)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ padding: '22px 22px 18px', background: card.accentColor, color: '#FFFFFF' }}>
                <p style={{ margin: 0, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800, opacity: 0.9 }}>
                  {card.kicker}
                </p>
                <h2 style={{ margin: '10px 0 0', fontSize: '30px', lineHeight: 1, fontFamily: 'var(--font-display)', fontWeight: 700 }}>{card.title}</h2>
              </div>

              <div style={{ padding: '22px', display: 'grid', gap: '18px', flex: 1 }}>
                <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.7, fontFamily: 'var(--font-body)' }}>{card.description}</p>

                <div
                  style={{
                    borderRadius: '12px',
                    background: 'var(--bg-raised)',
                    border: '1px solid var(--border-subtle)',
                    padding: '16px',
                  }}
                >
                  <p style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 800, fontFamily: 'var(--font-display)' }}>UI preview</p>
                  <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '14px', fontFamily: 'var(--font-body)' }}>{card.preview}</p>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '10px' }}>
                  {card.bullets.map((bullet) => (
                    <li key={bullet} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', color: 'var(--text-primary)', lineHeight: 1.5, fontFamily: 'var(--font-body)' }}>
                      <span style={{ color: 'var(--accent)', fontWeight: 900 }}>✓</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: 'auto' }}>
                  <button onClick={card.cta} style={cardPrimaryButtonStyle}>
                    Open
                  </button>
                  <button onClick={card.demo} style={cardSecondaryButtonStyle}>
                    Try demo
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
          }}
        >
          <FeatureCard
            title="Private by default"
            description="Your documents stay on-device. The new chatbot shell still uses the same local inference flow."
          />
          <FeatureCard
            title="Mode-aware input"
            description="The composer changes with the selected mode so research and guided learning feel purpose-built."
          />
          <FeatureCard
            title="Faster navigation"
            description="Cards on the first screen now point directly into the right chatbot experience instead of making you hunt for routes."
          />
        </section>
      </div>
    </div>
  );
};

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div
      style={{
        borderRadius: 'var(--rl)',
        padding: '20px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <h3 style={{ margin: 0, fontSize: '20px', color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>{title}</h3>
      <p style={{ margin: '10px 0 0', color: 'var(--text-secondary)', lineHeight: 1.7, fontFamily: 'var(--font-body)' }}>{description}</p>
    </div>
  );
}

const heroEyebrowStyle = {
  margin: 0,
  color: 'var(--accent)',
  fontSize: '12px',
  fontWeight: 800,
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
  fontFamily: 'var(--font-display)',
};

const miniLabelStyle = {
  margin: 0,
  color: 'var(--accent)',
  fontSize: '11px',
  fontWeight: 800,
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  fontFamily: 'var(--font-display)',
};

const statusPanelStyle = {
  minWidth: '280px',
  maxWidth: '340px',
  borderRadius: 'var(--rl)',
  padding: '18px',
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-subtle)',
};

const primaryHeroButtonStyle = {
  border: 'none',
  borderRadius: '999px',
  padding: '13px 18px',
  background: 'var(--accent)',
  color: '#FFFFFF',
  fontWeight: 800,
  fontSize: '14px',
  cursor: 'pointer',
  fontFamily: 'var(--font-display)',
};

const secondaryHeroButtonStyle = {
  border: '1px solid var(--border-subtle)',
  borderRadius: '999px',
  padding: '13px 18px',
  background: 'var(--bg-raised)',
  color: 'var(--text-primary)',
  fontWeight: 800,
  fontSize: '14px',
  cursor: 'pointer',
  fontFamily: 'var(--font-display)',
};

const cardPrimaryButtonStyle = {
  border: 'none',
  borderRadius: '999px',
  padding: '11px 16px',
  background: 'var(--accent)',
  color: '#FFFFFF',
  fontWeight: 800,
  fontSize: '13px',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
};

const cardSecondaryButtonStyle = {
  border: '1px solid var(--border-subtle)',
  borderRadius: '999px',
  padding: '11px 16px',
  background: 'var(--bg-surface)',
  color: 'var(--text-primary)',
  fontWeight: 700,
  fontSize: '13px',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
};
