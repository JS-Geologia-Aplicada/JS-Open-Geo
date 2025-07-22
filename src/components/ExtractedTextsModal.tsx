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
                  {areaNames.map((item) => {
                    return <th scope="col">{item.toString()}</th>;
                  })}
                </tr>
              </thead>
              <tbody>
                {extractedTexts.map((item) => {
                  return (
                    <tr>
                      <th scope="row">{item.page}</th>
                      {areas.map((area) => {
                        return <td>{item[area.name].toString()}</td>;
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
