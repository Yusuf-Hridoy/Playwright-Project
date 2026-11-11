// The settings that make every run match on every machine.

// The app's ?seed switch. The same seed gives the same prices everywhere.
export const SEED = '42';

// A Monday, 10:00 Dhaka time. The market is open 9:00 to 17:00, Monday to Friday.
export const MARKET_OPEN_TIME = '2026-11-09T10:00:00+06:00';

// The same Monday, 18:00 Dhaka time. After the close.
export const MARKET_CLOSED_TIME = '2026-11-09T18:00:00+06:00';

// The date both times fall on, in Dhaka time. The app names its CSV after it.
export const MARKET_DAY = '2026-11-09';

export const LOCALE = 'en-US';
export const TIME_ZONE = 'Asia/Dhaka';
