import type { ApplicationStatus, Prisma } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service.js';
import { buildCursorQuery, toPaginatedResult } from './cursor.util.js';
import type { PaginatedResult, PaginationParams } from './pagination.types.js';

export type ApplicationPaginateFilters = {
  jobPostingId?: string;
  locumProfileId?: string;
  status?: ApplicationStatus;
};

export async function paginateApplications<T extends Prisma.ApplicationFindManyArgs>(
  prisma: PrismaService,
  filters: ApplicationPaginateFilters,
  pagination: PaginationParams,
  args?: Omit<Prisma.ApplicationFindManyArgs, 'where' | 'orderBy' | 'take'>,
): Promise<PaginatedResult<Prisma.ApplicationGetPayload<{ select?: T['select']; include?: T['include'] }>>> {
  const { cursor, limit, direction } = pagination;
  const where: Prisma.ApplicationWhereInput = {
    ...(filters.jobPostingId ? { jobPostingId: filters.jobPostingId } : {}),
    ...(filters.locumProfileId ? { locumProfileId: filters.locumProfileId } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...buildCursorQuery(cursor, direction),
  };

  const rows = await prisma.application.findMany({
    ...args,
    where,
    orderBy: { id: direction },
    take: limit + 1,
  });

  return toPaginatedResult(rows, limit);
}
