import { Download } from "lucide-react";
import type { PageTextData } from "../types";

import * as XLSX from "xlsx";

interface ExtractedDataPanelProps {
  extractedTexts: PageTextData[];
}

const ExtractedDataPanel = ({ extractedTexts }: ExtractedDataPanelProps) => {
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
      const row: (string | number)[] = [pageData.pageNumber];
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
                            {areaData && Array.isArray(areaData)
                              ? (areaData as string[]).join(", ")
                              : areaData
                              ? areaData.toString()
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
          <h6 className="mb-3 text-start ms-3">Exportar</h6>
          <div className="d-flex justify-content-start">
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
        </>
      )}
    </div>
  );
};

export default ExtractedDataPanel;
