/** Compare typed fractions/decimals without floating-point rounding or tolerance. */
export function rational(raw: string, asPercent = false) {
  let value = raw.trim().replace(/,/g, '');
  if (!value || value.length > 80) return null;
  const percent = value.endsWith('%');
  if (percent) value = value.slice(0, -1).trim();
  const mixed = value.match(/^(-?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  const fraction = value.match(/^(-?\d+)\s*\/\s*(\d+)$/);
  let n: bigint;
  let d: bigint;
  if (mixed) {
    d = BigInt(mixed[3]);
    const whole = BigInt(mixed[1]);
    n = whole * d + (mixed[1].startsWith('-') ? -1n : 1n) * BigInt(mixed[2]);
  } else if (fraction) {
    n = BigInt(fraction[1]);
    d = BigInt(fraction[2]);
  } else if (/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value)) {
    const negative = value.startsWith('-');
    const [whole, decimals = ''] = value.replace(/^-/, '').split('.');
    d = 10n ** BigInt(decimals.length);
    n =
      (BigInt(whole || '0') * d + BigInt(decimals || '0')) *
      (negative ? -1n : 1n);
  } else return null;
  if (!d) return null;
  if (percent || asPercent) d *= 100n;
  return { n, d };
}

export function answersMatch(raw: string, expected: string) {
  const typed = rational(
    raw,
    expected.trim().endsWith('%') && !raw.trim().endsWith('%'),
  );
  const target = rational(expected);
  return !!typed && !!target && typed.n * target.d === target.n * typed.d;
}

export function decimalSlip(raw: string, expected: string) {
  const typed = rational(raw, expected.endsWith('%') && !raw.endsWith('%'));
  const target = rational(expected);
  if (!typed || !target || !typed.n || !target.n) return false;
  return [10n, 100n, 1000n].some(
    (scale) =>
      typed.n * target.d * scale === target.n * typed.d ||
      typed.n * target.d === target.n * typed.d * scale,
  );
}

export function questionsPerMinute(answered: number, elapsedMs: number) {
  return elapsedMs > 0 ? (answered * 60_000) / elapsedMs : 0;
}
