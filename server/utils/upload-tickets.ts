import { randomUUID } from 'node:crypto';
import type { UploadRejectionCode } from '#shared/types';

/**
 * In-memory upload-ticket store + validators for the mock 3-step upload
 * (ticket → PUT bytes → complete), emulating Geins.Media's flow so the Studio
 * client protocol can be built ahead of the real backend.
 *
 * cutover: REMOVE@cutover — the whole ticket mock (this file + the tickets*
 * routes) dies with the mock; the real API serves /media/tickets. Ledger:
 * docs/domains/assets-cutover.md.
 */

export interface TicketFileState {
  clientRef: string;
  assetId: string;
  folderId: string | null;
  name: string;
  mimeType: string;
  sizeBytes: number;
  overwrite: boolean;
  storagePath: string;
  hasBytes: boolean;
  url: string | null;
  thumbUrl: string | null;
}

export interface TicketState {
  ticketId: string;
  expiresAt: number;
  files: Map<string, TicketFileState>;
}

// Dev is a single Nitro process, so a module-level Map is a fine mock store.
const tickets = new Map<string, TicketState>();

export const TICKET_TTL_MS = 60 * 60 * 1000; // 60 minutes (plan C5)
export const MAX_FILE_BYTES = 1024 ** 3; // 1 GB
export const MAX_FILES_PER_TICKET = 50;
export const MAX_TICKET_BYTES = 10 * 1024 ** 3; // 10 GB

const ALLOWED_EXT = new Set([
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'svg',
  'pdf',
  'mp4',
  'webm',
  'mov',
  'mp3',
  'wav',
  'doc',
  'docx',
  'txt',
  'csv',
]);

/** Extension (lowercased, no dot) of a name/path. */
export function extensionOf(name: string): string {
  return name.toLowerCase().split('.').pop() ?? '';
}

/**
 * Reject-only validation of one ticket file claim (name/size/type). Returns a
 * rejection or `null` when the claim is structurally valid. The DB-dependent
 * `PATH_ALREADY_EXISTS` check lives in the route (it needs a query).
 */
export function validateUploadClaim(file: {
  name: string;
  sizeBytes: number;
  folderId?: string | null;
}): { code: UploadRejectionCode; message: string } | null {
  const name = file.name?.trim() ?? '';
  if (!name || name.startsWith('/') || name.endsWith('/'))
    return { code: 'PATH_INVALID', message: 'Missing or invalid file name.' };
  // With a folder chosen, name must be a bare file name (no path segments).
  if (file.folderId && name.includes('/'))
    return {
      code: 'PATH_INVALID',
      message: 'A file name cannot contain slashes when a folder is set.',
    };
  if (name.split('/').some((seg) => seg === '.' || seg === '..' || !seg))
    return { code: 'PATH_INVALID', message: 'Invalid path segment.' };
  if (file.sizeBytes > MAX_FILE_BYTES)
    return { code: 'FILE_TOO_LARGE', message: 'File exceeds the 1 GB limit.' };
  if (!ALLOWED_EXT.has(extensionOf(name)))
    return {
      code: 'FILE_TYPE_NOT_ALLOWED',
      message: 'This file type is not allowed.',
    };
  return null;
}

export function createTicket(): TicketState {
  const ticket: TicketState = {
    ticketId: randomUUID(),
    expiresAt: Date.now() + TICKET_TTL_MS,
    files: new Map(),
  };
  tickets.set(ticket.ticketId, ticket);
  return ticket;
}

/** Fetch a live ticket; expired ones are dropped and treated as missing. */
export function getTicket(id: string): TicketState | undefined {
  const ticket = tickets.get(id);
  if (ticket && ticket.expiresAt < Date.now()) {
    tickets.delete(id);
    return undefined;
  }
  return ticket;
}

export function dropTicket(id: string): void {
  tickets.delete(id);
}
