# Web Final 분석 문서

이 폴더는 `2026-03-25` 기준 `Web_final` 코드베이스를 정적 분석한 결과를 주제별로 나눈 문서 모음이다.

분석 범위

- 레포 구조와 라우팅
- public 페이지군
- member 페이지군
- 디자인 시스템과 UI 컴포넌트 계층
- 빌드 체인, 의존성, 협업 메타
- 리스크와 우선순위

분석 방식

- 메인 에이전트가 레포 전체 구조와 핵심 엔트리 파일을 확인했다.
- 병렬 서브 에이전트가 `public`, `member`, `UI/스타일`, `tooling` 영역을 나눠 읽었다.
- 초기 문서는 정적 코드 독해 기준으로 작성했다.
- 이후 `npm ci`와 `npm run build`를 실행해 최소 빌드 검증까지 확인했다.

문서 목록

- [01-overview-and-architecture.md](./01-overview-and-architecture.md)
- [02-public-experience.md](./02-public-experience.md)
- [03-member-workspace.md](./03-member-workspace.md)
- [04-design-system-and-ui.md](./04-design-system-and-ui.md)
- [05-tooling-and-operations.md](./05-tooling-and-operations.md)
- [06-risks-and-priorities.md](./06-risks-and-priorities.md)
- [07-dashboard-development-plan.md](./07-dashboard-development-plan.md)

핵심 요약

- 이 프로젝트는 `Figma Make` 산출물을 기반으로 한 `Vite + React + react-router + Tailwind v4 + shadcn/Radix` SPA다.
- 라우팅은 `public`과 `member`로 명확히 분리되어 있지만, 데이터 계층과 인증 계층은 거의 비어 있다.
- public 영역은 홍보성 랜딩과 아카이브 성격이 강하고, member 영역은 정보 구조가 넓지만 실행 가능한 기능보다 시안과 목업의 비중이 높다.
- 디자인 시스템은 `theme.css`와 `components/ui`가 사실상의 기준 문서 역할을 하고 있다.
- 협업 문서, 배포 설정, CI, 타입 엄격성, 테스트 체계는 거의 준비되어 있지 않다.

검증 메모

- `2026-03-25` 기준 `npm ci` 성공
- `2026-03-25` 기준 `npm run build` 성공
- 단, 빌드 결과로 생성된 JS 번들은 약 `820.71 kB`이며 Vite chunk size 경고가 발생했다.
