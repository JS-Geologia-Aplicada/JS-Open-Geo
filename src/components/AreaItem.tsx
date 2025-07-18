import React, { useEffect, useRef, useState } from "react";
import { Check, Eraser, TextSelect, Trash, X } from "lucide-react";
import type { SelectionArea } from "../types";

interface AreaItemProps {
  id: string;
  name: string;
  order: number;
  color: string;
  coordinates: SelectionArea | null;
  hasFile: boolean;
  onStartSelection: (areaId: string) => void;
  onClearArea: (areaId: string) => void;
  onDeleteArea: (areaId: string) => void;
  onRenameArea: (areaId: string, newName: string) => void;
}

const AreaItem: React.FC<AreaItemProps> = ({
  id,
  name,
  order,
  coordinates,
  color,
  hasFile,
  onStartSelection,
  onClearArea,
  onDeleteArea,
  onRenameArea,
}) => {
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [editName, setEditName] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingName]);

  const handleStartSelection = () => {
    onStartSelection(id);
  };
  const handleDeleteArea = () => {
    onDeleteArea(id);
  };
  const handleClearArea = () => {
    onClearArea(id);
  };

  const handleRename = () => {
    setEditName(name);
    setIsEditingName(true);
  };

  const handleRenameKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleConfirmRename();
    }
    if (e.key === "Escape") {
      handleCancelRename();
    }
  };
  const handleConfirmRename = () => {
    if (editName.trim() && editName.trim() !== name) {
      onRenameArea(id, editName.trim());
      setIsEditingName(false);
    } else {
      handleCancelRename();
    }
  };

  const handleCancelRename = () => {
    setEditName(name);
    setIsEditingName(false);
  };

  return (
    <div className="d-flex align-items-center gap-2 p-2 border rounded mb-1">
      <div className="drag-handle" style={{ cursor: "grab" }}>
        ⋮⋮
      </div>
      <span
        className="badge me-2"
        style={{ backgroundColor: color, color: "white" }}
      >
        #{order}
      </span>
      {isEditingName ? (
        <div className="d-flex align-items-center flex-grow-1">
          <input
            type="text"
            className="form-control form-control-sm me-2"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={handleRenameKey}
          />
          <div className="d-flex gap-2">
            <button
              className="menu-btn menu-btn-cta"
              title="Confirmar"
              onClick={handleConfirmRename}
            >
              <Check size={16} />
            </button>
            <button
              className="menu-btn menu-btn-warning"
              title="Cancelar"
              onClick={handleCancelRename}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-grow-1 text-start area-name-section">
            <span onClick={handleRename}>{name}</span>
          </div>
          <button
            className="menu-btn menu-btn-cta"
            disabled={!hasFile}
            onClick={handleStartSelection}
          >
            <TextSelect size={16} />
          </button>
          {coordinates && (
            <button
              className="menu-btn menu-btn-alert"
              onClick={handleClearArea}
              title="Limpar seleção"
            >
              <Eraser size={16} />
            </button>
          )}
          <button
            className="menu-btn menu-btn-warning area-delete"
            onClick={handleDeleteArea}
            title="Excluir área"
          >
            <Trash size={14} />
          </button>
        </>
      )}
    </div>
  );
};

export default AreaItem;
