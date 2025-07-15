import { DebateTableData } from '../type/type';
import { UUID } from 'crypto';

// Interface for IPC-based repository
class IPCDebateTableRepository {
  // Get 1 item
  async getTable(id: UUID, signal?: AbortSignal): Promise<DebateTableData> {
    return await window.db.get(id, signal);
  }

  // Get all items
  async getAllTables(signal?: AbortSignal): Promise<DebateTableData[]> {
    return await window.db.getAll(signal);
  }

  // Create a new item
  async postTable(
    item: DebateTableData,
    signal?: AbortSignal,
  ): Promise<DebateTableData> {
    return await window.db.post(item, signal);
  }

  // Delete the item
  async deleteTable(
    id: UUID,
    signal?: AbortSignal,
  ): Promise<DebateTableData[]> {
    return await window.db.delete(id, signal);
  }

  // Modify the existing item
  async patchTable(
    item: DebateTableData,
    signal?: AbortSignal,
  ): Promise<DebateTableData> {
    return await window.db.patch(item, signal);
  }
}

// Create singleton instance and expose it only
const repository = new IPCDebateTableRepository();
export default repository;
