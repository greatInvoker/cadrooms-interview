/**
 * Unit tests for sceneSerializer
 * Tests scene serialization and deserialization functionality
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

// Create mock HOOPS viewer
const createMockViewer = () => {
  const mockModel = {
    getRootNode: vi.fn(() => 0),
    getNodeChildren: vi.fn(() => [1, 2, 3]),
    getNodeName: vi.fn((nodeId: number) => {
      const names = ['axe', 'bearing_CS', 'bearing_pr_dw']
      return names[nodeId - 1] || `part_${nodeId}`
    }),
    getNodeMatrix: vi.fn(() => new MockMatrix()),
    getNodeVisibility: vi.fn(() => true),
    setNodeMatrix: vi.fn(),
    setNodesVisibility: vi.fn(),
    loadSubtreeFromScsFile: vi.fn(() => {
      return Promise.resolve([4])
    }),
  }

  const mockViewer = {
    model: mockModel,
    view: {
      fitWorld: vi.fn(),
    },
  }

  return mockViewer as unknown as Communicator.WebViewer
}

// Setup global Communicator mock
beforeEach(() => {
  ;(global as any).Communicator = {
    Matrix: MockMatrix,
  }
  ;(global as any).window = global
})

describe('sceneSerializer', () => {
  describe('serializeScene', () => {
    it('should serialize an empty scene', async () => {
      const viewer = createMockViewer()
      viewer.model.getNodeChildren = vi.fn(() => [])

      const result = await serializeScene(viewer, 'test-scene-1')

      expect(result).toBeDefined()
      expect(result.version).toBe('1.0')
      expect(result.parts).toEqual([])
      expect(result.metadata.sceneId).toBe('test-scene-1')
      expect(result.metadata.savedAt).toBeDefined()
    })

    it('should serialize a scene with preset parts', async () => {
      const viewer = createMockViewer()

      const result = await serializeScene(viewer, 'test-scene-2')

      expect(result.parts).toHaveLength(3)
      expect(result.parts[0].name).toBe('axe')
      expect(result.parts[0].isPreset).toBe(true)
      expect(result.parts[0].visible).toBe(true)
      expect(result.parts[0].matrix).toHaveLength(16)
    })

    it('should handle node metadata correctly', async () => {
      const viewer = createMockViewer()

      const nodeMetadata = new Map<number, { cadUrl: string; isPreset: boolean }>()
      nodeMetadata.set(1, {
        cadUrl: 'https://example.com/custom.scs',
        isPreset: false,
      })

      const result = await serializeScene(viewer, 'test-scene-3', nodeMetadata)

      expect(result.parts[0].cadUrl).toBe('https://example.com/custom.scs')
      expect(result.parts[0].isPreset).toBe(false)
    })

    it('should handle transformation matrices', async () => {
      const viewer = createMockViewer()
      const customMatrix = new MockMatrix()
      customMatrix.m = [2, 0, 0, 10, 0, 2, 0, 20, 0, 0, 2, 30, 0, 0, 0, 1]
      viewer.model.getNodeMatrix = vi.fn(() => customMatrix)

      const result = await serializeScene(viewer, 'test-scene-4')

      expect(result.parts[0].matrix).toEqual(customMatrix.m)
    })

    it('should skip nodes without names', async () => {
      const viewer = createMockViewer()
      viewer.model.getNodeName = vi.fn(() => null)

      const result = await serializeScene(viewer, 'test-scene-5')

      expect(result.parts).toHaveLength(0)
    })

    it('should throw error if model is not initialized', async () => {
      const viewer = createMockViewer()
      ;(viewer as any).model = null

      await expect(serializeScene(viewer, 'test-scene-6')).rejects.toThrow(
        'Viewer model not initialized'
      )
    })

    it('should handle visibility state correctly', async () => {
      const viewer = createMockViewer()
      let callCount = 0
      viewer.model.getNodeVisibility = vi.fn(() => {
        callCount++
        return callCount % 2 === 0 // Alternate between true and false
      })

      const result = await serializeScene(viewer, 'test-scene-7')

      expect(result.parts[0].visible).toBe(false)
      expect(result.parts[1].visible).toBe(true)
    })
  })

  describe('deserializeScene', () => {
    it('should deserialize a scene configuration', async () => {
      const viewer = createMockViewer()

      const config: SceneConfig = {
        version: '1.0',
        parts: [
          {
            nodeId: 1,
            name: 'axe',
            fileName: 'axe.scs',
            matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
            visible: true,
            isPreset: true,
            cadUrl: '/preset_parts/axe.scs',
          },
        ],
        metadata: {
          sceneId: 'test-scene',
          savedAt: new Date().toISOString(),
        },
      }

      const result = await deserializeScene(viewer, config)

      expect(viewer.model.loadSubtreeFromScsFile).toHaveBeenCalledWith(
        0,
        '/preset_parts/axe.scs'
      )
      expect(viewer.model.setNodeMatrix).toHaveBeenCalled()
      expect(viewer.model.setNodesVisibility).toHaveBeenCalled()
      expect(result.size).toBe(1)
      expect(result.get(4)).toEqual({
        cadUrl: '/preset_parts/axe.scs',
        isPreset: true,
      })
    })

    it('should handle preset parts without explicit cadUrl', async () => {
      const viewer = createMockViewer()

      const config: SceneConfig = {
        version: '1.0',
        parts: [
          {
            nodeId: 1,
            name: 'bearing_CS',
            fileName: 'bearing_CS.scs',
            matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
            visible: true,
            isPreset: true,
          },
        ],
        metadata: {
          sceneId: 'test-scene',
          savedAt: new Date().toISOString(),
        },
      }

      await deserializeScene(viewer, config)

      expect(viewer.model.loadSubtreeFromScsFile).toHaveBeenCalledWith(
        0,
        '/preset_parts/bearing_CS.scs'
      )
    })

    it('should restore transformation matrices correctly', async () => {
      const viewer = createMockViewer()

      const customMatrix = [2, 0, 0, 10, 0, 2, 0, 20, 0, 0, 2, 30, 0, 0, 0, 1]
      const config: SceneConfig = {
        version: '1.0',
        parts: [
          {
            nodeId: 1,
            name: 'test_part',
            fileName: 'test.scs',
            matrix: customMatrix,
            visible: true,
            isPreset: false,
            cadUrl: 'https://example.com/test.scs',
          },
        ],
        metadata: {
          sceneId: 'test-scene',
          savedAt: new Date().toISOString(),
        },
      }

      await deserializeScene(viewer, config)

      expect(viewer.model.setNodeMatrix).toHaveBeenCalled()
      const setMatrixCall = vi.mocked(viewer.model.setNodeMatrix).mock.calls[0]
      expect(setMatrixCall[1].m).toEqual(customMatrix)
    })

    it('should handle visibility restoration', async () => {
      const viewer = createMockViewer()

      const config: SceneConfig = {
        version: '1.0',
        parts: [
          {
            nodeId: 1,
            name: 'hidden_part',
            fileName: 'hidden.scs',
            matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
            visible: false,
            isPreset: false,
            cadUrl: 'https://example.com/hidden.scs',
          },
        ],
        metadata: {
          sceneId: 'test-scene',
          savedAt: new Date().toISOString(),
        },
      }

      await deserializeScene(viewer, config)

      expect(viewer.model.setNodesVisibility).toHaveBeenCalledWith([4], false)
    })

    it('should handle multiple parts', async () => {
      const viewer = createMockViewer()
      let loadCount = 0
      viewer.model.loadSubtreeFromScsFile = vi.fn(() => {
        loadCount++
        return Promise.resolve([loadCount + 10])
      })

      const config: SceneConfig = {
        version: '1.0',
        parts: [
          {
            nodeId: 1,
            name: 'part1',
            fileName: 'part1.scs',
            matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
            visible: true,
            isPreset: true,
            cadUrl: '/preset_parts/part1.scs',
          },
          {
            nodeId: 2,
            name: 'part2',
            fileName: 'part2.scs',
            matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
            visible: true,
            isPreset: true,
            cadUrl: '/preset_parts/part2.scs',
          },
        ],
        metadata: {
          sceneId: 'test-scene',
          savedAt: new Date().toISOString(),
        },
      }

      const result = await deserializeScene(viewer, config)

      expect(viewer.model.loadSubtreeFromScsFile).toHaveBeenCalledTimes(2)
      expect(result.size).toBe(2)
    })

    it('should continue loading even if one part fails', async () => {
      const viewer = createMockViewer()
      let callCount = 0
      viewer.model.loadSubtreeFromScsFile = vi.fn(() => {
        callCount++
        if (callCount === 1) {
          return Promise.reject(new Error('Failed to load'))
        }
        return Promise.resolve([callCount + 10])
      })

      const config: SceneConfig = {
        version: '1.0',
        parts: [
          {
            nodeId: 1,
            name: 'failing_part',
            fileName: 'fail.scs',
            matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
            visible: true,
            isPreset: false,
            cadUrl: 'https://example.com/fail.scs',
          },
          {
            nodeId: 2,
            name: 'success_part',
            fileName: 'success.scs',
            matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
            visible: true,
            isPreset: false,
            cadUrl: 'https://example.com/success.scs',
          },
        ],
        metadata: {
          sceneId: 'test-scene',
          savedAt: new Date().toISOString(),
        },
      }

      const result = await deserializeScene(viewer, config)

      expect(viewer.model.loadSubtreeFromScsFile).toHaveBeenCalledTimes(2)
      expect(result.size).toBe(1) // Only successful part
    })

    it('should throw error if model is not initialized', async () => {
      const viewer = createMockViewer()
      ;(viewer as any).model = null

      const config: SceneConfig = {
        version: '1.0',
        parts: [],
        metadata: {
          sceneId: 'test-scene',
          savedAt: new Date().toISOString(),
        },
      }

      await expect(deserializeScene(viewer, config)).rejects.toThrow(
        'Viewer model not initialized'
      )
    })

    it('should handle empty parts array', async () => {
      const viewer = createMockViewer()

      const config: SceneConfig = {
        version: '1.0',
        parts: [],
        metadata: {
          sceneId: 'test-scene',
          savedAt: new Date().toISOString(),
        },
      }

      const result = await deserializeScene(viewer, config)

      expect(result.size).toBe(0)
      expect(viewer.model.loadSubtreeFromScsFile).not.toHaveBeenCalled()
    })
  })
})
