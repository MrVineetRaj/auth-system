import type { Request, Response, NextFunction } from 'express';

export class ApiResponse<T> {
  status: number;
  message: string;
  data?: T;
  error?: {
    [key: string]: string;
  };
  success: boolean;
  timestamp: string;

  constructor(
    status: number,
    message: string,
    data?: T,
    error?: {
      [key: string]: string;
    }
  ) {
    this.status = status;
    this.message = message;
    if (data && typeof data === 'object') {
      this.data = data;
    }

    if (error) {
      this.error = error;
    }

    this.success = status >= 200 && status < 300;
    this.timestamp = new Date().toLocaleString();
  }
}

export const AsyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
