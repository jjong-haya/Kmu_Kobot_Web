import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Flag,
  Mail,
  MessageSquare,
  Phone,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Checkbox } from "../../components/ui/checkbox";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";

type RequestStatus = "pending" | "accepted" | "rejected";

const statusConfig: Record<
  RequestStatus,
  { label: string; className: string; icon: typeof Clock3 }
> = {
  pending: {
    label: "대기",
    className: "bg-amber-100 text-amber-700 hover:bg-amber-100",
    icon: Clock3,
  },
  accepted: {
    label: "수락",
    className: "bg-green-100 text-green-700 hover:bg-green-100",
    icon: CheckCircle2,
  },
  rejected: {
    label: "거절",
    className: "bg-gray-100 text-gray-700 hover:bg-gray-100",
    icon: XCircle,
  },
};

const contactRequests = [
  {
    id: 1,
    requester: "김하린",
    requesterRole: "신입 부원",
    reason: "SLAM 스터디 참여 전 준비 자료와 첫 모임 장소를 확인하고 싶습니다.",
    disclosedMethods: ["이메일", "카카오톡 오픈채팅"],
    requestedAt: "2026-04-28 10:20",
    dueText: "응답 기한 D-2",
    status: "pending" as RequestStatus,
  },
  {
    id: 2,
    requester: "이도윤",
    requesterRole: "프로젝트 지원자",
    reason: "자율주행 프로젝트 온보딩 일정 조율을 위해 연락을 요청했습니다.",
    disclosedMethods: ["이메일", "전화번호"],
    requestedAt: "2026-04-27 18:05",
    dueText: "응답 기한 D-1",
    status: "accepted" as RequestStatus,
    responderContacts: ["이메일"],
  },
  {
    id: 3,
    requester: "박서준",
    requesterRole: "외부 협업 문의",
    reason: "동일한 장비 대여 문의를 반복 요청하여 정책 검토가 필요합니다.",
    disclosedMethods: ["이메일"],
    requestedAt: "2026-04-25 09:40",
    dueText: "반복 요청 경고 1회",
    status: "rejected" as RequestStatus,
  },
];

const policyCards = [
  {
    title: "3일 미응답 자동 거절",
    description: "요청 수신 후 3일 안에 수락하지 않으면 개인정보 보호를 위해 자동 거절됩니다.",
    icon: Clock3,
  },
  {
    title: "스팸 신고와 반복 요청 경고",
    description: "불필요하거나 반복적인 요청은 신고할 수 있으며 누적 시 요청 기능이 제한됩니다.",
    icon: ShieldAlert,
  },
  {
    title: "자동화 요청 차단",
    description: "짧은 시간 다량 요청, 동일 문구 반복, 비정상 패턴은 자동으로 차단됩니다.",
    icon: ShieldCheck,
  },
];

