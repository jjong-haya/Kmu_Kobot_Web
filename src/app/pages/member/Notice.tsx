import { useMemo, useState } from "react";
import { Bell, Inbox, Pin } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
  EmptyState,
  FilterBar,
  PageHeader,
  StatusPill,
  type StatusTone,
} from "../../components/primitives";

type NoticeCategory = "전체" | "일반" | "행사" | "세미나" | "긴급";

type Notice = {
  id: number;
  title: string;
  category: Exclude<NoticeCategory, "전체">;
  date: string;
  isPinned: boolean;
  isRead: boolean;
  preview: string;
  author: string;
};

const CATEGORIES: NoticeCategory[] = ["전체", "일반", "행사", "세미나", "긴급"];

const CATEGORY_TONE: Record<Exclude<NoticeCategory, "전체">, StatusTone> = {
  일반: "neutral",
  행사: "info",
  세미나: "accent",
  긴급: "danger",
};

const PAGE_STYLE: React.CSSProperties = {
  minHeight: "calc(100vh - 4rem)",
  margin: -32,
  padding: 32,
  background: "var(--kb-surface-page)",
};

const NOTICES: Notice[] = [
  {
    id: 1,
    title: "2026년 상반기 신입 부원 모집 공고",
    category: "일반",
    date: "2026.02.15",
    isPinned: true,
    isRead: false,
    preview: "2026년 상반기 신입 부원을 모집합니다. 로봇에 관심있는 모든 학생 환영!",
    author: "운영진",
  },
  {
    id: 2,
    title: "ROS 2 고급 세미나 안내",
    category: "세미나",
    date: "2026.02.14",
    isPinned: true,
    isRead: false,
    preview: "ROS 2 Navigation Stack 활용법에 대한 세미나를 진행합니다.",
    author: "김철수",
  },
  {
    id: 3,
    title: "국제 로봇 경진대회 참가 안내",
    category: "행사",
    date: "2026.02.13",
    isPinned: false,
    isRead: true,
    preview: "3월 개최되는 국제 로봇 경진대회에 참가합니다. 관심있는 멤버는 신청해주세요.",
    author: "운영진",
  },
  {
    id: 4,
    title: "정기 총회 개최 안내",
    category: "일반",
    date: "2026.02.12",
    isPinned: false,
    isRead: true,
    preview: "2월 20일 정기 총회가 개최됩니다. 모든 멤버는 필수 참석입니다.",
    author: "운영진",
  },
  {
    id: 5,
    title: "프로젝트 중간 발표회",
    category: "행사",
    date: "2026.02.10",
    isPinned: false,
    isRead: true,
    preview: "진행중인 프로젝트들의 중간 발표회를 진행합니다. 많은 참여 부탁드립니다.",
    author: "운영진",
  },
  {
    id: 6,
    title: "[긴급] 이번주 세미나 일정 변경",
    category: "긴급",
    date: "2026.02.09",
    isPinned: false,
    isRead: true,
    preview: "수요일 세미나가 금요일로 변경되었습니다.",
    author: "운영진",
  },
  {
    id: 7,
    title: "컴퓨터 비전 스터디 모집",
    category: "일반",
    date: "2026.02.05",
    isPinned: false,
    isRead: true,
    preview: "OpenCV 기초부터 시작하는 컴퓨터 비전 스터디원을 모집합니다.",
    author: "이영희",
  },
  {
    id: 8,
    title: "로봇 대회 수상 소식",
    category: "일반",
    date: "2026.02.01",
    isPinned: false,
    isRead: true,
    preview: "전국 로봇 경진대회에서 우수상을 수상했습니다! 축하합니다!",
    author: "운영진",
  },
];

