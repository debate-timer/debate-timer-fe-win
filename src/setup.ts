import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { DebateTableData } from './type/type.ts';
import { SAMPLE_TABLE_DATA } from './constants/sample_table.ts';
import { randomUUID, UUID } from 'crypto';

// Init data for mocking
const SAMPLE_UUID_1 = '79800bb7-70a1-4564-b790-e2148967af7e';
const SAMPLE_UUID_2 = 'bd818b12-fbb0-405a-8fab-d22d63884e82';
const mockInitialData: DebateTableData[] = [
  {
    ...SAMPLE_TABLE_DATA,
    info: { ...SAMPLE_TABLE_DATA.info, id: SAMPLE_UUID_1 },
  },
  {
    ...SAMPLE_TABLE_DATA,
    info: { ...SAMPLE_TABLE_DATA.info, id: SAMPLE_UUID_2 },
  },
];

// Mock DB APIs
const mockDbApi = {
  getAll: vi.fn(async () => {
    return Promise.resolve(mockInitialData);
  }),

  get: vi.fn(async (_id: UUID) => {
    const item = mockInitialData.find((d) => d.info.id === SAMPLE_UUID_1);
    return item
      ? Promise.resolve(item)
      : Promise.reject(new Error('Item not found'));
  }),

  post: vi.fn(async (item: DebateTableData) => {
    const uuid = randomUUID();
    const newItem = {
      ...item,
      info: { ...item.info, id: uuid },
    };
    mockInitialData.push(newItem);
    return Promise.resolve(newItem);
  }),

  delete: vi.fn(async (id: UUID) => {
    const updatedDb = mockInitialData.filter((d) => d.info.id !== id);
    return Promise.resolve(updatedDb);
  }),

  patch: vi.fn(async (item: DebateTableData) => {
    mockInitialData.map((d) => (d.info.id === item.info.id ? item : d));
    return Promise.resolve(item);
  }),
};

// Append it on vitest
vi.stubGlobal('db', mockDbApi);

beforeAll(() => {
  cleanup();
});
