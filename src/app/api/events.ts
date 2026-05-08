export type EventStatus = "scheduled" | "ongoing" | "closed";

export type EventImageTone = "navy" | "amber" | "green" | "slate" | "red";

export type EventFeatureKey =
  | "externalForm"
  | "participantSurvey"
  | "attendanceCheck"
  | "teamFormation";

export type EventQuestionType =
  | "short_text"
  | "long_text"
  | "single_choice"
  | "multiple_choice"
  | "dropdown"
  | "linear_scale"
  | "number"
  | "date"
  | "time";

export type EventQuestion = {
  id: string;
  label: string;
  type: EventQuestionType;
  required: boolean;
  choices?: string[];
};

export type EventExternalFormFeature = {
  enabled: boolean;
  provider: "google_forms" | "internal";
  title: string;
  url?: string;
  deadline?: string;
  requiredFields: string[];
};

export type EventParticipantSurveyFeature = {
  enabled: boolean;
  title: string;
  description: string;
  questions: EventQuestion[];
};

export type EventAttendanceFeature = {
  enabled: boolean;
  expectedCount: number;
  checkedInCount: number;
  method: "manual" | "qr";
};

export type EventTeamFormationFeature = {
  enabled: boolean;
  teamSize: number;
  description: string;
};

export type EventFeatureSettings = {
  externalForm: EventExternalFormFeature;
  participantSurvey: EventParticipantSurveyFeature;
  attendanceCheck: EventAttendanceFeature;
  teamFormation: EventTeamFormationFeature;
};

export type EventScheduleItem = {
  time: string;
  title: string;
};

export type ClubEvent = {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  location: string;
  organizer: string;
  capacityLabel: string;
  imageTone: EventImageTone;
  imageTones?: EventImageTone[];
  schedule: EventScheduleItem[];
  features: EventFeatureSettings;
};

export type CreateClubEventInput = Omit<ClubEvent, "id"> & {
  id?: string;
};

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  scheduled: "예정",
  ongoing: "진행중",
  closed: "마감",
};

export const EVENT_STATUS_FILTERS = [
  { key: "scheduled", label: EVENT_STATUS_LABELS.scheduled },
  { key: "ongoing", label: EVENT_STATUS_LABELS.ongoing },
  { key: "closed", label: EVENT_STATUS_LABELS.closed },
] satisfies { key: EventStatus; label: string }[];

export const EVENT_IMAGE_TONE_OPTIONS = [
  { key: "navy", label: "네이비" },
  { key: "amber", label: "앰버" },
  { key: "green", label: "그린" },
  { key: "slate", label: "슬레이트" },
  { key: "red", label: "레드" },
] satisfies { key: EventImageTone; label: string }[];

export const EVENT_FEATURE_OPTIONS = [
  {
    key: "externalForm",
    label: "신청 폼",
    description: "구글폼 또는 내부 신청 폼을 행사에 연결합니다.",
  },
  {
    key: "participantSurvey",
    label: "참여자 조사",
    description: "참여자 장비, 팀, 난이도, 요구사항을 행사 전에 수집합니다.",
  },
  {
    key: "attendanceCheck",
    label: "참석 체크",
    description: "행사 당일 참석 여부와 실제 참여 인원을 관리합니다.",
  },
  {
    key: "teamFormation",
    label: "팀 편성",
    description: "대회나 해커톤처럼 팀 단위 참여가 필요한 행사를 관리합니다.",
  },
] satisfies { key: EventFeatureKey; label: string; description: string }[];

function disabledExternalForm(): EventExternalFormFeature {
  return {
    enabled: false,
    provider: "google_forms",
    title: "",
    requiredFields: [],
  };
}

function disabledSurvey(): EventParticipantSurveyFeature {
  return {
    enabled: false,
    title: "",
    description: "",
    questions: [],
  };
}

function disabledAttendance(): EventAttendanceFeature {
  return {
    enabled: false,
    expectedCount: 0,
    checkedInCount: 0,
    method: "manual",
  };
}

function disabledTeamFormation(): EventTeamFormationFeature {
  return {
    enabled: false,
    teamSize: 1,
    description: "",
  };
}

