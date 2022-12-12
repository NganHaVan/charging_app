export class StatusError extends Error {
  status: number;
  constructor(status?: number) {
    super();
    this.status = status || 500;
  }
}

export const createError = (status: number, message: string) => {
  const error = new StatusError();
  error.status = status;
  error.message = message;
  return error;
};
