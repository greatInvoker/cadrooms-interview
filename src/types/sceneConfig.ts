/**
 * Scene configuration data structures
 * Used for serializing and deserializing 3D scene state
 */

/**
 * Single part configuration in the scene
 */
export interface PartConfig {
  /** Part file name (e.g., "housing.scs") */
  fileName: string;

  /** HOOPS node ID */
  nodeId: number;

  /** 4x4 transformation matrix (16 numbers) */
  matrix: number[];

  /** Display name of the part */
  name: string;
}

/**
 * Complete scene configuration
 */
export interface SceneConfig {
  /** Configuration version for future compatibility */
  version: string;

  /** Array of parts in the scene */
  parts: PartConfig[];

  /** Metadata about the scene */
  metadata: {
    sceneId: string;
    savedAt: string;
  };
}
