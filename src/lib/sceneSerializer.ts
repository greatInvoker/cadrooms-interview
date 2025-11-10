import type { SceneConfig, PartConfig } from "@/types/sceneConfig";

/**
 * Serialize the current scene state from HOOPS Viewer
 * Extracts all parts and their transformation matrices
 *
 * @param viewer - HOOPS WebViewer instance
 * @param sceneId - Scene identifier
 * @returns Scene configuration object
 */
export async function serializeScene(
	viewer: Communicator.WebViewer,
	sceneId: string
): Promise<SceneConfig> {
	const model = viewer.model;

	if (!model) {
		throw new Error("Viewer model not initialized");
	}

	const rootNodeId = model.getRootNode();
	const children = model.getNodeChildren(rootNodeId);

	const parts: PartConfig[] = [];

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

			parts.push({
				nodeId,
				name: nodeName,
				fileName,
				matrix: matrixArray,
				visible,
			});

			console.log(`Serialized part: ${fileName} (nodeId: ${nodeId})`);
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
 */
export async function deserializeScene(
	viewer: Communicator.WebViewer,
	config: SceneConfig
): Promise<void> {
	const model = viewer.model;

	if (!model) {
		throw new Error("Viewer model not initialized");
	}

	const rootNodeId = model.getRootNode();

	console.log(`Deserializing scene: ${config.parts.length} parts to load`);

	// Clear existing scene (optional - might want to keep for edit mode)
	// await model.clear();

	// Load each part sequentially
	for (const part of config.parts) {
		try {
			console.log(`Loading part: ${part.fileName}`);

			// Load the part file
			const nodeIds = await model.loadSubtreeFromScsFile(
				rootNodeId,
				`/parts/${part.fileName}`
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

	// Remove any special characters and add .scs extension
	const cleanName = baseName.replace(/[^a-zA-Z0-9_-]/g, "_");

	return `${cleanName}.scs`;
}

/**
 * Get a simple list of part file names in the scene
 * Useful for updating the scenes.assets field
 *
 * @param viewer - HOOPS WebViewer instance
 * @returns Array of file names
 */
export function getScenePartFiles(viewer: Communicator.WebViewer): string[] {

	const model = viewer.model;

	if (!model) {
		console.error("Viewer model not initialized");
		return [];
	}

	const rootNodeId = model.getRootNode();
	const children = model.getNodeChildren(rootNodeId);

	const fileNames: string[] = [];

	for (const nodeId of children) {
		try {
			const nodeName = model.getNodeName(nodeId);
			if (!nodeName) {
				console.warn(`Skipping node ${nodeId} - no name found`);
				continue;
			}
			const fileName = extractFileName(nodeName);
			fileNames.push(fileName);
		} catch (err) {
			console.error(`Failed to get file name for node ${nodeId}:`, err);
		}
	}

	return fileNames;
}
