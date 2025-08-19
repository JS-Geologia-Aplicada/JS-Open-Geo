import { useEffect, useState } from "react";
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
import HelpModal from "./HelpModal";
import { Modal, Tooltip } from "bootstrap";

interface MenuProps {
  onFileSelect: (file: File) => void;
  onStartAreaSelection: (areaID: string) => void;
  onDeleteArea: (areaId: string) => void;
  onRenameArea: (areaId: string, newName: string) => void;
  onClearArea: (areaId: string) => void;
  onAddNewArea: (type?: DataType) => void;
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
}

function Menu({
  onFileSelect,
  onStartAreaSelection,
  onDeleteArea,
  onRenameArea,
  onClearArea,
  onAddNewArea,
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
}: MenuProps) {
  // Inicializando os tooltips
  useEffect(() => {
    const tooltips = Array.from(
      document.querySelectorAll('[data-bs-toggle="tooltip"]')
    );
    tooltips.forEach((el) => new Tooltip(el));

    return () => {
      tooltips.forEach((el) => {
        const tooltip = Tooltip.getInstance(el);
        if (tooltip) tooltip.dispose();
      });
    };
  }, [areas.length]);

  const [isPresetManagerOpen, setIsPresetManagerOpen] =
    useState<boolean>(false);
  const openPresetManager = () => {
    setIsPresetManagerOpen(true);
  };

  const [openHelpOnLoad, setOpenHelpOnLoad] = useState(() => {
    const saved = localStorage.getItem("showHelpOnLoad");
    return saved !== "false";
  });
  useEffect(() => {
    const showModal = () => {
      const modal = new Modal("#helpModal");
      modal.show();
    };
    if (openHelpOnLoad) {
      if (document.readyState === "complete") {
        showModal();
      } else {
        window.addEventListener("load", showModal);
        return () => window.removeEventListener("load", showModal);
      }
    }
  }, []);
  const toggleShowHelpOnLoad = (show: boolean) => {
    setOpenHelpOnLoad(show);
    localStorage.setItem("showHelpOnLoad", show.toString());
  };

  const clearAllAreas = () => {
    if (confirm("Deseja remover todas as áreas?")) {
      areas.forEach((area) => {
        onDeleteArea(area.id);
      });
    }
  };

  const onAddAllAreas = () => {
    EASY_ADD_TYPES.forEach((type) => {
      if (!areas.find((area) => area.dataType === type)) {
        onAddNewArea(type);
      }
    });
  };

  return (
    <>
      <UploadFile onFileSelect={onFileSelect} />

      <div className="modal fade" id="helpModal" tabIndex={-1}>
        <HelpModal
          showOnLoad={openHelpOnLoad}
          onToggleShowOnLoad={toggleShowHelpOnLoad}
        />
      </div>
      <div className="d-flex justify-content-end gap-2 my-3">
        <select
          className="form-select form-select-sm"
          defaultValue={"text"}
          onChange={(e) => setExtractionMode(e.target.value as ExtractionType)}
        >
          <option value="text">Extração de texto</option>
          <option value="ocr">Extração OCR (em implementação)</option>
          <option value="both">Escolha por área</option>
        </select>
        {areas.length > 0 && (
          <button
            data-bs-toggle="tooltip"
            data-bs-placement="top"
            data-bs-title="Excluir todas as áreas"
            className="menu-btn menu-btn-warning"
            onClick={clearAllAreas}
          >
            <X size={24} />
          </button>
        )}
        <span
          data-bs-placement="top"
          data-bs-toggle="tooltip"
          data-bs-title="Ajuda"
        >
          <button
            className="menu-btn"
            data-bs-toggle="modal"
            data-bs-target="#helpModal"
          >
            <HelpCircle size={24} />
          </button>
        </span>
        <button
          data-bs-title="Presets"
          data-bs-toggle="tooltip"
          data-bs-target="tooltip"
          className="menu-btn"
          onClick={openPresetManager}
        >
          <Folder size={24} />
        </button>
        <div className="btn-group">
          <button
            type="button"
            data-bs-toggle="tooltip"
            data-bs-target="tooltip"
            data-bs-trigger="hover"
            data-bs-title="Adicionar área"
            className="menu-btn"
            onClick={() => onAddNewArea()}
          >
            <Plus size={24} />
          </button>
          <button
            className="menu-btn dropdown-toggle dropdown-toggle-split"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <span className="visually-hidden">Toggle Dropdown</span>
          </button>
          <ul
            className="dropdown-menu"
            id="add-area-dropdown"
            style={{ zIndex: 1001 }}
          >
            {EASY_ADD_TYPES.filter(
              (type) => !areas.find((area) => area.dataType === type)
            ).map((type, index) => {
              return (
                <li key={`list-item${index}`}>
                  <button
                    className="dropdown-item"
                    type="button"
                    data-bs-dismiss="dropdown"
                    onClick={() => onAddNewArea(type)}
                  >
                    {DATA_TYPE_LABELS[type]}
                  </button>
                </li>
              );
            })}
            <div className="dropdown-divider"></div>

            <li>
              <button
                className="dropdown-item"
                onClick={onAddAllAreas}
                disabled={EASY_ADD_TYPES.some((type) =>
                  areas.find((area) => area.dataType === type)
                )}
              >
                Criar todos ausentes
              </button>
            </li>
          </ul>
        </div>
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
