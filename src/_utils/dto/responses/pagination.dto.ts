import { PaginatedQueryDto } from "../requests/paginated-query.dto";
import { PaginationMetaDto } from "./pagination-meta.dto";

export { PaginationMetaDto } from "./pagination-meta.dto";

export class PaginationDto {
  meta: PaginationMetaDto;

  constructor(paginatedQuery: PaginatedQueryDto, totalItemsCount: number) {
    this.meta = {
      currentPage: paginatedQuery.page,
      totalItemsCount,
      totalPagesCount:
        totalItemsCount === 0
          ? 0
          : Math.ceil(totalItemsCount / paginatedQuery.limit),
      itemsPerPage: paginatedQuery.limit,
    };
  }
}
