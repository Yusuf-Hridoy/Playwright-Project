// The 8 made-up companies, copied from ../Practice-App/data/stocks.json.
// Prices are not copied: they move with the seed and the clock, so a test
// reads them from the page's data-cents attributes instead.

export interface Stock {
  readonly symbol: string;
  readonly name: string;
}

export const STOCKS: readonly Stock[] = Object.freeze([
  { symbol: 'NOVA', name: 'Nova Energy' },
  { symbol: 'KRYL', name: 'Kryl Robotics' },
  { symbol: 'BRISK', name: 'Brisk Foods' },
  { symbol: 'LUMA', name: 'Luma Health' },
  { symbol: 'OAKFIN', name: 'Oak Finance' },
  { symbol: 'PIXEL', name: 'Pixel Games' },
  { symbol: 'TERRA', name: 'Terra Farms' },
  { symbol: 'VELO', name: 'Velo Bikes' },
]);

export const STOCK_COUNT = STOCKS.length;

export const SYMBOLS: readonly string[] = Object.freeze(STOCKS.map((stock) => stock.symbol));

export function stockName(symbol: string): string {
  const found = STOCKS.find((stock) => stock.symbol === symbol);
  if (!found) throw new Error(`There is no stock called ${symbol} in data/stocks.ts.`);
  return found.name;
}
