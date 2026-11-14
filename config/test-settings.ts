// The settings that make every run match on every machine.

// The app's ?seed switch. The same seed gives the same prices everywhere.
export const SEED = '42';

// A Monday, 10:00 Dhaka time. The market is open all day, every day now, so
// this is no longer about opening hours: it is the one moment every test
// starts at, which is what makes prices repeat run after run.
export const MARKET_OPEN_TIME = '2026-11-09T10:00:00+06:00';

// The date that time falls on, in Dhaka time. The app names its CSV after it,
// and the profile age rules count from it.
export const MARKET_DAY = '2026-11-09';

// The app's ?market switch, and the only value it understands (js/app-links.js).
export const MARKET_PARAM = 'market';
export const MARKET_CLOSED_VALUE = 'closed';

export const LOCALE = 'en-US';
export const TIME_ZONE = 'Asia/Dhaka';
