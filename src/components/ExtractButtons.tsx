import React, { useEffect, useState } from "react";
import {
  DATA_TYPE_LABELS,
  LEAPFROG_LABELS,
  LEAPFROG_TYPES,
  type Area,
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
import { Tooltip } from "bootstrap";
import { Download, Eye } from "lucide-react";

interface ExtractButtonProps {
  areas: Area[];
  hasFile: boolean;
  onPreview: () => void;
  onExtractTexts: () => Promise<PageTextData[]>;
}

const ExtractButtons: React.FC<ExtractButtonProps> = ({
  onPreview,
  areas,
  hasFile,
  onExtractTexts,
}) => {
  const [validationData, setValidationData] = useState<any>(
    downloadAllValidation(areas)
  );
  const [advancedDownload, setAdvancedDownload] = useState<boolean>(false);
  useEffect(() => {
    setValidationData(downloadAllValidation(areas));
    const tooltipElements = document.querySelectorAll(
      '[data-bs-toggle="tooltip"]'
    );

    tooltipElements.forEach((element) => {
      const existingTooltip = Tooltip.getInstance(element);
      if (existingTooltip) {
        existingTooltip.dispose();
      }
      new Tooltip(element);
    });
  }, [areas, advancedDownload]);

  const handleDownloadExcel = async () => {
    try {
      const extractedTexts = await onExtractTexts();
      exportExcel(areas, extractedTexts);
    } catch (error) {
      console.error("Download cancelado:", error);
    }
  };

  const handleDownloadCSV = async () => {
    try {
      const extractedTexts = await onExtractTexts();
      exportCSV(areas, extractedTexts);
    } catch (error) {
      console.error("Download cancelado:", error);
    }
  };
  const handleDownloadJSON = async () => {
    try {
      const extractedTexts = await onExtractTexts();
      exportJSON(areas, extractedTexts);
    } catch (error) {
      console.error("Download cancelado:", error);
    }
  };
  const handleDownloadAllLeapfrog = async () => {
    try {
      const extractedTexts = await onExtractTexts();
      downloadZip(areas, extractedTexts, advancedDownload);
    } catch (error) {
      console.error("Download cancelado:", error);
    }
  };
  const handleDownloadSingleCSV = async (type: string) => {
    try {
      const extractedTexts = await onExtractTexts();
      downloadSingleCSV(areas, extractedTexts, type);
    } catch (error) {
      console.error("Download cancelado:", error);
    }
  };

  return (
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
        <button
          className="btn btn-secondary"
          type="button"
          onClick={handleDownloadExcel}
          data-bs-toggle="tooltip"
          data-bs-target="tooltip"
          data-bs-placement="top"
          data-bs-title="Download XLS"
        >
          <Download className="me-1" size={16} />
          Excel
        </button>
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
          </div>
        </div>
        {/* Switch de download avançado */}
        <div className="form-check form-switch mt-2">
          <input
            className="form-check-input"
            type="checkbox"
            role="switch"
            id="switchCheckDefault"
            checked={advancedDownload}
            onChange={(e) => setAdvancedDownload(e.target.checked)}
          />
          <label
            className="form-check-label small"
            htmlFor="switchCheckDefault"
          >
            Aceitar dados incompletos
          </label>
        </div>
      </div>
    </div>
  );
};

export default ExtractButtons;
