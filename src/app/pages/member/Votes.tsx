import {
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  Crown,
  FileText,
  GitPullRequestArrow,
  ListChecks,
  Lock,
  Plus,
  RotateCcw,
  ShieldCheck,
  UserMinus,
  Vote,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Textarea } from "../../components/ui/textarea";

const presidentSteps = [
  {
    title: "회장 유고 발생",
    description: "사임, 휴학, 장기 부재가 확정되면 임시회장 체제로 전환합니다.",
    icon: UserMinus,
  },
  {
    title: "임시회장 지정",
    description: "운영 공백을 막기 위해 권한 범위를 제한한 임시회장이 투표를 준비합니다.",
    icon: ShieldCheck,
  },
  {
    title: "후보 추천과 수락",
    description: "추천된 후보는 3일 안에 수락해야 하며, 미응답 시 자동 미수락 처리됩니다.",
    icon: CalendarClock,
  },
  {
    title: "후보 사퇴 반영",
    description: "투표 시작 전 사퇴는 즉시 반영하고, 시작 후에는 공지와 함께 별도 처리합니다.",
    icon: RotateCcw,
  },
];

const presidentVotes = [
  {
    title: "2026-1 회장 보궐 선거",
    status: "진행 중",
    mode: "결선 투표",
    description: "1차 투표에서 과반 후보가 없어 상위 2인 결선을 진행합니다.",
    candidates: ["정민서", "오하준"],
    turnout: "24 / 32명 참여",
    closesAt: "2026-04-30 18:00",
  },
  {
    title: "단일 후보 찬반 투표 예시",
    status: "대기",
    mode: "단일 후보 찬반",
    description: "후보가 1명일 경우 찬성/반대 기준으로 선출 여부를 판단합니다.",
    candidates: ["김나윤"],
    turnout: "시작 전",
    closesAt: "추천 수락 마감 후 시작",
  },
];

const agendaVotes = [
  {
    title: "신규 장비 구매 우선순위",
    type: "복수 선택",
    visibility: "종료 즉시 결과 공개",
    anonymous: "익명",
    options: ["라이다", "모터 드라이버", "3D 프린터 필라멘트"],
  },
  {
    title: "정기 세미나 요일 변경",
    type: "찬반",
    visibility: "운영진 검토 후 공개",
    anonymous: "기명",
    options: ["찬성", "반대"],
  },
];

const voteRules = [
  "시작 전에는 제목, 선택지, 기간을 수정할 수 있습니다.",
  "투표 시작 후에는 신뢰성을 위해 내용 수정이 불가합니다.",
  "복수 선택 투표는 최대 선택 수를 반드시 지정해야 합니다.",
  "결과 공개 시점은 생성 시 선택하며 시작 후 변경할 수 없습니다.",
];

