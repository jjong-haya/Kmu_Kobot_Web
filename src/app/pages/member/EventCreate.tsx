import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ChangeEvent, DragEvent, FormEvent, ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { z } from "zod";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ClipboardList,
  Link2,
  MapPin,
  RefreshCw,
  Search,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import {
  createEvent,
  getEvent,
  getEventDetailPath,
  updateEvent,
  type ClubEvent,
  type EventFeatureSettings,
} from "../../api/events";
import {
  FORM_CATEGORY_LABELS,
  FORM_PERSONAL_INFO_FIELDS,
  FORM_STATUS_LABELS,
  getFormDetailPath,
  listForms,
  type ClubForm,
} from "../../api/forms";
import { sanitizeUserError } from "../../utils/sanitize-error";
import mainLogo from "../../../assets/mainLogo.png";

const PAGE_STYLE: CSSProperties = {
  minHeight: "calc(100vh - 4rem)",
  margin: -32,
  padding: 32,
  background: "var(--kb-surface-page)",
};

const FIELD_BASE =
  "h-11 w-full border-0 border-b border-[#d9deea] bg-transparent px-0 text-[15px] font-semibold text-[#0a0a0a] outline-none transition-colors placeholder:text-[#9aa3b5] focus:border-[#103078]";
const TEXTAREA_BASE =
  "w-full resize-y border-0 border-b border-[#d9deea] bg-transparent px-0 py-2 text-[15px] font-semibold leading-7 text-[#0a0a0a] outline-none transition-colors placeholder:text-[#9aa3b5] focus:border-[#103078]";
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

const eventCreateSchema = z
  .object({
    title: z.string().trim().min(1, "행사 제목을 입력해 주세요."),
    description: z.string().trim().min(1, "행사 설명을 입력해 주세요."),
    startsAt: z.string().min(1, "행사 시작 시간을 입력해 주세요."),
    endsAt: z.string().min(1, "행사 종료 시간을 입력해 주세요."),
    location: z.string().trim().min(1, "행사 장소를 입력해 주세요."),
    organizer: z.string().trim().optional(),
    capacityLabel: z.string().trim().optional(),
  })
  .refine((value) => new Date(value.startsAt).getTime() < new Date(value.endsAt).getTime(), {
    message: "종료 시간은 시작 시간 이후여야 합니다.",
    path: ["endsAt"],
  });

type EventCreateFormValues = z.infer<typeof eventCreateSchema>;

function localDateTimeValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function toIsoFromLocal(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function toLocalDateTimeFromIso(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : localDateTimeValue(date);
}

function splitLines(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function scheduleTextFromEvent(event: ClubEvent) {
  return event.schedule.map((item) => `${item.time} ${item.title}`.trim()).join("\n");
}

function formatPreviewDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "일시 미정";

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

function formatFormWindow(form: ClubForm) {
  const { startsAt, endsAt } = form.responseWindow;
  if (startsAt && endsAt) return `${formatPreviewDate(startsAt)} - ${formatPreviewDate(endsAt)}`;
  if (endsAt) return `${formatPreviewDate(endsAt)} 마감`;
  if (startsAt) return `${formatPreviewDate(startsAt)}부터`;
  return "응답 기간 제한 없음";
}

function disabledFeatures(): EventFeatureSettings {
  return {
    externalForm: {
      enabled: false,
      provider: "internal",
      title: "",
      requiredFields: [],
    },
    participantSurvey: {
      enabled: false,
      title: "",
      description: "",
      questions: [],
    },
    attendanceCheck: {
      enabled: false,
      expectedCount: 0,
      checkedInCount: 0,
      method: "manual",
    },
    teamFormation: {
      enabled: false,
      teamSize: 1,
      description: "",
    },
  };
}

function buildFeaturesFromForm(form: ClubForm | null): EventFeatureSettings {
  const features = disabledFeatures();
  if (!form) return features;
  const requiredFields = [
    ...FORM_PERSONAL_INFO_FIELDS.map((field) => field.label),
    ...form.questions.filter((question) => question.required).map((question) => question.title),
  ]
    .map((field) => field.trim())
    .filter(Boolean);

  return {
    ...features,
    externalForm: {
      enabled: true,
      provider: "internal",
      title: form.title,
      url: getFormDetailPath(form.id),
      deadline: form.responseWindow.endsAt,
      requiredFields: Array.from(new Set(requiredFields)),
    },
  };
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("image_read_failed"));
    reader.readAsDataURL(file);
  });
}

