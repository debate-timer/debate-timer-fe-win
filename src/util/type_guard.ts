import { UUID } from 'crypto';

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

export function isUUID(value: unknown): value is UUID {
  if (typeof value !== 'string') {
    return false;
  }
  return UUID_REGEX.test(value);
}
