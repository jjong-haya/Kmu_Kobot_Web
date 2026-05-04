import { getSupabaseBrowserClient } from "../auth/supabase";

export type ReservationType = "meeting" | "study" | "personal";
export type ReservationScope = "exclusive" | "desk" | "open";

export type SpaceBookingRow = {
  id: string;
  title: string;
  booking_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM:SS
  end_time: string;
  organizer_id: string;
  organizer_name: string;
  type: ReservationType;
  scope: ReservationScope;
  attendees: number;
  created_at: string;
  updated_at: string;
};

export type SpaceBooking = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:MM
  end: string;
  organizer: string;
  organizerId: string;
  type: ReservationType;
  scope: ReservationScope;
  attendees: number;
};

function trimTime(t: string): string {
  // "19:00:00" -> "19:00"
  return t.slice(0, 5);
}

function rowToBooking(row: SpaceBookingRow): SpaceBooking {
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
  };
}

/** Fetch all bookings between two ISO dates (inclusive). */
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
  return (data ?? []).map(rowToBooking);
}

export type CreateBookingInput = {
  title: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:MM
  end: string;
  organizerId: string;
  organizerName: string;
  type: ReservationType;
  scope: ReservationScope;
  attendees: number;
};

export async function createBooking(
  input: CreateBookingInput,
): Promise<SpaceBooking> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("space_bookings")
    .insert({
      title: input.title,
      booking_date: input.date,
      start_time: `${input.start}:00`,
      end_time: `${input.end}:00`,
      organizer_id: input.organizerId,
      organizer_name: input.organizerName,
      type: input.type,
      scope: input.scope,
      attendees: input.attendees,
    })
    .select(
      "id, title, booking_date, start_time, end_time, organizer_id, organizer_name, type, scope, attendees, created_at, updated_at",
    )
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("저장에 실패했습니다.");
  return rowToBooking(data);
}

export async function deleteBooking(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from("space_bookings").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
