export const adValidityMs = 72 * 60 * 60 * 1000;

export const adExpiry = (createdAt: Date | string) =>
  new Date(new Date(createdAt).getTime() + adValidityMs);

export const adExpired = (createdAt: Date | string, now = Date.now()) =>
  adExpiry(createdAt).getTime() <= now;
