import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import {
  Award,
  Check,
  Loader2,
  Plus,
  ShieldAlert,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  createQuest,
  deleteQuest,
  listQuestCompletions,
  listQuests,
  reviewQuestCompletion,
  setQuestAudienceTags,
  setQuestRewardTags,
  submitQuestCompletion,
  updateQuest,
  type QuestAudienceMode,
  type QuestCompletion,
  type QuestSummary,
  type QuestTagRef,
} from "../../api/quests";
import { listTags, type MemberTag } from "../../api/tags";
import { useAuth } from "../../auth/useAuth";
import { sanitizeUserError } from "../../utils/sanitize-error";

const PAGE_STYLE: CSSProperties = {
  minHeight: "calc(100vh - 4rem)",
  margin: -32,
  padding: 32,
  background: "#fafaf9",
};

const CARD_STYLE: CSSProperties = {
  background: "#fff",
  border: "1px solid #e8e8e4",
  borderRadius: 16,
  padding: 22,
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
};

const SLUG_PATTERN = /^[a-z][a-z0-9_-]{1,40}$/;

export default function Quests() {
  const { user, hasPermission, refreshTags } = useAuth();
  const isAdmin = hasPermission("permissions.manage", "members.manage");

  const [quests, setQuests] = useState<QuestSummary[]>([]);
  const [tagsCatalog, setTagsCatalog] = useState<MemberTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [editingQuest, setEditingQuest] = useState<QuestSummary | null>(null);
  const [submittingQuest, setSubmittingQuest] = useState<QuestSummary | null>(null);
  const [reviewingQuest, setReviewingQuest] = useState<QuestSummary | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const [questList, tagList] = await Promise.all([listQuests(user?.id ?? null), listTags()]);
      setQuests(questList);
      setTagsCatalog(tagList);
    } catch (err) {
      setError(sanitizeUserError(err, "미션 목록을 불러오지 못했습니다."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const visibleQuests = useMemo(
    () => quests.filter((q) => isAdmin || q.isActive),
    [quests, isAdmin],
  );

  return (
    <div style={PAGE_STYLE}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 22,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                letterSpacing: "0.16em",
                color: "var(--kb-ink-400)",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              MISSIONS · 퀘스트 시스템
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
              미션
            </h1>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--kb-ink-500)", lineHeight: 1.6, maxWidth: 720 }}>
              회장이 만든 미션을 완료하면 보상 태그가 자동 부여됩니다. 청중을 특정
              태그로 제한하면 해당 태그를 가진 부원에게만 미션이 보입니다.
            </p>
          </div>
          {isAdmin ? (
            <button
              type="button"
              onClick={() => setCreating((v) => !v)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 16px",
                borderRadius: 10,
                background: creating ? "#f4f4f2" : "#0a0a0a",
                color: creating ? "var(--kb-ink-700)" : "#fff",
                border: creating ? "1px solid #e8e8e4" : "none",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <Plus style={{ width: 16, height: 16 }} />
              {creating ? "취소" : "새 미션"}
            </button>
          ) : null}
        </header>

        {error ? (
          <div
            style={{
              ...CARD_STYLE,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              padding: 14,
              fontSize: 13.5,
              marginBottom: 14,
              display: "flex",
              gap: 10,
            }}
          >
            <ShieldAlert style={{ width: 18, height: 18, flexShrink: 0 }} />
            {error}
          </div>
        ) : null}

        {creating && isAdmin ? (
          <CreateQuestForm
            tags={tagsCatalog}
            onCancel={() => setCreating(false)}
            onCreated={async () => {
              setCreating(false);
              await load();
            }}
            onError={setError}
          />
        ) : null}

        {loading ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <Loader2 style={{ width: 22, height: 22, animation: "spin 1s linear infinite" }} />
          </div>
        ) : visibleQuests.length === 0 ? (
          <div style={{ ...CARD_STYLE, padding: 48, textAlign: "center", color: "var(--kb-ink-400)" }}>
            <Sparkles style={{ width: 22, height: 22, marginBottom: 8 }} />
            <br />
            아직 활성화된 미션이 없습니다.
            {isAdmin ? " 우상단에서 새로 만들어 주세요." : ""}
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 14,
            }}
          >
            {visibleQuests.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                isAdmin={isAdmin}
                onEdit={() => setEditingQuest(quest)}
                onSubmit={() => setSubmittingQuest(quest)}
                onReview={() => setReviewingQuest(quest)}
              />
            ))}
          </div>
        )}
      </div>

      {editingQuest ? (
        <EditQuestModal
          quest={editingQuest}
          tags={tagsCatalog}
          onClose={() => setEditingQuest(null)}
          onSaved={async () => {
            setEditingQuest(null);
            await load();
          }}
          onError={setError}
        />
      ) : null}

      {submittingQuest ? (
        <SubmitQuestModal
          quest={submittingQuest}
          onClose={() => setSubmittingQuest(null)}
          onDone={async () => {
            setSubmittingQuest(null);
            await load();
            await refreshTags();
          }}
          onError={setError}
        />
      ) : null}

      {reviewingQuest ? (
        <ReviewQuestModal
          quest={reviewingQuest}
          onClose={() => setReviewingQuest(null)}
          onUpdated={async () => {
            await load();
          }}
          onError={setError}
        />
      ) : null}
    </div>
  );
}

