import { useEffect, useState } from "react";
import type { Area } from "../types";
import AreaItem from "./AreaItem";
import UploadFile from "./UploadFile";
import PresetManager from "./PresetManager";
import { Download, Folder, HelpCircle, Plus, X } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import HelpModal from "./HelpModal";
import { Modal } from "bootstrap";

interface MenuProps {
  onFileSelect: (file: File) => void;
  onExtractTexts: () => void;
  onStartAreaSelection: (areaID: string) => void;
  onDeleteArea: (areaId: string) => void;
  onRenameArea: (areaId: string, newName: string) => void;
  onClearArea: (areaId: string) => void;
  onAddNewArea: () => void;
  onLoadPreset: (areas: Area[]) => void;
  onDragEnd: (result: any) => void;
  onToggleMandatory: (areaId: string, mandatory: boolean) => void;
  onChangeAreaType: (areaId: string, newType: string | undefined) => void;
  areas: Area[];
  hasFile: boolean;
}

function Menu({
  onFileSelect,
  onExtractTexts,
  onStartAreaSelection,
  onDeleteArea,
  onRenameArea,
  onClearArea,
  onAddNewArea,
  onLoadPreset,
  onDragEnd,
  onToggleMandatory,
  onChangeAreaType,
  areas,
  hasFile,
}: MenuProps) {
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
        {areas.length > 0 && (
          <button
            title="Ajuda"
            className="menu-btn menu-btn-warning"
            onClick={clearAllAreas}
          >
            <X size={24} />
          </button>
        )}
        <button
          title="Ajuda"
          className="menu-btn"
          data-bs-toggle="modal"
          data-bs-target="#helpModal"
        >
          <HelpCircle size={24} />
        </button>
        <button
          title="Presets"
          className="menu-btn"
          onClick={openPresetManager}
        >
          <Folder size={24} />
        </button>
        <button
          title="Adicionar área"
          className="menu-btn"
          onClick={onAddNewArea}
        >
          <Plus size={24} />
        </button>
        <button
          title="Extrair texto"
          className="menu-btn menu-btn-cta"
          disabled={
            !(
              areas.length > 0 &&
              hasFile &&
              areas.some((area) => area.coordinates)
            )
          }
          onClick={onExtractTexts}
        >
          <Download size={24} />
        </button>
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
                        hasFile={hasFile}
                        onStartSelection={onStartAreaSelection}
                        onClearArea={onClearArea}
                        onDeleteArea={onDeleteArea}
                        onRenameArea={onRenameArea}
                        onToggleMandatory={onToggleMandatory}
                        onChangeAreaType={onChangeAreaType}
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
