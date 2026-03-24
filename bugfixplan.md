# Bug Analysis: ERR_CONNECTION_REFUSED on localhost:5174

## Symptom

`git clone && pnpm bootstrap && pnpm dev` 실행 후 브라우저에서 `localhost:5174` 접속 시 `ERR_CONNECTION_REFUSED` 발생.

---

## Root Cause Analysis

### 1. Vite 프로세스 시작 후 자동 종료 (직접 원인)

Turbo가 API/Web dev 서버를 모두 시작했고, Vite는 "ready on port 5174" 메시지를 출력함.
그러나 **현재 Vite 프로세스가 프로세스 목록에 존재하지 않음**.

```
# 실제 프로세스 상태
포트 5174 → 리스닝 프로세스 없음 (lsof 결과 empty)
포트 5173 → PID 10777 (이전 세션의 좀비 Vite)
포트 3001 → PID 17961 (API 서버 정상 동작)
```

Turbo(PID 17908) → pnpm(PID 17930) → tsx/API(PID 17954, 17961) 체인만 존재.
**Web dev(Vite) 자식 프로세스가 완전히 사라짐** → 포트 5174에 아무도 리스닝하지 않음 → `ERR_CONNECTION_REFUSED`

### 2. Node.js 버전 불일치 (Vite 크래시 추정 원인)

| 단계             | Node 버전    | 이유                                             |
| ---------------- | ------------ | ------------------------------------------------ |
| `pnpm bootstrap` | v22.22.1     | setup.sh 내부에서 `nvm use 22` 실행              |
| `pnpm dev`       | **v20.20.0** | bootstrap 서브셸 종료 후 nvm default(v20)로 복귀 |

- `setup.sh`가 `nvm use 22`만 실행하고 `nvm alias default 22`를 **실행하지 않음**
- `.nvmrc`에 `22`가 있지만, 유저 쉘에 nvm auto-use 훅이 미설정
- **결과**: `pnpm install`은 Node 22에서 실행, `pnpm dev`는 Node 20에서 실행
- Node 22 환경에서 설치된 일부 네이티브 바인딩/모듈이 Node 20 런타임에서 호환성 문제 발생 가능

```bash
# 확인된 실행 환경
$ node -v
v20.20.0

$ which node
/Users/okyo_dev/.nvm/versions/node/v20.20.0/bin/node

$ nvm alias default
default -> 20 (-> v20.20.0)
```

### 3. 포트 5173 좀비 프로세스 점유

```
PID 10777: node .../vite/bin/vite.js
  경로: /Users/okyo_dev/contextSync/    (← 이전 클론, Desktop이 아닌 다른 경로)
  시작: 어제 9:07 PM
  상태: IPv6 localhost:5173 LISTEN
```

- 이전 세션에서 다른 디렉토리(`~/contextSync/`)의 Vite가 여전히 실행 중
- 새 Vite가 5173 사용 불가 → 5174로 fallback
- 이 fallback 자체는 정상이지만, API의 CORS/proxy 설정과 불일치 가능

### 4. `package.json`에 `engines` 필드 부재

프로젝트가 Node 22+를 요구하지만 `package.json`에 `engines` 제약이 없어서, 잘못된 Node 버전으로 실행해도 아무 경고가 없음.

---

## Fix Plan

### Fix 1: `setup.sh` — Node 버전 영속적 활성화 (Critical)

**파일:** `scripts/setup.sh`

```diff
  echo "Installing Node.js 22 via nvm..."
  nvm install 22
  nvm use 22
+ nvm alias default 22

  # Re-activate corepack for the new Node version
  corepack enable
```

**추가:** bootstrap 완료 후 안내 메시지에 쉘 재시작 경고 추가

```diff
  echo "Setup complete! Run: pnpm dev"
+ echo ""
+ echo "  ⚠ Node.js 22가 nvm default로 설정되었습니다."
+ echo "  ⚠ 현재 터미널에서 바로 pnpm dev를 실행하려면:"
+ echo "    nvm use 22 && pnpm dev"
+ echo "  또는 새 터미널을 열어주세요."
  echo "  API  → http://localhost:3001"
  echo "  Web  → http://localhost:5173"
```

### Fix 2: `package.json` — engines 필드 추가 (High)

**파일:** `package.json` (root)

```diff
  "packageManager": "pnpm@9.15.9",
+ "engines": {
+   "node": ">=22.0.0"
+ },
```

**파일:** `.npmrc` (root, 신규 생성 또는 수정)

```
engine-strict=true
```

이렇게 하면 Node 22 미만에서 `pnpm install` 시 에러 발생.

### Fix 3: dev 스크립트 — Node 버전 사전 검증 (Medium)

**파일:** `package.json` (root)

```diff
- "dev": "turbo dev",
+ "dev": "node -e \"if(+process.versions.node.split('.')[0]<22){console.error('ERROR: Node 22+ required. Current: '+process.version+'\\nRun: nvm use 22');process.exit(1)}\" && turbo dev",
```

