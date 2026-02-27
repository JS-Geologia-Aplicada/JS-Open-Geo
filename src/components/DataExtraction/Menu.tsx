import { useRef, useState } from "react";
import {
  DATA_TYPE_LABELS,
  EASY_ADD_TYPES,
  type DataType,
  type ExtractionType,
} from "@types";
import AreaItem from "./AreaItem";
import UploadFile from "./UploadFile";
import PresetManager from "./PresetManager";
import { FileText, Folder, HelpCircle, Plus, X } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  Button,
  ButtonGroup,
  Dropdown,
  Form,
  Overlay,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { useExtractionContext } from "@/contexts/ExtractionContext";
import { addNewArea } from "@/utils/areaUtils";

interface MenuProps {
  onDragEnd: (result: any) => void;
  onShowHelp: () => void;
}

function Menu({ onDragEnd, onShowHelp }: MenuProps) {
  const { extractionState, updateExtractionState } = useExtractionContext();
  const { areas, extractionMode } = extractionState;

  const [isPresetManagerOpen, setIsPresetManagerOpen] =
    useState<boolean>(false);
  const openPresetManager = () => {
    setIsPresetManagerOpen(true);
  };

  const clearAllAreas = () => {
    if (confirm("Deseja remover todas as áreas?")) {
      updateExtractionState({ areas: [] });
    }
  };

  const handleAddNewArea = (type?: DataType) => {
    if (areas.length >= 15) {
      alert("Limite de 15 áreas atingido");
      return;
    }
    const isOCR = extractionMode === "ocr";
    updateExtractionState({ areas: addNewArea(areas, isOCR, type) });
  };

  const handleCreateMissingAreas = () => {
    const typesToAdd = EASY_ADD_TYPES.filter(
      (type) => !areas.find((area) => area.dataType === type),
    );

    if (areas.length + typesToAdd.length > 15) {
      alert("Não é possível adicionar todas - excederia o limite de 15 áreas");
      return;
    }

    let currentAreas = [...areas];
    const isOCR = extractionMode === "ocr";
    typesToAdd.forEach((type) => {
      currentAreas = addNewArea(currentAreas, isOCR, type);
    });
    // Adiciona todas de uma vez
    updateExtractionState({ areas: currentAreas });
  };

  const handleChangeExtractionMode = (mode: ExtractionType) => {
    updateExtractionState({ extractionMode: mode });
    if (mode !== "both") {
      const isOCR = mode === "ocr";
      const updatedAreas = areas.map((area) => ({ ...area, ocr: isOCR }));
      updateExtractionState({ areas: updatedAreas });
    }
  };

  const downloadTemplate = () => {
    const link = document.createElement("a");
    link.href = "templates/SondagemModelo_JSOpenGeo.pdf";
    link.download = "SondagemModelo_JSOpenGeo.pdf";
    link.click();
  };

  const helpRef = useRef(null);
  const helpTarget = useRef(null);
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);

  return (
    <>
      <UploadFile />

      <div style={{ padding: "12px" }}>
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={downloadTemplate}
          className="d-flex align-items-center justify-content-center gap-2 w-100"
        >
          <FileText size={16} />
          Baixar arquivo modelo
        </Button>
      </div>

      <div className="d-flex justify-content-end gap-2 mb-3">
        <Form.Select
          className="form-select form-select-sm"
          defaultValue={"text"}
          onChange={(e) =>
            handleChangeExtractionMode(e.target.value as ExtractionType)
          }
        >
          <option value="text">Extração de texto</option>
          <option value="ocr">Extração OCR</option>
          <option value="both">Escolha por área</option>
        </Form.Select>
        {areas.length > 0 && (
          <OverlayTrigger
            overlay={
              <Tooltip style={{ position: "fixed" }}>
                {" "}
                Excluir todas as áreas
              </Tooltip>
            }
          >
            <Button
              variant="menu"
              className="btn-menu-warning"
              onClick={clearAllAreas}
            >
              <X size={24} />
            </Button>
          </OverlayTrigger>
        )}
        <Button
          variant="menu"
          onClick={onShowHelp}
          ref={helpTarget}
          onMouseEnter={() => setShowHelpTooltip(true)}
          onMouseLeave={() => setShowHelpTooltip(false)}
        >
          <HelpCircle size={24} />
        </Button>
        <Overlay ref={helpRef} target={helpTarget} show={showHelpTooltip}>
          <Tooltip placement="top" style={{ position: "fixed" }}>
            Ajuda
          </Tooltip>
        </Overlay>
        <OverlayTrigger
          overlay={<Tooltip style={{ position: "fixed" }}>Presets</Tooltip>}
        >
          <Button variant="menu" onClick={openPresetManager}>
            <Folder size={24} />
          </Button>
        </OverlayTrigger>
        <Dropdown as={ButtonGroup}>
          <OverlayTrigger
            overlay={
              <Tooltip style={{ position: "fixed" }}>Adicionar área</Tooltip>
            }
          >
            <Button
              type="button"
              variant="menu"
              onClick={() => handleAddNewArea()}
            >
              <Plus size={24} />
            </Button>
          </OverlayTrigger>
          <Dropdown.Toggle
            split
            variant="menu"
            type="button"
            aria-expanded="false"
          >
            <span className="visually-hidden">Toggle Dropdown</span>
          </Dropdown.Toggle>
          <Dropdown.Menu
            className="dropdown-menu"
            id="add-area-dropdown"
            style={{ zIndex: 1001 }}
          >
            {EASY_ADD_TYPES.filter(
              (type) => !areas.find((area) => area.dataType === type),
            ).map((type, index) => {
              return (
                <Dropdown.Item
                  key={`list-item${index}`}
                  onClick={() => handleAddNewArea(type)}
                >
                  {DATA_TYPE_LABELS[type]}
                </Dropdown.Item>
              );
            })}
            <Dropdown.Divider />

            <Dropdown.Item
              onClick={handleCreateMissingAreas}
              disabled={EASY_ADD_TYPES.every((type) =>
                areas.find((area) => area.dataType === type),
              )}
            >
              Criar todos ausentes
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
      {areas.length === 0 && (
        <p className="text-muted">Adicione uma área para começar!</p>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="areas">
          {(provided) => (
            <div
              className="areas-container"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {areas.map((area, index) => (
                <Draggable key={area.id} draggableId={area.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <AreaItem key={area.id} area={area} />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <PresetManager
        isOpen={isPresetManagerOpen}
        onClose={() => setIsPresetManagerOpen(false)}
      />
    </>
  );
}

export default Menu;
