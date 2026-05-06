import { Link } from "react-router";

const EFFECTIVE_DATE = "2026-05-06";
const PRIVACY_OFFICER_NAME = "KOBOT 회장";
const PRIVACY_OFFICER_CONTACT = "kobot@kookmin.ac.kr";

type Section =
  | { kind: "list"; title: string; intro?: string; items: string[]; outro?: string }
  | { kind: "paragraph"; title: string; body: string }
  | {
      kind: "table";
      title: string;
      intro?: string;
      headers: string[];
      rows: string[][];
      outro?: string;
    };

const sections: Section[] = [
  {
    kind: "list",
    title: "1. 개인정보의 처리 목적",
    intro:
      "KOBOT은 다음 목적을 위해 개인정보를 처리하며, 이용 목적이 변경되는 경우 개인정보 보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행합니다.",
    items: [
      "회원 가입 및 본인 확인: Google 학교 계정 기반 로그인, 학교 메일 도메인 검증",
      "회원 자격 관리: 회원 승인, 권한 부여, 공식 팀 및 프로젝트 팀 운영",
      "서비스 제공: 프로젝트 모집·참여, 연락 요청, 투표, 알림, 자료실, 장비 대여, 행사 운영",
      "안전한 서비스 운영: 부정 가입 방지, 권한 오남용 방지, 분쟁 대응, 감사 기록 관리",
      "고객 문의 응대: 운영·개인정보·탈퇴·권한 관련 문의 회신",
    ],
  },
  {
    kind: "list",
    title: "2. 처리하는 개인정보 항목 (필수)",
    intro:
      "회원가입 및 서비스 이용 시 다음 항목을 필수로 수집합니다. 거부 시 회원 가입이 제한될 수 있습니다.",
    items: [
      "Google 로그인 정보: 이메일, 이름, 프로필 이미지, Google 계정 식별자",
      "프로필 정보: 닉네임, 실명, 학번, 전화번호, 단과대, 학과, 소속 동아리",
      "운영 정보: 회원 상태, 권한, 공식 팀 소속, 프로젝트 팀 소속, 초대 코드 사용 내역",
      "자동 수집 정보: 접속 IP, User-Agent, 접속 일시, 세션 쿠키 (supabase-auth-token 등)",
    ],
  },
  {
    kind: "list",
    title: "2-1. 처리하는 개인정보 항목 (선택)",
    intro:
      "다음 항목은 부가 기능 이용을 위해 선택적으로 수집하며, 동의를 거부해도 핵심 서비스 이용이 제한되지 않습니다.",
    items: [
      "광고성 정보 수신 동의: 동아리 행사·모집 안내 메일 수신 여부",
      "활동 사진 게시 동의: 동아리 활동 사진에 본인 식별 가능한 정보 게시 동의",
      "GitHub 연동 정보: 저장소 URL, README, 연결 상태 (프로젝트 등록 시)",
      "연락 요청 부가 정보: 카카오톡 ID, 디스코드 ID 등 사용자가 직접 첨부한 연락처",
    ],
  },
  {
    kind: "list",
    title: "3. 개인정보의 처리 및 보유 기간",
    intro:
      "법령에 따른 보존 의무가 없는 한, 처리 목적이 달성되거나 보유 기간이 만료되면 지체 없이 파기합니다.",
    items: [
      "계정·프로필 정보: 회원 탈퇴 또는 회원 자격 종료 시까지",
      "감사 기록 (가입·로그인·권한 변경·승인 이력): 1년",
      "연락 요청 원본 (요청 사유·첨부 연락처): 1년",
      "웹 알림: 1년",
      "투표 기록 (개별 투표 내역): 1년 후 삭제, 결과 요약은 회의록에 보존",
      "프로젝트 산출물·회의록·스터디 기록: 동아리 활동 이력 보존을 위해 유지 (탈퇴자 식별정보는 제거)",
      "법령상 별도 보존 의무가 발생할 경우 해당 근거와 기간을 본 처리방침에 추가합니다.",
    ],
  },
  {
    kind: "list",
    title: "4. 개인정보의 파기 절차 및 방법",
    items: [
      "파기 절차: 보유 기간이 만료되었거나 처리 목적이 달성된 개인정보는 내부 방침에 따라 즉시 파기 대상으로 분류한 뒤, 운영진의 확인을 거쳐 파기합니다.",
      "파기 방법: 전자적 파일 형태의 정보는 복구·재생되지 않는 방식으로 영구 삭제하며, 종이에 출력된 정보는 분쇄 또는 소각하여 파기합니다.",
      "감사 기록은 1년 경과 시 자동 삭제 잡으로 처리하고, 운영진이 분기마다 잔여분을 확인합니다.",
    ],
  },
  {
    kind: "paragraph",
    title: "5. 개인정보의 제3자 제공",
    body:
      "KOBOT은 정보주체의 동의, 법령에 따른 의무 이행, 정보주체 또는 그 법정대리인이 의사표시를 할 수 없는 경우의 명백한 생명·신체상의 이익을 위한 경우를 제외하고, 수집한 개인정보를 제3자에게 제공하지 않습니다. 별도의 제3자 제공이 발생하는 경우 사전에 정보주체의 동의를 받습니다.",
  },
  {
    kind: "table",
    title: "6. 개인정보 처리 위탁",
    intro:
      "원활한 서비스 운영을 위해 다음과 같이 개인정보 처리 업무를 위탁하고 있습니다. 위탁계약 시 개인정보 보호법 제26조에 따라 안전성 확보 조치, 재위탁 제한, 처리 현황 점검 등을 명시합니다.",
    headers: ["수탁자", "위탁 업무", "처리 항목", "위치"],
    rows: [
      [
        "Supabase, Inc.",
        "회원 인증, DB 호스팅, 스토리지, 세션 관리",
        "이메일, 프로필, 권한, 감사 기록, 게시물",
        "Northeast Asia (Seoul) 리전 ap-northeast-2",
      ],
      [
        "Google LLC",
        "Google OAuth 로그인, 학교 메일 도메인 검증",
        "이메일, 이름, 프로필 이미지, Google 계정 식별자",
        "미국 (국외 이전)",
      ],
      [
        "GitHub, Inc.",
        "프로젝트 README 동기화 (선택 기능)",
        "저장소 URL, README 본문, 연결 상태",
        "미국 (국외 이전)",
      ],
      [
        "Resend, Inc.",
        "트랜잭션 메일 발송 (가입 안내, 알림)",
        "수신자 이메일, 알림 제목·본문",
        "미국 (국외 이전)",
      ],
    ],
    outro:
      "정보주체의 요청이 있는 경우 위탁계약서, 안전성 확보 조치 내역을 열람할 수 있도록 합니다.",
  },
  {
    kind: "list",
    title: "7. 개인정보의 국외 이전",
    intro:
      "개인정보 보호법 제28조의8에 따라 국외 이전 사항을 안내합니다.",
    items: [
      "이전 받는 자: Google LLC, GitHub Inc., Resend Inc. — 모두 미국 소재",
      "이전 국가: 미국",
      "이전 일시 및 방법: 회원이 해당 기능을 이용하는 시점에 정보통신망을 통한 전송",
      "이전 항목: 위 §6 표 참조",
      "이전 받는 자의 이용 목적 및 보유 기간: 각 수탁자의 약관에 따름 (Google · GitHub · Resend 약관 링크는 본 페이지 하단 참조)",
      "Supabase 데이터베이스는 한국 리전(서울)에 저장되며 운영 백업·장애 복구 과정에서 일시적으로 다른 리전이 사용될 수 있습니다.",
    ],
  },
  {
    kind: "list",
    title: "8. 정보주체의 권리와 행사 방법",
    intro:
      "정보주체는 개인정보 보호법 제35조부터 제37조에 따라 KOBOT에 대해 언제든지 다음 권리를 행사할 수 있습니다.",
    items: [
      "개인정보 열람 요구권",
      "오류 정정 요구권",
      "삭제 요구권 (회원 탈퇴 포함)",
      "처리 정지 요구권",
      "개인정보 이동권 (해당되는 경우)",
    ],
    outro:
      "권리 행사는 회원 워크스페이스의 [회원 정보] 페이지의 자가 탈퇴 기능, 또는 kobot@kookmin.ac.kr 이메일 문의를 통해 가능합니다. 정정·삭제 요구는 처리 목적이 달성되지 않은 한 지체 없이 처리하며, 처리 결과를 회신합니다.",
  },
  {
    kind: "paragraph",
    title: "9. 개인정보 보호책임자",
    body:
      `KOBOT은 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만 처리 및 피해 구제를 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다. (성명: ${PRIVACY_OFFICER_NAME} / 소속: 국민대학교 KOBOT 동아리 / 연락처: ${PRIVACY_OFFICER_CONTACT}) 정보주체는 KOBOT의 서비스를 이용하면서 발생한 모든 개인정보 보호 관련 문의, 불만처리, 피해구제 등에 관한 사항을 위 연락처로 문의할 수 있으며, KOBOT은 정보주체의 문의에 대해 지체 없이 답변 및 처리해드릴 것입니다.`,
  },
  {
    kind: "list",
    title: "10. 쿠키 등 자동 수집 장치",
    intro:
      "KOBOT은 이용자에게 개별적인 맞춤서비스를 제공하기 위해 이용 정보를 저장하고 수시로 불러오는 '쿠키(cookie)'와 브라우저 저장소를 사용합니다.",
    items: [
      "사용 목적: 로그인 세션 유지, 사이드바 상태 등 UI 환경 저장, 보안 확인",
      "수집 항목: Supabase 인증 토큰, UI 상태값, 접속 IP, User-Agent",
      "거부 방법: 브라우저 설정 > 쿠키 차단 / 개별 사이트 쿠키 차단으로 거부 가능. 단, 쿠키 저장을 거부할 경우 로그인이 필요한 서비스 이용이 제한될 수 있습니다.",
      "광고 추적, 행태정보 기반 맞춤형 광고 쿠키는 사용하지 않습니다.",
    ],
  },
  {
    kind: "list",
    title: "11. 개인정보의 안전성 확보 조치",
    intro:
      "KOBOT은 개인정보 보호법 제29조에 따라 다음과 같이 안전성 확보에 필요한 기술적·관리적·물리적 조치를 하고 있습니다.",
    items: [
      "기술적 조치: HTTPS 전 구간 암호화, Supabase Row Level Security 정책 적용, 권한 기반 접근 제어, 비밀번호 단방향 해시 저장",
      "관리적 조치: 운영진 권한 최소화 원칙, 권한 변경 감사 기록, 정기적 권한 점검",
      "접근 통제: 데이터베이스 접근은 운영진(회장·부회장)만 가능하며 모든 변경은 감사 기록에 남김",
      "외부 접근 차단: Supabase API 키는 클라이언트에 anon key만 노출하고 service role key는 서버사이드에서만 사용",
    ],
  },
  {
    kind: "list",
    title: "12. 권익침해 구제방법",
    intro:
      "정보주체는 개인정보 침해로 인한 구제를 받기 위하여 다음 기관에 분쟁해결이나 상담 등을 신청할 수 있습니다.",
    items: [
      "개인정보분쟁조정위원회: (국번없이) 1833-6972 · www.kopico.go.kr",
      "개인정보침해신고센터: (국번없이) 118 · privacy.kisa.or.kr",
      "대검찰청: (국번없이) 1301 · www.spo.go.kr",
      "경찰청: (국번없이) 182 · ecrm.cyber.go.kr",
    ],
  },
  {
    kind: "paragraph",
    title: "13. 처리방침의 변경",
    body:
      "이 개인정보 처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경 내용의 추가·삭제·정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통해 고지할 것입니다. 이용자에게 불리한 변경의 경우 30일 전부터 공지하며, 회원의 명시적 거부 의사가 있는 경우 회원 탈퇴 처리를 지원합니다.",
  },
];

