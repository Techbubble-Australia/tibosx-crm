export type DecimalLike = { toString(): string } | number;

export function toNumber(value: DecimalLike): number {
  return typeof value === "number" ? value : Number(value.toString());
}

export function toNumberOrNull(value: DecimalLike | null | undefined): number | null {
  if (value == null) return null;
  return toNumber(value);
}
