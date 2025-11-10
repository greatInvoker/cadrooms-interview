import { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, FileDown, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import type { SceneConfig, PartConfig } from "@/lib/sceneSerializer";

interface SceneJsonViewerProps {
	viewer: Communicator.WebViewer | null;
	onLoadJson?: (config: SceneConfig) => void;
	onCollapse?: (collapsed: boolean) => void;
	// Node metadata for preserving cadUrl and isPreset info
	nodeMetadata?: Map<number, { cadUrl: string; isPreset: boolean }>;
}

export interface SceneJsonViewerHandle {
	refresh: () => void;
}

export const SceneJsonViewer = forwardRef<
	SceneJsonViewerHandle,
	SceneJsonViewerProps
>(({ viewer, onLoadJson, onCollapse, nodeMetadata }, ref) => {
	const [jsonText, setJsonText] = useState<string>("");
	const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

	// Safely get parts count from JSON text
	const getPartsCount = (): number | null => {
		if (!jsonText) return null;
		try {
			const data = JSON.parse(jsonText);
			return data.parts?.length ?? null;
		} catch {
			return null;
		}
	};

	// Handle collapse toggle
	const handleToggleCollapse = () => {
		const newCollapsed = !isCollapsed;
		setIsCollapsed(newCollapsed);

		// Notify parent component about collapse state change
		if (onCollapse) {
			onCollapse(newCollapsed);
		}
	};

	// Expose refresh method to parent
	useImperativeHandle(ref, () => ({
		refresh: updateJsonFromViewer,
	}));

	// Update JSON display when viewer changes
	useEffect(() => {
		if (!viewer) {
			setJsonText("");
			return;
		}

		// Don't auto-generate on mount - wait for parent to call refresh()
		// This prevents errors when viewer is not fully initialized
	}, [viewer]);

	// Generate JSON from current viewer state
	const updateJsonFromViewer = () => {
		if (!viewer) {
			setJsonText("");
			return;
		}

		try {
			const model = viewer.model;

			// Check if model is fully initialized
			if (!model) {
				console.warn("Viewer model not ready yet");
				setJsonText("");
				return;
			}

			// Preset parts list for fallback identification
			const presetParts = new Set([
				"axe",
				"bearing_CS",
				"bearing_pr_dw",
				"bearing_pr_up",
			]);

			const parts: Array<{
				fileName: string;
				nodeId: number;
				matrix: number[];
				name: string;
				visible: boolean;
				cadUrl?: string;
				isPreset?: boolean;
			}> = [];

			// Use nodeMetadata as the source of truth for which nodes are parts
			// This way we only serialize nodes that were actually added as parts
			if (nodeMetadata && nodeMetadata.size > 0) {
				nodeMetadata.forEach((metadata, nodeId) => {
					try {
						// Try to get node information - if the node was deleted, this will fail
						const nodeName = model.getNodeName(nodeId);
						const matrix = model.getNodeMatrix(nodeId);
						const visible = model.getNodeVisibility(nodeId);

						const fileName = nodeName || `part_${nodeId}.scs`;
						const partBaseName = fileName.replace(/\.scs$/i, "");

						const partData: any = {
							fileName,
							nodeId,
							matrix: matrix.m,
							name: nodeName || `part_${nodeId}`,
							visible,
						};

						// Add cadUrl if available
						if (metadata?.cadUrl) {
							partData.cadUrl = metadata.cadUrl;
						}

						// Add isPreset flag
						if (metadata?.isPreset !== undefined) {
							partData.isPreset = metadata.isPreset;
						} else {
							// Fallback: check if it's a preset part by name
							partData.isPreset = presetParts.has(partBaseName);
						}

						parts.push(partData);
					} catch (err) {
						// Node was deleted or doesn't exist anymore - skip it
						// Silent skip - no need to log for normal delete operations
					}
				});
			}

			const config: SceneConfig = {
				version: "1.0",
				parts,
				metadata: {
					sceneId: "current",
					savedAt: new Date().toISOString(),
				},
			};

			// 压缩JSON格式：parts数组每个元素一行，其他字段正常格式化
			const compressedJson = formatCompactJson(config);
			setJsonText(compressedJson);
		} catch (err) {
			console.error("Failed to generate JSON:", err);
			toast.error("Failed to generate scene JSON");
		}
	};

	// 自定义JSON格式化：压缩格式，包含必要的加载信息
	const formatCompactJson = (config: SceneConfig): string => {
		if (config.parts.length === 0) {
			return '{"parts":[]}';
		}

		// Parts: 每个零件压缩，包含 cadUrl 和 isPreset 信息
		const partsCompact = config.parts
			.map((part: PartConfig) => {
				// 从fileName中提取零件名称（去掉.scs后缀）
				const name = part.fileName.replace(/\.scs$/i, "");
				const visibility = part.visible;
				const matrix = part.matrix;

				// Build part JSON with optional fields
				const partJson: any = {
					name,
					visibility,
					matrix,
				};

				// Include cadUrl if available (for user uploaded parts)
				if (part.cadUrl) {
					partJson.cadUrl = part.cadUrl;
				}

				// Include isPreset flag
				if (part.isPreset !== undefined) {
					partJson.isPreset = part.isPreset;
				}

				return JSON.stringify(partJson);
			})
			.join(",");

		return `{"parts":[${partsCompact}]}`;
	};

	// Copy JSON to clipboard
	const handleCopyJson = async () => {
		if (!jsonText) {
			toast.error("No scene data to copy");
			return;
		}

		try {
			await navigator.clipboard.writeText(jsonText);
			toast.success("Scene JSON copied to clipboard");
		} catch (err) {
			console.error("Failed to copy:", err);
			toast.error("Failed to copy JSON to clipboard");
		}
	};

	// Load JSON into viewer
	const handleLoadJson = () => {
		if (!jsonText.trim()) {
			toast.error("Please enter JSON data to load");
			return;
		}

		try {
			const compressedData = JSON.parse(jsonText);

			// Validate the structure
			if (!compressedData.parts || !Array.isArray(compressedData.parts)) {
				throw new Error("Invalid JSON structure: missing parts array");
			}

			// Convert compressed format to full SceneConfig format
			const config: SceneConfig = {
				version: "1.0",
				parts: compressedData.parts.map((part: any, index: number) => {
					// HOOPS may use spaces in node names, but files use underscores
					// Normalize to use underscores for file matching
					const normalizedName = part.name.replace(/\s+/g, "_");
					const fileName = normalizedName.endsWith(".scs") ? normalizedName : `${normalizedName}.scs`;

					return {
						fileName,
						nodeId: 1000 + index, // Generate temporary nodeId
						matrix: part.matrix,
						name: part.name,
						visible: part.visibility !== undefined ? part.visibility : true,
						// Include cadUrl if present (for user uploaded parts)
						cadUrl: part.cadUrl,
						// Include isPreset flag if present
						isPreset: part.isPreset,
					};
				}),
				metadata: {
					sceneId: "loaded",
					savedAt: new Date().toISOString(),
				},
			};

			// Call the callback to load the scene
			if (onLoadJson) {
				onLoadJson(config);
				toast.success(`Loaded ${config.parts.length} parts from JSON`);
			}
		} catch (err) {
			console.error("Failed to load JSON:", err);

			// Provide user-friendly error messages
			if (err instanceof SyntaxError) {
				toast.error("Invalid JSON format. Please check your JSON syntax.");
			} else if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error("Failed to load JSON");
			}
		}
	};

	return (
		<div className="border-t bg-muted/30">
			{/* Header - Always visible */}
			<div
				className="px-4 py-2 flex justify-between items-center cursor-pointer hover:bg-muted/50"
				onClick={handleToggleCollapse}>
				<div className="flex items-center gap-2">
					{isCollapsed ? (
						<ChevronDown className="h-4 w-4" />
					) : (
						<ChevronUp className="h-4 w-4" />
					)}
					<h3 className="text-sm font-medium">Scene JSON</h3>
					{(() => {
						const partsCount = getPartsCount();
						return partsCount !== null ? (
							<span className="text-xs text-muted-foreground">
								({partsCount} parts)
							</span>
						) : null;
					})()}
				</div>
				{!isCollapsed && (
					<div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
						<Button
							onClick={handleCopyJson}
							variant="outline"
							size="sm"
							className="border-2"
							disabled={!jsonText}>
							<Copy className="mr-2 h-3 w-3" />
							Copy JSON
						</Button>
						<Button
							onClick={handleLoadJson}
							variant="outline"
							size="sm"
							className="border-2"
							disabled={!viewer || !jsonText.trim()}>
							<FileDown className="mr-2 h-3 w-3" />
							Load JSON
						</Button>
					</div>
				)}
			</div>

			{/* Content - Collapsible */}
			{!isCollapsed && (
				<div className="px-4 pb-3 space-y-2">
					<Textarea
						value={jsonText}
						onChange={(e) => setJsonText(e.target.value)}
						placeholder="Scene JSON will appear here..."
						className="font-mono text-xs h-24 resize-y"
					/>
					<p className="text-xs text-muted-foreground">
						Copy the JSON to save your scene configuration, or paste JSON here
						to load a saved scene.
					</p>
				</div>
			)}
		</div>
	);
});

SceneJsonViewer.displayName = "SceneJsonViewer";
