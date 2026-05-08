import { getSupabaseBrowserClient } from "../auth/supabase";
import {
  buildSameDaySpaceBookingMessage,
  isSameDayOrPastSpaceBookingDate,
  type SpaceBookingConflict,
} from "./space-booking-conflicts";

export type ReservationType = "meeting" | "study";
export type StoredReservationType = ReservationType | "personal";
export type ReservationScope = "exclusive" | "desk" | "open";

export type BookingParticipant = {
  id: string;
  displayName: string;
  fullName: string | null;
  email: string | null;
  loginId: string | null;
  avatarUrl: string | null;
};

export type BookingAudienceTag = {
  id: string;
  slug: string;
  label: string;
  color: string;
};

export type BookingAudienceTeam = {
  id: string;
  slug: string;
  name: string;
};

export type SpaceBookingRow = {
  id: string;
  title: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  organizer_id: string;
  organizer_name: string;
  type: StoredReservationType;
  scope: ReservationScope;
  attendees: number;
  created_at: string;
  updated_at: string;
};

type PublicSpaceBookingRow = {
  id: string;
  title: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  organizer_name: string;
  type: StoredReservationType;
  scope: ReservationScope;
  attendees: number;
};

export type SpaceBooking = {
  id: string;
  title: string;
  date: string;
  start: string;
  end: string;
  organizer: string;
  organizerId: string;
  type: StoredReservationType;
  scope: ReservationScope;
  attendees: number;
  participants: BookingParticipant[];
  audienceTags: BookingAudienceTag[];
  audienceTeams: BookingAudienceTeam[];
};

export type CreateBookingInput = {
  title: string;
  date: string;
  start: string;
  end: string;
  organizerName: string;
  type: ReservationType;
  scope: ReservationScope;
  attendees: number;
  participantUserIds: string[];
  audienceTagIds: string[];
  audienceTeamIds: string[];
};

export type SpaceBookingAudienceOptions = {
  clubTags: BookingAudienceTag[];
  teams: BookingAudienceTeam[];
};

export class SpaceBookingConflictError extends Error {
  conflict: SpaceBookingConflict | null;

  constructor(conflict: SpaceBookingConflict | null) {
    super("space_booking_time_conflict");
    this.name = "SpaceBookingConflictError";
    this.conflict = conflict;
  }
}

type ProfileRow = {
  id: string;
  display_name: string | null;
  nickname_display?: string | null;
  full_name: string | null;
  email: string | null;
  login_id?: string | null;
  avatar_url: string | null;
};

type AccountRow = {
  user_id: string;
  status: string | null;
};

type ParticipantRow = {
  booking_id: string;
  user_id: string;
};

type AudienceTagRow = {
  booking_id: string;
  tag_id: string;
};

type AudienceTeamRow = {
  booking_id: string;
  team_id: string;
};

type TagAssignmentRow = {
  tag_id: string;
  member_tags?: {
    id?: string | null;
    slug?: string | null;
    label?: string | null;
    color?: string | null;
    is_club?: boolean | null;
  } | null;
};

type TeamMembershipRow = {
  team_id: string;
  teams?: {
    id?: string | null;
    slug?: string | null;
    name?: string | null;
  } | null;
};

const PROFILE_SELECT = [
  "id",
  "display_name",
  "nickname_display",
  "full_name",
  "email",
  "login_id",
  "avatar_url",
].join(", ");

function trimTime(t: string): string {
  return t.slice(0, 5);
}

function localIsoDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseSpaceBookingConflict(error: unknown): SpaceBookingConflict | null {
  const payloads = [
    (error as { details?: string | null })?.details,
    (error as { message?: string | null })?.message,
    (error as { hint?: string | null })?.hint,
  ].filter((value): value is string => typeof value === "string");

  if (!payloads.some((value) => value.includes("space_booking_time_conflict"))) {
    return null;
  }

  const joined = payloads.join(" ");
  const match = joined.match(/(\d{4}-\d{2}-\d{2})\|(\d{2}:\d{2})\|(\d{2}:\d{2})/);
  if (!match) return null;

  return {
    date: match[1],
    start: match[2],
    end: match[3],
  };
}