export default function Votes() {
  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold mb-1">투표</h1>
          <p className="text-gray-600">
            회장 선출과 일반 안건 투표를 같은 정책 아래에서 투명하게 관리합니다.
          </p>
        </div>
        <Button className="w-full bg-[#103078] hover:bg-[#2048A0] sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />안건 만들기
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {[
          ["진행 중", "3", "text-[#103078]"],
          ["대기", "2", "text-amber-600"],
          ["종료", "9", "text-gray-600"],
          ["내 미참여", "1", "text-red-600"],
        ].map(([label, value, color]) => (
          <Card key={label}>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 mb-1">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="president" className="space-y-6">
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="president">회장 투표</TabsTrigger>
          <TabsTrigger value="agenda">일반 안건</TabsTrigger>
          <TabsTrigger value="create">안건 생성</TabsTrigger>
        </TabsList>

        <TabsContent value="president" className="space-y-6">
          <Alert className="border-[#103078]/20 bg-blue-50/60">
            <Crown className="h-4 w-4 text-[#103078]" />
            <AlertTitle>회장 유고 대응 정책</AlertTitle>
            <AlertDescription>
              회장 유고 시 임시회장이 후보 추천을 열고, 후보는 3일 안에 수락해야 투표 후보로 확정됩니다.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {presidentSteps.map((step) => {
              const Icon = step.icon;
              return (
                <Card key={step.title} className="border-[#103078]/10">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#103078]/10">
                        <Icon className="h-5 w-5 text-[#103078]" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold">{step.title}</p>
                        <p className="mt-1 text-sm leading-6 text-gray-600">{step.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {presidentVotes.map((vote) => (
              <Card key={vote.title} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap gap-2">
                        <Badge className="bg-[#2048A0] hover:bg-[#2048A0]">{vote.status}</Badge>
                        <Badge variant="outline">{vote.mode}</Badge>
                      </div>
                      <CardTitle className="text-lg">{vote.title}</CardTitle>
                      <p className="mt-2 text-sm leading-6 text-gray-600">{vote.description}</p>
                    </div>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#103078]/10">
                      <Vote className="h-6 w-6 text-[#103078]" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">후보</p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {vote.candidates.map((candidate) => (
                        <div key={candidate} className="rounded-lg border p-3 text-sm font-medium">
                          {candidate}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 rounded-lg bg-gray-50 p-4 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-gray-500">참여 현황</p>
                      <p className="font-semibold text-[#103078]">{vote.turnout}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">마감</p>
                      <p className="font-semibold">{vote.closesAt}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" className="bg-[#103078] hover:bg-[#2048A0]">투표하기</Button>
                    <Button size="sm" variant="outline">후보 추천 내역</Button>
                    <Button size="sm" variant="outline">사퇴/공지 기록</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="agenda" className="space-y-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {agendaVotes.map((agenda) => (
              <Card key={agenda.title} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap gap-2">
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">진행 중</Badge>
                        <Badge variant="outline">{agenda.type}</Badge>
                        <Badge variant="outline">{agenda.anonymous}</Badge>
                      </div>
                      <CardTitle className="text-lg">{agenda.title}</CardTitle>
                      <p className="mt-2 text-sm text-gray-600">{agenda.visibility}</p>
                    </div>
                    <FileText className="h-6 w-6 shrink-0 text-[#103078]" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RadioGroup defaultValue={agenda.options[0]}>
                    {agenda.options.map((option) => (
                      <label key={option} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
                        <RadioGroupItem value={option} />
                        <span className="min-w-0 flex-1">{option}</span>
                      </label>
                    ))}
                  </RadioGroup>
                  <Button className="w-full bg-[#103078] hover:bg-[#2048A0]">선택 제출</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="create">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <Card className="min-w-0">
              <CardHeader>
                <CardTitle className="text-lg">일반 안건 생성 폼</CardTitle>
                <p className="text-sm text-gray-600">생성 후 시작 전까지는 수정 가능, 시작 후에는 수정 불가합니다.</p>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="vote-title">안건 제목</Label>
                    <Input id="vote-title" placeholder="예: 정기 세미나 요일 변경" />
                  </div>
                  <div className="space-y-2">
                    <Label>결과 공개 시점</Label>
                    <Select defaultValue="after-close">
                      <SelectTrigger>
                        <SelectValue placeholder="공개 시점 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="after-close">종료 즉시 공개</SelectItem>
                        <SelectItem value="after-review">운영진 검토 후 공개</SelectItem>
                        <SelectItem value="hidden">비공개 보관</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vote-description">설명</Label>
                  <Textarea id="vote-description" placeholder="안건 배경, 영향 범위, 결정 기준을 적어주세요." className="min-h-28" />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>익명/기명</Label>
                    <RadioGroup defaultValue="anonymous">
                      <label className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                        <RadioGroupItem value="anonymous" />익명
                      </label>
                      <label className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                        <RadioGroupItem value="named" />기명
                      </label>
                    </RadioGroup>
                  </div>
                  <div className="space-y-2">
                    <Label>투표 방식</Label>
                    <RadioGroup defaultValue="agree">
                      <label className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                        <RadioGroupItem value="agree" />찬반
                      </label>
                      <label className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                        <RadioGroupItem value="single" />단일 선택
                      </label>
                      <label className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                        <RadioGroupItem value="multiple" />복수 선택
                      </label>
                    </RadioGroup>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-choice">최대 선택 수</Label>
                    <Input id="max-choice" type="number" min="1" placeholder="복수 선택 시 예: 2" />
                    <p className="text-xs leading-5 text-gray-500">찬반/단일 선택은 1로 고정됩니다.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>선택지</Label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Input placeholder="선택지 1" />
                    <Input placeholder="선택지 2" />
                    <Input placeholder="선택지 3 (선택)" />
                    <Button variant="outline" type="button">
                      <Plus className="h-4 w-4 mr-2" />선택지 추가
                    </Button>
                  </div>
                </div>

                <label className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  <Checkbox />
                  <span>투표 시작 후에는 제목, 설명, 선택지, 공개 시점을 수정할 수 없음을 확인했습니다.</span>
                </label>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button className="bg-[#103078] hover:bg-[#2048A0] sm:flex-1">안건 저장</Button>
                  <Button variant="outline" className="sm:flex-1">미리보기</Button>
                </div>
              </CardContent>
            </Card>

            <aside className="space-y-4 min-w-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">생성 정책 체크리스트</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {voteRules.map((rule) => (
                    <div key={rule} className="flex items-start gap-2 text-sm leading-6 text-gray-700">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      <span>{rule}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-[#103078]/20 bg-gradient-to-br from-white to-blue-50/40">
                <CardHeader>
                  <CardTitle className="text-base">투표 유형 안내</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-6 text-gray-700">
                  <div className="flex gap-2">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#103078]" />찬반은 승인/반려가 명확한 안건에 적합합니다.
                  </div>
                  <div className="flex gap-2">
                    <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-[#103078]" />단일 선택은 여러 후보 중 하나를 고를 때 사용합니다.
                  </div>
                  <div className="flex gap-2">
                    <GitPullRequestArrow className="mt-0.5 h-4 w-4 shrink-0 text-[#103078]" />복수 선택은 우선순위 조사에 적합합니다.
                  </div>
                  <div className="flex gap-2">
                    <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#103078]" />익명 여부와 결과 공개 시점은 시작 후 잠깁니다.
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
