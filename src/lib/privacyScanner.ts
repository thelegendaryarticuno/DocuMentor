import { Finding, ScanResult } from '../types';

const PATTERNS = [
  // CRITICAL
  {
    type: 'AWS Access Key',
    regex: /AKIA[0-9A-Z]{16}/g,
    severity: 'CRITICAL' as const,
    remediation: 'Rotate key immediately in AWS IAM console',
  },
  {
    type: 'Stripe Secret Key',
    regex: /sk_live_[0-9a-zA-Z]{24,}/g,
    severity: 'CRITICAL' as const,
    remediation: 'Rotate in Stripe Dashboard immediately',
  },
  {
    type: 'GitHub Token',
    regex: /ghp_[A-Za-z0-9]{36}/g,
    severity: 'CRITICAL' as const,
    remediation: 'Revoke in GitHub Settings > Developer tokens',
  },
  {
    type: 'GitHub OAuth',
    regex: /gho_[A-Za-z0-9]{36}/g,
    severity: 'CRITICAL' as const,
    remediation: 'Revoke in GitHub OAuth Apps settings',
  },
  {
    type: 'Private Key Header',
    regex: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
    severity: 'CRITICAL' as const,
    remediation: 'Never store private keys in documents',
  },
  // HIGH
  {
    type: 'Stripe Test Key',
    regex: /sk_test_[0-9a-zA-Z]{24,}/g,
    severity: 'HIGH' as const,
    remediation: 'Do not expose test keys in documents',
  },
  {
    type: 'JWT Token',
    regex: /eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]*/g,
    severity: 'HIGH' as const,
    remediation: 'Invalidate token. Check expiry and claims.',
  },
  {
    type: '.env variable',
    regex: /^[A-Z][A-Z0-9_]{2,}=.+$/gm,
    severity: 'HIGH' as const,
    remediation: 'Move secrets to a secrets manager',
  },
  {
    type: 'MongoDB URI',
    regex: /mongodb(\+srv)?:\/\/.+:.+@/g,
    severity: 'HIGH' as const,
    remediation: 'Rotate DB credentials. Use env vars.',
  },
  {
    type: 'Postgres URI',
    regex: /postgres(ql)?:\/\/.+:.+@/g,
    severity: 'HIGH' as const,
    remediation: 'Rotate DB credentials. Use env vars.',
  },
  {
    type: 'MySQL URI',
    regex: /mysql:\/\/.+:.+@/g,
    severity: 'HIGH' as const,
    remediation: 'Rotate DB credentials. Use env vars.',
  },
  // MEDIUM
  {
    type: 'Email Address',
    regex: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
    severity: 'MEDIUM' as const,
    remediation: 'Verify intentional inclusion of PII',
  },
  {
    type: 'Indian Phone Number',
    regex: /(?<!\d)[6-9]\d{9}(?!\d)/g,
    severity: 'MEDIUM' as const,
    remediation: 'Verify intentional inclusion of personal data',
  },
  // LOW
  {
    type: 'IP Address',
    regex: /\b(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g,
    severity: 'LOW' as const,
    remediation: 'Check if internal IP should be in document',
  },
];

export function scanChunk(text: string): Finding[] {
  const findings: Finding[] = [];

  for (const pattern of PATTERNS) {
    let match;
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    while ((match = regex.exec(text)) !== null) {
      const preview = match[0].substring(0, 4) + '****';
      findings.push({
        id: Math.random().toString(36).substr(2, 9),
        type: pattern.type,
        severity: pattern.severity,
        match: match[0],
        preview,
        remediation: pattern.remediation,
        ignored: false,
      });
    }
  }

  return findings;
}

export function redactChunk(text: string, findings: Finding[]): string {
  let redacted = text;

  // Always redact CRITICAL and HIGH
  for (const finding of findings.filter(f => f.severity === 'CRITICAL' || f.severity === 'HIGH')) {
    const escaped = finding.match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    redacted = redacted.replace(new RegExp(escaped, 'g'), `[REDACTED-${finding.type.replace(/\s/g, '-').toUpperCase()}]`);
  }

  // Redact MEDIUM/LOW only if not ignored
  for (const finding of findings.filter(f => (f.severity === 'MEDIUM' || f.severity === 'LOW') && !f.ignored)) {
    const escaped = finding.match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    redacted = redacted.replace(new RegExp(escaped, 'g'), `[REDACTED-${finding.type.replace(/\s/g, '-').toUpperCase()}]`);
  }

  return redacted;
}

export function scanAndRedact(text: string): ScanResult {
  const findings = scanChunk(text);
  const hasBlockingFindings = findings.some(f => (f.severity === 'CRITICAL' || f.severity === 'HIGH'));
  const redactedText = redactChunk(text, findings);

  return { findings, redactedText, hasBlockingFindings };
}

export function scanAllChunks(chunks: string[]): ScanResult {
  const allFindings: Finding[] = [];
  const redactedChunks: string[] = [];

  for (const chunk of chunks) {
    const chunkFindings = scanChunk(chunk);
    const redacted = redactChunk(chunk, chunkFindings);
    allFindings.push(...chunkFindings);
    redactedChunks.push(redacted);
  }

  const hasBlockingFindings = allFindings.some(f => f.severity === 'CRITICAL' || f.severity === 'HIGH');
  return {
    findings: allFindings,
    redactedText: redactedChunks.join('\n\n'),
    hasBlockingFindings,
  };
}
