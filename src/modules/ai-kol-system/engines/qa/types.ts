import type { JsonData } from '../../types';

/**
 * QA/Validation Engine — Phase 8 Types
 */

export type QaValidationType =
  | 'face_consistency'
  | 'product_accuracy'
  | 'hand_quality'
  | 'background_consistency'
  | 'voice_consistency';

export type QaScore = {
  type: QaValidationType;
  score: number; // 0-100
  confidence: number; // 0-1
  issues: QaIssue[];
};

export type QaIssue = {
  type: QaValidationType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location?: string;
  suggestedRepair?: RepairAction;
};

export type QaReport = {
  id: string;
  campaignId: string;
  videoId?: string;
  sceneId?: string;
  scores: QaScore[];
  overallScore: number;
  status: 'passed' | 'failed' | 'needs_review';
  issues: QaIssue[];
  recommendations: string[];
  repairActions: RepairAction[];
  metadata: {
    validatedAt: string;
    validationDuration: number;
    provider?: string;
  };
};

export type RepairAction = {
  id: string;
  type: RepairType;
  target: string;
  description: string;
  priority: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  metadata: JsonData;
};

export type RepairType =
  | 'regenerate_face'
  | 'regenerate_hands'
  | 'regenerate_product'
  | 'regenerate_scene'
  | 'regenerate_full'
  | 'adjust_lighting'
  | 'adjust_color';

export type QaThresholds = {
  faceConsistency: number;
  productAccuracy: number;
  handQuality: number;
  backgroundConsistency: number;
  voiceConsistency: number;
  overallMinimum: number;
};

export const DEFAULT_QA_THRESHOLDS: QaThresholds = {
  faceConsistency: 85,
  productAccuracy: 90,
  handQuality: 75,
  backgroundConsistency: 80,
  voiceConsistency: 90,
  overallMinimum: 80,
};
