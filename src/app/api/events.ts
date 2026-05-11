import { getSupabaseBrowserClient } from "../auth/supabase";
import { sanitizeUserError } from "../utils/sanitize-error";

export type EventStatus = "scheduled" | "ongoing" | "closed";
export type EventStatusFilter = "all" | EventStatus;

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
  createdBy?: string | null;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  location: string;
  organizer: string;
  capacityLabel: string;
  imageUrl?: string | null;
  imageTone: EventImageTone;
  imageTones?: EventImageTone[];
  formId?: string | null;
  formTitle?: string | null;
  schedule: EventScheduleItem[];
  features: EventFeatureSettings;
};

export type CreateClubEventInput = Omit<ClubEvent, "id" | "createdBy"> & {
  id?: string;
};

export type UpdateClubEventInput = Omit<ClubEvent, "id" | "createdBy">;

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  scheduled: "예정",
  ongoing: "진행중",
  closed: "마감",
};

export const EVENT_STATUS_FILTERS = [
  { key: "all", label: "전체" },
  { key: "scheduled", label: EVENT_STATUS_LABELS.scheduled },
  { key: "ongoing", label: EVENT_STATUS_LABELS.ongoing },
  { key: "closed", label: EVENT_STATUS_LABELS.closed },
] satisfies { key: EventStatusFilter; label: string }[];

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
  const externalForm = overrides.externalForm ?? disabledExternalForm();
  const participantSurvey = overrides.participantSurvey ?? disabledSurvey();
  const attendanceCheck = overrides.attendanceCheck ?? disabledAttendance();
  const teamFormation = overrides.teamFormation ?? disabledTeamFormation();

  return {
    externalForm: {
      ...externalForm,
      requiredFields: uniqueStrings(externalForm.requiredFields),
    },
    participantSurvey,
    attendanceCheck,
    teamFormation,
  };
}

function uniqueStrings(values: string[] | null | undefined) {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const value of values ?? []) {
    const label = value.trim();
    if (!label || seen.has(label)) continue;
    seen.add(label);
    normalized.push(label);
  }

  return normalized;
}

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

