export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface Finding {
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  preview: string;
  remediation: string;
}
