import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DebateTableData } from '../../src/type/type';

const { invokeMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
}));

vi.mock('@tauri-apps/api/core', () => ({
  invoke: invokeMock,
}));

import { db } from './db';

const ITEM: DebateTableData = {
  info: {
    id: '00000000-0000-4000-8000-000000000001',
    datetime: '',
    name: '테스트',
    agenda: '테스트 주제',
    prosTeamName: '찬성',
    consTeamName: '반대',
    warningBell: false,
    finishBell: false,
  },
  table: [],
};

describe('Tauri database bridge', () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  it('maps the window.db API to the matching Tauri commands', async () => {
    invokeMock.mockResolvedValue(undefined);
    const id = '00000000-0000-4000-8000-000000000002';

    await db.get(id);
    expect(invokeMock).toHaveBeenLastCalledWith('db_get', { id });

    await db.getAll();
    expect(invokeMock).toHaveBeenLastCalledWith('db_get_all');

    await db.post(ITEM);
    expect(invokeMock).toHaveBeenLastCalledWith('db_post', { item: ITEM });

    await db.delete(id);
    expect(invokeMock).toHaveBeenLastCalledWith('db_delete', { id });

    await db.patch(ITEM);
    expect(invokeMock).toHaveBeenLastCalledWith('db_patch', { item: ITEM });
  });

  it('exposes the same API on window.db', () => {
    expect(window.db).toBe(db);
  });

  it('passes invoke rejections through to callers', async () => {
    const error = new Error('backend failure');
    invokeMock.mockRejectedValueOnce(error);

    await expect(db.getAll()).rejects.toBe(error);
  });
});
