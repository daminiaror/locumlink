import type { Prisma } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service.js';
import { buildCursorQuery, toPaginatedResult } from './cursor.util.js';
import type { PaginatedResult, PaginationParams } from './pagination.types.js';

export type NotificationEventPaginateFilters = {
  recipientId: string;
  unreadOnly?: boolean;
};

export async function paginateNotificationEvents(
  prisma: PrismaService,
  filters: NotificationEventPaginateFilters,
  pagination: PaginationParams,
): Promise<PaginatedResult<Prisma.NotificationEventGetPayload<object>>> {
  const { cursor, limit, direction } = pagination;
  const where: Prisma.NotificationEventWhereInput = {
    recipientId: filters.recipientId,
    ...(filters.unreadOnly ? { deliveryStatus: { not: 'READ' } } : {}),
    ...buildCursorQuery(cursor, direction),
  };

  const rows = await prisma.notificationEvent.findMany({
    where,
    orderBy: { id: direction },
    take: limit + 1,
  });

  return toPaginatedResult(rows, limit);
}
