import type { BaseRecord, SoftDeletable, JsonData } from './common.types';

/** Database record for kol_workspaces */
export type WorkspaceRecord = BaseRecord & SoftDeletable & {
  user_id: string;
  name: string;
  description: string | null;
  settings: JsonData;
  is_active: boolean;
};

/** Domain model for workspace */
export type Workspace = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  settings: JsonData;
  isActive: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Input for creating a workspace */
export type CreateWorkspaceInput = {
  name: string;
  description?: string;
  settings?: JsonData;
};

/** Input for updating a workspace */
export type UpdateWorkspaceInput = Partial<CreateWorkspaceInput> & {
  is_active?: boolean;
};
