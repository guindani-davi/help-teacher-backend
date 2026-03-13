export class ApiErrorResponse {
  public readonly error: string;
  public readonly message: string;
  public readonly details?: string[];
  public readonly timestamp: string;

  private constructor(
    error: string,
    message: string,
    timestamp: string,
    details?: string[],
  ) {
    this.error = error;
    this.message = message;
    this.timestamp = timestamp;
    this.details = details;
  }

  public static create(
    error: string,
    message: string,
    details?: string[],
  ): ApiErrorResponse {
    return new ApiErrorResponse(
      error,
      message,
      new Date().toISOString(),
      details,
    );
  }
}
