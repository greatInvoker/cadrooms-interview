import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Scene } from "../types/Scene";
import { PartsList } from "./PartsList";
import { SceneJsonViewer, type SceneJsonViewerHandle } from "./SceneJsonViewer";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, X, Trash2 } from "lucide-react";
import "../types/hoops.d.ts";
import {
	serializeScene,
	deserializeScene,
} from "@/services/sceneSerializer";
import type { SceneConfig } from "@/types/sceneConfig";

interface SceneEditorProps {
	sceneId: string;
	onClose?: () => void;
	onSave?: () => void;
}

interface Part {
	id: string;
	name: string;
	fileName: string;
	thumbnail?: string;
}

export function SceneEditor({ sceneId, onClose, onSave }: SceneEditorProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const viewerRef = useRef<Communicator.WebViewer | null>(null);
	const jsonViewerRef = useRef<SceneJsonViewerHandle>(null);

	// Store part metadata for nodes
	const nodePartMetadataRef = useRef<
		Map<number, { cadUrl: string; isPreset: boolean }>
	>(new Map());

	const [scene, setScene] = useState<Scene | null>(null);
	const [parts, setParts] = useState<Part[]>([]);
	const [totalPartsCount, setTotalPartsCount] = useState<number>(0); // Total parts including user uploaded
	const [status, setStatus] = useState<string>("Initializing...");
	const [selectedNodeId, setSelectedNodeId] =
		useState<Communicator.NodeId | null>(null);

	// 新增状态
	const isNewScene = sceneId === "new";
	const [hasChanges, setHasChanges] = useState(false);
	const [showSaveDialog, setShowSaveDialog] = useState(false);
	const [showExitConfirm, setShowExitConfirm] = useState(false);
	const [shouldExitAfterSave, setShouldExitAfterSave] = useState(false);
	const [formData, setFormData] = useState({ name: "", description: "" });

	useEffect(() => {
		let mounted = true;

		async function init() {
			try {
				setStatus("Loading scene data...");

				// 如果是新场景，不从数据库加载
				if (!isNewScene) {
					const { data, error: fetchError } = await supabase
						.from("scenes")
						.select("*")
						.eq("id", sceneId)
						.eq("del_flag", 0) // Only load active scenes
						.single();

					if (fetchError) throw fetchError;
					if (!data) throw new Error("Scene not found or deleted");

					if (!mounted) return;
					setScene(data);
				} else {
					// 新场景使用默认数据
					if (!mounted) return;
					setScene({
						id: "new",
						name: "Untitled Scene",
						description: "",
							scene_json: null,
						del_flag: 0,
						created_at: new Date().toISOString(),
						updated_at: new Date().toISOString(),
					} as Scene);
				}

				const response = await fetch("/preset_parts/parts_list.json");
				const partsData = await response.json();

				const loadedParts: Part[] = partsData.parts.map(
					(part: { id: number; name: string }) => ({
						id: part.id.toString(),
						name: part.name
							.replace(/_/g, " ")
							.replace(/\b\w/g, (l: string) => l.toUpperCase()),
						fileName: `${part.name}.scs`,
						thumbnail: `/preset_parts/${part.name}.png`,
					})
				);

				if (!mounted) return;
				setParts(loadedParts);

				setStatus("Initializing 3D editor...");
				await initViewer();
			} catch (err) {
				console.error("Initialization error:", err);
				if (mounted) {
					setStatus(
						`Error: ${err instanceof Error ? err.message : "Unknown error"}`
					);
				}
			}
		}

		init();

		return () => {
			mounted = false;
			if (viewerRef.current) {
				try {
					const shutdownPromise = viewerRef.current.shutdown();
					if (shutdownPromise && typeof shutdownPromise.catch === "function") {
						shutdownPromise.catch(console.error);
					}
				} catch (err) {
					console.error("Shutdown error:", err);
				}
				viewerRef.current = null;
			}
		};
	}, [sceneId, isNewScene]);

	// Handle window resize with debounce
	useEffect(() => {
		let resizeTimeout: ReturnType<typeof setTimeout>;

		const handleResize = () => {
			// Clear previous timeout
			clearTimeout(resizeTimeout);

			// Debounce: wait 300ms after last resize event
			resizeTimeout = setTimeout(() => {
				if (viewerRef.current) {
					try {
						console.log("Resizing viewer canvas");
						viewerRef.current.resizeCanvas();
					} catch (err) {
						console.error("Failed to resize canvas:", err);
					}
				}
			}, 300);
		};

		window.addEventListener("resize", handleResize, { passive: true });

		return () => {
			window.removeEventListener("resize", handleResize);
			clearTimeout(resizeTimeout);
		};
	}, []);

	async function initViewer() {
		return new Promise<void>((resolve, reject) => {
			if (!containerRef.current) {
				reject(new Error("Container not ready"));
				return;
			}

			if (typeof window.Communicator === "undefined") {
				reject(new Error("HOOPS Communicator not loaded"));
				return;
			}

			const containerId = `editor-${sceneId}`;
			containerRef.current.id = containerId;

			console.log("Creating editor with container:", containerId);

			// 不加载初始模型,创建空白编辑器
			const viewer = new window.Communicator.WebViewer({
				containerId: containerId,
				empty: true, // 创建空场景
			});

			viewerRef.current = viewer;

			viewer.setCallbacks({
				sceneReady: async () => {
					console.log("Editor scene ready!");

					const view = viewer.getView();
					view.setBackgroundColor(
						new window.Communicator.Color(245, 245, 250),
						new window.Communicator.Color(220, 220, 230)
					);

					const axisTriad = view.getAxisTriad();
					axisTriad.enable();
					axisTriad.setAnchor(
						window.Communicator.OverlayAnchor.LowerLeftCorner
					);

					// Load saved scene state if this is an existing scene
					if (!isNewScene) {
						try {
							setStatus("Loading saved scene...");

							// Load scene_json from database
							const { data: sceneData, error: loadError } = await supabase
								.from("scenes")
								.select("scene_json")
								.eq("id", sceneId)
								.single();

							if (loadError) throw loadError;

							const config = sceneData?.scene_json as SceneConfig | null;

							if (config && config.parts && config.parts.length > 0) {
								console.log(
									`Loading ${config.parts.length} parts from database`
								);

								// deserializeScene now returns node metadata mapping
								const loadedMetadata = await deserializeScene(viewer, config);

								// Update nodePartMetadataRef with the loaded metadata
								nodePartMetadataRef.current = loadedMetadata;

								setStatus(`Ready! ${config.parts.length} parts loaded`);
							} else {
								setStatus("Ready! Empty scene - drag parts to add");
							}
						} catch (err) {
							console.error("Failed to load scene state:", err);
							setStatus("Ready! (Failed to load saved parts)");
						}
					} else {
						setStatus("Ready! New scene - drag parts to add");
					}

					// Refresh JSON viewer now that scene is fully ready
					setTimeout(() => {
						jsonViewerRef.current?.refresh();
					}, 100);

					resolve();
				},
				modelStructureReady: () => {
					console.log("Model structure ready");
				},
				selectionArray: () => {
					const selectionManager = viewer.getSelectionManager();
					const results = selectionManager.getResults();

					if (results.length > 0) {
						const nodeId = results[0].getNodeId();
						setSelectedNodeId(nodeId);
					} else {
						setSelectedNodeId(null);
					}
				},
			});

			const startResult = viewer.start();

			// Handle both Promise and void return types
			if (startResult && typeof startResult.catch === "function") {
				startResult.catch((err) => {
					console.error("Viewer start failed:", err);
					setStatus(`Failed to start editor: ${err.message}`);
					reject(err);
				});
			}
		});
	}

	async function handleDrop(e: React.DragEvent) {
		e.preventDefault();
		e.stopPropagation();

		if (!viewerRef.current) {
			console.error("Viewer not ready");
			return;
		}

		try {
			// Try to get part with URLs first (from PartsListNew)
			const partWithUrlsData = e.dataTransfer.getData("part-with-urls");
			let cadUrl: string;
			let isPreset = false;

			if (partWithUrlsData) {
				// New format with full URLs
				const partWithUrls = JSON.parse(partWithUrlsData);
				cadUrl = partWithUrls.cad_url;
				isPreset = partWithUrls.is_system || false;
				console.log(`Loading part from URL: ${cadUrl}, isPreset: ${isPreset}`);
			} else {
				// Fallback to legacy format
				const partData = e.dataTransfer.getData("application/json");
				if (!partData) {
					console.error("No part data in drop event");
					return;
				}

				const part: Part = JSON.parse(partData);
				// Assume preset parts for legacy format
				cadUrl = `/preset_parts/${part.fileName}`;
				isPreset = true;
				console.log(`Loading part (legacy): ${part.fileName}`);
			}

			const viewer = viewerRef.current;

			if (!viewer || !viewer.model) {
				console.error("Viewer not ready");
				return;
			}

			const model = viewer.model;
			const rootNodeId = model.getRootNode();

			const rect = containerRef.current?.getBoundingClientRect();
			if (!rect) return;

			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;

			console.log(`Loading part from: ${cadUrl}`);

			// Load the part file using the URL
			const nodeIds = await model.loadSubtreeFromScsFile(
				rootNodeId,
				cadUrl
			);

			if (!nodeIds || nodeIds.length === 0) {
				console.error("Failed to load part - no nodes returned");
				return;
			}

			const nodeId = nodeIds[0];
			console.log(`Part loaded successfully, nodeId: ${nodeId}`);

			// Store metadata for this node
			nodePartMetadataRef.current.set(nodeId, { cadUrl, isPreset });

			// 设置零件位置
			const matrix = new window.Communicator.Matrix();
			const offsetX = (x - rect.width / 2) / 50;
			const offsetY = (rect.height / 2 - y) / 50;
			matrix.setTranslationComponent(offsetX, offsetY, 0);

			model.setNodeMatrix(nodeId, matrix);

			// 确保零件可见
			model.setNodesVisibility([nodeId], true);

			// 适配视图
			setTimeout(() => {
				viewer.view.fitWorld();
			}, 100);

			// 标记场景有修改
			setHasChanges(true);

			// 触发JSON viewer更新
			setTimeout(() => {
				jsonViewerRef.current?.refresh();
			}, 200);

			console.log(`Part added successfully from: ${cadUrl}`);
		} catch (err) {
			console.error("Drop failed:", err);

			// Provide user-friendly error messages
			let errorMessage = "Unknown error";
			if (err instanceof SyntaxError) {
				errorMessage = "Invalid part data format";
			} else if (err instanceof Error) {
				errorMessage = err.message;
			}

			alert(`Failed to load part: ${errorMessage}`);
		}
	}

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "copy";
	};

	async function handleDelete() {
		if (!selectedNodeId || !viewerRef.current) {
			return;
		}

		try {
			const model = viewerRef.current.model;

			// Find the part root node by traversing up the node tree
			// The part root node is the one that's in our metadata map
			let partRootNodeId = selectedNodeId;
			let currentNodeId = selectedNodeId;

			// Traverse up the node hierarchy to find a node that's in our metadata
			while (currentNodeId !== null && currentNodeId !== undefined) {
				if (nodePartMetadataRef.current.has(currentNodeId)) {
					partRootNodeId = currentNodeId;
					break;
				}

				// Get parent node
				try {
					const parentId = model.getNodeParent(currentNodeId);
					if (parentId === currentNodeId || parentId === null) {
						// Reached root or invalid parent
						break;
					}
					currentNodeId = parentId;
				} catch (err) {
					console.error("Error getting parent node:", err);
					break;
				}
			}

			// If we didn't find a part root in metadata, this might not be a part we added
			if (!nodePartMetadataRef.current.has(partRootNodeId)) {
				console.warn("Selected node is not part of a tracked part");
				alert("Cannot delete this node - it's not a recognized part");
				return;
			}

			// Delete the part root node (this will delete the entire subtree)
			const deleteResult = model.deleteNode(partRootNodeId);

			// If returns Promise, wait for completion
			if (deleteResult && typeof deleteResult.then === 'function') {
				await deleteResult;
			}

			// Remove node metadata
			nodePartMetadataRef.current.delete(partRootNodeId);

			setSelectedNodeId(null);
			setHasChanges(true);

			// Refresh JSON viewer after scene updates
			setTimeout(() => {
				jsonViewerRef.current?.refresh();
			}, 200);
		} catch (err) {
			console.error("Delete failed:", err);
		}
	}

	// 处理关闭 - 检查是否有修改
	function handleClose() {
		if (hasChanges) {
			// 有修改，提示保存
			setShowExitConfirm(true);
		} else {
			// 没有修改，直接关闭
			if (onClose) onClose();
		}
	}

	// 确认退出不保存
	function confirmExitWithoutSave() {
		setShowExitConfirm(false);
		if (onClose) onClose();
	}

	// 保存并退出（从退出确认对话框调用）
	async function saveAndExit() {
		setShowExitConfirm(false);

		if (isNewScene) {
			// 新场景需要命名，显示保存对话框
			// 设置标记表示保存后要退出
			setShouldExitAfterSave(true);
			setShowSaveDialog(true);
		} else {
			// 已有场景，直接保存并退出
			try {
				if (viewerRef.current) {
					// 序列化场景状态
					const config = await serializeScene(viewerRef.current, sceneId, nodePartMetadataRef.current);

					// 保存到数据库scene_json字段
					const { error } = await supabase
						.from("scenes")
						.update({
							scene_json: config,
							updated_at: new Date().toISOString(),
						})
						.eq("id", sceneId);

					if (error) throw error;
				}

				if (onSave) onSave();
				if (onClose) onClose();
			} catch (err) {
				console.error("Save failed:", err);
				alert(
					`Failed to save scene: ${
						err instanceof Error ? err.message : "Unknown error"
					}`
				);
			}
		}
	}

	// 保存场景
	async function handleSaveScene() {
		if (!formData.name.trim()) return;

		try {
			setStatus("Saving scene...");

			if (isNewScene) {
				// 新场景 - 创建到数据库
				const { data: newScene, error } = await supabase
					.from("scenes")
					.insert({
						name: formData.name,
						description: formData.description,
						})
					.select()
					.single();

				if (error) throw error;
				if (!newScene) throw new Error("Failed to create scene");

				const newSceneId = newScene.id;

				// 获取场景中的零件列表
				if (viewerRef.current) {
					const config = await serializeScene(viewerRef.current, newSceneId, nodePartMetadataRef.current);

					// 更新scene_json字段
						await supabase
						.from("scenes")
						.update({
							scene_json: config,
							})
						.eq("id", newSceneId);
				}

				setShowSaveDialog(false);
				setHasChanges(false);
				setStatus("Scene saved successfully!");

				if (onSave) onSave();

				// 如果是从saveAndExit调用的，则退出
				if (shouldExitAfterSave) {
					setShouldExitAfterSave(false);
					if (onClose) onClose();
				}
			} else {
				// 更新已有场景
				if (viewerRef.current) {
					const config = await serializeScene(viewerRef.current, sceneId, nodePartMetadataRef.current);

					// 更新数据库
						const { error } = await supabase
						.from("scenes")
						.update({
							name: formData.name,
							description: formData.description,
							scene_json: config,
								updated_at: new Date().toISOString(),
						})
						.eq("id", sceneId);

					if (error) throw error;
				} else {
					// 如果viewer不可用，只更新基本信息
					const { error } = await supabase
						.from("scenes")
						.update({
							name: formData.name,
							description: formData.description,
							updated_at: new Date().toISOString(),
						})
						.eq("id", sceneId);

					if (error) throw error;
				}

				setShowSaveDialog(false);
				setHasChanges(false);
				setStatus("Scene updated successfully!");

				if (onSave) onSave();

				// 如果是从saveAndExit调用的，则退出
				if (shouldExitAfterSave) {
					setShouldExitAfterSave(false);
					if (onClose) onClose();
				}
			}

			// 2秒后恢复状态
			setTimeout(() => {
				setStatus("Ready! Edit mode active");
			}, 2000);
		} catch (err) {
			console.error("Save failed:", err);
			setStatus("Save failed!");
			alert(
				`Failed to save scene: ${
					err instanceof Error ? err.message : "Unknown error"
				}`
			);
		}
	}

	// 快速保存（已有场景）
	async function quickSave() {
		if (isNewScene) {
			// 新场景需要命名
			setShowSaveDialog(true);
			return;
		}

		if (!viewerRef.current) {
			console.error("Viewer not ready for save");
			return;
		}

		// 更新已有场景
		try {
			setStatus("Saving scene...");

			// 序列化场景状态
			const config = await serializeScene(viewerRef.current, sceneId, nodePartMetadataRef.current);

			// 获取零件文件列表

			// 更新数据库scene_json字段
			const { error } = await supabase
				.from("scenes")
				.update({
					scene_json: config,
					updated_at: new Date().toISOString(),
				})
				.eq("id", sceneId);

			if (error) throw error;

			setHasChanges(false);
			setStatus(`Saved! ${config.parts.length} parts`);

			// 2秒后恢复状态
			setTimeout(() => {
				setStatus("Ready! Edit mode active");
			}, 2000);

			if (onSave) onSave();
			// 保存后不关闭，让用户继续工作
		} catch (err) {
			console.error("Save failed:", err);
			setStatus("Save failed!");
			alert(
				`Failed to save scene: ${
					err instanceof Error ? err.message : "Unknown error"
				}`
			);
		}
	}

	// Handle loading JSON data into the viewer
	async function handleLoadJsonData(config: SceneConfig) {
		if (!viewerRef.current) {
			console.error("Viewer not ready");
			return;
		}

		try {
			setStatus("Loading scene from JSON...");

			// deserializeScene now returns node metadata mapping
			const loadedMetadata = await deserializeScene(viewerRef.current, config);

			// Update nodePartMetadataRef with the loaded metadata
			nodePartMetadataRef.current = loadedMetadata;

			setHasChanges(true);
			setStatus(`Loaded! ${config.parts.length} parts from JSON`);

			setTimeout(() => {
				setStatus("Ready! Edit mode active");
			}, 2000);
		} catch (err) {
			console.error("Failed to load JSON:", err);
			setStatus("Load failed!");
		}
	}

	// Handle JSON viewer collapse/expand - resize 3D viewer
	function handleJsonViewerCollapse(_collapsed: boolean) {
		// Give time for the DOM to update, then resize viewer
		setTimeout(() => {
			if (viewerRef.current) {
				try {
					viewerRef.current.resizeCanvas();
				} catch (err) {
					console.error("Failed to resize viewer:", err);
				}
			}
		}, 100);
	}

	// Handle parts loaded from PartsList component
	const handlePartsLoaded = (allParts: any[]) => {
		setTotalPartsCount(allParts.length);
	};

	return (
		<div className="h-screen flex flex-col">
			{/* Header */}
			<div className="px-6 py-4 border-b bg-background flex justify-between items-center">
				<div>
					<h2 className="text-2xl font-bold">
						{scene?.name || "Scene"}
						{hasChanges && (
							<span className="text-muted-foreground text-sm ml-2">
								(Unsaved changes)
							</span>
						)}
					</h2>
					{scene?.description && (
						<p className="text-sm text-muted-foreground mt-1">
							{scene.description}
						</p>
					)}
				</div>
				<div className="flex gap-2 items-center">
					<span
						className={`text-xs ${
							status.includes("Ready") ? "text-green-600" : "text-orange-500"
						}`}>
						{status}
					</span>
					<Button onClick={quickSave} size="sm">
						<Save className="mr-2 h-4 w-4" />
						Save
					</Button>
					{onClose && (
						<Button onClick={handleClose} variant="outline" size="sm">
							<X className="mr-2 h-4 w-4" />
							Close
						</Button>
					)}
				</div>
			</div>

			{/* Main Content */}
			<div className="flex-1 flex overflow-hidden">
				{/* Left: 3D Viewer + JSON Viewer */}
				<div className="flex-1 flex flex-col overflow-hidden">
					{/* 3D Viewer */}
					<div
						ref={containerRef}
						onDrop={handleDrop}
						onDragOver={handleDragOver}
						className="flex-1 relative bg-background"
					/>

					{/* Scene JSON Viewer */}
					<SceneJsonViewer
						ref={jsonViewerRef}
						viewer={viewerRef.current}
						onLoadJson={handleLoadJsonData}
						onCollapse={handleJsonViewerCollapse}
						nodeMetadata={nodePartMetadataRef.current}
					/>
				</div>

				{/* Right: Parts List */}
				<div className="w-80 shrink-0 border-l">
					<PartsList parts={parts} onPartsLoaded={handlePartsLoaded} />
				</div>
			</div>

			{/* Footer */}
			<div className="px-6 py-3 border-t bg-muted/30 flex items-center justify-between">
				<span className="text-xs text-muted-foreground">
					{totalPartsCount > 0 ? totalPartsCount : parts.length} parts available | Drag parts to add • Select and click delete to remove
				</span>
				<div className="flex items-center gap-3">
					{selectedNodeId && (
						<>
							<span className="text-xs text-muted-foreground">
								Selected: Node {selectedNodeId}
							</span>
							<Button onClick={handleDelete} variant="destructive" size="sm">
								<Trash2 className="mr-2 h-3 w-3" />
								Delete
							</Button>
						</>
					)}
				</div>
			</div>

			{/* Save Dialog */}
			<Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Save Scene</DialogTitle>
						<DialogDescription>
							Enter a name and description for your scene
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="save-name">
								Name <span className="text-destructive">*</span>
							</Label>
							<Input
								id="save-name"
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								placeholder="Enter scene name"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="save-description">Description</Label>
							<Textarea
								id="save-description"
								value={formData.description}
								onChange={(e) =>
									setFormData({ ...formData, description: e.target.value })
								}
								placeholder="Enter scene description (optional)"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setShowSaveDialog(false)}>
							Cancel
						</Button>
						<Button onClick={handleSaveScene} disabled={!formData.name.trim()}>
							Save
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Exit Confirmation Dialog */}
			<AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Save your work?</AlertDialogTitle>
						<AlertDialogDescription>
							You have unsaved changes. Do you want to save this scene before
							closing?
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={confirmExitWithoutSave}>
							Don't Save
						</AlertDialogCancel>
						<AlertDialogAction onClick={saveAndExit}>Save</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
