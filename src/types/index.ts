import type { SceneConfig } from "./sceneConfig";

export interface Scene {
  id: string;
  name: string;
  description: string;
  assets: string[];
  scene_json: SceneConfig | null;
  del_flag: number; // 0 = active, 1 = deleted
  created_at: string;
  updated_at: string;
}
