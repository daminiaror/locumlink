export type PaginatedResult<T> = {
  items: T[];
  nextCursor: string | null;
  hasNextPage: boolean;
  total?: number;
};

export type PaginationParams = {
  cursor?: string;
  limit: number;
  direction: 'asc' | 'desc';
};
