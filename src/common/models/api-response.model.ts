export class ApiResponse<T> {
  public readonly data: T;
  public readonly timestamp: string;

  private constructor(data: T, timestamp: string) {
    this.data = data;
    this.timestamp = timestamp;
  }

  public static success<T>(data: T): ApiResponse<T> {
    return new ApiResponse(data, new Date().toISOString());
  }
}
