import type { WorkspaceRecord, Workspace } from '../types/workspace.types';
import type { KolMasterRecord, KolMaster } from '../types/kol.types';
import type { CampaignRecord, Campaign } from '../types/campaign.types';

/**
 * Map database record (snake_case) to domain model (camelCase)
 */

export function mapWorkspace(record: WorkspaceRecord): Workspace {
  return {
    id: record.id,
    userId: record.user_id,
    name: record.name,
    description: record.description,
    settings: record.settings,
    isActive: record.is_active,
    deletedAt: record.deleted_at,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

export function mapKolMaster(record: KolMasterRecord): KolMaster {
  return {
    id: record.id,
    workspaceId: record.workspace_id,
    userId: record.user_id,
    name: record.name,
    slug: record.slug,
    status: record.status,
    avatarUrl: record.avatar_url,
    settings: record.settings,
    metadata: record.metadata,
    deletedAt: record.deleted_at,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

export function mapCampaign(record: CampaignRecord): Campaign {
  return {
    id: record.id,
    kolId: record.kol_id,
    workspaceId: record.workspace_id,
    userId: record.user_id,
    name: record.name,
    description: record.description,
    campaignGoal: record.campaign_goal,
    targetAudience: record.target_audience,
    platform: record.platform,
    contentType: record.content_type,
    emotionStyle: record.emotion_style,
    hookStyle: record.hook_style,
    ctaStyle: record.cta_style,
    status: record.status,
    settings: record.settings,
    metadata: record.metadata,
    deletedAt: record.deleted_at,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}
