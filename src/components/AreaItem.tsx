import React, { useEffect, useRef, useState } from "react";
import { BadgeAlert, Check, Eraser, TextSelect, Trash, X } from "lucide-react";
import type { SelectionArea } from "../types";

interface AreaItemProps {
  id: string;
  name: string;
  order: number;
  color: string;
  coordinates: SelectionArea | null;
  hasFile: boolean;
  isMandatory: boolean;
  onStartSelection: (areaId: string) => void;
  onClearArea: (areaId: string) => void;
  onDeleteArea: (areaId: string) => void;
  onRenameArea: (areaId: string, newName: string) => void;
  onToggleMandatory: (areaId: string, mandatory: boolean) => void;
}

const AreaItem: React.FC<AreaItemProps> = ({
  id,
  name,
  order,
  coordinates,
  color,
  hasFile,
  isMandatory,
  onStartSelection,
  onClearArea,
  onDeleteArea,
  onRenameArea,
  onToggleMandatory,
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

  const handleToggleMandatory = () => {
    onToggleMandatory(id, !isMandatory);
  };

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
    <div className="d-flex align-items-center gap-1 p-2 border rounded mb-1">
      <div className="drag-handle" style={{ cursor: "grab" }}>
        ⋮⋮
      </div>
      <div
        className="d-flex align-items-center"
        title={isMandatory ? "Campo obrigatório" : "Campo opcional"}
      >
        <BadgeAlert
          onClick={handleToggleMandatory}
          size={24}
          strokeWidth={isMandatory ? 2.5 : 1.5}
          style={{
            borderRadius: 20,
            cursor: "pointer",
            opacity: isMandatory ? 1 : 0.3,
            color: isMandatory ? "#dc3545" : "#6c757d",
            backgroundColor: isMandatory ? "#dc354520" : "transparent",
          }}
        />
      </div>
      <div className="d-flex align-items-center">
        <span
          className="badge me-2"
          style={{ backgroundColor: color, color: "white" }}
        >
          #{order}
        </span>
      </div>
      {isEditingName ? (
        <div className="d-flex align-items-center flex-grow-1">
          <input
            ref={inputRef}
            type="text"
            className="form-control form-control-sm me-2"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={handleRenameKey}
            onBlur={handleCancelRename}
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
