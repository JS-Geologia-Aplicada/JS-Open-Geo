import { useRef, useState } from "react";
import {
  DATA_TYPE_LABELS,
  EASY_ADD_TYPES,
  type Area,
  type DataType,
  type ExtractionType,
} from "../types";
import AreaItem from "./AreaItem";
import UploadFile from "./UploadFile";
import PresetManager from "./PresetManager";
import { Folder, HelpCircle, Plus, X } from "lucide-react";
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

interface MenuProps {
  onFileSelect: (file: File) => void;
  onStartAreaSelection: (areaID: string) => void;
  onDeleteArea: (areaId: string) => void;
  onDeleteAllAreas: () => void;
  onRenameArea: (areaId: string, newName: string) => void;
  onClearArea: (areaId: string) => void;
  onAddNewArea: (type?: DataType) => void;
  onCreateMissingAreas: () => void;
  onLoadPreset: (areas: Area[]) => void;
  onDragEnd: (result: any) => void;
  onToggleMandatory: (areaId: string, mandatory: boolean) => void;
  onToggleRepeat: (areaId: string, repeat: boolean) => void;
  onChangeAreaType: (areaId: string, newType: DataType) => void;
  onToggleAreaOCR: (areaId: string, ocr: boolean) => void;
  areas: Area[];
  hasFile: boolean;
  extractionMode: ExtractionType;
  onChangeExtractionMode: (mode: ExtractionType) => void;
  onShowHelp: () => void;
}

function Menu({
  onFileSelect,
  onStartAreaSelection,
  onDeleteArea,
  onDeleteAllAreas,
  onRenameArea,
  onClearArea,
  onAddNewArea,
  onCreateMissingAreas,
  onLoadPreset,
  onDragEnd,
  onToggleMandatory,
  onToggleRepeat,
  onChangeAreaType,
  onToggleAreaOCR,
  areas,
  hasFile,
  extractionMode,
  onChangeExtractionMode: setExtractionMode,
  onShowHelp,
}: MenuProps) {
  const [isPresetManagerOpen, setIsPresetManagerOpen] =
    useState<boolean>(false);
  const openPresetManager = () => {
    setIsPresetManagerOpen(true);
  };

  const clearAllAreas = () => {
    if (confirm("Deseja remover todas as áreas?")) {
      onDeleteAllAreas();
    }
  };

  const helpRef = useRef(null);
  const helpTarget = useRef(null);
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);

  return (
    <>
      <UploadFile onFileSelect={onFileSelect} />
      <div className="d-flex justify-content-end gap-2 my-3">
        <Form.Select
          className="form-select form-select-sm"
          defaultValue={"text"}
          onChange={(e) => setExtractionMode(e.target.value as ExtractionType)}
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
            <Button type="button" variant="menu" onClick={() => onAddNewArea()}>
              <Plus size={24} />
            </Button>
          </OverlayTrigger>
          <Dropdown.Toggle
            split
            variant="menu"
            type="button"
            data-bs-toggle="dropdown"
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
              (type) => !areas.find((area) => area.dataType === type)
            ).map((type, index) => {
              return (
                <Dropdown.Item
                  key={`list-item${index}`}
                  onClick={() => onAddNewArea(type)}
                >
                  {DATA_TYPE_LABELS[type]}
                </Dropdown.Item>
              );
            })}
            <Dropdown.Divider />

            <Dropdown.Item
              onClick={onCreateMissingAreas}
              disabled={EASY_ADD_TYPES.every((type) =>
                areas.find((area) => area.dataType === type)
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
                      <AreaItem
                        key={area.id}
                        area={area}
                        areas={areas}
                        hasFile={hasFile}
                        extractionMode={extractionMode}
                        onStartSelection={onStartAreaSelection}
                        onClearArea={onClearArea}
                        onDeleteArea={onDeleteArea}
                        onRenameArea={onRenameArea}
                        onToggleMandatory={onToggleMandatory}
                        onToggleRepeat={onToggleRepeat}
                        onChangeAreaType={onChangeAreaType}
                        onToggleAreaOCR={onToggleAreaOCR}
                      />
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
        currentAreas={areas}
        onLoadPreset={onLoadPreset}
      />
    </>
  );
}

export default Menu;
