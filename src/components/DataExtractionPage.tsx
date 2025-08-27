import { useEffect, useRef, useState } from "react";

import PdfViewer, { type PdfViewerRef } from "./PdfViewer";
import Menu from "./Menu";
import {
  DATA_TYPE_LABELS,
  EASY_ADD_TYPES,
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
import ExtractButtons from "./ExtractButtons";
import { Col, Row } from "react-bootstrap";

interface DataExtractionPageProps {
  areas: Area[];
  setAreas: (areas: Area[]) => void;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  extractedTexts: PageTextData[];
  setExtractedTexts: (texts: PageTextData[]) => void;
  onShowHelp: () => void;
}

function DataExtractionPage({
  areas,
  setAreas,
  selectedFile,
  setSelectedFile,
  extractedTexts,
  setExtractedTexts,
  onShowHelp,
}: DataExtractionPageProps) {
  // ref do pdfviewer para poder chamar função
  const pdfViewerRef = useRef<PdfViewerRef>(null);

  // state da extração de texto
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractionProgress, setExtractionProgress] =
    useState<ExtractionProgress | null>(null);
  const [extractionStartTime, setExtractionStartTime] = useState<number>(0);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  // modo da extração de texto
  const [extractionMode, setExtractionMode] = useState<ExtractionType>("text");

  // state para áreas selecionadas
  const [isSelectionActive, setIsSelectionActive] = useState(false);
  const [activeAreaId, setActiveAreaId] = useState<string | null>(null);

  // criar nova área
  const onAddNewArea = (type?: DataType) => {
    if (areas.length >= 15) {
      alert("Limite de 15 áreas atingido");
      return;
    }
    const isOCR = extractionMode === "ocr";
    setAreas(addNewArea(areas, isOCR, type));
  };

  // funções de manipulação das áreas
  const onDeleteArea = (areaId: string) => {
    setAreas(deleteArea(areas, areaId));
  };
  const handleDeleteAllAreas = () => {
    setAreas([]);
  };
  const handleCreateMissingAreas = () => {
    const typesToAdd = EASY_ADD_TYPES.filter(
      (type) => !areas.find((area) => area.dataType === type)
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
    setAreas(currentAreas);
  };

  const onRenameArea = (areaId: string, newName: string) => {
    setAreas(renameArea(areas, areaId, newName));
  };
  const onClearArea = (areaId: string) => {
    setAreas(clearArea(areas, areaId));
  };

  // funções de seleção de área
  const startAreaSelection = (areaId: string) => {
    setActiveAreaId(areaId);
    setIsSelectionActive(true);
  };
  const finishAreaSelection = (coords: SelectionArea) => {
    if (activeAreaId) {
      setAreas(updateAreaCoordinates(areas, activeAreaId, coords));
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

    try {
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
      setLastExtractedFingerprint(
        generateAreasFingerprint(areas, selectedFile)
      );

      return extracted;
    } catch (error) {
      throw error;
    } finally {
      setIsExtracting(false);
      setExtractionProgress(null);
      setAbortController(null);
    }
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
    setAreas(
      areas.map((area) =>
        area.id === areaId ? { ...area, isMandatory: mandatory } : area
      )
    );
  };

  const handleToggleRepeat = (areaId: string, repeat: boolean) => {
    setAreas(
      areas.map((area) =>
        area.id === areaId ? { ...area, repeatInPages: repeat } : area
      )
    );
  };

  const handleToggleAreaOCR = (areaId: string, ocr: boolean) => {
    setAreas(
      areas.map((area) => (area.id === areaId ? { ...area, ocr: ocr } : area))
    );
  };

  const handleChangeExtractionMode = (mode: ExtractionType) => {
    setExtractionMode(mode);
    if (mode !== "both") {
      const isOCR = mode === "ocr";
      setAreas(areas.map((area) => ({ ...area, ocr: isOCR })));
    }
  };

  const handleChangeAreaType = (areaId: string, newType: DataType) => {
    const repeat = REPEATING_TYPES.includes(newType);
    const mandatory = MANDATORY_TYPES.includes(newType);

    setAreas(
      areas.map((area) =>
        area.id === areaId
          ? {
              ...area,
              dataType: newType,
              repeatInPages: repeat,
              isMandatory: mandatory,
              name:
                shouldRename(area.name) && newType === "default"
                  ? getUniqueName("Nova Área", areas)
                  : shouldRename(area.name)
                  ? getUniqueName(DATA_TYPE_LABELS[newType], areas)
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

      <Row className="justify-content-center">
        <Col
          xs={12}
          lg={6}
          xxl={4}
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
                onDeleteAllAreas={handleDeleteAllAreas}
                onRenameArea={onRenameArea}
                onAddNewArea={onAddNewArea}
                onCreateMissingAreas={handleCreateMissingAreas}
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
                onShowHelp={onShowHelp}
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
        </Col>
        <Col xs={12} lg={6} xxl={5} xxxl={4}>
          <PdfViewer
            ref={pdfViewerRef}
            file={selectedFile}
            isSelectingActive={isSelectionActive}
            activeAreaId={activeAreaId}
            onFinishSelection={finishAreaSelection}
            areas={areas}
          />
        </Col>
        <Col xs={12} lg={6} xxl={3} xxxl={4}>
          <ExtractedDataPanel
            extractedTexts={extractedTexts}
            areas={areas}
            isExtracting={isExtracting}
            fileName={selectedFile?.name || undefined}
          />
        </Col>
      </Row>
    </>
  );
}

export default DataExtractionPage;
