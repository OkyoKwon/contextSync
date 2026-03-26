# Demo Data Plan — Crypto-Talk 프로젝트

## 목적

Crypto-Talk 팀 프로젝트의 대시보드와 Conversations 화면이 풍부하고 현실적으로 보이도록 **기존 데이터를 보강**하고 부족한 영역에 **신규 데이터를 삽입**한다.

## 대상 환경

| 항목         | 값                                                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------------------------------- |
| 프로젝트     | Crypto-Talk (`c200458d-f89d-49d7-aa7f-0b1c62fa4e0e`)                                                                |
| Owner        | Okyo (`48e7aff0-d0e1-42b5-84e4-04262f1dfd91`)                                                                       |
| Collaborator | kn.kim (`fa7d47b5-ab74-4cef-9425-ca4eab222687`)                                                                     |
| DB URL       | `postgresql://postgres.eymyqatmehtnrmnfjptj:rnjsdhr23%40%23@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres` |
| DB Mode      | `remote`                                                                                                            |
| Join Code    | `P389XG`                                                                                                            |

---

## 현재 데이터 현황

| 항목             | 현재 상태                                      | 문제점                                     |
| ---------------- | ---------------------------------------------- | ------------------------------------------ |
| **사용자**       | 3명 (Okyo, Kim, kn.kim)                        | Kim은 사용 안 함 — Okyo, kn.kim 2명만 활용 |
| **세션**         | 22건, 전부 completed/claude_code               | 상태·소스·날짜 다양성 없음                 |
| **메시지**       | 1,783건 (최대 478건/세션)                      | 충분 — 추가 불필요                         |
| **태그**         | 0건 (전체 세션 태그 없음)                      | 대시보드 필터·분류 기능이 빈약             |
| **브랜치**       | main, feedback만 존재                          | feature branch 다양성 없음                 |
| **날짜 분포**    | 전부 2026-03-26 (동일 시간대)                  | 타임라인·히스토리 보기가 무의미            |
| **충돌**         | 40건 (36 info + 4 warning, 전부 file/detected) | 타입·상태 다양성 없음                      |
| **Activity Log** | 24건 (22 session_created + 2기타)              | 액션 종류 단조로움                         |
| **AI 평가**      | 0건                                            | 평가 화면 빈 상태                          |
| **PRD 문서**     | 0건                                            | PRD 분석 화면 빈 상태                      |

---

## 교차검수 결과

DB 스키마·상수·시드 패턴을 검증하여 발견된 이슈 및 반영사항:

| #   | 항목                            | 이슈                                                                                                                    | 조치                                                                                                                                                |
| --- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Phase 번호                      | Phase 1→2→4→5→6→7 로 3 누락, 서브섹션 2-1~2-5 잔존                                                                      | Phase 1~6 재정렬, 서브섹션 1-1~1-5로 수정                                                                                                           |
| 2   | Activity Log 액션명             | `member_joined`, `prd_uploaded`, `evaluation_triggered`, `project_updated`, `session_archived` 가 실제 앱 코드와 불일치 | `collaborator_joined`, `prd_analyzed`, `evaluation_completed`(트리거+완료 통합), `project_updated`(유지), `session_completed`(archived 대체)로 수정 |
| 3   | Activity Log entity_type        | 기획에 entity_type 미기재                                                                                               | `session`, `conflict`, `prd_document`, `ai_evaluation`, `project` 명시                                                                              |
| 4   | AI Evaluation 필수 필드 누락    | `date_range_start/end`, `model_used`, `input/output_tokens_used`, 개별 점수 필드 미기재                                 | 필수 필드 전체 추가                                                                                                                                 |
| 5   | 최종 세션 수 계산 오류          | "active 4, completed 22" → completed는 17(기존) + 7(신규) = 24                                                          | "active 4, completed 24, archived 2" 로 수정                                                                                                        |
| 6   | Activity Log member_joined 대상 | "Kim, kn.kim" 기재 — Kim은 제외 대상                                                                                    | "Okyo, kn.kim" 으로 수정                                                                                                                            |
| 7   | 롤백 SQL PRD marker             | `model_used = 'demo-seed'` 와 실제 삽입값 `claude-sonnet-4-20250514` 불일치                                             | metadata 기반 마커 통일 또는 별도 marker 컬럼 사용                                                                                                  |
| 8   | Conflict #4 검증                | `session_a_id = session_b_id` CHECK 위반 가능성                                                                         | 둘 다 kn.kim 소유이나 서로 다른 세션이므로 OK — 확인 완료                                                                                           |
| 9   | search_vector 트리거            | sessions/messages 에 tsvector 자동 업데이트 트리거 존재                                                                 | INSERT/UPDATE 시 자동 발동 — 별도 처리 불필요                                                                                                       |

