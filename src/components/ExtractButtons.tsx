import React, { useEffect, useState } from "react";
import {
  DATA_TYPE_LABELS,
  LEAPFROG_LABELS,
  LEAPFROG_TYPES,
  type Area,
  type ExtractionProgress,
  type PageTextData,
} from "../types";
import {
  downloadAllValidation,
  downloadSingleCSV,
  downloadZip,
  exportCSV,
  exportExcel,
  exportJSON,
  getDropdownItemClass,
} from "../utils/downloadUtils";
import { validateExportRequirements } from "../utils/leapfrogExport";
import { ChevronDown, ChevronUp, Download, Eye, Settings } from "lucide-react";
import { millisecondsToTimerFormat } from "../utils/helpers";
import { Button, OverlayTrigger, Tooltip } from "react-bootstrap";

interface ExtractButtonProps {
  areas: Area[];
  hasFile: boolean;
  isExtracting: boolean;
  extractionProgress: ExtractionProgress | null;
  extractionStartTime: number;
  fileName: string | undefined;
  onPreview: () => void;
  onExtractTexts: () => Promise<PageTextData[]>;
  onCancelExtraction: () => void;
}

const ExtractButtons: React.FC<ExtractButtonProps> = ({
  areas,
  hasFile,
  isExtracting,
  extractionProgress,
  extractionStartTime,
  fileName,
  onPreview,
  onExtractTexts,
  onCancelExtraction,
}) => {
  const [validationData, setValidationData] = useState<any>(
    downloadAllValidation(areas)
  );
  const [advancedDownload, setAdvancedDownload] = useState<boolean>(false);
  const [elapsedTimeString, setElapsedTimeString] = useState<string>("");
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [decimalSeparator, setDecimalSeparator] = useState<"comma" | "dot">(
    "comma"
  );
  useEffect(() => {
    setValidationData(downloadAllValidation(areas));
  }, [areas, advancedDownload]);

  const handleDownloadExcel = async () => {
    try {
      const extractedTexts = await onExtractTexts();
      exportExcel(areas, extractedTexts);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Extração cancelada pelo usuário"
      ) {
        console.log("Download cancelado pelo usuário");
        return;
      }
      console.error("Download cancelado:", error);
    }
  };

  const handleDownloadCSV = async () => {
    try {
      const extractedTexts = await onExtractTexts();
      exportCSV(areas, extractedTexts, decimalSeparator === "comma");
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Extração cancelada pelo usuário"
      ) {
        console.log("Download cancelado pelo usuário");
        return;
      }
      console.error("Download cancelado:", error);
    }
  };
  const handleDownloadJSON = async () => {
    try {
      const extractedTexts = await onExtractTexts();
      exportJSON(areas, extractedTexts);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Extração cancelada pelo usuário"
      ) {
        console.log("Download cancelado pelo usuário");
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
        decimalSeparator === "comma"
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Extração cancelada pelo usuário"
      ) {
        console.log("Download cancelado pelo usuário");
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
        decimalSeparator === "comma"
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Extração cancelada pelo usuário"
      ) {
        console.log("Download cancelado pelo usuário");
        return;
      }
      console.error("Download cancelado:", error);
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
          {fileName && (
            <small className="text-muted">
              Extraindo dados do arquivo <strong>{fileName}</strong>
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
      <div className="d-flex align-items-start gap-3">
        {/* Botão de pré-visualizar */}
        <div>
          <button
            className="btn btn-outline-primary"
            onClick={onPreview}
            disabled={
              !(
                areas.length > 0 &&
                hasFile &&
                areas.some((area) => area.coordinates)
              )
            }
          >
            <Eye className="me-1" size={16} />
            Visualizar
          </button>
        </div>

        {/* Dropdown de Download completo */}
        <div className="btn-group dropup">
          <OverlayTrigger
            overlay={<Tooltip id="xls-tooltip">Download XLS</Tooltip>}
          >
            <Button
              variant="secondary"
              type="button"
              onClick={handleDownloadExcel}
            >
              <Download className="me-1" size={16} />
              Excel
            </Button>
          </OverlayTrigger>
          <button
            className="btn btn-secondary dropdown-toggle dropdown-toggle-split"
            type="button"
            data-bs-toggle="dropdown"
            aria-haspopup="true"
            aria-expanded="false"
          >
            <span className="visually-hidden">Mais opções</span>
          </button>
          <ul className="dropdown-menu">
            <li>
              <button
                className="dropdown-item"
                type="button"
                onClick={handleDownloadJSON}
              >
                JSON
              </button>
            </li>
            <li>
              <button
                className="dropdown-item"
                type="button"
                onClick={handleDownloadCSV}
              >
                CSV
              </button>
            </li>
          </ul>
        </div>

        {/* Dropdown de export Leapfrog */}
        <div className="d-flex flex-column align-items-start">
          <div>
            <div className="btn-group dropup">
              <button
                className="btn btn-secondary"
                type="button"
                onClick={handleDownloadAllLeapfrog}
                disabled={!validationData.someValid}
                data-bs-toggle="tooltip"
                data-bs-target="tooltip"
                data-bs-placement="top"
                data-bs-title={
                  validationData.allValid
                    ? `Exportar todos os arquivos`
                    : advancedDownload && validationData.someValid
                    ? `Exportar ${validationData.validExports.join(
                        ", "
                      )} completo(s) e ${validationData.nonValidExports.join(
                        ", "
                      )} incompleto(s)`
                    : advancedDownload
                    ? "Exportar todos incompletos"
                    : validationData.someValid
                    ? `Exportar ${validationData.validExports.join(", ")}`
                    : "Dados insuficientes para gerar arquivos"
                }
              >
                <Download className="me-1" size={16} />
                Leapfrog
              </button>
              <button
                type="button"
                className="btn btn-secondary dropdown-toggle dropdown-toggle-split"
                data-bs-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false"
              >
                <span className="visually-hidden">Mais opções</span>
              </button>

              <ul className="dropdown-menu" style={{ zIndex: "1001" }}>
                {LEAPFROG_TYPES.map((type) => {
                  const validation = validateExportRequirements(areas, type);
                  return (
                    <li
                      key={`export-leapfrog-${type}`}
                      data-bs-toggle="tooltip"
                      data-bs-target="tooltip"
                      data-bs-placement="left"
                      data-bs-title={
                        validation.isValid
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
                              .join(", ")}`
                      }
                    >
                      <button
                        className={getDropdownItemClass(
                          areas,
                          type,
                          advancedDownload
                        )}
                        onClick={() => handleDownloadSingleCSV(type)}
                      >
                        {LEAPFROG_LABELS[type]}
                      </button>
                    </li>
                  );
                })}
              </ul>
              {/* Botão de Configurações */}
              <div className="d-flex align-items-center">
                <Button
                  className="btn p-0 ms-2 border-0 bg-transparent d-flex align-items-center"
                  style={{ color: "#222" }}
                  onClick={() => setShowSettings(!showSettings)}
                  title="Configurações"
                >
                  <Settings size={18} className="me-1" />
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
    </>
  );
};

export default ExtractButtons;
