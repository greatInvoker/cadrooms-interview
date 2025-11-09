import { supabase } from "./supabase";
import type { SceneConfig } from "@/types/sceneConfig";

const BUCKET_NAME = "scene-configs";

/**
 * Save scene configuration to Supabase Storage
 *
 * @param sceneId - Scene identifier
 * @param config - Scene configuration object
 * @throws Error if upload fails
 */
export async function saveSceneConfig(
	sceneId: string,
	config: SceneConfig
): Promise<void> {
	// Create JSON blob
	const blob = new Blob([JSON.stringify(config, null, 2)], {
		type: "application/json",
	});

	const filePath = `${sceneId}/config.json`;

	console.log(`Saving scene config to: ${filePath}`);

	// Upload to storage (upsert = overwrite if exists)
	const { error } = await supabase.storage
		.from(BUCKET_NAME)
		.upload(filePath, blob, {
			upsert: true,
			contentType: "application/json",
		});

	if (error) {
		console.error("Failed to save scene config:", error);
		throw error;
	}

	console.log("Scene config saved successfully");
}

/**
 * Load scene configuration from Supabase Storage
 *
 * @param sceneId - Scene identifier
 * @returns Scene configuration object, or null if not found
 * @throws Error if download fails (except for not found)
 */
export async function loadSceneConfig(
	sceneId: string
): Promise<SceneConfig | null> {
	const filePath = `${sceneId}/config.json`;

	console.log(`Loading scene config from: ${filePath}`);

	// Download the file
	const { data, error } = await supabase.storage
		.from(BUCKET_NAME)
		.download(filePath);

	if (error) {
		// If file doesn't exist, return null (scene has no saved config yet)
		if (error.message.includes("not found") || error.message.includes("Object not found")) {
			console.log("Scene config not found (scene might be empty)");
			return null;
		}
		console.error("Failed to load scene config:", error);
		throw error;
	}

	// Parse JSON
	const text = await data.text();
	const config: SceneConfig = JSON.parse(text);

	console.log(`Scene config loaded: ${config.parts.length} parts`);
	return config;
}

/**
 * Delete scene configuration from Supabase Storage
 *
 * @param sceneId - Scene identifier
 */
export async function deleteSceneConfig(sceneId: string): Promise<void> {
	const filePath = `${sceneId}/config.json`;

	console.log(`Deleting scene config: ${filePath}`);

	const { error } = await supabase.storage
		.from(BUCKET_NAME)
		.remove([filePath]);

	// Ignore "not found" errors
	if (error && !error.message.includes("not found")) {
		console.error("Failed to delete scene config:", error);
		throw error;
	}

	console.log("Scene config deleted successfully");
}

/**
 * Check if Supabase Storage bucket exists and is accessible
 * Useful for debugging setup issues
 */
export async function checkStorageSetup(): Promise<{
	exists: boolean;
	error?: string;
}> {
	try {
		// Try to list files in the bucket
		const { error } = await supabase.storage.from(BUCKET_NAME).list("", {
			limit: 1,
		});

		if (error) {
			return {
				exists: false,
				error: error.message,
			};
		}

		return { exists: true };
	} catch (err) {
		return {
			exists: false,
			error: err instanceof Error ? err.message : "Unknown error",
		};
	}
}
