import {
  Bell,
  Check,
  Crown,
  Handshake,
  KeyRound,
  Settings,
  ShieldCheck,
  Trash2,
  Vote,
} from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";

type NotificationCategory = "contact" | "vote" | "project" | "permission";

const categoryConfig: Record<
  NotificationCategory,
  { label: string; icon: typeof Bell; className: string }
> = {
  contact: {
    label: "연락 요청",
    icon: Handshake,
    className: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  },
  vote: {
    label: "투표",
    icon: Vote,
    className: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  },
  project: {
    label: "프로젝트 승인",
    icon: ShieldCheck,
    className: "bg-green-100 text-green-700 hover:bg-green-100",
  },
  permission: {
    label: "권한 양도",
    icon: KeyRound,
    className: "bg-purple-100 text-purple-700 hover:bg-purple-100",
  },
};

const notifications = [
  {
    id: 1,
    category: "contact" as NotificationCategory,
    title: "김하린 님이 연락을 요청했습니다",
    message: "SLAM 스터디 참여 전 준비 자료와 첫 모임 장소를 확인하고 싶다는 요청입니다.",
    time: "10분 전",
    unread: true,
    status: "응답 대기",
  },
  {
    id: 2,
    category: "vote" as NotificationCategory,
    title: "회장 보궐 선거 결선 투표가 시작되었습니다",
    message: "1차 투표에서 과반 후보가 없어 상위 2인 결선 투표가 진행 중입니다.",
    time: "1시간 전",
    unread: true,
    status: "참여 필요",
  },
  {
    id: 3,
    category: "project" as NotificationCategory,
    title: "자율주행 프로젝트 참여가 승인되었습니다",
    message: "운영진 승인으로 프로젝트 멤버 권한이 부여되었습니다. 온보딩 자료를 확인해 주세요.",
    time: "어제",
    unread: false,
    status: "승인 완료",
  },
  {
    id: 4,
    category: "permission" as NotificationCategory,
    title: "장비 관리 권한 양도 요청이 도착했습니다",
    message: "기존 담당자가 다음 학기 장비 대여 관리 권한을 양도하려고 합니다.",
    time: "2일 전",
    unread: true,
    status: "수락 필요",
  },
  {
    id: 5,
    category: "vote" as NotificationCategory,
    title: "정기 세미나 요일 변경 안건이 마감되었습니다",
    message: "결과 공개 시점 설정에 따라 운영진 검토 후 결과가 공개될 예정입니다.",
    time: "3일 전",
    unread: false,
    status: "마감",
  },
  {
    id: 6,
    category: "contact" as NotificationCategory,
    title: "반복 연락 요청 경고가 기록되었습니다",
    message: "동일한 대상에게 짧은 시간 안에 유사한 요청이 반복되어 자동화 차단 정책 안내가 발송되었습니다.",
    time: "4일 전",
    unread: false,
    status: "정책 안내",
  },
];

const quickStats = [
  { label: "읽지 않음", value: notifications.filter((item) => item.unread).length, color: "text-[#103078]" },
  { label: "연락 요청", value: notifications.filter((item) => item.category === "contact").length, color: "text-blue-600" },
  { label: "투표", value: notifications.filter((item) => item.category === "vote").length, color: "text-amber-600" },
  { label: "승인/권한", value: notifications.filter((item) => item.category === "project" || item.category === "permission").length, color: "text-green-600" },
];

function NotificationCard({ notification }: { notification: (typeof notifications)[number] }) {
  const config = categoryConfig[notification.category];
  const Icon = config.icon;

  return (
    <Card
      className={`transition-shadow hover:shadow-md ${
        notification.unread ? "border-l-4 border-l-[#2048A0] bg-blue-50/30" : ""
      }`}
    >
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
              notification.unread ? "bg-[#2048A0]" : "bg-gray-200"
            }`}
          >
            <Icon className={`h-5 w-5 ${notification.unread ? "text-white" : "text-gray-500"}`} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge className={config.className}>{config.label}</Badge>
                  <Badge variant="outline">{notification.status}</Badge>
                  {notification.unread && <Badge className="bg-[#103078] hover:bg-[#103078]">새 알림</Badge>}
                </div>
                <h3 className="font-semibold leading-6">{notification.title}</h3>
                <p className="mt-1 text-sm leading-6 text-gray-600">{notification.message}</p>
                <p className="mt-2 text-xs text-gray-500">{notification.time}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 self-end sm:self-start">
                <Trash2 className="h-4 w-4 text-gray-400" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Notifications() {
  const unreadNotifications = notifications.filter((item) => item.unread);
  const actionRequired = notifications.filter(
    (item) => item.status.includes("필요") || item.status.includes("대기"),
  );

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold mb-1">알림</h1>
          <p className="text-gray-600">
            연락 요청, 투표, 프로젝트 승인, 권한 양도 알림을 한곳에서 확인합니다.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <Check className="h-4 w-4 mr-2" />모두 읽음 처리
          </Button>
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <Settings className="h-4 w-4 mr-2" />설정
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value="unread">
            읽지 않음 <Badge className="ml-2 bg-[#103078] hover:bg-[#103078]">{unreadNotifications.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="actions">처리 필요</TabsTrigger>
          <TabsTrigger value="contact">연락 요청</TabsTrigger>
          <TabsTrigger value="vote">투표</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3">
          {notifications.map((notification) => (
            <NotificationCard key={notification.id} notification={notification} />
          ))}
        </TabsContent>

        <TabsContent value="unread" className="space-y-3">
          {unreadNotifications.map((notification) => (
            <NotificationCard key={notification.id} notification={notification} />
          ))}
        </TabsContent>

        <TabsContent value="actions" className="space-y-3">
          {actionRequired.map((notification) => (
            <NotificationCard key={notification.id} notification={notification} />
          ))}
        </TabsContent>

        <TabsContent value="contact" className="space-y-3">
          {notifications
            .filter((notification) => notification.category === "contact")
            .map((notification) => (
              <NotificationCard key={notification.id} notification={notification} />
            ))}
        </TabsContent>

        <TabsContent value="vote" className="space-y-3">
          {notifications
            .filter((notification) => notification.category === "vote")
            .map((notification) => (
              <NotificationCard key={notification.id} notification={notification} />
            ))}
        </TabsContent>
      </Tabs>

      <Card className="border-[#103078]/20 bg-gradient-to-br from-white to-blue-50/40">
        <CardHeader>
          <CardTitle className="text-base">알림 수신 정책</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 text-sm leading-6 text-gray-700 md:grid-cols-2">
            <div className="flex items-start gap-2">
              <Bell className="mt-0.5 h-4 w-4 shrink-0 text-[#103078]" />
              중요한 투표와 권한 양도 요청은 읽지 않음 상태로 우선 표시됩니다.
            </div>
            <div className="flex items-start gap-2">
              <Crown className="mt-0.5 h-4 w-4 shrink-0 text-[#103078]" />
              회장 선거, 임시회장 지정, 후보 수락 마감 알림은 투표 카테고리에 포함됩니다.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
