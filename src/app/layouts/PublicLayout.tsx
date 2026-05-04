import { Outlet, Link, useLocation } from "react-router";
import logo from "@/assets/mainLogo.png";
import { ScrollToTop } from "../components/ScrollToTop";
import { APP_VERSION_LABEL } from "../utils/version";

export default function PublicLayout() {
  const location = useLocation();
  const hideFooter = location.pathname === "/login";

  return (
    <div className="min-h-screen bg-white">
      <ScrollToTop />
      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {!hideFooter && (
      <footer className="bg-gray-50 border-t border-gray-200 mt-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <img src={logo} alt="Kookmin Robot" className="h-24 mb-4 block -ml-6" />

            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/activities" className="text-sm text-gray-600 hover:text-[#2048A0]">
                    활동 갤러리
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="text-sm text-gray-600 hover:text-[#2048A0]">
                    자주 묻는 질문
                  </Link>
                </li>
                <li>
                  <Link to="/projects" className="text-sm text-gray-600 hover:text-[#2048A0]">
                    Projects
                  </Link>
                </li>
                <li>
                  <Link to="/notice" className="text-sm text-gray-600 hover:text-[#2048A0]">
                    Notice
                  </Link>
                </li>
                <li>
                  <Link to="/recruit" className="text-sm text-gray-600 hover:text-[#2048A0]">
                    Recruit
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-sm text-gray-600 hover:text-[#2048A0]">
                    Member Login
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Email: kobot@kookmin.ac.kr</li>
                <li>Instagram: @kmubot</li>
                <li>GitHub: Kmu-Kobot</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-4 border-t border-gray-200 pt-8 text-sm text-gray-500">
            <Link to="/privacy" className="hover:text-[#2048A0]">
              개인정보 처리방침
            </Link>
            <Link to="/terms" className="hover:text-[#2048A0]">
              이용약관
            </Link>
            <a
              href="mailto:kobot@kookmin.ac.kr"
              className="hover:text-[#2048A0]"
            >
              문의
            </a>
          </div>
          <div className="mt-6 text-center text-sm text-gray-500">
            © 2026 Kookmin Robot. All rights reserved.
          </div>
          <div
            className="mt-2 text-center text-[11px] font-mono text-gray-400"
            title="빌드 버전"
          >
            {APP_VERSION_LABEL}
          </div>
        </div>
      </footer>
      )}
    </div>
  );
}
