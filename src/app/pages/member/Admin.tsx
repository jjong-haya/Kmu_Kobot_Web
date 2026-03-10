import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Users,
  Bell,
  Calendar,
  FileText,
  Shield,
  Plus,
  Edit,
  Trash2,
  QrCode,
} from "lucide-react";
import { toast } from "sonner";

export default function Admin() {
  const [newNoticeTitle, setNewNoticeTitle] = useState("");
  const [newNoticeContent, setNewNoticeContent] = useState("");

  const members = [
    {
      id: 1,
      name: "김철수",
      studentId: "20220001",
      role: "멤버",
      track: "소프트웨어",
      joinDate: "2025.03",
      attendance: "95%",
    },
    {
      id: 2,
      name: "이영희",
      studentId: "20220002",
      role: "운영진",
      track: "AI/비전",
      joinDate: "2025.03",
      attendance: "98%",
    },
    {
      id: 3,
      name: "박민수",
      studentId: "20220003",
      role: "멤버",
      track: "제어/알고리즘",
      joinDate: "2025.03",
      attendance: "92%",
    },
    {
      id: 4,
      name: "정지훈",
      studentId: "20220004",
      role: "멤버",
      track: "하드웨어",
      joinDate: "2025.09",
      attendance: "88%",
    },
  ];

  const attendanceSessions = [
    {
      id: 1,
      title: "ROS 2 세미나",
      date: "2026.02.14",
      type: "세미나",
      attendees: 28,
      total: 32,
    },
    {
      id: 2,
      title: "프로젝트 회의",
      date: "2026.02.12",
      type: "회의",
      attendees: 25,
      total: 32,
    },
    {
      id: 3,
      title: "정기 세션",
      date: "2026.02.07",
      type: "일반",
      attendees: 30,
      total: 32,
    },
  ];

  const handleCreateNotice = () => {
    if (newNoticeTitle && newNoticeContent) {
      toast.success("공지사항이 작성되었습니다");
      setNewNoticeTitle("");
      setNewNoticeContent("");
    }
  };

  const handleCreateAttendance = () => {
    toast.success("출석 회차가 생성되었습니다");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-[#103078]/10 flex items-center justify-center">
          <Shield className="h-6 w-6 text-[#103078]" />
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-1">운영진 관리</h1>
          <p className="text-gray-600">멤버, 공지, 출석, 자료 관리</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">전체 멤버</p>
                <p className="text-2xl font-bold">32명</p>
              </div>
              <Users className="h-8 w-8 text-[#103078]" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">공지사항</p>
                <p className="text-2xl font-bold text-blue-600">8개</p>
              </div>
              <Bell className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">출석 회차</p>
                <p className="text-2xl font-bold text-green-600">12회</p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">자료</p>
                <p className="text-2xl font-bold text-purple-600">24개</p>
              </div>
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">멤버 관리</TabsTrigger>
          <TabsTrigger value="notices">공지 작성</TabsTrigger>
          <TabsTrigger value="attendance">출석 관리</TabsTrigger>
          <TabsTrigger value="resources">자료 관리</TabsTrigger>
        </TabsList>

        {/* Members Management */}
        <TabsContent value="members" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">멤버 목록</CardTitle>
                <Button size="sm" className="bg-[#103078] hover:bg-[#2048A0]">
                  <Plus className="mr-2 h-4 w-4" />
                  멤버 추가
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이름</TableHead>
                    <TableHead>학번</TableHead>
                    <TableHead>역할</TableHead>
                    <TableHead>트랙</TableHead>
                    <TableHead>가입일</TableHead>
                    <TableHead>출석률</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>{member.studentId}</TableCell>
                      <TableCell>
                        <Badge
                          variant={member.role === "운영진" ? "default" : "outline"}
                          className={member.role === "운영진" ? "bg-[#103078]" : ""}
                        >
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{member.track}</TableCell>
                      <TableCell>{member.joinDate}</TableCell>
                      <TableCell>{member.attendance}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notice Creation */}
        <TabsContent value="notices" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">새 공지사항 작성</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="notice-title">제목 *</Label>
                  <Input
                    id="notice-title"
                    placeholder="공지사항 제목"
                    value={newNoticeTitle}
                    onChange={(e) => setNewNoticeTitle(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="notice-category">카테고리 *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="카테고리 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">일반</SelectItem>
                      <SelectItem value="event">행사</SelectItem>
                      <SelectItem value="seminar">세미나</SelectItem>
                      <SelectItem value="urgent">긴급</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="notice-content">내용 *</Label>
                <Textarea
                  id="notice-content"
                  rows={8}
                  placeholder="공지사항 내용을 입력하세요"
                  value={newNoticeContent}
                  onChange={(e) => setNewNoticeContent(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="pin" className="rounded" />
                <Label htmlFor="pin" className="cursor-pointer">
                  상단 고정
                </Label>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCreateNotice}
                >
                  임시 저장
                </Button>
                <Button
                  className="flex-1 bg-[#103078] hover:bg-[#2048A0]"
                  onClick={handleCreateNotice}
                >
                  <Bell className="mr-2 h-4 w-4" />
                  공지 게시
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Management */}
        <TabsContent value="attendance" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">출석 회차 생성</CardTitle>
                <Button
                  size="sm"
                  className="bg-[#103078] hover:bg-[#2048A0]"
                  onClick={handleCreateAttendance}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  회차 생성
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="session-title">세션 제목 *</Label>
                  <Input id="session-title" placeholder="예: ROS 2 세미나" />
                </div>
                <div>
                  <Label htmlFor="session-type">유형 *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="유형 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">일반</SelectItem>
                      <SelectItem value="seminar">세미나</SelectItem>
                      <SelectItem value="meeting">회의</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="session-date">날짜 *</Label>
                  <Input id="session-date" type="date" />
                </div>
                <div>
                  <Label htmlFor="session-time">시간 *</Label>
                  <Input id="session-time" type="time" />
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold mb-1">출석 코드</p>
                    <p className="text-2xl font-mono font-bold text-[#103078]">
                      ABC123
                    </p>
                  </div>
                  <Button variant="outline" size="icon">
                    <QrCode className="h-6 w-6" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">출석 현황</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>세션</TableHead>
                    <TableHead>날짜</TableHead>
                    <TableHead>유형</TableHead>
                    <TableHead>출석 인원</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">{session.title}</TableCell>
                      <TableCell>{session.date}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{session.type}</Badge>
                      </TableCell>
                      <TableCell>
                        {session.attendees} / {session.total}
                        <span className="text-sm text-gray-600 ml-2">
                          ({Math.round((session.attendees / session.total) * 100)}%)
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          상세보기
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources Management */}
        <TabsContent value="resources" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">자료 업로드</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="file-title">파일 제목 *</Label>
                <Input id="file-title" placeholder="파일 제목" />
              </div>

              <div>
                <Label htmlFor="file-folder">폴더 *</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="폴더 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seminar">세미나 자료</SelectItem>
                    <SelectItem value="project">프로젝트 코드</SelectItem>
                    <SelectItem value="paper">논문 & 문서</SelectItem>
                    <SelectItem value="video">강의 영상</SelectItem>
                    <SelectItem value="other">기타</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="file-upload">파일 *</Label>
                <div className="mt-2 flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FileText className="w-10 h-10 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">클릭하여 업로드</span> 또는 드래그
                      </p>
                      <p className="text-xs text-gray-500">
                        PDF, ZIP, VIDEO (최대 500MB)
                      </p>
                    </div>
                    <input id="file-upload" type="file" className="hidden" />
                  </label>
                </div>
              </div>

              <div>
                <Label htmlFor="file-permission">권한 *</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="권한 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 멤버</SelectItem>
                    <SelectItem value="admin">운영진만</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full bg-[#103078] hover:bg-[#2048A0]">
                <FileText className="mr-2 h-4 w-4" />
                자료 업로드
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
