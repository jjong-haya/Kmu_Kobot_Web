import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { QrCode, CheckCircle2, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";

export default function Attendance() {
  const [attendanceCode, setAttendanceCode] = useState("");

  const handleAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (attendanceCode) {
      toast.success("출석이 완료되었습니다!");
      setAttendanceCode("");
    }
  };

  const stats = [
    { label: "전체 출석률", value: "94%", color: "text-green-600" },
    { label: "이번 달", value: "8/9회", color: "text-blue-600" },
    { label: "연속 출석", value: "5일", color: "text-purple-600" },
    { label: "결석", value: "1회", color: "text-red-600" },
  ];

  const attendanceHistory = [
    {
      date: "2026.02.14",
      session: "ROS 2 세미나",
      status: "출석",
      time: "19:05",
    },
    {
      date: "2026.02.12",
      session: "프로젝트 회의",
      status: "출석",
      time: "18:58",
    },
    {
      date: "2026.02.07",
      session: "컴퓨터 비전 스터디",
      status: "출석",
      time: "19:02",
    },
    {
      date: "2026.02.05",
      session: "정기 세션",
      status: "지각",
      time: "19:15",
    },
    {
      date: "2026.01.31",
      session: "알고리즘 세미나",
      status: "출석",
      time: "18:55",
    },
    {
      date: "2026.01.29",
      session: "정기 세션",
      status: "결석",
      time: "-",
    },
    {
      date: "2026.01.24",
      session: "프로젝트 발표",
      status: "출석",
      time: "19:00",
    },
    {
      date: "2026.01.22",
      session: "정기 세션",
      status: "출석",
      time: "18:59",
    },
  ];

  const upcomingSessions = [
    { date: "2026.02.18", session: "ROS 2 Navigation 세미나", time: "19:00" },
    { date: "2026.02.20", session: "프로젝트 중간 발표", time: "18:00" },
    { date: "2026.02.22", session: "정기 총회", time: "19:00" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-2">출석 관리</h1>
        <p className="text-gray-600">출석 체크 및 내 출석 현황을 확인하세요</p>
      </div>

      {/* Attendance Check Card */}
      <Card className="border-[#103078]">
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold mb-2">오늘 출석하기</h2>
            <p className="text-gray-600">출석 코드를 입력하거나 QR코드를 스캔하세요</p>
          </div>

          <form onSubmit={handleAttendance} className="max-w-md mx-auto space-y-4">
            <div>
              <Label htmlFor="code">출석 코드</Label>
              <Input
                id="code"
                placeholder="출석 코드 입력"
                value={attendanceCode}
                onChange={(e) => setAttendanceCode(e.target.value)}
                className="text-center text-lg"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="w-full bg-[#103078] hover:bg-[#2048A0]"
            >
              <CheckCircle2 className="mr-2 h-5 w-5" />
              출석 체크
            </Button>
            <div className="text-center">
              <Button variant="outline" type="button" className="w-full">
                <QrCode className="mr-2 h-5 w-5" />
                QR 코드 스캔
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6 text-center">
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upcoming Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            다가오는 세션
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingSessions.map((session, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
              >
                <div>
                  <p className="font-semibold">{session.session}</p>
                  <p className="text-sm text-gray-600">
                    {session.date} • {session.time}
                  </p>
                </div>
                <Badge variant="outline">예정</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">출석 히스토리</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>날짜</TableHead>
                <TableHead>세션</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>시간</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceHistory.map((record, index) => (
                <TableRow key={index}>
                  <TableCell>{record.date}</TableCell>
                  <TableCell>{record.session}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        record.status === "출석"
                          ? "default"
                          : record.status === "지각"
                          ? "secondary"
                          : "destructive"
                      }
                      className={
                        record.status === "출석" ? "bg-[#103078]" : ""
                      }
                    >
                      {record.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">{record.time}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