export default function ContactRequests() {
  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold mb-1">연락 요청</h1>
          <p className="text-gray-600">
            연락처는 서로 동의한 범위에서만 공개되며, 요청 사유와 공개 수단을 먼저 확인합니다.
          </p>
        </div>
        <Button className="w-full bg-[#103078] hover:bg-[#2048A0] sm:w-auto">
          <MessageSquare className="h-4 w-4 mr-2" />새 요청 작성
        </Button>
      </div>

      <Alert className="border-[#103078]/20 bg-blue-50/60">
        <ShieldCheck className="h-4 w-4 text-[#103078]" />
        <AlertTitle>개인정보 공개 원칙</AlertTitle>
        <AlertDescription>
          요청자는 연락 이유와 본인이 공개할 연락수단을 제출하고, 수락자는 수락 시 공개할 연락처를 직접 선택합니다.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {policyCards.map((policy) => {
          const Icon = policy.icon;
          return (
            <Card key={policy.title} className="border-[#103078]/10">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#103078]/10">
                    <Icon className="h-5 w-5 text-[#103078]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold">{policy.title}</p>
                    <p className="mt-1 text-sm leading-6 text-gray-600">{policy.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-4 min-w-0">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">받은 요청 현황</h2>
              <p className="text-sm text-gray-600">상태는 mock 데이터이며 실제 저장소 연결 전 UI 흐름입니다.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">대기 1</Badge>
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">수락 1</Badge>
              <Badge variant="outline">거절 1</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {contactRequests.map((request) => {
              const StatusIcon = statusConfig[request.status].icon;
              return (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="space-y-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#103078] text-white">
                          <UserRound className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-base break-keep">{request.requester}</CardTitle>
                          <p className="text-sm text-gray-600">{request.requesterRole}</p>
                        </div>
                      </div>
                      <Badge className={statusConfig[request.status].className}>
                        <StatusIcon className="h-3.5 w-3.5 mr-1" />
                        {statusConfig[request.status].label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">연락 이유</p>
                      <p className="text-sm leading-6 text-gray-700">{request.reason}</p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2">요청자가 공개한 연락수단</p>
                      <div className="flex flex-wrap gap-2">
                        {request.disclosedMethods.map((method) => (
                          <Badge key={method} variant="outline" className="text-xs">
                            {method}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {request.status === "accepted" && (
                      <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                        수락자가 공개한 연락처: {request.responderContacts?.join(", ")}
                      </div>
                    )}

                    <div className="flex flex-col gap-2 border-t pt-4 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
                      <span>{request.requestedAt}</span>
                      <span className="font-medium text-[#103078]">{request.dueText}</span>
                    </div>

                    {request.status === "pending" && (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <Button size="sm" className="bg-[#103078] hover:bg-[#2048A0]">수락</Button>
                        <Button size="sm" variant="outline">거절</Button>
                        <Button size="sm" variant="outline" className="text-red-600">
                          <Flag className="h-3.5 w-3.5 mr-1" />신고
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <aside className="space-y-4 min-w-0">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">연락 요청 작성</CardTitle>
              <p className="text-sm text-gray-600">DB 연결 전 mock 입력 폼입니다.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="target-member">요청 대상</Label>
                <Input id="target-member" placeholder="예: 홍길동" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="request-reason">연락 이유</Label>
                <Textarea
                  id="request-reason"
                  placeholder="요청 목적, 필요한 응답, 관련 프로젝트를 구체적으로 적어주세요."
                  className="min-h-28"
                />
              </div>

              <div className="space-y-2">
                <Label>요청자가 공개할 연락수단</Label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
                  {[
                    { id: "email", label: "이메일", icon: Mail },
                    { id: "phone", label: "전화번호", icon: Phone },
                    { id: "chat", label: "오픈채팅", icon: MessageSquare },
                  ].map((method) => {
                    const Icon = method.icon;
                    return (
                      <label
                        key={method.id}
                        htmlFor={method.id}
                        className="flex items-center gap-2 rounded-lg border p-3 text-sm"
                      >
                        <Checkbox id={method.id} />
                        <Icon className="h-4 w-4 text-gray-500" />
                        {method.label}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label>요청 긴급도</Label>
                <RadioGroup defaultValue="normal" className="grid-cols-1 sm:grid-cols-3 xl:grid-cols-1">
                  {[
                    ["normal", "일반"],
                    ["soon", "3일 내 필요"],
                    ["low", "여유 있음"],
                  ].map(([value, label]) => (
                    <label key={value} className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                      <RadioGroupItem value={value} />
                      {label}
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <Button className="w-full bg-[#103078] hover:bg-[#2048A0]">요청 보내기</Button>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/70">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
                <div className="text-sm leading-6 text-amber-800">
                  <p className="font-semibold">수락 시 공개할 연락처 선택</p>
                  <p>연락 요청을 수락할 때 이메일, 전화번호, 오픈채팅 중 필요한 항목만 선택해 공개합니다.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">수락 응답 예시</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select defaultValue="email">
                <SelectTrigger>
                  <SelectValue placeholder="공개할 연락처 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">이메일만 공개</SelectItem>
                  <SelectItem value="chat">오픈채팅만 공개</SelectItem>
                  <SelectItem value="both">이메일 + 오픈채팅 공개</SelectItem>
                </SelectContent>
              </Select>
              <Textarea placeholder="응답 메시지를 입력하세요." />
              <Button variant="outline" className="w-full">선택한 연락처로 수락</Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
