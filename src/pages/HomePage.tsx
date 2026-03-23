import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getHardwareAccelerationInfo } from '../runanywhere';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const gpuInfo = getHardwareAccelerationInfo();

  const modes = [
    {
      id: 'student',
      title: 'Student Mode',
      description: 'Learn confusing topics with interactive lessons, games, and visual cards',
      icon: '🎓',
      color: 'from-orange-500 to-red-500',
      path: '/student',
      features: ['Interactive lessons', 'Mini games', 'Visual learning cards'],
    },
    {
      id: 'research',
      title: 'Research Mode',
      description: 'Debate ideas and improve your academic writing with AI assistance',
      icon: '🔬',
      color: 'from-purple-500 to-pink-500',
      path: '/research',
      features: ['Devil\'s advocate debate', 'Writing improvements', 'Evidence checking'],
    },
    {
      id: 'highlights',
      title: 'Smart Highlights',
      description: 'AI automatically highlights critical and important sections in your documents',
      icon: '✨',
      color: 'from-blue-500 to-cyan-500',
      path: '/highlights',
      features: ['PDF & DOCX support', 'AI importance analysis', 'Downloadable highlights'],
      isNew: true,
    },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      {/* Header */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ 
            fontSize: '56px', 
            fontWeight: 'bold', 
            marginBottom: '16px',
            background: 'linear-gradient(to right, #FF5500, #FF8844)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            DocuMentor
          </h1>
          <p style={{ 
            fontSize: '20px', 
            color: 'var(--text-muted)', 
            marginBottom: '24px' 
          }}>
            Your AI-powered learning companion, running entirely on your device
          </p>
          
          {/* GPU Status */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 24px',
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: gpuInfo.isActive ? 'var(--green)' : '#F59E0B',
              animation: gpuInfo.isActive ? 'pulse 2s infinite' : 'none'
            }}></div>
            <span style={{ fontSize: '14px', fontWeight: '600' }}>
              {gpuInfo.isActive ? '⚡ GPU Accelerated' : '💻 CPU Mode'}
            </span>
            {gpuInfo.gpuInfo && (
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                • {gpuInfo.gpuInfo.description}
              </span>
            )}
          </div>
        </div>

        {/* Mode Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '24px',
          marginBottom: '64px'
        }}>
          {modes.map((mode) => (
            <ModeCard key={mode.id} mode={mode} onSelect={() => navigate(mode.path)} />
          ))}
        </div>

        {/* Features */}
        <div style={{ marginTop: '64px' }}>
          <h2 style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            textAlign: 'center', 
            marginBottom: '32px' 
          }}>
            Why DocuMentor?
          </h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '24px' 
          }}>
            <FeatureCard
              icon="🔒"
              title="100% Private"
              description="All processing happens on your device. Your documents never leave your computer."
            />
            <FeatureCard
              icon="⚡"
              title="Lightning Fast"
              description="Optimized for speed with GPU acceleration. Get answers in seconds, not minutes."
            />
            <FeatureCard
              icon="🎯"
              title="Purpose-Built"
              description="Three specialized modes designed for learning, research, and document analysis."
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          marginTop: '64px', 
          textAlign: 'center', 
          color: 'var(--text-muted)', 
          fontSize: '14px' 
        }}>
          <p>Made with ❤️ for learners and researchers</p>
          <p style={{ marginTop: '8px' }}>
            Powered by on-device AI • No internet required after setup
          </p>
        </div>
      </div>
    </div>
  );
};

// Mode Card Component
interface ModeCardProps {
  mode: {
    title: string;
    description: string;
    icon: string;
    color: string;
    features: string[];
    isNew?: boolean;
  };
  onSelect: () => void;
}

const ModeCard: React.FC<ModeCardProps> = ({ mode, onSelect }) => {
  return (
    <div
      onClick={onSelect}
      style={{
        position: 'relative',
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.5)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* New Badge */}
      {mode.isNew && (
        <div style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          background: 'linear-gradient(to right, #FBBF24, #F59E0B)',
          color: '#1F2937',
          fontSize: '12px',
          fontWeight: 'bold',
          padding: '4px 12px',
          borderRadius: '12px',
          animation: 'pulse 2s infinite'
        }}>
          NEW!
        </div>
      )}

      {/* Gradient Header */}
      <div style={{
        height: '120px',
        background: `linear-gradient(to right, ${mode.color.split(' ')[1]}, ${mode.color.split(' ')[3]})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '56px'
      }}>
        {mode.icon}
      </div>

      {/* Content */}
      <div style={{ padding: '24px' }}>
        <h3 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          marginBottom: '8px' 
        }}>
          {mode.title}
        </h3>
        <p style={{ 
          color: 'var(--text-muted)', 
          marginBottom: '16px',
          fontSize: '14px'
        }}>
          {mode.description}
        </p>

        {/* Features */}
        <ul style={{ 
          listStyle: 'none', 
          padding: 0, 
          marginBottom: '24px',
          fontSize: '14px'
        }}>
          {mode.features.map((feature, index) => (
            <li key={index} style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: '8px',
              marginBottom: '8px'
            }}>
              <span style={{ color: 'var(--green)' }}>✓</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        <button style={{
          width: '100%',
          padding: '12px',
          backgroundColor: 'var(--primary)',
          color: 'white',
          border: 'none',
          borderRadius: 'var(--radius-sm)',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--primary-hover)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--primary)';
        }}
        >
          Launch {mode.title} →
        </button>
      </div>
    </div>
  );
};

// Feature Card Component
interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
  return (
    <div style={{
      backgroundColor: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '24px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '40px', marginBottom: '12px' }}>{icon}</div>
      <h3 style={{ 
        fontSize: '18px', 
        fontWeight: 'bold', 
        marginBottom: '8px' 
      }}>{title}</h3>
      <p style={{ 
        color: 'var(--text-muted)', 
        fontSize: '14px' 
      }}>{description}</p>
    </div>
  );
};
