import { useEffect, useState } from "react";
import type { Area, SelectionArea } from "../types";

interface EditableAreaProps {
  area: Area;
  isEditing: boolean;
  onStartEdit: (areaId: string) => void;
  onFinishEdit: () => void;
  onConfirmNewCoords: (newCoords: SelectionArea, areaId: string) => void;
  onTempCoordsChange: (areaId: string, coords: SelectionArea) => void;
  zoomScale: number;
}

const getResizeHandles = (coords: SelectionArea, zoomScale: number) => {
  const handleSize = 8; // tamanho do quadradinho
  const half = handleSize / 2;

  return {
    // Cantos
    nw: { x: coords.x * zoomScale - half, y: coords.y * zoomScale - half },
    ne: {
      x: (coords.x + coords.width) * zoomScale - half,
      y: coords.y * zoomScale - half,
    },
    sw: {
      x: coords.x * zoomScale - half,
      y: (coords.y + coords.height) * zoomScale - half,
    },
    se: {
      x: (coords.x + coords.width) * zoomScale - half,
      y: (coords.y + coords.height) * zoomScale - half,
    },

    // Meios
    n: {
      x: (coords.x + coords.width / 2) * zoomScale - half,
      y: coords.y * zoomScale - half,
    },
    s: {
      x: (coords.x + coords.width / 2) * zoomScale - half,
      y: (coords.y + coords.height) * zoomScale - half,
    },
    w: {
      x: coords.x * zoomScale - half,
      y: (coords.y + coords.height / 2) * zoomScale - half,
    },
    e: {
      x: (coords.x + coords.width) * zoomScale - half,
      y: (coords.y + coords.height / 2) * zoomScale - half,
    },
  };
};

const EditablePolyArea = ({
  area,
  isEditing,
  onStartEdit,
  onFinishEdit,
  onConfirmNewCoords: onChangeCoords,
  onTempCoordsChange,
  zoomScale,
}: EditableAreaProps) => {
  const [tempCoords, setTempCoords] = useState<SelectionArea | null>(
    area.coordinates
  );

  useEffect(() => {
    setTempCoords(area.coordinates);
  }, [area.coordinates]);

  const startResize = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    e.preventDefault();

    if (!tempCoords) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startCoords = { ...tempCoords };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = (moveEvent.clientX - startX) / zoomScale;
      const deltaY = (moveEvent.clientY - startY) / zoomScale;

      const newCoords = calculateNewCoords(
        startCoords,
        deltaX,
        deltaY,
        direction
      );
      updateTempCoords(newCoords);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const startDrag = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!tempCoords) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startCoords = { ...tempCoords };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = (moveEvent.clientX - startX) / zoomScale;
      const deltaY = (moveEvent.clientY - startY) / zoomScale;

      const newCoords = calculateNewCoords(startCoords, deltaX, deltaY, "drag");
      updateTempCoords(newCoords);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const updateTempCoords = (newCoords: SelectionArea) => {
    setTempCoords(newCoords);
    if (onTempCoordsChange) {
      onTempCoordsChange(area.id, newCoords);
    }
  };

  const calculateNewCoords = (
    startCoords: SelectionArea,
    deltaX: number,
    deltaY: number,
    direction: string
  ): SelectionArea => {
    const northDirections = ["ne", "n", "nw"];
    const southDirections = ["se", "s", "sw"];
    const eastDirections = ["ne", "e", "se"];
    const westDirections = ["nw", "w", "sw"];

    const newX =
      westDirections.includes(direction) || direction === "drag"
        ? startCoords.x + deltaX
        : startCoords.x;
    const newY =
      northDirections.includes(direction) || direction === "drag"
        ? startCoords.y + deltaY
        : startCoords.y;
    const newWidth = westDirections.includes(direction)
      ? startCoords.width - deltaX
      : eastDirections.includes(direction)
      ? startCoords.width + deltaX
      : startCoords.width;
    const newHeight = northDirections.includes(direction)
      ? startCoords.height - deltaY
      : southDirections.includes(direction)
      ? startCoords.height + deltaY
      : startCoords.height;

    let finalX = newX;
    let finalY = newY;
    let finalWidth = newWidth;
    let finalHeight = newHeight;

    // Se width ficou negativo, "inverter" horizontalmente
    if (newWidth < 0) {
      finalX = newX + newWidth; // Move x para a posição correta
      finalWidth = Math.abs(newWidth);
    }

    // Se height ficou negativo, "inverter" verticalmente
    if (newHeight < 0) {
      finalY = newY + newHeight;
      finalHeight = Math.abs(newHeight);
    }

    const newCoords: SelectionArea = {
      x: finalX,
      y: finalY,
      width: finalWidth,
      height: finalHeight,
    };
    return newCoords;
  };

  const handleClickArea = (e: React.MouseEvent) => {
    if (!isEditing) {
      onStartEdit(area.id);
    } else {
      startDrag(e);
    }
  };

  useEffect(() => {
    if (!isEditing) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Se clicou na própria área, não fazer nada
      if (target.closest(`[editable-area-id="${area.id}"]`)) {
        return;
      }

      // Se clicou fora, finalizar edição
      if (tempCoords) {
        onChangeCoords(tempCoords, area.id);
      }
      onFinishEdit();
    };

    // Adicionar listener ao document
    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditing, area.id, onFinishEdit]);

  const renderResizeHandles = () => {
    if (!isEditing || !tempCoords) return null;

    const handles = getResizeHandles(tempCoords, zoomScale);
    const handleStyle = {
      position: "absolute" as const,
      width: "8px",
      height: "8px",
      backgroundColor: area.color,
      border: "1px solid white",
      zIndex: 15,
    };

    return (
      <>
        {Object.entries(handles).map(([direction, pos]) => (
          <div
            key={direction}
            className="resize-handle"
            style={{
              ...handleStyle,
              left: pos.x,
              top: pos.y,
              cursor: `${direction}-resize`, // nw-resize, n-resize, etc.
            }}
            onMouseDown={(e) => startResize(e, direction)}
          />
        ))}
      </>
    );
  };

  return !tempCoords ? null : (
    <>
      <div
        className="position-absolute border editable-area"
        editable-area-id={area.id}
        style={{
          left: tempCoords.x * zoomScale || 0,
          top: tempCoords.y * zoomScale || 0,
          width: tempCoords.width * zoomScale || 0,
          height: tempCoords.height * zoomScale || 0,
          backgroundColor: `${area.color}20`,
          borderColor: area.color,
          borderWidth: "2px",
          zIndex: 10,
          cursor: isEditing ? "move" : "pointer",
        }}
        title={area.name}
        onMouseDown={(e) => handleClickArea(e)}
      ></div>
      {renderResizeHandles()}
    </>
  );
};

export default EditablePolyArea;
