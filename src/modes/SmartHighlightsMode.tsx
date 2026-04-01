import React, { useState, useCallback } from 'react';
import { parseDocument, chunkText, storeChunks } from '../lib/documentParser';
import { useHighlightAnalysis, type AnalyzedChunk } from '../hooks/useHighlightAnalysis';

interface FileRecord {
  id: string;
  name: string;
  size: number;
  chunks: string[];
  results: AnalyzedChunk[];
  timestamp: number;
}

export const SmartHighlightsMode: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<FileRecord | null>(null);
  const [fileHistory, setFileHistory] = useState<FileRecord[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'critical' | 'medium' | 'low'>('all');

  const { analyzeChunks, isAnalyzing } = useHighlightAnalysis();

  const handleFileUpload = useCallback(
    async (uploadedFile: File) => {
      setError(null);
      setIsUploading(true);

      try {
        // Parse document
        const parsed = await parseDocument(uploadedFile);

        // Chunk text
        const chunks = chunkText(parsed.text, 800);

        // Store in session storage
        const docId = `doc_${Date.now()}`;
        storeChunks(docId, chunks);

        // Start analysis
        const results = await analyzeChunks(chunks);

        const fileRecord: FileRecord = {
          id: docId,
          name: uploadedFile.name,
          size: uploadedFile.size,
          chunks,
          results,
          timestamp: Date.now(),
        };

        setSelectedFile(fileRecord);
        setFileHistory((prev) => [fileRecord, ...prev.slice(0, 9)]);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to process document';
        setError(errorMsg);
      } finally {
        setIsUploading(false);
      }
    },
    [analyzeChunks]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFileUpload(droppedFile);
      }
    },
    [handleFileUpload]
  );

  const handleExport = useCallback(() => {
    if (!selectedFile) return;

    const html = generateHighlightedHTML(selectedFile.results, selectedFile.name);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `highlighted_${selectedFile.name}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [selectedFile]);

  const filteredHighlights =
    selectedFile && filter !== 'all'
      ? selectedFile.results.filter((h) => h.importance === filter)
      : selectedFile?.results || [];

  const highlightCounts = selectedFile
    ? {
        critical: selectedFile.results.filter((h) => h.importance === 'critical').length,
        medium: selectedFile.results.filter((h) => h.importance === 'medium').length,
        low: selectedFile.results.filter((h) => h.importance === 'low').length,
      }
    : { critical: 0, medium: 0, low: 0 };

  const getFileTypeIcon = (filename: string): string => {
    const ext = filename.split('.').pop()?.toUpperCase() || 'FILE';
    return ext;
  };

  const getSeverityBadge = (chunks: AnalyzedChunk[]): 'critical' | 'medium' | 'low' | 'none' => {
    if (chunks.some((c) => c.importance === 'critical')) return 'critical';
    if (chunks.some((c) => c.importance === 'medium')) return 'medium';
    if (chunks.some((c) => c.importance === 'low')) return 'low';
    return 'none';
  };

  return (
    <div className="smart-highlights-layout">
      {/* LEFT PANEL: Upload & File History */}
      <div className="smart-highlights-left">
        {/* Drop Zone */}
        <div
          className="drop-zone-card"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <div className="drop-zone-icon-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M2 12h20" />
            </svg>
          </div>
          <div className="drop-zone-title">Drop your document here</div>
          <div className="drop-zone-subtitle">or click to browse files</div>
          <div className="drop-zone-formats">
            <div className="drop-zone-format-pill">PDF</div>
            <div className="drop-zone-format-pill">DOCX</div>
            <div className="drop-zone-format-pill">TXT</div>
          </div>
        </div>

        <input
          id="file-input"
          type="file"
          accept=".pdf,.docx,.doc,.txt"
          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
        />

        {/* Recent Files */}
        {fileHistory.length > 0 && (
          <>
            <div className="recent-files-label">Recent files</div>
            <div className="file-list">
              {fileHistory.map((file) => (
                <button
                  key={file.id}
                  className={`file-row ${selectedFile?.id === file.id ? 'active' : ''}`}
                  onClick={() => setSelectedFile(file)}
                >
                  <div className={`file-type-badge ${file.name.endsWith('.pdf') ? 'pdf' : 'doc'}`}>
                    {getFileTypeIcon(file.name)}
                  </div>
                  <div className="file-info">
                    <div className="file-name">{file.name}</div>
                    <div className="file-meta">
                      {(file.size / 1024 / 1024).toFixed(1)} MB · {file.results.length} highlights · Analyzed
                    </div>
                  </div>
                  <div className={`file-severity-badge ${getSeverityBadge(file.results)}`}>
                    {getSeverityBadge(file.results) === 'none'
                      ? 'None'
                      : (getSeverityBadge(file.results).charAt(0).toUpperCase() +
                          getSeverityBadge(file.results).slice(1))}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#FAECE7',
              border: '0.5px solid #D85A30',
              borderRadius: 'var(--r)',
              color: '#993C1D',
              fontSize: '12px',
            }}
          >
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      {/* RIGHT PANEL: Results */}
      <div className="smart-highlights-right">
        {selectedFile ? (
          <>
            {/* Header */}
            <div className="highlights-header">
              <div className="highlights-filename">{selectedFile.name}</div>
              <div className="highlights-subtitle">
                {highlightCounts.critical + highlightCounts.medium + highlightCounts.low} highlights found
              </div>

              {/* Filters */}
              <div className="highlights-filters">
                {(['all', 'critical', 'medium', 'low'] as const).map((f) => (
                  <button
                    key={f}
                    className={`filter-button ${filter === f ? 'active' : ''}`}
                    onClick={() => setFilter(f)}
                  >
                    {f === 'all'
                      ? 'All'
                      : f === 'critical'
                        ? `Critical (${highlightCounts.critical})`
                        : f === 'medium'
                          ? `Medium (${highlightCounts.medium})`
                          : `Low (${highlightCounts.low})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Highlights List */}
            <div className="highlights-list">
              {isAnalyzing && (
                <div
                  style={{
                    padding: '24px',
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <div style={{ fontSize: '14px', marginBottom: '8px' }}>Analyzing...</div>
                </div>
              )}
              {!isAnalyzing && filteredHighlights.length === 0 ? (
                <div
                  style={{
                    padding: '24px',
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                    fontSize: '12px',
                  }}
                >
                  No highlights found
                </div>
              ) : (
                filteredHighlights.map((highlight, index) => (
                  <div key={index} className={`highlight-card ${highlight.importance}`}>
                    <div className="highlight-header">
                      <span className={`highlight-severity ${highlight.importance}`}>
                        {highlight.importance.charAt(0).toUpperCase() + highlight.importance.slice(1)}
                      </span>
                      <div className="highlight-page">p. {Math.ceil((highlight.chunkIndex + 1) / 2)}</div>
                    </div>
                    <div className="highlight-quote">{highlight.text.slice(0, 150)}...</div>
                    <div className="highlight-reason">{highlight.reason}</div>
                  </div>
                ))
              )}
            </div>

            {/* Export Bar */}
            <div className="highlights-export">
              <button className="export-button" onClick={handleExport} disabled={isAnalyzing || isUploading}>
                Export highlights as PDF ↗
              </button>
            </div>
          </>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              textAlign: 'center',
              padding: '20px',
            }}
          >
            Select a file to view highlights
          </div>
        )}
      </div>
    </div>
  );
};

function generateHighlightedHTML(chunks: AnalyzedChunk[], filename: string): string {
  const chunksHTML = chunks
    .map((chunk) => {
      const bgColor = {
        critical: 'background-color: #FAECE7; border: 2px solid #D85A30;',
        medium: 'background-color: #FAEEDA; border: 2px solid #EF9F27;',
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
    })
    .join('');

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
      <div class="legend-box" style="background: #FAECE7; border-color: #D85A30;"></div>
      <span>Critical</span>
    </div>
    <div class="legend-item">
      <div class="legend-box" style="background: #FAEEDA; border-color: #EF9F27;"></div>
      <span>Medium</span>
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
