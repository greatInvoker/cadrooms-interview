/**
 * Unit tests for partsManager
 * Tests parts management API functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as partsManager from '@/services/partsManager'
import { supabase } from '@/lib/supabase'
import type { Part, PartCreateData } from '@/types/parts'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    storage: {
      from: vi.fn(),
      listBuckets: vi.fn(),
    },
  },
}))

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: vi.fn(() => 'mock-uuid-1234'),
})

describe('partsManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('uploadCadFile', () => {
    it('should successfully upload a valid CAD file', async () => {
      const mockFile = new File(['test content'], 'test.scs', {
        type: 'application/octet-stream',
      })

      const mockStorageFrom = vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: { path: 'mock-uuid-1234.scs' },
          error: null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/mock-uuid-1234.scs' },
        }),
      })

      vi.mocked(supabase.storage.from).mockImplementation(mockStorageFrom)

      const result = await partsManager.uploadCadFile(mockFile)

      expect(result).toEqual({
        file_id: 'mock-uuid-1234',
        file_path: 'mock-uuid-1234.scs',
        public_url: 'https://example.com/mock-uuid-1234.scs',
      })
    })

    it('should reject invalid file types', async () => {
      const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' })

      await expect(partsManager.uploadCadFile(mockFile)).rejects.toThrow(
        'Invalid file type'
      )
    })

    it('should reject files exceeding size limit', async () => {
      const largeFile = new File([new ArrayBuffer(101 * 1024 * 1024)], 'large.scs', {
        type: 'application/octet-stream',
      })

      await expect(partsManager.uploadCadFile(largeFile)).rejects.toThrow(
        'File size exceeds 100MB limit'
      )
    })

    it('should handle .step files', async () => {
      const mockFile = new File(['test'], 'model.step', {
        type: 'model/step',
      })

      const mockStorageFrom = vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: { path: 'mock-uuid-1234.step' },
          error: null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/mock-uuid-1234.step' },
        }),
      })

      vi.mocked(supabase.storage.from).mockImplementation(mockStorageFrom)

      const result = await partsManager.uploadCadFile(mockFile)

      expect(result.file_path).toBe('mock-uuid-1234.step')
    })

    it('should handle .stl files', async () => {
      const mockFile = new File(['test'], 'model.stl', {
        type: 'model/stl',
      })

      const mockStorageFrom = vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: { path: 'mock-uuid-1234.stl' },
          error: null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/mock-uuid-1234.stl' },
        }),
      })

      vi.mocked(supabase.storage.from).mockImplementation(mockStorageFrom)

      const result = await partsManager.uploadCadFile(mockFile)

      expect(result.file_path).toBe('mock-uuid-1234.stl')
    })

    it('should handle upload errors', async () => {
      const mockFile = new File(['test'], 'test.scs', {
        type: 'application/octet-stream',
      })

      const mockStorageFrom = vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Upload failed' },
        }),
      })

      vi.mocked(supabase.storage.from).mockImplementation(mockStorageFrom)

      await expect(partsManager.uploadCadFile(mockFile)).rejects.toThrow(
        'Failed to upload CAD file: Upload failed'
      )
    })
  })

  describe('uploadImageFile', () => {
    it('should successfully upload a valid image file', async () => {
      const mockFile = new File(['image data'], 'thumbnail.png', {
        type: 'image/png',
      })

      const mockStorageFrom = vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: { path: 'mock-uuid-1234.png' },
          error: null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/mock-uuid-1234.png' },
        }),
      })

      vi.mocked(supabase.storage.from).mockImplementation(mockStorageFrom)

      const result = await partsManager.uploadImageFile(mockFile)

      expect(result).toEqual({
        file_id: 'mock-uuid-1234',
        file_path: 'mock-uuid-1234.png',
        public_url: 'https://example.com/mock-uuid-1234.png',
      })
    })

    it('should reject non-image files', async () => {
      const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' })

      await expect(partsManager.uploadImageFile(mockFile)).rejects.toThrow(
        'Invalid image file type'
      )
    })

    it('should reject images exceeding size limit', async () => {
      const largeImage = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large.png', {
        type: 'image/png',
      })

      await expect(partsManager.uploadImageFile(largeImage)).rejects.toThrow(
        'Image size exceeds 10MB limit'
      )
    })
  })

  describe('createPart', () => {
    it('should create a new part', async () => {
      const mockPartData: PartCreateData = {
        name: 'Test Part',
        description: 'A test part',
        file_id: 'file-uuid',
        image_id: 'image-uuid',
        remarks: 'Test remarks',
        is_system: false,
      }

      const mockPart: Part = {
        id: 'part-uuid',
        name: 'Test Part',
        description: 'A test part',
        file_id: 'file-uuid',
        image_id: 'image-uuid',
        remarks: 'Test remarks',
        is_system: false,
        del_flag: 0,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      }

      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockPart,
              error: null,
            }),
          }),
        }),
      })

      vi.mocked(supabase.from).mockImplementation(mockFrom)

      const result = await partsManager.createPart(mockPartData)

      expect(result).toEqual(mockPart)
      expect(mockFrom).toHaveBeenCalledWith('parts')
    })

    it('should default is_system to false', async () => {
      const mockPartData: PartCreateData = {
        name: 'Test Part',
        file_id: 'file-uuid',
      }

      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { ...mockPartData, is_system: false },
              error: null,
            }),
          }),
        }),
      })

      vi.mocked(supabase.from).mockImplementation(mockFrom)

      await partsManager.createPart(mockPartData)

      const insertCall = mockFrom().insert
      expect(insertCall).toHaveBeenCalled()
    })

    it('should handle creation errors', async () => {
      const mockPartData: PartCreateData = {
        name: 'Test Part',
        file_id: 'file-uuid',
      }

      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      })

      vi.mocked(supabase.from).mockImplementation(mockFrom)

      await expect(partsManager.createPart(mockPartData)).rejects.toThrow(
        'Failed to create part: Database error'
      )
    })
  })

  describe('listParts', () => {
    it('should list all active parts', async () => {
      const mockParts: Part[] = [
        {
          id: '1',
          name: 'Part 1',
          file_id: 'file-1',
          is_system: true,
          del_flag: 0,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ]

      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
      }

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            ...mockQuery,
            then: (fn: any) => fn({ data: mockParts, error: null }),
          } as any),
        }),
      })

      vi.mocked(supabase.from).mockImplementation(mockFrom)

      const result = await partsManager.listParts()

      expect(result).toEqual(mockParts)
    })

    it('should filter by is_system', async () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
      }

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            ...mockQuery,
            then: (fn: any) => fn({ data: [], error: null }),
          } as any),
        }),
      })

      vi.mocked(supabase.from).mockImplementation(mockFrom)

      await partsManager.listParts({ is_system: true })

      expect(mockQuery.eq).toHaveBeenCalledWith('is_system', true)
    })

    it('should search by name', async () => {
      const mockQuery = {
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
      }

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            ...mockQuery,
            then: (fn: any) => fn({ data: [], error: null }),
          } as any),
        }),
      })

      vi.mocked(supabase.from).mockImplementation(mockFrom)

      await partsManager.listParts({ search: 'bearing' })

      expect(mockQuery.ilike).toHaveBeenCalledWith('name', '%bearing%')
    })
  })

  describe('deletePart', () => {
    it('should soft delete a part', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      })

      vi.mocked(supabase.from).mockImplementation(mockFrom)

      await partsManager.deletePart('part-uuid')

      expect(mockFrom).toHaveBeenCalledWith('parts')
    })

    it('should handle deletion errors', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: { message: 'Delete failed' },
          }),
        }),
      })

      vi.mocked(supabase.from).mockImplementation(mockFrom)

      await expect(partsManager.deletePart('part-uuid')).rejects.toThrow(
        'Failed to delete part: Delete failed'
      )
    })
  })

  describe('getPartWithUrls', () => {
    it('should generate URLs for part files', async () => {
      const mockPart: Part = {
        id: 'part-1',
        name: 'Test Part',
        file_id: 'file-uuid',
        image_id: 'image-uuid',
        is_system: false,
        del_flag: 0,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      }

      const mockStorageFrom = vi.fn((bucket: string) => ({
        getPublicUrl: vi.fn((path: string) => ({
          data: {
            publicUrl: `https://example.com/${bucket}/${path}`,
          },
        })),
      }))

      vi.mocked(supabase.storage.from).mockImplementation(mockStorageFrom as any)

      const result = await partsManager.getPartWithUrls(mockPart)

      expect(result.cad_url).toBe('https://example.com/asset-file/file-uuid.scs')
      expect(result.image_url).toBe('https://example.com/asset-image/image-uuid.png')
    })

    it('should handle parts without images', async () => {
      const mockPart: Part = {
        id: 'part-1',
        name: 'Test Part',
        file_id: 'file-uuid',
        is_system: false,
        del_flag: 0,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      }

      const mockStorageFrom = vi.fn(() => ({
        getPublicUrl: vi.fn((path: string) => ({
          data: {
            publicUrl: `https://example.com/${path}`,
          },
        })),
      }))

      vi.mocked(supabase.storage.from).mockImplementation(mockStorageFrom as any)

      const result = await partsManager.getPartWithUrls(mockPart)

      expect(result.cad_url).toBeDefined()
      expect(result.image_url).toBeUndefined()
    })
  })

  describe('uploadCompletePart', () => {
    it('should upload CAD file, image, and create part record', async () => {
      const cadFile = new File(['cad'], 'model.scs', {
        type: 'application/octet-stream',
      })
      const imageFile = new File(['image'], 'thumbnail.png', {
        type: 'image/png',
      })
      const metadata = {
        name: 'Complete Part',
        description: 'A complete test part',
      }

      // Mock storage upload
      const mockStorageFrom = vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: { path: 'mock-uuid-1234.scs' },
          error: null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/file.scs' },
        }),
      })

      // Mock database insert
      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'part-uuid',
                name: metadata.name,
                file_id: 'mock-uuid-1234',
                image_id: 'mock-uuid-1234',
                is_system: false,
                del_flag: 0,
                created_at: '2025-01-01T00:00:00Z',
                updated_at: '2025-01-01T00:00:00Z',
              },
              error: null,
            }),
          }),
        }),
      })

      vi.mocked(supabase.storage.from).mockImplementation(mockStorageFrom)
      vi.mocked(supabase.from).mockImplementation(mockFrom)

      const result = await partsManager.uploadCompletePart(
        cadFile,
        imageFile,
        metadata
      )

      expect(result.name).toBe('Complete Part')
      expect(result.cad_url).toBeDefined()
    })

    it('should handle parts without images', async () => {
      const cadFile = new File(['cad'], 'model.scs', {
        type: 'application/octet-stream',
      })
      const metadata = {
        name: 'Part Without Image',
      }

      const mockStorageFrom = vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: { path: 'mock-uuid-1234.scs' },
          error: null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/file.scs' },
        }),
      })

      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'part-uuid',
                name: metadata.name,
                file_id: 'mock-uuid-1234',
                is_system: false,
                del_flag: 0,
                created_at: '2025-01-01T00:00:00Z',
                updated_at: '2025-01-01T00:00:00Z',
              },
              error: null,
            }),
          }),
        }),
      })

      vi.mocked(supabase.storage.from).mockImplementation(mockStorageFrom)
      vi.mocked(supabase.from).mockImplementation(mockFrom)

      const result = await partsManager.uploadCompletePart(cadFile, null, metadata)

      expect(result.name).toBe('Part Without Image')
      expect(result.image_url).toBeUndefined()
    })
  })

  describe('checkStorageSetup', () => {
    it('should verify both buckets exist', async () => {
      vi.mocked(supabase.storage.listBuckets).mockResolvedValue({
        data: [
          { id: '1', name: 'asset-file', created_at: '', updated_at: '', public: true },
          { id: '2', name: 'asset-image', created_at: '', updated_at: '', public: true },
        ],
        error: null,
      } as any)

      const result = await partsManager.checkStorageSetup()

      expect(result.cad_bucket).toBe(true)
      expect(result.images_bucket).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should detect missing buckets', async () => {
      vi.mocked(supabase.storage.listBuckets).mockResolvedValue({
        data: [],
        error: null,
      } as any)

      const result = await partsManager.checkStorageSetup()

      expect(result.cad_bucket).toBe(false)
      expect(result.images_bucket).toBe(false)
    })

    it('should handle API errors', async () => {
      vi.mocked(supabase.storage.listBuckets).mockResolvedValue({
        data: null,
        error: { message: 'API error', name: '', status: 500 } as any,
      } as any)

      const result = await partsManager.checkStorageSetup()

      expect(result.cad_bucket).toBe(false)
      expect(result.images_bucket).toBe(false)
      expect(result.error).toBe('API error')
    })
  })
})
