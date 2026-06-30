const STORAGE_KEY = "nusq-streak";

export interface StreakData {
  count: number;
  lastReadDate: string; // YYYY-MM-DD
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function nextWeekday(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  do {
    d.setUTCDate(d.getUTCDate() + 1);
  } while (d.getUTCDay() === 0 || d.getUTCDay() === 6);
  return toDateStr(d);
}

function todayStr(): string {
  return toDateStr(new Date());
}

export function getStreak(): StreakData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StreakData;
  } catch {
    return null;
  }
}

/**
 * Records today as a read day and returns the updated streak.
 * Returns { data, isNew } where isNew = true if the streak count changed.
 */
export function recordRead(): { data: StreakData; isNew: boolean } {
  const today = todayStr();
  const existing = getStreak();

  let data: StreakData;
  let isNew = false;

  if (!existing) {
    // First ever read
    data = { count: 1, lastReadDate: today };
    isNew = true;
  } else if (existing.lastReadDate === today) {
    // Already read today — no change
    data = existing;
    isNew = false;
  } else if (nextWeekday(existing.lastReadDate) === today) {
    // Next consecutive weekday — increment streak
    data = { count: existing.count + 1, lastReadDate: today };
    isNew = true;
  } else {
    // Gap — reset streak
    data = { count: 1, lastReadDate: today };
    isNew = true;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // storage unavailable
  }

  return { data, isNew };
}

export function streakMessage(count: number): string {
  if (count === 1) return "You're on a roll.";
  if (count === 3) return "3 days in — building the habit.";
  if (count === 5) return "5-day streak.";
  if (count === 7) return "One full week. 🏆";
  if (count === 14) return "Two weeks straight.";
  if (count === 30) return "30 days. You're a regular.";
  if (count % 10 === 0) return `${count} days and counting.`;
  return `Day ${count}.`;
}
