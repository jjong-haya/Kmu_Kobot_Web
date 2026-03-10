import { useState } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Calendar, Users, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function Recruit() {
  const [formData, setFormData] = useState({
    name: "",
    studentId: "",
    major: "",
    email: "",
    phone: "",
    track: "",
    motivation: "",
    experience: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("지원서가 제출되었습니다!");
    // Reset form
    setFormData({
      name: "",
      studentId: "",
      major: "",
      email: "",
      phone: "",
      track: "",
      motivation: "",
      experience: "",
    });
  };

  const timeline = [
    { phase: "지원서 접수", date: "2.20 - 3.10" },
    { phase: "서류 심사", date: "3.11 - 3.15" },
    { phase: "면접 진행", date: "3.18 - 3.22" },
    { phase: "최종 합격 발표", date: "3.25" },
  ];

  const tracks = [
    {
      name: "소프트웨어",
      description: "ROS, Python, C++ 등 로봇 소프트웨어 개발",
      requirements: ["프로그래밍 기초", "알고리즘 이해", "문제 해결 능력"],
    },
    {
      name: "제어/알고리즘",
      description: "제어 이론, 경로 계획, SLAM 등 알고리즘 연구",
      requirements: ["수학 기초", "제어 이론", "논리적 사고"],
    },
    {
      name: "하드웨어",
      description: "로봇 설계, 제작, 회로 구성 등",
      requirements: ["기계/전자 기초", "CAD", "실습 경험"],
    },
    {
      name: "AI/비전",
      description: "컴퓨터 비전, 딥러닝 기반 로봇 인지",
      requirements: ["머신러닝 기초", "Python", "OpenCV"],
    },
  ];

  return (
    <div className="py-12">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-[#103078] text-white">
            2026년 상반기 모집
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            신입 부원 모집
          </h1>
          <p className="text-lg text-gray-600">
            로봇에 열정이 있다면, 우리와 함께 성장하세요
          </p>
          <div className="mt-4">
            <Badge variant="outline" className="text-lg px-4 py-2">
              D-5
            </Badge>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <Card>
            <CardContent className="p-6 text-center">
              <Calendar className="h-8 w-8 text-[#103078] mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">모집 기간</p>
              <p className="font-semibold">2.20 - 3.10</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 text-[#103078] mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">모집 인원</p>
              <p className="font-semibold">15명 내외</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="h-8 w-8 text-[#103078] mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">활동 시간</p>
              <p className="font-semibold">주 1-2회</p>
            </CardContent>
          </Card>
        </div>

        {/* Timeline */}
        <Card className="mb-12">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-6">모집 일정</h2>
            <div className="space-y-4">
              {timeline.map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <CheckCircle2 className="h-5 w-5 text-[#103078]" />
                  <div className="flex-1">
                    <p className="font-semibold">{item.phase}</p>
                    <p className="text-sm text-gray-600">{item.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tracks */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">모집 트랙</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tracks.map((track, index) => (
              <Card key={index} className="border-gray-200">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2">{track.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {track.description}
                  </p>
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2">
                      우대 사항:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {track.requirements.map((req) => (
                        <Badge
                          key={req}
                          variant="outline"
                          className="text-xs"
                        >
                          {req}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Application Form */}
        <Card>
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-6">지원서 작성</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name">이름 *</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="studentId">학번 *</Label>
                  <Input
                    id="studentId"
                    required
                    value={formData.studentId}
                    onChange={(e) =>
                      setFormData({ ...formData, studentId: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="major">학과 *</Label>
                  <Input
                    id="major"
                    required
                    value={formData.major}
                    onChange={(e) =>
                      setFormData({ ...formData, major: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="track">지원 트랙 *</Label>
                  <Select
                    value={formData.track}
                    onValueChange={(value) =>
                      setFormData({ ...formData, track: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="트랙 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="software">소프트웨어</SelectItem>
                      <SelectItem value="control">제어/알고리즘</SelectItem>
                      <SelectItem value="hardware">하드웨어</SelectItem>
                      <SelectItem value="ai">AI/비전</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="email">이메일 *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="phone">연락처 *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="motivation">지원 동기 *</Label>
                <Textarea
                  id="motivation"
                  required
                  rows={4}
                  placeholder="동아리에 지원하게 된 동기를 작성해주세요"
                  value={formData.motivation}
                  onChange={(e) =>
                    setFormData({ ...formData, motivation: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="experience">관련 경험 및 역량</Label>
                <Textarea
                  id="experience"
                  rows={4}
                  placeholder="로봇, 프로그래밍, 전자 관련 경험이나 역량을 작성해주세요 (선택)"
                  value={formData.experience}
                  onChange={(e) =>
                    setFormData({ ...formData, experience: e.target.value })
                  }
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-[#103078] hover:bg-[#2048A0]"
              >
                지원서 제출
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
