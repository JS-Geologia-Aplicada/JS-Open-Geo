import type { Area, PageTextData } from "../types";

import * as XLSX from "xlsx";

interface ExtractedTextsModalProps {
  extractedTexts: PageTextData[];
  areas: Area[];
}

const ExtractedTextsModal = ({
  extractedTexts,
  areas,
}: ExtractedTextsModalProps) => {
  const areaNames = areas.map((item) => item.name);

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
    const headers = ["Página", ...areas.map((area) => area.name)];

    const rows = extractedTexts.map((pageData) => {
      const row: (string | number)[] = [pageData.page];
      areas.forEach((area) => {
        const areaData = pageData[area.name];
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
      const row: any = { Página: pageData.page }; // renomeia 'page' pra 'Página'

      areas.forEach((area) => {
        const areaData = pageData[area.name] as string[];
        if (Array.isArray(areaData)) {
          row[area.name] = areaData.join("; "); // junta array com ;
        } else {
          row[area.name] = areaData || "";
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
    <>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title flex-grow-1 text-center">
              Texto extraído
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div
            className="modal-body"
            style={{ maxHeight: "60vh", overflowY: "auto" }}
          >
            <table className="table table-hover">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  {areaNames.map((item, index) => {
                    return (
                      <th scope="col" key={`coluna${index}`}>
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
                      <th scope="row">{item.page}</th>
                      {areas.map((area, index) => {
                        const areaData = item[area.name];
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
          <div className="modal-footer">
            <button className="btn btn-outline-primary" onClick={exportJSON}>
              Exportar JSON
            </button>
            <button className="btn btn-outline-success" onClick={exportCSV}>
              Exportar CSV
            </button>
            <button className="btn btn-outline-secondary" onClick={exportExcel}>
              Exportar Excel
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExtractedTextsModal;
