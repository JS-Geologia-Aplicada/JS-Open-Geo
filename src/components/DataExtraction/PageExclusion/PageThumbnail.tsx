import { useState } from "react";
import { useExtractionContext } from "@/contexts/ExtractionContext";

interface PageThumbnailProps {
  pageNumber: number;
  thumbnailUrl: string;
  size: number;
}

const PageThumbnail = ({
  pageNumber,
  thumbnailUrl,
  size,
}: PageThumbnailProps) => {
  const { extractionState, updateExtractionState } = useExtractionContext();
  const { excludedPages } = extractionState;

  const [isHovered, setIsHovered] = useState(false);

  const isExcluded = excludedPages.has(pageNumber);

  const handleToggle = () => {
    const newExcludedPages = new Set(excludedPages);

    if (newExcludedPages.has(pageNumber)) {
      newExcludedPages.delete(pageNumber);
    } else {
      newExcludedPages.add(pageNumber);
    }

    updateExtractionState({ excludedPages: newExcludedPages });
  };

  return (
    <div
      className="position-relative border rounded overflow-hidden"
      style={{
        width: `${size}px`,
        height: `${size + 30}px`,
        cursor: "pointer",
        transition: "transform 0.2s, box-shadow 0.2s",
        transform: isHovered ? "scale(1.05)" : "scale(1)",
        boxShadow: isHovered ? "0 4px 8px rgba(0,0,0,0.2)" : "none",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleToggle}
    >
      {/* Miniatura */}
      <div
        className="d-flex align-items-center justify-content-center"
        style={{
          backgroundColor: "white",
          height: `${size}px`,
        }}
      >
        <img
          src={thumbnailUrl}
          alt={`Página ${pageNumber}`}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </div>

      {/* Overlay quando excluída */}
      {isExcluded && (
        <div
          className="position-absolute top-0 start-0 w-100 d-flex align-items-center justify-content-center"
          style={{
            height: `${size}px`,
            backgroundColor: "rgba(220, 53, 69, 0.7)",
            color: "white",
          }}
        >
          <div className="text-center pt-2">
            <div className="small fw-bold">IGNORADA</div>
          </div>
        </div>
      )}

      {/* Número da página */}
      <div
        className="text-center py-1 small"
        style={{
          backgroundColor: isExcluded ? "#dc3545" : "rgba(0, 0, 0, 0.7)",
          color: "white",
          height: "30px",
        }}
      >
        Pág. {pageNumber}
      </div>
    </div>
  );
};

export default PageThumbnail;
