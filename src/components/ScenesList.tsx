import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Scene } from "../types/Scene";
import { SceneEditor } from "./SceneEditor";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
import { Plus, FolderOpen, Trash2, Pencil } from "lucide-react";
import { SplineScene } from "@/components/ui/spline-scene";

export function ScenesList() {
	const [scenes, setScenes] = useState<Scene[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [editingMetaScene, setEditingMetaScene] = useState<Scene | null>(null);
	const [formData, setFormData] = useState({ name: "", description: "" });
	const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
	const [deletingScene, setDeletingScene] = useState<Scene | null>(null);
	const [highlightedSceneId, setHighlightedSceneId] = useState<string | null>(
		null
	);

	async function loadScenes() {
		try {
			setLoading(true);
			setError(null);
			const { data, error: fetchError } = await supabase
				.from("scenes")
				.select("*")
				.eq("del_flag", 0) // Only load active scenes (not deleted)
				.order("updated_at", { ascending: false });

			if (fetchError) throw fetchError;
			setScenes(data || []);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load scenes");
		} finally {
			setLoading(false);
		}
	}

	// 点击 "Create Scene" - 直接进入编辑器
	function startCreateNewScene() {
		setEditingSceneId("new"); // 使用特殊标识符表示新场景
	}

	function startEditMeta(scene: Scene) {
		setEditingMetaScene(scene);
		setFormData({ name: scene.name, description: scene.description || "" });
	}

	function cancelEditMeta() {
		setEditingMetaScene(null);
		setFormData({ name: "", description: "" });
	}

	async function updateSceneMeta() {
		if (!editingMetaScene || !formData.name.trim()) {
			return;
		}

		try {
			const { error: updateError } = await supabase
				.from("scenes")
				.update({ name: formData.name, description: formData.description })
				.eq("id", editingMetaScene.id);

			if (updateError) throw updateError;

			setFormData({ name: "", description: "" });
			setEditingMetaScene(null);
			await loadScenes();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to update scene");
		}
	}

	async function deleteScene(scene: Scene) {
		try {
			// Soft delete: set del_flag to 1
			const { error: deleteError } = await supabase
				.from("scenes")
				.update({
					del_flag: 1,
					updated_at: new Date().toISOString(),
				})
				.eq("id", scene.id);

			if (deleteError) throw deleteError;

			setDeletingScene(null);
			await loadScenes();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to delete scene");
		}
	}

	useEffect(() => {
		loadScenes();
	}, []);

	// Auto-remove highlight after 3 seconds
	useEffect(() => {
		if (highlightedSceneId) {
			const timer = setTimeout(() => {
				setHighlightedSceneId(null);
			}, 3000);

			return () => clearTimeout(timer);
		}
	}, [highlightedSceneId]);

	// Show editor if editing a scene
	if (editingSceneId) {
		return (
			<SceneEditor
				sceneId={editingSceneId}
				onClose={() => {
					const wasEditing = editingSceneId !== "new";
					const sceneIdToHighlight = wasEditing ? editingSceneId : null;
					setEditingSceneId(null);
					loadScenes().then(() => {
						if (sceneIdToHighlight) {
							setHighlightedSceneId(sceneIdToHighlight);
						}
					});
				}}
				onSave={() => {
					const wasEditing = editingSceneId !== "new";
					setEditingSceneId(null);
					loadScenes().then(() => {
						if (wasEditing) {
							// For existing scenes, highlight the edited scene
							setHighlightedSceneId(editingSceneId);
						} else {
							// For new scenes, highlight the first scene in the refreshed list
							// (it will be at the top due to updated_at sorting)
							setTimeout(() => {
								const firstScene = document.querySelector("[data-scene-card]");
								if (firstScene) {
									const sceneId = firstScene.getAttribute("data-scene-id");
									if (sceneId) {
										setHighlightedSceneId(sceneId);
									}
								}
							}, 100);
						}
					});
				}}
			/>
		);
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<p className="text-muted-foreground">Loading scenes...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen gap-4">
				<p className="text-destructive">Error: {error}</p>
				<Button onClick={loadScenes}>Retry</Button>
			</div>
		);
	}

	return (
		<div className="container mx-auto py-8 px-4 max-w-6xl">
			<div className="relative flex justify-between items-center min-h-[200px]">
				<h2 className="absolute left-0 top-0 text-3xl font-bold tracking-tight">
					CAD ROOMS
				</h2>
				<div>
					<h2 className="text-3xl tracking-tight">Scenes</h2>
					<p className="text-muted-foreground mt-2">
						Manage your 3D scenes and assemblies
					</p>
				</div>
				<div className="absolute inset-0">
					<SplineScene
						scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
						className="w-full h-full"
					/>
				</div>
				<Button
					onClick={startCreateNewScene}
					size="lg"
					className="relative z-10">
					<Plus className="mr-2 h-4 w-4" />
					Create Scene
				</Button>
			</div>
			{scenes.length === 0 ? (
				<Card className="text-center py-12">
					<CardHeader>
						<CardTitle>No scenes yet</CardTitle>
						<CardDescription>
							Get started by creating your first 3D scene
						</CardDescription>
					</CardHeader>
					<CardFooter className="justify-center">
						<Button onClick={startCreateNewScene} size="lg">
							<Plus className="mr-2 h-4 w-4" />
							Create Your First Scene
						</Button>
					</CardFooter>
				</Card>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{scenes.map((scene) => (
						<Card
							key={scene.id}
							data-scene-card
							data-scene-id={scene.id}
							className={`hover:shadow-lg transition-all duration-300 ${
								highlightedSceneId === scene.id ? "animate-highlight-fade" : ""
							}`}>
							<CardHeader className="relative">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => startEditMeta(scene)}
									className="absolute right-4 top-4 h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
									title="Edit scene info">
									<Pencil className="h-4 w-4" />
								</Button>
								<CardTitle className="pr-10">{scene.name}</CardTitle>
								{scene.description && (
									<CardDescription>{scene.description}</CardDescription>
								)}
							</CardHeader>
							<CardContent>
								<div className="space-y-1 text-sm text-muted-foreground">
									<div>Parts: {scene.scene_json?.parts?.length || 0}</div>
									<div>
										Updated: {new Date(scene.updated_at).toLocaleDateString()}
									</div>
								</div>
							</CardContent>
							<CardFooter className="flex justify-between items-center pl-6 pr-4 pb-6 pt-0">
								<Button
									variant="outline"
									size="sm"
									onClick={() => setEditingSceneId(scene.id)}>
									<FolderOpen className="mr-2 h-4 w-4" />
									Open
								</Button>
								<Button
									variant="destructive"
									size="sm"
									onClick={() => setDeletingScene(scene)}>
									<Trash2 className="h-4 w-4" />
								</Button>
							</CardFooter>
						</Card>
					))}
				</div>
			)}

			{/* Edit Scene Meta Dialog */}
			<Dialog
				open={!!editingMetaScene}
				onOpenChange={(open) => {
					if (!open) {
						cancelEditMeta();
					}
				}}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit Scene</DialogTitle>
						<DialogDescription>Update the scene information</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="name">
								Name <span className="text-destructive">*</span>
							</Label>
							<Input
								id="name"
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								placeholder="Enter scene name"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="description">Description</Label>
							<Textarea
								id="description"
								value={formData.description}
								onChange={(e) =>
									setFormData({ ...formData, description: e.target.value })
								}
								placeholder="Enter scene description (optional)"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={cancelEditMeta}>
							Cancel
						</Button>
						<Button onClick={updateSceneMeta} disabled={!formData.name.trim()}>
							Update
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<AlertDialog
				open={!!deletingScene}
				onOpenChange={(open) => !open && setDeletingScene(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently delete "{deletingScene?.name}". This action
							cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => deletingScene && deleteScene(deletingScene)}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
