# 최종 QA 리뷰 보고서

## 정합성 검증

### 전략 ↔ 테스트 정합성

| 전략 항목                | 실행 여부 | 비고                                                      |
| ------------------------ | --------- | --------------------------------------------------------- |
| P0: auth 모듈 테스트     | **완료**  | service + routes 100%                                     |
| P0: projects 모듈 테스트 | **부분**  | service(68%), routes(59%), repository(0.54%)              |
| P0: sessions 모듈 테스트 | **부분**  | service(37%), routes(49%), repository(0%)                 |
| P0: plugins 테스트       | **부분**  | auth(72%), cors(100%), error-handler(100%), auto-sync(0%) |
| P1: conflicts 서비스     | **완료**  | service 100%, routes 51%                                  |
| P1: search               | **부분**  | routes(74%), service(1.3%)                                |
| P1: quota                | **완료**  | service(97%), repository(100%)                            |
| 통합 테스트 인프라       | **완료**  | createTestApp + authHelper 생성                           |
| CI 설계                  | 전략서만  | 미구현 (GitHub Actions 설정 미변경)                       |

### 테스트 ↔ 커버리지 정합성

- 단위 테스트: 서비스 함수 대상 ✅
- 통합 테스트: routes 함수 대상 ✅
- **Repository 테스트**: 갭 큼 — Kysely 모킹 복잡성으로 제한적
- **커버리지 제외 설정**: 미적용 (seed, scripts 제외 필요)

## 테스트 품질 평가

### 강점

1. **일관된 패턴**: 모든 테스트가 AAA 패턴, vi.mock/vi.clearAllMocks 사용
2. **통합 테스트 인프라**: createTestApp으로 실제 Fastify 플러그인 체인 테스트 가능
3. **경계값 테스트**: auth routes에서 빈 값, 초과 길이, 만료 토큰, 잘못된 토큰 등 다양한 엣지 케이스
4. **기존 테스트와의 일관성**: 프로젝트 기존 패턴을 잘 따름

### 개선 필요 사항

#### 🔴 필수 수정

1. **Zod 에러 핸들링**: routes에서 `schema.parse()` 실패 시 500 반환됨. `ZodError`를 `AppError(400)`으로 변환하는 처리 필요
   - 위치: `src/plugins/error-handler.plugin.ts`
   - 영향: 모든 입력 검증 실패가 500 대신 400 반환하게 됨

#### 🟡 권장 개선

2. **vitest.config.ts 커버리지 제외**: seed, scripts, types 파일 제외 설정 추가
   ```ts
   coverage: {
     exclude: [
       'src/database/seed*.ts',
       'src/database/seed-marketing/**',
       'src/scripts/**',
       'src/database/types.ts',
     ];
   }
   ```
3. **Repository 테스트 전략**: Kysely 수동 모킹 대신 테스트 DB(Testcontainers/SQLite)로 전환 검토
4. **Web 커버리지 측정**: web 패키지의 전체 커버리지 수치 확인 필요

## 최종 수치 요약

| 항목             | 값                              |
| ---------------- | ------------------------------- |
| API 테스트 파일  | 46개 (+12개 신규)               |
| API 총 테스트    | 534개 (+58개 신규)              |
| Web 테스트 파일  | 60개                            |
| Web 총 테스트    | 403개 (실패 0건, 이전 1건 수정) |
| Shared 테스트    | 7개 파일, 100% 커버리지         |
| E2E 테스트       | 37개 spec 파일                  |
| **API 커버리지** | **16.52% → 26.01%**             |
| 목표 커버리지    | 80%                             |

## 다음 단계 권장

1. **즉시**: Zod 에러 핸들링 수정 (error-handler.plugin.ts)
2. **단기**: 커버리지 제외 설정 → 실질 커버리지 35-40%
3. **중기**: Phase 1 로드맵 실행 (sessions/projects repository + service 보강) → 50-60%
4. **장기**: ai-evaluation, prd-analysis, supabase-onboarding 테스트 → 80%
