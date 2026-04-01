import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ModelBanner } from '../components/ModelBanner';
import { ModelCategory } from '@runanywhere/web';
import { useModelLoader } from '../hooks/useModelLoader';

let appLevelModelEnsurePromise: Promise<boolean> | null = null;

export function Home() {
  const navigate = useNavigate();
  const loader = useModelLoader(ModelCategory.Language);

  useEffect(() => {
    // Start model loading in background on first load
    if (!appLevelModelEnsurePromise) {
      appLevelModelEnsurePromise = loader.ensure();
    }
  }, [loader.ensure]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
      <ModelBanner
        progress={loader.progress * 100}
        modelName="LLM"
      />
      
      <div style={{ 
        paddingBottom: '100px',
        paddingTop: '60px',
        paddingLeft: '20px',
        paddingRight: '20px',
        textAlign: 'center', 
        maxWidth: '700px', 
        margin: '0 auto'
      }}>
        <h1 style={{ 
          fontSize: '48px', 
          marginBottom: '16px',
          fontWeight: 700,
          color: '#111827'
        }}>
          📚 DocuMentor
        </h1>
        
        <p style={{ 
          fontSize: '20px', 
          color: '#6B7280', 
          marginBottom: '12px',
          fontWeight: 500
        }}>
          Your documents. Your device. Your AI.
        </p>
        
        <p style={{ 
          color: '#9CA3AF', 
          marginBottom: '60px',
          fontSize: '16px',
          lineHeight: '1.6'
        }}>
          Analyze your documents with local AI models. Zero backend. 100% private.
          <br />
          Debate your research, improve your writing, scan for sensitive data.
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/research')}
            style={{
              padding: '16px 40px',
              backgroundColor: '#10B981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#059669';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#10B981';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
            }}
          >
            🔬 Research Mode
          </button>
          
          <button
            onClick={() => navigate('/student')}
            style={{
              padding: '16px 40px',
              backgroundColor: 'white',
              color: '#6B7280',
              border: '2px solid #E5E7EB',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#D1D5DB';
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#F9FAFB';
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB';
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'white';
            }}
          >
            🎓 Guided Study
          </button>
        </div>

        <div style={{
          marginTop: '80px',
          paddingTop: '40px',
          borderTop: '1px solid #E5E7EB',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '24px',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🛡️</div>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
              100% Private
            </h3>
            <p style={{ fontSize: '13px', color: '#9CA3AF' }}>
              All processing happens locally on your device
            </p>
          </div>
          <div>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>⚡</div>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
              Fast & Lightweight
            </h3>
            <p style={{ fontSize: '13px', color: '#9CA3AF' }}>
              No network latency, works offline
            </p>
          </div>
          <div>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🎯</div>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', marginBottom: '4px' }}>
              Purpose-Built
            </h3>
            <p style={{ fontSize: '13px', color: '#9CA3AF' }}>
              Optimized for academic research
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
