/**
 * Type definitions for Parts and Assets management
 */

/**
 * Part record from database
 * Represents a single CAD part with associated files
 */
export interface Part {
	id: string;
	name: string;
	description?: string;
	file_id: string; // UUID of CAD file in assets-cad bucket
	image_id?: string; // UUID of thumbnail in assets-images bucket (optional)
	remarks?: string;
	is_system: boolean; // true = system preset, false = user uploaded
	del_flag: 0 | 1; // 0 = active, 1 = deleted
	created_at: string; // ISO timestamp
	updated_at: string; // ISO timestamp
}

/**
 * Data required to create a new part
 */
export interface PartCreateData {
	name: string;
	description?: string;
	file_id: string; // UUID after uploading to assets-cad
	image_id?: string; // UUID after uploading to assets-images (optional)
	remarks?: string;
	is_system?: boolean;
}

/**
 * Data for updating an existing part
 */
export interface PartUpdateData {
	name?: string;
	description?: string;
	remarks?: string;
	image_id?: string; // Allow updating thumbnail
}

/**
 * Asset record from database
 * Represents a collection of related parts
 */
export interface Asset {
	id: string;
	name: string;
	description?: string;
	remarks?: string;
	user_id?: string; // Reserved for future user authentication
	del_flag: 0 | 1;
	created_at: string;
	updated_at: string;
}

/**
 * Data required to create a new asset
 */
export interface AssetCreateData {
	name: string;
	description?: string;
	remarks?: string;
	user_id?: string;
}

/**
 * Asset with its associated parts (joined data)
 */
export interface AssetWithParts extends Asset {
	parts: Part[];
}

/**
 * Asset-Part junction table record
 */
export interface AssetPart {
	asset_id: string;
	part_id: string;
	sort_order: number;
	created_at: string;
}

/**
 * Part with public URLs for files
 * Used for display and loading in HOOPS Viewer
 */
export interface PartWithUrls extends Part {
	cad_url: string; // Public URL for CAD file
	image_url?: string; // Public URL for thumbnail (if exists)
}

/**
 * File upload result
 */
export interface FileUploadResult {
	file_id: string; // UUID of uploaded file
	file_path: string; // Storage path
	public_url: string; // Public URL to access file
}

/**
 * Options for listing parts
 */
export interface ListPartsOptions {
	include_deleted?: boolean; // Include soft-deleted parts
	is_system?: boolean; // Filter by system/user parts
	search?: string; // Search by name
	limit?: number;
	offset?: number;
}

/**
 * Options for listing assets
 */
export interface ListAssetsOptions {
	include_deleted?: boolean;
	user_id?: string; // Filter by user (for future)
	search?: string;
	limit?: number;
	offset?: number;
}