---

## 작업 계획

### Phase 1: 기존 세션 보강 (UPDATE)

기존 22건 세션에 **날짜 분산, 상태 다양화, 태그, 브랜치**를 부여한다. 메시지는 이미 풍부하므로 추가 삽입 불필요.

#### 1-1. 날짜 분산 (created_at UPDATE)

22건을 최근 4일(2026-03-23 ~ 2026-03-26)에 걸쳐 하루 5~6건씩 분산 배치한다.

| 날짜          | 세션 수 | 배치 기준             |
| ------------- | ------- | --------------------- |
| 03-23 (Day 1) | 6건     | 초기 기획/세팅 세션   |
| 03-24 (Day 2) | 6건     | 핵심 개발/디버깅 세션 |
| 03-25 (Day 3) | 5건     | 기능 구현/테스트 세션 |
| 03-26 (Day 4) | 5건     | 최신 개발/배포 세션   |

구체적 매핑:

| #   | 세션 제목 (축약)                  | 새 날짜 | 시간  |
| --- | --------------------------------- | ------- | ----- |
| 1   | 해당 기획 교차검수… botUserName   | 03-23   | 09:30 |
| 2   | 해당 기획 교차검수… 구현계획 추가 | 03-23   | 11:15 |
| 3   | task-notification Read output…    | 03-23   | 13:40 |
| 4   | 메인 브랜치로 바꿔주고 pull       | 03-23   | 15:00 |
| 5   | 버그 발생 문제원인 분석           | 03-23   | 16:20 |
| 6   | Untitled Session                  | 03-23   | 17:45 |
| 7   | 주문확인 메시지 포맷 개선안       | 03-24   | 09:00 |
| 8   | Sol 주문 취소 문제원인            | 03-24   | 10:30 |
| 9   | E2E 테스트 구현 계획안            | 03-24   | 12:00 |
| 10  | 사용성 문제점 분석                | 03-24   | 14:15 |
| 11  | stop dca 멈추지 않아              | 03-24   | 15:45 |
| 12  | 포트폴리오 페이지 정보/기능       | 03-24   | 17:00 |
| 13  | 기획안 submission_plan.md         | 03-25   | 09:30 |
| 14  | DCA 주문 실패 분석                | 03-25   | 11:00 |
| 15  | 해당 기획 문서대로 수정/구현      | 03-25   | 13:30 |
| 16  | 해당 기획 파일 교차검수           | 03-25   | 15:00 |
| 17  | USDT 남기고 매도                  | 03-25   | 16:30 |
| 18  | "아까 산 거 다시 팔아줘"          | 03-26   | 09:00 |
| 19  | 비트코인 전량 → 이더리움          | 03-26   | 10:45 |
| 20  | 비트코인 0.1개 구매 에러          | 03-26   | 13:00 |
| 21  | sonnet 사용 설정                  | 03-26   | 15:20 |
| 22  | 랜딩페이지/포트폴리오 배포 구성   | 03-26   | 17:00 |

#### 1-2. 상태 다양화 (status UPDATE)

| 상태          | 건수 | 대상 세션                                                         |
| ------------- | ---- | ----------------------------------------------------------------- |
| **active**    | 3건  | #22 (랜딩페이지 배포), #21 (sonnet 설정), #18 (아까 산 거 팔아줘) |
| **completed** | 17건 | 나머지                                                            |
| **archived**  | 2건  | #1 (botUserName 기획 — 03-23), #4 (메인 브랜치 pull — 03-23)      |

#### 1-3. 태그 부여 (tags UPDATE)

전체 22건에 주제 기반 태그 부여:

| 세션 (축약)              | 태그                                         |
| ------------------------ | -------------------------------------------- |
| botUserName 기획         | `planning`, `telegram-bot`, `cross-review`   |
| 기획 교차검수 구현계획   | `planning`, `implementation`, `cross-review` |
| task-notification output | `automation`, `ci`                           |
| 메인 브랜치 pull         | `git`, `branch-management`                   |
| 버그 문제원인 분석       | `debugging`, `bug-fix`                       |
| Untitled Session         | `misc`                                       |
| 주문확인 메시지 포맷     | `UX`, `message-format`, `trading`            |
| Sol 주문 취소            | `debugging`, `order`, `solana`               |
| E2E 테스트 계획          | `testing`, `e2e`, `planning`                 |
| 사용성 문제점 분석       | `UX`, `analysis`, `usability`                |
| stop dca 멈추지 않아     | `debugging`, `DCA`, `bug-fix`                |
| 포트폴리오 정보/기능     | `portfolio`, `feature-review`                |
| submission_plan.md 기획  | `planning`, `submission`                     |
| DCA 주문 실패            | `debugging`, `DCA`, `order`                  |
| 기획 문서대로 수정/구현  | `implementation`, `cross-review`             |
| 기획 파일 교차검수       | `planning`, `cross-review`                   |
| USDT 남기고 매도         | `trading`, `order-logic`, `USDT`             |
| 아까 산 거 다시 팔아줘   | `trading`, `context-memory`, `UX`            |
| 비트코인 → 이더리움      | `trading`, `multi-exchange`, `swap`          |
| 비트코인 0.1개 구매 에러 | `debugging`, `order`, `bitcoin`              |
| sonnet 사용 설정         | `config`, `model-setting`                    |
| 랜딩페이지 배포 구성     | `deployment`, `landing-page`, `portfolio`    |

