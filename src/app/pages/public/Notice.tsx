import { useState } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Search, Pin } from "lucide-react";

export default function PublicNotice() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("전체");

  const categories = ["전체", "일반", "행사", "모집", "세미나"];

  const notices = [
    {
      id: 1,
      title: "2026년 상반기 신입 부원 모집 공고",
      category: "모집",
      date: "2026.02.15",
      isPinned: true,
      preview:
        "2026년 상반기 신입 부원을 모집합니다. 로봇에 관심있는 모든 학생 환영!",
    },
    {
      id: 2,
      title: "ROS 2 고급 세미나 안내",
      category: "세미나",
      date: "2026.02.14",
      isPinned: true,
      preview: "ROS 2 Navigation Stack 활용법에 대한 세미나를 진행합니다.",
    },
    {
      id: 3,
      title: "국제 로봇 경진대회 참가 안내",
      category: "행사",
      date: "2026.02.13",
      isPinned: false,
      preview:
        "3월 개최되는 국제 로봇 경진대회에 참가합니다. 관심있는 멤버는 신청해주세요.",
    },
    {
      id: 4,
      title: "정기 총회 개최 안내",
      category: "일반",
      date: "2026.02.12",
      isPinned: false,
      preview: "2월 20일 정기 총회가 개최됩니다. 모든 멤버는 필수 참석입니다.",
    },
    {
      id: 5,
      title: "프로젝트 중간 발표회",
      category: "행사",
      date: "2026.02.10",
      isPinned: false,
      preview:
        "진행중인 프로젝트들의 중간 발표회를 진행합니다. 많은 참여 부탁드립니다.",
    },
    {
      id: 6,
      title: "동아리방 이용 규칙 안내",
      category: "일반",
      date: "2026.02.08",
      isPinned: false,
      preview: "동아리방 이용 시 지켜야 할 규칙을 안내드립니다.",
    },
    {
      id: 7,
      title: "컴퓨터 비전 스터디 모집",
      category: "모집",
      date: "2026.02.05",
      isPinned: false,
      preview: "OpenCV 기초부터 시작하는 컴퓨터 비전 스터디원을 모집합니다.",
    },
    {
      id: 8,
      title: "로봇 대회 수상 소식",
      category: "일반",
      date: "2026.02.01",
      isPinned: false,
      preview:
        "전국 로봇 경진대회에서 우수상을 수상했습니다! 축하합니다!",
    },
  ];

  const filteredNotices = notices.filter((notice) => {
    const matchesCategory =
      selectedCategory === "전체" || notice.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notice.preview.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const pinnedNotices = filteredNotices.filter((n) => n.isPinned);
  const regularNotices = filteredNotices.filter((n) => !n.isPinned);

  return (
    <div className="py-12">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">공지사항</h1>
          <p className="text-lg text-gray-600">
            동아리의 주요 소식과 공지를 확인하세요
          </p>
        </div>

        {/* Search & Filter */}
        <div className="mb-8">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="공지사항 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={
                  selectedCategory === category
                    ? "bg-[#103078] hover:bg-[#2048A0]"
                    : ""
                }
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Pinned Notices */}
        {pinnedNotices.length > 0 && (
          <div className="mb-6">
            <div className="space-y-3">
              {pinnedNotices.map((notice) => (
                <Card
                  key={notice.id}
                  className="border-[#103078] bg-blue-50/30 hover:shadow-lg transition-all cursor-pointer"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Pin className="h-5 w-5 text-[#103078] mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-lg">
                            {notice.title}
                          </h3>
                          <Badge className="bg-[#103078] text-white ml-2">
                            {notice.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {notice.preview}
                        </p>
                        <p className="text-xs text-gray-500">{notice.date}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Regular Notices */}
        <div className="space-y-3">
          {regularNotices.map((notice) => (
            <Card
              key={notice.id}
              className="border-gray-200 hover:border-[#2048A0] hover:shadow-lg transition-all cursor-pointer"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-lg">{notice.title}</h3>
                  <Badge variant="outline" className="ml-2">
                    {notice.category}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">{notice.preview}</p>
                <p className="text-xs text-gray-500">{notice.date}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredNotices.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">검색 결과가 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
