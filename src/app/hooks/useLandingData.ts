import { useEffect, useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "../auth/supabase";

export type LandingNoticeRow = {
  id: string;
  title: string;
  body: string | null;
  created_at: string;
};

export type LandingBookingRow = {
  id: string;
  title: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  type: string;
};

export type LandingStats = {
  activeMembers: number;
  totalProjects: number;
  cumulativeAlumni: number;
};

export type LandingData = {
  notices: LandingNoticeRow[];
  upcomingBookings: LandingBookingRow[];
  stats: LandingStats;
  loading: boolean;
};

const EMPTY: LandingData = {
  notices: [],
  upcomingBookings: [],
  stats: { activeMembers: 0, totalProjects: 0, cumulativeAlumni: 0 },
  loading: true,
};

/**
 * Fetches public-readable landing page data from Supabase.
 * Falls back to zero counts / empty arrays on any error so the landing
 * never crashes — pages handle empty states.
 */
export function useLandingData(): LandingData {
  const [data, setData] = useState<LandingData>(EMPTY);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setData({ ...EMPTY, loading: false });
      return;
    }
    let cancelled = false;
    (async () => {
      const supabase = getSupabaseBrowserClient();

      // Recent published notices (5)
      const noticesP = supabase
        .from("notices")
        .select("id, title, body, created_at")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(5);

      // Upcoming bookings within next 14 days
      const todayIso = new Date().toISOString().slice(0, 10);
      const in14 = new Date(Date.now() + 14 * 86400 * 1000)
        .toISOString()
        .slice(0, 10);
      const bookingsP = supabase
        .from("space_bookings")
        .select("id, title, booking_date, start_time, end_time, type")
        .gte("booking_date", todayIso)
        .lte("booking_date", in14)
        .order("booking_date", { ascending: true })
        .order("start_time", { ascending: true })
        .limit(5);

      // Active member count
      const membersP = supabase
        .from("member_accounts")
        .select("user_id", { count: "exact", head: true })
        .eq("status", "active");

      // Alumni count
      const alumniP = supabase
        .from("member_accounts")
        .select("user_id", { count: "exact", head: true })
        .eq("status", "alumni");

      // Project teams (active only)
      const projectsP = supabase
        .from("project_teams")
        .select("id", { count: "exact", head: true })
        .neq("status", "archived");

      const [
        noticesR,
        bookingsR,
        membersR,
        alumniR,
        projectsR,
      ] = await Promise.allSettled([noticesP, bookingsP, membersP, alumniP, projectsP]);

      if (cancelled) return;

      const notices =
        noticesR.status === "fulfilled" && !noticesR.value.error
          ? (noticesR.value.data as LandingNoticeRow[]) ?? []
          : [];

      const upcomingBookings =
        bookingsR.status === "fulfilled" && !bookingsR.value.error
          ? (bookingsR.value.data as LandingBookingRow[]) ?? []
          : [];

      const activeMembers =
        membersR.status === "fulfilled" && !membersR.value.error
          ? membersR.value.count ?? 0
          : 0;

      const cumulativeAlumni =
        alumniR.status === "fulfilled" && !alumniR.value.error
          ? alumniR.value.count ?? 0
          : 0;

      const totalProjects =
        projectsR.status === "fulfilled" && !projectsR.value.error
          ? projectsR.value.count ?? 0
          : 0;

      setData({
        notices,
        upcomingBookings,
        stats: { activeMembers, totalProjects, cumulativeAlumni },
        loading: false,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return data;
}

/** Helper: human-readable relative time, e.g. "2시간 전" / "어제" / "5/04" */
export function formatRelativeTime(iso: string): string {
  try {
    const then = new Date(iso).getTime();
    const now = Date.now();
    const diff = now - then;
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    if (diff < 5 * minute) return "방금 전";
    if (diff < hour) return `${Math.floor(diff / minute)}분 전`;
    if (diff < day) return `${Math.floor(diff / hour)}시간 전`;
    if (diff < 2 * day) return "어제";
    if (diff < 7 * day) return `${Math.floor(diff / day)}일 전`;
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${String(d.getDate()).padStart(2, "0")}`;
  } catch {
    return "";
  }
}

/** Helper: HH:MM extraction */
export function trimTime(t: string): string {
  return t.slice(0, 5);
}

/** Helper: M/D format from YYYY-MM-DD */
export function formatShortDate(iso: string): string {
  try {
    const [, m, d] = iso.split("-");
    return `${parseInt(m, 10)}/${parseInt(d, 10)}`;
  } catch {
    return "";
  }
}
