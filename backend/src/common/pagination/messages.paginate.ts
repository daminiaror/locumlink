import type { Prisma } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service.js';
import { buildCursorQuery, toPaginatedResult } from './cursor.util.js';
import type { PaginatedResult, PaginationParams } from './pagination.types.js';

export type MessageThreadFilters = {
  senderId: string;
  recipientId: string;
};

export async function paginateMessages(
  prisma: PrismaService,
  filters: MessageThreadFilters,
  pagination: PaginationParams,
  include?: Prisma.MessageInclude,
): Promise<PaginatedResult<Prisma.MessageGetPayload<{ include: Prisma.MessageInclude }>>> {
  const { cursor, limit, direction } = pagination;
  const where: Prisma.MessageWhereInput = {
    OR: [
      { senderId: filters.senderId, recipientId: filters.recipientId },
      { senderId: filters.recipientId, recipientId: filters.senderId },
    ],
    deletedAt: null,
    ...buildCursorQuery(cursor, direction),
  };

  const rows = await prisma.message.findMany({
    where,
    orderBy: { id: direction },
    take: limit + 1,
    include,
  });

  return toPaginatedResult(rows, limit);
}
