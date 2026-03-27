import React, { useState } from 'react';
import { Finding } from '../types';

interface ScannerFindingsProps {
  findings: Finding[];
  onProceed: (updatedFindings: Finding[]) => void;
  onCancel: () => void;
  filename: string;
}

export const ScannerFindings: React.FC<ScannerFindingsProps> = ({ findings, onProceed, onCancel, filename }) => {
  const [updatedFindings, setUpdatedFindings] = useState<Finding[]>(findings);

  const criticalCount = findings.filter(f => f.severity === 'CRITICAL').length;
  const highCount = findings.filter(f => f.severity === 'HIGH').length;
  const mediumLowCount = findings.filter(f => f.severity === 'MEDIUM' || f.severity === 'LOW').length;
  const ignoredCount = updatedFindings.filter(f => f.ignored && (f.severity === 'MEDIUM' || f.severity === 'LOW')).length;

  const toggleIgnore = (id: string) => {
    setUpdatedFindings(prev =>
      prev.map(f =>
        f.id === id && (f.severity === 'MEDIUM' || f.severity === 'LOW')
          ? { ...f, ignored: !f.ignored }
          : f
      )
    );
  };

  const severityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return '#DC2626';
      case 'HIGH':
        return '#EA580C';
      case 'MEDIUM':
        return '#FBBF24';
      default:
        return '#9CA3AF';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          maxWidth: '600px',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: criticalCount > 0 ? '#FEE2E2' : '#FEF3C7',
          }}
        >
          <h2 style={{ margin: '0 0 8px 0', color: criticalCount > 0 ? '#DC2626' : '#EA580C' }}>
            {criticalCount > 0 ? '🚨' : '⚠'} {findings.length > 1 ? findings.length + ' findings' : '1 finding'} detected
          </h2>
          <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '14px' }}>
            in <strong>{filename}</strong>
          </p>
          <p style={{ margin: 0, color: '#666', fontSize: '13px' }}>
            These were found before any AI processed your file. Review before proceeding.
          </p>
        </div>

        {/* Findings List */}
        <div style={{ padding: '20px', maxHeight: 'calc(80vh - 200px)', overflow: 'auto' }}>
          {updatedFindings.map(finding => (
            <div
              key={finding.id}
              style={{
                marginBottom: '16px',
                padding: '12px',
                backgroundColor: '#F9FAFB',
                borderLeft: `4px solid ${severityColor(finding.severity)}`,
                borderRadius: '4px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        backgroundColor: severityColor(finding.severity),
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        borderRadius: '3px',
                      }}
                    >
                      {finding.severity}
                    </span>
                    <strong style={{ fontSize: '14px' }}>{finding.type}</strong>
                  </div>
                  <p style={{ margin: '4px 0', fontSize: '13px', color: '#666', fontFamily: 'monospace' }}>
                    Preview: <code style={{ backgroundColor: '#f0f0f0', padding: '2px 6px' }}>{finding.preview}</code>
                  </p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>
                    {finding.remediation}
                  </p>
                </div>

                {(finding.severity === 'MEDIUM' || finding.severity === 'LOW') && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', marginLeft: '12px' }}>
                    <input
                      type="checkbox"
                      checked={finding.ignored}
                      onChange={() => toggleIgnore(finding.id)}
                      style={{ cursor: 'pointer' }}
                    />
                    Ignore
                  </label>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div style={{ padding: '16px 20px', backgroundColor: '#F3F4F6', borderTop: '1px solid #e5e7eb' }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#555', lineHeight: '1.6' }}>
            <strong>{findings.length} finding(s)</strong> will be automatically redacted before the AI sees your document.
            {ignoredCount > 0 && ` ${ignoredCount} finding(s) marked as ignored will still be redacted.`}
          </p>
        </div>

        {/* CTA Buttons */}
        <div style={{ padding: '16px 20px', display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #e5e7eb' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              backgroundColor: 'white',
              color: '#374151',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Cancel — remove this document
          </button>
          <button
            onClick={() => onProceed(updatedFindings)}
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              backgroundColor: '#10B981',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              opacity: 1,
            }}
          >
            Proceed with redacted document
          </button>
        </div>
      </div>
    </div>
  );
};
