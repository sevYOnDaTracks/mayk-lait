import { createHash } from 'node:crypto';

export function isDeliverablePostalCode(value: string): boolean {
  return /^(75|77|78|91|92|93|94|95)[0-9]{3}$/.test(value.trim());
}

export function orderIdForRequest(uid: string, requestId: string): string {
  return createHash('sha256').update(`${uid}:${requestId}`).digest('hex');
}
