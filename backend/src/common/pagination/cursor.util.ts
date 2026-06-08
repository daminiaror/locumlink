import type { PaginatedResult, PaginationParams } from './pagination.types.js';

const MAX_LIMIT = 100;

export function encodeCursor(id: string): string {
  return Buffer.from(id, 'utf8').toString('base64');
}

export function decodeCursor(cursor: string): string {
  try {
    return Buffer.from(cursor, 'base64').toString('utf8');
  } catch {
    throw new Error('Invalid cursor');
  }
}

export function buildCursorQuery(
  cursor?: string,
  direction: 'asc' | 'desc' = 'asc',
): { id?: { gt: string } | { lt: string } } {
  if (!cursor) return {};
  const id = decodeCursor(cursor);
  if (direction === 'asc') {
    return { id: { gt: id } };
  }
  return { id: { lt: id } };
}

export function parsePaginationParams(
  query: Record<string, unknown>,
  defaultLimit = 20,
): PaginationParams {
  const limitRaw = query.limit ?? query.pageSize;
  let limit = defaultLimit;
  if (limitRaw != null) {
    const parsed = Number(limitRaw);
    if (Number.isFinite(parsed) && parsed > 0) {
      limit = Math.min(Math.floor(parsed), MAX_LIMIT);
    }
  }

  const cursor =
    typeof query.cursor === 'string' && query.cursor.trim()
      ? query.cursor.trim()
      : undefined;

  const direction = query.direction === 'desc' ? 'desc' : 'asc';

  return { cursor, limit, direction };
}

export function toPaginatedResult<T extends { id: string }>(
  rows: T[],
  limit: number,
): PaginatedResult<T> {
  const hasNextPage = rows.length > limit;
  const items = hasNextPage ? rows.slice(0, limit) : rows;
  const nextCursor =
    hasNextPage && items.length > 0
      ? encodeCursor(items[items.length - 1].id)
      : null;
  return { items, nextCursor, hasNextPage };
}
