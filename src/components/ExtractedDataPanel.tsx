import { type Area, type PageTextData } from "../types";
import { formatPageNumbers } from "../utils/helpers";

interface ExtractedDataPanelProps {
  extractedTexts: PageTextData[];
  areas: Area[];
  isExtracting: boolean;
  fileName: string | undefined;
}

const ExtractedDataPanel = ({
  extractedTexts,
  isExtracting,
  fileName,
}: ExtractedDataPanelProps) => {
  const areaNames =
    extractedTexts.length > 0
      ? Object.keys(extractedTexts[0]).filter((key) => key !== "pageNumber")
      : [];
  return (
    <div className="data-panel mt-2">
      {isExtracting ? (
        <>
          <span className="spinner-border spinner-border-sm me-1" />
          {fileName ? `Extraindo dados do arquivo ${fileName}` : "Extraindo..."}
        </>
      ) : !extractedTexts || extractedTexts.length <= 0 ? (
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
                    Páginas
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
                      <th scope="row">{formatPageNumbers(item.pageNumber)}</th>
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
        </>
      )}
    </div>
  );
};

export default ExtractedDataPanel;