function QuestCard({
  quest,
  isAdmin,
  onEdit,
  onSubmit,
  onReview,
}: {
  quest: QuestSummary;
  isAdmin: boolean;
  onEdit: () => void;
  onSubmit: () => void;
  onReview: () => void;
}) {
  const myStatus = quest.myCompletion?.status ?? null;
  return (
    <article
      style={{
        ...CARD_STYLE,
        padding: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        opacity: quest.isActive ? 1 : 0.55,
      }}
    >
      <div
        style={{
          background: quest.color,
          color: "#fff",
          padding: "14px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.8 }}>
            {quest.audienceMode === "all" ? "전체 공개" : `${quest.audienceTags.length}개 태그 한정`}
          </div>
          <h3 style={{ margin: "4px 0 0", fontSize: 17, fontWeight: 800, letterSpacing: "-0.01em" }}>
            {quest.label}
            {!quest.isActive ? (
              <span style={{ marginLeft: 8, fontSize: 11, opacity: 0.85 }}>
                (비활성)
              </span>
            ) : null}
          </h3>
        </div>
        {isAdmin ? (
          <button
            type="button"
            onClick={onEdit}
            style={{
              padding: "5px 10px",
              borderRadius: 8,
              background: "rgba(255,255,255,0.2)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.3)",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            수정
          </button>
        ) : null}
      </div>

      <div style={{ padding: 16, flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
        {quest.description ? (
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--kb-ink-700)", lineHeight: 1.55 }}>
            {quest.description}
          </p>
        ) : null}

        {quest.rewardTags.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "var(--kb-ink-400)", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              보상
            </span>
            {quest.rewardTags.map((tag) => (
              <TagChip key={tag.id} tag={tag} />
            ))}
          </div>
        ) : null}

        {quest.audienceMode === "tag_in" && quest.audienceTags.length > 0 && isAdmin ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "var(--kb-ink-400)", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              청중
            </span>
            {quest.audienceTags.map((tag) => (
              <TagChip key={tag.id} tag={tag} />
            ))}
          </div>
        ) : null}

        <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <CompletionBadge status={myStatus} />
          <div style={{ display: "flex", gap: 6 }}>
            {!isAdmin && (myStatus === null || myStatus === "rejected") ? (
              <button
                type="button"
                onClick={onSubmit}
                style={primaryBtn}
              >
                완료 신청
              </button>
            ) : null}
            {!isAdmin && myStatus === "submitted" ? (
              <button type="button" onClick={onSubmit} style={secondaryBtn}>
                증빙 수정
              </button>
            ) : null}
            {isAdmin ? (
              <button
                type="button"
                onClick={onReview}
                style={primaryBtn}
              >
                신청 검토 ({quest.pendingReviewCount})
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

function CompletionBadge({ status }: { status: "submitted" | "approved" | "rejected" | null }) {
  if (status === null)
    return (
      <span style={{ fontSize: 11, color: "var(--kb-ink-400)" }}>아직 신청 안 함</span>
    );
  const palette =
    status === "approved"
      ? { bg: "#dcfce7", fg: "#15803d", text: "✅ 완료" }
      : status === "rejected"
        ? { bg: "#fee2e2", fg: "#991b1b", text: "거절됨" }
        : { bg: "#fef3c7", fg: "#92400e", text: "검토 대기" };
  return (
    <span
      style={{
        padding: "3px 10px",
        borderRadius: 999,
        background: palette.bg,
        color: palette.fg,
        fontSize: 11.5,
        fontWeight: 700,
      }}
    >
      {palette.text}
    </span>
  );
}

function TagChip({ tag }: { tag: QuestTagRef }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 10.5,
        fontWeight: 700,
        background: "rgba(0,0,0,0.04)",
        color: "var(--kb-ink-700)",
        border: `1px solid ${tag.color}33`,
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: tag.color }} />
      {tag.label}
    </span>
  );
}

function CreateQuestForm({
  tags,
  onCancel,
  onCreated,
  onError,
}: {
  tags: MemberTag[];
  onCancel: () => void;
  onCreated: () => Promise<void>;
  onError: (message: string | null) => void;
}) {
  const [slug, setSlug] = useState("");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#0ea5e9");
  const [audienceMode, setAudienceMode] = useState<QuestAudienceMode>("all");
  const [audienceTagIds, setAudienceTagIds] = useState<Set<string>>(new Set());
  const [rewardTagIds, setRewardTagIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    if (!SLUG_PATTERN.test(slug.trim())) {
      onError("slug는 영어 소문자/숫자/하이픈/언더스코어 2~41자.");
      return;
    }
    if (!label.trim()) {
      onError("미션 제목을 입력해 주세요.");
      return;
    }
    try {
      setSubmitting(true);
      onError(null);
      await createQuest({
        slug: slug.trim(),
        label: label.trim(),
        description,
        color,
        audienceMode,
        audienceTagIds: audienceMode === "tag_in" ? [...audienceTagIds] : [],
        rewardTagIds: [...rewardTagIds],
      });
      await onCreated();
    } catch (err) {
      onError(sanitizeUserError(err, "미션을 생성하지 못했습니다."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ ...CARD_STYLE, marginBottom: 18 }}>
      <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 800 }}>새 미션</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <Field label="slug">
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase())}
            placeholder="study-3-times"
            style={inputStyle}
            required
          />
        </Field>
        <Field label="제목">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="스터디 3회 달성하기"
            style={inputStyle}
            required
          />
        </Field>
        <Field label="색상">
          <div style={{ display: "flex", gap: 8 }}>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: 40, height: 32, border: "none", padding: 0, cursor: "pointer" }} />
            <input value={color} onChange={(e) => setColor(e.target.value)} style={{ ...inputStyle, fontFamily: "monospace" }} />
          </div>
        </Field>
        <Field label="청중">
          <select
            value={audienceMode}
            onChange={(e) => setAudienceMode(e.target.value as QuestAudienceMode)}
            style={inputStyle}
          >
            <option value="all">전체 부원에게 공개</option>
            <option value="tag_in">특정 태그 보유자만</option>
          </select>
        </Field>
        <Field label="설명" style={{ gridColumn: "1 / -1" }}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="이번 학기 스터디를 3회 이상 출석하면 인정"
            style={{ ...inputStyle, minHeight: 70, fontFamily: "inherit", resize: "vertical" }}
          />
        </Field>
      </div>

      {audienceMode === "tag_in" ? (
        <TagPicker
          label="청중 태그 (이 태그 중 하나라도 가진 부원만 미션이 보임)"
          tags={tags}
          selected={audienceTagIds}
          onToggle={(id, next) =>
            setAudienceTagIds((prev) => {
              const copy = new Set(prev);
              if (next) copy.add(id);
              else copy.delete(id);
              return copy;
            })
          }
        />
      ) : null}

      <TagPicker
        label="보상 태그 (승인되면 자동으로 부여됨)"
        tags={tags}
        selected={rewardTagIds}
        onToggle={(id, next) =>
          setRewardTagIds((prev) => {
            const copy = new Set(prev);
            if (next) copy.add(id);
            else copy.delete(id);
            return copy;
          })
        }
      />

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
        <button type="button" onClick={onCancel} style={ghostBtn}>
          취소
        </button>
        <button type="submit" disabled={submitting} style={{ ...primaryBtn, opacity: submitting ? 0.6 : 1 }}>
          {submitting ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite", marginRight: 4 }} /> : null}
          만들기
        </button>
      </div>
    </form>
  );
}