export function filterEvents(events: ClubEvent[], status: EventStatusFilter, keyword = "", now = new Date()) {
  const normalizedKeyword = keyword.trim().toLocaleLowerCase("ko-KR");

  return sortEvents(events, now).filter((event) => {
    if (status !== "all" && getEventStatus(event, now) !== status) return false;
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

export function getEventEditPath(eventId: string) {
  return `/member/events/${encodeURIComponent(eventId)}/edit`;
}

export function getEventFormPath(formId: string) {
  return `/member/forms/${encodeURIComponent(formId)}`;
}

export function getEventParticipation(event: Pick<ClubEvent, "features" | "formId" | "formTitle">) {
  if (event.formId?.trim()) {
    return {
      external: false,
      href: getEventFormPath(event.formId),
      title: event.formTitle?.trim() || "참여 폼",
    };
  }

  const formFeature = event.features.externalForm;
  const href = formFeature.url?.trim();
  if (!formFeature.enabled || !href) return null;

  return {
    external: !href.startsWith("/"),
    href,
    title: formFeature.title.trim() || "참여 폼",
  };
}

export function getEnabledEventFeatureKeys(event: Pick<ClubEvent, "features">) {
  return EVENT_FEATURE_OPTIONS.map((option) => option.key).filter(
    (key) => event.features[key].enabled,
  );
}

const EVENT_SELECT_FIELDS =
  "id, created_by, title, description, starts_at, ends_at, location, organizer, capacity_label, image_url, image_tone, image_tones, form_id, form_title, schedule, features";

type EventRow = {
  id: string;
  created_by: string | null;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  location: string | null;
  organizer: string | null;
  capacity_label: string | null;
  image_url: string | null;
  image_tone: string | null;
  image_tones: string[] | null;
  form_id: string | null;
  form_title: string | null;
  schedule: EventScheduleItem[] | null;
  features: Partial<EventFeatureSettings> | null;
};

function isEventImageTone(value: string | null | undefined): value is EventImageTone {
  return value === "navy" || value === "amber" || value === "green" || value === "slate" || value === "red";
}

function normalizeEventImageTone(value: string | null | undefined): EventImageTone {
  return isEventImageTone(value) ? value : "navy";
}

function normalizeEventImageTones(values: string[] | null | undefined, fallback: EventImageTone) {
  const tones = (values ?? []).filter(isEventImageTone);
  return tones.length > 0 ? [...new Set(tones)] : [fallback];
}

function mapEventRow(row: EventRow): ClubEvent {
  const imageTone = normalizeEventImageTone(row.image_tone);

  return {
    id: row.id,
    createdBy: row.created_by ?? null,
    title: row.title,
    description: row.description ?? "",
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    location: row.location ?? "",
    organizer: row.organizer ?? "",
    capacityLabel: row.capacity_label ?? "",
    imageUrl: row.image_url?.trim() || null,
    imageTone,
    imageTones: normalizeEventImageTones(row.image_tones, imageTone),
    formId: row.form_id?.trim() || null,
    formTitle: row.form_title?.trim() || null,
    schedule: Array.isArray(row.schedule) ? row.schedule : [],
    features: features(row.features ?? {}),
  };
}

export async function listEvents() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_SELECT_FIELDS)
    .order("starts_at", { ascending: true });

  if (error) {
    throw new Error(sanitizeUserError(error, "행사 목록을 불러오지 못했습니다."));
  }

  return sortEvents(((data ?? []) as EventRow[]).map(mapEventRow));
}

export async function getEvent(eventId: string) {
  const normalizedId = decodeURIComponent(eventId);
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("events")
    .select(EVENT_SELECT_FIELDS)
    .eq("id", normalizedId)
    .maybeSingle();

  if (error) {
    throw new Error(sanitizeUserError(error, "행사 정보를 불러오지 못했습니다."));
  }

  return data ? mapEventRow(data as EventRow) : null;
}

export async function createEvent(input: CreateClubEventInput) {
  const supabase = getSupabaseBrowserClient();
  const imageTone = normalizeEventImageTone(input.imageTone);
  const imageTones = normalizeEventImageTones(input.imageTones, imageTone);
  const normalizedFeatures = features(input.features);
  const { data, error } = await supabase
    .from("events")
    .insert({
      title: input.title,
      description: input.description,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      location: input.location,
      organizer: input.organizer,
      capacity_label: input.capacityLabel,
      image_url: input.imageUrl?.trim() || null,
      image_tone: imageTone,
      image_tones: imageTones,
      form_id: input.formId?.trim() || null,
      form_title: input.formTitle?.trim() || null,
      schedule: input.schedule,
      features: normalizedFeatures,
    })
    .select(EVENT_SELECT_FIELDS)
    .single();

  if (error) {
    throw new Error(sanitizeUserError(error, "행사를 저장하지 못했습니다."));
  }

  return mapEventRow(data as EventRow);
}

export async function updateEvent(eventId: string, input: UpdateClubEventInput) {
  const normalizedId = decodeURIComponent(eventId);
  const supabase = getSupabaseBrowserClient();
  const imageTone = normalizeEventImageTone(input.imageTone);
  const imageTones = normalizeEventImageTones(input.imageTones, imageTone);
  const normalizedFeatures = features(input.features);
  const { data, error } = await supabase
    .from("events")
    .update({
      title: input.title,
      description: input.description,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      location: input.location,
      organizer: input.organizer,
      capacity_label: input.capacityLabel,
      image_url: input.imageUrl?.trim() || null,
      image_tone: imageTone,
      image_tones: imageTones,
      form_id: input.formId?.trim() || null,
      form_title: input.formTitle?.trim() || null,
      schedule: input.schedule,
      features: normalizedFeatures,
    })
    .eq("id", normalizedId)
    .select(EVENT_SELECT_FIELDS)
    .single();

  if (error) {
    throw new Error(sanitizeUserError(error, "행사를 수정하지 못했습니다."));
  }

  return mapEventRow(data as EventRow);
}
