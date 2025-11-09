import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Scene } from "../types";
import { PartsList } from "./PartsList";
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
	getScenePartFiles,
} from "@/lib/sceneSerializer";
import { saveSceneConfig, loadSceneConfig } from "@/lib/sceneStorage";
import { uploadPartAssets } from "@/lib/assetUpload";

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
	const [scene, setScene] = useState<Scene | null>(null);
	const [parts, setParts] = useState<Part[]>([]);
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
						.single();

					if (fetchError) throw fetchError;
					if (!data) throw new Error("Scene not found");

					if (!mounted) return;
					setScene(data);
				} else {
					// 新场景使用默认数据
					if (!mounted) return;
					setScene({
						id: "new",
						name: "Untitled Scene",
						description: "",
						assets: [],
						created_at: new Date().toISOString(),
						updated_at: new Date().toISOString(),
					} as Scene);
				}

				const response = await fetch("/parts/parts_list.json");
				const partsData = await response.json();

				const loadedParts: Part[] = partsData.parts.map(
					(part: { id: number; name: string }) => ({
						id: part.id.toString(),
						name: part.name
							.replace(/_/g, " ")
							.replace(/\b\w/g, (l: string) => l.toUpperCase()),
						fileName: `${part.name}.scs`,
						thumbnail: `/parts/${part.name}.png`,
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
							const config = await loadSceneConfig(sceneId);

							if (config && config.parts.length > 0) {
								console.log(
									`Loading ${config.parts.length} parts from saved config`
								);
								await deserializeScene(viewer, config);
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

			viewer.start().catch((err) => {
				console.error("Viewer start failed:", err);
				setStatus(`Failed to start editor: ${err.message}`);
				reject(err);
			});
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
			const partData = e.dataTransfer.getData("application/json");
			if (!partData) {
				console.error("No part data in drop event");
				return;
			}

			const part: Part = JSON.parse(partData);
			const viewer = viewerRef.current;
			const model = viewer.model;
			const rootNodeId = model.getRootNode();

			const rect = containerRef.current?.getBoundingClientRect();
			if (!rect) return;

			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;

			console.log(`Loading part: ${part.fileName} at position (${x}, ${y})`);

			// loadSubtreeFromScsFile 返回 Promise<NodeId[]>
			const nodeIds = await model.loadSubtreeFromScsFile(
				rootNodeId,
				`/parts/${part.fileName}`
			);

			if (!nodeIds || nodeIds.length === 0) {
				console.error("Failed to load part - no nodes returned");
				return;
			}

			const nodeId = nodeIds[0];
			console.log(`Part loaded successfully, nodeId: ${nodeId}`);

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

			console.log(`Part ${part.name} added successfully`);
		} catch (err) {
			console.error("Drop failed:", err);
			alert(
				`Failed to load part: ${
					err instanceof Error ? err.message : "Unknown error"
				}`
			);
		}
	}

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "copy";
	};

	function handleDelete() {
		if (!selectedNodeId || !viewerRef.current) {
			return;
		}

		try {
			const model = viewerRef.current.model;
			model.deleteNode(selectedNodeId);
			setSelectedNodeId(null);
			setHasChanges(true); // 标记有修改
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
					// 序列化并保存场景状态
					const config = await serializeScene(viewerRef.current, sceneId);
					await saveSceneConfig(sceneId, config);

					const partFiles = getScenePartFiles(viewerRef.current);

					const { error } = await supabase
						.from("scenes")
						.update({
							assets: partFiles,
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
						assets: [],
					})
					.select()
					.single();

				if (error) throw error;
				if (!newScene) throw new Error("Failed to create scene");

				const newSceneId = newScene.id;

				// 获取场景中的零件列表
				if (viewerRef.current) {
					setStatus("Uploading part assets...");

					const config = await serializeScene(viewerRef.current, newSceneId);
					await saveSceneConfig(newSceneId, config);

					// 上传每个零件的图片和SCSS文件
					const partNames = new Set<string>();
					for (const part of config.parts) {
						// 从文件名中提取零件名称（去掉.scs扩展名）
						const partName = part.fileName.replace(/\.scs$/i, "");
						partNames.add(partName);
					}

					// 并行上传所有零件的资产
					const uploadPromises = Array.from(partNames).map((partName) =>
						uploadPartAssets(newSceneId, partName).catch((err) => {
							console.error(`Failed to upload assets for ${partName}:`, err);
							return []; // 继续上传其他零件，即使某个失败
						})
					);

					await Promise.all(uploadPromises);

					// 更新assets字段
					const partFiles = getScenePartFiles(viewerRef.current);
					await supabase
						.from("scenes")
						.update({ assets: partFiles })
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
					setStatus("Uploading part assets...");

					const config = await serializeScene(viewerRef.current, sceneId);
					await saveSceneConfig(sceneId, config);

					// 上传每个零件的图片和SCSS文件
					const partNames = new Set<string>();
					for (const part of config.parts) {
						const partName = part.fileName.replace(/\.scs$/i, "");
						partNames.add(partName);
					}

					// 并行上传所有零件的资产
					const uploadPromises = Array.from(partNames).map((partName) =>
						uploadPartAssets(sceneId, partName).catch((err) => {
							console.error(`Failed to upload assets for ${partName}:`, err);
							return [];
						})
					);

					await Promise.all(uploadPromises);

					// 更新数据库
					const partFiles = getScenePartFiles(viewerRef.current);
					const { error } = await supabase
						.from("scenes")
						.update({
							name: formData.name,
							description: formData.description,
							assets: partFiles,
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

			// 1. 序列化场景状态
			const config = await serializeScene(viewerRef.current, sceneId);

			// 2. 保存到Storage
			await saveSceneConfig(sceneId, config);

			// 3. 获取零件文件列表
			const partFiles = getScenePartFiles(viewerRef.current);

			// 4. 上传每个零件的图片和SCSS文件
			setStatus("Uploading part assets...");

			const partNames = new Set<string>();
			for (const part of config.parts) {
				const partName = part.fileName.replace(/\.scs$/i, "");
				partNames.add(partName);
			}

			// 并行上传所有零件的资产
			const uploadPromises = Array.from(partNames).map((partName) =>
				uploadPartAssets(sceneId, partName).catch((err) => {
					console.error(`Failed to upload assets for ${partName}:`, err);
					return [];
				})
			);

			await Promise.all(uploadPromises);

			// 5. 更新数据库
			const { error } = await supabase
				.from("scenes")
				.update({
					assets: partFiles,
					updated_at: new Date().toISOString(),
				})
				.eq("id", sceneId);

			if (error) throw error;

			setHasChanges(false);
			setStatus(`Saved! ${config.parts.length} parts with assets uploaded`);

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

			{/* Toolbar */}
			<div className="px-6 py-3 border-b bg-muted/30 flex gap-2 items-center">
				<Button
					onClick={handleDelete}
					disabled={!selectedNodeId}
					variant="destructive"
					size="sm">
					<Trash2 className="mr-2 h-4 w-4" />
					Delete Selected
				</Button>
				<span className="text-xs text-muted-foreground ml-auto">
					{selectedNodeId ? `Selected: Node ${selectedNodeId}` : "No selection"}
				</span>
			</div>

			{/* Main Content */}
			<div className="flex-1 flex overflow-hidden">
				<div
					ref={containerRef}
					onDrop={handleDrop}
					onDragOver={handleDragOver}
					className="flex-1 relative bg-background"
				/>

				<div className="w-80 shrink-0 border-l">
					<PartsList parts={parts} />
				</div>
			</div>

			{/* Footer */}
			<div className="px-6 py-3 border-t bg-muted/30 text-xs text-muted-foreground">
				{parts.length} parts available | Drag to add, click to select, delete to
				remove
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
