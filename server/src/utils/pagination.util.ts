export interface PaginationParams {
  page?: number | string;
  limit?: number | string;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * Standard pagination parser and metadata builder
 */
export function getPaginationOptions(
  params?: PaginationParams,
  defaultLimit = 10,
  maxLimit = 100,
) {
  const page = Math.max(1, parseInt(String(params?.page || 1), 10) || 1);
  const requestedLimit =
    parseInt(String(params?.limit || defaultLimit), 10) || defaultLimit;
  const limit = Math.min(Math.max(1, requestedLimit), maxLimit);
  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
  };
}

export function buildPaginatedResult<T>(
  items: T[],
  totalCount: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  const totalPages = Math.ceil(totalCount / limit) || 1;

  return {
    items,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}
