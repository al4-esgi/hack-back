export type AwardNormalized = {
  code: 'MICHELIN_STAR' | 'BIB_GOURMAND' | 'SELECTED';
  starsCount: 1 | 2 | 3 | null;
};

export type PriceNormalized = { rawLabel: string; symbol: string; symbolCount: number; currencyCode: string };
export type LocationNormalized = { city: string; country: string };

export const normalizeLabel = (value: string): string => value.trim().replace(/\s+/g, ' ');
export const normalizeKey = (value: string): string => normalizeLabel(value).toLowerCase();

export const splitCommaList = (value: string | null | undefined): string[] => {
  if (!value) return [];
  return [...new Set(value.split(',').map(normalizeLabel).filter(Boolean))];
};

export const normalizeLocation = (locationRaw: string): LocationNormalized => {
  const location = normalizeLabel(locationRaw);
  const idx = location.lastIndexOf(',');
  if (idx < 0) return { city: location, country: 'Unknown' };
  return { city: normalizeLabel(location.slice(0, idx)), country: normalizeLabel(location.slice(idx + 1)) || 'Unknown' };
};

export const normalizeAward = (awardRaw: string): AwardNormalized => {
  const value = normalizeLabel(awardRaw);
  if (value === 'Bib Gourmand') return { code: 'BIB_GOURMAND', starsCount: null };
  if (value === 'Selected Restaurants') return { code: 'SELECTED', starsCount: null };
  if (value === '1 Star') return { code: 'MICHELIN_STAR', starsCount: 1 };
  if (value === '2 Stars') return { code: 'MICHELIN_STAR', starsCount: 2 };
  if (value === '3 Stars') return { code: 'MICHELIN_STAR', starsCount: 3 };
  throw new Error(`Unsupported award value: "${awardRaw}"`);
};

const symbolToCurrencyCode: Record<string, string> = {
  '€': 'EUR',
  '$': 'USD',
  '£': 'GBP',
  '¥': 'JPY',
  '฿': 'THB',
  '₩': 'KRW',
  '₫': 'VND',
  '₺': 'TRY',
  '﷼': 'SAR',
};

export const normalizePrice = (priceRaw: string): PriceNormalized => {
  const rawLabel = normalizeLabel(priceRaw);
  const symbol = [...rawLabel][0];
  if (!symbol) throw new Error('Price value is empty');
  return {
    rawLabel,
    symbol,
    symbolCount: [...rawLabel].length,
    currencyCode: symbolToCurrencyCode[symbol] ?? 'UNKNOWN',
  };
};

