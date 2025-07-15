import { useCallback, useState } from 'react';
import { Result } from './Result';

export default function useAsyncRequest<T, Args extends unknown[]>(
  request: (...args: Args) => Promise<T>,
  timeout: number = 5000,
) {
  // Declare states here
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Function that executes actual request
  const execute = useCallback(
    async (...args: Args): Promise<Result<T>> => {
      // Init
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Clear values on states from last request
      setIsLoading(true);
      setError(null);
      setData(null);

      const requestPromise = request(...args);
      const abortPromise = new Promise((_, reject) => {
        controller.signal.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        });
      });

      try {
        // On success
        await new Promise((res) => setTimeout(res, 2000));
        const response = await Promise.race([requestPromise, abortPromise]);

        // Return data when no error is raised (=== data is successfully received)
        setData(response as T);
        return { success: true, data: response as T };
      } catch (error) {
        // On failure
        let caughtError: Error;

        // Check whether error is due to timeout
        if (error instanceof Error && error.name === 'AbortError') {
          caughtError = new Error(
            `Request timed out after ${timeout / 1000} seconds.`,
          );
        } else {
          caughtError =
            error instanceof Error ? error : new Error(String(error));
        }

        // Return error
        setError(caughtError);
        return { success: false, error: caughtError };
      } finally {
        clearTimeout(timeoutId); // Clear timeout
        setIsLoading(false); // Revert loading state to false
      }
    },
    [request, timeout],
  );

  return {
    execute,
    isLoading,
    data,
    error,
  };
}
