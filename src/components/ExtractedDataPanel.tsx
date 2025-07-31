import { Download } from "lucide-react";
import type { Area, PageTextData } from "../types";
import * as XLSX from "xlsx";
import {
  generateCSVString,
  getLeapfrogData,
  validateExportRequirements,
} from "../utils/leapfrogExport";
import JSZip from "jszip";
import { useState } from "react";

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

  const exportJSON = () => {
    const dataStr = JSON.stringify(extractedTexts, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });

    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "dados-extraidos.json";
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
                    <li>
                      <a
                        className={getDropdownItemClass("collar")}
                        href="#"
                        onClick={() => downloadSingleCSV("collar")}
                      >
                        Collar
                      </a>
                    </li>
                    <li>
                      <a
                        className={getDropdownItemClass("nspt")}
                        href="#"
                        onClick={() => downloadSingleCSV("nspt")}
                      >
                        NSPT
                      </a>
                    </li>
                    <li>
                      <a
                        className={getDropdownItemClass("na")}
                        href="#"
                        onClick={() => downloadSingleCSV("na")}
                      >
                        NA
                      </a>
                    </li>
                    <li>
                      <a
                        className={getDropdownItemClass("geology")}
                        href="#"
                        onClick={() => downloadSingleCSV("geology")}
                      >
                        Geologia
                      </a>
                    </li>
                    <li>
                      <a
                        className={getDropdownItemClass("interp")}
                        href="#"
                        onClick={() => downloadSingleCSV("interp")}
                      >
                        Interpretação
                      </a>
                    </li>
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