#### 1-4. 브랜치 다양화 (branch UPDATE)

| 세션 (축약)          | 새 브랜치                    |
| -------------------- | ---------------------------- |
| 주문확인 메시지 포맷 | `feat/order-message-format`  |
| E2E 테스트 계획      | `test/e2e-scenarios`         |
| DCA 주문 실패        | `fix/dca-order-failure`      |
| 아까 산 거 팔아줘    | `feat/context-aware-trading` |
| 비트코인→이더리움    | `feat/multi-exchange-swap`   |
| 비트코인 0.1개 에러  | `fix/btc-purchase-error`     |
| sonnet 사용 설정     | `chore/model-config`         |
| 랜딩페이지 배포      | `feat/landing-deploy`        |

> 나머지는 `main` 유지 (기획/분석 성격 세션)

#### 1-5. 소스 다양화 (source UPDATE)

| 소스        | 건수 | 대상                                                                            |
| ----------- | ---- | ------------------------------------------------------------------------------- |
| claude_code | 16건 | 기존 유지 (대부분)                                                              |
| claude_ai   | 4건  | 기획/분석 성격: botUserName 기획, 사용성 분석, 포트폴리오 기능, submission_plan |
| manual      | 2건  | 메인 브랜치 pull, Untitled Session                                              |

---

### Phase 2: 신규 세션 추가 — 8건

kn.kim 사용자의 세션을 추가하여 **팀 협업** 모습을 보여준다. (kn.kim은 기존 5건 보유 → 총 13건) 각 세션에 6~10개 메시지 포함.

| #   | 제목                              | 사용자 | 상태      | 소스        | 브랜치                      | 태그                                      | 날짜  | 시간  | 메시지 수 |
| --- | --------------------------------- | ------ | --------- | ----------- | --------------------------- | ----------------------------------------- | ----- | ----- | --------- |
| 1   | Telegram Bot 커맨드 파서 리팩토링 | kn.kim | completed | claude_code | refactor/bot-command-parser | `refactor`, `telegram-bot`, `parser`      | 03-23 | 10:00 | 8         |
| 2   | 거래소 API 에러 핸들링 통합       | kn.kim | completed | claude_code | feat/exchange-error-handler | `error-handling`, `api`, `multi-exchange` | 03-23 | 14:30 | 10        |
| 3   | 포트폴리오 수익률 차트 구현       | kn.kim | completed | claude_ai   | feat/profit-chart           | `chart`, `portfolio`, `frontend`          | 03-24 | 11:00 | 8         |
| 4   | WebSocket 연결 안정성 개선        | kn.kim | active    | claude_code | fix/ws-stability            | `websocket`, `stability`, `bug-fix`       | 03-26 | 14:00 | 6         |
| 5   | 주문 실행 로그 대시보드           | kn.kim | completed | claude_code | feat/order-log-dashboard    | `dashboard`, `logging`, `trading`         | 03-24 | 16:00 | 10        |
| 6   | DCA 스케줄러 cron 설정 검토       | kn.kim | completed | claude_code | review/dca-scheduler        | `DCA`, `scheduler`, `review`              | 03-25 | 10:00 | 6         |
| 7   | Binance/Upbit 가격 차이 알림      | kn.kim | completed | claude_ai   | feat/price-diff-alert       | `alert`, `arbitrage`, `multi-exchange`    | 03-25 | 14:30 | 8         |
| 8   | CI 테스트 커버리지 리포트 설정    | kn.kim | completed | manual      | chore/test-coverage-ci      | `CI/CD`, `testing`, `coverage`            | 03-26 | 11:30 | 6         |

**메시지 설계 원칙:**

- role: user ↔ assistant 교대 (sort_order 순서)
- content_type: user → `prompt`, assistant → `response`
- model_used (assistant): `claude-sonnet-4-20250514`
- tokens_used (assistant): 800~2500 범위
- 내용: Crypto-Talk 프로젝트 맥락에 맞는 실제 개발 대화

