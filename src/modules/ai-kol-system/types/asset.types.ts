import type { BaseRecord, SoftDeletable, JsonData } from './common.types';

/**
 * KOL-level asset (not campaign-specific)
 * Used for shared assets like avatars, brand kits, etc.
 */
export type KolAssetRecord = BaseRecord & SoftDeletable & {
  kol_id: string;
  asset_category: 'avatar' | 'brand_kit' | 'reference' | 'template' | 'custom';
  name: string;
  file_url: string | null;
  storage_path: string | null;
  mime_type: string | null;
  file_size: number | null;
  width: number | null;
  height: number | null;
  metadata: JsonData;
  tags: unknown[];
};

export type CreateKolAssetInput = {
  kol_id: string;
  asset_category: KolAssetRecord['asset_category'];
  name: string;
  file_url?: string;
  storage_path?: string;
  mime_type?: string;
  file_size?: number;
  width?: number;
  height?: number;
  metadata?: JsonData;
  tags?: string[];
};
