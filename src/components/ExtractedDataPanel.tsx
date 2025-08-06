import { Download } from "lucide-react";
import {
  DATA_TYPE_LABELS,
  LEAPFROG_LABELS,
  LEAPFROG_TYPES,
  type Area,
  type PageTextData,
  type PalitoData,
} from "../types";
import * as XLSX from "xlsx";
import {
  generateCSVString,
  getLeapfrogData,
  validateExportRequirements,
} from "../utils/leapfrogExport";
import JSZip from "jszip";
import { useEffect, useState } from "react";
import { Tooltip } from "bootstrap";
import {
  createTypeToAreaNameMap,
  getMaxDepth,
  getMultipleValuesFromEntry,
  getSingleValueFromEntry,
  parseNumber,
} from "../utils/helpers";

interface ExtractedDataPanelProps {
  extractedTexts: PageTextData[];
  areas: Area[];
}

const ExtractedDataPanel = ({
  extractedTexts,
  areas,
}: ExtractedDataPanelProps) => {
  const [advancedDownload, setAdvancedDownload] = useState(false);
  const areaNames =
    extractedTexts.length > 0
      ? Object.keys(extractedTexts[0]).filter((key) => key !== "pageNumber")
      : [];

  useEffect(() => {
    // Atualizar todos os tooltips quando advancedDownload ou areas mudarem
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
  }, [extractedTexts, advancedDownload]);

  // const exportJSON = () => {
  //   const dataStr = JSON.stringify(extractedTexts, null, 2);
  //   const dataBlob = new Blob([dataStr], { type: "application/json" });

  //   const url = URL.createObjectURL(dataBlob);
  //   const link = document.createElement("a");
  //   link.href = url;
  //   link.download = "dados-extraidos.json";
  //   link.click();

  //   URL.revokeObjectURL(url);
  // };

  const exportJSON = () => {
    const typeToAreaName = createTypeToAreaNameMap(areas);
    const structuredData: PalitoData[] = [];

    extractedTexts.forEach((entry) => {
      const palitoEntry: PalitoData = {
        hole_id: getSingleValueFromEntry(entry, typeToAreaName, "hole_id"),
        nspt: {
          start_depth: 1,
          interval: 1,
          values: [],
        },
        depths: [],
        geology: [],
      };

      // Max depth (opcional)
      const maxDepth = getMaxDepth(entry, typeToAreaName);
      if (maxDepth > 0) {
        palitoEntry.max_depth = maxDepth;
      }

      // Z (cota)
      const z = parseNumber(
        getSingleValueFromEntry(entry, typeToAreaName, "z")
      );
      if (z !== -1) {
        palitoEntry.z = z;
      }

      // Water level (opcional)
      const waterLevel = getSingleValueFromEntry(
        entry,
        typeToAreaName,
        "water_level"
      );
      if (waterLevel) {
        const naNumber = parseNumber(waterLevel, -1);
        if (naNumber >= 0) {
          palitoEntry.water_level = naNumber;
        }
      }

      // Depths (profundidades from/to)
      const depths = getMultipleValuesFromEntry(
        entry,
        typeToAreaName,
        "depth_from_to"
      )
        .map((d) => parseNumber(d))
        .filter((d) => d !== -1)
        .sort((a, b) => a - b);
      if (depths.length > 0 && !depths.includes(0)) {
        depths.unshift(0);
      }
      if (depths.length > 0) {
        palitoEntry.depths = depths;
      }

      // Geology (descrições)
      const geology = getMultipleValuesFromEntry(
        entry,
        typeToAreaName,
        "geology"
      );
      if (geology.length > 0) {
        palitoEntry.geology = geology;
      }

      // Interpretação (opcional)
      const interp = getMultipleValuesFromEntry(
        entry,
        typeToAreaName,
        "interp"
      );
      if (interp.length > 0) {
        palitoEntry.interp = interp;
      }

      // NSPT
      const nsptValues = getMultipleValuesFromEntry(
        entry,
        typeToAreaName,
        "nspt"
      );
      if (nsptValues.length > 0) {
        palitoEntry.nspt = {
          start_depth: 1,
          interval: 1,
          values: nsptValues,
        };
      }

      // Outros tipos de dados não mapeados
      structuredData.push(palitoEntry);
    });

    // Download
    const dataStr = JSON.stringify(structuredData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });

    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "dados-estruturados.json";
    link.click();

    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const headers = ["Página", ...areaNames];

    const rows = extractedTexts.map((pageData) => {
      const row: (string | number)[] = [pageData.pageNumber.join(", ")];
      areaNames.forEach((name) => {
        const areaData = pageData[name];
        if (Array.isArray(areaData)) {
          row.push(areaData.join("; "));
        } else {
          row.push(areaData || "");
        }
      });
      return row;
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(",")) // aspas + vírgulas
      .join("\n");

    // Download
    const BOM = "\uFEFF";
    const csvWithBOM = BOM + csvContent;
    const blob = new Blob([csvWithBOM], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "dados-extraidos.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const xlsData = extractedTexts.map((pageData) => {
      const row: any = { Página: pageData.pageNumber }; // renomeia 'pageNumber' pra 'Página'

      areaNames.forEach((name) => {
        const areaData = pageData[name] as string[];
        if (Array.isArray(areaData)) {
          row[name] = areaData.join("; ");
        } else {
          row[name] = areaData || "";
        }
      });

      return row;
    });
    var ws = XLSX.utils.json_to_sheet(xlsData);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dados extraídos");
    XLSX.writeFile(wb, "dados-pdf.xlsx");
  };

  const downloadSingleCSV = (type: string) => {
    const leapfrogData = getLeapfrogData(extractedTexts, areas, type);
    if (!leapfrogData) {
      alert("Não existem todas as áreas necessárias para gerar esse arquivo");
      return;
    }
    const BOM = "\uFEFF";
    const csvString =
      BOM + generateCSVString(leapfrogData.data, leapfrogData.headers);

    // Download
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = leapfrogData.filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadZip = async () => {
    const zip = new JSZip();
    const BOM = "\uFEFF";

    const leapfrogTypes = ["collar", "nspt", "na", "geology", "interp"];

    // Loop através de todos os tipos
    leapfrogTypes.forEach((type) => {
      if (validateExportRequirements(areas, type).isValid || advancedDownload) {
        const data = getLeapfrogData(extractedTexts, areas, type);

        if (data) {
          const csvString = BOM + generateCSVString(data.data, data.headers);
          zip.file(data.filename, csvString);
        }
      }
    });

    // Gerar ZIP e baixar
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "leapfrog-data.zip";
    link.click();
    URL.revokeObjectURL(url);
  };

  const getDropdownItemClass = (type: string) =>
    `dropdown-item${
      validateExportRequirements(areas, type).isValid || advancedDownload
        ? ""
        : " disabled"
    }`;

  const downloadAllValidation = () => {
    const validExports = LEAPFROG_TYPES.filter(
      (type) => validateExportRequirements(areas, type).isValid
    );
    return {
      validExports: validExports,
      nonValidExports: LEAPFROG_TYPES.filter(
        (type) => !validExports.includes(type)
      ),
      someValid: validExports.length > 0,
      allValid: validExports.length === LEAPFROG_TYPES.length,
    };
  };

  const validationData = downloadAllValidation();

  return (
    <div className="data-panel mt-5">
      {!extractedTexts || extractedTexts.length <= 0 ? (
        <div>
          <p className="text-muted">Os dados extraídos serão exibidos aqui</p>
        </div>
      ) : (
        <>
          <h5 className="mb-3 pb-2 border-bottom">Dados Extraídos</h5>
          <div
            className="data-table mb-3"
            style={{ maxHeight: "65vh", overflowY: "auto" }}
          >
            <table className="table table-hover">
              <thead>
                <tr>
                  <th scope="col" style={{ minWidth: "100px" }}>
                    #
                  </th>
                  {areaNames.map((item, index) => {
                    return (
                      <th
                        scope="col"
                        key={`coluna${index}`}
                        style={{ minWidth: "100px" }}
                      >
                        {item.toString()}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {extractedTexts.map((item, index) => {
                  return (
                    <tr key={`coluna-pag-${index}`}>
                      <th scope="row">{item.pageNumber}</th>
                      {areaNames.map((area, index) => {
                        const areaData = item[area];
                        return (
                          <td key={`area-${index}`}>
                            {Array.isArray(areaData)
                              ? areaData.join(", ")
                              : "-"}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <hr className="mt-3" />
          <div className="d-flex gap-3 mb-2">
            <div className="border rounded p-3 flex-grow-1">
              <h6>Exportar todos os dados</h6>
              <div className="d-flex gap-1 mt-3">
                <button
                  className="menu-btn menu-btn-export ms-2"
                  onClick={exportJSON}
                >
                  <Download className="me-1" size={16} />
                  JSON
                </button>
                <button
                  className="menu-btn menu-btn-export ms-2"
                  onClick={exportCSV}
                >
                  <Download className="me-1" size={16} />
                  CSV
                </button>
                <button
                  className="menu-btn menu-btn-export ms-2"
                  onClick={exportExcel}
                >
                  <Download className="me-1" size={16} />
                  Excel
                </button>
              </div>
              {/* Dropdown para baixar no formato leapfrog */}
            </div>
            <div className="border rounded p-3 flex-grow-1">
              <h6>Exportar formato Leapfrog</h6>
              <div>
                <div className="btn-group dropup">
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={downloadZip}
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
                    Exportar todos
                  </button>
                  <button
                    type="button"
                    className="btn  btn-secondary dropdown-toggle dropdown-toggle-split"
                    data-bs-toggle="dropdown"
                    aria-haspopup="true"
                    aria-expanded="false"
                  >
                    <span className="sr-only"></span>
                  </button>

                  <ul className="dropdown-menu">
                    {LEAPFROG_TYPES.map((type) => {
                      const validation = validateExportRequirements(
                        areas,
                        type
                      );
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
                            className={getDropdownItemClass(type)}
                            onClick={() => downloadSingleCSV(type)}
                          >
                            {LEAPFROG_LABELS[type]}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
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
                  className="form-check-label small text-align-start"
                  htmlFor="switchCheckDefault"
                >
                  Aceitar dados incompletos
                </label>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ExtractedDataPanel;
