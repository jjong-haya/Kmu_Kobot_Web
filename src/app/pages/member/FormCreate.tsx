import { useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import {
  ArrowLeft,
  Check,
  Copy,
  GripVertical,
  ListPlus,
  Plus,
  Save,
  Trash2,
  Trophy,
} from "lucide-react";
import {
  FORM_CATEGORY_LABELS,
  FORM_QUESTION_TYPE_OPTIONS,
  FORM_STATUS_LABELS,
  createBlankQuestion,
  createGameTournamentTemplate,
  getFormDetailPath,
  questionTypeNeedsOptions,
  saveForm,
  type ClubForm,
  type ClubFormStatus,
  type CreateClubFormInput,
  type FormQuestion,
  type FormQuestionType,
  type TournamentSettings,
} from "../../api/forms";
import { sanitizeUserError } from "../../utils/sanitize-error";

const PAGE_STYLE: CSSProperties = {
  minHeight: "calc(100vh - 4rem)",
  margin: -32,
  padding: 32,
  background: "#ffffff",
};

function emptyTournament(): TournamentSettings {
  return {
    enabled: false,
    title: "",
    maxTeamSize: 3,
    leagueType: "round_robin",
    teams: [],
    matches: [],
  };
}

function createInitialDraft(): CreateClubFormInput {
  return {
    title: "",
    description: "",
    category: "participant_survey",
    status: "active",
    acceptsResponses: true,
    requiresLogin: true,
    commentsEnabled: true,
    questions: [
      {
        ...createBlankQuestion("short_text"),
        title: "이름",
        required: true,
      },
      {
        ...createBlankQuestion("single_choice"),
        title: "참여 여부",
        required: true,
        options: [
          { id: "yes", label: "참여" },
          { id: "no", label: "불참" },
          { id: "maybe", label: "미정" },
        ],
      },
    ],
    tournament: emptyTournament(),
  };
}

function moveItem<T>(items: T[], from: number, to: number) {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function cloneQuestion(question: FormQuestion): FormQuestion {
  const id = `question-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  return {
    ...question,
    id,
    title: `${question.title || "질문"} 복사본`,
    options: question.options?.map((option, index) => ({
      ...option,
      id: `${id}-option-${index + 1}`,
    })),
  };
}

function FieldLabel({ children }: { children: string }) {
  return <span className="text-[13px] font-bold text-[#6f6a62]">{children}</span>;
}

function QuestionCard({
  index,
  question,
  onChange,
  onDuplicate,
  onMoveDown,
  onMoveUp,
  onRemove,
}: {
  index: number;
  question: FormQuestion;
  onChange: (question: FormQuestion) => void;
  onDuplicate: () => void;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onRemove: () => void;
}) {
  function changeType(type: FormQuestionType) {
    onChange({
      ...question,
      type,
      options: questionTypeNeedsOptions(type)
        ? question.options && question.options.length > 0
          ? question.options
          : [
              { id: `${question.id}-option-1`, label: "옵션 1" },
              { id: `${question.id}-option-2`, label: "옵션 2" },
            ]
        : undefined,
      scaleMin: type === "linear_scale" ? question.scaleMin ?? 1 : undefined,
      scaleMax: type === "linear_scale" ? question.scaleMax ?? 5 : undefined,
      scaleMinLabel: type === "linear_scale" ? question.scaleMinLabel ?? "낮음" : undefined,
      scaleMaxLabel: type === "linear_scale" ? question.scaleMaxLabel ?? "높음" : undefined,
    });
  }

  function updateOption(optionIndex: number, label: string) {
    const options = [...(question.options ?? [])];
    options[optionIndex] = { ...options[optionIndex], label };
    onChange({ ...question, options });
  }

  function addOption() {
    const nextIndex = (question.options?.length ?? 0) + 1;
    onChange({
      ...question,
      options: [
        ...(question.options ?? []),
        { id: `${question.id}-option-${nextIndex}`, label: `옵션 ${nextIndex}` },
      ],
    });
  }

  function removeOption(optionIndex: number) {
    onChange({
      ...question,
      options: (question.options ?? []).filter((_, currentIndex) => currentIndex !== optionIndex),
    });
  }

  return (
    <section className="rounded-[10px] border border-[#e8e6df] bg-white p-4 shadow-[0_1px_4px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#f6f3ed] text-[13px] font-black text-[#6f6a62]">
          {index + 1}
        </div>
        <GripVertical className="h-4 w-4 text-[#aaa49a]" />
        <select
          value={question.type}
          onChange={(event) => changeType(event.target.value as FormQuestionType)}
          className="ml-auto h-10 rounded-[8px] border border-[#e8e6df] bg-white px-3 text-[13px] font-bold outline-none focus:border-[#103078]"
        >
          {FORM_QUESTION_TYPE_OPTIONS.map((type) => (
            <option key={type.key} value={type.key}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 grid gap-3">
        <input
          value={question.title}
          onChange={(event) => onChange({ ...question, title: event.target.value })}
          className="h-12 rounded-[8px] border border-[#e8e6df] px-3 text-[18px] font-black outline-none focus:border-[#103078]"
          placeholder="질문"
        />
        <input
          value={question.description ?? ""}
          onChange={(event) => onChange({ ...question, description: event.target.value })}
          className="h-10 rounded-[8px] border border-[#eeeae2] px-3 text-[14px] font-medium outline-none focus:border-[#103078]"
          placeholder="설명"
        />
      </div>

      {questionTypeNeedsOptions(question.type) ? (
        <div className="mt-4 grid gap-2">
          {(question.options ?? []).map((option, optionIndex) => (
            <div key={option.id} className="grid grid-cols-[1fr_auto] gap-2">
              <input
                value={option.label}
                onChange={(event) => updateOption(optionIndex, event.target.value)}
                className="h-10 rounded-[8px] border border-[#e8e6df] px-3 text-[14px] font-semibold outline-none focus:border-[#103078]"
                placeholder={`옵션 ${optionIndex + 1}`}
              />
              <button
                type="button"
                onClick={() => removeOption(optionIndex)}
                className="h-10 w-10 rounded-[8px] border border-[#e8e6df] bg-white text-[#8d877e] transition-colors hover:border-red-200 hover:text-red-600"
                aria-label="옵션 삭제"
              >
                <Trash2 className="mx-auto h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addOption}
            className="inline-flex h-10 w-fit items-center gap-2 rounded-[8px] border border-[#e8e6df] bg-white px-3 text-[13px] font-bold text-[#312f2c] transition-colors hover:border-[#cfcac0]"
          >
            <Plus className="h-4 w-4" />
            옵션 추가
          </button>
        </div>
      ) : null}

      {question.type === "linear_scale" ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="grid gap-2">
            <FieldLabel>최소값</FieldLabel>
            <input
              type="number"
              min={0}
              value={question.scaleMin ?? 1}
              onChange={(event) =>
                onChange({ ...question, scaleMin: Number.parseInt(event.target.value, 10) || 1 })
              }
              className="h-10 rounded-[8px] border border-[#e8e6df] px-3 text-[14px] font-semibold outline-none focus:border-[#103078]"
            />
          </label>
          <label className="grid gap-2">
            <FieldLabel>최대값</FieldLabel>
            <input
              type="number"
              min={1}
              value={question.scaleMax ?? 5}
              onChange={(event) =>
                onChange({ ...question, scaleMax: Number.parseInt(event.target.value, 10) || 5 })
              }
              className="h-10 rounded-[8px] border border-[#e8e6df] px-3 text-[14px] font-semibold outline-none focus:border-[#103078]"
            />
          </label>
          <label className="grid gap-2">
            <FieldLabel>최소 라벨</FieldLabel>
            <input
              value={question.scaleMinLabel ?? ""}
              onChange={(event) => onChange({ ...question, scaleMinLabel: event.target.value })}
              className="h-10 rounded-[8px] border border-[#e8e6df] px-3 text-[14px] font-semibold outline-none focus:border-[#103078]"
              placeholder="낮음"
            />
          </label>
          <label className="grid gap-2">
            <FieldLabel>최대 라벨</FieldLabel>
            <input
              value={question.scaleMaxLabel ?? ""}
              onChange={(event) => onChange({ ...question, scaleMaxLabel: event.target.value })}
              className="h-10 rounded-[8px] border border-[#e8e6df] px-3 text-[14px] font-semibold outline-none focus:border-[#103078]"
              placeholder="높음"
            />
          </label>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#f0eee8] pt-4">
        <label className="inline-flex h-9 items-center gap-2 rounded-[8px] border border-[#e8e6df] bg-[#fbfaf7] px-3 text-[13px] font-bold text-[#5f574c]">
          <input
            type="checkbox"
            checked={question.required}
            onChange={(event) => onChange({ ...question, required: event.target.checked })}
          />
          필수
        </label>
        <button
          type="button"
          onClick={onMoveUp}
          className="h-9 rounded-[8px] border border-[#e8e6df] bg-white px-3 text-[13px] font-bold text-[#5f574c]"
        >
          위로
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          className="h-9 rounded-[8px] border border-[#e8e6df] bg-white px-3 text-[13px] font-bold text-[#5f574c]"
        >
          아래로
        </button>
        <button
          type="button"
          onClick={onDuplicate}
          className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-[#e8e6df] bg-white px-3 text-[13px] font-bold text-[#5f574c]"
        >
          <Copy className="h-4 w-4" />
          복사
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-red-100 bg-red-50 px-3 text-[13px] font-bold text-red-700"
        >
          <Trash2 className="h-4 w-4" />
          삭제
        </button>
      </div>
    </section>
  );
}

export default function FormCreate() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<CreateClubFormInput>(() => createInitialDraft());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requiredCount = useMemo(
    () => draft.questions.filter((question) => question.required).length,
    [draft.questions],
  );

  function updateQuestion(index: number, question: FormQuestion) {
    setDraft((current) => ({
      ...current,
      questions: current.questions.map((item, currentIndex) =>
        currentIndex === index ? question : item,
      ),
    }));
  }

  function addQuestion(type: FormQuestionType = "short_text") {
    setDraft((current) => ({
      ...current,
      questions: [...current.questions, createBlankQuestion(type)],
    }));
  }

  function removeQuestion(index: number) {
    setDraft((current) => ({
      ...current,
      questions: current.questions.filter((_, currentIndex) => currentIndex !== index),
    }));
  }

  function applyGameTemplate() {
    setDraft(createGameTournamentTemplate());
    setError(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!draft.title.trim()) {
      setError("폼 제목을 입력해주세요.");
      return;
    }

    const invalidQuestion = draft.questions.find((question) => {
      if (!question.title.trim()) return true;
      if (questionTypeNeedsOptions(question.type)) {
        return !question.options || question.options.filter((option) => option.label.trim()).length < 2;
      }
      return false;
    });

    if (invalidQuestion) {
      setError("질문 제목과 선택지 2개 이상이 필요한 질문을 확인해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const saved = await saveForm(draft);
      navigate(getFormDetailPath(saved.id));
    } catch (requestError) {
      setError(sanitizeUserError(requestError, "폼을 저장하지 못했습니다."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="kb-root" style={PAGE_STYLE}>
      <form onSubmit={handleSubmit} className="mx-auto flex max-w-[1180px] flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/member/forms"
            className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-[#e8e6df] bg-white px-3.5 text-[14px] font-bold text-[#312f2c] no-underline transition-colors hover:border-[#cfcac0]"
          >
            <ArrowLeft className="h-4 w-4" />
            폼 목록
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-[#0a0a0a] px-4 text-[14px] font-bold text-white transition-colors hover:bg-[#222222] disabled:cursor-not-allowed disabled:opacity-55"
          >
            <Save className="h-4 w-4" />
            {submitting ? "저장 중" : "저장"}
          </button>
        </div>

        <header>
          <div
            className="kb-mono mb-2 text-[13px] uppercase text-[#6f6a62]"
            style={{ letterSpacing: "0.14em" }}
          >
            Form Builder
          </div>
          <h1 className="kb-display m-0 text-[32px] font-black tracking-normal text-[#0a0a0a]">
            폼 만들기
          </h1>
        </header>

        {error ? (
          <div className="rounded-[8px] border border-red-100 bg-red-50 px-4 py-3 text-[14px] font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        <main className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="flex flex-col gap-4">
            <div className="rounded-[10px] border border-[#e8e6df] bg-white p-5">
              <input
                value={draft.title}
                onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                className="h-14 w-full border-0 border-b border-[#e8e6df] bg-transparent text-[30px] font-black outline-none focus:border-[#103078]"
                placeholder="제목 없는 폼"
              />
              <textarea
                value={draft.description}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, description: event.target.value }))
                }
                className="mt-4 min-h-[90px] w-full resize-y rounded-[8px] border border-[#eeeae2] px-3 py-3 text-[15px] leading-7 outline-none focus:border-[#103078]"
                placeholder="폼 설명"
              />
            </div>

            {draft.questions.map((question, index) => (
              <QuestionCard
                key={question.id}
                index={index}
                question={question}
                onChange={(nextQuestion) => updateQuestion(index, nextQuestion)}
                onDuplicate={() =>
                  setDraft((current) => ({
                    ...current,
                    questions: [
                      ...current.questions.slice(0, index + 1),
                      cloneQuestion(question),
                      ...current.questions.slice(index + 1),
                    ],
                  }))
                }
                onMoveUp={() =>
                  index > 0 &&
                  setDraft((current) => ({
                    ...current,
                    questions: moveItem(current.questions, index, index - 1),
                  }))
                }
                onMoveDown={() =>
                  index < draft.questions.length - 1 &&
                  setDraft((current) => ({
                    ...current,
                    questions: moveItem(current.questions, index, index + 1),
                  }))
                }
                onRemove={() => removeQuestion(index)}
              />
            ))}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => addQuestion("short_text")}
                className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-[#e8e6df] bg-white px-3.5 text-[14px] font-bold text-[#312f2c] transition-colors hover:border-[#cfcac0]"
              >
                <Plus className="h-4 w-4" />
                질문 추가
              </button>
              <button
                type="button"
                onClick={() => addQuestion("single_choice")}
                className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-[#d8e2f7] bg-[#f6f9ff] px-3.5 text-[14px] font-bold text-[#183b80]"
              >
                <ListPlus className="h-4 w-4" />
                선택 질문
              </button>
              <button
                type="button"
                onClick={applyGameTemplate}
                className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-[#f2d8b7] bg-[#fff8ed] px-3.5 text-[14px] font-bold text-[#8a4b12]"
              >
                <Trophy className="h-4 w-4" />
                게임대회 템플릿
              </button>
            </div>
          </section>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
            <div className="rounded-[10px] border border-[#eeeae2] bg-white p-5">
              <h2 className="m-0 text-[18px] font-black text-[#111111]">설정</h2>
              <div className="mt-4 grid gap-4">
                <label className="grid gap-2">
                  <FieldLabel>상태</FieldLabel>
                  <select
                    value={draft.status}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        status: event.target.value as ClubFormStatus,
                        acceptsResponses: event.target.value === "active",
                      }))
                    }
                    className="h-10 rounded-[8px] border border-[#e8e6df] bg-white px-3 text-[14px] font-bold outline-none focus:border-[#103078]"
                  >
                    {Object.entries(FORM_STATUS_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2">
                  <FieldLabel>분류</FieldLabel>
                  <select
                    value={draft.category}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        category: event.target.value as ClubForm["category"],
                      }))
                    }
                    className="h-10 rounded-[8px] border border-[#e8e6df] bg-white px-3 text-[14px] font-bold outline-none focus:border-[#103078]"
                  >
                    {Object.entries(FORM_CATEGORY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="inline-flex items-center gap-2 text-[14px] font-bold text-[#312f2c]">
                  <input
                    type="checkbox"
                    checked={draft.requiresLogin}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, requiresLogin: event.target.checked }))
                    }
                  />
                  로그인한 부원만 응답
                </label>
                <label className="inline-flex items-center gap-2 text-[14px] font-bold text-[#312f2c]">
                  <input
                    type="checkbox"
                    checked={draft.commentsEnabled}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, commentsEnabled: event.target.checked }))
                    }
                  />
                  댓글 허용
                </label>
              </div>
            </div>

            <div className="rounded-[10px] border border-[#eeeae2] bg-white p-5">
              <h2 className="m-0 inline-flex items-center gap-2 text-[18px] font-black text-[#111111]">
                <Trophy className="h-5 w-5 text-[#103078]" />
                대회 / 리그전
              </h2>
              <div className="mt-4 grid gap-4">
                <label className="inline-flex items-center gap-2 text-[14px] font-bold text-[#312f2c]">
                  <input
                    type="checkbox"
                    checked={draft.tournament.enabled}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        tournament: {
                          ...current.tournament,
                          enabled: event.target.checked,
                          title: current.tournament.title || `${current.title || "행사"} 리그전`,
                        },
                      }))
                    }
                  />
                  팀 등록과 리그전 사용
                </label>
                <label className="grid gap-2">
                  <FieldLabel>대회명</FieldLabel>
                  <input
                    value={draft.tournament.title}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        tournament: { ...current.tournament, title: event.target.value },
                      }))
                    }
                    className="h-10 rounded-[8px] border border-[#e8e6df] px-3 text-[14px] font-semibold outline-none focus:border-[#103078]"
                    placeholder="KOBOT 게임대회 리그전"
                  />
                </label>
                <label className="grid gap-2">
                  <FieldLabel>팀 최대 인원</FieldLabel>
                  <input
                    type="number"
                    min={1}
                    value={draft.tournament.maxTeamSize}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        tournament: {
                          ...current.tournament,
                          maxTeamSize: Number.parseInt(event.target.value, 10) || 1,
                        },
                      }))
                    }
                    className="h-10 rounded-[8px] border border-[#e8e6df] px-3 text-[14px] font-semibold outline-none focus:border-[#103078]"
                  />
                </label>
              </div>
            </div>

            <div className="rounded-[10px] border border-[#eeeae2] bg-[#fbfaf7] p-5">
              <div className="text-[13px] font-bold text-[#6f6a62]">현재 구성</div>
              <div className="mt-3 grid gap-2 text-[14px] font-bold text-[#312f2c]">
                <div className="flex justify-between">
                  <span>질문</span>
                  <span>{draft.questions.length}개</span>
                </div>
                <div className="flex justify-between">
                  <span>필수 질문</span>
                  <span>{requiredCount}개</span>
                </div>
                <div className="flex justify-between">
                  <span>댓글</span>
                  <span>{draft.commentsEnabled ? "사용" : "미사용"}</span>
                </div>
                <div className="flex justify-between">
                  <span>리그전</span>
                  <span>{draft.tournament.enabled ? "사용" : "미사용"}</span>
                </div>
              </div>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-[#17633a]">
                <Check className="h-4 w-4" />
                자동 저장은 저장 버튼 기준
              </div>
            </div>
          </aside>
        </main>
      </form>
    </div>
  );
}
