import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

const PLANS_DIR = join(homedir(), '.claude', 'plans');

const PLAN_FILES: ReadonlyArray<{ filename: string; content: string }> = [
  {
    filename: 'authentication-v2.md',
    content: `# Authentication V2 — Refresh Token Architecture

## Overview
Upgrade the JWT authentication system to support refresh token rotation
with token family tracking for reuse detection.

## Phase 1: Token Rotation
- [x] Database migration for refresh_tokens table
- [x] Generate token family ID on first login
- [ ] Implement refresh token endpoint
- [ ] Add token family tracking
- [ ] One-time use enforcement

## Phase 2: Security Hardening
- [ ] Rate limiting per user/IP (10 req/min)
- [ ] Token revocation on password change
- [ ] Automatic cleanup of expired token families
- [ ] Audit log for token events

## Phase 3: Frontend Integration
- [x] Axios interceptor for 401 → refresh flow
- [ ] Silent refresh before token expiry
- [ ] Logout clears all tokens in family
- [ ] Session persistence across tabs

## Technical Notes

\`\`\`typescript
interface RefreshToken {
  readonly id: string;
  readonly userId: string;
  readonly familyId: string;
  readonly used: boolean;
  readonly expiresAt: Date;
  readonly createdAt: Date;
}
\`\`\`

Token rotation flow:
1. Client sends expired access token
2. Server validates refresh token (single-use check)
3. If valid: issue new access + refresh pair
4. If reused: revoke entire token family (breach detected)

## Dependencies
- \`@fastify/jwt\` 9.x
- \`@fastify/rate-limit\` 10.x
`,
  },
  {
    filename: 'conflict-detection-improvements.md',
    content: `# Conflict Detection Improvements

## Problem
Current conflict detection only checks file path overlap.
We need smarter detection that considers modification scope and timing.

## Proposed Architecture

\`\`\`
Session A ─┐                   ┌─ Critical: same function
           ├─ Overlap Analyzer ├─ Warning: same file
Session B ─┘                   └─ Info: same module
                                      │
                                      ▼
                               Auto-Resolve Engine
                                      │
                              ┌───────┴───────┐
                              │ Stale (>7d)?  │
                              │ → Auto-dismiss │
                              └───────────────┘
\`\`\`

## Tasks

### Phase 1: Auto-Resolve
- [ ] Define staleness threshold (configurable, default 7 days)
- [ ] Cron job to scan and dismiss stale conflicts
- [ ] Notification before auto-dismiss (24h warning)
- [ ] Audit trail for auto-dismissed conflicts

### Phase 2: Smarter Detection
- [ ] AST-level overlap detection (TypeScript)
- [ ] Git blame integration for ownership context
- [ ] Confidence scoring for overlap severity

### Phase 3: Real-time Notifications
- [ ] WebSocket channel for conflict events
- [ ] Browser push notifications (opt-in)
- [ ] Slack thread replies for conflict updates

## Metrics
- False positive rate target: <15%
- Detection latency target: <2 seconds
- Auto-resolve coverage target: 30% of info-level conflicts
`,
  },
  {
    filename: 'design-system-migration.md',
    content: `# Design System — CSS Token Migration Guide

## Goal
Migrate from hardcoded color values to semantic CSS custom properties
for consistent theming across dark and light modes.

## Token Categories

### Color Tokens
- [x] Background: page, surface, surface-hover
- [x] Text: primary, secondary, tertiary, muted
- [x] Border: default, hover, focus
- [x] Accent: primary, success, warning, critical
- [ ] Interactive: btn-primary, btn-secondary, btn-danger

### Spacing Tokens
- [x] Base scale: 4px increments (4, 8, 12, 16, 24, 32)
- [x] Component padding: sm(8), md(12), lg(16)
- [ ] Layout gaps: section(32), page(48)

### Typography Tokens
- [x] Font families: mono (JetBrains Mono), sans (Inter)
- [x] Size scale: xs(11), sm(13), base(14), lg(16), xl(20)
- [ ] Line height scale: tight(1.25), normal(1.5), relaxed(1.75)

## Migration Checklist

### Components (19 total)
- [x] Button — 4 variants migrated
- [x] Card — padding + border tokens
- [x] Badge — semantic color mapping
- [x] Input — focus ring + border tokens
- [x] Modal — backdrop + surface tokens
- [x] Tooltip — inverted color scheme
- [x] Avatar — fallback bg token
- [ ] Select — dropdown surface token
- [ ] ProgressBar — track + fill tokens
- [ ] Skeleton — shimmer animation token

## Testing
- [ ] Visual regression tests (Chromatic)
- [ ] Accessibility contrast audit (axe-core)
- [ ] Dark ↔ Light transition smoothness
`,
  },
];

export async function seedPlans() {
  await mkdir(PLANS_DIR, { recursive: true });

  for (const plan of PLAN_FILES) {
    const filepath = join(PLANS_DIR, plan.filename);
    await writeFile(filepath, plan.content, 'utf-8');
  }
}
