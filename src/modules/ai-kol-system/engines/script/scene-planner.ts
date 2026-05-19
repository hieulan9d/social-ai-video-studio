import type { ScriptEngineConfig, GeneratedScene } from './types';
import { DEFAULT_SCRIPT_ENGINE_CONFIG } from './types';

/**
 * Scene Planner — Phase 4
 *
 * Responsible for:
 * - Calculating optimal scene count based on duration
 * - Planning scene durations
 * - Assigning camera movements
 * - Planning transitions
 */
export class ScenePlanner {
  private config: ScriptEngineConfig;

  constructor(config?: Partial<ScriptEngineConfig>) {
    this.config = { ...DEFAULT_SCRIPT_ENGINE_CONFIG, ...config };
  }

  /**
   * Calculate optimal number of scenes for a given duration.
   */
  calculateSceneCount(totalDuration: number): number {
    const avgDuration = (this.config.maxSceneDuration + this.config.minSceneDuration) / 2;
    return Math.max(2, Math.round(totalDuration / avgDuration));
  }

  /**
   * Plan scene durations to fill total duration evenly.
   */
  planDurations(totalDuration: number, sceneCount: number): number[] {
    const baseDuration = Math.floor(totalDuration / sceneCount);
    const remainder = totalDuration - baseDuration * sceneCount;

    const durations: number[] = [];
    for (let i = 0; i < sceneCount; i++) {
      // Distribute remainder to first scenes
      durations.push(baseDuration + (i < remainder ? 1 : 0));
    }

    return durations;
  }

  /**
   * Get camera progression for scenes.
   * Varies camera angles to maintain visual interest.
   */
  planCameraProgression(sceneCount: number): string[] {
    const cameras = [
      'medium shot',
      'close-up',
      'wide shot',
      'over-the-shoulder',
      'low angle',
      'high angle',
      'tracking shot',
      'static',
    ];

    const progression: string[] = [];
    for (let i = 0; i < sceneCount; i++) {
      progression.push(cameras[i % cameras.length]);
    }
    return progression;
  }

  /**
   * Plan transitions between scenes.
   */
  planTransitions(sceneCount: number): string[] {
    const transitions = [
      'cut',
      'dissolve',
      'swipe left',
      'zoom in',
      'fade',
      'whip pan',
    ];

    const planned: string[] = [];
    for (let i = 0; i < sceneCount; i++) {
      if (i === sceneCount - 1) {
        planned.push('fade to black');
      } else {
        planned.push(transitions[i % transitions.length]);
      }
    }
    return planned;
  }

  /**
   * Create scene skeleton with planned structure.
   */
  createSceneSkeleton(totalDuration: number): Omit<GeneratedScene, 'visualPrompt' | 'voiceOverVi' | 'sceneData'>[] {
    const sceneCount = this.calculateSceneCount(totalDuration);
    const durations = this.planDurations(totalDuration, sceneCount);
    const cameras = this.planCameraProgression(sceneCount);
    const transitions = this.planTransitions(sceneCount);

    return durations.map((duration, i) => ({
      scene: i + 1,
      duration: `${duration}s`,
      camera: cameras[i],
      transition: transitions[i],
      negativePrompt: '',
    }));
  }
}
