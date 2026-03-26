import pg from 'pg';
import crypto from 'crypto';

const { Pool } = pg;

// ─── Constants ───────────────────────────────────────────────
const DB_URL = 'postgresql://postgres.eymyqatmehtnrmnfjptj:rnjsdhr23%40%23@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres';
const PROJECT_ID = 'c200458d-f89d-49d7-aa7f-0b1c62fa4e0e';
const OKYO_ID = '48e7aff0-d0e1-42b5-84e4-04262f1dfd91';
const KNKIM_ID = 'fa7d47b5-ab74-4cef-9425-ca4eab222687';

// Original 22 session IDs (created_at < 2026-03-26T10:00Z)
const S = {
  botUserName:    '795df3be-e689-4a0c-b63f-efdb5ffe6111',
  mainPull:       '747a156f-59e9-4bb7-a707-c675b7e793b2',
  bugAnalysis:    '49884ac2-cca9-45e8-8bb8-79bccbabe8e2',
  taskNotif:      'c6c086ac-c400-407f-b72a-d30680a4f16c',
  crossReview:    '3920fe46-3bbb-4378-b256-d6fea666efb8',
  untitled:       '3285ce16-7a93-4044-a5a8-24a905c296e7',
  orderMsgFmt:    '7d0b4946-0d53-4718-a87e-9d8313efda3f',
  solCancel:      'c3504164-8935-4a52-b190-c6e778a6b91e',
  e2ePlan:        '3c3a1c56-9466-4e06-9fab-84691d604dc3',
  usability:      '27d5c0f6-f402-4654-b432-390f2a7cc9b2',
  stopDca:        'c917feef-35b6-491d-8630-bacb7c4d75fc',
  portfolioInfo:  '0088b8ff-14b0-45bd-a11c-b6a39241ba06',
  submissionPlan: '101d8fba-6314-4ef4-b617-27d6405b27e9',
  dcaFail:        '3f2e012c-407a-4672-913a-0feee52224b5',
  implCheck:      '3927f25d-0369-4418-b783-8cdd52210e54',
  crossReview2:   '9913f75a-1e1d-48b6-8640-b8972781d67f',
  sellBack:       '8cd0616e-422b-4123-aa5b-393881681d4f',  // kn.kim
  usdtKeep:       '80214a24-b9f4-4549-97f3-cc6da53a9d2a',  // kn.kim
  btcToEth:       '83fb3418-51be-406e-9fe5-81363aeb0b62',  // kn.kim
  btcBuyErr:      '4156e028-f9ea-427a-bb9a-f85dd8af23c5',  // kn.kim
  sonnetCfg:      '0bdb09cd-9278-4c7c-b167-02daa6fd6c6a',  // kn.kim
  landingDeploy:  '81c1d8d4-c322-4363-b4f3-356526fdfb0d',
};

// ─── Helpers ─────────────────────────────────────────────────
function uuid() { return crypto.randomUUID(); }
function ts(day, hour, min = 0) {
  return `2026-03-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:00+09:00`;
}

// ─── Phase 1: UPDATE existing 22 sessions ────────────────────
async function phase1_updateSessions(client) {
  const updates = [
    // #1  botUserName 기획 → 03-23 09:30, archived, claude_ai
    { id: S.botUserName,    date: ts(23,9,30),  status: 'archived', source: 'claude_ai',   branch: 'main',                      tags: ['planning','telegram-bot','cross-review'] },
    // #2  기획 교차검수 구현계획 → 03-23 11:15, completed, claude_code
    { id: S.crossReview,    date: ts(23,11,15), status: 'completed', source: 'claude_code', branch: 'main',                      tags: ['planning','implementation','cross-review'] },
    // #3  task-notification → 03-23 13:40, completed, manual
    { id: S.taskNotif,      date: ts(23,13,40), status: 'completed', source: 'manual',      branch: 'main',                      tags: ['automation','ci'] },
    // #4  메인 브랜치 pull → 03-23 15:00, archived, manual
    { id: S.mainPull,       date: ts(23,15,0),  status: 'archived', source: 'manual',       branch: 'main',                      tags: ['git','branch-management'] },
    // #5  버그 문제원인 분석 → 03-23 16:20, completed, claude_code
    { id: S.bugAnalysis,    date: ts(23,16,20), status: 'completed', source: 'claude_code', branch: 'main',                      tags: ['debugging','bug-fix'] },
    // #6  Untitled Session → 03-23 17:45, completed, manual
    { id: S.untitled,       date: ts(23,17,45), status: 'completed', source: 'manual',      branch: 'main',                      tags: ['misc'] },
    // #7  주문확인 메시지 포맷 → 03-24 09:00, completed, claude_code
    { id: S.orderMsgFmt,    date: ts(24,9,0),   status: 'completed', source: 'claude_code', branch: 'feat/order-message-format',  tags: ['UX','message-format','trading'] },
    // #8  Sol 주문 취소 → 03-24 10:30, completed, claude_code
    { id: S.solCancel,      date: ts(24,10,30), status: 'completed', source: 'claude_code', branch: 'main',                      tags: ['debugging','order','solana'] },
    // #9  E2E 테스트 계획 → 03-24 12:00, completed, claude_code
    { id: S.e2ePlan,        date: ts(24,12,0),  status: 'completed', source: 'claude_code', branch: 'test/e2e-scenarios',         tags: ['testing','e2e','planning'] },
    // #10 사용성 문제점 분석 → 03-24 14:15, completed, claude_ai
    { id: S.usability,      date: ts(24,14,15), status: 'completed', source: 'claude_ai',   branch: 'main',                      tags: ['UX','analysis','usability'] },
    // #11 stop dca → 03-24 15:45, completed, claude_code
    { id: S.stopDca,        date: ts(24,15,45), status: 'completed', source: 'claude_code', branch: 'main',                      tags: ['debugging','DCA','bug-fix'] },
    // #12 포트폴리오 정보/기능 → 03-24 17:00, completed, claude_ai
    { id: S.portfolioInfo,  date: ts(24,17,0),  status: 'completed', source: 'claude_ai',   branch: 'main',                      tags: ['portfolio','feature-review'] },
    // #13 submission_plan.md → 03-25 09:30, completed, claude_ai
    { id: S.submissionPlan, date: ts(25,9,30),  status: 'completed', source: 'claude_ai',   branch: 'main',                      tags: ['planning','submission'] },
    // #14 DCA 주문 실패 → 03-25 11:00, completed, claude_code
    { id: S.dcaFail,        date: ts(25,11,0),  status: 'completed', source: 'claude_code', branch: 'fix/dca-order-failure',      tags: ['debugging','DCA','order'] },
    // #15 기획 문서대로 수정/구현 → 03-25 13:30, completed, claude_code
    { id: S.implCheck,      date: ts(25,13,30), status: 'completed', source: 'claude_code', branch: 'main',                      tags: ['implementation','cross-review'] },
    // #16 기획 파일 교차검수 → 03-25 15:00, completed, claude_code
    { id: S.crossReview2,   date: ts(25,15,0),  status: 'completed', source: 'claude_code', branch: 'main',                      tags: ['planning','cross-review'] },
    // #17 USDT 남기고 매도 (kn.kim) → 03-25 16:30, completed, claude_code
    { id: S.usdtKeep,       date: ts(25,16,30), status: 'completed', source: 'claude_code', branch: 'feedback',                  tags: ['trading','order-logic','USDT'] },
    // #18 아까 산 거 팔아줘 (kn.kim) → 03-26 09:00, active, claude_code
    { id: S.sellBack,       date: ts(26,9,0),   status: 'active',   source: 'claude_code', branch: 'feat/context-aware-trading',  tags: ['trading','context-memory','UX'] },
    // #19 비트코인→이더리움 (kn.kim) → 03-26 10:45, completed, claude_code
    { id: S.btcToEth,       date: ts(26,10,45), status: 'completed', source: 'claude_code', branch: 'feat/multi-exchange-swap',   tags: ['trading','multi-exchange','swap'] },
    // #20 비트코인 0.1개 에러 (kn.kim) → 03-26 13:00, completed, claude_code
    { id: S.btcBuyErr,      date: ts(26,13,0),  status: 'completed', source: 'claude_code', branch: 'fix/btc-purchase-error',     tags: ['debugging','order','bitcoin'] },
    // #21 sonnet 설정 (kn.kim) → 03-26 15:20, active, claude_code
    { id: S.sonnetCfg,      date: ts(26,15,20), status: 'active',   source: 'claude_code', branch: 'chore/model-config',          tags: ['config','model-setting'] },
    // #22 랜딩페이지 배포 → 03-26 17:00, active, claude_code
    { id: S.landingDeploy,  date: ts(26,17,0),  status: 'active',   source: 'claude_code', branch: 'feat/landing-deploy',         tags: ['deployment','landing-page','portfolio'] },
  ];

  for (const u of updates) {
    await client.query(
      `UPDATE sessions SET created_at = $1, status = $2, source = $3, branch = $4, tags = $5 WHERE id = $6`,
      [u.date, u.status, u.source, u.branch, u.tags, u.id]
    );
  }
  console.log(`  Phase 1: ${updates.length}건 세션 UPDATE 완료`);
}

