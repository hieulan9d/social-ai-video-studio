import type {
  TimelineState,
  TimelineScene,
  TimelineAction,
  TransitionConfig,
} from './types';

/**
 * Timeline Engine — Phase 9
 *
 * Manages the production timeline state:
 * - Drag and drop scene reordering
 * - Scene duplication
 * - Scene regeneration triggers
 * - Transition management
 * - Duration editing
 *
 * This is a pure state machine — no side effects.
 * Side effects (API calls, rendering) are handled by the orchestrator.
 */
export class TimelineEngine {
  /**
   * Create initial timeline state from campaign scenes.
   */
  createInitialState(campaignId: string, scenes: TimelineScene[]): TimelineState {
    return {
      campaignId,
      scenes: scenes.sort((a, b) => a.order - b.order),
      totalDuration: scenes.reduce((sum, s) => sum + s.duration, 0),
      selectedSceneId: null,
      isDirty: false,
    };
  }

  /**
   * Apply an action to the timeline state (reducer pattern).
   */
  applyAction(state: TimelineState, action: TimelineAction): TimelineState {
    switch (action.type) {
      case 'REORDER':
        return this.reorder(state, action.fromIndex, action.toIndex);
      case 'DUPLICATE':
        return this.duplicate(state, action.sceneId);
      case 'DELETE':
        return this.deleteScene(state, action.sceneId);
      case 'UPDATE_DURATION':
        return this.updateDuration(state, action.sceneId, action.duration);
      case 'UPDATE_TRANSITION':
        return this.updateTransition(state, action.sceneId, action.transition);
      case 'SELECT_SCENE':
        return { ...state, selectedSceneId: action.sceneId };
      case 'ADD_SCENE':
        return this.addScene(state, action.afterSceneId);
      case 'REGENERATE_SCENE':
      case 'REGENERATE_FACE':
      case 'REGENERATE_PRODUCT':
        return this.markForRegeneration(state, action.sceneId);
      default:
        return state;
    }
  }

  private reorder(state: TimelineState, fromIndex: number, toIndex: number): TimelineState {
    const scenes = [...state.scenes];
    const [moved] = scenes.splice(fromIndex, 1);
    scenes.splice(toIndex, 0, moved);

    // Recalculate order
    const reordered = scenes.map((s, i) => ({ ...s, order: i }));

    return {
      ...state,
      scenes: reordered,
      isDirty: true,
    };
  }

  private duplicate(state: TimelineState, sceneId: string): TimelineState {
    const index = state.scenes.findIndex((s) => s.id === sceneId);
    if (index === -1) return state;

    const original = state.scenes[index];
    const duplicate: TimelineScene = {
      ...original,
      id: crypto.randomUUID(),
      sceneId: '', // New scene, needs to be created in DB
      order: index + 1,
      status: 'prompt_ready',
      videoUrl: undefined,
      thumbnailUrl: undefined,
    };

    const scenes = [...state.scenes];
    scenes.splice(index + 1, 0, duplicate);

    // Recalculate order
    const reordered = scenes.map((s, i) => ({ ...s, order: i }));

    return {
      ...state,
      scenes: reordered,
      totalDuration: state.totalDuration + duplicate.duration,
      isDirty: true,
    };
  }

  private deleteScene(state: TimelineState, sceneId: string): TimelineState {
    const scene = state.scenes.find((s) => s.id === sceneId);
    if (!scene) return state;

    const scenes = state.scenes
      .filter((s) => s.id !== sceneId)
      .map((s, i) => ({ ...s, order: i }));

    return {
      ...state,
      scenes,
      totalDuration: state.totalDuration - scene.duration,
      selectedSceneId: state.selectedSceneId === sceneId ? null : state.selectedSceneId,
      isDirty: true,
    };
  }

  private updateDuration(state: TimelineState, sceneId: string, duration: number): TimelineState {
    const scenes = state.scenes.map((s) =>
      s.id === sceneId ? { ...s, duration } : s
    );

    return {
      ...state,
      scenes,
      totalDuration: scenes.reduce((sum, s) => sum + s.duration, 0),
      isDirty: true,
    };
  }

  private updateTransition(state: TimelineState, sceneId: string, transition: TransitionConfig): TimelineState {
    const scenes = state.scenes.map((s) =>
      s.id === sceneId ? { ...s, transition } : s
    );

    return { ...state, scenes, isDirty: true };
  }

  private addScene(state: TimelineState, afterSceneId?: string): TimelineState {
    const newScene: TimelineScene = {
      id: crypto.randomUUID(),
      sceneId: '',
      order: 0,
      duration: 6,
      prompt: '',
      status: 'empty',
      transition: { type: 'cut', duration: 0.5 },
      metadata: {},
    };

    let scenes: TimelineScene[];
    if (afterSceneId) {
      const index = state.scenes.findIndex((s) => s.id === afterSceneId);
      scenes = [...state.scenes];
      scenes.splice(index + 1, 0, newScene);
    } else {
      scenes = [...state.scenes, newScene];
    }

    const reordered = scenes.map((s, i) => ({ ...s, order: i }));

    return {
      ...state,
      scenes: reordered,
      totalDuration: state.totalDuration + newScene.duration,
      isDirty: true,
    };
  }

  private markForRegeneration(state: TimelineState, sceneId: string): TimelineState {
    const scenes = state.scenes.map((s) =>
      s.id === sceneId ? { ...s, status: 'rendering' as const, videoUrl: undefined } : s
    );

    return { ...state, scenes, isDirty: true };
  }

  /**
   * Get scenes that need rendering.
   */
  getPendingScenes(state: TimelineState): TimelineScene[] {
    return state.scenes.filter(
      (s) => s.status === 'prompt_ready' || s.status === 'rendering'
    );
  }

  /**
   * Check if timeline is ready for export.
   */
  isReadyForExport(state: TimelineState): boolean {
    return state.scenes.length > 0 && state.scenes.every((s) => s.status === 'completed');
  }
}