또는 별도 스크립트 파일(`scripts/check-node.sh`):

```bash
#!/usr/bin/env bash
MAJOR=$(node -e 'console.log(process.versions.node.split(".")[0])')
if [ "$MAJOR" -lt 22 ]; then
  echo "ERROR: Node.js 22+ required. Current: $(node -v)"
  echo "Run: nvm use 22"
  exit 1
fi
```

```diff
- "dev": "turbo dev",
+ "dev": "bash scripts/check-node.sh && turbo dev",
```

### Fix 4: 좀비 프로세스 정리 가이드 (Low)

즉시 해결:

```bash
# 좀비 Vite 프로세스 종료
kill 10777

# 또는 포트 5173 점유 프로세스 전체 종료
lsof -ti :5173 | xargs kill -9
```

장기 개선 — `scripts/setup.sh`에 기존 프로세스 정리 로직 추가:

```bash
# Kill any existing dev servers on our ports
for port in 5173 3001; do
  pid=$(lsof -ti :$port 2>/dev/null)
  if [ -n "$pid" ]; then
    echo "Killing existing process on port $port (PID: $pid)"
    kill $pid 2>/dev/null
  fi
done
```

---

## Immediate Workaround (지금 바로 해결하는 방법)

```bash
# 1. 좀비 프로세스 종료
kill 10777

# 2. 현재 turbo dev 종료 (Ctrl+C)

# 3. Node 22 활성화
nvm use 22

# 4. 다시 시작
pnpm dev
```

---

## Summary

| #   | Issue                              | Severity     | Fix                                            |
| --- | ---------------------------------- | ------------ | ---------------------------------------------- |
| 1   | Vite 프로세스 시작 후 자동 종료    | **Critical** | Node 버전 일치시키면 해결 (Fix 1, 3)           |
| 2   | Node.js 20 ↔ 22 버전 불일치        | **Critical** | setup.sh에 `nvm alias default 22` 추가 (Fix 1) |
| 3   | engines 필드 부재로 버전 검증 없음 | **High**     | package.json에 engines 추가 (Fix 2)            |
| 4   | 이전 세션 좀비 Vite가 5173 점유    | **Medium**   | 프로세스 정리 + 포트 충돌 방지 (Fix 4)         |

---

## Implementation Plan

### Phase 1: Node 버전 강제 — 다른 환경 재발 방지 (3 files)

방어선을 3단계로 구축하여 어떤 환경에서든 Node 22 미만 실행을 차단한다.

#### Step 1-1. `package.json` — engines 필드 추가

`pnpm install` 시점에 Node 버전 미달이면 설치 자체를 차단.

**파일:** `package.json` (root)

```diff
  "packageManager": "pnpm@9.15.9",
+ "engines": {
+   "node": ">=22.0.0"
+ },
  "scripts": {
```

#### Step 1-2. `.npmrc` — engine-strict 신규 생성

pnpm은 기본적으로 engines를 경고만 하므로, strict 모드로 에러 전환.

**파일:** `.npmrc` (root, 신규 생성)

```
engine-strict=true
```

#### Step 1-3. `scripts/setup.sh` — nvm alias default 22 추가

bootstrap 서브셸이 종료된 후에도 Node 22가 default로 유지되도록 수정.

**파일:** `scripts/setup.sh` — `ensure_node_22()` 함수 내부

```diff
  echo "Installing Node.js 22 via nvm..."
  nvm install 22
  nvm use 22
+ nvm alias default 22

  # Re-activate corepack for the new Node version
  corepack enable
```

### Phase 2: 런타임 Node 버전 검증 스크립트 (2 files)

engines + .npmrc는 `pnpm install` 시점만 방어한다.
`pnpm dev`를 직접 실행하는 경우도 방어하기 위해 런타임 체크를 추가.

#### Step 2-1. `scripts/check-node.sh` — 신규 생성

**파일:** `scripts/check-node.sh` (신규)

```bash
#!/usr/bin/env bash
set -euo pipefail

REQUIRED_MAJOR=22
CURRENT=$(node -v 2>/dev/null || echo "none")

if [ "$CURRENT" = "none" ]; then
  echo "ERROR: Node.js not found. Install Node.js $REQUIRED_MAJOR+ first."
  exit 1
fi

MAJOR=$(node -e 'console.log(process.versions.node.split(".")[0])')

if [ "$MAJOR" -lt "$REQUIRED_MAJOR" ]; then
  echo ""
  echo "ERROR: Node.js $REQUIRED_MAJOR+ required (current: $CURRENT)"
  echo ""
  echo "Fix:"
  echo "  nvm use $REQUIRED_MAJOR    # .nvmrc exists in project root"
  echo ""
  exit 1
fi
```

#### Step 2-2. `package.json` — dev/build 스크립트에 체크 연결

**파일:** `package.json` (root)

```diff
- "dev": "turbo dev",
+ "dev": "bash scripts/check-node.sh && turbo dev",
- "build": "turbo build",
+ "build": "bash scripts/check-node.sh && turbo build",
```

