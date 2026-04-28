import { Link } from "react-router";

const sections = [
  {
    title: "1. 처리 목적",
    items: [
      "Google 학교 계정 기반 로그인과 학교 메일 확인",
      "회원 승인, 권한 관리, 공식 팀 및 프로젝트 팀 운영",
      "프로젝트 참여, 연락 요청, 투표, 알림 제공",
      "장비 대여, 행사 운영, 분쟁 대응과 감사 기록 관리",
    ],
  },
  {
    title: "2. 처리 항목",
    items: [
      "Google 로그인 정보: 이메일, 이름, 프로필 이미지, Google 계정 식별자",
      "프로필 정보: 닉네임, 실명, 학번, 전화번호, 단과대, 학과, 소속 동아리",
      "운영 정보: 권한, 공식 팀, 프로젝트 팀, 참여 신청, 초대 코드 사용 내역",
      "연락 요청 정보: 연락 이유, 요청자가 첨부한 연락처, 수락 또는 거절 상태",
      "투표 정보: 투표 참여 여부, 투표 결과 요약, 중복 투표 방지를 위한 기록",
      "감사 기록: 요청, 승인, 반려, 권한 변경, 로그인 실패 등 주요 이벤트",
    ],
  },
  {
    title: "3. 보유 및 이용 기간",
    items: [
      "계정과 프로필 정보는 회원 탈퇴 또는 계정 삭제 시까지 보관합니다.",
      "감사 기록, 연락 요청 원본, 웹 알림, 개별 투표 기록은 기본 1년 보관 후 삭제합니다.",
      "프로젝트 산출물과 회의록 등 팀 활동 기록은 동아리 활동 이력 보존을 위해 유지될 수 있습니다.",
      "탈퇴 후 산출물 작성자 표시는 정책에 따라 최소 정보로 제한합니다.",
    ],
  },
  {
    title: "4. 제3자 제공, 처리위탁, 국외 이전",
    items: [
      "KOBOT은 Google OAuth, Supabase, GitHub, Resend 등 외부 서비스를 사용할 수 있습니다.",
      "외부 서비스별 처리 항목, 목적, 보유 기간, 국외 이전 여부는 실제 배포 전 확정해 공개합니다.",
      "GitHub private repository 정보는 권한 있는 사용자에게만 표시하고, 토큰은 브라우저에 저장하지 않습니다.",
    ],
  },
  {
    title: "5. 정보주체 권리",
    items: [
      "사용자는 자신의 개인정보 열람, 정정, 삭제, 처리정지를 요청할 수 있습니다.",
      "회원 탈퇴와 재가입, 잘못 가입한 계정 처리 요청은 KOBOT 운영진이 확인 후 처리합니다.",
      "산출물에 개인정보가 포함된 경우 작성자 표시 제거, 비공개 전환, 내용 수정, 삭제 검토를 요청할 수 있습니다.",
    ],
  },
  {
    title: "6. 쿠키와 자동 수집 장치",
    items: [
      "로그인 세션 유지, UI 상태 저장, 보안 확인을 위해 브라우저 저장소 또는 쿠키를 사용할 수 있습니다.",
      "광고 추적이나 맞춤형 행태정보 기반 광고는 1차 범위에서 사용하지 않습니다.",
    ],
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
            KOBOT은 국민대학교 KOBOT 동아리 웹사이트 운영을 위해 필요한
            범위에서 개인정보를 처리합니다. 이 문서는 1차 정책 초안이며, 실제
            배포 전 외부 서비스 설정과 수집 항목을 다시 확인해 갱신합니다.
          </p>
          <dl className="mt-8 grid gap-4 rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-700 md:grid-cols-2">
            <div>
              <dt className="font-semibold text-gray-950">공식 웹사이트</dt>
              <dd>https://kobot.kookmin.ac.kr</dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-950">문의</dt>
              <dd>
                <a
                  className="text-[#2048A0] underline-offset-4 hover:underline"
                  href="mailto:kobot@kookmin.ac.kr"
                >
                  kobot@kookmin.ac.kr
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-950">시행일</dt>
              <dd>2026-04-28</dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-950">서비스명</dt>
              <dd>KOBOT</dd>
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
              <ul className="mt-4 space-y-3 text-sm leading-6 text-gray-700">
                {section.items.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-[#2048A0]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-2xl bg-gray-50 p-6 text-sm leading-6 text-gray-600">
          <p>
            개인정보 처리방침의 세부 항목은 실제 Supabase, Google OAuth,
            GitHub, Resend 설정이 확정되면 갱신됩니다. 서비스 이용 규칙은{" "}
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
