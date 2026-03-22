# 리모트 DB 전환 기능 검증 체크리스트

## 1. Dev 서버 띄우기

```bash
pnpm dev
```

API(:3001) + Web(:5173) 시작 후 아래 항목 확인.

---

## 2. UI 확인

1. `http://localhost:5173` 접속 → 로그인 → 프로젝트 선택
2. **Settings 페이지** 이동
3. 확인 포인트:
   - [ ] **Remote Database** 카드가 `Project Info` 아래에 보이는지
   - [ ] **"Connect Remote Database"** 버튼 클릭 → 4단계 위저드 모달 열리는지
   - [ ] **Collaborators** 섹션에 "Connect a remote database..." 안내 메시지 표시되는지 (초대 input이 숨겨져야 함)

---

## 3. API 직접 테스트

```bash
# 로그인 토큰 획득
TOKEN=$(curl -s http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@test.com","name":"Test"}' | jq -r '.data.token')

# 프로젝트 ID 확인
curl -s http://localhost:3001/api/projects \
  -H "Authorization: Bearer $TOKEN" | jq '.data[0].id'

PROJECT_ID="<위에서 나온 ID>"
```

- [ ] DB config 조회 → `null` 반환

```bash
curl -s http://localhost:3001/api/projects/$PROJECT_ID/db-config \
  -H "Authorization: Bearer $TOKEN" | jq
```

- [ ] 연결 테스트 (실제 DB URL 필요)

```bash
curl -s http://localhost:3001/api/projects/$PROJECT_ID/db-config/test \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"connectionUrl":"postgresql://...","provider":"supabase","sslEnabled":true}' | jq
```

- [ ] 마이그레이션 미리보기 → 세션/메시지/충돌 카운트 반환

```bash
curl -s http://localhost:3001/api/projects/$PROJECT_ID/db-config/migrate/preview \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## 4. Collaborator 차단 확인

- [ ] 리모트 DB 없이 초대 시도 → 403 에러

```bash
curl -s http://localhost:3001/api/projects/$PROJECT_ID/invitations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"collab@test.com"}' | jq
# 기대: "Remote DB must be configured before inviting collaborators"
```

---

## 5. 전체 플로우 (Supabase 등 실제 리모트 DB가 있을 때)

1. [ ] Settings → "Connect Remote Database" 클릭
2. [ ] Provider: Supabase 선택 → connection string 입력 → **Test Connection** → 성공
3. [ ] **Next** → 마이그레이션 미리보기 (세션/메시지 카운트 확인)
4. [ ] **Start Migration** → 프로그레스 바 진행 → 완료
5. [ ] Collaborators 섹션 → 초대 input 활성화 확인
6. [ ] 이메일 입력 → Invite → 초대 성공

> 리모트 DB가 없으면 **1~4번(Collaborator 차단)**까지만 확인 가능.
