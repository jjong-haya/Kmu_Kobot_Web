import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-[#103078] mb-4">404</h1>
        <h2 className="text-2xl font-bold mb-4">페이지를 찾을 수 없습니다</h2>
        <p className="text-gray-600 mb-8">
          요청하신 페이지가 존재하지 않거나 이동되었습니다.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="outline" size="lg" asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-5 w-5" />
              이전으로
            </Link>
          </Button>
          <Button size="lg" asChild className="bg-[#103078] hover:bg-[#2048A0]">
            <Link to="/">
              <Home className="mr-2 h-5 w-5" />
              홈으로
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
