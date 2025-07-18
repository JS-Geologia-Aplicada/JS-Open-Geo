import React, {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

import { Document, Page } from "react-pdf";

import type { Area, SelectionArea } from "../types";
import { clamp } from "../utils/pdfHelpers";
import SelectedAreas from "./SelectedAreas";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

interface PdfViewerProps {
  file: File | null;
  onTextsExtracted: (texts: ExtractedText[]) => void;
  isSelectingActive: boolean;
  activeAreaId: string | null;
  onFinishSelection: (coords: SelectionArea) => void;
  areas: Area[];
}

// Referências para chamar funções a partir de outros componentes
export interface PdfViewerRef {
  extractTexts: () => void;
  clearSelection: () => void;
}

// Objeto de texto extraído por página
interface ExtractedText {
  pageNumber: number;
  text: string;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;

const PdfViewer = forwardRef<PdfViewerRef, PdfViewerProps>(
  ({
    file,
    //onTextsExtracted,
    isSelectingActive,
    activeAreaId,
    onFinishSelection,
    areas,
  }) =>
    //ref
    {
      const documentRef = useRef<any>(null);

      // constantes para virar páginas
      const [numPages, setNumPages] = useState<number>();
      const [pageNumber, setPageNumber] = useState<number>(1);

      // Constantes para seleção de área

      const [startedSelection, setStartedSelection] = useState<boolean>(false);
      const [selectionStartPoint, setSelectionStartPoint] = useState<{
        x: number;
        y: number;
      } | null>(null);
      const [currentSelection, setCurrentSelection] =
        useState<SelectionArea | null>(null);

      const pdfRef = useRef<HTMLDivElement>(null);

      // Lidando com Zoom
      const [zoomScale, setZoomScale] = useState<number>(1);
      const [pendingPan, setPendingPan] = useState<{
        x: number;
        y: number;
      } | null>(null);

      const zoomIn = () => {
        setZoomScale((prev) => Math.min(prev + 0.25, MAX_ZOOM));
        pan(0, 0);
      };
      const zoomOut = () => {
        pan(0, 0);
        setZoomScale((prev) => Math.max(prev - 0.25, MIN_ZOOM));
      };

      const [pdfOffset, setPdfOffset] = useState<{ x: number; y: number }>({
        x: 0,
        y: 0,
      });
      const [panStartPoint, setPanStartPoint] = useState<{
        x: number;
        y: number;
      } | null>(null);
      const [isPanning, setIsPanning] = useState<boolean>(false);

      // Conjunto de funções para virar a página
      function changePage(offset: number) {
        setPageNumber((prevPageNumber) => prevPageNumber + offset);
      }
      function previousPage() {
        changePage(-1);
      }
      function nextPage() {
        changePage(1);
      }

      /**
       * Funções para seleção de área
       * - Primeiro clique inicia a seleção
       * - Mover o mouse altera a área sendo selecionada
       * - Clicar novamente completa a seleção
       */
      const toggleSelecting = (e: React.MouseEvent) => {
        if (!pdfRef.current) return;
        if (
          startedSelection &&
          currentSelection &&
          currentSelection.x >= 10 &&
          currentSelection.y >= 10
        ) {
          setStartedSelection(false);
          setCurrentSelection(null);
          onFinishSelection(currentSelection);
        } else if (!startedSelection) {
          const rect = pdfRef.current.getBoundingClientRect();
          const x = (e.clientX - rect.left) / zoomScale;
          const y = (e.clientY - rect.top) / zoomScale;
          setSelectionStartPoint({ x, y });
          setStartedSelection(true);
          setCurrentSelection(null);
        }
      };

      const startPanning = (e: React.MouseEvent) => {
        if (!pdfRef.current) return;

        const rect = pdfRef.current.getBoundingClientRect();

        setPanStartPoint({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        setIsPanning(true);
        return;
      };

      const handlePointerDown = useCallback(
        (e: React.PointerEvent) => {
          if (!pdfRef.current) return;
          e.currentTarget.setPointerCapture(e.pointerId);

          if (isSelectingActive) {
            toggleSelecting(e);
          } else {
            startPanning(e);
          }
        },
        [startedSelection, currentSelection, zoomScale, isSelectingActive]
      );
      const handlePointerMove = useCallback(
        (e: React.PointerEvent) => {
          if (!pdfRef.current) return;
          const rect = pdfRef.current.getBoundingClientRect();

          if (isPanning) {
            if (isPanning && panStartPoint) {
              const deltaX = e.clientX - rect.left - panStartPoint.x;
              const deltaY = e.clientY - rect.top - panStartPoint.y;
              pan(deltaX, deltaY);
            }

            return;
          }

          if (!startedSelection || !selectionStartPoint) return;

          const currentX = (e.clientX - rect.left) / zoomScale;
          const currentY = (e.clientY - rect.top) / zoomScale;

          const selection: SelectionArea = {
            x: Math.min(selectionStartPoint.x, currentX),
            y: Math.min(selectionStartPoint.y, currentY),
            width: Math.abs(selectionStartPoint.x - currentX),
            height: Math.abs(selectionStartPoint.y - currentY),
          };

          setCurrentSelection(selection);
        },
        [startedSelection, selectionStartPoint, isPanning, panStartPoint]
      );
      const handlePointerUp = useCallback(
        (e: React.PointerEvent) => {
          e.currentTarget.releasePointerCapture(e.pointerId);
          if (isPanning) {
            setIsPanning(false);
          }
        },
        [isPanning, startPanning]
      );

      useEffect(() => {
        if (!isSelectingActive) {
          clearCurrentSelection();
        }
      }, [isSelectingActive]);

      const clearCurrentSelection = () => {
        setStartedSelection(false);
        setCurrentSelection(null);
        setSelectionStartPoint(null);
      };

      const pan = useCallback((deltaX: number, deltaY: number) => {
        const containerElement = document.querySelector(
          ".pdf-container"
        ) as HTMLElement;
        const containerWidth =
          containerElement?.getBoundingClientRect().width || 600;
        const containerHeight = containerElement
          ? parseInt(getComputedStyle(containerElement).height)
          : 800;

        const pdfWidth =
          pdfRef.current
            ?.querySelector(".react-pdf__Page")
            ?.getBoundingClientRect().width || containerWidth;
        const pdfHeight =
          pdfRef.current
            ?.querySelector(".react-pdf__Page")
            ?.getBoundingClientRect().height || containerHeight;
        const pdfNavHeight =
          document.querySelector(".pdf-nav")?.getBoundingClientRect().height ||
          40;
        const larger = pdfWidth >= containerWidth;
        const taller = pdfHeight >= containerHeight - pdfNavHeight;
        const maxOffsetX = Math.max(0, pdfWidth - containerWidth);
        const maxOffsetY = Math.max(
          0,
          pdfHeight - containerHeight + pdfNavHeight
        );

        setPdfOffset((prev) => {
          return {
            x: larger ? clamp(prev.x + deltaX, -maxOffsetX, 0) : 0,
            y: taller ? clamp(prev.y + deltaY, -maxOffsetY, 0) : 0,
          };
        });
      }, []);

      useEffect(() => {
        if (!file) return;

        const containerElement = document.querySelector(
          ".pdf-container"
        ) as HTMLElement;
        if (!containerElement) return;

        const handleWheel = (e: WheelEvent) => {
          e.preventDefault();

          const containerRect = containerElement.getBoundingClientRect();
          const mousePercentX =
            (e.clientX - containerRect.left) / containerRect.width;
          const mousePercentY =
            (e.clientY - containerRect.top) / containerRect.height;
          const wheelZoomStep = 0.1;

          setZoomScale((oldZoom) => {
            const delta = e.deltaY > 0 ? -wheelZoomStep : wheelZoomStep;
            const newZoom = clamp(oldZoom + delta, MIN_ZOOM, MAX_ZOOM);

            const pdfElement =
              pdfRef.current?.querySelector(".react-pdf__Page");
            const pdfWidth = pdfElement?.getBoundingClientRect().width || 0;
            const pdfHeight = pdfElement?.getBoundingClientRect().height || 0;

            const zoomDelta = newZoom - oldZoom;
            const maxDeltaX = pdfWidth * zoomDelta;
            const maxDeltaY = pdfHeight * zoomDelta;

            const panX = maxDeltaX * mousePercentX;
            const panY = maxDeltaY * mousePercentY;

            setPendingPan({ x: -panX, y: -panY });

            return newZoom;
          });
        };

        containerElement.addEventListener("wheel", handleWheel, {
          passive: false,
        });

        return () => {
          containerElement.removeEventListener("wheel", handleWheel);
        };
      }, [file, zoomScale]);

      useEffect(() => {
        if (pendingPan) {
          pan(pendingPan.x, pendingPan.y);
          setPendingPan(null);
        }
      }, [zoomScale]);

      /**
       * Função para extrair o texto na área de seleção
       * - Loop que repete em cada página
       * - Considera questões de escala e posição do pdf e área de seleção
       * - Objetos com número da página e string são organizados em uma array
       */
      // const extractText = async () => {
      //   // Early return em caso de dados ausentes
      //   if (!documentRef.current || !numPages) return;

      //   const allStrings: ExtractedText[] = [];

      //   for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      //     const page = await documentRef.current.getPage(pageNum);

      //     // Encontrando a escala em que o pdf foi renderizado
      //     const originalViewport = page.getViewport({ scale: 1 });
      //     const renderedWidth =
      //       pdfRef.current
      //         ?.querySelector(".react-pdf__Page")
      //         ?.getBoundingClientRect().width || 600;
      //     const renderedScale = renderedWidth / originalViewport.width;

      //     const pdfCoords = convertCoordinates(
      //       selectionArea,
      //       renderedScale,
      //       zoomScale,
      //       originalViewport
      //     );

      //     // Extrair textos da página e filtrar pela áre selecionada
      //     const textContent = await page.getTextContent();

      //     const filteredTextContent = filterTextContent(textContent, pdfCoords);

      //     // Combinação do texto em string única por página
      //     const pageText = filteredTextContent
      //       .map((item: { str: any }) => item.str)
      //       .join(" ");
      //     allStrings.push({ pageNumber: pageNum, text: pageText });
      //   }

      //   onTextsExtracted(allStrings);
      // };

      // const clearSelection = () => {
      //   setCurrentSelection(null);
      //   setStartedSelection(false);
      //   setSelectionStartPoint(null);
      // };

      // useImperativeHandle(ref, () => ({
      //   extractTexts: extractText,
      //   clearSelection: clearSelection,
      // }));

      return !file ? (
        // Mensagem antes de carregar algum pdf
        <>
          <div className="row">
            <div
              className="col-12 d-flex justify-content-center align-items-center"
              style={{ minHeight: "50vh" }}
            >
              <p className="text-muted">
                Carregue um pdf para ser exibido aqui
              </p>
            </div>
          </div>
        </>
      ) : (
        // Exibindo o pdf
        <>
          <div
            className="pdf-container"
            style={{
              minWidth: "600px",
              height: "min(800px, 90vh)",
              overflow: "hidden",
              position: "relative",
              border: "2px solid black",
              marginTop: "30px",
              marginBottom: "15px",
            }}
          >
            <div
              ref={pdfRef}
              className={`position-relative d-inline-block ${
                isSelectingActive
                  ? "pdf-cursor-crosshair"
                  : isPanning
                  ? "pdf-cursor-grabbing"
                  : "pdf-cursor-grab"
              }`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              style={{
                userSelect: "none",
                transform: `translate(${pdfOffset.x}px, ${pdfOffset.y}px)`,
              }}
            >
              {/* Documento */}
              <Document
                file={file}
                onLoadSuccess={(pdfDoc) => {
                  setNumPages(pdfDoc.numPages);
                  setPageNumber(1);
                  setZoomScale(1);
                  documentRef.current = pdfDoc;
                }}
              >
                <Page
                  pageNumber={pageNumber}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  scale={zoomScale}
                />
              </Document>
              {/* Div para exibir área de seleção concluída */}
              <SelectedAreas
                areas={areas}
                zoomScale={zoomScale}
                activeAreaId={activeAreaId}
              />
              {/* Div para exibir área sendo selecionada */}
              {currentSelection && (
                <div
                  className="position-absolute border border-secondary"
                  style={{
                    left: currentSelection.x * zoomScale,
                    top: currentSelection.y * zoomScale,
                    width: currentSelection.width * zoomScale,
                    height: currentSelection.height * zoomScale,
                    backgroundColor: "rgba(134, 142, 135, 0.2)",
                    zIndex: 10,
                  }}
                ></div>
              )}
            </div>
            {/** Menu de navegação do pdf */}
            <div
              className="pdf-nav position-absolute bottom-0 start-0 end-0 d-flex align-items-center"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                backdropFilter: "blur(4px)",
                padding: "4px 12px",
              }}
            >
              <div className="flex-grow-1 d-flex justify-content-center">
                <span className="text-white small">
                  Página {pageNumber || 1} {numPages && `de ${numPages}`}
                </span>
              </div>
              <div className="d-flex gap-1">
                <button
                  className="pdf-nav-button"
                  title="Página anterior"
                  onClick={previousPage}
                  disabled={pageNumber <= 1}
                >
                  <ChevronLeft size={24} color="#d0d0d0" />
                </button>
                <button
                  className="pdf-nav-button"
                  title="Próxima página"
                  onClick={nextPage}
                  disabled={pageNumber >= (numPages ?? 0)}
                >
                  <ChevronRight size={24} color="#d0d0d0" />
                </button>
                <button
                  className="pdf-nav-button"
                  onClick={zoomOut}
                  disabled={zoomScale <= MIN_ZOOM}
                >
                  <ZoomOut size={24} color="#d0d0d0" />
                </button>
                <button
                  className="pdf-nav-button"
                  onClick={zoomIn}
                  disabled={zoomScale >= MAX_ZOOM}
                >
                  <ZoomIn size={24} color="#d0d0d0" />
                </button>
              </div>
            </div>
          </div>
        </>
      );
    }
);

export type { ExtractedText };
export default PdfViewer;
