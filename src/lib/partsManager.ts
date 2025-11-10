/**
 * Parts Manager API
 * Handles all operations related to CAD parts management
 */

import { supabase } from "./supabase";
import type {
	Part,
	PartCreateData,
	PartUpdateData,
	PartWithUrls,
	FileUploadResult,
	ListPartsOptions,
} from "@/types/parts";

const CAD_BUCKET = "asset-file";
const IMAGES_BUCKET = "asset-image";

/**
 * Upload a CAD file to Storage
 * @param file CAD file (.scs, .step, .stl)
 * @returns Upload result with file_id and URLs
 */
export async function uploadCadFile(file: File): Promise<FileUploadResult> {
	// Validate file type
	const validExtensions = [".scs", ".step", ".stp", ".stl"];
	const fileName = file.name.toLowerCase();
	const isValid = validExtensions.some((ext) => fileName.endsWith(ext));

	if (!isValid) {
		throw new Error(
			`Invalid file type. Allowed: ${validExtensions.join(", ")}`
		);
	}

	// Validate file size (100MB limit)
	const MAX_SIZE = 100 * 1024 * 1024;
	if (file.size > MAX_SIZE) {
		throw new Error("File size exceeds 100MB limit");
	}

	// Generate unique file path with UUID
	const fileExt = fileName.split(".").pop();
	const fileId = crypto.randomUUID();
	const filePath = `${fileId}.${fileExt}`;

	// Upload to Storage
	const { data, error } = await supabase.storage
		.from(CAD_BUCKET)
		.upload(filePath, file, {
			cacheControl: "3600",
			upsert: false,
		});

	if (error) {
		throw new Error(`Failed to upload CAD file: ${error.message}`);
	}

	// Get public URL
	const {
		data: { publicUrl },
	} = supabase.storage.from(CAD_BUCKET).getPublicUrl(filePath);

	return {
		file_id: fileId,
		file_path: data.path,
		public_url: publicUrl,
	};
}

/**
 * Upload a thumbnail image to Storage
 * @param file Image file (.png, .jpg, .webp)
 * @returns Upload result with image_id and URLs
 */
export async function uploadImageFile(file: File): Promise<FileUploadResult> {
	// Validate file type
	if (!file.type.startsWith("image/")) {
		throw new Error("Invalid image file type");
	}

	// Validate file size (10MB limit)
	const MAX_SIZE = 10 * 1024 * 1024;
	if (file.size > MAX_SIZE) {
		throw new Error("Image size exceeds 10MB limit");
	}

	// Generate unique file path
	const fileExt = file.name.split(".").pop()?.toLowerCase() || "png";
	const imageId = crypto.randomUUID();
	const filePath = `${imageId}.${fileExt}`;

	// Upload to Storage
	const { data, error } = await supabase.storage
		.from(IMAGES_BUCKET)
		.upload(filePath, file, {
			cacheControl: "3600",
			upsert: false,
		});

	if (error) {
		throw new Error(`Failed to upload image: ${error.message}`);
	}

	// Get public URL
	const {
		data: { publicUrl },
	} = supabase.storage.from(IMAGES_BUCKET).getPublicUrl(filePath);

	return {
		file_id: imageId,
		file_path: data.path,
		public_url: publicUrl,
	};
}

/**
 * Create a new part record in database
 * @param data Part data (must include file_id after uploading files)
 * @returns Created part record
 */
export async function createPart(data: PartCreateData): Promise<Part> {
	const { data: part, error } = await supabase
		.from("parts")
		.insert({
			name: data.name,
			description: data.description,
			file_id: data.file_id,
			image_id: data.image_id,
			remarks: data.remarks,
			is_system: data.is_system || false,
		})
		.select()
		.single();

	if (error) {
		throw new Error(`Failed to create part: ${error.message}`);
	}

	return part;
}

/**
 * List all parts (system + user uploaded)
 * @param options Filter and pagination options
 * @returns Array of parts
 */
export async function listParts(
	options: ListPartsOptions = {}
): Promise<Part[]> {
	let query = supabase
		.from("parts")
		.select("*")
		.order("created_at", { ascending: false });

	// Filter by del_flag
	if (!options.include_deleted) {
		query = query.eq("del_flag", 0);
	}

	// Filter by is_system
	if (options.is_system !== undefined) {
		query = query.eq("is_system", options.is_system);
	}

	// Search by name
	if (options.search) {
		query = query.ilike("name", `%${options.search}%`);
	}

	// Pagination
	if (options.limit) {
		query = query.limit(options.limit);
	}
	if (options.offset) {
		query = query.range(options.offset, options.offset + (options.limit || 10));
	}

	const { data, error } = await query;

	if (error) {
		throw new Error(`Failed to list parts: ${error.message}`);
	}

	return data || [];
}

