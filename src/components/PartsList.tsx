interface Part {
  id: string;
  name: string;
  fileName: string;
  thumbnail?: string;
}

interface PartsListProps {
  parts: Part[];
  onPartDragStart?: (part: Part) => void;
}

export function PartsList({ parts, onPartDragStart }: PartsListProps) {
  const handleDragStart = (e: React.DragEvent, part: Part) => {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("application/json", JSON.stringify(part));
    if (onPartDragStart) {
      onPartDragStart(part);
    }
  };

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
      <div
        style={{
          padding: "15px",
          borderBottom: "1px solid #ddd",
          backgroundColor: "#f8f9fa",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600" }}>
          Parts Library
        </h3>
        <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "#666" }}>
          Drag parts to the 3D view
        </p>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "10px",
        }}
      >
        {parts.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              color: "#999",
            }}
          >
            <p>No parts available</p>
            <p style={{ fontSize: "12px", marginTop: "10px" }}>
              Upload .scs files to add parts
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {parts.map((part) => (
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
                    }}
                  >
                    {part.thumbnail ? (
                      <img
                        src={part.thumbnail}
                        alt={part.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          backgroundColor: "#fff",
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.parentElement!.innerHTML = "📦";
                        }}
                      />
                    ) : (
                      "📦"
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: "500",
                        fontSize: "14px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {part.name}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#999",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {part.fileName}
                    </div>
                  </div>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
