/**
 * Part Upload Dialog Component
 * Allows users to upload CAD files and create new parts
 */

import { useState, useRef } from "react";
import { uploadCompletePart } from "@/services/partsManager";
import type { PartWithUrls } from "@/types/parts";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileIcon, ImageIcon, X, Loader2 } from "lucide-react";

interface PartUploadDialogProps {
	open: boolean;
	onClose: () => void;
	onSuccess: (part: PartWithUrls) => void;
}

export function PartUploadDialog({
	open,
	onClose,
	onSuccess,
}: PartUploadDialogProps) {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [cadFile, setCadFile] = useState<File | null>(null);
	const [imageFile, setImageFile] = useState<File | null>(null);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const cadInputRef = useRef<HTMLInputElement>(null);
	const imageInputRef = useRef<HTMLInputElement>(null);

	const handleCadFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setCadFile(file);
			setError(null);

			// Auto-fill part name with filename (without extension) if name is empty
			if (!name.trim()) {
				const fileNameWithoutExt = file.name.replace(
					/\.(scs|step|stp|stl)$/i,
					""
				);
				setName(fileNameWithoutExt);
			}
		}
	};

	const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			setImageFile(file);
		}
	};

	const handleRemoveCadFile = () => {
		setCadFile(null);
		if (cadInputRef.current) {
			cadInputRef.current.value = "";
		}
	};

	const handleRemoveImageFile = () => {
		setImageFile(null);
		if (imageInputRef.current) {
			imageInputRef.current.value = "";
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		// Validation
		if (!name.trim()) {
			setError("Part name is required");
			return;
		}

		if (!cadFile) {
			setError("CAD file is required");
			return;
		}

		setUploading(true);

		try {
			// Upload part (CAD + optional image + create record)
			const part = await uploadCompletePart(cadFile, imageFile, {
				name: name.trim(),
				description: description.trim() || undefined,
			});

			// Success callback
			onSuccess(part);

			// Reset form
			setName("");
			setDescription("");
			setCadFile(null);
			setImageFile(null);
			if (cadInputRef.current) cadInputRef.current.value = "";
			if (imageInputRef.current) imageInputRef.current.value = "";
		} catch (err) {
			setError(err instanceof Error ? err.message : "Upload failed");
		} finally {
			setUploading(false);
		}
	};

	const handleClose = () => {
		if (!uploading) {
			onClose();
			// Reset state
			setName("");
			setDescription("");
			setCadFile(null);
			setImageFile(null);
			setError(null);
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Upload New Part</DialogTitle>
					<DialogDescription>
						Upload a CAD file and optional thumbnail to create a new part. Part
						name will be auto-filled from the filename or custom.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					{/* CAD File Upload */}
					<div className="space-y-2">
						<Label htmlFor="cadFile">
							CAD File (.scs, .step, .stl){" "}
							<span className="text-red-500">*</span>
						</Label>
						<div className="flex items-center gap-2">
							<Input
								ref={cadInputRef}
								id="cadFile"
								type="file"
								accept=".scs,.step,.stp,.stl"
								onChange={handleCadFileChange}
								disabled={uploading}
								className="hidden"
							/>
							<Button
								type="button"
								variant="outline"
								onClick={() => cadInputRef.current?.click()}
								disabled={uploading}
								className="flex-1">
								<Upload className="w-4 h-4 mr-2" />
								{cadFile ? "Change File" : "Choose File"}
							</Button>
						</div>
						{cadFile && (
							<div className="flex items-center gap-2 p-2 bg-muted rounded-md">
								<FileIcon className="w-4 h-4 text-blue-500" />
								<span className="flex-1 text-sm truncate">{cadFile.name}</span>
								<span className="text-xs text-muted-foreground">
									{(cadFile.size / (1024 * 1024)).toFixed(2)} MB
								</span>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={handleRemoveCadFile}
									disabled={uploading}>
									<X className="w-4 h-4" />
								</Button>
							</div>
						)}
					</div>

					{/* Image File Upload (Optional) */}
					<div className="space-y-2">
						<Label htmlFor="imageFile">Thumbnail Image (Optional)</Label>
						<div className="flex items-center gap-2">
							<Input
								ref={imageInputRef}
								id="imageFile"
								type="file"
								accept="image/*"
								onChange={handleImageFileChange}
								disabled={uploading}
								className="hidden"
							/>
							<Button
								type="button"
								variant="outline"
								onClick={() => imageInputRef.current?.click()}
								disabled={uploading}
								className="flex-1">
								<ImageIcon className="w-4 h-4 mr-2" />
								{imageFile ? "Change Image" : "Choose Image"}
							</Button>
						</div>
						{imageFile && (
							<div className="flex items-center gap-2 p-2 bg-muted rounded-md">
								<ImageIcon className="w-4 h-4 text-green-500" />
								<span className="flex-1 text-sm truncate">
									{imageFile.name}
								</span>
								<span className="text-xs text-muted-foreground">
									{(imageFile.size / 1024).toFixed(0)} KB
								</span>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={handleRemoveImageFile}
									disabled={uploading}>
									<X className="w-4 h-4" />
								</Button>
							</div>
						)}
					</div>

					{/* Part Name */}
					<div className="space-y-2">
						<Label htmlFor="name">
							Part Name <span className="text-red-500">*</span>
						</Label>
						<Input
							id="name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g., Custom Bearing"
							disabled={uploading}
							required
						/>
					</div>

					{/* Description */}
					<div className="space-y-2">
						<Label htmlFor="description">Description (Optional)</Label>
						<Textarea
							id="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Brief description of the part..."
							rows={3}
							disabled={uploading}
						/>
					</div>

					{/* Error Message */}
					{error && (
						<div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
							{error}
						</div>
					)}

					{/* Footer Buttons */}
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={handleClose}
							disabled={uploading}>
							Cancel
						</Button>
						<Button type="submit" disabled={uploading || !cadFile || !name}>
							{uploading ? (
								<>
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
									Uploading...
								</>
							) : (
								"Upload Part"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
