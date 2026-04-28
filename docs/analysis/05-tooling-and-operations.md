# 툴링, 의존성, 운영 준비도

## 1. 기술 스택

현재 스택은 다음 조합으로 요약된다.

- Vite 6
- React
- react-router
- Tailwind CSS v4
- shadcn/ui + Radix UI
- lucide-react
- sonner
- motion

성격

- 빠르게 시안을 만들기 좋은 조합
- 정적 콘텐츠와 컴포넌트 중심 UI 제작에 적합
- 그러나 운영 준비를 위한 도구는 아직 얕다

## 2. 빌드 체인

핵심 파일

- `index.html`
- `src/main.tsx`
- `src/app/App.tsx`
- `vite.config.ts`
- `postcss.config.mjs`
- `tsconfig.json`

특징

- 표준적인 Vite SPA 구조
- Tailwind v4를 Vite 플러그인으로 연결
- PostCSS는 사실상 비어 있음
- TypeScript는 번들러 친화적이지만 엄격하지 않음

`tsconfig.json` 상태

- `strict: false`
- `noUnusedLocals: false`
- `noUnusedParameters: false`

즉, 타입 시스템은 개발 보조 수준이고 품질 게이트 역할은 약하다.

검증 결과

- `2026-03-25` 기준 `npm ci`는 정상 완료됐다.
- `2026-03-25` 기준 `npm run build`도 정상 완료됐다.
- 하지만 production 빌드에서 메인 JS 청크가 약 `820.71 kB`까지 커져 Vite의 chunk size 경고가 발생했다.

이 경고는 지금 당장 빌드 실패를 의미하지는 않지만, `routes.tsx`의 정적 import 구조와 큰 public/member 페이지 수를 생각하면 실제 초기 로딩 성능 저하로 이어질 가능성이 높다.

## 3. 의존성 상태

실제로 많이 쓰이는 계층

- react-router
- lucide-react
- shadcn/Radix wrappers
- Tailwind
- sonner
- motion

과대 설치 가능성이 보이는 의존성

- `@emotion/react`
- `@emotion/styled`
- `@mui/material`
- `@mui/icons-material`
- `@popperjs/core`
- `react-dnd`
- `react-dnd-html5-backend`
- `react-popper`
- `react-slick`
- `date-fns`

해석

- Figma Make가 생성한 흔적이 남아 있을 가능성이 높다.
- 현재 코드 기준으로는 제거 후보가 적지 않다.

## 4. 메타 설정의 어색한 지점

### React 선언 위치

`react`, `react-dom`이 직접 의존성이라기보다 `optional peerDependencies`로 들어가 있다. 현재 lock 파일 때문에 npm 기준 설치는 되겠지만, 선언 방식은 일반적인 앱 구조와 다르다.

### 테마 시스템 미완결

`next-themes`가 있으나 루트에 `ThemeProvider`가 없다. 일부 코드가 테마 존재를 가정하지만 시스템이 완결되어 있지 않다.

### 자산 사용률 낮음

로컬 이미지 4개 중 실제 참조는 제한적이다. 반면 실제 화면은 Unsplash 원격 이미지를 많이 쓴다.

## 5. 문서화 상태

현재 문서화는 매우 얕다.

- `README.md`: 실행법만 있음
- `guidelines/Guidelines.md`: 사실상 빈 템플릿
- `ATTRIBUTIONS.md`: shadcn 관련 출처 수준

결과

- 새 작업자가 구조를 이해하기 어렵다.
- 어떤 규칙을 따라야 하는지 문서로는 판단할 수 없다.
- 코드가 곧 가이드라인 역할을 대신하고 있다.

## 6. 배포와 품질관리 공백

없는 것들

- CI 설정
- 테스트
- lint
- typecheck 스크립트
- preview 스크립트
- 배포 설정 파일
- Dockerfile
- GitHub Actions

이 구조는 개인 시안 단계에서는 문제없지만, 팀 협업과 배포 단계에서는 곧 병목이 된다.

## 7. 협업 리스크

### `.gitignore`가 너무 얕음

현재 `.gitignore`는 사실상 `node_modules`만 제외한다. `dist`, 로그, 에디터 파일, 환경 파일이 쉽게 유입될 수 있다.

### 패키지 매니저 정책 혼재

- README는 npm 기준
- lock 파일은 npm
- `package.json`에는 pnpm override 존재

이 상태는 팀원별 재현성 차이를 만들 수 있다.

### 언어 메타 불일치

- 실제 콘텐츠는 한국어 중심
- `index.html`의 `lang`은 `en`
- README도 한국어 프로젝트 치고 너무 빈약

접근성, SEO, 협업 온보딩 관점에서 모두 손해다.

## 8. 운영 준비도 총평

현재 이 레포는 "코드를 보여주기 위한 데모"로는 충분하지만, "배포와 협업을 견디는 운영 레포"로 보기는 어렵다.

우선순위

1. 스크립트와 품질 게이트 추가
2. 배포 전략 확정
3. `.gitignore` 정비
4. README와 가이드라인 보강
5. 의존성 정리