#### 메시지 상세 — 세션 1: Telegram Bot 커맨드 파서 리팩토링 (8 messages)

| #   | Role      | Content 요약                                                                         | Type     |
| --- | --------- | ------------------------------------------------------------------------------------ | -------- |
| 1   | user      | "현재 커맨드 파서가 if-else 체인으로 되어있는데 Strategy 패턴으로 리팩토링하고 싶어" | prompt   |
| 2   | assistant | 현재 구조 분석, Strategy 패턴 적용 방안, CommandHandler 인터페이스 설계              | response |
| 3   | user      | "BuyCommand, SellCommand, PortfolioCommand 핸들러 구현해줘"                          | prompt   |
| 4   | assistant | 각 핸들러 구현 코드, CommandRegistry 매핑, 인자 파싱 로직                            | response |
| 5   | user      | "한글 자연어 커맨드도 파싱해야 해. '비트코인 0.1개 사줘' 같은 거"                    | prompt   |
| 6   | assistant | NLP 파서 레이어 추가, 정규식 + 키워드 매칭, 파싱 결과 → 표준 Command 변환            | response |
| 7   | user      | "에러 메시지도 한글로 친절하게 바꿔줘"                                               | prompt   |
| 8   | assistant | 에러 메시지 한글화, 사용자 친화적 안내 문구, 도움말 자동 제안 로직                   | response |

#### 메시지 상세 — 세션 2: 거래소 API 에러 핸들링 통합 (10 messages)

| #   | Role      | Content 요약                                                              | Type     |
| --- | --------- | ------------------------------------------------------------------------- | -------- |
| 1   | user      | "Binance, Upbit 에러 코드가 다 다른데 통합 에러 핸들링 레이어를 만들어줘" | prompt   |
| 2   | assistant | 거래소별 에러 코드 분류, 통합 ExchangeError 클래스 설계, 에러 매핑 테이블 | response |
| 3   | user      | "Binance의 -1013 (MIN_NOTIONAL)은 어떻게 처리해야 해?"                    | prompt   |
| 4   | assistant | MIN_NOTIONAL 에러 처리: 최소 거래 금액 조회 → 자동 조정 로직, 사용자 알림 | response |
| 5   | user      | "Upbit의 insufficient_funds 에러 처리도"                                  | prompt   |
| 6   | assistant | 잔고 부족 시 가용 잔고 조회 → 부분 주문 제안 → 사용자 확인 플로우         | response |
| 7   | user      | "에러 발생 시 Telegram으로 알림 보내는 것도 추가"                         | prompt   |
| 8   | assistant | 에러 심각도별 알림 분기, Telegram 메시지 포맷팅, throttle 적용            | response |
| 9   | user      | "재시도 로직이 거래소마다 다를 수 있잖아"                                 | prompt   |
| 10  | assistant | 거래소별 RetryPolicy 설정, rate-limit 감지 시 backoff, 최대 재시도 횟수   | response |

> 나머지 6개 세션도 유사한 수준으로 Crypto-Talk 맥락의 구체적 대화 작성.

---

### Phase 3: 충돌 데이터 보강

기존 40건(file/info·warning/detected)에 **타입·상태 다양성** 추가. 기존 충돌은 유지하고 5건 신규 삽입.

> **최신 커밋 반영 (`dee4716`):** 심각도 임계값이 변경됨 — info: 1-3개, warning: 4-7개, critical: 8+개 겹침.
> 감지 윈도우도 7일→3일로 축소. `overlapping_paths` 수를 새 임계값에 맞추어 현실적으로 구성.

| #   | 타입       | 심각도   | 상태      | 세션 A                     | 세션 B                          | overlapping_paths 수 | 설명                                                         |
| --- | ---------- | -------- | --------- | -------------------------- | ------------------------------- | -------------------- | ------------------------------------------------------------ |
| 1   | design     | critical | detected  | Okyo: 포트폴리오 기능 리뷰 | kn.kim: 포트폴리오 수익률 차트  | 8개                  | 수익률 계산 로직 불일치 — 실현 손익 vs 미실현 손익 기준 차이 |
| 2   | dependency | warning  | reviewing | Okyo: DCA 주문 실패 분석   | kn.kim: DCA 스케줄러 cron 검토  | 5개                  | DCA 실행 주기와 주문 실패 재시도 간격이 겹쳐 중복 주문 위험  |
| 3   | plan       | warning  | resolved  | Okyo: submission_plan 기획 | kn.kim: 거래소 에러 핸들링      | 4개                  | 에러 처리 전략이 submission plan의 요구사항과 상충           |
| 4   | file       | critical | reviewing | kn.kim: sonnet 설정        | kn.kim: 거래소 API 에러 핸들링  | 9개                  | `src/lib/config.ts` 동시 수정 — 모델 설정과 API 설정 충돌    |
| 5   | design     | info     | dismissed | Okyo: 사용성 분석          | kn.kim: 주문 실행 로그 대시보드 | 2개                  | 대시보드 레이아웃 가이드라인 차이 (사소)                     |