function features(
  overrides: Partial<EventFeatureSettings> = {},
): EventFeatureSettings {
  return {
    externalForm: overrides.externalForm ?? disabledExternalForm(),
    participantSurvey: overrides.participantSurvey ?? disabledSurvey(),
    attendanceCheck: overrides.attendanceCheck ?? disabledAttendance(),
    teamFormation: overrides.teamFormation ?? disabledTeamFormation(),
  };
}

const EVENTS: ClubEvent[] = [
  {
    id: "kobot-game-cup-2026",
    title: "KOBOT 게임 로봇 대회",
    description:
      "소형 로봇으로 미션을 수행하는 내부 게임 대회입니다. 참가자는 사전 신청 후 장비 보유 여부와 팀 구성을 제출해야 합니다.",
    startsAt: "2026-06-13T13:00:00+09:00",
    endsAt: "2026-06-13T18:00:00+09:00",
    location: "공학관 로봇실",
    organizer: "KOBOT 운영팀",
    capacityLabel: "최대 24명",
    imageTone: "red",
    imageTones: ["red", "navy", "amber"],
    schedule: [
      { time: "13:00", title: "참가자 확인 및 장비 세팅" },
      { time: "14:00", title: "예선 미션" },
      { time: "16:00", title: "결승 토너먼트" },
      { time: "17:30", title: "결과 발표" },
    ],
    features: features({
      externalForm: {
        enabled: true,
        provider: "internal",
        title: "대회 참가 신청",
        url: "/member/forms/kobot-game-cup-2026-registration",
        deadline: "2026-06-10T23:59:00+09:00",
        requiredFields: ["이름", "연락처", "팀 이름", "장비 보유 여부", "리그전 팀 등록"],
      },
      participantSurvey: {
        enabled: true,
        title: "참여자 사전 조사",
        description: "팀 구성과 장비 준비 상태를 대회 전에 확인합니다.",
        questions: [
          {
            id: "robot-kit",
            label: "개인 로봇 키트를 보유하고 있나요?",
            type: "single_choice",
            required: true,
            choices: ["보유", "대여 필요"],
          },
          {
            id: "team-size",
            label: "희망 팀 인원",
            type: "single_choice",
            required: true,
            choices: ["1명", "2명", "3명"],
          },
          {
            id: "notes",
            label: "운영팀에 전달할 내용",
            type: "short_text",
            required: false,
          },
        ],
      },
      attendanceCheck: {
        enabled: true,
        expectedCount: 24,
        checkedInCount: 0,
        method: "manual",
      },
      teamFormation: {
        enabled: true,
        teamSize: 3,
        description: "최대 3명까지 한 팀으로 참가할 수 있습니다.",
      },
    }),
  },
  {
    id: "demo-day-2026",
    title: "2026 KOBOT 데모데이",
    description: "프로젝트 팀별 로봇 시연과 기술 발표를 한 자리에서 공유합니다.",
    startsAt: "2026-05-18T15:00:00+09:00",
    endsAt: "2026-05-18T18:00:00+09:00",
    location: "공학관 로봇실",
    organizer: "프로젝트 운영팀",
    capacityLabel: "자유 참여",
    imageTone: "navy",
    imageTones: ["navy", "green", "amber"],
    schedule: [
      { time: "15:00", title: "프로젝트 부스 오픈" },
      { time: "16:00", title: "팀별 발표" },
      { time: "17:30", title: "피드백 및 네트워킹" },
    ],
    features: features({
      externalForm: {
        enabled: true,
        provider: "google_forms",
        title: "데모데이 참석 신청",
        url: "https://forms.gle/example-kobot-demo-day",
        deadline: "2026-05-17T23:59:00+09:00",
        requiredFields: ["이름", "참석 가능 시간"],
      },
      attendanceCheck: {
        enabled: true,
        expectedCount: 40,
        checkedInCount: 0,
        method: "manual",
      },
    }),
  },
  {
    id: "autonomous-workshop-2026",
    title: "자율주행 로봇 제작 워크숍",
    description: "센서 세팅부터 경로 계획까지 직접 조립하고 테스트합니다.",
    startsAt: "2026-05-06T10:00:00+09:00",
    endsAt: "2026-05-08T18:00:00+09:00",
    location: "KOBOT 팀실",
    organizer: "교육팀",
    capacityLabel: "선착순 12명",
    imageTone: "green",
    imageTones: ["green", "navy", "slate"],
    schedule: [
      { time: "10:00", title: "센서/모터 세팅" },
      { time: "13:00", title: "주행 알고리즘 실습" },
      { time: "16:00", title: "트랙 테스트" },
    ],
    features: features({
      participantSurvey: {
        enabled: true,
        title: "워크숍 준비 조사",
        description: "참가자의 ROS 경험과 개인 노트북 준비 여부를 확인합니다.",
        questions: [
          {
            id: "ros-level",
            label: "ROS 사용 경험",
            type: "single_choice",
            required: true,
            choices: ["없음", "기초", "프로젝트 경험 있음"],
          },
          {
            id: "laptop",
            label: "개인 노트북을 가져올 수 있나요?",
            type: "single_choice",
            required: true,
            choices: ["가능", "대여 필요"],
          },
        ],
      },
      attendanceCheck: {
        enabled: true,
        expectedCount: 12,
        checkedInCount: 8,
        method: "manual",
      },
    }),
  },
  {
    id: "summer-hack-2026",
    title: "여름방학 해커톤",
    description: "지정 기간 안에 독창적인 로봇 기능을 만들고 결과물을 발표합니다.",
    startsAt: "2026-06-29T09:30:00+09:00",
    endsAt: "2026-06-30T20:00:00+09:00",
    location: "국민대학교 공학관",
    organizer: "KOBOT 운영팀",
    capacityLabel: "최대 30명",
    imageTone: "amber",
    imageTones: ["amber", "red", "navy"],
    schedule: [
      { time: "09:30", title: "주제 공개" },
      { time: "13:00", title: "개발 스프린트" },
      { time: "19:00", title: "중간 점검" },
      { time: "다음날 18:00", title: "최종 발표" },
    ],
    features: features({
      externalForm: {
        enabled: true,
        provider: "google_forms",
        title: "해커톤 참가 신청",
        url: "https://forms.gle/example-kobot-hackathon",
        deadline: "2026-06-24T23:59:00+09:00",
        requiredFields: ["이름", "희망 역할", "팀 여부"],
      },
      participantSurvey: {
        enabled: true,
        title: "역할 및 장비 조사",
        description: "팀 편성을 위해 개발 가능 분야와 장비 준비 상태를 확인합니다.",
        questions: [
          {
            id: "role",
            label: "선호 역할",
            type: "multiple_choice",
            required: true,
            choices: ["기구", "회로", "임베디드", "비전", "문서/발표"],
          },
        ],
      },
      teamFormation: {
        enabled: true,
        teamSize: 4,
        description: "팀은 최대 4명까지 구성합니다.",
      },
    }),
  },
  {
    id: "ros2-seminar-2026",
    title: "ROS2 기초 세미나",
    description: "노드, 토픽, 런치 파일을 실습 중심으로 정리하는 입문 세션입니다.",
    startsAt: "2026-04-25T14:00:00+09:00",
    endsAt: "2026-04-25T17:00:00+09:00",
    location: "온라인",
    organizer: "교육팀",
    capacityLabel: "녹화 제공",
    imageTone: "slate",
    imageTones: ["slate", "navy", "green"],
    schedule: [
      { time: "14:00", title: "ROS2 개념 정리" },
      { time: "15:00", title: "토픽/서비스 실습" },
      { time: "16:20", title: "질의응답" },
    ],
    features: features(),
  },
  {
    id: "vision-night-2026",
    title: "비전 모델 실험회",
    description: "카메라 캘리브레이션과 객체 인식 결과를 비교하고 개선점을 찾습니다.",
    startsAt: "2026-05-02T19:00:00+09:00",
    endsAt: "2026-05-02T22:00:00+09:00",
    location: "공학관 세미나실",
    organizer: "비전 스터디",
    capacityLabel: "마감",
    imageTone: "red",
    imageTones: ["red", "slate", "amber"],
    schedule: [
      { time: "19:00", title: "데이터셋 공유" },
      { time: "20:00", title: "모델 결과 비교" },
      { time: "21:30", title: "개선안 정리" },
    ],
    features: features({
      attendanceCheck: {
        enabled: true,
        expectedCount: 10,
        checkedInCount: 10,
        method: "manual",
      },
    }),
  },
];

