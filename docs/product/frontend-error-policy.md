# Frontend Error Display Policy

사용자 화면에 노출되는 오류 문구는 제품 문장이어야 한다. 운영/개발자가 디버깅할 내부 식별자는 브라우저 UI에 그대로 보여 주지 않는다.

## 금지

- DB 테이블, 컬럼, 함수, RPC, RLS, 정책 이름
- Supabase/PostgREST/Postgres 에러 코드
- SQL 마이그레이션 파일명
- `.env`, 토큰, 키, 세션, schema cache 같은 인프라 용어
- 원본 `error.message`를 그대로 `setError()`에 넣는 코드

## 필수 패턴

```ts
setError(sanitizeUserError(error, "작업을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요."));
```

내부 원인이 마이그레이션 미적용이어도 사용자에게는 다음처럼 말한다.

```ts
"서버 설정이 아직 반영되지 않아 저장할 수 없습니다. 잠시 후 다시 시도하거나 운영 설정을 확인해 주세요."
```

개발자용 원인은 문서, 마이그레이션 파일, 코드 주석에 남기고 사용자 경고 박스에는 넣지 않는다.

