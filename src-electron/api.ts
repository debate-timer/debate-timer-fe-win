import { randomUUID, UUID } from 'crypto';
import { DebateTableData } from './type';
import fs from 'fs/promises';
import { Mutex } from 'async-mutex';
import { DateTime } from 'luxon';
import { DATETIME_FORMAT } from './constants';

// Mutex to prevent possible concurrency problem
const dbMutex = new Mutex();

// Read database (helper function for API requests)
async function readDb(dbPath: string) {
  const data = await fs.readFile(dbPath, 'utf-8');
  const parsedData = JSON.parse(data);
  return Array.isArray(parsedData) ? parsedData : [];
}

// Named DB API functions
// GET 1 item
export async function getItem(
  dbPath: string,
  id: UUID,
): Promise<DebateTableData> {
  return await dbMutex.runExclusive(async () => {
    const db = await readDb(dbPath);
    const target = db.find((record: DebateTableData) => record.info.id === id);
    if (target) {
      return target;
    } else {
      throw new Error('Failed to find item.');
    }
  });
}

// GET all items
export async function getAllItems(dbPath: string): Promise<DebateTableData[]> {
  return await dbMutex.runExclusive(async () => {
    const db = await readDb(dbPath);
    const sortedDb = db.sort((a, b) => {
      const aDt = DateTime.fromFormat(a.info.datetime, DATETIME_FORMAT);
      const bDt = DateTime.fromFormat(b.info.datetime, DATETIME_FORMAT);

      if (!aDt.isValid && !bDt.isValid) return 0;
      if (!aDt.isValid) return 1;
      if (!bDt.isValid) return -1;

      return aDt.toMillis() - bDt.toMillis();
    });
    return sortedDb;
  });
}

// POST
export async function postItem(
  dbPath: string,
  item: DebateTableData,
): Promise<DebateTableData> {
  return await dbMutex.runExclusive(async () => {
    const db = await readDb(dbPath);
    const now = DateTime.local();
    item.info.id = randomUUID();
    item.info.datetime = now.toFormat(DATETIME_FORMAT);
    db.push(item);
    await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
    return item;
  });
}

// DELETE
export async function deleteItem(
  dbPath: string,
  id: UUID,
): Promise<DebateTableData[]> {
  return await dbMutex.runExclusive(async () => {
    const db = await readDb(dbPath);
    const updatedDb = db.filter(
      (record: DebateTableData) => record.info.id !== id,
    );
    await fs.writeFile(dbPath, JSON.stringify(updatedDb, null, 2));
    return updatedDb;
  });
}

// PATCH
export async function patchItem(
  dbPath: string,
  item: DebateTableData,
): Promise<DebateTableData> {
  return await dbMutex.runExclusive(async () => {
    const db = await readDb(dbPath);
    const updatedDb = db.map((record: DebateTableData) =>
      record.info.id === item.info.id ? item : record,
    );
    await fs.writeFile(dbPath, JSON.stringify(updatedDb, null, 2));
    return item;
  });
}
