import { useState } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Search, Pin, Bell } from "lucide-react";

export default function MemberNotice() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("전체");

  const categories = ["전체", "일반", "행사", "세미나", "긴급"];

  const notices = [
    {
      id: 1,
      title: "2026년 상반기 신입 부원 모집 공고",
      category: "일반",
      date: "2026.02.15",
      isPinned: true,
      isRead: false,
      preview:
        "2026년 상반기 신입 부원을 모집합니다. 로봇에 관심있는 모든 학생 환영!",
      author: "운영진",
    },
    {
      id: 2,
      title: "ROS 2 고급 세미나 안내",
      category: "세미나",
      date: "2026.02.14",
      isPinned: true,
      isRead: false,
      preview: "ROS 2 Navigation Stack 활용법에 대한 세미나를 진행합니다.",
      author: "김철수",
    },
    {
      id: 3,
      title: "국제 로봇 경진대회 참가 안내",
      category: "행사",
      date: "2026.02.13",
      isPinned: false,
      isRead: true,
      preview:
        "3월 개최되는 국제 로봇 경진대회에 참가합니다. 관심있는 멤버는 신청해주세요.",
      author: "운영진",
    },
    {
      id: 4,
      title: "정기 총회 개최 안내",
      category: "일반",
      date: "2026.02.12",
      isPinned: false,
      isRead: true,
      preview: "2월 20일 정기 총회가 개최됩니다. 모든 멤버는 필수 참석입니다.",
      author: "운영진",
    },
    {
      id: 5,
      title: "프로젝트 중간 발표회",
      category: "행사",
      date: "2026.02.10",
      isPinned: false,
      isRead: true,
      preview:
        "진행중인 프로젝트들의 중간 발표회를 진행합니다. 많은 참여 부탁드립니다.",
      author: "운영진",
    },
    {
      id: 6,
      title: "[긴급] 이번주 세미나 일정 변경",
      category: "긴급",
      date: "2026.02.09",
      isPinned: false,
      isRead: true,
      preview: "수요일 세미나가 금요일로 변경되었습니다.",
      author: "운영진",
    },
    {
      id: 7,
      title: "컴퓨터 비전 스터디 모집",
      category: "일반",
      date: "2026.02.05",
      isPinned: false,
      isRead: true,
      preview: "OpenCV 기초부터 시작하는 컴퓨터 비전 스터디원을 모집합니다.",
      author: "이영희",
    },
    {
      id: 8,
      title: "로봇 대회 수상 소식",
      category: "일반",
      date: "2026.02.01",
      isPinned: false,
      isRead: true,
      preview:
        "전국 로봇 경진대회에서 우수상을 수상했습니다! 축하합니다!",
      author: "운영진",
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

  const unreadNotices = filteredNotices.filter((n) => !n.isRead);
  const allNotices = filteredNotices;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">공지사항</h1>
          <p className="text-gray-600">
            동아리의 주요 소식과 공지를 확인하세요
          </p>
        </div>
        <Badge variant="destructive" className="text-sm">
          {unreadNotices.length}개 안읽음
        </Badge>
      </div>

      {/* Search & Filter */}
      <div className="space-y-4">
        <div className="relative">
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

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value="unread">
            안읽음 ({unreadNotices.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3 mt-6">
          {allNotices.map((notice) => (
            <Card
              key={notice.id}
              className={`cursor-pointer transition-all ${
                notice.isPinned
                  ? "border-[#103078] bg-blue-50/30 hover:shadow-lg"
                  : !notice.isRead
                  ? "border-[#2048A0] hover:shadow-lg"
                  : "border-gray-200 hover:border-[#2048A0] hover:shadow-lg"
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {notice.isPinned && (
                    <Pin className="h-5 w-5 text-[#103078] mt-1 flex-shrink-0" />
                  )}
                  {!notice.isPinned && !notice.isRead && (
                    <div className="w-2 h-2 rounded-full bg-[#2048A0] mt-2 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {!notice.isRead && (
                          <Bell className="h-4 w-4 text-[#2048A0]" />
                        )}
                        <h3
                          className={`text-lg ${
                            !notice.isRead ? "font-bold" : "font-semibold"
                          }`}
                        >
                          {notice.title}
                        </h3>
                      </div>
                      <Badge
                        variant={
                          notice.category === "긴급"
                            ? "destructive"
                            : "outline"
                        }
                        className={
                          notice.category === "세미나"
                            ? "bg-[#103078] text-white border-[#103078]"
                            : ""
                        }
                      >
                        {notice.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {notice.preview}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{notice.author}</span>
                      <span>•</span>
                      <span>{notice.date}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="unread" className="space-y-3 mt-6">
          {unreadNotices.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">모든 공지를 읽었습니다 ✓</p>
            </div>
          ) : (
            unreadNotices.map((notice) => (
              <Card
                key={notice.id}
                className={`cursor-pointer transition-all ${
                  notice.isPinned
                    ? "border-[#103078] bg-blue-50/30 hover:shadow-lg"
                    : "border-[#2048A0] hover:shadow-lg"
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {notice.isPinned && (
                      <Pin className="h-5 w-5 text-[#103078] mt-1 flex-shrink-0" />
                    )}
                    {!notice.isPinned && (
                      <div className="w-2 h-2 rounded-full bg-[#2048A0] mt-2 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4 text-[#2048A0]" />
                          <h3 className="font-bold text-lg">{notice.title}</h3>
                        </div>
                        <Badge
                          variant={
                            notice.category === "긴급"
                              ? "destructive"
                              : "outline"
                          }
                          className={
                            notice.category === "세미나"
                              ? "bg-[#103078] text-white border-[#103078]"
                              : ""
                          }
                        >
                          {notice.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {notice.preview}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{notice.author}</span>
                        <span>•</span>
                        <span>{notice.date}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Empty State */}
      {filteredNotices.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">검색 결과가 없습니다</p>
        </div>
      )}
    </div>
  );
}
