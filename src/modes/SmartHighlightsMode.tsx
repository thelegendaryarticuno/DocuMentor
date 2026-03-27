import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseDocument, chunkText, storeChunks, estimateTokens } from '../lib/documentParser';
import { useHighlightAnalysis, type AnalyzedChunk, type ImportanceLevel } from '../hooks/useHighlightAnalysis';
import { getHardwareAccelerationInfo } from '../runanywhere';

export const SmartHighlightsMode: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [parsedText, setParsedText] = useState<string>('');
  const [analyzedChunks, setAnalyzedChunks] = useState<AnalyzedChunk[]>([]);
  const [stage, setStage] = useState<'upload' | 'parsing' | 'analyzing' | 'preview'>('upload');
  const [error, setError] = useState<string | null>(null);
  const [gpuInfo, setGpuInfo] = useState(getHardwareAccelerationInfo());
  const [showPreview, setShowPreview] = useState(false);

  const { analyzeChunks, progress, isAnalyzing } = useHighlightAnalysis();

  const handleFileUpload = useCallback(async (uploadedFile: File) => {
    setFile(uploadedFile);
    setError(null);
    setStage('parsing');

    try {
      // Parse document
      const parsed = await parseDocument(uploadedFile);
      setParsedText(parsed.text);

      // Chunk text
      const chunks = chunkText(parsed.text, 800);
      
      // Store in session storage
      const docId = `doc_${Date.now()}`;
      storeChunks(docId, chunks);

      // Start analysis
      setStage('analyzing');
      const results = await analyzeChunks(chunks);
      setAnalyzedChunks(results);
      setStage('preview');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to process document';
      setError(errorMsg);
      setStage('upload');
    }
  }, [analyzeChunks]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileUpload(droppedFile);
    }
  }, [handleFileUpload]);

  const handleDownload = useCallback(() => {
    if (!analyzedChunks.length) return;

    // Create HTML with highlighted content
    const html = generateHighlightedHTML(analyzedChunks, file?.name || 'document');
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `highlighted_${file?.name || 'document'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [analyzedChunks, file]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)', padding: '32px' }}>
      {/* Header */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', marginBottom: '32px' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            color: 'var(--primary)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            marginBottom: '16px'
          }}
        >
          ← Back to Home
        </button>
        <h1 style={{ fontSize: '40px', fontWeight: 'bold', marginBottom: '8px' }}>
          Smart Highlights
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          AI-powered document analysis - highlights critical and important sections automatically
        </p>
        
        {/* GPU Info */}
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '14px',
          display: 'inline-block'
        }}>
          <span style={{ 
            fontWeight: '600',
            color: gpuInfo.isActive ? 'var(--green)' : '#F59E0B'
          }}>
            {gpuInfo.isActive ? '⚡ GPU Accelerated' : '💻 CPU Mode'}
          </span>
          <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>
            {gpuInfo.description}
          </span>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Upload Stage */}
        {stage === 'upload' && (
          <div
            style={{
              border: '4px dashed var(--border)',
              borderRadius: 'var(--radius)',
              padding: '64px',
              textAlign: 'center',
              backgroundColor: 'var(--bg-card)',
              cursor: 'pointer',
              transition: 'border-color 0.2s'
            }}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => document.getElementById('file-input')?.click()}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            <input
              id="file-input"
              type="file"
              accept=".pdf,.docx,.doc"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              style={{ display: 'none' }}
            />
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📄</div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
              Drop your document here
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
              or click to browse
            </p>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              Supports PDF and DOCX files (max 10MB)
            </p>
          </div>
        )}

        {/* Parsing Stage */}
        {stage === 'parsing' && (
          <div style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '48px',
            textAlign: 'center'
          }}>
            <LoadingAnimation stage="parsing" />
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
              Reading your document...
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Extracting text from {file?.name}
            </p>
          </div>
        )}

        {/* Analyzing Stage */}
        {stage === 'analyzing' && (
          <div style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '48px',
            textAlign: 'center'
          }}>
            <LoadingAnimation stage="analyzing" />
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
              AI is analyzing importance...
            </h2>
            {progress && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  width: '100%',
                  backgroundColor: 'var(--bg-input)',
                  borderRadius: '8px',
                  height: '16px',
                  marginBottom: '8px',
                  overflow: 'hidden'
                }}>
                  <div
                    style={{
                      width: `${progress.percentage}%`,
                      height: '100%',
                      background: 'linear-gradient(to right, var(--primary), #FF8844)',
                      transition: 'width 0.3s'
                    }}
                  />
                </div>
                <p style={{ color: 'var(--text-muted)' }}>
                  Processing chunk {progress.current} of {progress.total} ({progress.percentage}%)
                </p>
              </div>
            )}
            <AnimatedTips />
          </div>
        )}

        {/* Preview Stage */}
        {stage === 'preview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Action Buttons */}
            <div style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>
                  Analysis Complete! 🎉
                </h2>
                <p style={{ color: 'var(--text-muted)' }}>
                  Found {analyzedChunks.filter(c => c.importance === 'critical').length} critical and{' '}
                  {analyzedChunks.filter(c => c.importance === 'medium').length} important sections
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--primary-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--primary)';
                  }}
                >
                  {showPreview ? 'Hide Preview' : '👁️ View Preview'}
                </button>
                <button
                  onClick={handleDownload}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: 'var(--green)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                >
                  ⬇️ Download Highlighted
                </button>
              </div>
            </div>

            {/* Preview */}
            {showPreview && (
              <div style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '32px',
                maxHeight: '600px',
                overflowY: 'auto'
              }}>
                <div style={{
                  marginBottom: '24px',
                  display: 'flex',
                  gap: '16px',
                  fontSize: '14px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      backgroundColor: '#fee',
                      border: '2px solid #fcc',
                      borderRadius: '4px'
                    }}></div>
                    <span>Critical</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      backgroundColor: '#ffc',
                      border: '2px solid #fd7',
                      borderRadius: '4px'
                    }}></div>
                    <span>Important</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      backgroundColor: 'var(--bg-card)',
                      border: '2px solid var(--border)',
                      borderRadius: '4px'
                    }}></div>
                    <span>Normal</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {analyzedChunks.map((chunk, index) => (
                    <HighlightedChunk key={index} chunk={chunk} />
                  ))}
                </div>
              </div>
            )}

            {/* Start Over Button */}
            <button
              onClick={() => {
                setFile(null);
                setParsedText('');
                setAnalyzedChunks([]);
                setStage('upload');
                setShowPreview(false);
              }}
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: 'var(--bg-input)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-card)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-input)';
              }}
            >
              ← Analyze Another Document
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            marginTop: '16px',
            padding: '16px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--red)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--red)'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>
    </div>
  );
};

// Loading Animation Component
const LoadingAnimation: React.FC<{ stage: 'parsing' | 'analyzing' }> = ({ stage }) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '24px' }}>
      {stage === 'parsing' ? (
        <div style={{ position: 'relative', width: '96px', height: '96px' }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            border: '8px solid var(--bg-input)',
            borderRadius: '50%',
            animation: 'pulse 2s infinite'
          }}></div>
          <div style={{
            position: 'absolute',
            inset: 0,
            border: '8px solid transparent',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px'
          }}>
            📄
          </div>
        </div>
      ) : (
        <div style={{ position: 'relative', width: '96px', height: '96px' }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            border: '8px solid var(--bg-input)',
            borderRadius: '50%',
            animation: 'pulse 2s infinite'
          }}></div>
          <div style={{
            position: 'absolute',
            inset: 0,
            border: '8px solid transparent',
            borderTopColor: '#A855F7',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px'
          }}>
            🧠
          </div>
        </div>
      )}
    </div>
  );
};

// Animated Tips Component
const AnimatedTips: React.FC = () => {
  const tips = [
    '💡 Tip: Critical sections are marked in red',
    '💡 Tip: Important parts get yellow highlights',
    '💡 Tip: Using AI to understand context',
    '💡 Tip: Your GPU makes this super fast!',
    '💡 Tip: Almost there...',
  ];

  const [tipIndex, setTipIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      marginTop: '24px',
      fontSize: '14px',
      color: 'var(--text-muted)',
      fontStyle: 'italic',
      animation: 'fadeIn 0.5s'
    }}>
      {tips[tipIndex]}
    </div>
  );
};

// Highlighted Chunk Component
const HighlightedChunk: React.FC<{ chunk: AnalyzedChunk }> = ({ chunk }) => {
  const getStyles = () => {
    switch (chunk.importance) {
      case 'critical':
        return {
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderColor: 'var(--red)',
        };
      case 'medium':
        return {
          backgroundColor: 'rgba(251, 191, 36, 0.1)',
          borderColor: '#FBBF24',
        };
      default:
        return {
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border)',
        };
    }
  };

  const styles = getStyles();

  return (
    <div style={{
      padding: '16px',
      borderRadius: 'var(--radius-sm)',
      border: `2px solid ${styles.borderColor}`,
      backgroundColor: styles.backgroundColor,
      transition: 'all 0.2s'
    }}>
      <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{chunk.text}</p>
      {chunk.importance !== 'low' && (
        <div style={{
          marginTop: '8px',
          paddingTop: '8px',
          borderTop: '1px solid var(--border)',
          fontSize: '12px',
          color: 'var(--text-muted)',
          fontStyle: 'italic'
        }}>
          {chunk.importance === 'critical' ? '🔴' : '🟡'} {chunk.reason}
        </div>
      )}
    </div>
  );
};

// Generate HTML for download
function generateHighlightedHTML(chunks: AnalyzedChunk[], filename: string): string {
  const chunksHTML = chunks.map(chunk => {
    const bgColor = {
      critical: 'background-color: #fee; border: 2px solid #fcc;',
      medium: 'background-color: #ffc; border: 2px solid #fd7;',
      low: '',
    }[chunk.importance];

    return `
      <div style="padding: 16px; margin: 16px 0; border-radius: 8px; ${bgColor}">
        <p style="white-space: pre-wrap; line-height: 1.6;">${escapeHtml(chunk.text)}</p>
        ${chunk.importance !== 'low' ? `
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #ccc; font-size: 12px; color: #666; font-style: italic;">
            ${chunk.importance === 'critical' ? '🔴' : '🟡'} ${escapeHtml(chunk.reason)}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Highlighted: ${escapeHtml(filename)}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; background: #f5f5f5; }
    .legend { display: flex; gap: 16px; margin-bottom: 24px; font-size: 14px; }
    .legend-item { display: flex; align-items: center; gap: 8px; }
    .legend-box { width: 20px; height: 20px; border-radius: 4px; border: 2px solid; }
  </style>
</head>
<body>
  <h1>Highlighted Document: ${escapeHtml(filename)}</h1>
  <p style="color: #666; margin-bottom: 24px;">Generated by DocuMentor Smart Highlights</p>
  
  <div class="legend">
    <div class="legend-item">
      <div class="legend-box" style="background: #fee; border-color: #fcc;"></div>
      <span>Critical</span>
    </div>
    <div class="legend-item">
      <div class="legend-box" style="background: #ffc; border-color: #fd7;"></div>
      <span>Important</span>
    </div>
    <div class="legend-item">
      <div class="legend-box" style="background: white; border-color: #ccc;"></div>
      <span>Normal</span>
    </div>
  </div>
  
  ${chunksHTML}
</body>
</html>
  `;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
