import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Scene } from "../types";
import { PartsList } from "./PartsList";
import "../types/hoops.d.ts";

interface SceneEditorProps {
  sceneId: string;
  onClose?: () => void;
  onSave?: () => void;
}

interface Part {
  id: string;
  name: string;
  fileName: string;
  thumbnail?: string;
}

export function SceneEditor({ sceneId, onClose, onSave }: SceneEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Communicator.WebViewer | null>(null);
  const [scene, setScene] = useState<Scene | null>(null);
  const [parts, setParts] = useState<Part[]>([]);
  const [status, setStatus] = useState<string>("Initializing...");
  const [selectedNodeId, setSelectedNodeId] = useState<Communicator.NodeId | null>(null);

  useEffect(() => {
    async function init() {
      try {
        setStatus("Loading scene data...");

        const { data, error: fetchError } = await supabase
          .from("scenes")
          .select("*")
          .eq("id", sceneId)
          .single();

        if (fetchError) throw fetchError;
        if (!data) throw new Error("Scene not found");

        setScene(data);

        const response = await fetch("/parts/parts_list.json");
        const partsData = await response.json();

        const loadedParts: Part[] = partsData.parts.map((part: { id: number; name: string }) => ({
          id: part.id.toString(),
          name: part.name.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
          fileName: `${part.name}.scs`,
          thumbnail: `/parts/${part.name}.png`,
        }));

        setParts(loadedParts);

        setStatus("Initializing 3D editor...");
        await initViewer();

      } catch (err) {
        console.error("Initialization error:", err);
        setStatus(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }

    init();

    return () => {
      if (viewerRef.current) {
        viewerRef.current.shutdown().catch(console.error);
      }
    };
  }, [sceneId]);

  async function initViewer() {
    return new Promise<void>((resolve, reject) => {
      if (!containerRef.current) {
        reject(new Error("Container not ready"));
        return;
      }

      if (typeof window.Communicator === "undefined") {
        reject(new Error("HOOPS Communicator not loaded"));
        return;
      }

      const containerId = `editor-${sceneId}`;
      containerRef.current.id = containerId;

      console.log("Creating editor with container:", containerId);

      const viewer = new window.Communicator.WebViewer({
        containerId: containerId,
        endpointUri: "/parts/housing.scs",
      });

      viewerRef.current = viewer;

      viewer.setCallbacks({
        sceneReady: () => {
          console.log("Editor scene ready!");
          setStatus("Ready! Edit mode active");

          const view = viewer.getView();
          view.setBackgroundColor(
            new window.Communicator.Color(245, 245, 250),
            new window.Communicator.Color(220, 220, 230)
          );

          const axisTriad = view.getAxisTriad();
          axisTriad.enable();
          axisTriad.setAnchor(window.Communicator.OverlayAnchor.LowerLeftCorner);

          resolve();
        },
        modelStructureReady: () => {
          console.log("Model structure ready");
          const view = viewer.getView();
          view.fitWorld();
        },
        selectionArray: () => {
          const selectionManager = viewer.getSelectionManager();
          const results = selectionManager.getResults();

          if (results.length > 0) {
            const nodeId = results[0].getNodeId();
            setSelectedNodeId(nodeId);
          } else {
            setSelectedNodeId(null);
          }
        },
      });

      viewer.start().catch((err) => {
        console.error("Viewer start failed:", err);
        setStatus(`Failed to start editor: ${err.message}`);
        reject(err);
      });
    });
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!viewerRef.current) return;

    try {
      const partData = e.dataTransfer.getData("application/json");
      if (!partData) return;

      const part: Part = JSON.parse(partData);
      const viewer = viewerRef.current;
      const model = viewer.getModel();
      const rootNodeId = model.getRootNode();

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      console.log(`Loading part: ${part.fileName}`);

      const nodeId = await viewer.loadSubtreeFromScsFile(
        rootNodeId,
        `/parts/${part.fileName}`
      );

      const matrix = new window.Communicator.Matrix();
      const offsetX = (x - rect.width / 2) / 50;
      const offsetY = (rect.height / 2 - y) / 50;
      matrix.setTranslationComponent(offsetX, offsetY, 0);

      model.setNodeMatrix(nodeId, matrix);

      setTimeout(() => {
        viewer.getView().fitWorld();
      }, 100);

    } catch (err) {
      console.error("Drop failed:", err);
      alert(`Failed to load part: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  function handleDelete() {
    if (!selectedNodeId || !viewerRef.current) {
      alert("No part selected");
      return;
    }

    try {
      const model = viewerRef.current.getModel();
      model.deleteNode(selectedNodeId);
      setSelectedNodeId(null);
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete part");
    }
  }

  async function handleSave() {
    if (!scene) return;

    try {
      const { error } = await supabase
        .from("scenes")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", sceneId);

      if (error) throw error;

      alert("Scene saved!");
      if (onSave) onSave();
    } catch (err) {
      alert(`Failed to save: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          padding: "15px 20px",
          borderBottom: "1px solid #ddd",
          backgroundColor: "#f8f9fa",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "20px" }}>
            Editing: {scene?.name || "Scene"}
          </h2>
          {scene?.description && (
            <p style={{ margin: "5px 0 0 0", color: "#666", fontSize: "14px" }}>
              {scene.description}
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: status.includes("Ready") ? "#28a745" : "#ff9800" }}>
            {status}
          </span>
          <button
            onClick={handleSave}
            style={{
              padding: "8px 16px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Save
          </button>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                padding: "8px 16px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          )}
        </div>
      </div>

      <div
        style={{
          padding: "10px 20px",
          borderBottom: "1px solid #ddd",
          backgroundColor: "#fff",
          display: "flex",
          gap: "10px",
          alignItems: "center",
        }}
      >
        <button
          onClick={handleDelete}
          disabled={!selectedNodeId}
          style={{
            padding: "6px 12px",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            opacity: selectedNodeId ? 1 : 0.5,
          }}
        >
          Delete Selected
        </button>
        <span style={{ fontSize: "12px", color: "#666", marginLeft: "auto" }}>
          {selectedNodeId ? `Selected: Node ${selectedNodeId}` : "No selection"}
        </span>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <div
          ref={containerRef}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          style={{
            flex: 1,
            position: "relative",
            backgroundColor: "#f5f5fa",
          }}
        />

        <div style={{ width: "300px", flexShrink: 0 }}>
          <PartsList parts={parts} />
        </div>
      </div>

      <div
        style={{
          padding: "10px 20px",
          borderTop: "1px solid #ddd",
          backgroundColor: "#f8f9fa",
          fontSize: "12px",
          color: "#666",
        }}
      >
        {parts.length} parts available | Drag to add, click to select, delete to remove
      </div>
    </div>
  );
}
