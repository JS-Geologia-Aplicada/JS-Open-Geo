import React, { useEffect, useRef, useState } from "react";
import {
  BadgeAlert,
  Check,
  ChevronDown,
  ChevronUp,
  Eraser,
  TextSelect,
  Trash,
  X,
} from "lucide-react";
import type { Area } from "../types";

interface AreaItemProps {
  hasFile: boolean;
  area: Area;
  onStartSelection: (areaId: string) => void;
  onClearArea: (areaId: string) => void;
  onDeleteArea: (areaId: string) => void;
  onRenameArea: (areaId: string, newName: string) => void;
  onToggleMandatory: (areaId: string, mandatory: boolean) => void;
  onChangeAreaType: (areaId: string, newType: string | undefined) => void;
}

const AreaItem: React.FC<AreaItemProps> = ({
  hasFile,
  area,
  onStartSelection,
  onClearArea,
  onDeleteArea,
  onRenameArea,
  onToggleMandatory,
  onChangeAreaType,
}) => {
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [editName, setEditName] = useState(area.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingName]);

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleToggleMandatory = () => {
    onToggleMandatory(area.id, !area.isMandatory);
  };

  const handleStartSelection = () => {
    onStartSelection(area.id);
  };
  const handleDeleteArea = () => {
    onDeleteArea(area.id);
  };
  const handleClearArea = () => {
    onClearArea(area.id);
  };

  const handleRename = () => {
    setEditName(area.name);
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
    if (editName.trim() && editName.trim() !== area.name) {
      onRenameArea(area.id, editName.trim());
      setIsEditingName(false);
    } else {
      handleCancelRename();
    }
  };

  const handleCancelRename = () => {
    setEditName(area.name);
    setIsEditingName(false);
  };

  return (
    <>
      <div className="border rounded mb-1">
        <div className="d-flex align-items-center gap-1 p-2">
          <div className="drag-handle" style={{ cursor: "grab" }}>
            ⋮⋮
          </div>
          <div className="d-flex align-items-center">
            <span
              className="badge me-2"
              style={{ backgroundColor: area.color, color: "white" }}
            >
              #{area.order}
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
                onBlur={handleConfirmRename}
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
              <div
                className="flex-grow-1 text-start area-name-section"
                style={{ minWidth: 0 }}
              >
                <span
                  onClick={handleRename}
                  style={{
                    width: "calc(100% - 10px)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    display: "block",
                  }}
                  title={area.name}
                >
                  {area.name}
                </span>
              </div>
              <button
                className="menu-btn menu-btn-cta"
                disabled={!hasFile}
                onClick={handleStartSelection}
              >
                <TextSelect size={16} />
              </button>
              {area.coordinates && (
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
              <div className="d-flex align-items-center m-1">
                <span
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  title="Opções avançadas"
                  style={{ cursor: "pointer" }}
                >
                  {showAdvanced ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </span>
              </div>
            </>
          )}
        </div>
        {showAdvanced && (
          <div className="advanced-options mt-2 p-2 bg-light rounded">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <small className="text-muted">Opções avançadas</small>
            </div>

            <div className="d-flex align-items-start mb-1">
              <div
                className="d-flex align-items-center"
                title={
                  area.isMandatory ? "Campo obrigatório" : "Campo opcional"
                }
              >
                <BadgeAlert
                  onClick={handleToggleMandatory}
                  size={24}
                  strokeWidth={area.isMandatory ? 2.5 : 1.5}
                  style={{
                    borderRadius: 20,
                    cursor: "pointer",
                    opacity: area.isMandatory ? 1 : 0.3,
                    color: area.isMandatory ? "#dc3545" : "#6c757d",
                    backgroundColor: area.isMandatory
                      ? "#dc354520"
                      : "transparent",
                  }}
                />
                <span className="ms-2">Campo obrigatório</span>
              </div>
            </div>

            <div className="form-check form-switch d-flex align-items-start">
              <input
                className="form-check-input me-2"
                type="checkbox"
                id={`area-${area.order}-is-nspt`}
                checked={area.type === "nspt"}
                onChange={(e) =>
                  onChangeAreaType(
                    area.id,
                    e.target.checked ? "nspt" : undefined
                  )
                }
              />
              <label
                className="form-check-label"
                htmlFor={`area-${area.order}-is-nspt`}
              >
                NSPT
              </label>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AreaItem;