### Phase 3: setup.sh 완료 메시지 개선 (1 file)

#### Step 3-1. `scripts/setup.sh` — 안내 메시지 보강

**파일:** `scripts/setup.sh` — defaults 모드 완료 메시지 (line 155-158)

```diff
  echo ""
- echo "Setup complete! Run: pnpm dev"
- echo "  API  → http://localhost:3001"
- echo "  Web  → http://localhost:5173"
+ echo "Setup complete!"
+ echo ""
+ echo "  Node.js 22 has been set as nvm default."
+ echo "  If this terminal still uses an older version, run:"
+ echo "    nvm use 22"
+ echo ""
+ echo "  Start dev server:"
+ echo "    pnpm dev"
+ echo ""
+ echo "  API  → http://localhost:3001"
+ echo "  Web  → http://localhost:5173"
```

**파일:** `scripts/setup.sh` — interactive 모드 완료 메시지 (line 203-212)

```diff
  if [ "$mode_choice" = "1" ]; then
    echo "Next steps:"
+   echo "  nvm use 22                                # if not already active"
    echo "  docker compose up -d"
    echo "  pnpm --filter @context-sync/api migrate"
    echo "  pnpm dev"
  else
    echo "Next steps:"
+   echo "  nvm use 22                                # if not already active"
    echo "  pnpm --filter @context-sync/api migrate"
    echo "  pnpm dev"
  fi
```

### Phase 4: 포트 충돌 방어 (1 file)

#### Step 4-1. `scripts/setup.sh` — dev 서버 시작 전 포트 정리

`pnpm dev` 실행 전이 아니라, bootstrap 시작 시점에 기존 dev 프로세스를 정리.

**파일:** `scripts/setup.sh` — `ensure_node_22` 호출 직후 (line 79 이후)

```diff
  ensure_node_22

+ # ── Kill stale dev servers on default ports ─────────────────────────────
+ for port in 5173 3001; do
+   pid=$(lsof -ti :"$port" 2>/dev/null || true)
+   if [ -n "$pid" ]; then
+     echo "Killing stale process on port $port (PID: $pid)"
+     kill "$pid" 2>/dev/null || true
+   fi
+ done
+
  # Check pnpm
```

### Phase 5: test-quickstart.sh 포트 하드코딩 수정 (1 file)

`test-quickstart.sh`도 포트 5173을 하드코딩하고 있어서, fallback 포트 시 실패함.

#### Step 5-1. `scripts/test-quickstart.sh` — 다중 포트 탐색

**파일:** `scripts/test-quickstart.sh` — Web 서버 대기 로직 (line 88-99)

```diff
  # Web 서버 대기 (최대 30초)
  echo "  Waiting for Web server..."
+ WEB_PORT=""
  for i in $(seq 1 30); do
-   if curl -sf http://localhost:5173 >/dev/null 2>&1; then
-     echo "  ✓ Web ready (http://localhost:5173)"
-     break
-   fi
+   for port in 5173 5174 5175; do
+     if curl -sf "http://localhost:$port" >/dev/null 2>&1; then
+       WEB_PORT=$port
+       break 2
+     fi
+   done
    if [ "$i" -eq 30 ]; then
      echo "FAIL: Web server timeout (30s)"
      exit 1
    fi
    sleep 1
  done
+ echo "  ✓ Web ready (http://localhost:$WEB_PORT)"
```

---

## Implementation Checklist

| Phase | Step | File                         | Action                         | Priority |
| ----- | ---- | ---------------------------- | ------------------------------ | -------- |
| 1     | 1-1  | `package.json`               | engines 필드 추가              | Critical |
| 1     | 1-2  | `.npmrc`                     | 신규 생성, engine-strict=true  | Critical |
| 1     | 1-3  | `scripts/setup.sh`           | `nvm alias default 22` 추가    | Critical |
| 2     | 2-1  | `scripts/check-node.sh`      | 신규 생성                      | High     |
| 2     | 2-2  | `package.json`               | dev/build 스크립트에 체크 연결 | High     |
| 3     | 3-1  | `scripts/setup.sh`           | 완료 메시지 개선               | Medium   |
| 4     | 4-1  | `scripts/setup.sh`           | 포트 정리 로직 추가            | Medium   |
| 5     | 5-1  | `scripts/test-quickstart.sh` | 다중 포트 탐색                 | Low      |

## Verification

구현 완료 후 아래 시나리오로 검증:

```bash
# 1. Node 20 환경에서 install 차단 확인
nvm use 20
pnpm install          # → ERROR: engines check failed (expected)

# 2. Node 20 환경에서 dev 차단 확인
pnpm dev              # → ERROR: Node.js 22+ required (expected)

# 3. Node 22 환경에서 정상 동작 확인
nvm use 22
pnpm dev              # → API :3001 + Web :5173 정상 기동

# 4. QuickStart 전체 플로우 확인 (clean 환경)
pnpm test:quickstart  # → 전체 통과
```