function normalizeString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function isCreatableReservationType(type: string): type is ReservationType {
  return type === "meeting" || type === "study";
}

function displayNameFor(profile: ProfileRow) {
  return (
    normalizeString(profile.nickname_display) ??
    normalizeString(profile.display_name) ??
    normalizeString(profile.full_name) ??
    normalizeString(profile.email)?.split("@")[0] ??
    "Member"
  );
}

function profileToParticipant(profile: ProfileRow): BookingParticipant {
  return {
    id: profile.id,
    displayName: displayNameFor(profile),
    fullName: normalizeString(profile.full_name),
    email: normalizeString(profile.email),
    loginId: normalizeString(profile.login_id),
    avatarUrl: normalizeString(profile.avatar_url),
  };
}

function rowToBooking(
  row: SpaceBookingRow,
  participants: BookingParticipant[] = [],
  audienceTags: BookingAudienceTag[] = [],
  audienceTeams: BookingAudienceTeam[] = [],
): SpaceBooking {
  return {
    id: row.id,
    title: row.title,
    date: row.booking_date,
    start: trimTime(row.start_time),
    end: trimTime(row.end_time),
    organizer: row.organizer_name,
    organizerId: row.organizer_id,
    type: row.type,
    scope: row.scope,
    attendees: row.attendees,
    participants,
    audienceTags,
    audienceTeams,
  };
}

function publicRowToBooking(row: PublicSpaceBookingRow): SpaceBooking {
  return {
    id: row.id,
    title: row.title,
    date: row.booking_date,
    start: trimTime(row.start_time),
    end: trimTime(row.end_time),
    organizer: row.organizer_name,
    organizerId: "",
    type: row.type,
    scope: row.scope,
    attendees: row.attendees,
    participants: [],
    audienceTags: [],
    audienceTeams: [],
  };
}

async function loadProfilesById(ids: string[]) {
  const supabase = getSupabaseBrowserClient();
  const uniqueIds = [...new Set(ids)].filter(Boolean);
  if (uniqueIds.length === 0) return new Map<string, BookingParticipant>();

  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .in("id", uniqueIds);

  if (error) throw new Error(error.message);

  return new Map(
    ((data ?? []) as unknown as ProfileRow[]).map((profile) => [
      profile.id,
      profileToParticipant(profile),
    ]),
  );
}

