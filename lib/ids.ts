import { nanoid } from "nanoid";

// 21-char URL-safe IDs for client-facing links. Never expose internal uuids.
export function generatePublicId(prefix: string): string {
  return `${prefix}_${nanoid(21)}`;
}
