import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Scene } from "../types";
import { SceneViewer } from "./SceneViewer";
import { SceneEditor } from "./SceneEditor";

export function ScenesList() {
	const [scenes, setScenes] = useState<Scene[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [editingScene, setEditingScene] = useState<Scene | null>(null);
	const [formData, setFormData] = useState({ name: "", description: "" });
	const [viewingSceneId, setViewingSceneId] = useState<string | null>(null);
	const [editingSceneId, setEditingSceneId] = useState<string | null>(null);

	async function loadScenes() {
		try {
			setLoading(true);
			setError(null);
			const { data, error: fetchError } = await supabase
				.from("scenes")
				.select("*")
				.order("updated_at", { ascending: false });

			if (fetchError) throw fetchError;
			setScenes(data || []);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load scenes");
		} finally {
			setLoading(false);
		}
	}

	async function createScene() {
		if (!formData.name.trim()) {
			alert("Scene name is required");
			return;
		}

		try {
			const { error: insertError } = await supabase
				.from("scenes")
				.insert({ name: formData.name, description: formData.description });

			if (insertError) throw insertError;

			setFormData({ name: "", description: "" });
			setShowCreateForm(false);
			await loadScenes();
		} catch (err) {
			alert(err instanceof Error ? err.message : "Failed to create scene");
		}
	}

	async function updateScene() {
		if (!editingScene || !formData.name.trim()) {
			alert("Scene name is required");
			return;
		}

		try {
			const { error: updateError } = await supabase
				.from("scenes")
				.update({ name: formData.name, description: formData.description })
				.eq("id", editingScene.id);

			if (updateError) throw updateError;

			setFormData({ name: "", description: "" });
			setEditingScene(null);
			await loadScenes();
		} catch (err) {
			alert(err instanceof Error ? err.message : "Failed to update scene");
		}
	}

	async function deleteScene(id: string, name: string) {
		if (!confirm(`Are you sure you want to delete "${name}"?`)) {
			return;
		}

		try {
			const { error: deleteError } = await supabase
				.from("scenes")
				.delete()
				.eq("id", id);

			if (deleteError) throw deleteError;
			await loadScenes();
		} catch (err) {
			alert(err instanceof Error ? err.message : "Failed to delete scene");
		}
	}

	function startEdit(scene: Scene) {
		setEditingScene(scene);
		setFormData({ name: scene.name, description: scene.description || "" });
		setShowCreateForm(false);
	}

	function cancelEdit() {
		setEditingScene(null);
		setFormData({ name: "", description: "" });
	}

	function startCreate() {
		setShowCreateForm(true);
		setEditingScene(null);
		setFormData({ name: "", description: "" });
	}

	useEffect(() => {
		loadScenes();
	}, []);

	// Show viewer if viewing a scene
	if (viewingSceneId) {
		return (
			<SceneViewer
				sceneId={viewingSceneId}
				onClose={() => setViewingSceneId(null)}
			/>
		);
	}

	// Show editor if editing a scene
	if (editingSceneId) {
		return (
			<SceneEditor
				sceneId={editingSceneId}
				onClose={() => setEditingSceneId(null)}
				onSave={() => {
					setEditingSceneId(null);
					loadScenes();
				}}
			/>
		);
	}

	if (loading) {
		return <div style={{ padding: "20px" }}>Loading scenes...</div>;
	}

	if (error) {
		return (
			<div style={{ padding: "20px", color: "red" }}>
				Error: {error}
				<button onClick={loadScenes} style={{ marginLeft: "10px" }}>
					Retry
				</button>
			</div>
		);
	}

	return (
		<div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: "20px",
				}}>
				<h1>Scenes</h1>
				<button
					onClick={startCreate}
					style={{
						padding: "10px 20px",
						backgroundColor: "#007bff",
						color: "white",
						border: "none",
						borderRadius: "4px",
						cursor: "pointer",
					}}>
					Create New Scene
				</button>
			</div>

			{(showCreateForm || editingScene) && (
				<div
					style={{
						padding: "20px",
						border: "1px solid #ddd",
						borderRadius: "4px",
						marginBottom: "20px",
						backgroundColor: "#f9f9f9",
					}}>
					<h2>{editingScene ? "Edit Scene" : "Create New Scene"}</h2>
					<div style={{ marginBottom: "10px" }}>
						<label style={{ display: "block", marginBottom: "5px" }}>
							Name <span style={{ color: "red" }}>*</span>
						</label>
						<input
							type="text"
							value={formData.name}
							onChange={(e) =>
								setFormData({ ...formData, name: e.target.value })
							}
							style={{
								width: "100%",
								padding: "8px",
								border: "1px solid #ccc",
								borderRadius: "4px",
							}}
							placeholder="Enter scene name"
						/>
					</div>
					<div style={{ marginBottom: "15px" }}>
						<label style={{ display: "block", marginBottom: "5px" }}>
							Description
						</label>
						<textarea
							value={formData.description}
							onChange={(e) =>
								setFormData({ ...formData, description: e.target.value })
							}
							style={{
								width: "100%",
								padding: "8px",
								border: "1px solid #ccc",
								borderRadius: "4px",
								minHeight: "80px",
							}}
							placeholder="Enter scene description"
						/>
					</div>
					<div style={{ display: "flex", gap: "10px" }}>
						<button
							onClick={editingScene ? updateScene : createScene}
							style={{
								padding: "8px 16px",
								backgroundColor: "#28a745",
								color: "white",
								border: "none",
								borderRadius: "4px",
								cursor: "pointer",
							}}>
							{editingScene ? "Update" : "Create"}
						</button>
						<button
							onClick={() => {
								setShowCreateForm(false);
								cancelEdit();
							}}
							style={{
								padding: "8px 16px",
								backgroundColor: "#6c757d",
								color: "white",
								border: "none",
								borderRadius: "4px",
								cursor: "pointer",
							}}>
							Cancel
						</button>
					</div>
				</div>
			)}

			{scenes.length === 0 ? (
				<p style={{ textAlign: "center", color: "#666", padding: "40px 0" }}>
					No scenes yet. Create your first scene!
				</p>
			) : (
				<div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
					{scenes.map((scene) => (
						<div
							key={scene.id}
							style={{
								padding: "15px",
								border: "1px solid #ddd",
								borderRadius: "4px",
								backgroundColor: "white",
							}}>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "start",
								}}>
								<div style={{ flex: 1 }}>
									<h3 style={{ margin: "0 0 8px 0" }}>{scene.name}</h3>
									{scene.description && (
										<p style={{ margin: "0 0 8px 0", color: "#666" }}>
											{scene.description}
										</p>
									)}
									<div style={{ fontSize: "12px", color: "#999" }}>
										<div>Assets: {scene.assets.length}</div>
										<div>
											Last updated:{" "}
											{new Date(scene.updated_at).toLocaleString()}
										</div>
									</div>
								</div>
								<div style={{ display: "flex", gap: "8px" }}>
									<button
										onClick={() => setViewingSceneId(scene.id)}
										style={{
											padding: "6px 12px",
											backgroundColor: "#17a2b8",
											color: "white",
											border: "none",
											borderRadius: "4px",
											cursor: "pointer",
										}}>
										View
									</button>
									<button
										onClick={() => setEditingSceneId(scene.id)}
										style={{
											padding: "6px 12px",
											backgroundColor: "#28a745",
											color: "white",
											border: "none",
											borderRadius: "4px",
											cursor: "pointer",
										}}>
										Edit 3D
									</button>
									<button
										onClick={() => startEdit(scene)}
										style={{
											padding: "6px 12px",
											backgroundColor: "#ffc107",
											color: "black",
											border: "none",
											borderRadius: "4px",
											cursor: "pointer",
										}}>
										Edit Info
									</button>
									<button
										onClick={() => deleteScene(scene.id, scene.name)}
										style={{
											padding: "6px 12px",
											backgroundColor: "#dc3545",
											color: "white",
											border: "none",
											borderRadius: "4px",
											cursor: "pointer",
										}}>
										Delete
									</button>
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