**overlapping_paths 예시 (충돌 #1 — 8개):**

```
src/app/portfolio/components/ProfitChart.tsx
src/app/portfolio/hooks/useProfit.ts
src/app/portfolio/utils/calculate-profit.ts
src/app/portfolio/types.ts
src/lib/exchange/binance/portfolio.ts
src/lib/exchange/upbit/portfolio.ts
src/lib/exchange/types.ts
src/app/portfolio/components/PortfolioSummary.tsx
```

---

### Phase 4: Activity Log 보강 — 25건 추가

기존 24건(session_created 위주)에 다양한 액션 타입 추가.

각 로그에는 `action`, `entity_type`, `entity_id`, `metadata` 필드를 정확히 기재한다.

| 액션                 | entity_type   | 건수 | 날짜 범위           | 설명                   |
| -------------------- | ------------- | ---- | ------------------- | ---------------------- |
| session_completed    | session       | 6    | 03-23 ~ 03-26       | 세션 완료 이벤트       |
| conflict_detected    | conflict      | 5    | 03-24 ~ 03-26       | 충돌 감지              |
| conflict_resolved    | conflict      | 2    | 03-25, 03-26        | 충돌 해결              |
| evaluation_completed | ai_evaluation | 2    | 03-25, 03-26        | AI 평가 완료           |
| collaborator_joined  | project       | 2    | 03-23, 03-23        | Okyo, kn.kim 참여 기록 |
| project_updated      | project       | 3    | 03-23, 03-24, 03-25 | 프로젝트 설정 변경     |
| prd_analyzed         | prd_document  | 1    | 03-23               | PRD 분석 완료          |
| session_synced       | session       | 4    | 03-23 ~ 03-26       | 세션 동기화            |

**날짜 분포:** 4일간 고르게 분산 (03-23: 7건, 03-24: 6건, 03-25: 6건, 03-26: 6건)

---

### Phase 5: AI Evaluations — 2건

| #   | 대상   | 트리거 | 상태      | 점수 | 등급       | 분석 세션 | 분석 메시지 | 날짜  |
| --- | ------ | ------ | --------- | ---- | ---------- | --------- | ----------- | ----- |
| 1   | Okyo   | Okyo   | completed | 82.5 | advanced   | 15        | 780         | 03-25 |
| 2   | kn.kim | Okyo   | completed | 68.0 | proficient | 8         | 210         | 03-26 |

**필수 필드 (DB NOT NULL):**

| 필드                         | Eval #1                  | Eval #2                  |
| ---------------------------- | ------------------------ | ------------------------ |
| date_range_start             | 2026-03-23T00:00:00Z     | 2026-03-23T00:00:00Z     |
| date_range_end               | 2026-03-25T23:59:59Z     | 2026-03-26T23:59:59Z     |
| model_used                   | claude-sonnet-4-20250514 | claude-sonnet-4-20250514 |
| input_tokens_used            | 45000                    | 18000                    |
| output_tokens_used           | 8500                     | 3200                     |
| prompt_quality_score         | 85.0                     | 72.0                     |
| task_complexity_score        | 80.0                     | 65.0                     |
| iteration_pattern_score      | 78.0                     | 70.0                     |
| context_utilization_score    | 88.0                     | 62.0                     |
| ai_capability_leverage_score | 82.0                     | 68.0                     |
| improvement_summary          | (아래 참조)              | (아래 참조)              |
| completed_at                 | 2026-03-25T15:30:00Z     | 2026-03-26T14:00:00Z     |

**improvement_summary:**

- Eval #1: "프롬프트에 성능 요구사항과 엣지케이스를 포함하고, 구현 후 테스트 요청을 습관화하면 전반적인 AI 활용 효율이 크게 향상될 것입니다."
- Eval #2: "관련 코드 파일을 참조로 제공하고, 이전 세션 결과를 연결하여 컨텍스트를 풍부하게 구성하면 더 높은 품질의 결과물을 얻을 수 있습니다."

#### Evaluation #1 (Okyo) 차원 상세

| 차원                   | 점수 | 신뢰도 | 강점                                                          | 약점                           | 제안                                       |
| ---------------------- | ---- | ------ | ------------------------------------------------------------- | ------------------------------ | ------------------------------------------ |
| prompt_quality         | 85.0 | 0.92   | 구체적 기능 요구사항 명시, 코드 컨텍스트 제공, 에러 로그 첨부 | 제약 조건 누락 가끔 발생       | 성능 요구사항/엣지케이스를 프롬프트에 포함 |
| task_complexity        | 80.0 | 0.88   | 복잡한 다중 거래소 통합, 봇 아키텍처 설계                     | 단계별 분해보다 한번에 큰 요청 | 큰 작업을 3단계로 나눠서 요청              |
| iteration_pattern      | 78.0 | 0.85   | 디버깅→수정→재테스트 패턴 우수                                | 중간 검증 단계 생략            | 구현 후 테스트 요청을 습관화               |
| context_utilization    | 88.0 | 0.90   | 이전 대화 맥락 활용 우수, 파일 경로 참조                      | 외부 API 문서 직접 공유 미흡   | Binance 공식 문서 URL 첨부 권장            |
| ai_capability_leverage | 82.0 | 0.87   | 코드 생성/리뷰/디버깅 적극 활용                               | 테스트 생성 요청 부족          | AI에 유닛 테스트 작성도 함께 요청          |

#### Evaluation #2 (kn.kim) 차원 상세

| 차원                   | 점수 | 신뢰도 | 강점                      | 약점                       | 제안                             |
| ---------------------- | ---- | ------ | ------------------------- | -------------------------- | -------------------------------- |
| prompt_quality         | 72.0 | 0.85   | 명확한 기능 요청          | 배경 컨텍스트 부족         | 관련 코드 파일을 참조로 제공     |
| task_complexity        | 65.0 | 0.82   | 적절한 난이도의 작업 선택 | 복합 작업 시도 부족        | 점진적으로 난이도 높은 작업 시도 |
| iteration_pattern      | 70.0 | 0.80   | 반복 개선 시도            | 첫 결과물 수용 경향        | 코드 리뷰를 추가 요청            |
| context_utilization    | 62.0 | 0.78   | 기본적 맥락 유지          | 세션 간 컨텍스트 연결 미흡 | 이전 세션 결과를 참조하여 요청   |
| ai_capability_leverage | 68.0 | 0.83   | 코드 생성 활용            | 아키텍처 설계/분석 미활용  | 구현 전 설계 리뷰를 AI에 요청    |

---

### Phase 6: PRD 문서 & 분석 — 1건

| 항목      | 값                       |
| --------- | ------------------------ |
| 제목      | Crypto-Talk MVP PRD v1.0 |
| 파일명    | crypto-talk-mvp-prd.md   |
| 업로더    | Okyo                     |
| 분석 상태 | completed                |
| 달성률    | 73.5%                    |
| 총 항목   | 15                       |
| 달성      | 8                        |
| 부분 달성 | 4                        |
| 미시작    | 3                        |
| 분석 모델 | claude-sonnet-4-20250514 |

#### PRD 요구사항 항목

| #   | 카테고리     | 요구사항                                                 | 상태        | 신뢰도 | 근거 파일                                              |
| --- | ------------ | -------------------------------------------------------- | ----------- | ------ | ------------------------------------------------------ |
| 1   | Core Trading | 사용자가 자연어로 매수/매도 주문을 실행할 수 있어야 한다 | achieved    | 0.95   | `src/lib/commands/`, `src/lib/router/`                 |
| 2   | Core Trading | 시장가 및 지정가 주문을 지원해야 한다                    | achieved    | 0.92   | `src/lib/exchange/`                                    |
| 3   | Core Trading | 복수 거래소(Binance, Upbit) 동시 주문을 지원해야 한다    | achieved    | 0.90   | `src/lib/exchange/binance/`, `src/lib/exchange/upbit/` |
| 4   | Portfolio    | 실시간 포트폴리오 잔고 조회 기능                         | achieved    | 0.93   | `src/app/portfolio/`                                   |
| 5   | Portfolio    | 수익률 계산 및 시각화                                    | partial     | 0.75   | `src/app/portfolio/` (차트 미완)                       |
| 6   | DCA          | DCA(적립식 매수) 자동 실행 기능                          | achieved    | 0.88   | `src/lib/dca/`                                         |
| 7   | DCA          | DCA 스케줄 관리 (시작/중지/수정)                         | partial     | 0.70   | `src/lib/dca/` (중지 버그 존재)                        |
| 8   | Alert        | 가격 변동 알림 설정                                      | achieved    | 0.85   | `src/lib/alerts/`                                      |
| 9   | Alert        | 거래소 간 가격 차이 알림                                 | partial     | 0.60   | (구현 중)                                              |
| 10  | Bot          | Telegram Bot 커맨드 인터페이스                           | achieved    | 0.94   | `src/app/bot/`                                         |
| 11  | Bot          | 한글 자연어 커맨드 파싱                                  | achieved    | 0.82   | `src/lib/router/`                                      |
| 12  | Security     | API Key 암호화 저장                                      | partial     | 0.65   | (부분 구현)                                            |
| 13  | Security     | 2FA 인증                                                 | not_started | 0.95   | (미구현)                                               |
| 14  | Monitoring   | 주문 실행 로그 대시보드                                  | not_started | 0.90   | (기획 단계)                                            |
| 15  | DevOps       | CI/CD 파이프라인 및 테스트 자동화                        | not_started | 0.88   | (미구현)                                               |

---

## 구현 방식

### 권장: Node.js 스크립트

`scripts/seed-demo.mjs` 파일 생성. 기존 환경의 `pg` 패키지를 활용하여 직접 실행.

```bash
node scripts/seed-demo.mjs
```

**이유:**

- psql 미설치 환경에서도 실행 가능
- UUID 생성에 `crypto.randomUUID()` 활용
- 트랜잭션 래핑으로 원자적 삽입
- ESM 형식으로 별도 빌드 불필요

### 스크립트 구조

```
scripts/seed-demo.mjs
├── connectDB()              — Pool 연결 (SSL rejectUnauthorized: false)
├── phase1_updateSessions()  — 날짜/상태/태그/브랜치/소스 UPDATE (22건)
├── phase2_newSessions()     — kn.kim 세션 8건 + 메시지 62건 INSERT
├── phase3_conflicts()       — 신규 충돌 5건 INSERT
├── phase4_activityLog()     — 활동 로그 25건 INSERT
├── phase5_aiEvaluations()   — 평가 2건 + 차원 10건 + 증거 INSERT
├── phase6_prdDocument()     — PRD 1건 + 분석 1건 + 요구사항 15건 INSERT
└── main()                   — BEGIN → phase1~6 → COMMIT (에러 시 ROLLBACK)
```

---

## 롤백 계획

### 마커 전략

모든 신규 데이터에 `metadata: {"demo": true}` 마커 부여 (sessions, activity_log).
PRD/AI Evaluation은 프로젝트 내 유일하므로 project_id 기반 삭제.

### 롤백 SQL (역순 삭제 — FK cascade 순서)

```sql
-- Phase 6: PRD (cascade로 requirements, analyses 자동 삭제)
DELETE FROM prd_documents WHERE project_id = 'c200458d-f89d-49d7-aa7f-0b1c62fa4e0e';

-- Phase 5: AI Evaluations (cascade로 dimensions, evidence 자동 삭제)
DELETE FROM ai_evaluations WHERE project_id = 'c200458d-f89d-49d7-aa7f-0b1c62fa4e0e';

-- Phase 4: Activity Log
DELETE FROM activity_log WHERE metadata->>'demo' = 'true';

-- Phase 3: Conflicts (신규 5건만 — description 마커)
DELETE FROM conflicts WHERE project_id = 'c200458d-f89d-49d7-aa7f-0b1c62fa4e0e'
  AND conflict_type IN ('design', 'dependency', 'plan');

-- Phase 2: Sessions (cascade로 messages 자동 삭제)
DELETE FROM sessions WHERE metadata->>'demo' = 'true';

-- Phase 1: 기존 세션 UPDATE 복원 (백업 테이블에서)
UPDATE sessions s SET
  status = b.status, source = b.source, branch = b.branch,
  tags = b.tags, created_at = b.created_at
FROM sessions_backup_demo b WHERE s.id = b.id;
DROP TABLE IF EXISTS sessions_backup_demo;
```

### 백업 (Phase 1 실행 전)

```sql
CREATE TABLE sessions_backup_demo AS
  SELECT id, status, source, branch, tags, created_at FROM sessions;
```

---

## 최종 데이터 예상 결과

| 항목         | 현재                     | 삽입 후                                       |
| ------------ | ------------------------ | --------------------------------------------- |
| 사용자       | 3명                      | 2명 활용 (Okyo, kn.kim)                       |
| 세션         | 22건 (completed만)       | 30건 (active 4, completed 24, archived 2)     |
| 메시지       | 1,783건                  | ~1,845건 (+62건)                              |
| 태그         | 0건                      | 전체 30건에 태그 부여                         |
| 충돌         | 40건 (file/detected만)   | 45건 (4타입 × 4상태 다양화)                   |
| Activity Log | 24건 (session_created만) | 49건 (8종 액션)                               |
| AI 평가      | 0건                      | 2건 (advanced, proficient) + 차원 10건 + 증거 |
| PRD 문서     | 0건                      | 1건 + 분석 1건 + 요구사항 15건                |
| 날짜 분포    | 전부 03-26               | 03-23 ~ 03-26 (4일 분산)                      |

---

## 실행 순서

1. **백업:** 기존 세션 상태를 `sessions_backup_demo` 테이블에 저장
2. **Phase 1:** 기존 세션 UPDATE (날짜, 상태, 태그, 브랜치, 소스)
3. **Phase 2:** kn.kim 신규 세션 8건 + 메시지 62건 INSERT
4. **Phase 3:** 신규 충돌 5건 INSERT
5. **Phase 4:** Activity Log 25건 INSERT
6. **Phase 5:** AI Evaluations 2건 INSERT (차원 10건 + 증거)
7. **Phase 6:** PRD 문서 + 분석 + 요구사항 INSERT
8. **검증:** 웹 UI 대시보드 / Conversations / Conflicts / Evaluations 확인

---

## 구현계획

### Step 1: 스크립트 파일 생성

`scripts/seed-demo.mjs` — ESM, `pg` 패키지 직접 사용.

```javascript
import pg from 'pg';
import crypto from 'crypto';
const { Pool } = pg;

const DB_URL =
  'postgresql://postgres.eymyqatmehtnrmnfjptj:rnjsdhr23%40%23@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres';
const PROJECT_ID = 'c200458d-f89d-49d7-aa7f-0b1c62fa4e0e';
const OKYO_ID = '48e7aff0-d0e1-42b5-84e4-04262f1dfd91';
const KNKIM_ID = 'fa7d47b5-ab74-4cef-9425-ca4eab222687';
```

### Step 2: 헬퍼 함수

```javascript
function uuid() {
  return crypto.randomUUID();
}
function ts(month, day, hour, min = 0) {
  return `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:00+09:00`;
}
```

### Step 3: Phase별 구현 순서

| Step | 함수                          | SQL 유형                                       | 레코드 수  | 의존성                       |
| ---- | ----------------------------- | ---------------------------------------------- | ---------- | ---------------------------- |
| 3-0  | backup()                      | CREATE TABLE AS                                | 1          | 없음                         |
| 3-1  | phase1_updateSessions(client) | UPDATE × 22                                    | 22         | 없음                         |
| 3-2  | phase2_newSessions(client)    | INSERT sessions + messages                     | 8 + 62     | 없음 (신규 UUID)             |
| 3-3  | phase3_conflicts(client)      | INSERT conflicts                               | 5          | phase1 + phase2 세션 ID 필요 |
| 3-4  | phase4_activityLog(client)    | INSERT activity_log                            | 25         | phase2~3 entity_id 필요      |
| 3-5  | phase5_aiEvaluations(client)  | INSERT evaluations + dimensions + evidence     | 2 + 10 + N | phase2 세션/메시지 ID 필요   |
| 3-6  | phase6_prdDocument(client)    | INSERT prd_documents + analyses + requirements | 1 + 1 + 15 | 없음                         |

### Step 4: 트랜잭션 래핑

```javascript
async function main() {
  const pool = new Pool({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await backup(client);
    const sessionMap = await phase1_updateSessions(client);
    const newIds = await phase2_newSessions(client);
    await phase3_conflicts(client, sessionMap, newIds);
    await phase4_activityLog(client, sessionMap, newIds);
    await phase5_aiEvaluations(client, newIds);
    await phase6_prdDocument(client);
    await client.query('COMMIT');
    console.log('✅ Demo seed 완료');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ 롤백:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}
```

### Step 5: 주의사항

- **search_vector:** sessions/messages INSERT/UPDATE 시 DB 트리거가 자동으로 tsvector 갱신 — 별도 처리 불필요
- **sort_order:** 메시지는 반드시 1부터 순차 증가
- **content_type:** user → `'prompt'`, assistant → `'response'` (일부 `'plan'`)
- **role:** `'user'` / `'assistant'` (seed.ts의 `'human'`은 레거시 — 상수 기준 `'user'` 사용)
- **conflict CHECK:** `session_a_id ≠ session_b_id` 반드시 보장
- **NUMERIC(5,2):** 점수 값은 소수점 2자리 (예: 82.50, 0.92)
- **TEXT[]:** PostgreSQL 배열 리터럴 `ARRAY['tag1','tag2']` 또는 `'{tag1,tag2}'` 사용
- **JSONB:** `'{"demo": true}'::jsonb` 형식으로 metadata 삽입
- **created_at 타임존:** KST(+09:00) 기준으로 작성, DB는 UTC 저장