const LOCAL_EVENTS_STORAGE_KEY = "kobot:events:local-v1";

function timeOf(value: string) {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

export function getEventStatus(event: Pick<ClubEvent, "startsAt" | "endsAt">, now = new Date()) {
  const current = now.getTime();
  const startsAt = timeOf(event.startsAt);
  const endsAt = timeOf(event.endsAt);

  if (startsAt && current < startsAt) return "scheduled";
  if (endsAt && current > endsAt) return "closed";
  return "ongoing";
}

export function sortEvents(events: ClubEvent[], now = new Date()) {
  return [...events].sort((a, b) => {
    const aStatus = getEventStatus(a, now);
    const bStatus = getEventStatus(b, now);

    if (aStatus !== bStatus) {
      const rank: Record<EventStatus, number> = {
        ongoing: 0,
        scheduled: 1,
        closed: 2,
      };

      return rank[aStatus] - rank[bStatus];
    }

    if (aStatus === "closed") {
      return timeOf(b.endsAt) - timeOf(a.endsAt);
    }

    return timeOf(a.startsAt) - timeOf(b.startsAt);
  });
}

export function filterEvents(events: ClubEvent[], status: EventStatus, keyword = "", now = new Date()) {
  const normalizedKeyword = keyword.trim().toLocaleLowerCase("ko-KR");

  return sortEvents(events, now).filter((event) => {
    if (getEventStatus(event, now) !== status) return false;
    if (!normalizedKeyword) return true;

    return [event.title, event.description, event.location, event.organizer].some(
      (value) =>
        typeof value === "string" &&
        value.toLocaleLowerCase("ko-KR").includes(normalizedKeyword),
    );
  });
}

export function countEventsByStatus(events: ClubEvent[], now = new Date()) {
  return events.reduce<Record<EventStatus, number>>(
    (counts, event) => {
      counts[getEventStatus(event, now)] += 1;
      return counts;
    },
    { scheduled: 0, ongoing: 0, closed: 0 },
  );
}

export function getEventImageTones(event: Pick<ClubEvent, "imageTone" | "imageTones">) {
  const tones = [event.imageTone, ...(event.imageTones ?? [])].filter(Boolean);

  return [...new Set(tones)];
}

export function getEventDetailPath(eventId: string) {
  return `/member/events/${encodeURIComponent(eventId)}`;
}

export function getEnabledEventFeatureKeys(event: Pick<ClubEvent, "features">) {
  return EVENT_FEATURE_OPTIONS.map((option) => option.key).filter(
    (key) => event.features[key].enabled,
  );
}

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readLocalEvents() {
  if (!canUseLocalStorage()) return [];

  try {
    const raw = window.localStorage.getItem(LOCAL_EVENTS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((event): event is ClubEvent => {
      return (
        event &&
        typeof event === "object" &&
        typeof event.id === "string" &&
        typeof event.title === "string" &&
        typeof event.startsAt === "string" &&
        typeof event.endsAt === "string" &&
        typeof event.location === "string" &&
        event.features &&
        typeof event.features === "object"
      );
    });
  } catch {
    return [];
  }
}

function writeLocalEvents(events: ClubEvent[]) {
  if (!canUseLocalStorage()) return;
  window.localStorage.setItem(LOCAL_EVENTS_STORAGE_KEY, JSON.stringify(events));
}

function createEventId(title: string) {
  const normalized = title
    .trim()
    .toLocaleLowerCase("ko-KR")
    .normalize("NFKC")
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return `${normalized || "event"}-${Date.now().toString(36)}`;
}

export function listEvents() {
  return Promise.resolve(sortEvents([...EVENTS, ...readLocalEvents()]));
}

export function getEvent(eventId: string) {
  const normalizedId = decodeURIComponent(eventId);
  return Promise.resolve(
    [...EVENTS, ...readLocalEvents()].find((event) => event.id === normalizedId) ?? null,
  );
}

export function createEvent(input: CreateClubEventInput) {
  const event: ClubEvent = {
    ...input,
    id: input.id?.trim() || createEventId(input.title),
  };

  const nextEvents = [event, ...readLocalEvents().filter((item) => item.id !== event.id)];
  writeLocalEvents(nextEvents);

  return Promise.resolve(event);
}