function EditQuestModal({
  quest,
  tags,
  onClose,
  onSaved,
  onError,
}: {
  quest: QuestSummary;
  tags: MemberTag[];
  onClose: () => void;
  onSaved: () => Promise<void>;
  onError: (message: string | null) => void;
}) {
  const [label, setLabel] = useState(quest.label);
  const [description, setDescription] = useState(quest.description ?? "");
  const [color, setColor] = useState(quest.color);
  const [audienceMode, setAudienceMode] = useState<QuestAudienceMode>(quest.audienceMode);
  const [isActive, setIsActive] = useState(quest.isActive);
  const [audienceTagIds, setAudienceTagIds] = useState<Set<string>>(
    new Set(quest.audienceTags.map((t) => t.id)),
  );
  const [rewardTagIds, setRewardTagIds] = useState<Set<string>>(
    new Set(quest.rewardTags.map((t) => t.id)),
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    try {
      setSaving(true);
      onError(null);
      await updateQuest(quest.id, { label, description, color, audienceMode, isActive });
      await setQuestAudienceTags(quest.id, audienceMode === "tag_in" ? [...audienceTagIds] : []);
      await setQuestRewardTags(quest.id, [...rewardTagIds]);
      await onSaved();
    } catch (err) {
      onError(sanitizeUserError(err, "미션을 저장하지 못했습니다."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (deleting) return;
    if (!window.confirm(`'${quest.label}' 미션을 삭제할까요? 관련 신청도 함께 삭제됩니다.`)) return;
    try {
      setDeleting(true);
      await deleteQuest(quest.id);
      await onSaved();
    } catch (err) {
      onError(sanitizeUserError(err, "미션을 삭제하지 못했습니다."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <ModalShell title={`미션 수정 · ${quest.slug}`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <Field label="제목">
            <input value={label} onChange={(e) => setLabel(e.target.value)} style={inputStyle} required />
          </Field>
          <Field label="색상">
            <div style={{ display: "flex", gap: 8 }}>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: 40, height: 32, border: "none", padding: 0, cursor: "pointer" }} />
              <input value={color} onChange={(e) => setColor(e.target.value)} style={{ ...inputStyle, fontFamily: "monospace" }} />
            </div>
          </Field>
          <Field label="청중">
            <select value={audienceMode} onChange={(e) => setAudienceMode(e.target.value as QuestAudienceMode)} style={inputStyle}>
              <option value="all">전체 부원에게 공개</option>
              <option value="tag_in">특정 태그 보유자만</option>
            </select>
          </Field>
          <Field label="활성화">
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 12px", border: "1px solid #e8e8e4", borderRadius: 8 }}>
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              {isActive ? "활성 (부원에게 노출)" : "비활성"}
            </label>
          </Field>
          <Field label="설명" style={{ gridColumn: "1 / -1" }}>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} style={{ ...inputStyle, minHeight: 70, fontFamily: "inherit", resize: "vertical" }} />
          </Field>
        </div>

        {audienceMode === "tag_in" ? (
          <TagPicker
            label="청중 태그"
            tags={tags}
            selected={audienceTagIds}
            onToggle={(id, next) =>
              setAudienceTagIds((prev) => {
                const copy = new Set(prev);
                if (next) copy.add(id);
                else copy.delete(id);
                return copy;
              })
            }
          />
        ) : null}

        <TagPicker
          label="보상 태그"
          tags={tags}
          selected={rewardTagIds}
          onToggle={(id, next) =>
            setRewardTagIds((prev) => {
              const copy = new Set(prev);
              if (next) copy.add(id);
              else copy.delete(id);
              return copy;
            })
          }
        />

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            style={{ ...ghostBtn, color: "#dc2626", borderColor: "#fecaca" }}
          >
            <Trash2 style={{ width: 13, height: 13 }} />
            삭제
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={onClose} style={ghostBtn}>취소</button>
            <button type="submit" disabled={saving} style={{ ...primaryBtn, opacity: saving ? 0.6 : 1 }}>
              {saving ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite", marginRight: 4 }} /> : <Check style={{ width: 14, height: 14, marginRight: 4 }} />}
              저장
            </button>
          </div>
        </div>
      </form>
    </ModalShell>
  );
}

function SubmitQuestModal({
  quest,
  onClose,
  onDone,
  onError,
}: {
  quest: QuestSummary;
  onClose: () => void;
  onDone: () => Promise<void>;
  onError: (message: string | null) => void;
}) {
  const [evidence, setEvidence] = useState(quest.myCompletion?.evidence ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    try {
      setSubmitting(true);
      onError(null);
      await submitQuestCompletion(quest.id, evidence);
      await onDone();
    } catch (err) {
      onError(sanitizeUserError(err, "완료 신청에 실패했습니다."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalShell title={`완료 신청 · ${quest.label}`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {quest.myCompletion?.status === "rejected" && quest.myCompletion.reviewReason ? (
          <div
            style={{
              background: "#fee2e2",
              border: "1px solid #fecaca",
              borderRadius: 8,
              padding: 10,
              fontSize: 13,
              color: "#991b1b",
              marginBottom: 12,
            }}
          >
            <strong>거절 사유:</strong> {quest.myCompletion.reviewReason}
          </div>
        ) : null}
        <Field label="증빙 / 메모">
          <textarea
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            placeholder="언제·어디서·무엇을 했는지 적어 주세요."
            style={{ ...inputStyle, minHeight: 120, fontFamily: "inherit", resize: "vertical" }}
            required
          />
        </Field>
        <p style={{ fontSize: 12.5, color: "var(--kb-ink-400)", margin: "8px 0 12px" }}>
          신청 후 회장이 검토합니다. 승인되면 보상 태그가 자동으로 부여됩니다.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button type="button" onClick={onClose} style={ghostBtn}>취소</button>
          <button type="submit" disabled={submitting} style={{ ...primaryBtn, opacity: submitting ? 0.6 : 1 }}>
            {submitting ? <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite", marginRight: 4 }} /> : <Award style={{ width: 14, height: 14, marginRight: 4 }} />}
            제출
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function ReviewQuestModal({
  quest,
  onClose,
  onUpdated,
  onError,
}: {
  quest: QuestSummary;
  onClose: () => void;
  onUpdated: () => Promise<void>;
  onError: (message: string | null) => void;
}) {
  const [completions, setCompletions] = useState<QuestCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      const rows = await listQuestCompletions(quest.id);
      setCompletions(rows);
    } catch (err) {
      onError(sanitizeUserError(err, "신청 목록을 불러오지 못했습니다."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quest.id]);

  async function decide(id: string, decision: "approved" | "rejected", reason?: string) {
    try {
      setBusy(id);
      onError(null);
      await reviewQuestCompletion(id, decision, reason);
      await load();
      await onUpdated();
    } catch (err) {
      onError(sanitizeUserError(err, "검토 처리에 실패했습니다."));
    } finally {
      setBusy(null);
    }
  }

  return (
    <ModalShell title={`신청 검토 · ${quest.label}`} onClose={onClose}>
      {loading ? (
        <div style={{ padding: 20, textAlign: "center" }}>
          <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} />
        </div>
      ) : completions.length === 0 ? (
        <div style={{ padding: 20, textAlign: "center", color: "var(--kb-ink-400)", fontSize: 13 }}>
          아직 신청한 부원이 없습니다.
        </div>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8, maxHeight: "60vh", overflowY: "auto" }}>
          {completions.map((completion) => (
            <li
              key={completion.id}
              style={{
                border: "1px solid #ececeb",
                borderRadius: 10,
                padding: 12,
                background: "#fff",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{completion.userDisplayName}</div>
                  <div style={{ fontSize: 11.5, color: "var(--kb-ink-400)" }}>{completion.userEmail}</div>
                </div>
                <CompletionBadge status={completion.status} />
              </div>
              {completion.evidence ? (
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--kb-ink-700)",
                    whiteSpace: "pre-wrap",
                    background: "#fafaf9",
                    border: "1px solid #f3f3f0",
                    borderRadius: 6,
                    padding: 8,
                    marginBottom: 8,
                  }}
                >
                  {completion.evidence}
                </div>
              ) : null}
              {completion.reviewReason ? (
                <div style={{ fontSize: 12, color: "var(--kb-ink-500)", marginBottom: 8 }}>
                  검토 메모: {completion.reviewReason}
                </div>
              ) : null}
              {completion.status === "submitted" ? (
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => decide(completion.id, "approved")}
                    disabled={busy === completion.id}
                    style={{ ...primaryBtn, padding: "5px 10px", fontSize: 12 }}
                  >
                    승인 + 보상 부여
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const reason = window.prompt("거절 사유를 입력해 주세요 (선택)") ?? undefined;
                      void decide(completion.id, "rejected", reason);
                    }}
                    disabled={busy === completion.id}
                    style={{ ...ghostBtn, padding: "5px 10px", fontSize: 12, color: "#dc2626", borderColor: "#fecaca" }}
                  >
                    거절
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </ModalShell>
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 600,
          background: "#fff",
          borderRadius: 16,
          padding: 22,
          boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
          maxHeight: "92vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>{title}</h2>
          <button type="button" onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--kb-ink-500)" }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function TagPicker({
  label,
  tags,
  selected,
  onToggle,
}: {
  label: string;
  tags: MemberTag[];
  selected: Set<string>;
  onToggle: (id: string, next: boolean) => void;
}) {
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ ...labelStyle, marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {tags.map((tag) => {
          const checked = selected.has(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => onToggle(tag.id, !checked)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "5px 10px",
                borderRadius: 999,
                border: checked ? `1px solid ${tag.color}` : "1px solid #e8e8e4",
                background: checked ? `${tag.color}15` : "#fff",
                color: checked ? "var(--kb-ink-900)" : "var(--kb-ink-700)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: tag.color }} />
              {tag.label}
              {checked ? <Check style={{ width: 11, height: 11 }} /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: CSSProperties;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5, ...style }}>
      <span style={labelStyle}>{label}</span>
      {children}
    </label>
  );
}

const labelStyle: CSSProperties = {
  fontSize: 11.5,
  fontWeight: 700,
  color: "var(--kb-ink-700)",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 8,
  border: "1px solid #e8e8e4",
  fontSize: 13.5,
  outline: "none",
  fontFamily: "inherit",
};

const primaryBtn: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "8px 14px",
  borderRadius: 8,
  background: "#0a0a0a",
  color: "#fff",
  border: "none",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryBtn: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "8px 14px",
  borderRadius: 8,
  background: "#fff",
  color: "var(--kb-ink-700)",
  border: "1px solid #e8e8e4",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const ghostBtn: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "8px 14px",
  borderRadius: 8,
  background: "transparent",
  color: "var(--kb-ink-700)",
  border: "1px solid #e8e8e4",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};
