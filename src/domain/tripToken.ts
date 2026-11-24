export const isTripToken = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
