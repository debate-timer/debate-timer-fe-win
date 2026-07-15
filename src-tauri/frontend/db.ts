import { invoke } from '@tauri-apps/api/core';
import type { DebateTableData } from '../../src/type/type';

export const db: Window['db'] = {
  get: (id) => invoke<DebateTableData>('db_get', { id }),
  getAll: () => invoke<DebateTableData[]>('db_get_all'),
  post: (item) => invoke<DebateTableData>('db_post', { item }),
  delete: (id) => invoke<DebateTableData[]>('db_delete', { id }),
  patch: (item) => invoke<DebateTableData>('db_patch', { item }),
};

window.db = db;
