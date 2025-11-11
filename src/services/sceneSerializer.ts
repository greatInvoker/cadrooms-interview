import type { SceneConfig, PartConfig } from "@/types/sceneConfig";

// Re-export types for convenience
export type { SceneConfig, PartConfig } from "@/types/sceneConfig";

/**
 * Serialize the current scene state from HOOPS Viewer
 * Extracts all parts and their transformation matrices
 *
 * @param viewer - HOOPS WebViewer instance
 * @param sceneId - Scene identifier
 * @param nodeMetadata - Optional map of node metadata (cadUrl, isPreset)
 * @returns Scene configuration object
 */
export async function serializeScene(
	viewer: Communicator.WebViewer,
	sceneId: string,
	nodeMetadata?: Map<number, { cadUrl: string; isPreset: boolean }>
): Promise<SceneConfig> {
	const model = viewer.model;

	if (!model) {
		throw new Error("Viewer model not initialized");
	}

	const rootNodeId = model.getRootNode();
	const children = model.getNodeChildren(rootNodeId);

	const parts: PartConfig[] = [];

	// Preset parts list for fallback identification
	const presetParts = new Set([
		"axe",
		"bearing_CS",
		"bearing_pr_dw",
		"bearing_pr_up",
	]);

	// Iterate through all child nodes (parts)
	for (const nodeId of children) {
		try {
			// Get node name (might be the file name or a generated name)
			const nodeName = model.getNodeName(nodeId);

			// Skip nodes without names
			if (!nodeName) {
				console.warn(`Skipping node ${nodeId} - no name found`);
				continue;
			}

			// Get transformation matrix
			const matrix = model.getNodeMatrix(nodeId);

			// Get visibility state
			const visible = model.getNodeVisibility(nodeId);

			// Extract file name from node name
			const fileName = extractFileName(nodeName);

			// Convert matrix to array for JSON serialization
			const matrixArray = matrix.m; // matrix.m is the 16-element array

			// Get metadata for this node if available
			const metadata = nodeMetadata?.get(nodeId);
			const partBaseName = fileName.replace(/\.scs$/i, "");
			const isPreset = metadata?.isPreset ?? presetParts.has(partBaseName);

			const partConfig: PartConfig = {
				nodeId,
				name: nodeName,
				fileName,
				matrix: matrixArray,
				visible,
				isPreset,
			};

			// Save cadUrl when available to preserve exact loading path
			if (metadata?.cadUrl) {
				partConfig.cadUrl = metadata.cadUrl;
			}

			parts.push(partConfig);

			console.log(`Serialized part: ${fileName} (nodeId: ${nodeId}, isPreset: ${isPreset})`);
		} catch (err) {
			console.error(`Failed to serialize node ${nodeId}:`, err);
		}
	}

	const config: SceneConfig = {
		version: "1.0",
		parts,
		metadata: {
			sceneId,
			savedAt: new Date().toISOString(),
		},
	};

	console.log(`Scene serialized: ${parts.length} parts`);
	return config;
}

/**
 * Deserialize scene configuration and load all parts into HOOPS Viewer
 * Restores parts and their positions
 *
 * @param viewer - HOOPS WebViewer instance
 * @param config - Scene configuration to load
 * @returns Map of loaded node IDs with their metadata (cadUrl, isPreset)
 */
export async function deserializeScene(
	viewer: Communicator.WebViewer,
	config: SceneConfig
): Promise<Map<number, { cadUrl: string; isPreset: boolean }>> {
	const model = viewer.model;

	if (!model) {
		throw new Error("Viewer model not initialized");
	}

	const rootNodeId = model.getRootNode();

	console.log(`Deserializing scene: ${config.parts.length} parts to load`);

	// Clear existing scene (optional - might want to keep for edit mode)
	// await model.clear();

	// Preset parts list
	const presetParts = new Set([
		"axe",
		"bearing_CS",
		"bearing_pr_dw",
		"bearing_pr_up",
	]);

	// Map to store loaded node metadata
	const nodeMetadata = new Map<number, { cadUrl: string; isPreset: boolean }>();

	// Load each part sequentially
	for (const part of config.parts) {
		try {
			console.log(`Loading part: ${part.fileName}`);

			// Determine the URL based on whether it's a preset or has a saved URL
			let cadUrl: string;
			if (part.cadUrl) {
				// Use saved URL (for user uploaded parts)
				cadUrl = part.cadUrl;
			} else {
				// Check if it's a preset part
				const partBaseName = part.fileName.replace(/\.scs$/i, "");
				if (presetParts.has(partBaseName)) {
					cadUrl = `/preset_parts/${part.fileName}`;
				} else {
					// Unknown part, try preset path as fallback
					cadUrl = `/preset_parts/${part.fileName}`;
					console.warn(`Unknown part source for ${part.fileName}, using preset path`);
				}
			}

			// Load the part file
			const nodeIds = await model.loadSubtreeFromScsFile(
				rootNodeId,
				cadUrl
			);

			if (!nodeIds || nodeIds.length === 0) {
				console.error(`Failed to load part: ${part.fileName}`);
				continue;
			}

			const nodeId = nodeIds[0];

			// Restore transformation matrix
			const matrix = new window.Communicator.Matrix();
			matrix.m = part.matrix; // Restore the 16-element array

			model.setNodeMatrix(nodeId, matrix);

			// Restore visibility state
			model.setNodesVisibility([nodeId], part.visible);

			// Store metadata for this node (using the NEW nodeId)
			const isPreset = part.isPreset ?? presetParts.has(part.fileName.replace(/\.scs$/i, ""));
			nodeMetadata.set(nodeId, {
				cadUrl: part.cadUrl || cadUrl,
				isPreset,
			});

			console.log(`Part loaded and positioned: ${part.fileName} (nodeId: ${nodeId})`);
		} catch (err) {
			console.error(`Failed to load part: ${part.fileName}`, err);
			// Continue loading other parts even if one fails
		}
	}

	// Fit view to show all parts
	setTimeout(() => {
		viewer.view.fitWorld();
	}, 200);

	console.log("Scene deserialization complete");
	return nodeMetadata;
}

/**
 * Extract file name from node name
 * Handles various naming conventions
 *
 * @param nodeName - Node name from HOOPS
 * @returns File name with .scs extension
 */
function extractFileName(nodeName: string): string {
	// If already has .scs extension, return as-is
	if (nodeName.toLowerCase().endsWith(".scs")) {
		return nodeName;
	}

	// If it's a path, extract the base name
	const baseName = nodeName.split("/").pop() || nodeName;

	// HOOPS may convert underscores to spaces in node names
	// Convert back to underscore for file name matching
	const normalizedName = baseName.replace(/\s+/g, "_");

	// Add .scs extension if not present
	return normalizedName.endsWith(".scs") ? normalizedName : `${normalizedName}.scs`;
}
