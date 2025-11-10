/**
 * Parts List Component - Enhanced Version
 * Displays parts from database with upload functionality
 */

import { useState, useEffect } from "react";
import { listParts, getPartWithUrls, deletePart } from "@/lib/partsManager";
import type { PartWithUrls } from "@/types/parts";
import { PartUploadDialog } from "./PartUploadDialog";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, Package, Trash2 } from "lucide-react";
import { toast } from "sonner";
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

// Legacy Part interface for drag-drop compatibility
interface LegacyPart {
	id: string;
	name: string;
	fileName: string;
	thumbnail?: string;
}

interface PartsListProps {
	parts?: LegacyPart[]; // Legacy: from parts_list.json
	onPartDragStart?: (part: LegacyPart) => void;
	onPartsLoaded?: (parts: PartWithUrls[]) => void; // New: callback with DB parts
}

export function PartsList({
	parts: legacyParts,
	onPartDragStart,
	onPartsLoaded,
}: PartsListProps) {
	const [dbParts, setDbParts] = useState<PartWithUrls[]>([]);
	const [presetParts, setPresetParts] = useState<PartWithUrls[]>([]);
	const [loading, setLoading] = useState(true);
	const [showUploadDialog, setShowUploadDialog] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Delete confirmation dialog state
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [partToDelete, setPartToDelete] = useState<PartWithUrls | null>(null);
	const [deleting, setDeleting] = useState(false);

	// Load parts from database and preset parts on mount
	useEffect(() => {
		loadAllParts();
	}, []);

	const loadAllParts = async () => {
		setLoading(true);
		setError(null);

		try {
			// Load preset parts from static files
			const presetPartsLoaded = await loadPresetParts();

			// Load user uploaded parts from database
			const dbPartsLoaded = await loadPartsFromDB();

			// Notify parent component with all parts (preset + db)
			if (onPartsLoaded) {
				const allParts = [...presetPartsLoaded, ...dbPartsLoaded];
				onPartsLoaded(allParts);
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to load parts";
			setError(message);
			toast.error("Failed to load parts", {
				description: message,
			});
		} finally {
			setLoading(false);
		}
	};

	const loadPresetParts = async () => {
		try {
			// Fetch parts list from preset_parts
			const response = await fetch("/preset_parts/parts_list.json");
			if (!response.ok) {
				throw new Error("Failed to load preset parts list");
			}

			const data = await response.json();
			const parts: PartWithUrls[] = data.parts.map((part: { id: number; name: string }) => ({
				id: `preset-${part.id}`,
				name: part.name,
				description: "System preset part",
				file_id: part.name,
				image_id: part.name,
				remarks: undefined,
				is_system: true,
				del_flag: 0,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				cad_url: `/preset_parts/${part.name}.scs`,
				image_url: `/preset_parts/${part.name}.png`,
			}));

			setPresetParts(parts);
			return parts; // Return loaded parts
		} catch (err) {
			console.error("Failed to load preset parts:", err);
			return []; // Return empty array on error
		}
	};

	const loadPartsFromDB = async () => {
		try {
			// Fetch user uploaded parts only
			const parts = await listParts({
				include_deleted: false,
				is_system: false // Only get user uploaded parts
			});

			// Get public URLs for all parts
			const partsWithUrls = await Promise.all(
				parts.map(async (part) => {
					try {
						return await getPartWithUrls(part);
					} catch (err) {
						console.error(`Failed to get URLs for part ${part.name}:`, err);
						// Return part without URLs
						return {
							...part,
							cad_url: "",
							image_url: undefined,
						} as PartWithUrls;
					}
				})
			);

			setDbParts(partsWithUrls);
			return partsWithUrls; // Return loaded parts
		} catch (err) {
			console.error("Failed to load database parts:", err);
			return []; // Return empty array on error
		}
	};

	const handleUploadSuccess = async (part: PartWithUrls) => {
		toast.success("Part uploaded successfully!", {
			description: `${part.name} is now available in your library`,
		});

		// Refresh parts list
		await loadAllParts();

		// Close dialog
		setShowUploadDialog(false);
	};

	const handleDragStart = (e: React.DragEvent, part: PartWithUrls) => {
		e.dataTransfer.effectAllowed = "copy";

		// Convert DB part to legacy format for drag-drop compatibility
		const legacyPart: LegacyPart = {
			id: part.id,
			name: part.name,
			fileName: `${part.file_id}.scs`, // Use file_id for now
			thumbnail: part.image_url,
		};

		e.dataTransfer.setData("application/json", JSON.stringify(legacyPart));

		// Also pass the full part with URLs
		e.dataTransfer.setData("part-with-urls", JSON.stringify(part));

		if (onPartDragStart) {
			onPartDragStart(legacyPart);
		}
	};

	// Handle delete button click
	const handleDeleteClick = (e: React.MouseEvent, part: PartWithUrls) => {
		e.stopPropagation(); // Prevent drag start
		setPartToDelete(part);
		setShowDeleteDialog(true);
	};

	// Confirm and execute delete
	const handleConfirmDelete = async () => {
		if (!partToDelete) return;

		setDeleting(true);
		try {
			await deletePart(partToDelete.id);

			toast.success("Part deleted successfully", {
				description: `${partToDelete.name} has been removed from your library`,
			});

			// Refresh parts list
			await loadAllParts();

			// Close dialog
			setShowDeleteDialog(false);
			setPartToDelete(null);
		} catch (err) {
			console.error("Failed to delete part:", err);
			const message = err instanceof Error ? err.message : "Unknown error";
			toast.error("Failed to delete part", {
				description: message,
			});
		} finally {
			setDeleting(false);
		}
	};

	// Cancel delete
	const handleCancelDelete = () => {
		setShowDeleteDialog(false);
		setPartToDelete(null);
	};

	// Merge preset parts and DB parts for display
	const allParts = [...presetParts, ...dbParts];

	// If legacy parts provided and all parts is empty, use legacy (fallback)
	const displayParts =
		allParts.length > 0 || !legacyParts ? allParts : legacyParts;

	return (
		<div
			style={{
				height: "100%",
				display: "flex",
				flexDirection: "column",
				backgroundColor: "#fff",
				borderLeft: "1px solid #ddd",
			}}
		>
			{/* Header */}
			<div
				style={{
					padding: "15px",
					borderBottom: "1px solid #ddd",
					backgroundColor: "#f8f9fa",
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						marginBottom: "10px",
					}}
				>
					<h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600" }}>
						Parts Library
					</h3>
					<Button
						size="sm"
						onClick={() => setShowUploadDialog(true)}
						disabled={loading}
						className="h-8"
					>
						<Upload className="w-4 h-4 mr-1" />
						Upload
					</Button>
				</div>
				<p style={{ margin: 0, fontSize: "12px", color: "#666" }}>
					Drag parts to the 3D view
				</p>
			</div>

			{/* Content */}
			<div
				style={{
					flex: 1,
					overflowY: "auto",
					padding: "10px",
				}}
			>
				{loading ? (
					<div
						style={{
							textAlign: "center",
							padding: "40px 20px",
							color: "#999",
						}}
					>
						<Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-gray-400" />
						<p>Loading parts...</p>
					</div>
				) : error ? (
					<div
						style={{
							textAlign: "center",
							padding: "40px 20px",
							color: "#dc2626",
						}}
					>
						<p>Failed to load parts</p>
						<p style={{ fontSize: "12px", marginTop: "10px" }}>{error}</p>
						<Button
							size="sm"
							variant="outline"
							onClick={loadAllParts}
							className="mt-4"
						>
							Retry
						</Button>
					</div>
				) : displayParts.length === 0 ? (
					<div
						style={{
							textAlign: "center",
							padding: "40px 20px",
							color: "#999",
						}}
					>
						<Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
						<p>No parts available</p>
						<p style={{ fontSize: "12px", marginTop: "10px" }}>
							Upload CAD files to get started
						</p>
						<Button
							size="sm"
							onClick={() => setShowUploadDialog(true)}
							className="mt-4"
						>
							<Upload className="w-4 h-4 mr-2" />
							Upload First Part
						</Button>
					</div>
				) : (
					<div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
						{allParts.map((part) => (
							<div
								key={part.id}
								draggable
								onDragStart={(e) => handleDragStart(e, part)}
								style={{
									padding: "12px",
									border: "1px solid #ddd",
									borderRadius: "4px",
									backgroundColor: "#fff",
									cursor: "grab",
									transition: "all 0.2s",
									position: "relative",
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.backgroundColor = "#f8f9fa";
									e.currentTarget.style.borderColor = "#007bff";
									e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.backgroundColor = "#fff";
									e.currentTarget.style.borderColor = "#ddd";
									e.currentTarget.style.boxShadow = "none";
								}}
							>
								<div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
									{/* Thumbnail */}
									<div
										style={{
											width: "50px",
											height: "50px",
											backgroundColor: "#e9ecef",
											borderRadius: "4px",
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											fontSize: "20px",
											overflow: "hidden",
											position: "relative",
										}}
									>
										{part.image_url ? (
											<img
												src={part.image_url}
												alt={part.name}
												style={{
													width: "100%",
													height: "100%",
													objectFit: "contain",
													backgroundColor: "#fff",
												}}
												onError={(e) => {
													e.currentTarget.style.display = "none";
													if (e.currentTarget.parentElement) {
														e.currentTarget.parentElement.innerHTML = "📦";
													}
												}}
											/>
										) : (
											"📦"
										)}
										{/* System Part Badge */}
										{part.is_system && (
											<div
												style={{
													position: "absolute",
													top: "2px",
													right: "2px",
													backgroundColor: "#3b82f6",
													color: "#fff",
													fontSize: "8px",
													padding: "2px 4px",
													borderRadius: "2px",
													fontWeight: "600",
												}}
											>
												SYS
											</div>
										)}
									</div>

									{/* Part Info */}
									<div style={{ flex: 1, minWidth: 0 }}>
										<div
											style={{
												fontWeight: "500",
												fontSize: "14px",
												overflow: "hidden",
												textOverflow: "ellipsis",
												whiteSpace: "nowrap",
											}}
											title={part.name}
										>
											{part.name}
										</div>
										{part.description && (
											<div
												style={{
													fontSize: "11px",
													color: "#999",
													overflow: "hidden",
													textOverflow: "ellipsis",
													whiteSpace: "nowrap",
												}}
												title={part.description}
											>
												{part.description}
											</div>
										)}
									</div>

									{/* Actions */}
									<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
										{/* Delete button - only for user uploaded parts */}
										{!part.is_system && (
											<button
												onClick={(e) => handleDeleteClick(e, part)}
												style={{
													background: "none",
													border: "none",
													cursor: "pointer",
													padding: "4px",
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
													color: "#dc2626",
													borderRadius: "4px",
													transition: "background-color 0.2s",
												}}
												onMouseEnter={(e) => {
													e.currentTarget.style.backgroundColor = "#fee2e2";
												}}
												onMouseLeave={(e) => {
													e.currentTarget.style.backgroundColor = "transparent";
												}}
												title="Delete part"
											>
												<Trash2 className="w-4 h-4" />
											</button>
										)}

										{/* Drag Handle */}
										<div
											style={{
												fontSize: "18px",
												color: "#999",
											}}
										>
											⋮⋮
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Upload Dialog */}
			<PartUploadDialog
				open={showUploadDialog}
				onClose={() => setShowUploadDialog(false)}
				onSuccess={handleUploadSuccess}
			/>

			{/* Delete Confirmation Dialog */}
			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Part</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete <strong>{partToDelete?.name}</strong>?
							<br />
							<br />
							This action cannot be undone. The part will be removed from your library.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={handleCancelDelete} disabled={deleting}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleConfirmDelete}
							disabled={deleting}
							className="bg-red-600 hover:bg-red-700"
						>
							{deleting ? (
								<>
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
									Deleting...
								</>
							) : (
								"Delete"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
