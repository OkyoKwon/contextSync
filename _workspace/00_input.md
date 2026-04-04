# 테스트 자동화 입력 정리

## 대상 코드

- **전체 코드베이스**: ContextSync monorepo (apps/api, apps/web, packages/shared)

## 기술 스택

- **Backend**: Fastify 5, Kysely 0.27, PostgreSQL 16, TypeScript 5.7
- **Frontend**: React 19, Vite 6, Tailwind CSS 4, Zustand 5, React Query 5
- **Test Framework**: Vitest 3, Testing Library
- **Build**: pnpm workspaces + Turborepo
- **E2E**: Playwright (37 spec files in e2e/)

## 현재 커버리지 현황

| 패키지               | Stmts                               | Branch | Funcs | Lines  |
| -------------------- | ----------------------------------- | ------ | ----- | ------ |
| @context-sync/api    | 16.52%                              | 81.58% | 38.5% | 16.52% |
| @context-sync/shared | 100%                                | 100%   | 100%  | 100%   |
| @context-sync/web    | 테스트 1건 실패 (use-ai-evaluation) |

### API 모듈별 커버리지

| 모듈          | Stmts  | Branch | Funcs  |
| ------------- | ------ | ------ | ------ |
| config        | 69.38% | 62.5%  | 50%    |
| database      | 8.04%  | 75%    | 50%    |
| lib           | 68.24% | 93.33% | 66.66% |
| modules/admin | 18.36% | 88.88% | 40%    |
| modules/auth  | 7.93%  | 100%   | 8.33%  |
| modules/plans | 38.13% | 82.14% | 75%    |
| modules/quota | 4.42%  | 50%    | 10%    |
| modules/setup | 4.31%  | 100%   | 20%    |
| plugins       | 21.32% | 71.42% | 62.5%  |
| scripts       | 0%     | 0%     | 0%     |

### 커버리지에 안 잡히는 모듈 (테스트 있지만 routes/repository 미커버)

- sessions, projects, activity, ai-evaluation, conflicts, local-sessions, notifications, prd-analysis, search, supabase-onboarding

## 기존 테스트 현황

- **API**: 34개 테스트 파일, 주로 service/schema 테스트 (routes/repository 미커버)
- **Web**: 60개 테스트 파일 (hooks, stores, api client, UI components)
- **Shared**: 7개 테스트 파일 (validators, constants)
- **E2E**: 37개 spec 파일 (Playwright)

## 실패 중인 테스트

- `apps/web/src/hooks/__tests__/use-ai-evaluation.test.ts` — `overallScore` 필드 undefined (API 응답 구조 변경 추정)

## 제약 조건

- 커버리지 목표: 80%
- 기존 Vitest 설정 유지
- 모듈 패턴: routes → service → repository (4-file structure)

## 실행 모드

- **풀 파이프라인**: strategist → unit-tester + integration-tester (병렬) → coverage-analyst → qa-reviewer
