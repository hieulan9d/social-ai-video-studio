import type { SupabaseClient } from '@supabase/supabase-js';
import { ReferenceSheetRepository } from '../repositories';
import { kolEventBus } from '../events';
import type {
  ReferenceSheetRecord,
  CreateReferenceSheetInput,
  ReferenceSheetType,
  ResolvedReferenceSheet,
} from '../types';

export class ReferenceSheetService {
  private repo: ReferenceSheetRepository;

  constructor(private db: SupabaseClient) {
    this.repo = new ReferenceSheetRepository(db);
  }

  async getSheets(kolId: string): Promise<ReferenceSheetRecord[]> {
    return this.repo.findByKol(kolId);
  }

  async getByType(kolId: string, type: ReferenceSheetType): Promise<ReferenceSheetRecord[]> {
    return this.repo.findByType(kolId, type);
  }

  async createSheet(userId: string, input: CreateReferenceSheetInput): Promise<ReferenceSheetRecord> {
    const result = await this.repo.create(input);

    await kolEventBus.emit({
      type: 'kol.reference_sheet.created',
      payload: result,
      metadata: {
        userId,
        kolId: input.kol_id,
        timestamp: new Date().toISOString(),
      },
    });

    return result;
  }

  async createNewVersion(id: string, userId: string, kolId: string, input: Partial<CreateReferenceSheetInput>): Promise<ReferenceSheetRecord> {
    const result = await this.repo.createNewVersion(id, input);

    await kolEventBus.emit({
      type: 'kol.reference_sheet.updated',
      payload: result,
      metadata: { userId, kolId, timestamp: new Date().toISOString() },
    });

    return result;
  }

  async deleteSheet(id: string, userId: string, kolId: string): Promise<void> {
    await this.repo.softDelete(id);

    await kolEventBus.emit({
      type: 'kol.reference_sheet.deleted',
      payload: { id },
      metadata: { userId, kolId, timestamp: new Date().toISOString() },
    });
  }

  /**
   * Resolve all active sheets for a KOL into generation-ready format.
   */
  async resolveSheets(kolId: string): Promise<ResolvedReferenceSheet[]> {
    const sheets = await this.repo.findByKol(kolId);

    return sheets.map((s) => ({
      id: s.id,
      kolId: s.kol_id,
      sheetType: s.sheet_type,
      name: s.name,
      imageUrl: s.image_url,
      sheetData: s.sheet_data,
      version: s.version,
    }));
  }
}
