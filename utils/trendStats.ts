export type TrendPoint = { period: string; value: number };

// PH-local ("+08:00") calendar-day keys, computed without relying on the
// server's own timezone, to line up with CONVERT_TZ(...,'+08:00') periods
// returned by SQL queries built with DATE_FORMAT(..., '%Y-%m-%d').
const PH_OFFSET_MS = 8 * 60 * 60 * 1000;

/**
 * Fills in zero-value gaps for a daily count/sum trend so the sparkline
 * always has one point per day, even for days with no rows.
 */
export function buildDailyTrend(
  rows: { period: string; value: number | string }[],
  days: number,
): TrendPoint[] {
  const byDay = new Map<string, number>(
    rows.map((r) => [String(r.period), Number(r.value)]),
  );
  const nowPH = new Date(Date.now() + PH_OFFSET_MS);

  const series: TrendPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(nowPH);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    series.push({ period: key, value: byDay.get(key) ?? 0 });
  }
  return series;
}

/**
 * Same gap-filling as buildDailyTrend, but for a 24-hour (0-23) trend.
 */
export function buildHourlyTrend(
  rows: { period: number | string; value: number | string }[],
): TrendPoint[] {
  const byHour = new Map<number, number>(
    rows.map((r) => [Number(r.period), Number(r.value)]),
  );

  const series: TrendPoint[] = [];
  for (let h = 0; h < 24; h++) {
    series.push({ period: String(h), value: byHour.get(h) ?? 0 });
  }
  return series;
}

export function growthPct(thisPeriod: number, lastPeriod: number): number {
  if (!lastPeriod) return thisPeriod > 0 ? 100 : 0;
  return ((thisPeriod - lastPeriod) / lastPeriod) * 100;
}
