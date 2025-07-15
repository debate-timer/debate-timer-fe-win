import { UUID } from 'crypto';
import { DebateTableData } from './type/type';

// Declared same types from electron/preload.ts
// to keep type consistency between the renderer side and the main side
export interface DB_API {
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
