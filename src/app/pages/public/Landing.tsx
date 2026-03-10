import { Link } from "react-router";
import {
  ArrowRight,
  Code,
  Cpu,
  Trophy,
  Users,
  Calendar,
  Clock,
  MapPin,
  BookOpen,
  Lightbulb,
  Target,
  Award,
  Rocket,
  ChevronRight,
  Star,
  Zap,
  GitBranch,
  Cog,
  ExternalLink,
  Search,
  Plus,
  Minus,
  X
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../components/ui/accordion";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import logo from "@/assets/mainLogo.png";
import newLogo from "@/assets/mainLogo.png";
import navLogo from "@/assets/mainLogo.png";
import { useState, useEffect } from "react";
import { motion } from "motion/react";

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.calendar-day') && !target.closest('.event-popover')) {
        setSelectedDay(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const techTags = [
    { name: "ROS", icon: Cog, anchor: "#tracks" },
    { name: "Arduino", icon: Cpu, anchor: "#tracks" },
    { name: "Vision", icon: Target, anchor: "#tracks" },
    { name: "Web/IoT", icon: GitBranch, anchor: "#tracks" },
    { name: "Project", icon: Rocket, anchor: "#projects" },
  ];

  const bentoCards = [
    {
      size: "large",
      title: "대표 프로젝트",
      subtitle: "자율주행 로봇 개발",
      description: "SLAM 기반 실내 네비게이션 시스템으로 대회 금상 수상",
      image: "https://images.unsplash.com/photo-1563968743333-044cef800494?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb2JvdCUyMGFybSUyMG1hbnVmYWN0dXJpbmd8ZW58MXx8fHwxNzcxMTUwMDU2fDA&ixlib=rb-4.1.0&q=80&w=1080",
      link: "/projects",
    },
    {
      size: "medium",
      title: "스터디 트랙 4개",
      subtitle: "관심 트랙을 선택해 커리큘럼을 확인하세요",
      items: [
        { icon: Code, label: "ROS·로보틱스", count: "12", id: "ros" },
        { icon: Cpu, label: "임베디드·IoT", count: "8", id: "embedded" },
        { icon: Target, label: "컴퓨터 비전", count: "10", id: "vision" },
        { icon: GitBranch, label: "웹·통합", count: "7", id: "web" },
      ],
    },
    {
      size: "medium",
      title: "최근 업데이트",
      updates: [
        { type: "공지", title: "신입 부원 모집 시작", time: "2시간 전", detail: "2026 봄학기 모집", color: "red" },
        { type: "스터디", title: "ROS Navigation 세미나", time: "5시간 전", detail: "310호 오후 2시", color: "blue" },
        { type: "회의", title: "프로젝트 중간 발표", time: "1일 전", detail: "팀별 진행상황", color: "green" },
      ],
    },
    {
      size: "small",
      title: "다음 일정",
      subtitle: "이번 주 일정",
      icon: Calendar,
      items: [
        { title: "ROS 워크샵", date: "2/18", time: "19:00", location: "310호" },
        { title: "프로젝트 발표", date: "2/20", time: "14:00", location: "대강당" },
        { title: "신입 환영회", date: "2/22", time: "18:00", location: "310호" },
      ],
    },
    {
      size: "small",
      title: "모집 현황",
      highlight: "D-5",
      subtitle: "지원 마감까지",
      icon: Clock,
    },
    {
      size: "small",
      title: "최근 활동",
      images: [
        "https://images.unsplash.com/photo-1755053757912-a63da9d6e0e2?w=400",
        "https://images.unsplash.com/photo-1723730741656-6333f4840ecf?w=400",
        "https://images.unsplash.com/photo-1638202677704-b74690bb8fa9?w=400",
      ],
    },
  ];

  // 커리큘럼 데이터
  const trackCurricula = {
    ros: {
      title: "ROS·로보틱스 트랙",
      description: "ROS2 기반 로봇 제어 및 자율주행 시스템 개발",
      weeks: [
        {
          week: 1,
          topic: "ROS2 기초",
          content: "ROS2 설치, 워크스페이스 구성 및 패키지 관리",
          keywords: ["설치", "워크스페이스", "colcon"],
          output: "개발 환경 구축 완료"
        },
        {
          week: 2,
          topic: "노드 & 토픽",
          content: "Publisher/Subscriber 패턴으로 노드 간 데이터 통신",
          keywords: ["pub/sub", "topic", "msg"],
          output: "pub/sub 실습 코드 + rosbag 기록"
        },
        {
          week: 3,
          topic: "서비스 & 액션",
          content: "동기/비동기 RPC 통신 및 장기 작업 관리",
          keywords: ["service", "action", "client"],
          output: "서비스/액션 서버 구현체"
        },
        {
          week: 4,
          topic: "Navigation Stack",
          content: "SLAM, AMCL 기반 자율주행 시뮬레이션",
          keywords: ["SLAM", "Nav2", "Gazebo"],
          output: "자율주행 데모 영상 + 코드"
        },
      ]
    },
    embedded: {
      title: "임베디드·IoT 트랙",
      description: "ARM Cortex-M 기반 임베디드 시스템 및 IoT 개발",
      weeks: [
        {
          week: 1,
          topic: "임베디드 기초",
          content: "ARM 아키텍처 이해 및 C 프로그래밍 기초",
          keywords: ["ARM", "C언어", "레지스터"],
          output: "GPIO 제어 LED 예제"
        },
        {
          week: 2,
          topic: "센서 인터페이스",
          content: "I2C, SPI, UART 프로토콜 및 센서 데이터 읽기",
          keywords: ["I2C", "SPI", "UART"],
          output: "센서 드라이버 라이브러리"
        },
        {
          week: 3,
          topic: "IoT 프로토콜",
          content: "MQTT, CoAP로 클라우드 연동 및 실시간 데이터 전송",
          keywords: ["MQTT", "CoAP", "클라우드"],
          output: "IoT 데이터 수집 시스템"
        },
        {
          week: 4,
          topic: "스마트홈 프로젝트",
          content: "센서-임베디드-앱 통합 스마트홈 시스템 구현",
          keywords: ["통합", "앱", "제어"],
          output: "스마트홈 프로토타입 + 발표자료"
        },
      ]
    },
    vision: {
      title: "컴퓨터 비전 트랙",
      description: "OpenCV 및 딥러닝 기반 영상처리 및 객체인식",
      weeks: [
        {
          week: 1,
          topic: "영상처리 기초",
          content: "OpenCV 설치 및 이미지 필터링, 변환 기법",
          keywords: ["OpenCV", "필터", "변환"],
          output: "이미지 처리 예제 코드"
        },
        {
          week: 2,
          topic: "특징 추출",
          content: "Edge, Corner 검출 및 SIFT/SURF 기반 매칭",
          keywords: ["Edge", "SIFT", "매칭"],
          output: "특징점 매칭 프로그램"
        },
        {
          week: 3,
          topic: "딥러닝 객체 탐지",
          content: "CNN 구조 이해 및 YOLO 모델 훈련/추론",
          keywords: ["CNN", "YOLO", "훈련"],
          output: "커스텀 데이터셋 학습 결과"
        },
        {
          week: 4,
          topic: "실시간 인식 시스템",
          content: "웹캠 연동 실시간 객체 인식 애플리케이션",
          keywords: ["실시간", "웹캠", "최적화"],
          output: "실시간 인식 데모 + 성능보고서"
        },
      ]
    },
    web: {
      title: "웹·통합 트랙",
      description: "React 기반 웹 개발 및 시스템 통합",
      weeks: [
        {
          week: 1,
          topic: "React 기초",
          content: "컴포넌트, JSX, Hooks를 활용한 UI 구성",
          keywords: ["컴포넌트", "Hooks", "JSX"],
          output: "기본 React 앱 + 컴포넌트 모음"
        },
        {
          week: 2,
          topic: "상태 관리",
          content: "Context API 및 Redux로 복잡한 상태 관리",
          keywords: ["Context", "Redux", "상태"],
          output: "상태 관리 예제 프로젝트"
        },
        {
          week: 3,
          topic: "API 통합",
          content: "REST API, WebSocket 연동 및 데이터 페칭",
          keywords: ["REST", "WebSocket", "fetch"],
          output: "API 통합 대시보드"
        },
        {
          week: 4,
          topic: "로봇 제어 대시보드",
          content: "ROS 브릿지 연동 실시간 로봇 모니터링/제어 시스템",
          keywords: ["ROS Bridge", "실시간", "제어"],
          output: "로봇 제어 웹앱 + 배포"
        },
      ]
    }
  };

  const playbook = [
    {
      step: "1",
      title: "가입",
      description: "신입 부원 지원 및 합격",
      output: "동아리 멤버십",
      period: "2주",
      mission: "지원서 작성 · 면접",
    },
    {
      step: "2",
      title: "온보딩",
      description: "개발 환경 세팅",
      output: "Git/GitHub 완료",
      period: "1주",
      mission: "개발환경 구축 · 첫 PR",
    },
    {
      step: "3",
      title: "미니프로젝트",
      description: "기초 로봇 실습",
      output: "Arduino 프로젝트 1개",
      period: "3주",
      mission: "센서 제어 · LED 제어",
    },
    {
      step: "4",
      title: "팀프로젝트",
      description: "본격 프로젝트 참여",
      output: "ROS 기반 로봇 1대",
      period: "8주",
      mission: "팀 협업 · 중간발표",
    },
    {
      step: "5",
      title: "데모데이",
      description: "최종 발표 및 시연",
      output: "포트폴리오 완성",
      period: "1주",
      mission: "발표 · 시연 · 평가",
    },
  ];

  const showcaseProjects = [
    {
      title: "자율주행 로봇",
      description: "SLAM 기반 실내 네비게이션 시스템",
      achievement: "금상",
      image: "https://images.unsplash.com/photo-1563968743333-044cef800494?w=600",
      tags: ["ROS", "SLAM"],
    },
    {
      title: "로봇팔 제어",
      description: "역기구학 기반 정밀 제어 시스템",
      achievement: "논문",
      image: "https://images.unsplash.com/photo-1723730741656-6333f4840ecf?w=600",
      tags: ["C++", "Kinematics"],
    },
    {
      title: "드론 자동착륙",
      description: "컴퓨터 비전 기반 자율 착륙",
      achievement: "특허",
      image: "https://images.unsplash.com/photo-1697122171927-c79709030f1d?w=600",
      tags: ["Vision", "AI"],
    },
    {
      title: "물체 인식 시스템",
      description: "실시간 객체 탐지 및 분류",
      achievement: "산학협력",
      image: "https://images.unsplash.com/photo-1649877508777-1554357604eb?w=600",
      tags: ["YOLO", "TensorFlow"],
    },
    {
      title: "다중 로봇 협업",
      description: "멀티 에이전트 시스템 구현",
      achievement: "국제대회",
      image: "https://images.unsplash.com/photo-1553408226-42ecf81a214c?w=600",
      tags: ["Multi-Agent", "ROS2"],
    },
    {
      title: "휴머노이드 보행",
      description: "이족 보행 제어 알고리즘",
      achievement: "우수상",
      image: "https://images.unsplash.com/photo-1582192904915-d89c7250b235?w=600",
      tags: ["Control", "Simulation"],
    },
    {
      title: "스마트 팩토리",
      description: "IoT 기반 공정 자동화",
      achievement: "기업 프로젝트",
      image: "https://images.unsplash.com/photo-1638202677704-b74690bb8fa9?w=600",
      tags: ["IoT", "Automation"],
    },
    {
      title: "의료 로봇 보조",
      description: "AI 기반 진단 보조 시스템",
      achievement: "연구비",
      image: "https://images.unsplash.com/photo-1755053757912-a63da9d6e0e2?w=600",
      tags: ["Medical", "AI"],
    },
  ];

  const galleryImages = [
    {
      url: "https://images.unsplash.com/photo-1755053757912-a63da9d6e0e2?w=400",
      caption: "임베디드 스터디",
      date: "2026.02",
      description: "Arduino 센서 제어 실습",
      tag: "임베디드",
    },
    {
      url: "https://images.unsplash.com/photo-1723730741656-6333f4840ecf?w=400",
      caption: "ROS 세미나",
      date: "2026.01",
      description: "Navigation Stack 세팅",
      tag: "ROS",
    },
    {
      url: "https://images.unsplash.com/photo-1638202677704-b74690bb8fa9?w=400",
      caption: "해커톤 준비",
      date: "2025.12",
      description: "팀 빌딩 및 기획",
      tag: "해커톤",
    },
    {
      url: "https://images.unsplash.com/photo-1582192904915-d89c7250b235?w=400",
      caption: "데모데이",
      date: "2025.11",
      description: "최종 프로젝트 발표",
      tag: "프로젝트",
    },
    {
      url: "https://images.unsplash.com/photo-1563968743333-044cef800494?w=400",
      caption: "로봇 조립",
      date: "2025.10",
      description: "하드웨어 제작 및 테스트",
      tag: "제작",
    },
    {
      url: "https://images.unsplash.com/photo-1697122171927-c79709030f1d?w=400",
      caption: "드론 테스트",
      date: "2025.09",
      description: "자율비행 알고리즘 검증",
      tag: "드론",
    },
  ];

  const faqs = [
    {
      q: "비전공자도 지원할 수 있나요?",
      a: "네! 열정과 배우려는 의지가 있다면 전공 무관하게 환영합니다. 기초부터 체계적으로 교육하며, 선배 멘토가 1:1로 도와드립니다.",
      link: { text: "지원하기", url: "/recruit" },
      category: "지원",
    },
    {
      q: "면접이나 과제가 있나요?",
      a: "네, 간단한 면접이 있습니다. 기술 지식보다는 동기와 열정을 중심으로 진행되며, 사전 과제는 없습니다.",
      link: { text: "모집요강 보기", url: "/recruit" },
      category: "지원",
    },
    {
      q: "신입은 무엇부터 배우나요?",
      a: "첫 달은 Git/GitHub, Linux 기초부터 시작합니다. 이후 관심 트랙에 맞춰 ROS, Arduino, Vision 중 선택하여 진행합니다.",
      link: { text: "커리큘럼 보기", url: "#playbook" },
      category: "활동",
    },
    {
      q: "활동 시간은 어떻게 되나요?",
      a: "정기 세션은 주 1-2회(주로 저녁 시간)이며, 프로젝트는 팀별로 자율적으로 진행됩니다. 시험기간에는 활동을 최소화합니다.",
      link: { text: "일정 보기", url: "#calendar" },
      category: "운영",
    },
    {
      q: "활동 장소는 어디인가요?",
      a: "주로 과학기술관 310호 동아리실에서 활동합니다. 프로젝트실과 하드웨어 장비를 갖추고 있으며, 24시간 이용 가능합니다.",
      link: { text: "오시는 길", url: "/contact" },
      category: "장소",
    },
    {
      q: "회비나 참가비가 있나요?",
      a: "학기당 소정의 회비(3만원)가 있으며, 프로젝트 재료비와 대회 출전비는 동아리 예산으로 지원됩니다.",
      link: { text: "회비 안내", url: "/recruit#fee" },
      category: "비용",
    },
    {
      q: "필요한 장비가 있나요?",
      a: "개인 노트북이 필요하며, 로봇 개발용 하드웨어(Arduino, 센서, 모터 등)는 동아리에서 지원합니다. 고가 장비도 대여 가능합니다.",
      link: { text: "장비 목록", url: "#equipment" },
      category: "비용",
    },
    {
      q: "어떤 프로젝트를 하나요?",
      a: "자율주행 로봇, 드론, 로봇팔 제어, 물체 인식 등 다양한 분야의 프로젝트를 진행합니다. 본인의 아이디어로 새 프로젝트를 제안할 수도 있습니다.",
      link: { text: "프로젝트 보기", url: "#projects" },
      category: "활동",
    },
    {
      q: "대회 참가 기회가 있나요?",
      a: "네, 국내외 로봇 경진대회에 정기적으로 참가하며 여러 수상 경력이 있습니다. 대회 준비비와 참가비는 동아리에서 지원합니다.",
      link: { text: "수상 이력", url: "#showcase" },
      category: "활동",
    },
    {
      q: "스터디는 어떻게 운영되나요?",
      a: "ROS, Vision, IoT 등 트랙별로 스터디를 운영하며, 멤버가 직접 주제를 제안할 수 있습니다. 주 1회 발표와 실습으로 진행됩니다.",
      link: { text: "트랙 보기", url: "#tracks" },
      category: "운영",
    },
    {
      q: "졸업 후 진로는 어떤가요?",
      a: "삼성전자, 네이버, 현대자동차 등 대기업 및 로봇 스타트업으로 다수 취업하고 있습니다. 대학원 진학도 활발합니다.",
      link: { text: "진로 통계", url: "/notice#career" },
      category: "활동",
    },
  ];

  // Event data structure with start/end dates, times, and colors
  interface CalendarEvent {
    id: number;
    title: string;
    startDate: number;
    endDate: number;
    startTime: string;
    endTime: string;
    duration: number;
    location: string;
    description: string;
    bgColor: string;
    textColor: string;
    legendBg: string;
  }

  const events: CalendarEvent[] = [
    { id: 1, title: '데모데이', startDate: 5, endDate: 5, startTime: '09:00', endTime: '18:00', duration: 1, location: '대강당', description: '학기 말 최종 프로젝트 발표 및 시연', bgColor: 'bg-red-100/30', textColor: 'text-red-700', legendBg: 'bg-red-200' },
    { id: 2, title: '모닝 스탠드업', startDate: 10, endDate: 10, startTime: '09:00', endTime: '09:30', duration: 1, location: '310호', description: '주간 진행사항 공유 및 계획 수립', bgColor: 'bg-amber-100/30', textColor: 'text-amber-700', legendBg: 'bg-amber-200' },
    { id: 3, title: '팀 회의', startDate: 10, endDate: 11, startTime: '10:00', endTime: '12:00', duration: 2, location: '310호', description: '프로젝트 팀별 정기 회의', bgColor: 'bg-orange-100/30', textColor: 'text-orange-700', legendBg: 'bg-orange-200' },
    { id: 4, title: '코드 리뷰', startDate: 10, endDate: 11, startTime: '14:00', endTime: '16:00', duration: 2, location: '온라인', description: 'PR 리뷰 및 코드 품질 개선', bgColor: 'bg-teal-100/30', textColor: 'text-teal-700', legendBg: 'bg-teal-200' },
    { id: 5, title: '디자인 싱크', startDate: 10, endDate: 10, startTime: '16:00', endTime: '17:00', duration: 1, location: '310호', description: 'UI/UX 디자인 검토 및 피드백', bgColor: 'bg-cyan-100/30', textColor: 'text-cyan-700', legendBg: 'bg-cyan-200' },
    { id: 6, title: 'ROS 워크샵', startDate: 12, endDate: 13, startTime: '10:00', endTime: '17:00', duration: 2, location: '실습실', description: 'ROS Navigation Stack 실습', bgColor: 'bg-purple-100/30', textColor: 'text-purple-700', legendBg: 'bg-purple-200' },
    { id: 7, title: '프로젝트 스프린트', startDate: 18, endDate: 20, startTime: '09:00', endTime: '18:00', duration: 3, location: '310호', description: '집중 개발 기간 및 중간 점검', bgColor: 'bg-blue-100/30', textColor: 'text-blue-700', legendBg: 'bg-blue-200' },
    { id: 8, title: '신입 환영회', startDate: 22, endDate: 22, startTime: '18:00', endTime: '21:00', duration: 1, location: '공학관 310호', description: '신입 부원 환영 및 네트워킹', bgColor: 'bg-pink-100/30', textColor: 'text-pink-700', legendBg: 'bg-pink-200' },
    { id: 9, title: '해커톤 위크', startDate: 25, endDate: 28, startTime: '08:00', endTime: '22:00', duration: 4, location: '전체 동아리실', description: '아이디어 기획부터 구현까지', bgColor: 'bg-green-100/30', textColor: 'text-green-700', legendBg: 'bg-green-200' },
  ];

  // Helper to get events for a specific day
  const getEventsForDay = (day: number) => {
    return events.filter(e => day >= e.startDate && day <= e.endDate);
  };

  // Helper to sort events by start time, then by duration (longer first)
  const sortEvents = (eventsForDay: CalendarEvent[]) => {
    return [...eventsForDay].sort((a, b) => {
      if (a.startTime !== b.startTime) {
        return a.startTime.localeCompare(b.startTime);
      }
      return b.duration - a.duration;
    });
  };

  return (
    <div className="bg-white">
      {/* Sticky Glass Header */}
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
          ? "h-[60px] bg-white/75 backdrop-blur-[20px] shadow-sm"
          : "h-[72px] bg-white/85 backdrop-blur-[12px]"
          }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="max-w-[1240px] mx-auto px-6 h-full flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img
              src={navLogo}
              alt="Kookmin Robot"
              className={`transition-all duration-300 ${scrolled ? "h-5" : "h-6"
                }`}
            />
          </Link>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <Link
              to="/member"
              className="text-sm font-medium text-gray-700 hover:text-[#103078] transition-colors"
            >
              로그인
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Hero Section - 2 Column */}
      <section id="hero" className="pt-[120px] pb-20">
        <div className="max-w-[1240px] mx-auto px-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left - Text */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center justify-center lg:sticky lg:top-32 pt-32"
            >
              {/* Large Logo */}
              <img
                src={newLogo}
                alt="Kobot"
                className="w-full max-w-[800px] h-auto mb-3"
              />

              {/* Subtitle */}
              <p className="text-lg text-gray-600 mb-6 text-center">
                소프트웨어융합대학 로봇 학술동아리
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <Button
                  size="lg"
                  asChild
                  className="bg-[#103078] hover:bg-[#2048A0] text-base h-12 px-8 w-40"
                >
                  <Link to="/recruit">
                    지원하기 <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="text-base h-12 px-8 w-40 bg-white border-gray-300 text-gray-700 hover:bg-white hover:border-[#103078] hover:text-gray-700 active:bg-white active:border-gray-300 active:text-gray-700 focus:bg-white focus:border-gray-300 focus:text-gray-700"
                >
                  <a
                    href="/activities"
                    className="no-underline"
                  >
                    활동 보기
                  </a>
                </Button>
              </div>

              {/* Tech Tags - 2 rows fixed */}
              <div className="flex flex-col gap-2 items-center">
                <div className="flex gap-2">
                  {techTags.slice(0, 3).map((tag, index) => {
                    const Icon = tag.icon;
                    return (
                      <Badge
                        key={index}
                        variant="outline"
                        className="px-3 py-2 border-[#103078]/30 text-[#103078] hover:bg-[#103078]/5 transition-colors cursor-pointer"
                      >
                        <Icon className="h-3.5 w-3.5 mr-1.5" />
                        {tag.name}
                      </Badge>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  {techTags.slice(3).map((tag, index) => {
                    const Icon = tag.icon;
                    return (
                      <Badge
                        key={index + 3}
                        variant="outline"
                        className="px-3 py-2 border-[#103078]/30 text-[#103078] hover:bg-[#103078]/5 transition-colors cursor-pointer"
                      >
                        <Icon className="h-3.5 w-3.5 mr-1.5" />
                        {tag.name}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* Right - Schedule Dashboard */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="space-y-4">
                {/* Upcoming Events Card */}
                <Card className="border-gray-200 hover:border-[#2048A0] transition-all shadow-lg">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-[#2048A0]" />
                        2월 일정
                      </h3>
                    </div>

                    {/* Mini Calendar Grid */}
                    <div>
                      {/* Weekday Headers */}
                      <div className="grid grid-cols-7 gap-1.5 mb-2">
                        {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
                          <div key={idx} className="text-center text-[10px] font-semibold text-gray-600 py-0.5">
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* Calendar Days */}
                      <div className="grid grid-cols-7 gap-1.5">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28].map((day) => {
                          const isToday = day === 15;
                          const isSelected = day === 15;
                          const dayEvents = sortEvents(getEventsForDay(day));
                          const visibleEvents = dayEvents.slice(0, 2);
                          const hiddenCount = Math.max(0, dayEvents.length - 2);

                          return (
                            <div
                              key={day}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDay(day);
                              }}
                              className={`
                                min-h-[65px] p-1 rounded-md flex flex-col items-center justify-start bg-white
                                hover:bg-gray-50 transition-all cursor-pointer relative calendar-day
                              `}
                            >
                              {/* Day Number with indicator */}
                              <div className="relative flex flex-col items-center mb-0.5">
                                <div className={`
                                  text-[11px] font-semibold text-gray-900
                                  ${isSelected ? 'w-5 h-5 rounded-full bg-[#2048A0]/10 flex items-center justify-center text-[#2048A0]' : ''}
                                `}>
                                  {day}
                                </div>
                                {isToday && (
                                  <div className="w-1 h-1 rounded-full bg-[#2048A0] mt-0.5" />
                                )}
                              </div>

                              {/* Event bars stacked */}
                              <div className="w-full space-y-0.5">
                                {visibleEvents.map((event, idx) => {
                                  const isStart = day === event.startDate;
                                  const isEnd = day === event.endDate;
                                  const isSingleDay = event.startDate === event.endDate;

                                  return (
                                    <div
                                      key={`${event.id}-${day}-${idx}`}
                                      className={`h-[14px] px-1 py-0.5 text-[7px] font-medium truncate event-bar relative ${event.bgColor} ${event.textColor} ${isSingleDay ? 'rounded-sm' : isStart ? 'rounded-l-sm' : isEnd ? 'rounded-r-sm' : ''}`}
                                    >
                                      {isStart ? event.title : '...'}
                                    </div>
                                  );
                                })}

                                {/* +N more indicator */}
                                {hiddenCount > 0 && (
                                  <div className="h-[14px] px-1 py-0.5 text-[7px] font-medium text-gray-500 bg-gray-100/50 rounded-sm">
                                    +{hiddenCount}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Upcoming Events List */}
                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <div className="text-xs font-semibold text-gray-600 mb-2">임박한 일정</div>
                        <div className="space-y-1.5">
                          {/* Project Sprint - 18일 */}
                          <div className="flex items-start justify-between p-2 rounded-lg bg-blue-50/50 hover:bg-blue-50 transition-colors">
                            <div className="flex items-start gap-2 flex-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1" />
                              <div className="flex-1">
                                <div className="text-[11px] font-medium text-gray-900">프로젝트 스프린트</div>
                                <div className="text-[9px] text-gray-600">2/18 - 2/20</div>
                                <div className="text-[8px] text-gray-500 mt-0.5">09:00 시작</div>
                              </div>
                            </div>
                            <div className="text-[9px] font-medium text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                              D-3
                            </div>
                          </div>

                          {/* Welcome Party - 22일 */}
                          <div className="flex items-start justify-between p-2 rounded-lg bg-pink-50/50 hover:bg-pink-50 transition-colors">
                            <div className="flex items-start gap-2 flex-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-1" />
                              <div className="flex-1">
                                <div className="text-[11px] font-medium text-gray-900">신입 환영회</div>
                                <div className="text-[9px] text-gray-600">2/22 18:00</div>
                                <div className="text-[8px] text-gray-500 mt-0.5">장소: 공학관 310호</div>
                              </div>
                            </div>
                            <div className="text-[9px] font-medium text-pink-700 bg-pink-100 px-1.5 py-0.5 rounded">
                              D-7
                            </div>
                          </div>

                          {/* Hackathon Week - 25일 */}
                          <div className="flex items-start justify-between p-2 rounded-lg bg-green-50/50 hover:bg-green-50 transition-colors">
                            <div className="flex items-start gap-2 flex-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1" />
                              <div className="flex-1">
                                <div className="text-[11px] font-medium text-gray-900">해커톤 위크</div>
                                <div className="text-[9px] text-gray-600">2/25 - 2/28</div>
                                <div className="text-[8px] text-gray-500 mt-0.5">대상: 전체 부원</div>
                              </div>
                            </div>
                            <div className="text-[9px] font-medium text-green-700 bg-green-100 px-1.5 py-0.5 rounded">
                              D-10
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Event Detail Popover */}
      {selectedDay && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="event-popover bg-white rounded-xl shadow-2xl border border-gray-200 p-5 max-w-md w-full relative max-h-[80vh] overflow-y-auto"
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedDay(null)}
              className="absolute top-3 right-3 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors z-10"
            >
              <X className="h-4 w-4 text-gray-600" />
            </button>

            {/* Date Header */}
            <div className="mb-4 pr-8">
              <div className="text-sm text-gray-500 mb-1">2월</div>
              <h3 className="text-2xl font-bold text-gray-900">
                {selectedDay}일
              </h3>
            </div>

            {/* Events List */}
            {(() => {
              const dayEvents = getEventsForDay(selectedDay);
              if (dayEvents.length === 0) {
                return (
                  <div className="py-8 text-center">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">이 날은 예정된 일정이 없습니다</p>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  <div className="text-sm font-medium text-gray-600 mb-3">
                    총 {dayEvents.length}개의 일정
                  </div>
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`p-4 rounded-lg border-l-4 ${event.bgColor} hover:shadow-md transition-all`}
                      style={{ borderLeftColor: event.textColor.replace('text-', '') }}
                    >
                      {/* Event Badge */}
                      <div className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-2 ${event.bgColor} ${event.textColor}`}>
                        활동
                      </div>

                      {/* Event Title */}
                      <h4 className="font-bold text-gray-900 mb-2">
                        {event.title}
                      </h4>

                      {/* Event Details */}
                      <div className="space-y-1.5 text-sm">
                        {/* Time */}
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>{event.startTime} - {event.endTime}</span>
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>{event.location}</span>
                        </div>

                        {/* Description */}
                        <div className="pt-2 text-xs text-gray-500">
                          {event.description}
                        </div>
                      </div>

                      {/* Duration Badge */}
                      {event.startDate !== event.endDate && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="text-xs text-gray-500">
                            📅 {event.duration}일 일정 (2월 {event.startDate}일 - {event.endDate}일)
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </motion.div>
        </div>
      )}

      {/* Bento Grid Section */}
      <section id="about" className="pt-20 pb-40 bg-gray-50">
        <div className="max-w-[1240px] mx-auto px-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-4"
          >
            <h2 className="text-5xl font-bold text-gray-900 mb-3">
              지금 K<span className="text-[#2048A0]">⚙️</span>bot은?
            </h2>
            <p className="text-lg text-gray-600">이번 학기 운영 현황을 한눈에 확인</p>
          </motion.div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[200px] mt-8">
            {/* Large Card - Project */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-2 lg:row-span-2"
            >
              <Card className="h-full border-gray-200 hover:border-[#2048A0] hover:shadow-xl transition-all group overflow-hidden cursor-pointer">
                <Link
                  to={bentoCards[0].link}
                  className="block h-full"
                  onClick={() => {
                    setTimeout(() => window.scrollTo(0, 0), 0);
                  }}
                >
                  <CardContent className="p-0 h-full relative">
                    <ImageWithFallback
                      src={bentoCards[0].image}
                      alt={bentoCards[0].title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                      <Badge className="mb-3 bg-white/20 backdrop-blur-sm text-white border-0">
                        대표 프로젝트
                      </Badge>
                      <h3 className="text-2xl font-bold mb-2">{bentoCards[0].subtitle}</h3>
                      <p className="text-white/90 mb-4 line-clamp-1">{bentoCards[0].description}</p>
                      <Button
                        size="sm"
                        className="bg-white text-gray-900 hover:bg-white/90 shadow-md group-hover:translate-x-1 transition-transform"
                      >
                        더 보기 <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            </motion.div>

            {/* Medium Card - Study Tracks */}
            <motion.div
              id="tracks"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:row-span-2"
            >
              <Card className="h-full border-gray-200 hover:border-[#2048A0] hover:shadow-xl transition-all">
                <CardContent className="p-6 h-full flex flex-col">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {bentoCards[1].title}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {bentoCards[1].subtitle}
                    </p>
                  </div>
                  <div className="space-y-3 flex-1">
                    {bentoCards[1].items?.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                          onClick={() => setSelectedTrack(item.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#103078]/10 flex items-center justify-center">
                              <Icon className="h-4 w-4 text-[#103078]" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {item.label}
                            </span>
                          </div>
                          <div className="text-xs tabular-nums">
                            <span className="font-bold text-gray-900">{item.count}</span>
                            <span className="text-gray-500 ml-0.5">명</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-xs text-gray-500 mt-4 pt-3 border-t border-gray-200 text-center">
                    총 4트랙 · 37명 참여
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* 커리큘럼 모달 */}
          {selectedTrack && trackCurricula[selectedTrack as keyof typeof trackCurricula] && (
            <div
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedTrack(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* 헤더 - 높이 감소 및 그라데이션 약화 */}
                <div className="bg-gradient-to-r from-[#103078] to-[#1a4292] text-white p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">
                        {trackCurricula[selectedTrack as keyof typeof trackCurricula].title}
                      </h3>
                      <p className="text-white/90 text-sm">
                        {trackCurricula[selectedTrack as keyof typeof trackCurricula].description}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedTrack(null)}
                      className="text-white bg-white/15 hover:bg-white/25 rounded-full p-2 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* 커리큘럼 내용 - 여백 증가 */}
                <div className="px-8 py-7 overflow-y-auto max-h-[calc(80vh-140px)]">
                  <div className="space-y-5">
                    {trackCurricula[selectedTrack as keyof typeof trackCurricula].weeks.map((week, idx) => {
                      // 현재 진행중인 주차 (예: 2주차)
                      const currentWeek = 2;
                      const isCompleted = week.week < currentWeek;
                      const isInProgress = week.week === currentWeek;
                      const isPending = week.week > currentWeek;

                      // 상태별 스타일
                      const borderStyle = isInProgress
                        ? 'border-l-[#2048A0] border-l-2'
                        : 'border-l-gray-200 border-l-[1px]';

                      const bgStyle = isCompleted
                        ? 'bg-gray-50/50'
                        : isPending
                          ? 'bg-blue-50/20'
                          : 'bg-blue-50/40';

                      return (
                        <div
                          key={week.week}
                          className={`relative ${bgStyle} rounded-lg p-5 hover:shadow-md transition-shadow border-l-4 ${borderStyle}`}
                        >
                          <div className="flex items-start gap-4">
                            {/* 원형 배지 - 크기 줄이고 테두리 스타일 */}
                            <div className="flex-shrink-0 relative">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base font-bold transition-all ${isCompleted
                                ? 'bg-green-50 text-green-700 border-2 border-green-300'
                                : isInProgress
                                  ? 'bg-[#2048A0]/10 text-[#2048A0] border-2 border-[#2048A0]'
                                  : 'bg-white text-gray-400 border-2 border-gray-200'
                                }`}>
                                {isCompleted ? '✓' : week.week}
                              </div>
                            </div>

                            <div className="flex-1 space-y-2.5">
                              {/* 주차 라벨 + 상태 배지 */}
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                  Week {week.week}
                                </span>
                                {isCompleted && (
                                  <Badge className="text-xs px-2 py-0 h-5 rounded-full bg-green-100 text-green-700 border-0">
                                    완료
                                  </Badge>
                                )}
                                {isInProgress && (
                                  <Badge className="text-xs px-2 py-0 h-5 rounded-full bg-blue-100 text-blue-700 border-0 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                                    진행중
                                  </Badge>
                                )}
                                {isPending && (
                                  <Badge className="text-xs px-2 py-0 h-5 rounded-full bg-gray-100 text-gray-600 border-0">
                                    예정
                                  </Badge>
                                )}
                              </div>

                              {/* 제목 */}
                              <h4 className="text-base font-bold text-gray-900">{week.topic}</h4>

                              {/* 한 줄 설명 */}
                              <p className="text-sm text-gray-600 leading-relaxed">{week.content}</p>

                              {/* 키워드 칩 */}
                              <div className="flex flex-wrap gap-1.5">
                                {week.keywords?.map((keyword, kidx) => (
                                  <Badge
                                    key={kidx}
                                    variant="secondary"
                                    className="text-xs px-2.5 py-0.5 h-6 rounded-md bg-blue-50 text-blue-600 border border-blue-200/50 font-medium whitespace-nowrap"
                                  >
                                    {keyword}
                                  </Badge>
                                ))}
                              </div>

                              {/* 산출물 - 칩 형태 */}
                              <div className="pt-2 flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-semibold text-gray-500">산출물</span>
                                <Badge
                                  variant="outline"
                                  className="text-xs px-2.5 py-1 h-6 rounded-md bg-gray-50 text-gray-700 border-gray-200 font-normal"
                                >
                                  {week.output}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 하단 액션 */}
                  <div className="mt-7 pt-6 border-t border-gray-200">
                    <Button
                      className="w-full bg-[#103078] hover:bg-[#2048A0] text-white"
                      onClick={() => setSelectedTrack(null)}
                    >
                      닫기
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Updates & Schedule Section - 2 Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Left - Updates Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="h-auto border-gray-200 hover:border-[#2048A0] hover:shadow-xl transition-all overflow-hidden">
                <CardContent className="p-6 flex flex-col">
                  <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <h3 className="text-xl font-bold text-gray-900">
                      {bentoCards[2].title}
                    </h3>
                    <Link
                      to="/member/announcements"
                      className="text-sm font-medium text-[#103078] hover:text-[#2048A0] hover:underline flex items-center gap-1 group transition-colors"
                    >
                      전체 보기 <span className="text-[#103078]">(3)</span>
                      <ChevronRight className="h-3 w-3 text-[#103078] group-hover:text-[#2048A0] group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {bentoCards[2].updates?.map((update, idx) => {
                      const borderColors = {
                        'red': 'border-l-red-400/60',
                        'blue': 'border-l-blue-400/60',
                        'green': 'border-l-green-400/60'
                      };
                      const badgeColors = {
                        'red': 'text-red-700 border-red-300 bg-red-50',
                        'blue': 'text-blue-700 border-blue-300 bg-blue-50',
                        'green': 'text-green-700 border-green-300 bg-green-50'
                      };
                      return (
                        <div
                          key={idx}
                          className={`bg-white p-4 rounded-lg border border-gray-200 ${borderColors[update.color as keyof typeof borderColors]} border-l-[3px] hover:shadow-sm transition-all cursor-pointer group`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <Badge
                              variant="outline"
                              className={`${badgeColors[update.color as keyof typeof badgeColors]} flex-shrink-0 text-xs`}
                            >
                              {update.type}
                            </Badge>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <span className="text-xs text-gray-600 whitespace-nowrap">
                                <span className="font-medium">{update.time.split(' ')[0]}</span>
                                <span> {update.time.split(' ').slice(1).join(' ')}</span>
                              </span>
                              <ChevronRight className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                          <div className="text-sm font-semibold text-gray-900 group-hover:text-[#2048A0] transition-colors mb-1">
                            {update.title}
                          </div>
                          <div className="text-[11px] text-gray-400">
                            {update.detail}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Right - Schedule Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="h-auto border-gray-200 hover:border-[#2048A0] hover:shadow-xl transition-all overflow-hidden">
                <CardContent className="p-6 flex flex-col">
                  <div className="flex items-center gap-2 mb-4 flex-shrink-0">
                    <Calendar className="h-5 w-5 text-[#2048A0]" />
                    <h3 className="text-xl font-bold text-gray-900">
                      {bentoCards[3].title}
                    </h3>
                  </div>
                  <div className="space-y-2.5">
                    {bentoCards[3].items?.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all cursor-pointer group relative"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-gray-900 mb-0.5">
                              {item.title}
                            </div>
                            <div className="text-[11px] text-gray-400">
                              {item.date} {item.time} · {item.location}
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-300 opacity-0 group-hover:opacity-100 group-hover:text-[#2048A0] transition-all flex-shrink-0 mt-0.5" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end flex-shrink-0">
                    <Link
                      to="/member/events"
                      className="text-xs font-medium text-[#103078] hover:text-[#2048A0] hover:underline flex items-center gap-1 group transition-colors"
                    >
                      전체 일정 보기
                      <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Playbook Section */}
      <section id="playbook" className="pt-20 pb-20 bg-white">
        <div className="max-w-[1240px] mx-auto px-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-5xl font-bold text-gray-900 mb-4">
              학기 플레이북
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              5단계로 완성하는 로봇 개발자 여정
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {playbook.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full border-gray-200 hover:border-[#2048A0] hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold mb-4"
                        style={{
                          background: `linear-gradient(135deg, #103078 ${index * 20}%, #2048A0 100%)`
                        }}
                      >
                        {item.step}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3 leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                      <div className="text-xs text-gray-500 mb-1">
                        기간: {item.period}
                      </div>
                      <div className="text-xs text-gray-500 mb-3">
                        산출물: {item.output}
                      </div>
                      <Badge className="bg-[#103078]/10 text-[#103078] hover:bg-[#103078]/20 cursor-pointer border border-[#103078]/20 group-hover:border-[#103078]/40 transition-all">
                        <Zap className="h-3 w-3 mr-1" />
                        {item.mission}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-20 bg-gray-50">
        <div className="max-w-[1240px] mx-auto px-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h2 className="text-5xl font-bold text-gray-900 mb-2">활동 갤러리</h2>
              <p className="text-lg text-gray-600">생생한 K⚙️BOT 활동 현장</p>
            </div>
            <Link
              to="/activities"
              className="text-sm font-medium text-[#103078] hover:text-[#2048A0] hover:underline flex items-center gap-1 group transition-colors"
            >
              전체 보기 <span className="text-[#103078]">(24)</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </motion.div>

          {/* 3-Column Grid Gallery */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryImages.map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <Link to="/activities">
                  <Card className="h-full border-gray-200 hover:border-[#2048A0] hover:shadow-xl transition-all group overflow-hidden cursor-pointer">
                    <CardContent className="p-0">
                      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                        <ImageWithFallback
                          src={image.url}
                          alt={image.caption}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 grayscale-[40%] group-hover:grayscale-0"
                          style={{ filter: 'brightness(0.95) contrast(1.05)' }}
                        />
                        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="h-4 w-4 text-[#103078]" />
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-base font-bold text-gray-900 group-hover:text-[#2048A0] transition-colors">
                            {image.caption}
                          </h3>
                          <span className="text-xs text-gray-400 whitespace-nowrap">{image.date}</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-3 line-clamp-1">
                          {image.description}
                        </p>
                        <Badge variant="outline" className="text-xs bg-gray-50/50 text-gray-600 border-gray-200">
                          {image.tag}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-white">
        <div className="max-w-[900px] mx-auto px-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h2 className="text-5xl font-bold text-gray-900 mb-3">
              자주 묻는 질문
            </h2>
            <p className="text-lg text-gray-600 mb-1">
              궁금한 점이 있으신가요?
            </p>

          </motion.div>

          {/* Category Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-wrap justify-center gap-2 mb-6"
          >
            {['전체', '지원', '운영', '활동', '비용', '장소'].map((category, idx) => (
              null
            ))}
          </motion.div>

          {/* Search Input */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative mb-8"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="궁금한 내용을 검색해보세요"
              className="pl-10 h-11 text-sm bg-white border-gray-300 focus:border-[#2048A0]"
            />
          </motion.div>

          {/* FAQ Accordion */}
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.slice(0, 6).map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:border-[#2048A0] hover:bg-[#103078]/[0.05] transition-colors"
              >
                <AccordionItem
                  value={`item-${index}`}
                  className="border-0 data-[state=open]:bg-[#103078]/[0.02]"
                >
                  <AccordionTrigger className="px-5 pt-3.5 pb-3.5 text-left font-semibold text-gray-900 hover:text-[#2048A0] hover:no-underline group">
                    <div className="flex items-start justify-between gap-3 w-full pr-4">
                      <span>{faq.q}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 pb-4 text-gray-600 text-sm">
                    <div className="space-y-2">
                      <p className="leading-relaxed">{faq.a}</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>

          {/* View All Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center mt-8"
          >
            <Link to="/faq">
              <Button
                variant="outline"
                size="lg"
                className="border-[#103078] text-[#103078] hover:bg-[#103078] hover:text-white transition-colors"
              >
                자세히 보기
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="min-h-[400px] flex items-center justify-center bg-gradient-to-br from-[#103078] via-[#1a3d88] to-[#2048A0] text-white relative overflow-hidden">
        {/* Subtle noise texture overlay */}
        <div className="absolute inset-x-0 top-0 h-[30%] opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'5\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />

        <div className="max-w-[900px] mx-auto px-6 sm:px-20 text-center relative z-10 py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              2026 봄학기 신입 부원 모집
            </h2>
            <div className="flex items-center justify-center gap-3 mb-2">
              <p className="text-base sm:text-lg">
                지원 마감: 2026년 2월 20일 (목)
              </p>
              <Badge className="bg-white/15 backdrop-blur-sm text-white text-sm px-3 py-1 border border-white/20">
                D-5
              </Badge>
            </div>
            <p className="text-sm text-white/80 mb-6">
              5단계 커리큘럼 · 팀프로젝트 · 데모데이까지 한 학기 완주
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button
                size="lg"
                variant="secondary"
                asChild
                className="text-base h-12 px-8 w-full sm:w-[200px] bg-white text-[#103078] hover:bg-white/90 shadow-sm"
              >
                <Link to="/recruit">
                  지원하기 <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="text-base h-12 px-8 w-full sm:w-[200px] border-white/40 bg-white/5 backdrop-blur-sm text-white hover:bg-white/10 hover:border-white/60"
              >
                <Link to="/recruit#requirements">
                  모집 요강 보기 <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Stats with dividers */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6 relative">
              {[
                { value: "32+", label: "현재 회원" },
                { value: "24+", label: "누적 프로젝트" },
                { value: "8회", label: "대회 수상" },
                { value: "50+", label: "누적 스터디 세션" },
              ].map((stat, idx) => (
                <div key={idx} className="relative">

                  <div className="text-xs sm:text-sm text-white/70">{stat.label}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-white/50 mt-5 text-center">업데이트: 2026.02</p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}