async function hydrateBookings(rows: SpaceBookingRow[]) {
  const supabase = getSupabaseBrowserClient();
  const bookingIds = rows.map((row) => row.id);
  if (bookingIds.length === 0) return [];

  const [participantsResult, tagResult, teamResult] = await Promise.all([
    supabase
      .from("space_booking_participants")
      .select("booking_id, user_id")
      .in("booking_id", bookingIds),
    supabase
      .from("space_booking_audience_tags")
      .select("booking_id, tag_id")
      .in("booking_id", bookingIds),
    supabase
      .from("space_booking_audience_teams")
      .select("booking_id, team_id")
      .in("booking_id", bookingIds),
  ]);

  if (participantsResult.error) throw new Error(participantsResult.error.message);
  if (tagResult.error) throw new Error(tagResult.error.message);
  if (teamResult.error) throw new Error(teamResult.error.message);

  const participantRows = (participantsResult.data ?? []) as ParticipantRow[];
  const tagRows = (tagResult.data ?? []) as AudienceTagRow[];
  const teamRows = (teamResult.data ?? []) as AudienceTeamRow[];

  const profileById = await loadProfilesById(participantRows.map((row) => row.user_id));
  const tagIds = [...new Set(tagRows.map((row) => row.tag_id))];
  const teamIds = [...new Set(teamRows.map((row) => row.team_id))];

  const [tagsResult, teamsResult] = await Promise.all([
    tagIds.length > 0
      ? supabase
          .from("member_tags")
          .select("id, slug, label, color")
          .in("id", tagIds)
      : Promise.resolve({ data: [], error: null }),
    teamIds.length > 0
      ? supabase
          .from("teams")
          .select("id, slug, name")
          .in("id", teamIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (tagsResult.error) throw new Error(tagsResult.error.message);
  if (teamsResult.error) throw new Error(teamsResult.error.message);

  const tagById = new Map(
    ((tagsResult.data ?? []) as Array<{ id: string; slug: string; label: string; color: string }>).map(
      (tag) => [tag.id, tag],
    ),
  );
  const teamById = new Map(
    ((teamsResult.data ?? []) as Array<{ id: string; slug: string; name: string }>).map(
      (team) => [team.id, team],
    ),
  );

  const participantsByBooking = new Map<string, BookingParticipant[]>();
  for (const row of participantRows) {
    const profile = profileById.get(row.user_id);
    if (!profile) continue;
    const current = participantsByBooking.get(row.booking_id) ?? [];
    current.push(profile);
    participantsByBooking.set(row.booking_id, current);
  }

  const tagsByBooking = new Map<string, BookingAudienceTag[]>();
  for (const row of tagRows) {
    const tag = tagById.get(row.tag_id);
    if (!tag) continue;
    const current = tagsByBooking.get(row.booking_id) ?? [];
    current.push(tag);
    tagsByBooking.set(row.booking_id, current);
  }

  const teamsByBooking = new Map<string, BookingAudienceTeam[]>();
  for (const row of teamRows) {
    const team = teamById.get(row.team_id);
    if (!team) continue;
    const current = teamsByBooking.get(row.booking_id) ?? [];
    current.push(team);
    teamsByBooking.set(row.booking_id, current);
  }

  return rows.map((row) =>
    rowToBooking(
      row,
      participantsByBooking.get(row.id) ?? [],
      tagsByBooking.get(row.id) ?? [],
      teamsByBooking.get(row.id) ?? [],
    ),
  );
}

export async function listBookingsInRange(
  fromIso: string,
  toIso: string,
): Promise<SpaceBooking[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("space_bookings")
    .select(
      "id, title, booking_date, start_time, end_time, organizer_id, organizer_name, type, scope, attendees, created_at, updated_at",
    )
    .gte("booking_date", fromIso)
    .lte("booking_date", toIso)
    .order("booking_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) throw new Error(error.message);
  return hydrateBookings((data ?? []) as SpaceBookingRow[]);
}

export async function listPublicBookingsInRange(
  fromIso: string,
  toIso: string,
): Promise<SpaceBooking[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("space_bookings")
    .select(
      "id, title, booking_date, start_time, end_time, organizer_name, type, scope, attendees",
    )
    .gte("booking_date", fromIso)
    .lte("booking_date", toIso)
    .order("booking_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) throw new Error(error.message);
  return ((data ?? []) as PublicSpaceBookingRow[]).map(publicRowToBooking);
}

export async function getBookingById(id: string): Promise<SpaceBooking> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("space_bookings")
    .select(
      "id, title, booking_date, start_time, end_time, organizer_id, organizer_name, type, scope, attendees, created_at, updated_at",
    )
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  const [booking] = await hydrateBookings([data as SpaceBookingRow]);
  if (!booking) throw new Error("Booking not found.");
  return booking;
}

export async function createBooking(input: CreateBookingInput): Promise<SpaceBooking> {
  if (!isCreatableReservationType(input.type)) {
    throw new Error("space_booking_invalid_type");
  }

  if (isSameDayOrPastSpaceBookingDate(input.date, localIsoDateKey(new Date()))) {
    throw new Error(buildSameDaySpaceBookingMessage());
  }

  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("create_space_booking", {
    p_title: input.title,
    p_booking_date: input.date,
    p_start_time: `${input.start}:00`,
    p_end_time: `${input.end}:00`,
    p_organizer_name: input.organizerName,
    p_type: input.type,
    p_scope: input.scope,
    p_attendees: input.attendees,
    p_participant_user_ids: input.participantUserIds,
    p_audience_tag_ids: input.audienceTagIds,
    p_audience_team_ids: input.audienceTeamIds,
  });

  if (error) {
    const conflict = parseSpaceBookingConflict(error);
    if (conflict || error.message.includes("space_booking_time_conflict")) {
      throw new SpaceBookingConflictError(conflict);
    }
    if (error.message.includes("space_booking_same_day_not_allowed")) {
      throw new Error(buildSameDaySpaceBookingMessage());
    }
    throw new Error(error.message);
  }
  if (!data || typeof data !== "string") throw new Error("Booking creation failed.");
  return getBookingById(data);
}

export async function checkSpaceBookingConflict(input: {
  date: string;
  start: string;
  end: string;
}): Promise<SpaceBookingConflict | null> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("find_space_booking_time_conflict", {
    p_booking_date: input.date,
    p_start_time: `${input.start}:00`,
    p_end_time: `${input.end}:00`,
  });

  if (error) {
    if (
      error.message.includes("find_space_booking_time_conflict") ||
      error.message.includes("Could not find the function")
    ) {
      return null;
    }
    throw new Error(error.message);
  }

  const row = Array.isArray(data) ? data[0] : null;
  if (!row) return null;

  return {
    date: row.booking_date,
    start: trimTime(row.start_time),
    end: trimTime(row.end_time),
  };
}

export async function deleteBooking(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("space_bookings").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function searchSpaceBookingMembers(query: string, viewerUserId: string) {
  const supabase = getSupabaseBrowserClient();
  const normalizedQuery = query.trim().toLocaleLowerCase("ko-KR");
  if (normalizedQuery.length === 0) return [] as BookingParticipant[];

  const [profilesResult, accountsResult] = await Promise.all([
    supabase.from("profiles").select(PROFILE_SELECT).limit(300),
    supabase
      .from("member_accounts")
      .select("user_id, status")
      .in("status", ["active", "course_member", "project_only"]),
  ]);

  if (profilesResult.error) throw new Error(profilesResult.error.message);
  if (accountsResult.error) throw new Error(accountsResult.error.message);

  const activeUserIds = new Set(
    ((accountsResult.data ?? []) as AccountRow[]).map((row) => row.user_id),
  );

  return ((profilesResult.data ?? []) as unknown as ProfileRow[])
    .filter((profile) => profile.id !== viewerUserId && activeUserIds.has(profile.id))
    .map(profileToParticipant)
    .filter((profile) => {
      const haystack = [
        profile.displayName,
        profile.fullName,
        profile.email,
        profile.loginId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("ko-KR");
      return haystack.includes(normalizedQuery);
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName, "ko"))
    .slice(0, 12);
}

export async function listSpaceBookingAudienceOptions(
  viewerUserId: string,
): Promise<SpaceBookingAudienceOptions> {
  const supabase = getSupabaseBrowserClient();
  const [tagResult, teamResult] = await Promise.all([
    supabase
      .from("member_tag_assignments")
      .select("tag_id, member_tags(id, slug, label, color, is_club)")
      .eq("user_id", viewerUserId),
    supabase
      .from("team_memberships")
      .select("team_id, teams(id, slug, name)")
      .eq("user_id", viewerUserId)
      .eq("active", true),
  ]);

  if (tagResult.error) throw new Error(tagResult.error.message);
  if (teamResult.error) throw new Error(teamResult.error.message);

  const clubTags = ((tagResult.data ?? []) as TagAssignmentRow[])
    .map((row) => row.member_tags)
    .filter(
      (tag): tag is { id: string; slug: string; label: string; color: string; is_club: boolean } =>
        !!tag &&
        typeof tag.id === "string" &&
        typeof tag.slug === "string" &&
        typeof tag.label === "string" &&
        typeof tag.color === "string" &&
        tag.is_club === true,
    )
    .map((tag) => ({
      id: tag.id,
      slug: tag.slug,
      label: tag.label,
      color: tag.color,
    }));

  const teams = ((teamResult.data ?? []) as TeamMembershipRow[])
    .map((row) => row.teams)
    .filter(
      (team): team is { id: string; slug: string; name: string } =>
        !!team &&
        typeof team.id === "string" &&
        typeof team.slug === "string" &&
        typeof team.name === "string",
    )
    .map((team) => ({ id: team.id, slug: team.slug, name: team.name }));

  return {
    clubTags: [...new Map(clubTags.map((tag) => [tag.id, tag])).values()],
    teams: [...new Map(teams.map((team) => [team.id, team])).values()],
  };
}
