export function formatSum(amount: number): string {
  return `${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} so'm`;
}

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function generateUniqueCode(existingCodes: Set<string>): string {
  for (let attempt = 0; attempt < 1000; attempt++) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    if (!existingCodes.has(code)) {
      return code;
    }
  }
  return String(Date.now()).slice(-6);
}

/**
 * Parses start time (HH:MM) from a slot name like "12:00–12:15" or "12:00-12:15"
 * and checks whether `now` is at least 60 minutes before that start time today.
 */
export function checkCancelEligibility(
  oraliqNomi: string,
  now: Date
): { allowed: boolean; minutesLeft: number; message: string } {
  const match = oraliqNomi.match(/^(\d{1,2}):(\d{2})/);
  if (!match) {
    return {
      allowed: false,
      minutesLeft: 0,
      message: "Vaqt oralig'i noto'g'ri formatda",
    };
  }

  const startHour = Number(match[1]);
  const startMinute = Number(match[2]);

  const slotStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    startHour,
    startMinute,
    0,
    0
  );

  const diffMs = slotStart.getTime() - now.getTime();
  const minutesLeft = Math.floor(diffMs / 60000);

  if (minutesLeft < 60) {
    return {
      allowed: false,
      minutesLeft,
      message: "Bekor qilish vaqti o'tgan (olib ketishdan kamida 1 soat oldin mumkin)",
    };
  }

  return {
    allowed: true,
    minutesLeft,
    message: `Bekor qilish mumkin (${minutesLeft} daqiqa qoldi)`,
  };
}

export function formatTimeShort(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleTimeString('uz-UZ', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
