import { Finding } from '../types';


// Patterns as per spec
const SCANNER_PATTERNS: Array<{
  type: string;
  regex: RegExp;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  remediation: string;
}> = [
  // CRITICAL
  {
    type: 'AWS Key',
    regex: /AKIA[0-9A-Z]{16}/g,
    severity: 'CRITICAL',
    remediation: 'Remove or rotate AWS secret keys.'
  },
  {
    type: 'Stripe Key',
    regex: /sk_live_[0-9a-zA-Z]{24}/g,
    severity: 'CRITICAL',
    remediation: 'Remove or rotate Stripe secret keys.'
  },
  {
    type: 'GitHub Token',
    regex: /ghp_[A-Za-z0-9]{36}/g,
    severity: 'CRITICAL',
    remediation: 'Remove or rotate GitHub tokens.'
  },
  {
    type: 'Private Key',
    regex: /-----BEGIN.*PRIVATE KEY-----/g,
    severity: 'CRITICAL',
    remediation: 'Remove private keys from documents.'
  },
  // HIGH
  {
    type: 'JWT',
    regex: /eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g,
    severity: 'HIGH',
    remediation: 'Do not share JWT tokens.'
  },
  {
    type: '.env Variable',
    regex: /^[A-Z_]+=.+$/gm,
    severity: 'HIGH',
    remediation: 'Remove or mask environment variables.'
  },
  {
    type: 'DB Connection String',
    regex: /(mongodb:\/\/|postgres:\/\/|mysql:\/\/)[^\s'"`]+/g,
    severity: 'HIGH',
    remediation: 'Remove or mask database connection strings.'
  },
  // MEDIUM
  {
    type: 'Email',
    regex: /[\w.-]+@[\w.-]+\.[A-Za-z]{2,}/g,
    severity: 'MEDIUM',
    remediation: 'Redact or anonymize email addresses.'
  },
  {
    type: 'Indian Phone',
    regex: /\b[6-9]\d{9}\b/g,
    severity: 'MEDIUM',
    remediation: 'Redact or anonymize Indian phone numbers.'
  }
];

export function scanChunk(text: string): Finding[] {
  const findings: Finding[] = [];
  for (const pattern of SCANNER_PATTERNS) {
    const matches = text.matchAll(pattern.regex);
    for (const match of matches) {
      findings.push({
        type: pattern.type,
        severity: pattern.severity as Finding['severity'],
        preview: match[0],
        remediation: pattern.remediation
      });
    }
  }
  return findings;
}


export function redactChunk(text: string, findings: Finding[]): string {
  let redacted = text;
  for (const f of findings) {
    if (f.severity === 'CRITICAL' || f.severity === 'HIGH') {
      const safe = f.preview.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      redacted = redacted.replace(new RegExp(safe, 'g'), `[REDACTED-${f.type.replace(/\s/g, '').toUpperCase()}]`);
    }
  }
  return redacted;
}
