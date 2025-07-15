import { contextBridge, ipcRenderer } from 'electron';
import { DebateTableData } from './type';
import { UUID } from 'crypto';

// IPC Preloads
// - Main(Electron) will only expose under items to the renderer(React).
interface DB_API {
  get: (id: UUID, signal?: AbortSignal) => Promise<DebateTableData>;
  getAll: (signal?: AbortSignal) => Promise<DebateTableData[]>;
  post: (
    item: DebateTableData,
    signal?: AbortSignal,
  ) => Promise<DebateTableData>;
  delete: (id: UUID, signal?: AbortSignal) => Promise<DebateTableData[]>;
  patch: (
    item: DebateTableData,
    signal?: AbortSignal,
  ) => Promise<DebateTableData>;
}

declare global {
  interface Window {
    db: DB_API;
  }
}

const invokeWithHandlingAbortSignal = async <T>(
  invoke: () => Promise<T>,
  signal?: AbortSignal,
) => {
  // If request is already aborted, cancel it immediately
  if (signal?.aborted) {
    return Promise.reject(new DOMException('Aborted', 'AbortError'));
  }

  // Execute invoke function
  const ipcPromise = invoke();

  // If signal is provided, make both of invoke function and timeout race
  if (signal) {
    const abortPromise = new Promise((_, reject) => {
      signal.addEventListener('abort', () => {
        reject(new DOMException('Aborted', 'AbortError'));
      });
    });

    return Promise.race([ipcPromise, abortPromise]);
  }

  // If signal is not provided, return result of the invoke function
  return ipcPromise;
};

contextBridge.exposeInMainWorld('db', {
  get: (id: UUID, signal?: AbortSignal) =>
    invokeWithHandlingAbortSignal(
      () => ipcRenderer.invoke('db-get', id),
      signal,
    ),
  getAll: (signal?: AbortSignal) =>
    invokeWithHandlingAbortSignal(
      () => ipcRenderer.invoke('db-get-all'),
      signal,
    ),
  post: (item: DebateTableData, signal?: AbortSignal) =>
    invokeWithHandlingAbortSignal(
      () => ipcRenderer.invoke('db-post', item),
      signal,
    ),
  delete: (id: UUID, signal?: AbortSignal) =>
    invokeWithHandlingAbortSignal(
      () => ipcRenderer.invoke('db-delete', id),
      signal,
    ),
  patch: (item: DebateTableData, signal?: AbortSignal) =>
    invokeWithHandlingAbortSignal(
      () => ipcRenderer.invoke('db-patch', item),
      signal,
    ),
});
