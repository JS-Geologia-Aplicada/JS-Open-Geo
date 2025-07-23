import type { Area, PageTextData } from "../types";

interface ExtractedTextsModalProps {
  extractedTexts: PageTextData[];
  areas: Area[];
}

const ExtractedTextsModal = ({
  extractedTexts,
  areas,
}: ExtractedTextsModalProps) => {
  const areaNames = areas.map((item) => item.name);

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
          <div className="modal-body">
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
        </div>
      </div>
    </>
  );
};

export default ExtractedTextsModal;
