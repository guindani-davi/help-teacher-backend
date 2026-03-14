export class PaginatedResponse<T> {
  public readonly items: T[];
  public readonly total: number;
  public readonly page: number;
  public readonly limit: number;
  public readonly totalPages: number;

  public constructor(items: T[], total: number, page: number, limit: number) {
    this.items = items;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit);
  }
}
