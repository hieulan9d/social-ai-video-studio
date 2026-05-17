import type { SupabaseClient } from '@supabase/supabase-js';
import { AssetRepository } from '../repositories';
import type { KolAssetRecord, CreateKolAssetInput } from '../types';

export class AssetService {
  private repo: AssetRepository;

  constructor(private db: SupabaseClient) {
    this.repo = new AssetRepository(db);
  }

  async getKolAssets(kolId: string): Promise<KolAssetRecord[]> {
    return this.repo.findByKol(kolId);
  }

  async getByCategory(kolId: string, category: string): Promise<KolAssetRecord[]> {
    return this.repo.findByCategory(kolId, category);
  }

  async createAsset(input: CreateKolAssetInput): Promise<KolAssetRecord> {
    return this.repo.create(input);
  }

  async deleteAsset(id: string): Promise<void> {
    return this.repo.softDelete(id);
  }
}
