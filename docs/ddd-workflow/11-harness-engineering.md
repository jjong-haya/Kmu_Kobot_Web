# 11. 하네스 엔지니어링

<!-- encoding-check: ignore-mojibake -->

## 1. 정의

### 1.1 KOBOT 프로젝트에서의 의미

하네스 엔지니어링은 AI 또는 자동화가 실제 개발 환경에서 안전하게 실행되도록 감싸는 실행 규칙, 검사기, 검증 루프, 복구 루틴을 설계하는 일입니다.

모델이 “무엇을 할지” 결정한다면, 하네스는 “어떻게 안전하게 실행할지”를 통제합니다.

### 1.2 하네스가 담당하는 것

| 영역 | 예시 |
| --- | --- |
| 실행 전 검사 | 명령 길이, 경로, 인코딩, 환경변수 |
| 실행 방식 선택 | apply_patch, 파일별 write, script file, browser tool |
| 실행 중 제한 | destructive command 금지, scope 확인, approval 필요 여부 |
| 실행 후 검증 | build, test, browser smoke, SQL review |
| 실패 복구 | 같은 실패 형태 재시도 금지, 전략 전환 |

## 2. 실제 외부 사례

### 2.1 Coding agent eval harness

Promptfoo의 coding agent eval 문서는 일반 LLM 평가와 agent 평가가 다르다고 설명합니다. agent는 파일 읽기, 명령 실행, 반복 관찰을 하기 때문에 “모델만”이 아니라 agent harness 전체를 평가해야 합니다.

참고:

- [Promptfoo - Evaluate Coding Agents](https://www.promptfoo.dev/docs/guides/evaluate-coding-agents/)
- [Promptfoo - Red Team Coding Agents](https://www.promptfoo.dev/docs/red-team/coding-agents/)

### 2.2 Agent execution harness

Microsoft Agent Framework는 Agent Harness를 모델 추론과 실제 실행 사이의 계층으로 설명합니다. shell, filesystem, approval, context management가 여기에 들어갑니다.

참고:

- [Microsoft Agent Framework - Agent Harness](https://devblogs.microsoft.com/agent-framework/agent-harness-in-agent-framework)

### 2.3 Eval framework

OpenAI Evals는 LLM 및 LLM 기반 시스템을 평가하는 framework입니다. KOBOT에서는 UI/권한/DB 변경이 반복될 때 회귀 방지 eval harness로 응용할 수 있습니다.

참고:

- [OpenAI Evals GitHub](https://github.com/openai/evals)

### 2.4 CI/CD evaluation harness

LangSmith는 eval을 PR 또는 nightly build에서 돌릴 수 있는 구조를 제공합니다. KOBOT에서는 로그인 플로우, 권한 플로우, 개인정보 문구 검증을 CI check처럼 만들 수 있습니다.

참고:

- [LangSmith Evaluation](https://www.langchain.com/langsmith/evaluation)

### 2.5 Execution-layer security harness

agentsh는 agent 또는 harness 아래에 두는 실행 보안 계층을 표방합니다. shell 실행과 보안 경계를 하네스의 일부로 보는 사례입니다.

참고:

- [agentsh](https://www.agentsh.org/)

### 2.6 PowerShell encoding

Microsoft 문서는 PowerShell 6 이상이 기본적으로 UTF-8 no BOM을 사용하고, Windows PowerShell 5.1과 BOM 처리에서 차이가 있음을 설명합니다.

참고:

- [Microsoft Learn - about_Character_Encoding](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_character_encoding)

## 3. KOBOT에 만든 하네스

### 3.1 Windows Harness Safe Ops Skill

위치:

```text
C:\Users\jongh\.codex\skills\windows-harness-safe-ops
```

역할:

- 긴 명령 사전 차단
- UTF-8/한글 깨짐 검사
- 안전한 UTF-8 파일 쓰기
- 다중 파일 생성 규칙
- 하네스 카탈로그 제공

### 3.2 명령 길이 하네스

| 기준 | 처리 |
| --- | --- |
| 6,000자 이상 | 분할 권장 |
| 8,000자 이상 | 단일 명령 금지 |

스크립트:

```powershell
python C:\Users\jongh\.codex\skills\windows-harness-safe-ops\scripts\check_command_length.py --file command.txt
```

### 3.3 UTF-8/한글 깨짐 하네스

스크립트:

```powershell
python C:\Users\jongh\.codex\skills\windows-harness-safe-ops\scripts\check_text_encoding.py --path docs
```

탐지:

- invalid UTF-8
- BOM
- U+FFFD replacement character
- `Ã`, `Â`, `â€`류 mojibake
- `?뱀`, `?쒖`, `?댄`류 한글 깨짐
- 일부 CP949/UTF-8 오해 패턴

### 3.4 안전한 UTF-8 쓰기 하네스

스크립트:

```powershell
python C:\Users\jongh\.codex\skills\windows-harness-safe-ops\scripts\safe_write_utf8.py --path out.md --from-file draft.md
```

용도:

- PowerShell here-string 대신 deterministic write
- UTF-8 no BOM 기본
- temp file 후 replace

## 4. KOBOT에 추가하면 좋은 하네스

### 4.1 Supabase migration harness

1. migration 작성 전 affected table/RLS/RPC 목록 생성.
2. 상태 전이가 direct update인지 RPC인지 검사.
3. 감사 로그 redaction 여부 검사.
4. rollback plan 작성.
5. local/staging SQL review.

### 4.2 OAuth auth-flow harness

1. 로그인 시작 origin 기록.
2. callback origin 기록.
3. Supabase Redirect URL 확인.
4. Google OAuth redirect URI 확인.
5. `pending`, `active`, `rejected`, `wrong account`, `cancel` 시나리오 테스트.

### 4.3 Browser smoke harness

1. dev server 실행.
2. `/login`, `/member/join`, `/member/pending`, `/member` 접근.
3. desktop/mobile screenshot.
4. raw technical error 노출 여부 확인.

### 4.4 Git safety harness

1. `git status --short`
2. `git diff --stat`
3. `.env`, secret, token stage 여부 검사.
4. build 후 commit.

### 4.5 UX copy harness

1. 사용자 화면에서 `Supabase`, `PKCE`, `/member`, `callback` 같은 개발자 용어 탐지.
2. pending 화면 CTA whitelist 검사.
3. 로그인/가입/제한 상태 문구 검사.

## 5. 다음 액션

### 5.1 즉시 적용

- 긴 문서 작업 전 `windows-harness-safe-ops` 사용.
- 한글 문서 생성 후 `check_text_encoding.py` 실행.
- 여러 파일 생성은 한 명령으로 쓰지 않기.

### 5.2 후속 개발

- `scripts/check_kobot_secrets.py`
- `scripts/check_oauth_redirects.py`
- `scripts/check_ux_copy.py`
- `scripts/check_supabase_migration_safety.py`
- `scripts/browser_smoke_plan.py`
