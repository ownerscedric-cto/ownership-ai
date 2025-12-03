# 개발 필수 체크리스트

**⚠️ 중요**: 모든 개발 작업은 이 체크리스트를 **반드시** 따라야 합니다.

---

## 📋 작업 시작 전 (MANDATORY)

### 1. 프레임워크 문서 확인

- [ ] **CURRENT_PHASE.md** - 현재 단계와 ISSUE 확인
- [ ] **PRINCIPLES.md** - 개발 원칙 확인 (SOLID, DRY, 표준 응답 형식)
- [ ] **RULES.md** - 파일 작업 규칙 확인 (Read before Write/Edit, 절대 경로)

### 2. 작업 계획

- [ ] **TodoWrite** 도구로 작업 계획 수립
- [ ] 복잡도와 단계 파악
- [ ] 의존성 확인

---

## 💻 코드 작성 중 (MANDATORY)

### API 개발 시

- [ ] **표준 응답 형식** 사용 (`successResponse`, `errorResponse`)
  ```typescript
  // Success: { success: true, data: {...}, metadata?: { total, page, limit } }
  // Error: { success: false, error: { code, message, details? } }
  ```
- [ ] **Zod 스키마** 검증 적용
- [ ] **인증/권한 체크** 구현
- [ ] **에러 처리**: Fail Fast, Context Preservation
- [ ] **Prisma ORM** 사용 (SQL Injection 방지)

### 파일 작업 시

- [ ] **Read before Write/Edit** - 항상 Read 도구 먼저 사용
- [ ] **절대 경로** 사용 (상대 경로 금지)
- [ ] **Batch Operations** - 독립적인 작업은 병렬 처리

### 프론트엔드 개발 시

- [ ] **shadcn/ui** + **TailwindCSS** 사용
- [ ] **react-hook-form** + **Zod** 검증
- [ ] **React Query** 상태 관리
- [ ] **Skeleton UI** 로딩 상태
- [ ] **Error Boundary** 에러 처리
- [ ] **모바일 반응형** (sm, md, lg breakpoints)

---

## ✅ 작업 완료 전 (MANDATORY)

### Quality Gates (ORCHESTRATOR.md 8단계)

1. [ ] **Syntax** - 문법 오류 없음
2. [ ] **Type Check** - TypeScript 타입 오류 없음
3. [ ] **Lint** - ESLint 경고 없음
4. [ ] **Security** - OWASP Top 10 확인
5. [ ] **Test** - 주요 기능 테스트 (수동 또는 자동)
6. [ ] **Performance** - 응답 시간 확인
7. [ ] **Documentation** - 주석 및 문서 업데이트
8. [ ] **Integration** - 다른 모듈과의 통합 확인

### 최종 검증

```bash
# 1. Lint 체크
npm run lint

# 2. Type 체크
npx tsc --noEmit

# 3. 빌드 확인
npm run build

# 4. Dev 서버 확인
npm run dev
```

### TodoWrite 업데이트

- [ ] 완료된 작업은 **즉시** `completed` 상태로 변경
- [ ] 새로 발견된 작업은 추가
- [ ] 불필요한 작업은 제거

---

## 🚨 절대 금지 사항

- ❌ **프레임워크 문서를 확인하지 않고 작업 시작**
- ❌ **Read 없이 Write/Edit 사용**
- ❌ **표준 응답 형식 미준수**
- ❌ **Zod 검증 생략**
- ❌ **인증/권한 체크 생략**
- ❌ **Quality Gates 생략**
- ❌ **명시적 요청 없이 자동 커밋**

---

## 📝 세션 시작 시 확인 사항

**새 세션이 시작되면 가장 먼저 이 파일을 읽으세요!**

1. `.claude/CURRENT_PHASE.md` - 현재 진행 상황
2. `.claude/DEVELOPMENT_CHECKLIST.md` (이 파일) - 개발 가이드라인
3. `.claude/PRINCIPLES.md` - 핵심 원칙
4. `.claude/RULES.md` - 실행 규칙

---

## 🎯 핵심 원칙 요약

**"Evidence > assumptions | Code > documentation | Efficiency > verbosity"**

- **Read before Write/Edit** - 항상
- **표준 응답 형식** - 항상
- **Fail Fast** - 조기 에러 반환
- **Quality Gates** - 8단계 검증
- **프레임워크 우선** - SuperClaude 가이드라인이 최우선

---

## 📚 참고 문서

### 프로젝트 로컬 설정 (.claude/) - **우선 참조**

**⚠️ 프로젝트별 상세 가이드라인이 있으므로 이 문서들을 우선 참조:**

- `CLAUDE.md` - 프로젝트 진입점, 자동 로드 파일 정의
- `PRINCIPLES.md` - **Production SaaS 원칙**, 디자인 시스템, TypeScript 규칙
- `RULES.md` - **Phase 진행 추적**, 컴포넌트 아키텍처, API 표준
- `ORCHESTRATOR.md` - Quality Gates
- `CURRENT_PHASE.md` - 프로젝트 진행 상황 및 ISSUE 추적
- `DEVELOPMENT_CHECKLIST.md` - 이 파일 (개발 가이드라인)

### 글로벌 SuperClaude 프레임워크 (~/.claude/)

Claude Code가 자동으로 로드하는 사용자 글로벌 설정:

- `~/.claude/PRINCIPLES.md` - 개발 원칙 (SOLID, DRY, 보안, 테스트)
- `~/.claude/RULES.md` - 실행 규칙 (파일 작업, 프레임워크 준수)
- `~/.claude/ORCHESTRATOR.md` - Quality Gates, 라우팅
- `~/.claude/MCP.md` - MCP 서버 통합
- `~/.claude/PERSONAS.md` - 페르소나 시스템
- `~/.claude/MODES.md` - 운영 모드
- `~/.claude/COMMANDS.md` - 슬래시 명령어
- `~/.claude/FLAGS.md` - 플래그 시스템

---

**마지막 업데이트**: 2025-01-21
**다음 리뷰**: Phase 3 시작 전
