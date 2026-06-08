import type { PostingStatus, Prisma } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service.js';
import { buildCursorQuery, toPaginatedResult } from './cursor.util.js';
import type { PaginatedResult, PaginationParams } from './pagination.types.js';

export type JobPostingPaginateFilters = {
  status?: PostingStatus;
  hostProfileId?: string;
  isDeleted?: boolean;
};

export async function paginateJobPostings(
  prisma: PrismaService,
  filters: JobPostingPaginateFilters,
  pagination: PaginationParams,
  include?: Prisma.JobPostingInclude,
): Promise<PaginatedResult<Prisma.JobPostingGetPayload<{ include: Prisma.JobPostingInclude }>>> {
  const { cursor, limit, direction } = pagination;
  const where: Prisma.JobPostingWhereInput = {
    ...(filters.hostProfileId ? { hostProfileId: filters.hostProfileId } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.isDeleted !== undefined ? { isDeleted: filters.isDeleted } : {}),
    ...buildCursorQuery(cursor, direction),
  };

  const rows = await prisma.jobPosting.findMany({
    where,
    orderBy: { id: direction },
    take: limit + 1,
    include,
  });

  return toPaginatedResult(rows, limit);
}
