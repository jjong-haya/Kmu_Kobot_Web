export type SpaceBookingTimeSlot = {
  id?: string | null;
  date: string;
  start: string;
  end: string;
  title?: string | null;
};

export type SpaceBookingConflict = {
  date: string;
  start: string;
  end: string;
  title?: string | null;
};

function normalizeTime(value: string) {
  return value.slice(0, 5);
}

function timeToMinutes(value: string) {
  const [hour, minute] = normalizeTime(value).split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
}

export function isInvalidSpaceBookingRange(start: string, end: string) {
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  return startMinutes === null || endMinutes === null || endMinutes <= startMinutes;
}

export function isSameDayOrPastSpaceBookingDate(date: string, todayKey: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && date <= todayKey;
}

export function buildSameDaySpaceBookingMessage() {
  return "당일 예약은 불가합니다. 다음 날부터 예약해 주세요.";
}

export function findSpaceBookingConflict(
  candidate: SpaceBookingTimeSlot,
  bookings: SpaceBookingTimeSlot[],
): SpaceBookingConflict | null {
  if (isInvalidSpaceBookingRange(candidate.start, candidate.end)) return null;

  const startMinutes = timeToMinutes(candidate.start);
  const endMinutes = timeToMinutes(candidate.end);
  if (startMinutes === null || endMinutes === null) return null;

  const conflict = bookings
    .filter((booking) => booking.date === candidate.date && booking.id !== candidate.id)
    .map((booking) => ({
      booking,
      startMinutes: timeToMinutes(booking.start),
      endMinutes: timeToMinutes(booking.end),
    }))
    .filter(
      (slot): slot is {
        booking: SpaceBookingTimeSlot;
        startMinutes: number;
        endMinutes: number;
      } => slot.startMinutes !== null && slot.endMinutes !== null,
    )
    .filter((slot) => slot.startMinutes < endMinutes && slot.endMinutes > startMinutes)
    .sort((a, b) => a.startMinutes - b.startMinutes)[0]?.booking;

  if (!conflict) return null;

  return {
    date: conflict.date,
    start: normalizeTime(conflict.start),
    end: normalizeTime(conflict.end),
    title: conflict.title ?? null,
  };
}

export function buildSpaceBookingConflictMessage(conflict: SpaceBookingConflict) {
  const title = conflict.title ? ` '${conflict.title}'` : "";
  return `이미 ${conflict.start}~${conflict.end}${title} 예약과 겹칩니다. 시작하려면 ${conflict.end} 이후부터 가능하고, 그 예약 전에 쓰려면 종료 시간을 ${conflict.start}까지 앞당겨 주세요.`;
}
