/**
 * dateService.js
 * Timezone: Asia/Kolkata (IST)
 * Resolves relative date phrases:
 * - "today"
 * - "tomorrow"
 * - bare weekdays ("Monday", "Tuesday", ..., "Sunday") -> next occurrence strictly after today (+1 to +7 days)
 * - "next <weekday>" -> either next occurrence or strict next week occurrence. Standard business logic: next occurrence of that weekday. If today is Wed and request says "next Friday", Friday this week (+2) or next week (+9)? Typically bare "Friday" is strictly next (+2). If "next Friday", strictly next week (+7 days from bare). Let's support both properly!
 * - "in N days" / "in N day"
 */

const WEEKDAYS = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Format a Date object in IST (Asia/Kolkata)
 */
function getIstDateParts(date = new Date()) {
  // Format to Asia/Kolkata parts
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short'
  });
  const parts = formatter.formatToParts(date);
  const map = {};
  for (const p of parts) {
    map[p.type] = p.value;
  }
  return {
    year: parseInt(map.year, 10),
    month: parseInt(map.month, 10) - 1, // 0-indexed
    day: parseInt(map.day, 10)
  };
}

/**
 * Creates a UTC Date representing midnight on year-month-day for safe arithmetic
 */
function createCalendarDate(year, month, day) {
  return new Date(Date.UTC(year, month, day, 12, 0, 0));
}

function formatIso(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatFriendly(d) {
  const weekday = DAY_NAMES[d.getUTCDay()];
  const day = d.getUTCDate();
  const month = MONTH_NAMES[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  return `${weekday}, ${day} ${month} ${year}`;
}

/**
 * Resolve a relative date phrase.
 * @param {string} phrase - e.g., "Friday", "tomorrow", "next Monday", "in 3 days"
 * @param {Date|string} [baseDate] - base date for testing (defaults to now)
 * @returns {{ iso: string, friendly: string, phrase: string }}
 */
export function resolveDate(phrase, baseDate = new Date()) {
  if (!phrase || typeof phrase !== 'string') {
    throw new Error('Date phrase is required');
  }

  const rawPhrase = phrase.trim();
  const clean = rawPhrase.toLowerCase().replace(/^(on|by|for)\s+/i, '').trim();

  const base = typeof baseDate === 'string' ? new Date(baseDate) : baseDate;
  const istBase = getIstDateParts(base);
  const currentCal = createCalendarDate(istBase.year, istBase.month, istBase.day);
  const currentWeekday = currentCal.getUTCDay(); // 0 = Sun, 1 = Mon ...

  let targetCal = null;

  if (clean === 'today') {
    targetCal = new Date(currentCal);
  } else if (clean === 'tomorrow') {
    targetCal = new Date(currentCal);
    targetCal.setUTCDate(targetCal.getUTCDate() + 1);
  } else {
    // Check "in N days"
    const inDaysMatch = clean.match(/^in\s+(\d+)\s+days?$/);
    if (inDaysMatch) {
      const days = parseInt(inDaysMatch[1], 10);
      targetCal = new Date(currentCal);
      targetCal.setUTCDate(targetCal.getUTCDate() + days);
    } else {
      // Check "next <weekday>" or bare "<weekday>"
      const nextWeekdayMatch = clean.match(/^next\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/);
      const bareWeekdayMatch = clean.match(/^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/);

      if (bareWeekdayMatch) {
        const targetDay = WEEKDAYS[bareWeekdayMatch[1]];
        // Bare weekday resolves to the next occurrence strictly after today (1 to 7 days).
        // If today is that weekday, use the same weekday one week later (+7).
        let diff = targetDay - currentWeekday;
        if (diff <= 0) {
          diff += 7;
        }
        targetCal = new Date(currentCal);
        targetCal.setUTCDate(targetCal.getUTCDate() + diff);
      } else if (nextWeekdayMatch) {
        const targetDay = WEEKDAYS[nextWeekdayMatch[1]];
        // "next Friday" when today is Wednesday: strictly next occurrence + 7 or next occurrence?
        // In business phrasing, "next Friday" typically means either the coming Friday or the week after.
        // If diff <= 0, diff += 7. If "next <weekday>", ensure it is strictly at least 7 days out if requested,
        // or next week. A standard implementation: diff = targetDay - currentWeekday; if (diff <= 0) diff += 7; diff += 7 if diff < 7.
        let diff = targetDay - currentWeekday;
        if (diff <= 0) {
          diff += 7;
        }
        // If it's earlier in the week, some people mean next week's Friday. Let's make sure it's strictly in the following week (diff + 7 if diff < 5).
        // But if someone says "Friday", it's diff. If they explicitly say "next Friday", diff = diff + 7.
        targetCal = new Date(currentCal);
        targetCal.setUTCDate(targetCal.getUTCDate() + diff + 7);
      }
    }
  }

  if (!targetCal || isNaN(targetCal.getTime())) {
    throw new Error(`Unable to resolve date phrase: "${rawPhrase}". Date phrase must be a recognized relative format (e.g. "today", "tomorrow", "Friday", "in 3 days").`);
  }

  return {
    iso: formatIso(targetCal),
    friendly: formatFriendly(targetCal),
    phrase: rawPhrase
  };
}

export function getCurrentIstTime() {
  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'long'
  });
  return {
    timeZone: 'Asia/Kolkata',
    formatted: formatter.format(new Date()),
    iso: new Date().toISOString()
  };
}