function Field({
  children,
  label,
  span = false,
}: {
  children: ReactNode;
  label: string;
  span?: boolean;
}) {
  return (
    <label className={`grid min-w-0 gap-2 ${span ? "md:col-span-2" : ""}`}>
      <span className="text-[12px] font-black text-[#667085]">{label}</span>
      {children}
    </label>
  );
}

function StatusPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-7 items-center rounded-full border border-[#d9deea] bg-[#f8fafc] px-2.5 text-[12px] font-bold text-[#475467]">
      {children}
    </span>
  );
}

export default function EventCreate() {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const decodedEventId = eventId ? decodeURIComponent(eventId) : null;
  const isEditing = Boolean(decodedEventId);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const defaultStart = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    date.setHours(14, 0, 0, 0);
    return localDateTimeValue(date);
  }, []);
  const defaultEnd = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    date.setHours(17, 0, 0, 0);
    return localDateTimeValue(date);
  }, []);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState(defaultStart);
  const [endsAt, setEndsAt] = useState(defaultEnd);
  const [location, setLocation] = useState("");
  const [organizer, setOrganizer] = useState("KOBOT 운영팀");
  const [capacityLabel, setCapacityLabel] = useState("자유 참여");
  const [scheduleText, setScheduleText] = useState("14:00 오리엔테이션\n15:00 본 행사\n16:30 정리");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState("");
  const [imageDragging, setImageDragging] = useState(false);
  const [forms, setForms] = useState<ClubForm[]>([]);
  const [formsLoading, setFormsLoading] = useState(true);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [formQuery, setFormQuery] = useState("");
  const [selectedForm, setSelectedForm] = useState<ClubForm | null>(null);
  const [linkedFormFallback, setLinkedFormFallback] = useState<{ id: string; title: string } | null>(null);
  const [formConnectionCleared, setFormConnectionCleared] = useState(false);
  const [initialEvent, setInitialEvent] = useState<ClubEvent | null>(null);
  const [initializing, setInitializing] = useState(Boolean(decodedEventId));
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setFormsLoading(true);

    listForms()
      .then((loadedForms) => {
        if (!cancelled) setForms(loadedForms);
      })
      .catch(() => {
        if (!cancelled) setForms([]);
      })
      .finally(() => {
        if (!cancelled) setFormsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!decodedEventId) {
      setInitializing(false);
      setNotFound(false);
      setInitialEvent(null);
      return;
    }

    let cancelled = false;
    setInitializing(true);
    setNotFound(false);
    setError(null);

    getEvent(decodedEventId)
      .then((loadedEvent) => {
        if (cancelled) return;

        if (!loadedEvent) {
          setNotFound(true);
          return;
        }

        setInitialEvent(loadedEvent);
        setTitle(loadedEvent.title);
        setDescription(loadedEvent.description);
        setStartsAt(toLocalDateTimeFromIso(loadedEvent.startsAt));
        setEndsAt(toLocalDateTimeFromIso(loadedEvent.endsAt));
        setLocation(loadedEvent.location);
        setOrganizer(loadedEvent.organizer || "KOBOT 운영팀");
        setCapacityLabel(loadedEvent.capacityLabel || "자유 참여");
        setScheduleText(scheduleTextFromEvent(loadedEvent));
        setImageUrl(loadedEvent.imageUrl ?? null);
        setImageFileName(loadedEvent.imageUrl ? "저장된 대표 이미지" : "");
        setSelectedForm(null);
        setLinkedFormFallback(
          loadedEvent.formId
            ? { id: loadedEvent.formId, title: loadedEvent.formTitle?.trim() || "참여 폼" }
            : null,
        );
        setFormConnectionCleared(false);
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(sanitizeUserError(requestError, "행사 정보를 불러오지 못했습니다."));
        }
      })
      .finally(() => {
        if (!cancelled) setInitializing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [decodedEventId]);

  useEffect(() => {
    if (!linkedFormFallback || selectedForm) return;

    const matchedForm = forms.find((form) => form.id === linkedFormFallback.id);
    if (!matchedForm) return;

    setSelectedForm(matchedForm);
    setLinkedFormFallback(null);
  }, [forms, linkedFormFallback, selectedForm]);

  const linkedFormId = selectedForm?.id ?? (formConnectionCleared ? null : linkedFormFallback?.id ?? null);
  const linkedFormTitle =
    selectedForm?.title ?? (formConnectionCleared ? null : linkedFormFallback?.title ?? null);
  const features = useMemo(() => {
    if (selectedForm) return buildFeaturesFromForm(selectedForm);
    if (formConnectionCleared) return disabledFeatures();
    return initialEvent?.features ?? disabledFeatures();
  }, [formConnectionCleared, initialEvent, selectedForm]);
  const previewEvent: ClubEvent = {
    id: "preview",
    title: title.trim() || "새 행사",
    description: description.trim() || "행사 설명이 여기에 표시됩니다.",
    startsAt: toIsoFromLocal(startsAt) || new Date().toISOString(),
    endsAt: toIsoFromLocal(endsAt) || new Date().toISOString(),
    location: location.trim() || "장소 미정",
    organizer: organizer.trim() || "KOBOT 운영팀",
    capacityLabel: capacityLabel.trim() || "자유 참여",
    imageUrl,
    imageTone: "navy",
    imageTones: ["navy"],
    formId: linkedFormId,
    formTitle: linkedFormTitle,
    schedule: splitLines(scheduleText).map((line) => {
      const [time, ...rest] = line.split(" ");
      return {
        time: time || "시간 미정",
        title: rest.join(" ").trim() || line,
      };
    }),
    features,
  };
  const filteredForms = useMemo(() => {
    const keyword = formQuery.trim().toLocaleLowerCase("ko-KR");
    if (!keyword) return forms;

    return forms.filter((form) =>
      [form.title, form.description, FORM_CATEGORY_LABELS[form.category]]
        .filter(Boolean)
        .some((value) => value.toLocaleLowerCase("ko-KR").includes(keyword)),
    );
  }, [formQuery, forms]);

  async function applyImageFile(file: File) {
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("대표 이미지는 이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("대표 이미지는 4MB 이하 파일만 업로드해 주세요.");
      return;
    }

    try {
      setImageUrl(await readFileAsDataUrl(file));
      setImageFileName(file.name);
    } catch {
      setError("대표 이미지를 읽지 못했습니다. 다른 파일로 다시 시도해 주세요.");
    }
  }

  function handleImageInput(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (file) void applyImageFile(file);
    event.currentTarget.value = "";
  }

  function handleImageDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setImageDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void applyImageFile(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const values: EventCreateFormValues = {
      title,
      description,
      startsAt,
      endsAt,
      location,
      organizer,
      capacityLabel,
    };
    const parsed = eventCreateSchema.safeParse(values);

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요.");
      return;
    }

    setSubmitting(true);

    try {
      const payload: Parameters<typeof createEvent>[0] = {
        title: parsed.data.title.trim(),
        description: parsed.data.description.trim(),
        startsAt: toIsoFromLocal(parsed.data.startsAt),
        endsAt: toIsoFromLocal(parsed.data.endsAt),
        location: parsed.data.location.trim(),
        organizer: parsed.data.organizer?.trim() || "KOBOT 운영팀",
        capacityLabel: parsed.data.capacityLabel?.trim() || "자유 참여",
        imageUrl,
        imageTone: "navy",
        imageTones: ["navy"],
        formId: linkedFormId,
        formTitle: linkedFormTitle,
        schedule: previewEvent.schedule,
        features,
      };
      const saved =
        isEditing && decodedEventId
          ? await updateEvent(decodedEventId, payload)
          : await createEvent(payload);

      navigate(getEventDetailPath(saved.id));
    } catch (requestError) {
      setError(sanitizeUserError(requestError, isEditing ? "행사를 수정하지 못했습니다." : "행사를 저장하지 못했습니다."));
    } finally {
      setSubmitting(false);
    }
  }

  if (initializing) {
    return (
      <div className="kb-root event-create-page" style={PAGE_STYLE}>
        <div className="flex min-h-[420px] items-center justify-center gap-2 text-[15px] font-semibold text-[#667085]">
          <RefreshCw className="h-4 w-4 animate-spin" />
          행사 정보를 불러오는 중입니다.
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="kb-root event-create-page" style={PAGE_STYLE}>
        <div className="mx-auto flex min-h-[420px] max-w-[720px] flex-col items-center justify-center text-center">
          <h1 className="m-0 text-[28px] font-black tracking-normal text-[#111827]">
            수정할 행사를 찾을 수 없습니다.
          </h1>
          <p className="mt-3 text-[15px] font-semibold text-[#667085]">
            삭제되었거나 잘못된 주소로 접근했습니다.
          </p>
          <Link
            to="/member/events"
            className="mt-6 inline-flex h-10 items-center gap-2 rounded-[8px] border border-[#d9deea] bg-white px-4 text-[14px] font-bold text-[#1f2937] no-underline transition-colors hover:border-[#103078]"
          >
            <ArrowLeft className="h-4 w-4" />
            행사 목록
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="kb-root event-create-page" style={PAGE_STYLE}>
      <form onSubmit={handleSubmit} className="event-create-studio mx-auto grid max-w-[1280px] gap-6">
        <header className="sticky top-0 z-20 border-b border-[#e6eaf2] bg-white/95 pb-5 pt-1 backdrop-blur">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <nav aria-label={isEditing ? "행사 수정 위치" : "행사 생성 위치"} className="mb-2 flex items-center gap-2 text-[13px] font-bold">
                <Link
                  to="/member/events"
                  className="inline-flex items-center gap-1.5 text-[#667085] no-underline transition-colors hover:text-[#103078]"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  행사
                </Link>
                <span className="text-[#c5ccd8]">/</span>
                <span className="text-[#667085]">{isEditing ? "행사 수정" : "새 행사"}</span>
              </nav>
              <h1 className="kb-display m-0 text-[32px] font-black tracking-normal text-[#0a0a0a]">
                {isEditing ? "행사 수정" : "행사 만들기"}
              </h1>
            </div>
          </div>
        </header>

        {error ? (
          <div className="border-l-4 border-red-600 bg-red-50 px-4 py-3 text-[14px] font-bold text-red-700">
            {error}
          </div>
        ) : null}

        <main className="event-create-workbench grid gap-7 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start">
          <aside className="lg:sticky lg:top-24">
            <div
              onDragEnter={(event) => {
                event.preventDefault();
                setImageDragging(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={() => setImageDragging(false)}
              onDrop={handleImageDrop}
              className="overflow-hidden border bg-[#f5f7fb] transition-colors"
              style={{
                borderColor: imageDragging ? "#103078" : "#d9deea",
              }}
            >
              <div className="relative aspect-video w-full">
                <img
                  src={imageUrl ?? mainLogo}
                  alt="행사 대표 이미지 미리보기"
                  className={`h-full w-full ${imageUrl ? "object-cover" : "object-contain p-12"}`}
                  draggable={false}
                />
                <div className="absolute left-3 top-3 rounded-[6px] border border-white/80 bg-white/90 px-2.5 py-1 text-[12px] font-black text-[#475467]">
                  16:9 대표 이미지
                </div>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageInput}
            />

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-[#d9deea] bg-white px-3 text-[13px] font-black text-[#1f2937] transition-colors hover:border-[#103078]"
              >
                <UploadCloud className="h-4 w-4" />
                {imageUrl ? "이미지 교체" : "이미지 선택"}
              </button>
              {imageUrl ? (
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl(null);
                    setImageFileName("");
                  }}
                  className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-[#f3c7c7] bg-white px-3 text-[13px] font-black text-[#b42318] transition-colors hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  삭제
                </button>
              ) : null}
            </div>
            <p className="mt-2 text-[12px] font-semibold leading-5 text-[#667085]">
              {imageUrl ? imageFileName : "이미지가 없으면 KOBOT 기본 로고가 표시됩니다."}
            </p>

            <dl className="mt-5 grid gap-3 border-t border-[#e6eaf2] pt-5 text-[13px]">
              <div className="grid grid-cols-[88px_1fr] gap-3">
                <dt className="font-black text-[#667085]">일시</dt>
                <dd className="m-0 font-semibold text-[#111827]">
                  {formatPreviewDate(previewEvent.startsAt)}
                </dd>
              </div>
              <div className="grid grid-cols-[88px_1fr] gap-3">
                <dt className="font-black text-[#667085]">장소</dt>
                <dd className="m-0 font-semibold text-[#111827]">{previewEvent.location}</dd>
              </div>
              <div className="grid grid-cols-[88px_1fr] gap-3">
                <dt className="font-black text-[#667085]">참여</dt>
                <dd className="m-0 font-semibold text-[#111827]">
                  {linkedFormTitle ?? "참여 폼 없음"}
                </dd>
              </div>
            </dl>
          </aside>

          <section className="min-w-0 border border-[#d9deea] bg-white">
            <div className="grid gap-5 border-b border-[#e6eaf2] px-5 py-5">
              <div className="flex items-center gap-2 text-[13px] font-black text-[#103078]">
                <CalendarDays className="h-4 w-4" />
                기본 정보
              </div>
              <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
                <Field label="제목" span>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className={FIELD_BASE}
                    placeholder="예: KOBOT 게임 로봇 대회"
                  />
                </Field>
                <Field label="설명" span>
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    className={`${TEXTAREA_BASE} min-h-[120px]`}
                    placeholder="행사 상세 페이지에 표시될 설명"
                  />
                </Field>
                <Field label="시작">
                  <input
                    type="datetime-local"
                    value={startsAt}
                    onChange={(event) => setStartsAt(event.target.value)}
                    className={FIELD_BASE}
                  />
                </Field>
                <Field label="종료">
                  <input
                    type="datetime-local"
                    value={endsAt}
                    onChange={(event) => setEndsAt(event.target.value)}
                    className={FIELD_BASE}
                  />
                </Field>
                <Field label="장소">
                  <input
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    className={FIELD_BASE}
                    placeholder="공학관 로봇실"
                  />
                </Field>
                <Field label="주관">
                  <input
                    value={organizer}
                    onChange={(event) => setOrganizer(event.target.value)}
                    className={FIELD_BASE}
                  />
                </Field>
                <Field label="참여 규모">
                  <input
                    value={capacityLabel}
                    onChange={(event) => setCapacityLabel(event.target.value)}
                    className={FIELD_BASE}
                    placeholder="최대 24명"
                  />
                </Field>
              </div>
            </div>

            <div className="grid gap-5 border-b border-[#e6eaf2] px-5 py-5">
              <div className="flex items-center gap-2 text-[13px] font-black text-[#103078]">
                <MapPin className="h-4 w-4" />
                진행 일정
              </div>
              <textarea
                value={scheduleText}
                onChange={(event) => setScheduleText(event.target.value)}
                className={`${TEXTAREA_BASE} min-h-[120px]`}
                placeholder="14:00 오리엔테이션"
              />
            </div>

            <div className="grid gap-4 px-5 py-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-[13px] font-black text-[#103078]">
                    <ClipboardList className="h-4 w-4" />
                    참여 폼
                  </div>
                  <p className="mb-0 mt-1 text-[12px] font-semibold text-[#667085]">
                    행사 카드와 상세 화면의 참여하기 버튼에 연결됩니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormDialogOpen(true)}
                  className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-[#d9deea] bg-white px-3.5 text-[13px] font-black text-[#1f2937] transition-colors hover:border-[#103078]"
                >
                  <Search className="h-4 w-4" />
                  폼 선택
                </button>
              </div>

              <div className="border-t border-[#e6eaf2] pt-4">
                {selectedForm ? (
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="truncate text-[15px] text-[#111827]">
                          {selectedForm.title}
                        </strong>
                        <StatusPill>{FORM_STATUS_LABELS[selectedForm.status]}</StatusPill>
                        <StatusPill>{FORM_CATEGORY_LABELS[selectedForm.category]}</StatusPill>
                      </div>
                      <p className="mb-0 mt-2 line-clamp-2 text-[13px] font-semibold leading-6 text-[#667085]">
                        {selectedForm.description || formatFormWindow(selectedForm)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedForm(null);
                        setLinkedFormFallback(null);
                        setFormConnectionCleared(true);
                      }}
                      className="inline-flex h-9 items-center gap-2 rounded-[8px] border border-[#f3c7c7] bg-white px-3 text-[12px] font-black text-[#b42318] transition-colors hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                      연결 해제
                    </button>
                  </div>
                ) : linkedFormTitle && !formConnectionCleared ? (
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="truncate text-[15px] text-[#111827]">
                          {linkedFormTitle}
                        </strong>
                        <StatusPill>기존 연결</StatusPill>
                      </div>
                      <p className="mb-0 mt-2 line-clamp-2 text-[13px] font-semibold leading-6 text-[#667085]">
                        폼 목록에서 다시 찾지 못했지만 저장된 연결은 유지합니다.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setLinkedFormFallback(null);
                        setFormConnectionCleared(true);
                      }}
                      className="inline-flex h-9 items-center gap-2 rounded-[8px] border border-[#f3c7c7] bg-white px-3 text-[12px] font-black text-[#b42318] transition-colors hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                      연결 해제
                    </button>
                  </div>
                ) : (
                  <div className="flex min-h-14 items-center gap-2 text-[13px] font-semibold text-[#667085]">
                    <Link2 className="h-4 w-4 text-[#98a2b3]" />
                    연결된 참여 폼이 없습니다.
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>

        <footer className="sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-3 border-t border-[#e6eaf2] bg-white/95 py-3 backdrop-blur">
          <div className="text-[12px] font-bold text-[#667085]">
            대표 이미지 {imageUrl ? "업로드됨" : "기본 로고"} · 참여 폼 {linkedFormId ? "연결됨" : "미연결"}
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-11 items-center gap-2 rounded-[8px] bg-[#0a0a0a] px-5 text-[14px] font-black text-white transition-colors hover:bg-[#222222] disabled:cursor-not-allowed disabled:opacity-55"
          >
            {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {submitting ? "저장 중" : isEditing ? "변경사항 저장" : "행사 만들기"}
          </button>
        </footer>
      </form>

      {formDialogOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-form-picker-title"
        >
          <div className="grid max-h-[82vh] w-full max-w-[760px] grid-rows-[auto_auto_minmax(0,1fr)] border border-[#d9deea] bg-white shadow-[0_22px_70px_rgba(15,23,42,0.24)]">
            <div className="flex items-start justify-between gap-4 border-b border-[#e6eaf2] px-5 py-4">
              <div>
                <h2 id="event-form-picker-title" className="m-0 text-[20px] font-black text-[#111827]">
                  참여 폼 선택
                </h2>
                <p className="mb-0 mt-1 text-[13px] font-semibold text-[#667085]">
                  행사 참여 버튼에 연결할 폼을 고릅니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormDialogOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-[#d9deea] bg-white text-[#475467] transition-colors hover:border-[#103078]"
                aria-label="폼 선택 닫기"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="relative border-b border-[#e6eaf2] px-5 py-4">
              <Search className="pointer-events-none absolute left-8 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98a2b3]" />
              <input
                value={formQuery}
                onChange={(event) => setFormQuery(event.target.value)}
                className="h-10 w-full border border-[#d9deea] bg-white pl-9 pr-3 text-[14px] font-semibold text-[#111827] outline-none focus:border-[#103078]"
                placeholder="폼 제목, 설명, 분류로 검색"
                autoFocus
              />
            </label>

            <div className="overflow-y-auto px-3 py-3">
              {formsLoading ? (
                <div className="flex min-h-44 items-center justify-center gap-2 text-[14px] font-semibold text-[#667085]">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  폼 목록을 불러오는 중입니다.
                </div>
              ) : filteredForms.length === 0 ? (
                <div className="flex min-h-44 items-center justify-center text-[14px] font-semibold text-[#667085]">
                  선택할 수 있는 폼이 없습니다.
                </div>
              ) : (
                <div className="grid gap-1">
                  {filteredForms.map((form) => {
                    const active = selectedForm?.id === form.id;

                    return (
                      <button
                        key={form.id}
                        type="button"
                        onClick={() => {
                          setSelectedForm(form);
                          setLinkedFormFallback(null);
                          setFormConnectionCleared(false);
                          setFormDialogOpen(false);
                        }}
                        className="grid gap-2 px-3 py-3 text-left transition-colors hover:bg-[#f8fafc]"
                        style={{
                          background: active ? "#eef5ff" : "transparent",
                        }}
                      >
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-black text-[#111827]">{form.title}</span>
                          <StatusPill>{FORM_STATUS_LABELS[form.status]}</StatusPill>
                          <StatusPill>{FORM_CATEGORY_LABELS[form.category]}</StatusPill>
                        </span>
                        <span className="line-clamp-2 text-[13px] font-semibold leading-6 text-[#667085]">
                          {form.description || formatFormWindow(form)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
