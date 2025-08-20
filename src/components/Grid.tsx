import { useEffect, useRef, useState } from "react";

import PdfViewer, { type PdfViewerRef } from "./PdfViewer";
import Menu from "./Menu";
import {
  DATA_TYPE_LABELS,
  MANDATORY_TYPES,
  REPEATING_TYPES,
  type Area,
  type DataType,
  type ExtractionProgress,
  type ExtractionType,
  type PageTextData,
  type SelectionArea,
} from "../types";
import {
  addNewArea,
  clearArea,
  deleteArea,
  generateAreasFingerprint,
  getUniqueName,
  renameArea,
  shouldRename,
  updateAreaCoordinates,
} from "../utils/areaUtils";
import MenuCard from "./MenuCard";
import { extractText } from "../utils/textExtractor";
import ExtractedDataPanel from "./ExtractedDataPanel";
import PageHeader from "./PageHeader";
import ExtractButtons from "./ExtractButtons";

function Grid() {
  // ref do pdfviewer para poder chamar função
  const pdfViewerRef = useRef<PdfViewerRef>(null);

  // state da extração de texto
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractionProgress, setExtractionProgress] =
    useState<ExtractionProgress | null>(null);
  const [extractionStartTime, setExtractionStartTime] = useState<number>(0);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const [extractedTexts, setExtractedTexts] = useState<PageTextData[]>([]);

  // modo da extração de texto
  const [extractionMode, setExtractionMode] = useState<ExtractionType>("text");

  // state para áreas selecionadas
  const [areas, setAreas] = useState<Area[]>([]);
  const [isSelectionActive, setIsSelectionActive] = useState(false);
  const [activeAreaId, setActiveAreaId] = useState<string | null>(null);

  // criar nova área
  const onAddNewArea = (type?: DataType) => {
    if (areas.length >= 15) {
      alert("Limite de 15 áreas atingido");
      return;
    }
    const isOCR = extractionMode === "ocr";
    setAreas((prev) => addNewArea(prev, isOCR, type));
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

  const [lastExtractedFingerprint, setLastExtractedFingerprint] =
    useState<string>("");
  const [cachedExtractedTexts, setCachedExtractedTexts] = useState<
    PageTextData[]
  >([]);

  // Função para verificar se precisa extrair novamente
  const needsReExtraction = (): boolean => {
    const currentFingerprint = generateAreasFingerprint(areas, selectedFile);
    const needs =
      currentFingerprint !== lastExtractedFingerprint ||
      cachedExtractedTexts.length === 0;
    return needs;
  };

  // funções de extrair texto
  const handleExtraxtTexts = async (): Promise<PageTextData[]> => {
    console.log(needsReExtraction());
    if (!needsReExtraction()) {
      return cachedExtractedTexts;
    }

    const controller = new AbortController();
    setAbortController(controller);
    setIsExtracting(true);
    setExtractionStartTime(Date.now());

    const pdfDocument = pdfViewerRef.current?.getDocument();
    const hasRepeatAreas = areas.some((area) => area.repeatInPages);
    const holeId = areas.find((area) => area.dataType === "hole_id");
    const areasWithoutCoords = areas
      .filter((area) => !area.coordinates)
      .map((area) => area.name);

    if (areasWithoutCoords.length > 0) {
      const proceed = confirm(
        "A(s) seguinte(s) área(s) não possue(m) coordenadas:\n" +
          areasWithoutCoords.join(", ") +
          "\n" +
          "Deseja continuar mesmo assim?"
      );
      if (!proceed) {
        throw new Error("Extração cancelada pelo usuário");
      }
    }
    if (!holeId && hasRepeatAreas) {
      const proceed = confirm(
        "Algumas áreas estão configuradas como 'Único' mas não há uma área de ID da Sondagem. " +
          "A função não vai funcionar corretamente. Deseja continuar mesmo assim?"
      );
      if (!proceed) {
        throw new Error("Extração cancelada pelo usuário");
      }
    }

    if (!pdfDocument) {
      throw new Error("PDF não carregado");
    }

    const extracted = await extractText(
      areas,
      pdfDocument,
      controller.signal,
      setExtractionProgress
    );

    setExtractedTexts(extracted);
    setCachedExtractedTexts(extracted);
    setLastExtractedFingerprint(generateAreasFingerprint(areas, selectedFile));

    return extracted;
  };

  const handlePreview = async () => {
    try {
      setIsExtracting(true);
      await handleExtraxtTexts();
    } catch (error) {
      console.error("Erro na extração: ", error);
    } finally {
      setIsExtracting(false);
    }
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

  const handleToggleMandatory = (areaId: string, mandatory: boolean) => {
    setAreas((prev) =>
      prev.map((area) =>
        area.id === areaId ? { ...area, isMandatory: mandatory } : area
      )
    );
  };

  const handleToggleRepeat = (areaId: string, repeat: boolean) => {
    setAreas((prev) =>
      prev.map((area) =>
        area.id === areaId ? { ...area, repeatInPages: repeat } : area
      )
    );
  };

  const handleToggleAreaOCR = (areaId: string, ocr: boolean) => {
    setAreas((prev) =>
      prev.map((area) => (area.id === areaId ? { ...area, ocr: ocr } : area))
    );
  };

  const handleChangeExtractionMode = (mode: ExtractionType) => {
    setExtractionMode(mode);
    if (mode !== "both") {
      const isOCR = mode === "ocr";
      setAreas((prev) => prev.map((area) => ({ ...area, ocr: isOCR })));
    }
  };

  const handleChangeAreaType = (areaId: string, newType: DataType) => {
    const repeat = REPEATING_TYPES.includes(newType);
    const mandatory = MANDATORY_TYPES.includes(newType);

    setAreas((prev) =>
      prev.map((area) =>
        area.id === areaId
          ? {
              ...area,
              dataType: newType,
              repeatInPages: repeat,
              isMandatory: mandatory,
              name:
                shouldRename(area.name) && newType === "default"
                  ? getUniqueName("Nova Área", prev)
                  : shouldRename(area.name)
                  ? getUniqueName(DATA_TYPE_LABELS[newType], prev)
                  : area.name,
            }
          : area
      )
    );
  };

  const handleCancelExtraction = () => {
    if (abortController) {
      abortController.abort();
    }
  };

  return (
    <>
      {isSelectionActive && <div className="selection-mode-overlay" />}
      <div className="container-fluid text-center px-xl-5">
        <div className="row justify-content-center">
          <PageHeader />
        </div>

        <div className="row justify-content-center">
          <div
            className="col-12 col-lg-6 col-xxl-4 col-xxxl-4"
            style={{ maxWidth: "450px", minWidth: "300px" }}
          >
            <MenuCard
              areas={areas}
              areasMenu={
                <Menu
                  onFileSelect={setSelectedFile}
                  onStartAreaSelection={startAreaSelection}
                  onClearArea={onClearArea}
                  onDeleteArea={onDeleteArea}
                  onRenameArea={onRenameArea}
                  onAddNewArea={onAddNewArea}
                  onLoadPreset={onLoadPreset}
                  onDragEnd={handleDragEnd}
                  onToggleMandatory={handleToggleMandatory}
                  onToggleRepeat={handleToggleRepeat}
                  onChangeAreaType={handleChangeAreaType}
                  onToggleAreaOCR={handleToggleAreaOCR}
                  areas={areas}
                  hasFile={!!selectedFile}
                  extractionMode={extractionMode}
                  onChangeExtractionMode={handleChangeExtractionMode}
                />
              }
              extractMenu={
                <ExtractButtons
                  onPreview={handlePreview}
                  onExtractTexts={handleExtraxtTexts}
                  onCancelExtraction={handleCancelExtraction}
                  areas={areas}
                  hasFile={!!selectedFile}
                  isExtracting={isExtracting}
                  extractionProgress={extractionProgress}
                  extractionStartTime={extractionStartTime}
                  fileName={selectedFile?.name}
                />
              }
            ></MenuCard>
          </div>
          <div className="col-12 col-lg-6 col-xxl-5 col-xxxl-4">
            <PdfViewer
              ref={pdfViewerRef}
              file={selectedFile}
              isSelectingActive={isSelectionActive}
              activeAreaId={activeAreaId}
              onFinishSelection={finishAreaSelection}
              areas={areas}
            />
          </div>
          <div className="col-12 col-lg-6 col-xxl-3 col-xxxl-4">
            <ExtractedDataPanel
              extractedTexts={extractedTexts}
              areas={areas}
              isExtracting={isExtracting}
              fileName={selectedFile?.name || undefined}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default Grid;
