import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Scene } from "../types/Scene";
import { PartsList } from "./PartsList";
import "../types/hoops.d.ts";
import { deserializeScene, type SceneConfig } from "@/lib/sceneSerializer";

interface SceneViewerProps {
	sceneId: string;
	onClose?: () => void;
}

interface Part {
	id: string;
	name: string;
	fileName: string;
	thumbnail?: string;
}

export function SceneViewer({ sceneId, onClose }: SceneViewerProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const viewerRef = useRef<Communicator.WebViewer | null>(null);
	const [scene, setScene] = useState<Scene | null>(null);
	const [parts, setParts] = useState<Part[]>([]);
	const [status, setStatus] = useState<string>("Initializing...");

	useEffect(() => {
		let mounted = true;

		async function init() {
			try {
				setStatus("Loading scene data...");

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

				setStatus("Initializing 3D viewer...");
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
	}, [sceneId]);

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

			const containerId = `viewer-${sceneId}`;
			containerRef.current.id = containerId;

			console.log("Creating viewer with container:", containerId);

			const viewer = new window.Communicator.WebViewer({
				containerId: containerId,
				empty: true, // 创建空场景
			});

			viewerRef.current = viewer;

			viewer.setCallbacks({
				sceneReady: async () => {
					console.log("Scene ready!");

					const view = viewer.getView();
					view.setBackgroundColor(
						new window.Communicator.Color(240, 240, 245),
						new window.Communicator.Color(200, 200, 210)
					);

					const axisTriad = view.getAxisTriad();
					axisTriad.enable();
					axisTriad.setAnchor(
						window.Communicator.OverlayAnchor.LowerLeftCorner
					);

					// Load saved scene state from database
					try {
						setStatus("Loading scene...");

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
							// deserializeScene now returns metadata, but SceneViewer doesn't need to store it
							await deserializeScene(viewer, config);
							setStatus(`${config.parts.length} parts loaded`);
						} else {
							setStatus("Empty scene");
						}
					} catch (err) {
						console.error("Failed to load scene state:", err);
						setStatus("Error loading scene");
					}

					resolve();
				},
				modelStructureReady: () => {
					console.log("Model structure ready");
				},
			});

			const startResult = viewer.start();

			// Handle both Promise and void return types
			if (startResult && typeof startResult.catch === "function") {
				startResult.catch((err) => {
					console.error("Viewer start failed:", err);
					setStatus(`Failed to start viewer: ${err.message}`);
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
			const partData = e.dataTransfer.getData("application/json");
			if (!partData) {
				console.error("No part data in drop event");
				return;
			}

			const part: Part = JSON.parse(partData);
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

			console.log(`Loading part: ${part.fileName} at position (${x}, ${y})`);

			// loadSubtreeFromScsFile 返回 Promise<NodeId[]>
			const nodeIds = await model.loadSubtreeFromScsFile(
				rootNodeId,
				`/preset_parts/${part.fileName}`
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

			console.log(`Part ${part.name} added successfully`);
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

	return (
		<div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
			<div
				style={{
					padding: "15px 20px",
					borderBottom: "1px solid #ddd",
					backgroundColor: "#f8f9fa",
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}>
				<div>
					<h2 style={{ margin: 0, fontSize: "20px" }}>
						{scene?.name || "Scene Viewer"}
					</h2>
					{scene?.description && (
						<p style={{ margin: "5px 0 0 0", color: "#666", fontSize: "14px" }}>
							{scene.description}
						</p>
					)}
				</div>
				<div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
					<span
						style={{
							fontSize: "12px",
							color: status.includes("Ready") ? "#28a745" : "#ff9800",
						}}>
						{status}
					</span>
					{onClose && (
						<button
							onClick={onClose}
							style={{
								padding: "8px 16px",
								backgroundColor: "#6c757d",
								color: "white",
								border: "none",
								borderRadius: "4px",
								cursor: "pointer",
							}}>
							Close
						</button>
					)}
				</div>
			</div>

			<div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
				<div
					ref={containerRef}
					onDrop={handleDrop}
					onDragOver={handleDragOver}
					style={{
						flex: 1,
						position: "relative",
						backgroundColor: "#f0f0f5",
					}}
				/>

				<div style={{ width: "300px", flexShrink: 0 }}>
					<PartsList parts={parts} />
				</div>
			</div>

			<div
				style={{
					padding: "10px 20px",
					borderTop: "1px solid #ddd",
					backgroundColor: "#f8f9fa",
					fontSize: "12px",
					color: "#666",
				}}>
				{parts.length} parts available
			</div>
		</div>
	);
}
