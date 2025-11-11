import React, { useEffect, useRef, useState } from "react";
import { Check, Eraser, TextSelect, Trash, X } from "lucide-react";
import {
  DATA_TYPE_LABELS,
  DATA_TYPES,
  UNIQUE_TYPES,
  type Area,
  type DataType,
  type ExtractionType,
} from "@types";
import { Button, Form, OverlayTrigger, Tooltip } from "react-bootstrap";

interface AreaItemProps {
  hasFile: boolean;
  area: Area;
  areas: Area[];
  extractionMode: ExtractionType;
  onStartSelection: (areaId: string) => void;
  onClearArea: (areaId: string) => void;
  onDeleteArea: (areaId: string) => void;
  onRenameArea: (areaId: string, newName: string) => void;
  onToggleMandatory: (areaId: string, mandatory: boolean) => void;
  onToggleRepeat: (areaId: string, repeat: boolean) => void;
  onToggleAreaOCR: (areaId: string, ocr: boolean) => void;
  onChangeAreaType: (areaId: string, newType: DataType) => void;
}

const AreaItem: React.FC<AreaItemProps> = ({
  hasFile,
  area,
  areas,
  extractionMode,
  onStartSelection,
  onClearArea,
  onDeleteArea,
  onRenameArea,
  onToggleMandatory,
  onToggleRepeat,
  onToggleAreaOCR,
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
        {/* Linha 1 */}
        <div className="d-flex align-items-center gap-1 pt-2 px-2 pb-1">
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
              <OverlayTrigger
                overlay={
                  <Tooltip style={{ position: "fixed" }}>
                    Selecionar área
                  </Tooltip>
                }
              >
                <Button
                  variant="menu"
                  className="btn-menu-cta"
                  disabled={!hasFile}
                  onClick={handleStartSelection}
                >
                  <TextSelect size={16} />
                </Button>
              </OverlayTrigger>
              {area.coordinates && (
                <OverlayTrigger
                  overlay={
                    <Tooltip style={{ position: "fixed" }}>
                      Limpar seleção
                    </Tooltip>
                  }
                >
                  <Button
                    variant="menu"
                    className="btn-menu-alert"
                    onClick={handleClearArea}
                  >
                    <Eraser size={16} />
                  </Button>
                </OverlayTrigger>
              )}
              <OverlayTrigger
                overlay={
                  <Tooltip style={{ position: "fixed" }}>Excluir área</Tooltip>
                }
              >
                <Button
                  variant="menu"
                  className="btn-menu-warning area-delete"
                  onClick={handleDeleteArea}
                >
                  <Trash size={14} />
                </Button>
              </OverlayTrigger>
            </>
          )}
        </div>

        {/* Linha 2 */}
        <div className="d-flex align-items-center gap-2 px-2 pb-2 justify-content-between">
          <div className="flex-grow-1 me-2">
            <select
              className="form-select form-select-sm w-100"
              value={area.dataType || ""}
              onChange={(e) =>
                onChangeAreaType(area.id, e.target.value as DataType)
              }
            >
              <option value="default">Tipo padrão</option>
              {DATA_TYPES.filter(
                (type) =>
                  type !== "default" &&
                  (!UNIQUE_TYPES.includes(type) ||
                    !areas.find((a) => a.dataType === type && a.id !== area.id))
              ).map((type) => (
                <option key={type} value={type}>
                  {DATA_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>
          <OverlayTrigger
            overlay={
              <Tooltip style={{ position: "fixed" }}>
                Extrair textos com OCR
              </Tooltip>
            }
          >
            <Form>
              <Form.Check
                type="switch"
                label="OCR"
                id={`ocr-${area.id}`}
                disabled={extractionMode !== "both"}
                checked={area.ocr}
                onChange={(e) => onToggleAreaOCR(area.id, e.target.checked)}
              />
            </Form>
          </OverlayTrigger>

          <OverlayTrigger
            overlay={
              <Tooltip style={{ position: "fixed" }}>
                Pular páginas sem texto nesta área
              </Tooltip>
            }
          >
            <Form>
              <Form.Check
                type="switch"
                label="Obrig."
                id={`mandatory-${area.id}`}
                checked={area.isMandatory}
                onChange={(e) => onToggleMandatory(area.id, e.target.checked)}
              />
            </Form>
          </OverlayTrigger>

          <OverlayTrigger
            overlay={
              <Tooltip style={{ position: "fixed" }}>
                {areas.find((a) => a.dataType === "hole_id")
                  ? "Usar um único valor por sondagem"
                  : "Adicione uma área como ID da Sondagem para utilizar essa opção"}
              </Tooltip>
            }
          >
            <Form>
              <Form.Check
                type="switch"
                label="Único"
                id={`repeat-${area.id}`}
                checked={area.repeatInPages}
                onChange={(e) => onToggleRepeat(area.id, e.target.checked)}
                disabled={!areas.find((a) => a.dataType === "hole_id")}
              />
            </Form>
          </OverlayTrigger>
        </div>
      </div>
    </>
  );
};

export default AreaItem;
