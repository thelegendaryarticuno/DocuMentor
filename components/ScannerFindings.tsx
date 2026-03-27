import React from 'react';
import { Finding } from '../types';

interface ScannerFindingsProps {
  findings: Finding[];
  onAcknowledge: () => void;
}

export const ScannerFindings: React.FC<ScannerFindingsProps> = ({ findings, onAcknowledge }) => {
  const criticalOrHigh = findings.filter(f => f.severity === 'CRITICAL' || f.severity === 'HIGH');
  if (criticalOrHigh.length === 0) return null;
  return (
    <div className="scanner-findings-modal">
      <div className="scanner-findings-content">
        <h2>Privacy Risks Detected</h2>
        <ul>
          {criticalOrHigh.map((f, i) => (
            <li key={i}>
              <strong>{f.type}</strong> ({f.severity}): <span className="preview">{f.preview}</span>
              <div className="remediation">{f.remediation}</div>
            </li>
          ))}
        </ul>
        <button onClick={onAcknowledge}>Acknowledge & Continue</button>
      </div>
    </div>
  );
};
