# 문서화 운영 규칙

점검일: 2026-05-06

이 문서는 KOBOT Web에서 기능을 추가하거나 권한을 바꿀 때 문서를 어떻게 같이 관리할지 정한다. 목적은 "코드는 있는데 운영 기준이 없는 상태"를 막는 것이다.

## 단일 진리원천

| 문서 | 책임 |
| --- | --- |
| `docs/product/feature-permission-register.md` | 전체 기능, 경로, 권한, 데이터, RPC, 감사 기록의 운영 등록부 |
| `docs/product/CHANGE_CHECKLIST.md` | 변경 전후 점검 절차 |
| `docs/product/tag-system.md` | 태그, 권한, 메뉴, 소속 표시의 기준 |
| `docs/product/member-status.md` | 가입 lifecycle 상태 기준 |
| `docs/product/projects.md` | 프로젝트 생성, 승인, 반려, 참여, 설정의 현재 정책 |
| `docs/product/project-study-development.md` | 프로젝트 작업공간과 스터디 기록의 도메인 설계 |
| `docs/product/notifications.md` | 알림 type, CTA, 원본 이벤트 연결 |
| `docs/ddd/03-capability-and-permission-model.md` | 장기 capability/scope 모델 |
| `SECURITY_AUDIT_*.md` | 보안 점검 결과와 남은 위험 |

## 기능 변경 시 문서 체크

기능을 추가하거나 권한을 바꾸면 아래 질문에 답하고 문서에 남긴다.

| 질문 | 기록 위치 |
| --- | --- |
| 어떤 사용자가 이 기능을 보는가? | 기능-권한 운영 등록부 |
| 어떤 사용자가 저장/승인/삭제할 수 있는가? | 기능-권한 운영 등록부, 도메인 문서 |
| 프론트 버튼 숨김 말고 DB/RPC에서 막는가? | 도메인 문서, 마이그레이션 |
| 어떤 테이블/스토리지 버킷이 소유 데이터인가? | 기능-권한 운영 등록부 |
| 상태 전이가 있는가? | 도메인 문서, DDD workflow |
| 알림이 생기는가? | `notifications.md` |
| 감사 로그나 보안 이벤트가 남는가? | 기능-권한 운영 등록부, 보안 감사 문서 |
| 미구현/위험/정책 결정 대기가 있는가? | 기능-권한 운영 등록부의 남은 정책 위험 |

## 변경 유형별 필수 문서

| 변경 유형 | 반드시 수정 |
| --- | --- |
| 새 페이지 추가 | `feature-permission-register.md`, `routes.tsx` 기준 권한 표 |
| 새 메뉴 추가 | `feature-permission-register.md`, `tag-system.md`, `nav-catalog.ts`와 대조 |
| 새 DB 테이블 | 도메인 문서, RLS/권한 표, 마이그레이션 설명 |
| 새 RPC | 기능 등록부의 주요 RPC, 감사/알림 여부 |
| 승인/반려/상태 전이 | 도메인 문서, 이벤트/알림 문서 |
| 파일 업로드 | 기능 등록부, 보안 감사 문서, storage bucket 정책 |
| 외부 연동 | 기능 등록부, 보안 감사 문서, token/secret 보관 정책 |
| UI-only 목업 제거 또는 실제 기능화 | 기능 등록부의 상태 변경 |

## PR/커밋 전 문서 기준

1. `npm run build` 통과 여부를 기록한다.
2. 기능이 실제 구현이면 `상태`를 `구현됨`으로 바꾼다.
3. 화면만 있고 데이터가 없으면 `부분 구현` 또는 `준비중`으로 남긴다.
4. 권한이 UI에만 있으면 `남은 위험`에 적고 DB/RPC 보강 이슈로 남긴다.
5. 마이그레이션이 있으면 어떤 함수/테이블이 생겼는지 문서에 적는다.
6. 알림 type이 생기면 CTA와 원본 테이블을 같이 적는다.
7. 보안 이벤트가 생기면 누가 조회할 수 있는지 적는다.

## 문서 미갱신을 막는 규칙

새 기능 작업이 아래 중 하나라도 해당하면 문서 변경이 없으면 미완료로 본다.

| 조건 | 이유 |
| --- | --- |
| 새 route 추가 | 사용자가 접근 가능한 표면이 늘어남 |
| 새 permission 문자열 추가 | 운영자가 권한 의미를 알아야 함 |
| 새 RLS policy 또는 RPC 추가 | 최종 권한 판정 위치가 바뀜 |
| 새 notification type 추가 | 수신자와 CTA가 바뀜 |
| 새 storage bucket 또는 파일 URL 저장 | 개인정보/비공개 파일 노출 위험 |
| project/study/member/tag 도메인 변경 | 권한과 상태가 엮여 있어 회귀 위험이 큼 |

## 현재 문서 부채

| 항목 | 처리 |
| --- | --- |
| 일부 Coming Soon 메뉴의 실제 정책 미정 | 기능 등록부에 `준비중`으로 표시. 실제 구현 시 도메인 문서 필요 |
| 공간 예약 삭제 권한 정책 상세 부족 | DB policy와 UI CTA 점검 후 문서 보강 |
| GitHub 조직/README 자동화 미구현 | `integrations` 도메인 문서와 별도 DB 설계 필요 |
| 전역 검색 미연결 | 검색 대상별 RLS 재검증 설계 필요 |
