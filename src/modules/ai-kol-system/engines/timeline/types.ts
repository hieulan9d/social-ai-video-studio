import type { JsonData } from '../../types';

/**
 * Timeline Editor — Phase 9 Types
 */

export type TimelineScene = {
  id: string;
  sceneId: string;
  order: number;
  duration: number;
  prompt: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  status: 'empty' | 'prompt_ready' | 'rendering' | 'completed' | 'failed';
  transition: TransitionConfig;
  metadata: JsonData;
};

export type TransitionConfig = {
  type: TransitionType;
  duration: number;
  easing?: string;
};

export type TransitionType =
  | 'cut'
  | 'dissolve'
  | 'fade'
  | 'swipe_left'
  | 'swipe_right'
  | 'zoom_in'
  | 'zoom_out'
  | 'whip_pan'
  | 'fade_to_black';

export type TimelineState = {
  campaignId: string;
  scenes: TimelineScene[];
  totalDuration: number;
  selectedSceneId: string | null;
  isDirty: boolean;
};

export type TimelineAction =
  | { type: 'REORDER'; fromIndex: number; toIndex: number }
  | { type: 'DUPLICATE'; sceneId: string }
  | { type: 'DELETE'; sceneId: string }
  | { type: 'UPDATE_DURATION'; sceneId: string; duration: number }
  | { type: 'UPDATE_TRANSITION'; sceneId: string; transition: TransitionConfig }
  | { type: 'REGENERATE_SCENE'; sceneId: string }
  | { type: 'REGENERATE_FACE'; sceneId: string }
  | { type: 'REGENERATE_PRODUCT'; sceneId: string }
  | { type: 'SELECT_SCENE'; sceneId: string | null }
  | { type: 'ADD_SCENE'; afterSceneId?: string };

export type TimelineExportConfig = {
  format: 'mp4' | 'webm';
  resolution: '720p' | '1080p' | '4k';
  fps: number;
  includeTransitions: boolean;
  includeAudio: boolean;
  audioTrackUrl?: string;
};
