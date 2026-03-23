export class ApiError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly data: unknown = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
