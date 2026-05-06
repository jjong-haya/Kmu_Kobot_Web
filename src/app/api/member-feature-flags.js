export const COMING_SOON_MEMBER_PAGE_KEYS = [
  "study-playlist",
  "events",
  "resources",
  "equipment",
  "votes",
];

const COMING_SOON_TITLES = {
  "study-log": "스터디 기록",
  "study-playlist": "스터디 플레이리스트",
  events: "행사",
  resources: "자료실",
  equipment: "장비 대여",
  votes: "투표",
};

export function isMemberFeatureComingSoon(key) {
  return COMING_SOON_MEMBER_PAGE_KEYS.includes(key);
}

export function getComingSoonPageTitle(key) {
  return COMING_SOON_TITLES[key] ?? "준비 중";
}
