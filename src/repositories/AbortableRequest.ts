export type AbortableRequest<T, Args extends unknown[]> = (
  ...args: [...Args, { signal: AbortSignal }]
) => Promise<T>;