function NoticeRow({ notice }: { notice: Notice }) {
  return (
    <article
      tabIndex={0}
      className="group flex cursor-pointer items-start gap-3 rounded-[var(--kb-radius-md)] border border-[var(--kb-border-subtle)] bg-[var(--kb-surface-raised)] p-4 shadow-[var(--kb-shadow-sm)] transition-[border-color,box-shadow] duration-[var(--kb-duration-normal)] hover:border-[var(--kb-navy-100)] hover:shadow-[var(--kb-shadow-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kb-navy-500)]"
    >
      <div className="mt-0.5 flex w-5 shrink-0 justify-center">
        {notice.isPinned ? (
          <Pin className="h-4 w-4 text-[var(--kb-navy-700)]" aria-label="고정됨" />
        ) : !notice.isRead ? (
          <span
            aria-label="안 읽음"
            className="mt-1.5 h-2 w-2 rounded-full bg-[var(--kb-info-500)]"
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {!notice.isRead ? (
              <Bell className="h-3.5 w-3.5 shrink-0 text-[var(--kb-info-500)]" aria-hidden />
            ) : null}
            <h3
              className={`m-0 truncate text-[15px] tracking-tight text-[var(--kb-ink-900)] ${
                notice.isRead ? "font-medium" : "font-semibold"
              }`}
            >
              {notice.title}
            </h3>
          </div>
          <StatusPill tone={CATEGORY_TONE[notice.category]} dot={notice.category === "긴급"}>
            {notice.category}
          </StatusPill>
        </div>
        <p className="mt-1 line-clamp-2 text-[13px] leading-6 text-[var(--kb-ink-500)]">
          {notice.preview}
        </p>
        <div className="mt-2 flex items-center gap-2 text-[11.5px] text-[var(--kb-ink-400)]">
          <span>{notice.author}</span>
          <span aria-hidden>·</span>
          <span>{notice.date}</span>
        </div>
      </div>
    </article>
  );
}

export default function MemberNotice() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<NoticeCategory>("전체");

  const filteredNotices = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("ko-KR");
    return NOTICES.filter((notice) => {
      if (selectedCategory !== "전체" && notice.category !== selectedCategory) return false;
      if (!query) return true;
      return [notice.title, notice.preview, notice.author].some((value) =>
        value.toLocaleLowerCase("ko-KR").includes(query),
      );
    });
  }, [searchQuery, selectedCategory]);

  const unreadNotices = filteredNotices.filter((notice) => !notice.isRead);

  const categoryFilters = (
    <div role="radiogroup" aria-label="공지 분류" className="flex flex-wrap items-center gap-1.5">
      {CATEGORIES.map((category) => {
        const active = selectedCategory === category;
        return (
          <button
            key={category}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setSelectedCategory(category)}
            className={`inline-flex h-8 items-center rounded-[var(--kb-radius-full)] px-3 text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--kb-navy-500)] ${
              active
                ? "bg-[var(--kb-ink-900)] text-[var(--kb-on-accent)]"
                : "border border-[var(--kb-border-subtle)] bg-[var(--kb-surface-raised)] text-[var(--kb-ink-700)] hover:border-[var(--kb-navy-500)] hover:text-[var(--kb-navy-700)]"
            }`}
          >
            {category}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="kb-root" style={PAGE_STYLE}>
      <div className="kb-fade-up mx-auto flex max-w-[960px] flex-col gap-6">
        <PageHeader
          eyebrow="Notice"
          title="공지사항"
          description="동아리의 주요 소식과 공지를 확인하세요."
          actions={
            unreadNotices.length > 0 ? (
              <StatusPill tone="danger" dot>
                {unreadNotices.length}개 안 읽음
              </StatusPill>
            ) : null
          }
        />

        <FilterBar
          search={{
            value: searchQuery,
            onChange: setSearchQuery,
            placeholder: "공지 제목·내용·작성자 검색",
            "aria-label": "공지 검색",
          }}
          start={categoryFilters}
        />

        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">전체 ({filteredNotices.length})</TabsTrigger>
            <TabsTrigger value="unread">안 읽음 ({unreadNotices.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-5 space-y-2.5">
            {filteredNotices.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="검색 결과가 없습니다"
                description="검색어를 다른 키워드로 바꿔보거나 분류를 다시 확인해 주세요."
              />
            ) : (
              filteredNotices.map((notice) => <NoticeRow key={notice.id} notice={notice} />)
            )}
          </TabsContent>

          <TabsContent value="unread" className="mt-5 space-y-2.5">
            {unreadNotices.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="모든 공지를 읽었어요"
                description="새 공지가 올라오면 여기서 확인할 수 있습니다."
              />
            ) : (
              unreadNotices.map((notice) => <NoticeRow key={notice.id} notice={notice} />)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