// ─── Phase 2: INSERT new kn.kim sessions + messages ──────────
async function phase2_newSessions(client) {
  const newSessions = [
    {
      id: uuid(), title: 'Telegram Bot 커맨드 파서 리팩토링 (8 files in lib)',
      status: 'completed', source: 'claude_code', branch: 'refactor/bot-command-parser',
      tags: ['refactor','telegram-bot','parser'],
      file_paths: ['src/lib/commands/parser.ts','src/lib/commands/registry.ts','src/lib/commands/buy.ts','src/lib/commands/sell.ts','src/lib/commands/portfolio.ts','src/lib/commands/types.ts','src/lib/commands/index.ts','src/lib/commands/__tests__/parser.test.ts'],
      date: ts(23,10,0),
      messages: [
        { role: 'user', type: 'prompt', content: '현재 커맨드 파서가 if-else 체인으로 되어있는데 Strategy 패턴으로 리팩토링하고 싶어' },
        { role: 'assistant', type: 'response', content: '현재 `parseCommand()` 함수를 분석해보겠습니다.\n\n현재 구조는 약 15개의 if-else 분기로 커맨드를 처리하고 있어 확장성이 떨어집니다. Strategy 패턴을 적용하면:\n\n```typescript\ninterface CommandHandler {\n  readonly command: string;\n  readonly aliases: string[];\n  canHandle(input: string): boolean;\n  execute(args: ParsedArgs): Promise<CommandResult>;\n}\n```\n\n이 인터페이스를 기반으로 각 커맨드를 독립 클래스로 분리하고, `CommandRegistry`에서 매핑을 관리하면 새 커맨드 추가 시 기존 코드 수정 없이 확장 가능합니다.', tokens: 1200 },
        { role: 'user', type: 'prompt', content: 'BuyCommand, SellCommand, PortfolioCommand 핸들러 구현해줘' },
        { role: 'assistant', type: 'response', content: '각 핸들러를 구현했습니다.\n\n```typescript\nexport class BuyCommand implements CommandHandler {\n  readonly command = "buy";\n  readonly aliases = ["매수", "사", "구매"];\n\n  canHandle(input: string): boolean {\n    return [this.command, ...this.aliases].some(a => input.startsWith(a));\n  }\n\n  async execute(args: ParsedArgs): Promise<CommandResult> {\n    const { coin, amount, exchange } = this.parseArgs(args);\n    return { action: "buy", coin, amount, exchange };\n  }\n}\n```\n\nSellCommand, PortfolioCommand도 동일 패턴으로 구현했습니다. CommandRegistry에서 자동 등록됩니다.', tokens: 1800 },
        { role: 'user', type: 'prompt', content: "한글 자연어 커맨드도 파싱해야 해. '비트코인 0.1개 사줘' 같은 거" },
        { role: 'assistant', type: 'response', content: 'NLP 파서 레이어를 추가했습니다.\n\n```typescript\nexport class NaturalLanguageParser {\n  private readonly patterns = [\n    { regex: /(.+?)\\s*(\\d+\\.?\\d*)\\s*개?\\s*(사|매수|구매)(줘|해)?/, action: "buy" },\n    { regex: /(.+?)\\s*(전량|전부|다)\\s*(팔|매도)(아|어)?(줘|해)?/, action: "sell_all" },\n  ];\n\n  parse(input: string): StandardCommand | null {\n    for (const { regex, action } of this.patterns) {\n      const match = input.match(regex);\n      if (match) return this.toStandardCommand(action, match);\n    }\n    return null;\n  }\n}\n```\n\n정규식 + 키워드 매칭으로 한글 입력을 표준 Command 객체로 변환합니다.', tokens: 1500 },
        { role: 'user', type: 'prompt', content: '에러 메시지도 한글로 친절하게 바꿔줘' },
        { role: 'assistant', type: 'response', content: '에러 메시지를 한글화하고 사용자 친화적으로 개선했습니다.\n\n```typescript\nexport const ERROR_MESSAGES = {\n  INSUFFICIENT_BALANCE: (coin: string, required: string, available: string) =>\n    `❌ ${coin} 잔고가 부족합니다.\\n필요: ${required}\\n보유: ${available}\\n\\n💡 보유량 전체를 매도하시려면 "${coin} 전량 팔아줘"라고 입력하세요.`,\n  INVALID_COIN: (input: string) =>\n    `❓ "${input}"은(는) 지원하지 않는 코인입니다.\\n\\n📋 지원 코인 목록: /coins`,\n  MIN_ORDER: (coin: string, min: string) =>\n    `⚠️ ${coin}의 최소 주문 수량은 ${min}입니다.`,\n} as const;\n```\n\n각 에러 상황별로 원인 + 해결방법을 함께 안내합니다.', tokens: 1100 },
      ],
    },
    {
      id: uuid(), title: '거래소 API 에러 핸들링 통합 (6 files in lib)',
      status: 'completed', source: 'claude_code', branch: 'feat/exchange-error-handler',
      tags: ['error-handling','api','multi-exchange'],
      file_paths: ['src/lib/exchange/errors.ts','src/lib/exchange/binance/error-map.ts','src/lib/exchange/upbit/error-map.ts','src/lib/exchange/retry-policy.ts','src/lib/exchange/types.ts','src/lib/exchange/__tests__/errors.test.ts'],
      date: ts(23,14,30),
      messages: [
        { role: 'user', type: 'prompt', content: 'Binance, Upbit 에러 코드가 다 다른데 통합 에러 핸들링 레이어를 만들어줘' },
        { role: 'assistant', type: 'response', content: '거래소별 에러 코드를 통합 ExchangeError 클래스로 매핑하는 레이어를 설계했습니다.\n\n```typescript\nexport class ExchangeError extends Error {\n  constructor(\n    readonly code: ExchangeErrorCode,\n    readonly exchange: Exchange,\n    readonly originalCode: string | number,\n    readonly retryable: boolean,\n    message: string,\n  ) { super(message); }\n}\n\nexport const BINANCE_ERROR_MAP: Record<number, ExchangeErrorCode> = {\n  [-1013]: "MIN_NOTIONAL",\n  [-1021]: "TIMESTAMP_MISMATCH",\n  [-2010]: "INSUFFICIENT_BALANCE",\n  [-1003]: "RATE_LIMITED",\n};\n```\n\nBinance는 숫자 코드, Upbit은 문자열 코드를 사용하므로 각각의 매핑 테이블을 관리합니다.', tokens: 1600 },
        { role: 'user', type: 'prompt', content: "Binance의 -1013 (MIN_NOTIONAL)은 어떻게 처리해야 해?" },
        { role: 'assistant', type: 'response', content: 'MIN_NOTIONAL 에러는 주문 금액이 거래소 최소 요구량 미만일 때 발생합니다.\n\n처리 전략:\n1. 에러 발생 시 해당 심볼의 최소 주문량(minNotional) API 조회\n2. 사용자 요청 금액과 비교\n3. 자동 조정 제안 또는 사용자 알림\n\n```typescript\nasync function handleMinNotional(symbol: string, requestedQty: number) {\n  const info = await getExchangeInfo(symbol);\n  const minNotional = parseFloat(info.filters.find(f => f.filterType === "MIN_NOTIONAL").minNotional);\n  const currentPrice = await getPrice(symbol);\n  const minQty = minNotional / currentPrice;\n  \n  return { minQty, suggestion: Math.ceil(minQty * 1.05 * 1e8) / 1e8 };\n}\n```', tokens: 1400 },
        { role: 'user', type: 'prompt', content: 'Upbit의 insufficient_funds 에러 처리도' },
        { role: 'assistant', type: 'response', content: 'Upbit 잔고 부족 에러 처리:\n\n```typescript\nasync function handleInsufficientFunds(exchange: "upbit", coin: string, requested: number) {\n  const balance = await getBalance("upbit", coin);\n  const available = parseFloat(balance.available);\n  \n  if (available > 0) {\n    return {\n      type: "PARTIAL_ORDER_AVAILABLE",\n      message: `잔고 부족: ${requested} 요청, ${available} 가용\\n부분 주문(${available})을 진행할까요?`,\n      suggestedAmount: available,\n    };\n  }\n  return { type: "NO_BALANCE", message: `${coin} 잔고가 없습니다.` };\n}\n```\n\n잔고가 일부 있으면 부분 주문을 제안하고 사용자 확인을 받습니다.', tokens: 1200 },
        { role: 'user', type: 'prompt', content: '에러 발생 시 Telegram으로 알림 보내는 것도 추가' },
        { role: 'assistant', type: 'response', content: '에러 심각도별 Telegram 알림 분기를 추가했습니다.\n\n```typescript\nconst SEVERITY_CONFIG = {\n  critical: { notify: true, throttle: 0 },      // 즉시 알림\n  warning:  { notify: true, throttle: 60_000 },  // 1분 쓰로틀\n  info:     { notify: false, throttle: 0 },       // 알림 안함\n};\n\nasync function notifyError(error: ExchangeError) {\n  const severity = getErrorSeverity(error.code);\n  const config = SEVERITY_CONFIG[severity];\n  if (!config.notify) return;\n  \n  const message = formatErrorMessage(error);\n  await sendTelegramAlert(message, { parse_mode: "HTML" });\n}\n```\n\ncritical은 즉시, warning은 1분 쓰로틀 적용합니다.', tokens: 1300 },
        { role: 'user', type: 'prompt', content: '재시도 로직이 거래소마다 다를 수 있잖아' },
        { role: 'assistant', type: 'response', content: '거래소별 RetryPolicy를 설정할 수 있도록 구현했습니다.\n\n```typescript\nexport const RETRY_POLICIES: Record<Exchange, RetryPolicy> = {\n  binance: {\n    maxRetries: 3,\n    baseDelay: 1000,\n    backoffMultiplier: 2,\n    retryableCodes: ["RATE_LIMITED", "TIMESTAMP_MISMATCH", "NETWORK_ERROR"],\n  },\n  upbit: {\n    maxRetries: 2,\n    baseDelay: 500,\n    backoffMultiplier: 1.5,\n    retryableCodes: ["RATE_LIMITED", "NETWORK_ERROR"],\n  },\n};\n```\n\nBinance는 rate-limit 감지 시 더 긴 backoff를 적용하고, Upbit은 재시도 횟수를 낮게 설정합니다. TIMESTAMP_MISMATCH는 Binance에서만 발생하므로 Binance 전용 retryable입니다.', tokens: 1500 },
      ],
    },
    {
      id: uuid(), title: '포트폴리오 수익률 차트 구현 (4 files in app)',
      status: 'completed', source: 'claude_ai', branch: 'feat/profit-chart',
      tags: ['chart','portfolio','frontend'],
      file_paths: ['src/app/portfolio/components/ProfitChart.tsx','src/app/portfolio/hooks/useProfit.ts','src/app/portfolio/utils/calculate-profit.ts','src/app/portfolio/types.ts'],
      date: ts(24,11,0),
      messages: [
        { role: 'user', type: 'prompt', content: '포트폴리오 수익률을 시각화하는 차트 컴포넌트를 만들어줘. Recharts 사용' },
        { role: 'assistant', type: 'response', content: 'Recharts 기반 수익률 차트 컴포넌트를 구현했습니다.\n\n```tsx\nexport function ProfitChart({ data, period }: ProfitChartProps) {\n  return (\n    <ResponsiveContainer width="100%" height={300}>\n      <AreaChart data={data}>\n        <defs>\n          <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">\n            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />\n            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />\n          </linearGradient>\n        </defs>\n        <XAxis dataKey="date" />\n        <YAxis tickFormatter={(v) => `${v > 0 ? "+" : ""}${v}%`} />\n        <Tooltip content={<CustomTooltip />} />\n        <Area dataKey="profitRate" stroke="#10b981" fill="url(#profitGrad)" />\n      </AreaChart>\n    </ResponsiveContainer>\n  );\n}\n```\n\n양수는 초록, 음수는 빨간색 그라데이션으로 표시합니다.', tokens: 1600 },
        { role: 'user', type: 'prompt', content: '실현 손익이랑 미실현 손익을 구분해서 보여줄 수 있어?' },
        { role: 'assistant', type: 'response', content: '두 가지 수익률을 구분하는 듀얼 차트로 확장했습니다.\n\n```tsx\n<Area dataKey="realizedPnl" name="실현 손익" stroke="#3b82f6" fill="url(#realizedGrad)" />\n<Area dataKey="unrealizedPnl" name="미실현 손익" stroke="#f59e0b" fill="url(#unrealizedGrad)" />\n```\n\n`useProfit` 훅에서 실현/미실현을 분리 계산합니다:\n- 실현 손익: 매도 완료된 거래의 (매도가 - 매수가) × 수량\n- 미실현 손익: 현재 보유 중인 코인의 (현재가 - 평균매수가) × 수량', tokens: 1200 },
        { role: 'user', type: 'prompt', content: '기간별 필터도 추가해줘 (1일, 1주, 1개월, 전체)' },
        { role: 'assistant', type: 'response', content: '기간 필터 탭을 추가했습니다.\n\n```tsx\nconst PERIODS = [\n  { label: "1일", value: "1d" },\n  { label: "1주", value: "7d" },\n  { label: "1개월", value: "30d" },\n  { label: "전체", value: "all" },\n] as const;\n\nexport function ProfitChart({ data }: Props) {\n  const [period, setPeriod] = useState<Period>("7d");\n  const filtered = useMemo(() => filterByPeriod(data, period), [data, period]);\n  \n  return (\n    <div>\n      <div className="flex gap-2 mb-4">\n        {PERIODS.map(p => (\n          <button key={p.value}\n            className={cn("px-3 py-1 rounded-full text-sm", period === p.value && "bg-primary text-white")}\n            onClick={() => setPeriod(p.value)}>\n            {p.label}\n          </button>\n        ))}\n      </div>\n      <ChartArea data={filtered} />\n    </div>\n  );\n}\n```', tokens: 1400 },
        { role: 'user', type: 'prompt', content: '총 수익률 요약 카드도 차트 위에 추가해줘' },
        { role: 'assistant', type: 'response', content: '수익률 요약 카드를 차트 상단에 배치했습니다.\n\n```tsx\nfunction ProfitSummary({ summary }: { summary: ProfitSummary }) {\n  const isPositive = summary.totalPnlPercent >= 0;\n  return (\n    <div className="grid grid-cols-3 gap-4 mb-4">\n      <SummaryCard label="총 수익률"\n        value={`${isPositive ? "+" : ""}${summary.totalPnlPercent.toFixed(2)}%`}\n        color={isPositive ? "text-green-500" : "text-red-500"} />\n      <SummaryCard label="실현 손익"\n        value={`${formatKRW(summary.realizedPnl)}`}\n        color="text-blue-500" />\n      <SummaryCard label="미실현 손익"\n        value={`${formatKRW(summary.unrealizedPnl)}`}\n        color="text-amber-500" />\n    </div>\n  );\n}\n```\n\n총 수익률, 실현 손익(원화), 미실현 손익(원화) 3개 카드로 구성합니다.', tokens: 1300 },
      ],
    },
    {
      id: uuid(), title: 'WebSocket 연결 안정성 개선 (3 files in lib)',
      status: 'active', source: 'claude_code', branch: 'fix/ws-stability',
      tags: ['websocket','stability','bug-fix'],
      file_paths: ['src/lib/ws/client.ts','src/lib/ws/reconnect.ts','src/lib/ws/heartbeat.ts'],
      date: ts(26,14,0),
      messages: [
        { role: 'user', type: 'prompt', content: 'WebSocket 연결이 자주 끊겨. 재연결 로직 개선해줘' },
        { role: 'assistant', type: 'response', content: '현재 재연결 로직을 분석해보니 고정 딜레이(5초)를 사용하고 있어 네트워크 불안정 시 과도한 재연결 시도가 발생합니다.\n\nExponential backoff + jitter를 적용하겠습니다:\n\n```typescript\nfunction getReconnectDelay(attempt: number): number {\n  const base = Math.min(1000 * Math.pow(2, attempt), 30000);\n  const jitter = Math.random() * 1000;\n  return base + jitter;\n}\n```\n\n추가로 heartbeat 메커니즘을 도입하여 연결 상태를 주기적으로 확인합니다.', tokens: 1100 },
        { role: 'user', type: 'prompt', content: 'heartbeat ping/pong 구현해줘' },
        { role: 'assistant', type: 'response', content: '30초 간격 heartbeat를 구현했습니다.\n\n```typescript\nexport class HeartbeatManager {\n  private timer: NodeJS.Timer | null = null;\n  private lastPong = Date.now();\n\n  start(ws: WebSocket, interval = 30_000, timeout = 10_000) {\n    this.timer = setInterval(() => {\n      if (Date.now() - this.lastPong > interval + timeout) {\n        ws.close(4000, "heartbeat_timeout");\n        return;\n      }\n      ws.send(JSON.stringify({ type: "ping", ts: Date.now() }));\n    }, interval);\n  }\n\n  onPong() { this.lastPong = Date.now(); }\n  stop() { if (this.timer) clearInterval(this.timer); }\n}\n```\n\npong 응답이 40초 이내 없으면 연결을 종료하고 재연결을 트리거합니다.', tokens: 1200 },
        { role: 'user', type: 'prompt', content: '연결 상태를 UI에서 표시하고 싶어' },
        { role: 'assistant', type: 'response', content: '연결 상태 인디케이터를 추가했습니다.\n\n```tsx\ntype WsStatus = "connected" | "reconnecting" | "disconnected";\n\nexport function ConnectionStatus({ status }: { status: WsStatus }) {\n  const config = {\n    connected:    { color: "bg-green-500", label: "실시간", pulse: false },\n    reconnecting: { color: "bg-yellow-500", label: "재연결 중...", pulse: true },\n    disconnected: { color: "bg-red-500", label: "연결 끊김", pulse: false },\n  };\n  const { color, label, pulse } = config[status];\n  return (\n    <div className="flex items-center gap-1.5">\n      <span className={cn("h-2 w-2 rounded-full", color, pulse && "animate-pulse")} />\n      <span className="text-xs text-muted-foreground">{label}</span>\n    </div>\n  );\n}\n```', tokens: 1000 },
      ],
    },
    {
      id: uuid(), title: '주문 실행 로그 대시보드 (5 files across lib, app)',
      status: 'completed', source: 'claude_code', branch: 'feat/order-log-dashboard',
      tags: ['dashboard','logging','trading'],
      file_paths: ['src/app/dashboard/OrderLogPanel.tsx','src/app/dashboard/hooks/useOrderLogs.ts','src/lib/orders/logger.ts','src/lib/orders/types.ts','src/lib/orders/repository.ts'],
      date: ts(24,16,0),
      messages: [
        { role: 'user', type: 'prompt', content: '주문 실행 이력을 대시보드에서 볼 수 있는 로그 패널 만들어줘' },
        { role: 'assistant', type: 'response', content: '주문 로그 패널을 구현했습니다.\n\n```tsx\nexport function OrderLogPanel() {\n  const { logs, isLoading } = useOrderLogs();\n  return (\n    <div className="rounded-lg border p-4">\n      <h3 className="font-semibold mb-3">주문 실행 로그</h3>\n      <div className="space-y-2 max-h-[400px] overflow-auto">\n        {logs.map(log => (\n          <OrderLogItem key={log.id} log={log} />\n        ))}\n      </div>\n    </div>\n  );\n}\n\nfunction OrderLogItem({ log }: { log: OrderLog }) {\n  return (\n    <div className={cn("flex items-center gap-3 p-2 rounded", statusBg[log.status])}>\n      <StatusIcon status={log.status} />\n      <div className="flex-1">\n        <span className="font-medium">{log.action} {log.coin}</span>\n        <span className="text-sm text-muted-foreground ml-2">{log.amount} @ {log.price}</span>\n      </div>\n      <time className="text-xs">{formatRelative(log.executedAt)}</time>\n    </div>\n  );\n}\n```', tokens: 1500 },
        { role: 'user', type: 'prompt', content: '성공/실패/대기 상태별 필터도 추가' },
        { role: 'assistant', type: 'response', content: '상태 필터 탭을 추가했습니다.\n\n```tsx\nconst STATUS_FILTERS = [\n  { label: "전체", value: "all", icon: ListIcon },\n  { label: "성공", value: "success", icon: CheckCircle },\n  { label: "실패", value: "failed", icon: XCircle },\n  { label: "대기", value: "pending", icon: Clock },\n] as const;\n\nconst filtered = useMemo(\n  () => status === "all" ? logs : logs.filter(l => l.status === status),\n  [logs, status]\n);\n```\n\n각 필터 옆에 건수 뱃지도 표시합니다.', tokens: 1100 },
        { role: 'user', type: 'prompt', content: '로그를 DB에 저장하는 repository 패턴도 구현해줘' },
        { role: 'assistant', type: 'response', content: 'Repository 패턴으로 주문 로그 저장소를 구현했습니다.\n\n```typescript\nexport const orderLogRepository = {\n  async create(db: Db, log: CreateOrderLog): Promise<OrderLog> {\n    return db.insertInto("order_logs")\n      .values({ ...log, id: generateId() })\n      .returningAll()\n      .executeTakeFirstOrThrow();\n  },\n\n  async findByProject(db: Db, projectId: string, filters: LogFilters): Promise<OrderLog[]> {\n    let query = db.selectFrom("order_logs")\n      .where("project_id", "=", projectId)\n      .orderBy("executed_at", "desc")\n      .limit(filters.limit ?? 50);\n    if (filters.status) query = query.where("status", "=", filters.status);\n    return query.selectAll().execute();\n  },\n};\n```', tokens: 1300 },
        { role: 'user', type: 'prompt', content: '주문 실행 시 자동으로 로그가 쌓이게 해줘' },
        { role: 'assistant', type: 'response', content: '주문 서비스의 execute 함수에 로깅 미들웨어를 추가했습니다.\n\n```typescript\nexport async function executeOrderWithLog(\n  db: Db, order: OrderRequest\n): Promise<OrderResult> {\n  const logId = generateId();\n  await orderLogRepository.create(db, {\n    id: logId, action: order.action, coin: order.coin,\n    amount: order.amount, exchange: order.exchange,\n    status: "pending", requestedAt: new Date(),\n  });\n\n  try {\n    const result = await executeOrder(order);\n    await orderLogRepository.update(db, logId, {\n      status: "success", price: result.price, executedAt: new Date(),\n    });\n    return result;\n  } catch (error) {\n    await orderLogRepository.update(db, logId, {\n      status: "failed", errorMessage: error.message, executedAt: new Date(),\n    });\n    throw error;\n  }\n}\n```\n\n주문 요청 시 pending 로그 생성 → 성공/실패 시 상태 업데이트합니다.', tokens: 1600 },
        { role: 'user', type: 'prompt', content: '실패한 주문 재시도 버튼도 추가해줘' },
        { role: 'assistant', type: 'response', content: '실패 로그 항목에 재시도 버튼을 추가했습니다.\n\n```tsx\n{log.status === "failed" && (\n  <Button size="sm" variant="outline" onClick={() => retryOrder(log)}\n    disabled={retrying === log.id}>\n    {retrying === log.id ? <Spinner size="sm" /> : <RotateCcw className="h-3 w-3" />}\n    재시도\n  </Button>\n)}\n```\n\n재시도 시 원래 주문 파라미터를 복사하여 새 주문을 생성하고, 원본 로그에 `retried_by` 참조를 추가합니다.', tokens: 900 },
      ],
    },
    {
      id: uuid(), title: 'DCA 스케줄러 cron 설정 검토 (3 files in lib)',
      status: 'completed', source: 'claude_code', branch: 'review/dca-scheduler',
      tags: ['DCA','scheduler','review'],
      file_paths: ['src/lib/dca/scheduler.ts','src/lib/dca/config.ts','src/lib/dca/__tests__/scheduler.test.ts'],
      date: ts(25,10,0),
      messages: [
        { role: 'user', type: 'prompt', content: 'DCA 스케줄러 cron 설정이 제대로 동작하는지 검토해줘' },
        { role: 'assistant', type: 'response', content: '현재 DCA 스케줄러를 검토한 결과 몇 가지 이슈를 발견했습니다:\n\n1. **cron 표현식 파싱 오류**: `"0 */4 * * *"` (4시간마다)가 의도대로 동작하지만, 사용자 입력 검증이 없음\n2. **중복 실행 방지 누락**: 서버 재시작 시 이전 스케줄이 중복 등록될 수 있음\n3. **타임존 미처리**: UTC 기준으로만 동작하여 KST 사용자에게 혼란\n\n```typescript\n// 현재 코드\ncron.schedule(expression, () => executeDCA(config));\n\n// 개선 필요\ncron.schedule(expression, () => executeDCA(config), {\n  timezone: "Asia/Seoul",\n  scheduled: true,\n});\n```', tokens: 1200 },
        { role: 'user', type: 'prompt', content: '중복 실행 방지 로직 구현해줘' },
        { role: 'assistant', type: 'response', content: '스케줄러 레지스트리를 도입하여 중복 실행을 방지합니다.\n\n```typescript\nconst activeSchedules = new Map<string, cron.ScheduledTask>();\n\nexport function registerDCA(config: DCAConfig): void {\n  const key = `${config.userId}_${config.coin}_${config.exchange}`;\n  \n  // 기존 스케줄 제거\n  const existing = activeSchedules.get(key);\n  if (existing) {\n    existing.stop();\n    activeSchedules.delete(key);\n  }\n  \n  const task = cron.schedule(config.cronExpression, async () => {\n    const lock = await acquireLock(key, 60_000);\n    if (!lock) return; // 이미 실행 중\n    try { await executeDCA(config); }\n    finally { await releaseLock(key); }\n  }, { timezone: "Asia/Seoul" });\n  \n  activeSchedules.set(key, task);\n}\n```\n\nMap 기반 레지스트리 + advisory lock 이중 방어입니다.', tokens: 1400 },
        { role: 'user', type: 'prompt', content: 'DCA 중지가 안 되는 버그 원인도 같이 봐줘' },
        { role: 'assistant', type: 'response', content: '`stopDCA` 함수를 확인한 결과 원인을 찾았습니다.\n\n```typescript\n// 버그 코드: key 생성 로직이 register와 다름\nexport function stopDCA(userId: string, coin: string) {\n  const key = `${userId}_${coin}`; // exchange 누락!\n  const task = activeSchedules.get(key);\n  // task가 undefined → 중지 실패\n}\n```\n\n`registerDCA`에서는 `userId_coin_exchange` 키를 사용하는데 `stopDCA`에서는 `userId_coin`만 사용하여 키가 매칭되지 않았습니다.\n\n수정:\n```typescript\nexport function stopDCA(userId: string, coin: string, exchange?: string) {\n  if (exchange) {\n    const key = `${userId}_${coin}_${exchange}`;\n    stopByKey(key);\n  } else {\n    // exchange 미지정 시 해당 유저의 해당 코인 전체 중지\n    for (const [key, task] of activeSchedules) {\n      if (key.startsWith(`${userId}_${coin}_`)) stopByKey(key);\n    }\n  }\n}\n```', tokens: 1500 },
      ],
    },
    {
      id: uuid(), title: 'Binance/Upbit 가격 차이 알림 설정 (4 files in lib)',
      status: 'completed', source: 'claude_ai', branch: 'feat/price-diff-alert',
      tags: ['alert','arbitrage','multi-exchange'],
      file_paths: ['src/lib/alerts/price-diff.ts','src/lib/alerts/config.ts','src/lib/exchange/price-feed.ts','src/lib/alerts/__tests__/price-diff.test.ts'],
      date: ts(25,14,30),
      messages: [
        { role: 'user', type: 'prompt', content: 'Binance랑 Upbit 가격 차이가 일정 %p 이상이면 알림 보내는 기능 만들어줘' },
        { role: 'assistant', type: 'response', content: '거래소 간 가격 차이 모니터링 서비스를 구현했습니다.\n\n```typescript\nexport class PriceDiffMonitor {\n  async checkDiff(coin: string): Promise<PriceDiff | null> {\n    const [binancePrice, upbitPrice] = await Promise.all([\n      getPriceInKRW("binance", coin),\n      getPriceInKRW("upbit", coin),\n    ]);\n    \n    const diffPercent = ((upbitPrice - binancePrice) / binancePrice) * 100;\n    const kimchiPremium = diffPercent; // 김프\n    \n    if (Math.abs(diffPercent) >= this.threshold) {\n      return { coin, binancePrice, upbitPrice, diffPercent, kimchiPremium };\n    }\n    return null;\n  }\n}\n```\n\n`김치 프리미엄`도 함께 계산하여 표시합니다.', tokens: 1300 },
        { role: 'user', type: 'prompt', content: '사용자가 알림 임계값을 설정할 수 있게 해줘' },
        { role: 'assistant', type: 'response', content: '사용자별 알림 설정을 DB에 저장하도록 구현했습니다.\n\n```typescript\nexport interface PriceDiffAlertConfig {\n  readonly userId: string;\n  readonly coin: string;\n  readonly thresholdPercent: number;\n  readonly direction: "both" | "positive" | "negative";\n  readonly cooldownMinutes: number;\n  readonly enabled: boolean;\n}\n\n// Telegram 커맨드\n// /알림설정 BTC 3% — BTC 김프 3%p 이상 시 알림\n// /알림설정 ETH 2% 양방향 — 양방향 알림\n```\n\n기본값은 3%p, 양방향, 10분 쿨다운입니다.', tokens: 1100 },
        { role: 'user', type: 'prompt', content: '알림 메시지 포맷을 보기 좋게 만들어줘' },
        { role: 'assistant', type: 'response', content: '알림 메시지 포맷을 개선했습니다.\n\n```typescript\nfunction formatPriceDiffAlert(diff: PriceDiff): string {\n  const emoji = diff.kimchiPremium > 0 ? "🔴" : "🟢";\n  const direction = diff.kimchiPremium > 0 ? "프리미엄" : "디스카운트";\n  \n  return [\n    `${emoji} <b>${diff.coin} 김치 ${direction}</b>`,\n    ``,\n    `📊 차이: ${diff.diffPercent > 0 ? "+" : ""}${diff.diffPercent.toFixed(2)}%`,\n    `🔸 Binance: ${formatKRW(diff.binancePrice)}`,\n    `🔹 Upbit: ${formatKRW(diff.upbitPrice)}`,\n    `📈 차액: ${formatKRW(Math.abs(diff.upbitPrice - diff.binancePrice))}`,\n    ``,\n    `⏰ ${formatTime(new Date())}`,\n  ].join("\\n");\n}\n```\n\n프리미엄은 빨간, 디스카운트는 초록 이모지로 구분합니다.', tokens: 1200 },
        { role: 'user', type: 'prompt', content: '모니터링 주기는 어떻게 설정해?' },
        { role: 'assistant', type: 'response', content: '모니터링 주기를 cron 기반으로 설정합니다.\n\n```typescript\nconst MONITORING_INTERVALS = {\n  realtime: "*/10 * * * * *",  // 10초마다 (WebSocket 가격 피드 활용)\n  frequent: "*/1 * * * *",     // 1분마다\n  normal:   "*/5 * * * *",     // 5분마다 (기본값)\n  relaxed:  "*/15 * * * *",    // 15분마다\n};\n```\n\nWebSocket 가격 피드가 활성화된 경우 실시간(10초) 모니터링을, 그 외에는 REST API 폴링(5분)을 사용합니다. 쿨다운 기간 내 중복 알림은 발송하지 않습니다.', tokens: 1000 },
      ],
    },
    {
      id: uuid(), title: 'CI 테스트 커버리지 리포트 설정 (3 files)',
      status: 'completed', source: 'manual', branch: 'chore/test-coverage-ci',
      tags: ['CI/CD','testing','coverage'],
      file_paths: ['.github/workflows/test.yml','vitest.config.ts','package.json'],
      date: ts(26,11,30),
      messages: [
        { role: 'user', type: 'prompt', content: 'GitHub Actions에서 테스트 커버리지 리포트를 PR 코멘트로 달아주는 CI 설정해줘' },
        { role: 'assistant', type: 'response', content: 'GitHub Actions 워크플로에 커버리지 리포트를 추가했습니다.\n\n```yaml\nname: Test & Coverage\non: [pull_request]\n\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: pnpm/action-setup@v2\n      - uses: actions/setup-node@v4\n        with: { node-version: 22 }\n      - run: pnpm install --frozen-lockfile\n      - run: pnpm test:coverage -- --reporter=json-summary\n      - uses: davelosert/vitest-coverage-report-action@v2\n        with:\n          json-summary-path: coverage/coverage-summary.json\n          json-final-path: coverage/coverage-final.json\n```\n\nPR에 커버리지 변화량을 자동 코멘트합니다.', tokens: 1200 },
        { role: 'user', type: 'prompt', content: '커버리지 80% 미만이면 CI 실패하게 설정해줘' },
        { role: 'assistant', type: 'response', content: 'vitest.config.ts에 커버리지 임계값을 설정했습니다.\n\n```typescript\nexport default defineConfig({\n  test: {\n    coverage: {\n      provider: "v8",\n      reporter: ["text", "json-summary", "json"],\n      thresholds: {\n        statements: 80,\n        branches: 80,\n        functions: 80,\n        lines: 80,\n      },\n    },\n  },\n});\n```\n\n4가지 메트릭(statements, branches, functions, lines) 모두 80% 이상이어야 CI가 통과합니다.', tokens: 900 },
        { role: 'user', type: 'prompt', content: '커버리지 뱃지도 README에 추가하고 싶어' },
        { role: 'assistant', type: 'response', content: 'Codecov 연동으로 커버리지 뱃지를 추가했습니다.\n\n워크플로에 업로드 단계 추가:\n```yaml\n      - uses: codecov/codecov-action@v4\n        with:\n          files: coverage/coverage-final.json\n          token: ${{ secrets.CODECOV_TOKEN }}\n```\n\nREADME 뱃지:\n```markdown\n[![Coverage](https://codecov.io/gh/owner/crypto-talk/branch/main/graph/badge.svg)](https://codecov.io/gh/owner/crypto-talk)\n```\n\nbranch별 커버리지 추이 그래프도 Codecov 대시보드에서 확인 가능합니다.', tokens: 800 },
      ],
    },
  ];

  const newSessionIds = {};
  for (const s of newSessions) {
    await client.query(
      `INSERT INTO sessions (id, project_id, user_id, title, status, source, branch, tags, file_paths, module_names, metadata, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12)`,
      [s.id, PROJECT_ID, KNKIM_ID, s.title, s.status, s.source, s.branch, s.tags, s.file_paths, [], JSON.stringify({ demo: true }), s.date]
    );
    newSessionIds[s.title.substring(0, 20)] = s.id;

    for (let i = 0; i < s.messages.length; i++) {
      const m = s.messages[i];
      await client.query(
        `INSERT INTO messages (id, session_id, role, content, content_type, tokens_used, model_used, sort_order, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [uuid(), s.id, m.role, m.content, m.type, m.role === 'assistant' ? (m.tokens || 1000) : null, m.role === 'assistant' ? 'claude-sonnet-4-20250514' : null, i + 1, s.date]
      );
    }
  }

  const totalMsgs = newSessions.reduce((sum, s) => sum + s.messages.length, 0);
  console.log(`  Phase 2: ${newSessions.length}건 세션 + ${totalMsgs}건 메시지 INSERT 완료`);
  return { sessionIds: newSessionIds, sessions: newSessions };
}

// ─── Phase 3: INSERT conflicts ───────────────────────────────
async function phase3_conflicts(client, newSessions) {
  // Find new session IDs by title prefix
  const findNew = (prefix) => newSessions.sessions.find(s => s.title.startsWith(prefix))?.id;

  const conflicts = [
    {
      type: 'design', severity: 'critical', status: 'detected',
      sessionA: S.portfolioInfo, sessionB: findNew('포트폴리오 수익률'),
      description: '수익률 계산 로직 불일치 — 실현 손익 vs 미실현 손익 기준 차이',
      paths: ['src/app/portfolio/components/ProfitChart.tsx','src/app/portfolio/hooks/useProfit.ts','src/app/portfolio/utils/calculate-profit.ts','src/app/portfolio/types.ts','src/lib/exchange/binance/portfolio.ts','src/lib/exchange/upbit/portfolio.ts','src/lib/exchange/types.ts','src/app/portfolio/components/PortfolioSummary.tsx'],
      date: ts(25,12,0),
    },
    {
      type: 'dependency', severity: 'warning', status: 'reviewing',
      sessionA: S.dcaFail, sessionB: findNew('DCA 스케줄러'),
      description: 'DCA 실행 주기와 주문 실패 재시도 간격이 겹쳐 중복 주문 위험',
      paths: ['src/lib/dca/scheduler.ts','src/lib/dca/config.ts','src/lib/dca/executor.ts','src/lib/orders/retry-policy.ts','src/lib/dca/__tests__/scheduler.test.ts'],
      reviewerId: OKYO_ID,
      date: ts(25,17,0),
    },
    {
      type: 'plan', severity: 'warning', status: 'resolved',
      sessionA: S.submissionPlan, sessionB: findNew('거래소 API 에러'),
      description: '에러 처리 전략이 submission plan의 요구사항과 상충',
      paths: ['src/lib/exchange/errors.ts','src/lib/exchange/retry-policy.ts','submission_plan.md','src/lib/exchange/types.ts'],
      resolvedBy: OKYO_ID,
      date: ts(24,18,0),
      resolvedAt: ts(25,10,30),
    },
    {
      type: 'file', severity: 'critical', status: 'reviewing',
      sessionA: S.sonnetCfg, sessionB: findNew('거래소 API 에러'),
      description: 'src/lib/config.ts 동시 수정 — 모델 설정과 API 설정 충돌',
      paths: ['src/lib/config.ts','src/lib/exchange/errors.ts','src/lib/exchange/binance/error-map.ts','src/lib/exchange/upbit/error-map.ts','src/lib/exchange/retry-policy.ts','src/lib/exchange/types.ts','src/lib/config/index.ts','src/lib/config/types.ts','src/lib/config/env.ts'],
      reviewerId: KNKIM_ID,
      date: ts(26,12,0),
    },
    {
      type: 'design', severity: 'info', status: 'dismissed',
      sessionA: S.usability, sessionB: findNew('주문 실행 로그'),
      description: '대시보드 레이아웃 가이드라인 차이 (사소)',
      paths: ['src/app/dashboard/OrderLogPanel.tsx','src/app/dashboard/layout.tsx'],
      resolvedBy: OKYO_ID,
      date: ts(25,14,0),
      resolvedAt: ts(25,15,0),
    },
  ];

  for (const c of conflicts) {
    await client.query(
      `INSERT INTO conflicts (id, project_id, session_a_id, session_b_id, conflict_type, severity, status, description, overlapping_paths, diff_data, resolved_by, reviewer_id, created_at, resolved_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [uuid(), PROJECT_ID, c.sessionA, c.sessionB, c.type, c.severity, c.status, c.description, c.paths, JSON.stringify({}), c.resolvedBy || null, c.reviewerId || null, c.date, c.resolvedAt || null]
    );
  }
  console.log(`  Phase 3: ${conflicts.length}건 충돌 INSERT 완료`);
}

// ─── Phase 4: INSERT activity log ────────────────────────────
async function phase4_activityLog(client) {
  const logs = [
    // collaborator_joined (03-23)
    { action: 'collaborator_joined', entityType: 'project', userId: OKYO_ID,  date: ts(23,9,0),  meta: { demo: true, userName: 'Okyo' } },
    { action: 'collaborator_joined', entityType: 'project', userId: KNKIM_ID, date: ts(23,9,5),  meta: { demo: true, userName: 'kn.kim' } },
    // project_updated (03-23, 03-24, 03-25)
    { action: 'project_updated', entityType: 'project', userId: OKYO_ID, date: ts(23,10,0), meta: { demo: true, field: 'database_mode', value: 'remote' } },
    { action: 'project_updated', entityType: 'project', userId: OKYO_ID, date: ts(24,9,30), meta: { demo: true, field: 'join_code', value: 'regenerated' } },
    { action: 'project_updated', entityType: 'project', userId: OKYO_ID, date: ts(25,9,0),  meta: { demo: true, field: 'description', value: 'updated' } },
    // prd_analyzed (03-23)
    { action: 'prd_analyzed', entityType: 'prd_document', userId: OKYO_ID, date: ts(23,15,0), meta: { demo: true, title: 'Crypto-Talk MVP PRD v1.0' } },
    // session_completed (03-23 ~ 03-26)
    { action: 'session_completed', entityType: 'session', userId: OKYO_ID,  date: ts(23,12,0),  meta: { demo: true } },
    { action: 'session_completed', entityType: 'session', userId: KNKIM_ID, date: ts(23,15,30), meta: { demo: true } },
    { action: 'session_completed', entityType: 'session', userId: OKYO_ID,  date: ts(24,11,0),  meta: { demo: true } },
    { action: 'session_completed', entityType: 'session', userId: KNKIM_ID, date: ts(24,17,30), meta: { demo: true } },
    { action: 'session_completed', entityType: 'session', userId: OKYO_ID,  date: ts(25,14,0),  meta: { demo: true } },
    { action: 'session_completed', entityType: 'session', userId: KNKIM_ID, date: ts(25,16,0),  meta: { demo: true } },
    // session_synced (03-23 ~ 03-26)
    { action: 'session_synced', entityType: 'session', userId: OKYO_ID,  date: ts(23,18,0),  meta: { demo: true, count: 6 } },
    { action: 'session_synced', entityType: 'session', userId: KNKIM_ID, date: ts(24,18,0),  meta: { demo: true, count: 5 } },
    { action: 'session_synced', entityType: 'session', userId: OKYO_ID,  date: ts(25,18,0),  meta: { demo: true, count: 5 } },
    { action: 'session_synced', entityType: 'session', userId: KNKIM_ID, date: ts(26,13,0),  meta: { demo: true, count: 5 } },
    // conflict_detected (03-24 ~ 03-26)
    { action: 'conflict_detected', entityType: 'conflict', userId: OKYO_ID,  date: ts(24,18,30), meta: { demo: true, type: 'plan' } },
    { action: 'conflict_detected', entityType: 'conflict', userId: OKYO_ID,  date: ts(25,12,30), meta: { demo: true, type: 'design' } },
    { action: 'conflict_detected', entityType: 'conflict', userId: OKYO_ID,  date: ts(25,17,30), meta: { demo: true, type: 'dependency' } },
    { action: 'conflict_detected', entityType: 'conflict', userId: KNKIM_ID, date: ts(26,12,30), meta: { demo: true, type: 'file' } },
    { action: 'conflict_detected', entityType: 'conflict', userId: OKYO_ID,  date: ts(25,14,30), meta: { demo: true, type: 'design' } },
    // conflict_resolved (03-25, 03-26)
    { action: 'conflict_resolved', entityType: 'conflict', userId: OKYO_ID, date: ts(25,10,30), meta: { demo: true } },
    { action: 'conflict_resolved', entityType: 'conflict', userId: OKYO_ID, date: ts(25,15,30), meta: { demo: true } },
    // evaluation_completed (03-25, 03-26)
    { action: 'evaluation_completed', entityType: 'ai_evaluation', userId: OKYO_ID, date: ts(25,15,30), meta: { demo: true, target: 'Okyo', score: 82.5 } },
    { action: 'evaluation_completed', entityType: 'ai_evaluation', userId: OKYO_ID, date: ts(26,14,0),  meta: { demo: true, target: 'kn.kim', score: 68.0 } },
  ];

  for (const l of logs) {
    await client.query(
      `INSERT INTO activity_log (id, project_id, user_id, action, entity_type, entity_id, metadata, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [uuid(), PROJECT_ID, l.userId, l.action, l.entityType, null, JSON.stringify(l.meta), l.date]
    );
  }
  console.log(`  Phase 4: ${logs.length}건 활동 로그 INSERT 완료`);
}

// ─── Phase 5: INSERT AI evaluations ──────────────────────────
async function phase5_aiEvaluations(client) {
  const evaluations = [
    {
      id: uuid(),
      targetUserId: OKYO_ID, triggeredByUserId: OKYO_ID,
      status: 'completed', overallScore: 82.50,
      promptQuality: 85.00, taskComplexity: 80.00, iterationPattern: 78.00,
      contextUtilization: 88.00, aiCapabilityLeverage: 82.00,
      tier: 'advanced', sessionsAnalyzed: 15, messagesAnalyzed: 780,
      dateRangeStart: ts(23,0,0), dateRangeEnd: '2026-03-25T23:59:59+09:00',
      modelUsed: 'claude-sonnet-4-20250514', inputTokens: 45000, outputTokens: 8500,
      improvementSummary: '프롬프트에 성능 요구사항과 엣지케이스를 포함하고, 구현 후 테스트 요청을 습관화하면 전반적인 AI 활용 효율이 크게 향상될 것입니다.',
      createdAt: ts(25,14,0), completedAt: ts(25,15,30),
      dimensions: [
        { dim: 'prompt_quality', score: 85.00, confidence: 0.92, summary: '구체적 기능 요구사항 명시, 코드 컨텍스트 제공, 에러 로그 첨부가 우수합니다.', strengths: ['구체적 요구사항 명시','코드 컨텍스트 제공','에러 로그 첨부'], weaknesses: ['제약 조건 누락 가끔 발생'], suggestions: ['성능 요구사항/엣지케이스를 프롬프트에 포함'] },
        { dim: 'task_complexity', score: 80.00, confidence: 0.88, summary: '복잡한 다중 거래소 통합과 봇 아키텍처 설계를 시도합니다.', strengths: ['복잡한 다중 거래소 통합','봇 아키텍처 설계'], weaknesses: ['단계별 분해보다 한번에 큰 요청'], suggestions: ['큰 작업을 3단계로 나눠서 요청'] },
        { dim: 'iteration_pattern', score: 78.00, confidence: 0.85, summary: '디버깅→수정→재테스트 패턴이 우수합니다.', strengths: ['디버깅→수정→재테스트 패턴 우수'], weaknesses: ['중간 검증 단계 생략'], suggestions: ['구현 후 테스트 요청을 습관화'] },
        { dim: 'context_utilization', score: 88.00, confidence: 0.90, summary: '이전 대화 맥락 활용과 파일 경로 참조가 뛰어납니다.', strengths: ['이전 대화 맥락 활용 우수','파일 경로 참조'], weaknesses: ['외부 API 문서 직접 공유 미흡'], suggestions: ['Binance 공식 문서 URL 첨부 권장'] },
        { dim: 'ai_capability_leverage', score: 82.00, confidence: 0.87, summary: '코드 생성, 리뷰, 디버깅을 적극 활용합니다.', strengths: ['코드 생성/리뷰/디버깅 적극 활용'], weaknesses: ['테스트 생성 요청 부족'], suggestions: ['AI에 유닛 테스트 작성도 함께 요청'] },
      ],
    },
    {
      id: uuid(),
      targetUserId: KNKIM_ID, triggeredByUserId: OKYO_ID,
      status: 'completed', overallScore: 68.00,
      promptQuality: 72.00, taskComplexity: 65.00, iterationPattern: 70.00,
      contextUtilization: 62.00, aiCapabilityLeverage: 68.00,
      tier: 'proficient', sessionsAnalyzed: 8, messagesAnalyzed: 210,
      dateRangeStart: ts(23,0,0), dateRangeEnd: '2026-03-26T23:59:59+09:00',
      modelUsed: 'claude-sonnet-4-20250514', inputTokens: 18000, outputTokens: 3200,
      improvementSummary: '관련 코드 파일을 참조로 제공하고, 이전 세션 결과를 연결하여 컨텍스트를 풍부하게 구성하면 더 높은 품질의 결과물을 얻을 수 있습니다.',
      createdAt: ts(26,13,0), completedAt: ts(26,14,0),
      dimensions: [
        { dim: 'prompt_quality', score: 72.00, confidence: 0.85, summary: '명확한 기능 요청을 합니다.', strengths: ['명확한 기능 요청'], weaknesses: ['배경 컨텍스트 부족'], suggestions: ['관련 코드 파일을 참조로 제공'] },
        { dim: 'task_complexity', score: 65.00, confidence: 0.82, summary: '적절한 난이도의 작업을 선택합니다.', strengths: ['적절한 난이도 작업 선택'], weaknesses: ['복합 작업 시도 부족'], suggestions: ['점진적으로 난이도 높은 작업 시도'] },
        { dim: 'iteration_pattern', score: 70.00, confidence: 0.80, summary: '반복 개선을 시도합니다.', strengths: ['반복 개선 시도'], weaknesses: ['첫 결과물 수용 경향'], suggestions: ['코드 리뷰를 추가 요청'] },
        { dim: 'context_utilization', score: 62.00, confidence: 0.78, summary: '기본적 맥락을 유지합니다.', strengths: ['기본적 맥락 유지'], weaknesses: ['세션 간 컨텍스트 연결 미흡'], suggestions: ['이전 세션 결과를 참조하여 요청'] },
        { dim: 'ai_capability_leverage', score: 68.00, confidence: 0.83, summary: '코드 생성을 주로 활용합니다.', strengths: ['코드 생성 활용'], weaknesses: ['아키텍처 설계/분석 미활용'], suggestions: ['구현 전 설계 리뷰를 AI에 요청'] },
      ],
    },
  ];

  for (const ev of evaluations) {
    await client.query(
      `INSERT INTO ai_evaluations (id, project_id, target_user_id, triggered_by_user_id, status, overall_score,
        prompt_quality_score, task_complexity_score, iteration_pattern_score, context_utilization_score, ai_capability_leverage_score,
        proficiency_tier, sessions_analyzed, messages_analyzed, date_range_start, date_range_end,
        model_used, input_tokens_used, output_tokens_used, improvement_summary, created_at, completed_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)`,
      [ev.id, PROJECT_ID, ev.targetUserId, ev.triggeredByUserId, ev.status, ev.overallScore,
       ev.promptQuality, ev.taskComplexity, ev.iterationPattern, ev.contextUtilization, ev.aiCapabilityLeverage,
       ev.tier, ev.sessionsAnalyzed, ev.messagesAnalyzed, ev.dateRangeStart, ev.dateRangeEnd,
       ev.modelUsed, ev.inputTokens, ev.outputTokens, ev.improvementSummary, ev.createdAt, ev.completedAt]
    );

    for (let i = 0; i < ev.dimensions.length; i++) {
      const d = ev.dimensions[i];
      await client.query(
        `INSERT INTO ai_evaluation_dimensions (id, evaluation_id, dimension, score, confidence, summary, strengths, weaknesses, suggestions, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [uuid(), ev.id, d.dim, d.score, d.confidence, d.summary, d.strengths, d.weaknesses, d.suggestions, i + 1]
      );
    }
  }
  console.log(`  Phase 5: ${evaluations.length}건 AI 평가 + ${evaluations.length * 5}건 차원 INSERT 완료`);
}

// ─── Phase 6: INSERT PRD document + analysis + requirements ──
async function phase6_prdDocument(client) {
  const docId = uuid();
  const analysisId = uuid();

  const prdContent = `# Crypto-Talk MVP PRD v1.0

## 개요
Crypto-Talk은 Telegram 기반 암호화폐 트레이딩 봇으로, 자연어 명령을 통해 다중 거래소(Binance, Upbit)에서 매매를 실행합니다.

## 핵심 기능

### 1. Core Trading
- 사용자가 자연어로 매수/매도 주문을 실행할 수 있어야 한다
- 시장가 및 지정가 주문을 지원해야 한다
- 복수 거래소(Binance, Upbit) 동시 주문을 지원해야 한다

### 2. Portfolio
- 실시간 포트폴리오 잔고 조회 기능
- 수익률 계산 및 시각화

### 3. DCA
- DCA(적립식 매수) 자동 실행 기능
- DCA 스케줄 관리 (시작/중지/수정)

### 4. Alert
- 가격 변동 알림 설정
- 거래소 간 가격 차이 알림

### 5. Bot
- Telegram Bot 커맨드 인터페이스
- 한글 자연어 커맨드 파싱

### 6. Security
- API Key 암호화 저장
- 2FA 인증

### 7. Monitoring
- 주문 실행 로그 대시보드

### 8. DevOps
- CI/CD 파이프라인 및 테스트 자동화`;

  await client.query(
    `INSERT INTO prd_documents (id, project_id, user_id, title, content, file_name, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [docId, PROJECT_ID, OKYO_ID, 'Crypto-Talk MVP PRD v1.0', prdContent, 'crypto-talk-mvp-prd.md', ts(23,14,0)]
  );

  await client.query(
    `INSERT INTO prd_analyses (id, prd_document_id, project_id, status, overall_rate, total_items, achieved_items, partial_items, not_started_items, scanned_files_count, model_used, input_tokens_used, output_tokens_used, created_at, completed_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
    [analysisId, docId, PROJECT_ID, 'completed', 73.50, 15, 8, 4, 3, 42, 'claude-sonnet-4-20250514', 32000, 6500, ts(23,14,30), ts(23,15,0)]
  );

  const requirements = [
    { text: '사용자가 자연어로 매수/매도 주문을 실행할 수 있어야 한다', category: 'Core Trading', status: 'achieved', confidence: 0.95, evidence: 'src/lib/commands/ 및 src/lib/router/에서 자연어 파싱 및 주문 실행 로직 구현 확인', paths: ['src/lib/commands/','src/lib/router/'] },
    { text: '시장가 및 지정가 주문을 지원해야 한다', category: 'Core Trading', status: 'achieved', confidence: 0.92, evidence: 'src/lib/exchange/에서 market/limit 주문 타입 분기 구현 확인', paths: ['src/lib/exchange/'] },
    { text: '복수 거래소(Binance, Upbit) 동시 주문을 지원해야 한다', category: 'Core Trading', status: 'achieved', confidence: 0.90, evidence: 'binance/, upbit/ 디렉토리에서 각 거래소별 클라이언트 구현 확인', paths: ['src/lib/exchange/binance/','src/lib/exchange/upbit/'] },
    { text: '실시간 포트폴리오 잔고 조회 기능', category: 'Portfolio', status: 'achieved', confidence: 0.93, evidence: 'src/app/portfolio/에서 잔고 조회 UI 및 API 호출 확인', paths: ['src/app/portfolio/'] },
    { text: '수익률 계산 및 시각화', category: 'Portfolio', status: 'partial', confidence: 0.75, evidence: '수익률 계산 로직은 있으나 차트 컴포넌트 미완성', paths: ['src/app/portfolio/'] },
    { text: 'DCA(적립식 매수) 자동 실행 기능', category: 'DCA', status: 'achieved', confidence: 0.88, evidence: 'src/lib/dca/에서 스케줄러 기반 DCA 실행 구현 확인', paths: ['src/lib/dca/'] },
    { text: 'DCA 스케줄 관리 (시작/중지/수정)', category: 'DCA', status: 'partial', confidence: 0.70, evidence: '시작/수정은 동작하나 중지 기능에 키 매칭 버그 존재', paths: ['src/lib/dca/'] },
    { text: '가격 변동 알림 설정', category: 'Alert', status: 'achieved', confidence: 0.85, evidence: 'src/lib/alerts/에서 가격 모니터링 및 Telegram 알림 구현 확인', paths: ['src/lib/alerts/'] },
    { text: '거래소 간 가격 차이 알림', category: 'Alert', status: 'partial', confidence: 0.60, evidence: '기본 구조만 구현, 김치 프리미엄 계산 및 사용자 설정 미완성', paths: [] },
    { text: 'Telegram Bot 커맨드 인터페이스', category: 'Bot', status: 'achieved', confidence: 0.94, evidence: 'src/app/bot/에서 Telegram Bot API 연동 및 커맨드 처리 확인', paths: ['src/app/bot/'] },
    { text: '한글 자연어 커맨드 파싱', category: 'Bot', status: 'achieved', confidence: 0.82, evidence: 'src/lib/router/에서 한글 정규식 기반 파싱 로직 확인', paths: ['src/lib/router/'] },
    { text: 'API Key 암호화 저장', category: 'Security', status: 'partial', confidence: 0.65, evidence: '환경변수 기반 저장은 되어있으나 DB 암호화 저장 미구현', paths: [] },
    { text: '2FA 인증', category: 'Security', status: 'not_started', confidence: 0.95, evidence: '2FA 관련 코드가 프로젝트에 존재하지 않음', paths: [] },
    { text: '주문 실행 로그 대시보드', category: 'Monitoring', status: 'not_started', confidence: 0.90, evidence: '주문 로그 대시보드 관련 코드 미발견, 기획 단계', paths: [] },
    { text: 'CI/CD 파이프라인 및 테스트 자동화', category: 'DevOps', status: 'not_started', confidence: 0.88, evidence: 'GitHub Actions 워크플로 미설정', paths: [] },
  ];

  for (let i = 0; i < requirements.length; i++) {
    const r = requirements[i];
    await client.query(
      `INSERT INTO prd_requirements (id, prd_analysis_id, requirement_text, category, status, confidence, evidence, file_paths, sort_order, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [uuid(), analysisId, r.text, r.category, r.status, r.confidence, r.evidence, r.paths, i + 1, ts(23,15,0)]
    );
  }
  console.log(`  Phase 6: PRD 문서 1건 + 분석 1건 + 요구사항 ${requirements.length}건 INSERT 완료`);
}

// ─── Main ────────────────────────────────────────────────────
async function main() {
  const pool = new Pool({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Backup existing sessions before update
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions_backup_demo AS
      SELECT id, status, source, branch, tags, created_at FROM sessions WHERE created_at < '2026-03-26T10:00:00Z'
    `);
    console.log('백업 테이블 생성 완료');

    await phase1_updateSessions(client);
    const newData = await phase2_newSessions(client);
    await phase3_conflicts(client, newData);
    await phase4_activityLog(client);
    await phase5_aiEvaluations(client);
    await phase6_prdDocument(client);

    await client.query('COMMIT');
    console.log('\n✅ Demo seed 완료!');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('\n❌ 롤백됨:', e.message);
    console.error(e.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
