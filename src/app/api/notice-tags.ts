export type NoticeTopicTag = {
  label: string;
  tone: "blue" | "green" | "amber" | "slate";
};

const KEYWORD_TAGS: Array<{
  label: string;
  tone: NoticeTopicTag["tone"];
  pattern: RegExp;
}> = [
  { label: "업데이트", tone: "green", pattern: /업데이트|수정|변경|개선|release|changelog/i },
  { label: "프로젝트", tone: "blue", pattern: /프로젝트|project/i },
  { label: "GitHub", tone: "slate", pattern: /github|git hub|저장소|레포|repo|repository/i },
  { label: "공지", tone: "amber", pattern: /공지|안내|announcement|notice/i },
  { label: "자료", tone: "blue", pattern: /자료|pdf|파일|다운로드|material/i },
  { label: "스터디", tone: "green", pattern: /스터디|study/i },
];

export function inferNoticeTopicTags(title: string, body: string): NoticeTopicTag[] {
  const source = `${title}\n${body}`;
  const tags: NoticeTopicTag[] = [];
  const seen = new Set<string>();

  for (const match of source.matchAll(/#([0-9A-Za-z가-힣_-]{2,24})/g)) {
    const label = match[1]?.trim();
    if (!label || seen.has(label)) continue;
    tags.push({ label, tone: "slate" });
    seen.add(label);
  }

  for (const tag of KEYWORD_TAGS) {
    if (!tag.pattern.test(source) || seen.has(tag.label)) continue;
    tags.push({ label: tag.label, tone: tag.tone });
    seen.add(tag.label);
  }

  return tags.slice(0, 5);
}
