// TypeScript type definitions for HOOPS Web Viewer
// Based on https://github.com/techsoft3d/hoops-web-viewer

declare global {
  namespace Communicator {
    // Main WebViewer class
    class WebViewer {
      constructor(config: ViewerConfig);
      start(): Promise<void>;
      shutdown(): Promise<void>;

      // Model loading
      loadSubtreeFromScsFile(
        parentNodeId: NodeId,
        scsFile: string
      ): Promise<NodeId>;

      // Scene management
      getModel(): Model;
      getView(): View;
      getSelectionManager(): SelectionManager;
      getOperatorManager(): OperatorManager;

      // Callbacks
      setCallbacks(callbacks: ViewerCallbacks): void;
    }

    interface ViewerConfig {
      containerId: string;
      endpointUri?: string;
      model?: string;
      rendererType?: RendererType;
      empty?: boolean;
    }

    interface ViewerCallbacks {
      sceneReady?(): void;
      modelStructureReady?(): void;
      selectionArray?(events: SelectionEvent[]): void;
      modelSwitched?(): void;
      modelSwitchStart?(): void;
      hwvReady?(): void;
    }

    // Model class
    class Model {
      getNodeName(nodeId: NodeId): string | null;
      getNodeMatrix(nodeId: NodeId): Matrix;
      setNodeMatrix(nodeId: NodeId, matrix: Matrix): void;
      getNodeChildren(nodeId: NodeId): NodeId[];
      getRootNode(): NodeId;
      deleteNode(nodeId: NodeId): void;
    }

    // View class
    class View {
      setBackgroundColor(topColor: Color, bottomColor: Color): void;
      getAxisTriad(): AxisTriad;
      fitWorld(): void;
      fitNodes(nodeIds: NodeId[]): void;
    }

    // Selection Manager
    class SelectionManager {
      getResults(): SelectionItem[];
      clear(): void;
      selectNode(nodeId: NodeId): void;
    }

    // Operator Manager
    class OperatorManager {
      push(operator: Operator): void;
      remove(operator: Operator): void;
      clear(): void;
      set(operatorId: OperatorId, priority: number): void;
    }

    // Operator base class
    class Operator {
      onMouseDown(event: Event.MouseInputEvent): void;
      onMouseMove(event: Event.MouseInputEvent): void;
      onMouseUp(event: Event.MouseInputEvent): void;
    }

    // Axis Triad
    class AxisTriad {
      enable(): void;
      disable(): void;
      setAnchor(anchor: OverlayAnchor): void;
    }

    // Types
    type NodeId = number;
    type OperatorId = number;

    enum RendererType {
      Client = 0,
      Server = 1,
    }

    enum OverlayAnchor {
      LowerLeftCorner = 0,
      LowerRightCorner = 1,
      UpperLeftCorner = 2,
      UpperRightCorner = 3,
    }

    // Matrix (4x4 transformation matrix)
    class Matrix {
      constructor();
      static createFromArray(values: number[]): Matrix;
      getAsArray(): number[];
      setTranslationComponent(x: number, y: number, z: number): void;
      copy(): Matrix;
    }

    // Color
    class Color {
      constructor(r: number, g: number, b: number);
      static white(): Color;
      static black(): Color;
      static red(): Color;
      static green(): Color;
      static blue(): Color;
    }

    // Point3
    class Point3 {
      constructor(x: number, y: number, z: number);
      x: number;
      y: number;
      z: number;
    }

    // Selection
    interface SelectionEvent {
      getType(): SelectionType;
      getSelection(): SelectionItem;
    }

    interface SelectionItem {
      getNodeId(): NodeId;
      getPosition(): Point3 | null;
    }

    enum SelectionType {
      Add = 0,
      Remove = 1,
      Clear = 2,
    }

    // Events
    namespace Event {
      class MouseInputEvent {
        getPosition(): Point2;
        getButton(): Button;
      }

      class Point2 {
        x: number;
        y: number;
      }

      enum Button {
        Left = 0,
        Middle = 1,
        Right = 2,
      }
    }
  }
}

export {};
