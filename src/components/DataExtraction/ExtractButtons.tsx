import React, { useEffect, useState } from "react";
import {
  DATA_TYPE_LABELS,
  LEAPFROG_LABELS,
  LEAPFROG_TYPES,
  type ExtractionProgress,
  type PageTextData,
} from "@types";
import {
  convertToPalitoData,
  downloadAllValidation,
  downloadSingleCSV,
  downloadZip,
  exportCSV,
  exportExcel,
  exportJSON,
  getDropdownItemClass,
} from "@utils/downloadUtils";
import { validateExportRequirements } from "@utils/leapfrogExport";
import { ChevronDown, ChevronUp } from "lucide-react";
import { millisecondsToTimerFormat } from "@utils/helpers";
import {
  Button,
  ButtonGroup,
  Dropdown,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import MapModal from "./MapModal";
import { useExtractionContext } from "@/contexts/ExtractionContext";
import PageExclusionModal from "./PageExclusion/PageExclusionModal";
import JSZip from "jszip";
import { generateMultipleAGSFiles } from "@/utils/agsGenerator";
import AGSExportModal from "./AGSExportModal";
import { analytics } from "@/utils/analyticsUtils";
import type { AnalyticsCounters } from "@/types/analyticsTypes";

interface ExtractButtonProps {
  extractionProgress: ExtractionProgress | null;
  extractionStartTime: number;
  onPreview: () => void;
  onExtractTexts: () => Promise<PageTextData[]>;
  onCancelExtraction: () => void;
}

const ExtractButtons: React.FC<ExtractButtonProps> = ({
  extractionProgress,
  extractionStartTime,
  onPreview,
  onExtractTexts,
  onCancelExtraction,
}) => {
  const { extractionState } = useExtractionContext();
  const { areas, extractedTexts, selectedFile, isExtracting } = extractionState;

  const [validationData, setValidationData] = useState<any>(
    downloadAllValidation(areas),
  );
  const [advancedDownload, setAdvancedDownload] = useState<boolean>(false);
  const [elapsedTimeString, setElapsedTimeString] = useState<string>("");
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [decimalSeparator, setDecimalSeparator] = useState<"comma" | "dot">(
    "comma",
  );
  const [showPageExclusionModal, setShowPageExclusionModal] = useState(false);
  const [showAGSModal, setShowAGSModal] = useState<boolean>(false);
  useEffect(() => {
    setValidationData(downloadAllValidation(areas));
  }, [areas, advancedDownload]);

  const handleDownloadExcel = async () => {
    try {
      const extractedTexts = await onExtractTexts();
      exportExcel(areas, extractedTexts);
      analytics.track("export_excel");
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Extração cancelada pelo usuário"
      ) {
        return;
      }
      console.error("Download cancelado:", error);
    }
  };

  const handleDownloadCSV = async () => {
    try {
      const extractedTexts = await onExtractTexts();
      exportCSV(areas, extractedTexts, decimalSeparator === "comma");
      analytics.track("export_csv");
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Extração cancelada pelo usuário"
      ) {
        return;
      }
      console.error("Download cancelado:", error);
    }
  };
  const handleDownloadJSON = async () => {
    try {
      const extractedTexts = await onExtractTexts();
      exportJSON(areas, extractedTexts);
      analytics.track("export_json");
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Extração cancelada pelo usuário"
      ) {
        return;
      }
      console.error("Download cancelado:", error);
    }
  };
  const handleDownloadAllLeapfrog = async () => {
    try {
      const extractedTexts = await onExtractTexts();
      downloadZip(
        areas,
        extractedTexts,
        advancedDownload,
        decimalSeparator === "comma",
      );
      analytics.track("export_leapfrog_zip");
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Extração cancelada pelo usuário"
      ) {
        return;
      }
      console.error("Download cancelado:", error);
    }
  };
  const handleDownloadSingleCSV = async (type: string) => {
    try {
      const extractedTexts = await onExtractTexts();
      downloadSingleCSV(
        areas,
        extractedTexts,
        type,
        decimalSeparator === "comma",
      );
      const event = ["collar", "nspt", "na", "geology", "interp"].includes(type)
        ? "export_leapfrog_" + type
        : undefined;
      if (event) {
        analytics.track(event as keyof AnalyticsCounters);
      }
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Extração cancelada pelo usuário"
      ) {
        return;
      }
      console.error("Download cancelado:", error);
    }
  };

  const handleExportAGS = async (
    projectData: any,
    tranInput: any,
    abbreviations: any,
  ) => {
    try {
      const extractedTexts = await onExtractTexts();
      const palitoData = convertToPalitoData(areas, extractedTexts);

      // Gera os arquivos AGS
      const agsFiles = generateMultipleAGSFiles(
        palitoData,
        projectData,
        tranInput,
        abbreviations,
      );

      // Se for apenas 1 arquivo, baixa direto
      if (agsFiles.length === 1) {
        const file = agsFiles[0];
        const blob = new Blob([file.content], {
          type: "text/plain;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = file.filename;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        // Múltiplos arquivos - cria ZIP
        const zip = new JSZip();
        agsFiles.forEach((file) => {
          zip.file(file.filename, file.content);
        });

        const zipBlob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "sondagens-ags.zip";
        link.click();
        URL.revokeObjectURL(url);
      }

      setShowAGSModal(false);
      analytics.track("export_ags");
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Extração cancelada pelo usuário"
      ) {
        return;
      }
      console.error("Erro ao exportar AGS:", error);
    }
  };

  // Timer para atualizar tempo a cada 100ms
  useEffect(() => {
    if (!isExtracting) {
      setElapsedTimeString("");
      return;
    }
    const interval = setInterval(() => {
      const elapsed = Date.now() - extractionStartTime;
      setElapsedTimeString(millisecondsToTimerFormat(elapsed, 10));
    }, 100); // Atualiza a cada 100ms

    return () => clearInterval(interval);
  }, [isExtracting, extractionStartTime]);

  return isExtracting ? (
    <>
      <div className="d-flex align-items-center justify-content-between p-1">
        <div className="d-flex flex-column text-start">
          {selectedFile?.name && (
            <small className="text-muted">
              Extraindo dados do arquivo <strong>{selectedFile.name}</strong>
            </small>
          )}
          <small className="text-muted">
            {extractionProgress && extractionProgress.message}
          </small>
          <small className="text-secondary">
            Tempo decorrido: <strong>{elapsedTimeString}</strong>
          </small>
        </div>

        <button
          className="btn btn-outline-danger btn-sm ms-3"
          onClick={onCancelExtraction}
        >
          Cancelar
        </button>
      </div>
    </>
  ) : (
    <>
      <div>
        <h6
          className="text-muted text-start mb-0"
          style={{ fontSize: "0.875rem" }}
        >
          Ações
        </h6>
        <div className="d-flex justify-content-center">
          <div className="d-flex gap-1">
            <div>
              <OverlayTrigger
                overlay={
                  <Tooltip id="json-tooltip">
                    Extrair e pré-visualizar dados
                  </Tooltip>
                }
              >
                <Button
                  variant={"secondary"}
                  onClick={onPreview}
                  disabled={
                    !(
                      areas.length > 0 &&
                      !!selectedFile &&
                      areas.some((area) => area.coordinates)
                    )
                  }
                >
                  Visualizar
                </Button>
              </OverlayTrigger>
            </div>
            <div>
              <MapModal extractedTexts={extractedTexts} areas={areas} />
            </div>
            <div>
              <OverlayTrigger
                overlay={
                  <Tooltip id="json-tooltip">
                    Selecionar páginas para excluir
                  </Tooltip>
                }
              >
                <Button
                  variant={"secondary"}
                  onClick={() => setShowPageExclusionModal(true)}
                  disabled={!selectedFile}
                >
                  Ignorar páginas
                </Button>
              </OverlayTrigger>
            </div>
          </div>
        </div>

        <hr className="my-2" />

        {/* Dropdown de Download completo */}
        <h6
          className="text-muted text-start mb-1"
          style={{ fontSize: "0.875rem" }}
        >
          Downloads
        </h6>
        <div className="d-flex align-items-start justify-content-between">
          <div style={{ width: "30px" }}></div>
          <div className="d-flex gap-1">
            <OverlayTrigger
              overlay={
                <Tooltip id="json-tooltip">
                  Download JSON - Utilizado para geração de palitos
                </Tooltip>
              }
            >
              <Button
                variant="secondary"
                onClick={handleDownloadJSON}
                disabled={
                  !(
                    areas.length > 0 &&
                    !!selectedFile &&
                    areas.some((area) => area.coordinates)
                  )
                }
              >
                JSON
              </Button>
            </OverlayTrigger>
            <div className="btn-group dropup">
              <Dropdown as={ButtonGroup}>
                <OverlayTrigger
                  overlay={
                    <Tooltip id="xls-tooltip">
                      Download dos dados em formato de planilha
                    </Tooltip>
                  }
                >
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={handleDownloadExcel}
                    disabled={
                      !(
                        areas.length > 0 &&
                        !!selectedFile &&
                        areas.some((area) => area.coordinates)
                      )
                    }
                  >
                    Planilha
                  </Button>
                </OverlayTrigger>
                <OverlayTrigger overlay={<Tooltip>Mais opções</Tooltip>}>
                  <Dropdown.Toggle
                    className="btn btn-secondary dropdown-toggle dropdown-toggle-split"
                    split
                    type="button"
                    aria-expanded="false"
                    disabled={
                      !(
                        areas.length > 0 &&
                        !!selectedFile &&
                        areas.some((area) => area.coordinates)
                      )
                    }
                  >
                    <span className="visually-hidden">Mais opções</span>
                  </Dropdown.Toggle>
                </OverlayTrigger>
                <Dropdown.Menu
                  className="dropdown-menu"
                  id="planiha-dropdown"
                  style={{ zIndex: 1001 }}
                >
                  <Dropdown.Item
                    className="dropdown-item"
                    onClick={handleDownloadExcel}
                  >
                    XLS (Excel)
                  </Dropdown.Item>
                  <Dropdown.Item
                    className="dropdown-item"
                    onClick={handleDownloadCSV}
                  >
                    CSV
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>

            {/* Botão AGS */}
            <OverlayTrigger
              overlay={
                <Tooltip id="ags-tooltip">Exportar no formato AGS4</Tooltip>
              }
            >
              <Button
                variant="secondary"
                onClick={() => setShowAGSModal(true)}
                disabled={
                  !(
                    areas.length > 0 &&
                    !!selectedFile &&
                    areas.some((area) => area.coordinates)
                  )
                }
              >
                AGS
              </Button>
            </OverlayTrigger>

            {/* Dropdown de export Leapfrog */}
            <div className="d-flex flex-column align-items-start">
              <div>
                <div className="btn-group dropup">
                  <Dropdown as={ButtonGroup}>
                    <OverlayTrigger
                      overlay={
                        <Tooltip id="leapfrog-tooltip">
                          {validationData.allValid
                            ? `Exportar todos os arquivos`
                            : advancedDownload && validationData.someValid
                              ? `Exportar ${validationData.validExports.join(
                                  ", ",
                                )} completo(s) e ${validationData.nonValidExports.join(
                                  ", ",
                                )} incompleto(s)`
                              : advancedDownload
                                ? "Exportar todos incompletos"
                                : validationData.someValid
                                  ? `Exportar ${validationData.validExports.join(", ")}`
                                  : "Dados insuficientes para gerar arquivos"}
                        </Tooltip>
                      }
                    >
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleDownloadAllLeapfrog}
                        disabled={!validationData.someValid}
                      >
                        Leapfrog
                      </Button>
                    </OverlayTrigger>
                    <Dropdown.Toggle
                      type="button"
                      className="btn btn-secondary dropdown-toggle dropdown-toggle-split"
                      aria-haspopup="true"
                      aria-expanded="false"
                    >
                      <span className="visually-hidden">Mais opções</span>
                    </Dropdown.Toggle>
                    <Dropdown.Menu
                      className="dropdown-menu"
                      style={{ zIndex: "1001" }}
                    >
                      {LEAPFROG_TYPES.map((type) => {
                        const validation = validateExportRequirements(
                          areas,
                          type,
                        );
                        return (
                          <OverlayTrigger
                            placement="left"
                            key={`${type}-overlay`}
                            overlay={
                              <Tooltip id="leapfrog-tooltip">
                                {validation.isValid
                                  ? `Exportar ${type}.csv`
                                  : advancedDownload
                                    ? `Exportar ${type}.csv incompleto (dados ausentes: ${validation.missingFields
                                        .map((t) => {
                                          return t === "depth"
                                            ? "Profundidades ou Profundidade Total"
                                            : DATA_TYPE_LABELS[t];
                                        })
                                        .join(", ")})`
                                    : `Campos faltantes: ${validation.missingFields
                                        .map((t) => {
                                          return t === "depth"
                                            ? "Profundidades ou Profundidade Total"
                                            : DATA_TYPE_LABELS[t];
                                        })
                                        .join(", ")}`}
                              </Tooltip>
                            }
                          >
                            <div>
                              <Dropdown.Item
                                className={getDropdownItemClass(
                                  areas,
                                  type,
                                  advancedDownload,
                                )}
                                onClick={() => handleDownloadSingleCSV(type)}
                              >
                                {LEAPFROG_LABELS[type]}
                              </Dropdown.Item>
                            </div>
                          </OverlayTrigger>
                        );
                      })}
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
              </div>
            </div>
            {/* Botão de Configurações */}
            <div className="d-flex align-items-center">
              <Button
                className="btn p-0 ms-2 border-0 bg-transparent d-flex align-items-center"
                style={{ color: "#222" }}
                onClick={() => setShowSettings(!showSettings)}
                title="Configurações"
              >
                {showSettings ? (
                  <ChevronUp size={18} />
                ) : (
                  <ChevronDown size={18} />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
      {showSettings && (
        <div className="px-1 mt-1">
          <div className="d-flex justify-content-between align-items-center">
            {/* Separador Decimal */}
            <div className="me-2" style={{ width: "80%" }}>
              <div className="d-flex align-items-start">
                <label className="form-label small mb-0 me-2 mt-1">
                  Separador decimal:
                </label>
                <div className="d-flex flex-column w-100">
                  <div className="form-check text-start">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="decimalSeparator"
                      id="comma"
                      value="comma"
                      checked={decimalSeparator === "comma"}
                      onChange={() => setDecimalSeparator("comma")}
                    />
                    <label className="form-check-label small" htmlFor="comma">
                      Vírgula (1,23)
                    </label>
                  </div>
                  <div className="form-check text-start">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="decimalSeparator"
                      id="dot"
                      value="dot"
                      checked={decimalSeparator === "dot"}
                      onChange={() => setDecimalSeparator("dot")}
                    />
                    <label className="form-check-label small" htmlFor="dot">
                      Ponto (1.23)
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Dados Incompletos */}
            <div className="flex-shrink-1">
              <div className="d-inline-flex align-items-center form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="advancedDownload"
                  checked={advancedDownload}
                  onChange={(e) => setAdvancedDownload(e.target.checked)}
                />
                <label
                  className="form-check-label small"
                  htmlFor="advancedDownload"
                >
                  Leapfrog: Aceitar dados incompletos
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal */}
      <PageExclusionModal
        show={showPageExclusionModal}
        onClose={() => setShowPageExclusionModal(false)}
      />
      {/* Modal Exportação AGS */}
      <AGSExportModal
        show={showAGSModal}
        onClose={() => setShowAGSModal(false)}
        palitoData={convertToPalitoData(areas, extractedTexts)}
        onExport={handleExportAGS}
      />
    </>
  );
};

export default ExtractButtons;
