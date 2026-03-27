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
      gradient: 'linear-gradient(135deg, #FB7185, #F97316)',
      surface: 'linear-gradient(180deg, rgba(255,255,255,0.94), rgba(255,244,240,0.92))',
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
      gradient: 'linear-gradient(135deg, #0EA5E9, #2563EB)',
      surface: 'linear-gradient(180deg, rgba(255,255,255,0.94), rgba(239,246,255,0.92))',
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
      gradient: 'linear-gradient(135deg, #06B6D4, #8B5CF6)',
      surface: 'linear-gradient(180deg, rgba(255,255,255,0.94), rgba(238,242,255,0.92))',
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
        background:
          'radial-gradient(circle at top left, rgba(249, 115, 22, 0.16), transparent 24%), radial-gradient(circle at 82% 12%, rgba(56, 189, 248, 0.18), transparent 22%), linear-gradient(180deg, #08111F 0%, #0F172A 42%, #E2E8F0 42%, #F8FAFC 100%)',
        color: '#0F172A',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '36px 20px 40px' }}>
        <header style={{ display: 'grid', gap: '22px', marginBottom: '34px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ maxWidth: '760px' }}>
              <p style={heroEyebrowStyle}>On-device AI for studying and research</p>
              <h1 style={{ margin: '12px 0 14px', fontSize: 'clamp(3rem, 6vw, 5.6rem)', lineHeight: 0.94, color: '#F8FAFC' }}>
                DocuMentor
              </h1>
              <p style={{ margin: 0, color: '#CBD5E1', fontSize: '18px', lineHeight: 1.7 }}>
                Pick a mode card, open the unified chatbot at <code>/chatbot</code>, and switch between research and guided learning with mode-specific inputs that behave like the current dedicated routes.
              </p>
            </div>

            <div style={statusPanelStyle}>
              <p style={miniLabelStyle}>Runtime</p>
              <p style={{ margin: '8px 0 0', color: '#F8FAFC', fontSize: '16px', fontWeight: 800 }}>
                {gpuInfo.isActive ? 'GPU Accelerated' : 'CPU Mode'}
              </p>
              <p style={{ margin: '8px 0 0', color: '#CBD5E1', lineHeight: 1.6, fontSize: '14px' }}>
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
                borderRadius: '28px',
                background: card.surface,
                border: '1px solid rgba(255, 255, 255, 0.42)',
                boxShadow: '0 20px 60px rgba(15, 23, 42, 0.16)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ padding: '22px 22px 18px', background: card.gradient, color: '#FFFFFF' }}>
                <p style={{ margin: 0, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800, opacity: 0.9 }}>
                  {card.kicker}
                </p>
                <h2 style={{ margin: '10px 0 0', fontSize: '30px', lineHeight: 1 }}>{card.title}</h2>
              </div>

              <div style={{ padding: '22px', display: 'grid', gap: '18px', flex: 1 }}>
                <p style={{ margin: 0, color: '#334155', lineHeight: 1.7 }}>{card.description}</p>

                <div
                  style={{
                    borderRadius: '20px',
                    background: 'rgba(255, 255, 255, 0.72)',
                    border: '1px solid rgba(148, 163, 184, 0.22)',
                    padding: '16px',
                  }}
                >
                  <p style={{ margin: 0, color: '#0F172A', fontWeight: 800 }}>UI preview</p>
                  <p style={{ margin: '8px 0 0', color: '#475569', lineHeight: 1.6, fontSize: '14px' }}>{card.preview}</p>
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '10px' }}>
                  {card.bullets.map((bullet) => (
                    <li key={bullet} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', color: '#1E293B', lineHeight: 1.5 }}>
                      <span style={{ color: '#10B981', fontWeight: 900 }}>✓</span>
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
        borderRadius: '22px',
        padding: '20px',
        background: 'rgba(255, 255, 255, 0.86)',
        border: '1px solid rgba(148, 163, 184, 0.22)',
        boxShadow: '0 12px 36px rgba(15, 23, 42, 0.1)',
      }}
    >
      <h3 style={{ margin: 0, fontSize: '20px', color: '#0F172A' }}>{title}</h3>
      <p style={{ margin: '10px 0 0', color: '#475569', lineHeight: 1.7 }}>{description}</p>
    </div>
  );
}

const heroEyebrowStyle = {
  margin: 0,
  color: '#93C5FD',
  fontSize: '12px',
  fontWeight: 800,
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
};

const miniLabelStyle = {
  margin: 0,
  color: '#93C5FD',
  fontSize: '11px',
  fontWeight: 800,
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
};

const statusPanelStyle = {
  minWidth: '280px',
  maxWidth: '340px',
  borderRadius: '24px',
  padding: '18px',
  background: 'rgba(15, 23, 42, 0.5)',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  backdropFilter: 'blur(12px)',
};

const primaryHeroButtonStyle = {
  border: 'none',
  borderRadius: '999px',
  padding: '13px 18px',
  background: 'linear-gradient(90deg, #F97316, #EF4444)',
  color: '#FFFFFF',
  fontWeight: 800,
  fontSize: '14px',
  cursor: 'pointer',
};

const secondaryHeroButtonStyle = {
  border: '1px solid rgba(148, 163, 184, 0.28)',
  borderRadius: '999px',
  padding: '13px 18px',
  background: 'rgba(15, 23, 42, 0.44)',
  color: '#E2E8F0',
  fontWeight: 800,
  fontSize: '14px',
  cursor: 'pointer',
};

const cardPrimaryButtonStyle = {
  border: 'none',
  borderRadius: '999px',
  padding: '11px 16px',
  background: '#0F172A',
  color: '#FFFFFF',
  fontWeight: 800,
  fontSize: '13px',
  cursor: 'pointer',
};

const cardSecondaryButtonStyle = {
  border: '1px solid #CBD5E1',
  borderRadius: '999px',
  padding: '11px 16px',
  background: '#FFFFFF',
  color: '#0F172A',
  fontWeight: 700,
  fontSize: '13px',
  cursor: 'pointer',
};
