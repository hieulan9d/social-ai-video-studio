import type { SupabaseClient } from '@supabase/supabase-js';
import { kolEventBus } from '../../events';
import type {
  QaReport,
  QaScore,
  QaIssue,
  RepairAction,
  RepairType,
  QaThresholds,
  QaValidationType,
} from './types';
import { DEFAULT_QA_THRESHOLDS } from './types';

/**
 * QA/Validation Engine — Phase 8
 *
 * Automatically evaluates generated assets:
 * - Face consistency scoring
 * - Product accuracy scoring
 * - Hand quality scoring
 * - Background consistency scoring
 * - Voice consistency scoring
 *
 * Triggers auto-repair when scores fall below thresholds.
 */
export class QaEngine {
  private thresholds: QaThresholds;

  constructor(
    private db: SupabaseClient,
    thresholds?: Partial<QaThresholds>
  ) {
    this.thresholds = { ...DEFAULT_QA_THRESHOLDS, ...thresholds };
  }

  /**
   * Run full QA validation on a generated video/asset.
   */
  async validate(
    campaignId: string,
    videoId: string,
    scores: QaScore[],
    userId: string
  ): Promise<QaReport> {
    const overallScore = this.calculateOverallScore(scores);
    const issues = scores.flatMap((s) => s.issues);
    const status = this.determineStatus(scores, overallScore);
    const recommendations = this.generateRecommendations(scores);
    const repairActions = this.determineRepairActions(scores);

    const report: QaReport = {
      id: crypto.randomUUID(),
      campaignId,
      videoId,
      scores,
      overallScore,
      status,
      issues,
      recommendations,
      repairActions,
      metadata: {
        validatedAt: new Date().toISOString(),
        validationDuration: 0,
      },
    };

    // Emit QA completed event
    await kolEventBus.emit({
      type: 'campaign.qa.completed',
      payload: report,
      metadata: {
        userId,
        campaignId,
        timestamp: new Date().toISOString(),
      },
    });

    // If repairs needed, emit repair event
    if (repairActions.length > 0) {
      await kolEventBus.emit({
        type: 'campaign.qa.repair_triggered',
        payload: { report, repairActions },
        metadata: {
          userId,
          campaignId,
          timestamp: new Date().toISOString(),
        },
      });
    }

    return report;
  }

  /**
   * Calculate weighted overall score.
   */
  private calculateOverallScore(scores: QaScore[]): number {
    if (scores.length === 0) return 0;

    const weights: Record<QaValidationType, number> = {
      face_consistency: 0.3,
      product_accuracy: 0.25,
      hand_quality: 0.15,
      background_consistency: 0.15,
      voice_consistency: 0.15,
    };

    let totalWeight = 0;
    let weightedSum = 0;

    for (const score of scores) {
      const weight = weights[score.type] || 0.1;
      weightedSum += score.score * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  }

  /**
   * Determine pass/fail status based on thresholds.
   */
  private determineStatus(scores: QaScore[], overallScore: number): 'passed' | 'failed' | 'needs_review' {
    if (overallScore < this.thresholds.overallMinimum) return 'failed';

    const hasCriticalFailure = scores.some((s) => {
      switch (s.type) {
        case 'face_consistency': return s.score < this.thresholds.faceConsistency;
        case 'product_accuracy': return s.score < this.thresholds.productAccuracy;
        case 'hand_quality': return s.score < this.thresholds.handQuality;
        case 'background_consistency': return s.score < this.thresholds.backgroundConsistency;
        case 'voice_consistency': return s.score < this.thresholds.voiceConsistency;
        default: return false;
      }
    });

    if (hasCriticalFailure) return 'needs_review';
    return 'passed';
  }

  /**
   * Generate human-readable recommendations.
   */
  private generateRecommendations(scores: QaScore[]): string[] {
    const recommendations: string[] = [];

    for (const score of scores) {
      if (score.score < 70) {
        switch (score.type) {
          case 'face_consistency':
            recommendations.push('Face identity is inconsistent. Consider regenerating with stronger visual anchor.');
            break;
          case 'product_accuracy':
            recommendations.push('Product representation is inaccurate. Check product lock settings.');
            break;
          case 'hand_quality':
            recommendations.push('Hand quality is poor. Consider regenerating affected frames.');
            break;
          case 'background_consistency':
            recommendations.push('Background varies between scenes. Apply background lock.');
            break;
          case 'voice_consistency':
            recommendations.push('Voice characteristics are inconsistent. Check voice DNA settings.');
            break;
        }
      }
    }

    return recommendations;
  }

  /**
   * Determine which auto-repair actions to trigger.
   */
  private determineRepairActions(scores: QaScore[]): RepairAction[] {
    const actions: RepairAction[] = [];

    for (const score of scores) {
      if (score.score >= 70) continue;

      const repairType = this.getRepairType(score.type);
      if (repairType) {
        actions.push({
          id: crypto.randomUUID(),
          type: repairType,
          target: score.type,
          description: `Auto-repair for low ${score.type} score (${score.score})`,
          priority: score.score < 50 ? 1 : 2,
          status: 'pending',
          metadata: { originalScore: score.score },
        });
      }
    }

    return actions.sort((a, b) => a.priority - b.priority);
  }

  private getRepairType(validationType: QaValidationType): RepairType | null {
    switch (validationType) {
      case 'face_consistency': return 'regenerate_face';
      case 'product_accuracy': return 'regenerate_product';
      case 'hand_quality': return 'regenerate_hands';
      case 'background_consistency': return 'regenerate_scene';
      default: return null;
    }
  }

  /**
   * Get current thresholds (for admin/settings UI).
   */
  getThresholds(): QaThresholds {
    return { ...this.thresholds };
  }

  /**
   * Update thresholds at runtime.
   */
  updateThresholds(updates: Partial<QaThresholds>): void {
    this.thresholds = { ...this.thresholds, ...updates };
  }
}
