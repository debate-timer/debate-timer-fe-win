interface SuccessResult<T> {
  success: true;
  data: T;
}

interface FailureResult {
  success: false;
  error: Error;
}

export type Result<T> = SuccessResult<T> | FailureResult;
