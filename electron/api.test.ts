import { describe, it, expect, beforeEach, afterAll, beforeAll } from 'vitest';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { getItem, getAllItems, deleteItem, patchItem, postItem } from './api';
import { DebateTableData } from './type';
import '@testing-library/jest-dom';

// Test data
const TEST_DIR = path.join(os.tmpdir(), 'electron-db-test');
const testDbPath = path.join(TEST_DIR, 'test-db.json');
const ORIGINAL_SAMPLE_DATA: DebateTableData = {
  info: {
    id: '1-1-1-1-1',
    datetime: '',
    agenda: '나의 토론 주제',
    name: '나의 시간표',
    prosTeamName: '찬성',
    consTeamName: '반대',
    finishBell: true,
    warningBell: false,
  },
  table: [
    {
      boxType: 'NORMAL',
      stance: 'PROS',
      speechType: '입론',
      time: 180,
      timePerSpeaking: null,
      timePerTeam: null,
      speaker: '1번',
    },
    {
      boxType: 'NORMAL',
      stance: 'CONS',
      speechType: '입론',
      time: 180,
      timePerSpeaking: null,
      timePerTeam: null,
      speaker: '1번',
    },
    {
      boxType: 'NORMAL',
      stance: 'PROS',
      speechType: '반론',
      time: 180,
      timePerSpeaking: null,
      timePerTeam: null,
      speaker: '2번',
    },
    {
      boxType: 'NORMAL',
      stance: 'CONS',
      speechType: '반론',
      time: 180,
      timePerSpeaking: null,
      timePerTeam: null,
      speaker: '2번',
    },
    {
      boxType: 'TIME_BASED',
      stance: 'NEUTRAL',
      speechType: '자유토론',
      time: null,
      timePerSpeaking: 120,
      timePerTeam: 420,
      speaker: '2번',
    },
    {
      boxType: 'NORMAL',
      stance: 'PROS',
      speechType: '최종 발언',
      time: 180,
      timePerSpeaking: null,
      timePerTeam: null,
      speaker: '3번',
    },
    {
      boxType: 'NORMAL',
      stance: 'CONS',
      speechType: '최종 발언',
      time: 180,
      timePerSpeaking: null,
      timePerTeam: null,
      speaker: '3번',
    },
  ],
} as const;
const SAMPLE_UUID_1 = '79800bb7-70a1-4564-b790-e2148967af7e';
const SAMPLE_UUID_2 = 'bd818b12-fbb0-405a-8fab-d22d63884e82';

// Seed data
let SEED_DATA: DebateTableData[];

beforeAll(async () => {
  // Create temporary directory for test suite
  await fs.mkdir(TEST_DIR, { recursive: true });
});

beforeEach(async () => {
  // Before each test, prepare dataset with pre-defined 2 data
  const SAMPLE_DATA_1 = JSON.parse(JSON.stringify(ORIGINAL_SAMPLE_DATA));
  const SAMPLE_DATA_2 = JSON.parse(JSON.stringify(ORIGINAL_SAMPLE_DATA));
  SAMPLE_DATA_1.info.id = SAMPLE_UUID_1;
  SAMPLE_DATA_2.info.id = SAMPLE_UUID_2;
  SEED_DATA = [SAMPLE_DATA_1, SAMPLE_DATA_2];
  await fs.writeFile(testDbPath, JSON.stringify(SEED_DATA, null, 2));
});

afterAll(async () => {
  // Delete all files and temp directory after each test
  await fs.rm(TEST_DIR, { recursive: true, force: true });
});

// Test suite
describe('Database Handlers', () => {
  it('✅ getAllItems: should return all items from the database', async () => {
    const items = await getAllItems(testDbPath);
    expect(items).toHaveLength(2);
    expect(items).toEqual(SEED_DATA);
  });

  describe('getItem', () => {
    it('✅ should return a single item for a valid ID', async () => {
      const item = await getItem(testDbPath, SAMPLE_UUID_1);
      expect(item.info.id).toBe(SAMPLE_UUID_1);
      expect(item.info.agenda).toBe('나의 토론 주제');
    });

    it('❌ should throw an error for a non-existent ID', async () => {
      // Check whether it returns when non-existent ID is given
      await expect(getItem(testDbPath, '9-2-3-1-2')).rejects.toThrow(
        'Failed to find item.',
      );
    });
  });

  it('✅ postItem: should add a new item and return it', async () => {
    const newItem = JSON.parse(JSON.stringify(ORIGINAL_SAMPLE_DATA));

    const createdItem = await postItem(testDbPath, newItem as DebateTableData);

    expect(createdItem.info.agenda).toBe('나의 토론 주제');
    expect(createdItem.info.id).toBeDefined(); // Check whether new UUID is assigned to new item

    // Also check the file itself
    const db = JSON.parse(await fs.readFile(testDbPath, 'utf-8'));
    expect(db).toHaveLength(3);
    expect(db[2].info.agenda).toBe('나의 토론 주제');
  });

  it('✅ deleteItem: should remove an item and return the updated list', async () => {
    const updatedDb = await deleteItem(testDbPath, SAMPLE_UUID_1);

    expect(updatedDb).toHaveLength(1);
    expect(
      updatedDb.find((item) => item.info.id === SAMPLE_UUID_1),
    ).toBeUndefined();

    // Also check the file itself
    const db = JSON.parse(await fs.readFile(testDbPath, 'utf-8'));
    expect(db).toHaveLength(1);
  });

  it('✅ patchItem: should update an existing item and return it', async () => {
    const itemToUpdate = JSON.parse(JSON.stringify(ORIGINAL_SAMPLE_DATA));
    itemToUpdate.info.id = SAMPLE_UUID_1;
    itemToUpdate.info.agenda = '새로운 토론 주제';

    const updatedItem = await patchItem(testDbPath, itemToUpdate);

    expect(updatedItem.info.agenda).toBe('새로운 토론 주제');

    // Also check the file itself
    const db = JSON.parse(await fs.readFile(testDbPath, 'utf-8'));
    const itemInDb = db.find((item) => item.info.id === SAMPLE_UUID_1);

    expect(db).toHaveLength(2); // Check whether array length is not changed
    expect(itemInDb.info.agenda).toBe('새로운 토론 주제');
  });
});
