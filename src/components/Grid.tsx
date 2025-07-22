import { useEffect, useRef, useState } from "react";

import PdfViewer, { type PdfViewerRef } from "./PdfViewer";
import Menu from "./Menu";
import type { Area, PageTextData, SelectionArea } from "../types";
import {
  addNewArea,
  clearArea,
  deleteArea,
  renameArea,
  updateAreaCoordinates,
} from "../utils/areaUtils";
import MenuCard from "./MenuCard";
import { extractText } from "../utils/textExtractor";

function Grid() {
  // ref do pdfviewer para poder chamar função
  const pdfViewerRef = useRef<PdfViewerRef>(null);

  // state da extração de texto
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [extractedTexts, setExtractedTexts] = useState<PageTextData[]>([]);

  // state para áreas selecionadas
  const [areas, setAreas] = useState<Area[]>([]);
  const [isSelectionActive, setIsSelectionActive] = useState(false);
  const [activeAreaId, setActiveAreaId] = useState<string | null>(null);

  // criar nova área
  const onAddNewArea = () => {
    if (areas.length >= 10) {
      alert("Limite de 10 áreas atingido");
      return;
    }
    setAreas((prev) => addNewArea(prev));
  };

  // funções de manipulação das áreas
  const onDeleteArea = (areaId: string) => {
    setAreas((prev) => deleteArea(prev, areaId));
  };
  const onRenameArea = (areaId: string, newName: string) => {
    setAreas((prev) => renameArea(prev, areaId, newName));
  };
  const onClearArea = (areaId: string) => {
    setAreas((prev) => clearArea(prev, areaId));
  };

  // funções de seleção de área
  const startAreaSelection = (areaId: string) => {
    setActiveAreaId(areaId);
    setIsSelectionActive(true);
  };
  const finishAreaSelection = (coords: SelectionArea) => {
    if (activeAreaId) {
      setAreas((prev) => updateAreaCoordinates(prev, activeAreaId, coords));
    }
    setIsSelectionActive(false);
    setActiveAreaId(null);
  };

  // funções de extrair texto
  const handleExtraxtTexts = async () => {
    const pdfDocument = pdfViewerRef.current?.getDocument();
    if (!pdfDocument) return;

    const renderedWidth =
      document.querySelector(".react-pdf__Page")?.getBoundingClientRect()
        .width || 600;
    const page = await pdfDocument.getPage(1);
    const originalViewport = page.getViewport({ scale: 1 });
    const renderedScale = renderedWidth / originalViewport.width;
    const extracted = await extractText(areas, pdfDocument, renderedScale);

    setExtractedTexts(extracted);
  };

  // função carregar presets
  const onLoadPreset = (areas: Area[]) => {
    setAreas(areas);
  };

  // Cancelar seleção
  const cancelSelection = () => {
    setIsSelectionActive(false);
    setActiveAreaId(null);
  };

  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSelectionActive) {
        cancelSelection();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const pdfContainer = document.querySelector(".pdf-container");
      if (isSelectionActive && !pdfContainer?.contains(e.target as Node)) {
        cancelSelection();
      }
    };
    document.addEventListener("keydown", handleEscKey);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleEscKey);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSelectionActive]);

  // Reordenando AreaItems com DragNDrop
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const startIndex = result.source.index;
    const endIndex = result.destination.index;

    if (startIndex === endIndex) return;

    const newAreas = Array.from(areas);
    const [movedItem] = newAreas.splice(startIndex, 1);
    newAreas.splice(endIndex, 0, movedItem);

    const updatedAreas = newAreas.map((area, index) => ({
      ...area,
      order: index + 1,
    }));

    setAreas(updatedAreas);
  };

  return (
    <>
      {isSelectionActive && <div className="selection-mode-overlay" />}
      <div className="container text-center">
        <div className="row justify-content-center">
          <div
            className="col-12 col-lg-4 col-xl-5 col-xxl-auto"
            style={{ maxWidth: "450px", minWidth: "300px" }}
          >
            <MenuCard>
              <Menu
                onFileSelect={setSelectedFile}
                onExtractTexts={handleExtraxtTexts}
                onStartAreaSelection={startAreaSelection}
                onClearArea={onClearArea}
                onDeleteArea={onDeleteArea}
                onRenameArea={onRenameArea}
                onAddNewArea={onAddNewArea}
                onLoadPreset={onLoadPreset}
                onDragEnd={handleDragEnd}
                extractedTexts={extractedTexts}
                areas={areas}
                hasFile={!!selectedFile}
              />
            </MenuCard>
          </div>
          <div className="col-12 col-lg-8 col-xl-7 col-xxl">
            <PdfViewer
              ref={pdfViewerRef}
              file={selectedFile}
              isSelectingActive={isSelectionActive}
              activeAreaId={activeAreaId}
              onFinishSelection={finishAreaSelection}
              areas={areas}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default Grid;
