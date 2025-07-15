export type AbortableRequest<T, Args extends unknown[]> = (
  ...args: [...Args, AbortSignal]
) => Promise<T>;