export default function Privacy() {
  return (
    <div className="bg-white">
      <section className="border-b border-gray-200 bg-gradient-to-b from-[#103078]/8 to-white">
        <div className="mx-auto max-w-4xl px-6 py-16 lg:px-8">
          <p className="mb-3 text-sm font-semibold text-[#2048A0]">
            KOBOT Privacy
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-gray-950 md:text-5xl">
            개인정보 처리방침
          </h1>
          <p className="mt-5 text-base leading-7 text-gray-600">
            KOBOT은 국민대학교 KOBOT 동아리 웹사이트 운영을 위해 「개인정보
            보호법」 제30조에 따라 정보주체의 개인정보를 보호하고 이와 관련한
            고충을 신속하고 원활하게 처리할 수 있도록 다음과 같은 처리방침을
            두고 있습니다.
          </p>
          <dl className="mt-8 grid gap-4 rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-700 md:grid-cols-2">
            <div>
              <dt className="font-semibold text-gray-950">서비스명</dt>
              <dd>KOBOT</dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-950">공식 웹사이트</dt>
              <dd>https://kobot.kookmin.ac.kr</dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-950">운영자</dt>
              <dd>국민대학교 KOBOT 동아리</dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-950">개인정보 보호책임자</dt>
              <dd>
                {PRIVACY_OFFICER_NAME} (
                <a
                  className="text-[#2048A0] underline-offset-4 hover:underline"
                  href={`mailto:${PRIVACY_OFFICER_CONTACT}`}
                >
                  {PRIVACY_OFFICER_CONTACT}
                </a>
                )
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-950">시행일</dt>
              <dd>{EFFECTIVE_DATE}</dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-950">최종 개정일</dt>
              <dd>{EFFECTIVE_DATE}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
        <div className="space-y-8">
          {sections.map((section) => (
            <article
              key={section.title}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-xl font-bold text-gray-950">
                {section.title}
              </h2>

              {section.kind === "paragraph" && (
                <p className="mt-3 text-sm leading-7 text-gray-700">
                  {section.body}
                </p>
              )}

              {section.kind === "list" && (
                <>
                  {section.intro && (
                    <p className="mt-3 text-sm leading-7 text-gray-700">
                      {section.intro}
                    </p>
                  )}
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-gray-700">
                    {section.items.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-[#2048A0]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  {section.outro && (
                    <p className="mt-4 text-sm leading-7 text-gray-700">
                      {section.outro}
                    </p>
                  )}
                </>
              )}

              {section.kind === "table" && (
                <>
                  {section.intro && (
                    <p className="mt-3 text-sm leading-7 text-gray-700">
                      {section.intro}
                    </p>
                  )}
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm text-gray-700">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          {section.headers.map((header) => (
                            <th
                              key={header}
                              scope="col"
                              className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {section.rows.map((row, rowIdx) => (
                          <tr key={rowIdx} className="border-b border-gray-100 align-top">
                            {row.map((cell, cellIdx) => (
                              <td key={cellIdx} className="px-3 py-3 leading-6">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {section.outro && (
                    <p className="mt-4 text-sm leading-7 text-gray-700">
                      {section.outro}
                    </p>
                  )}
                </>
              )}
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-2xl bg-gray-50 p-6 text-sm leading-6 text-gray-600">
          <p>
            본 처리방침의 시행일은 {EFFECTIVE_DATE}이며, 처리방침이 변경되는
            경우 변경사항의 시행 7일 전부터 사이트 공지사항을 통해 고지합니다.
            서비스 이용 규칙은{" "}
            <Link
              to="/terms"
              className="font-semibold text-[#2048A0] underline-offset-4 hover:underline"
            >
              이용약관
            </Link>
            에서 확인할 수 있습니다.
          </p>
        </div>
      </section>
    </div>
  );
}
