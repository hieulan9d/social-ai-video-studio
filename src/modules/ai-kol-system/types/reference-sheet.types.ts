import type { ReferenceSheetType, JsonData } from './common.types';

/**
 * Resolved reference sheet for use in generation pipelines.
 */
export type ResolvedReferenceSheet = {
  id: string;
  kolId: string;
  sheetType: ReferenceSheetType;
  name: string;
  imageUrl: string | null;
  sheetData: JsonData;
  version: number;
};

/**
 * Character sheet data structure
 */
export type CharacterSheetData = {
  frontView?: string;
  sideView?: string;
  backView?: string;
  threeQuarterView?: string;
  closeUp?: string;
  fullBody?: string;
  expressions?: Record<string, string>;
  notes?: string;
};

/**
 * Product sheet data structure
 */
export type ProductSheetData = {
  productName: string;
  logoUrl?: string;
  packagingUrl?: string;
  angles?: Record<string, string>;
  colors: string[];
  preserveElements: string[];
  notes?: string;
};

/**
 * Outfit sheet data structure
 */
export type OutfitSheetData = {
  outfitName: string;
  category: string;
  imageUrl?: string;
  colors: string[];
  accessories?: string[];
  compatibleScenes?: string[];
  notes?: string;
};
