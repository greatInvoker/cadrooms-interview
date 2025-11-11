/**
 * Integration tests for Scene management
 * Tests the complete workflow of creating, saving, and loading scenes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { serializeScene, deserializeScene } from '@/services/sceneSerializer'
import type { SceneConfig } from '@/types/sceneConfig'

// Mock HOOPS Communicator types
class MockMatrix {
  m: number[] = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]

  getAsArray(): number[] {
    return this.m
  }

  setTranslationComponent(x: number, y: number, z: number): void {
    this.m[3] = x
    this.m[7] = y
    this.m[11] = z
  }

  copy(): MockMatrix {
    const newMatrix = new MockMatrix()
    newMatrix.m = [...this.m]
    return newMatrix
  }
}

const createMockViewer = () => {
  const loadedParts: Map<number, { url: string; matrix: number[] }> = new Map()

  const mockModel = {
    getRootNode: vi.fn(() => 0),
    getNodeChildren: vi.fn(() => Array.from(loadedParts.keys())),
    getNodeName: vi.fn((nodeId: number) => {
      const part = loadedParts.get(nodeId)
      if (!part) return null
      const fileName = part.url.split('/').pop()
      return fileName?.replace('.scs', '') || `node_${nodeId}`
    }),
    getNodeMatrix: vi.fn((nodeId: number) => {
      const part = loadedParts.get(nodeId)
      const matrix = new MockMatrix()
      if (part) {
        matrix.m = part.matrix
      }
      return matrix
    }),
    getNodeVisibility: vi.fn(() => true),
    setNodeMatrix: vi.fn((nodeId: number, matrix: MockMatrix) => {
      const part = loadedParts.get(nodeId)
      if (part) {
        part.matrix = matrix.m
      }
    }),
    setNodesVisibility: vi.fn(),
    loadSubtreeFromScsFile: vi.fn((_, url: string) => {
      const newNodeId = loadedParts.size + 1
      loadedParts.set(newNodeId, {
        url,
        matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
      })
      return Promise.resolve([newNodeId])
    }),
  }

  const mockViewer = {
    model: mockModel,
    view: {
      fitWorld: vi.fn(),
    },
  }

  return {
    viewer: mockViewer as unknown as Communicator.WebViewer,
    loadedParts,
  }
}

beforeEach(() => {
  ;(global as any).Communicator = {
    Matrix: MockMatrix,
  }
  ;(global as any).window = global
})

describe('Scene Integration Tests', () => {
  describe('Complete Scene Workflow', () => {
    it('should serialize and deserialize a scene with parts', async () => {
      // Step 1: Create viewer and load parts
      const { viewer, loadedParts } = createMockViewer()

      // Simulate loading parts
      await viewer.model.loadSubtreeFromScsFile(0, '/preset_parts/axe.scs')
      await viewer.model.loadSubtreeFromScsFile(0, '/preset_parts/bearing_CS.scs')

      expect(loadedParts.size).toBe(2)

      // Step 2: Create metadata for parts
      const nodeMetadata = new Map<number, { cadUrl: string; isPreset: boolean }>()
      nodeMetadata.set(1, { cadUrl: '/preset_parts/axe.scs', isPreset: true })
      nodeMetadata.set(2, { cadUrl: '/preset_parts/bearing_CS.scs', isPreset: true })

      // Step 3: Serialize the scene
      const config = await serializeScene(viewer, 'test-scene', nodeMetadata)

      expect(config.parts).toHaveLength(2)
      expect(config.metadata.sceneId).toBe('test-scene')

      // Step 4: Create a new viewer to load the scene
      const { viewer: newViewer } = createMockViewer()

      // Step 5: Deserialize the scene
      const restoredMetadata = await deserializeScene(newViewer, config)

      // Step 6: Verify scene was restored correctly
      expect(restoredMetadata.size).toBe(2)
      expect(newViewer.model.loadSubtreeFromScsFile).toHaveBeenCalledTimes(2)
      expect(newViewer.model.setNodeMatrix).toHaveBeenCalledTimes(2)
    })

    it('should preserve transformation matrices across save/load', async () => {
      // Create viewer with custom transformations
      const { viewer } = createMockViewer()

      // Load a part
      await viewer.model.loadSubtreeFromScsFile(0, '/preset_parts/axe.scs')

      // Apply custom transformation
      const customMatrix = [2, 0, 0, 10, 0, 2, 0, 20, 0, 0, 2, 30, 0, 0, 0, 1]
      const matrix = new MockMatrix()
      matrix.m = customMatrix
      viewer.model.setNodeMatrix(1, matrix)

      // Create metadata
      const nodeMetadata = new Map()
      nodeMetadata.set(1, { cadUrl: '/preset_parts/axe.scs', isPreset: true })

      // Serialize
      const config = await serializeScene(viewer, 'transformed-scene', nodeMetadata)

      expect(config.parts[0].matrix).toEqual(customMatrix)

      // Deserialize into new viewer
      const { viewer: newViewer } = createMockViewer()
      await deserializeScene(newViewer, config)

      // Verify transformation was restored
      const setMatrixCall = vi.mocked(newViewer.model.setNodeMatrix).mock.calls[0]
      expect(setMatrixCall[1].m).toEqual(customMatrix)
    })

    it('should handle mixed preset and user-uploaded parts', async () => {
      const { viewer } = createMockViewer()

      // Load preset and user parts
      await viewer.model.loadSubtreeFromScsFile(0, '/preset_parts/axe.scs')
      await viewer.model.loadSubtreeFromScsFile(
        0,
        'https://storage.example.com/user-part.scs'
      )

      // Create metadata
      const nodeMetadata = new Map()
      nodeMetadata.set(1, { cadUrl: '/preset_parts/axe.scs', isPreset: true })
      nodeMetadata.set(2, {
        cadUrl: 'https://storage.example.com/user-part.scs',
        isPreset: false,
      })

      // Serialize
      const config = await serializeScene(viewer, 'mixed-scene', nodeMetadata)

      expect(config.parts[0].isPreset).toBe(true)
      expect(config.parts[1].isPreset).toBe(false)
      expect(config.parts[1].cadUrl).toBe('https://storage.example.com/user-part.scs')

      // Deserialize
      const { viewer: newViewer } = createMockViewer()
      const restoredMetadata = await deserializeScene(newViewer, config)

      // Verify both parts loaded with correct metadata
      expect(restoredMetadata.get(1)?.isPreset).toBe(true)
      expect(restoredMetadata.get(2)?.isPreset).toBe(false)
    })

    it('should handle empty scenes', async () => {
      const { viewer } = createMockViewer()

      // Serialize empty scene
      const config = await serializeScene(viewer, 'empty-scene')

      expect(config.parts).toHaveLength(0)

      // Deserialize empty scene
      const { viewer: newViewer } = createMockViewer()
      const restoredMetadata = await deserializeScene(newViewer, config)

      expect(restoredMetadata.size).toBe(0)
      expect(newViewer.model.loadSubtreeFromScsFile).not.toHaveBeenCalled()
    })

    it('should maintain scene metadata across save/load', async () => {
      const { viewer } = createMockViewer()

      await viewer.model.loadSubtreeFromScsFile(0, '/preset_parts/axe.scs')

      const nodeMetadata = new Map()
      nodeMetadata.set(1, { cadUrl: '/preset_parts/axe.scs', isPreset: true })

      // Serialize with specific scene ID
      const originalSceneId = 'original-scene-123'
      const config = await serializeScene(viewer, originalSceneId, nodeMetadata)

      // Verify metadata
      expect(config.metadata.sceneId).toBe(originalSceneId)
      expect(config.metadata.savedAt).toBeDefined()
      expect(config.version).toBe('1.0')

      // Deserialize
      const { viewer: newViewer } = createMockViewer()
      await deserializeScene(newViewer, config)

      // The scene ID should be preserved in the config
      expect(config.metadata.sceneId).toBe(originalSceneId)
    })

    it('should handle large scenes with many parts', async () => {
      const { viewer } = createMockViewer()

      // Load many parts
      const partCount = 20
      const nodeMetadata = new Map()

      for (let i = 0; i < partCount; i++) {
        await viewer.model.loadSubtreeFromScsFile(0, `/parts/part_${i}.scs`)
        nodeMetadata.set(i + 1, { cadUrl: `/parts/part_${i}.scs`, isPreset: false })
      }

      // Serialize
      const config = await serializeScene(viewer, 'large-scene', nodeMetadata)

      expect(config.parts).toHaveLength(partCount)

      // Deserialize
      const { viewer: newViewer } = createMockViewer()
      const restoredMetadata = await deserializeScene(newViewer, config)

      expect(restoredMetadata.size).toBe(partCount)
      expect(newViewer.model.loadSubtreeFromScsFile).toHaveBeenCalledTimes(partCount)
    })
  })

  describe('Error Handling', () => {
    it('should handle partial scene restoration gracefully', async () => {
      const { viewer } = createMockViewer()

      // Load parts
      await viewer.model.loadSubtreeFromScsFile(0, '/preset_parts/axe.scs')
      await viewer.model.loadSubtreeFromScsFile(0, '/preset_parts/bearing_CS.scs')

      const nodeMetadata = new Map()
      nodeMetadata.set(1, { cadUrl: '/preset_parts/axe.scs', isPreset: true })
      nodeMetadata.set(2, { cadUrl: '/preset_parts/bearing_CS.scs', isPreset: true })

      const config = await serializeScene(viewer, 'partial-scene', nodeMetadata)

      // Simulate one part failing to load
      const { viewer: newViewer } = createMockViewer()
      let callCount = 0
      newViewer.model.loadSubtreeFromScsFile = vi.fn(() => {
        callCount++
        if (callCount === 2) {
          return Promise.reject(new Error('Part not found'))
        }
        return Promise.resolve([callCount])
      })

      // Should not throw error
      const restoredMetadata = await deserializeScene(newViewer, config)

      // Only one part should be loaded
      expect(restoredMetadata.size).toBe(1)
    })

    it('should validate config version', async () => {
      const { viewer } = createMockViewer()

      const config: SceneConfig = {
        version: '1.0',
        parts: [],
        metadata: {
          sceneId: 'test',
          savedAt: new Date().toISOString(),
        },
      }

      // Should load successfully with correct version
      await expect(deserializeScene(viewer, config)).resolves.toBeDefined()
    })
  })

  describe('Scene Configuration Format', () => {
    it('should generate valid JSON configuration', async () => {
      const { viewer } = createMockViewer()

      await viewer.model.loadSubtreeFromScsFile(0, '/preset_parts/axe.scs')

      const nodeMetadata = new Map()
      nodeMetadata.set(1, { cadUrl: '/preset_parts/axe.scs', isPreset: true })

      const config = await serializeScene(viewer, 'json-test', nodeMetadata)

      // Should be JSON serializable
      const jsonString = JSON.stringify(config)
      expect(jsonString).toBeDefined()

      // Should be parseable
      const parsed = JSON.parse(jsonString)
      expect(parsed.version).toBe('1.0')
      expect(parsed.parts).toHaveLength(1)

      // Should deserialize correctly
      const { viewer: newViewer } = createMockViewer()
      await expect(deserializeScene(newViewer, parsed)).resolves.toBeDefined()
    })

    it('should include all required part fields', async () => {
      const { viewer } = createMockViewer()

      await viewer.model.loadSubtreeFromScsFile(0, '/preset_parts/axe.scs')

      const nodeMetadata = new Map()
      nodeMetadata.set(1, { cadUrl: '/preset_parts/axe.scs', isPreset: true })

      const config = await serializeScene(viewer, 'fields-test', nodeMetadata)

      const part = config.parts[0]

      // Required fields
      expect(part.nodeId).toBeDefined()
      expect(part.name).toBeDefined()
      expect(part.fileName).toBeDefined()
      expect(part.matrix).toBeDefined()
      expect(part.visible).toBeDefined()

      // Matrix should be 16 elements
      expect(part.matrix).toHaveLength(16)

      // Optional fields
      expect(part.cadUrl).toBeDefined()
      expect(part.isPreset).toBeDefined()
    })
  })
})
