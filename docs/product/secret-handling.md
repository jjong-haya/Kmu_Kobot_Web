# 시크릿과 개인 키 취급

마지막 갱신: 2026-05-09

## 현재 확인 결과

| 항목 | 결과 |
| --- | --- |
| 로컬 개인 키 파일 | `kobot-project-sync.2026-05-05.private-key.pem` 파일이 로컬에 존재한다. |
| 현재 Git 추적 여부 | `git ls-files -- *.pem *.key *.env .env*` 기준으로 `.env.example`만 추적 중이다. 개인 키와 `.env.local`은 추적되지 않는다. |
| 로컬 Git 히스토리 | `git log --all --name-only -- kobot-project-sync.2026-05-05.private-key.pem` 기준으로 해당 개인 키 파일 기록은 확인되지 않았다. |
| ignore 정책 | `.env`, `.env.*`, `*.private-key.pem`을 무시한다. 추가로 일반 `*.pem`, `*.key`도 무시 대상으로 둔다. |

## 운영 원칙

- GitHub App private key, Supabase service role key, OAuth client secret, deploy hook URL은 저장소에 커밋하지 않는다.
- 브라우저 번들에는 `VITE_` 공개 변수만 들어갈 수 있다. service role key는 절대 `VITE_`로 만들지 않는다.
- 이미 원격 Git에 올라간 시크릿은 삭제 커밋만으로 해결되지 않는다. 즉시 폐기/재발급한 뒤 히스토리 정리가 필요하다.

## 이미 Git에 올라갔을 때 처리 순서

1. 해당 키를 GitHub App/Supabase/외부 서비스에서 즉시 revoke 또는 rotate한다.
2. 현재 트리에서 추적 중이면 `git rm --cached <secret-file>`로 저장소 추적을 끊고 `.gitignore`를 보강한다.
3. 공개 저장소 또는 공유된 원격이라면 `git filter-repo` 또는 BFG Repo-Cleaner로 히스토리에서 제거한다.
4. force push 전 팀원에게 공지하고, 모든 clone에서 재동기화가 필요하다는 점을 알린다.
5. GitHub secret scanning과 push protection을 켠다.
