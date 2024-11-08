export class AppError extends Error {
    public statusCode: number;
  
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  export const createValidationError = (message: string): AppError => {
    return new AppError(message, 400);
  };
  
  export const createNotFoundError = (message: string): AppError => {
    return new AppError(message, 404);
  };