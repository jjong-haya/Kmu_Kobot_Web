import { Link } from "react-router";

const sections = [
  {
    title: "1. 목적",
    body: "이 약관은 국민대학교 KOBOT 동아리 웹사이트의 공개 페이지, 멤버 워크스페이스, 프로젝트, 연락 요청, 투표, 알림 기능 이용 기준을 정합니다.",
  },
  {
    title: "2. 회원 자격과 승인",
    body: "셀프 가입은 기본적으로 국민대학교 학교 메일 사용자를 대상으로 하며, 신규 가입자는 승인 대기 상태가 됩니다. 코봇 활동 부원 권한은 운영진 승인, 초대 코드, 초대 링크 등 정책에 따라 부여됩니다.",
  },
  {
    title: "3. 계정과 프로필",
    body: "사용자는 닉네임, 실명, 학번, 전화번호 등 필수 정보를 정확히 입력해야 합니다. 내부 페이지에서는 닉네임 또는 활동 단위 참여자 목록 정책에 따른 정보가 표시될 수 있습니다.",
  },
  {
    title: "4. 프로젝트와 산출물",
    body: "프로젝트 소개서, 스터디 기록, 회의록, 자료 설명 등 산출물은 동아리 활동 이력 보존을 위해 유지될 수 있습니다. 공개 페이지에서 개인 표시 방식은 사용자의 설정과 탈퇴 시 선택을 따릅니다.",
  },
  {
    title: "5. 연락 요청",
    body: "사용자는 다른 사용자에게 연락 요청을 보낼 수 있습니다. 요청자는 연락 이유와 연락 가능한 연락처를 첨부해야 하며, 수락자는 공개할 연락처를 선택합니다. 스팸성 요청은 신고될 수 있습니다.",
  },
  {
    title: "6. 투표",
    body: "KOBOT은 회장 선출과 일반 안건 결정을 위해 투표 기능을 제공합니다. 회장 선출 투표는 익명으로 진행되며, 일반 안건 투표는 생성자가 익명 또는 기명 여부와 결과 공개 시점을 선택할 수 있습니다.",
  },
  {
    title: "7. 금지 행위",
    body: "타인 사칭, 운영진 사칭, 욕설, 혐오 표현, 성적 표현, 협박, 악성 링크 전송, 자동화된 대량 요청, 권한 오남용, 개인정보 무단 수집을 금지합니다.",
  },
  {
    title: "8. 이용 제한",
    body: "운영진은 정책 위반, 스팸 신고, 권한 오남용, 자동화 남용이 확인된 사용자에게 경고, 기능 제한, 계정 정지 등 필요한 조치를 할 수 있습니다.",
  },
  {
    title: "9. 문의",
    body: "서비스 이용, 개인정보, 탈퇴, 권한, 프로젝트 운영 관련 문의는 kobot@kookmin.ac.kr로 접수합니다.",
  },
];

export default function Terms() {
  return (
    <div className="bg-white">
      <section className="border-b border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-4xl px-6 py-16 lg:px-8">
          <p className="mb-3 text-sm font-semibold text-[#2048A0]">
            KOBOT Terms
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-gray-950 md:text-5xl">
            이용약관
          </h1>
          <p className="mt-5 text-base leading-7 text-gray-600">
            KOBOT 웹사이트의 회원, 프로젝트, 연락 요청, 투표, 알림 기능 이용
            기준을 정리한 1차 약관 초안입니다.
          </p>
          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-700">
            <p>
              공식 문의:{" "}
              <a
                className="font-semibold text-[#2048A0] underline-offset-4 hover:underline"
                href="mailto:kobot@kookmin.ac.kr"
              >
                kobot@kookmin.ac.kr
              </a>
            </p>
            <p className="mt-2">시행일: 2026-04-28</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
        <div className="space-y-5">
          {sections.map((section) => (
            <article
              key={section.title}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-xl font-bold text-gray-950">
                {section.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-gray-700">
                {section.body}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-2xl bg-[#103078]/5 p-6 text-sm leading-6 text-gray-700">
          <p>
            개인정보 처리 기준은{" "}
            <Link
              to="/privacy"
              className="font-semibold text-[#2048A0] underline-offset-4 hover:underline"
            >
              개인정보 처리방침
            </Link>
            에서 확인할 수 있습니다.
          </p>
        </div>
      </section>
    </div>
  );
}