/**
 * Get a single part by ID
 * @param partId Part UUID
 * @returns Part record
 */
export async function getPart(partId: string): Promise<Part> {
	const { data, error } = await supabase
		.from("parts")
		.select("*")
		.eq("id", partId)
		.eq("del_flag", 0)
		.single();

	if (error) {
		throw new Error(`Failed to get part: ${error.message}`);
	}

	return data;
}

/**
 * Update a part record
 * @param partId Part UUID
 * @param data Update data
 * @returns Updated part
 */
export async function updatePart(
	partId: string,
	data: PartUpdateData
): Promise<Part> {
	const { data: part, error } = await supabase
		.from("parts")
		.update(data)
		.eq("id", partId)
		.select()
		.single();

	if (error) {
		throw new Error(`Failed to update part: ${error.message}`);
	}

	return part;
}

/**
 * Delete a part (soft delete)
 * @param partId Part UUID
 */
export async function deletePart(partId: string): Promise<void> {
	const { error } = await supabase
		.from("parts")
		.update({ del_flag: 1 })
		.eq("id", partId);

	if (error) {
		throw new Error(`Failed to delete part: ${error.message}`);
	}
}

/**
 * Get public URLs for part files
 * @param part Part record
 * @returns Part with public URLs
 */
export async function getPartWithUrls(part: Part): Promise<PartWithUrls> {
	// Get CAD file URL
	const cadPath = `${part.file_id}.scs`; // Assume .scs for now
	const {
		data: { publicUrl: cadUrl },
	} = supabase.storage.from(CAD_BUCKET).getPublicUrl(cadPath);

	// Get image URL if exists
	let imageUrl: string | undefined;
	if (part.image_id) {
		const imagePath = `${part.image_id}.png`; // Assume .png for now
		const {
			data: { publicUrl },
		} = supabase.storage.from(IMAGES_BUCKET).getPublicUrl(imagePath);
		imageUrl = publicUrl;
	}

	return {
		...part,
		cad_url: cadUrl,
		image_url: imageUrl,
	};
}

/**
 * Get public URLs for multiple parts
 * @param parts Array of parts
 * @returns Array of parts with URLs
 */
export async function getPartsWithUrls(parts: Part[]): Promise<PartWithUrls[]> {
	return Promise.all(parts.map((part) => getPartWithUrls(part)));
}

/**
 * Upload a complete part (CAD + optional image + create record)
 * Convenience function for full upload workflow
 *
 * @param cadFile CAD file
 * @param imageFile Optional thumbnail image
 * @param metadata Part metadata (name, description, etc.)
 * @returns Created part with URLs
 */
export async function uploadCompletePart(
	cadFile: File,
	imageFile: File | null,
	metadata: { name: string; description?: string; remarks?: string }
): Promise<PartWithUrls> {
	// Step 1: Upload CAD file
	const cadResult = await uploadCadFile(cadFile);

	// Step 2: Upload image (if provided)
	let imageResult: FileUploadResult | null = null;
	if (imageFile) {
		imageResult = await uploadImageFile(imageFile);
	}

	// Step 3: Create part record
	const part = await createPart({
		name: metadata.name,
		description: metadata.description,
		remarks: metadata.remarks,
		file_id: cadResult.file_id,
		image_id: imageResult?.file_id,
		is_system: false,
	});

	// Step 4: Return part with URLs
	return getPartWithUrls(part);
}

/**
 * Check if storage buckets are properly configured
 * @returns Setup status
 */
export async function checkStorageSetup(): Promise<{
	cad_bucket: boolean;
	images_bucket: boolean;
	error?: string;
}> {
	try {
		const { data: buckets, error } = await supabase.storage.listBuckets();

		if (error) {
			return {
				cad_bucket: false,
				images_bucket: false,
				error: error.message,
			};
		}

		const cadBucketExists = buckets?.some((b) => b.name === CAD_BUCKET);
		const imagesBucketExists = buckets?.some((b) => b.name === IMAGES_BUCKET);

		return {
			cad_bucket: cadBucketExists || false,
			images_bucket: imagesBucketExists || false,
		};
	} catch (error) {
		return {
			cad_bucket: false,
			images_bucket: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}
