export interface Finding {
  id: string;
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  match: string;
  preview: string;
  remediation: string;
  ignored: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ScanResult {
  findings: Finding[];
  redactedText: string;
  hasBlockingFindings: boolean;
}

export function createMessage(role: 'user' | 'assistant', content: string): Message {
  return {
    id: Math.random().toString(36).substr(2, 9),
    role,
    content,
    timestamp: Date.now(),
  };
}
