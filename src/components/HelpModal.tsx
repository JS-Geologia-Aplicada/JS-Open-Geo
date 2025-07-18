interface HelpModalProps {
  showOnLoad: boolean;
  onToggleShowOnLoad: (show: boolean) => void;
}

const HelpModal = ({ showOnLoad, onToggleShowOnLoad }: HelpModalProps) => {
  return (
    <>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <img
              src="js_logo_simbolo.png"
              alt="JS Geologia Aplicada"
              style={{ maxWidth: "50px" }}
            />
            <h5 className="modal-title flex-grow-1 text-center">
              Extrator de dados de PDFs
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi
              sollicitudin sollicitudin purus. Pellentesque habitant morbi
              tristique senectus et netus et malesuada fames ac turpis egestas.
              Morbi laoreet, leo eget imperdiet suscipit, massa urna volutpat
              velit, ut aliquam neque turpis non felis. Aenean viverra augue
              sem, vitae dignissim mauris vulputate at. Mauris feugiat accumsan
              viverra. Nullam ac malesuada neque, ac commodo urna. Maecenas
              vulputate ullamcorper dui, in aliquet arcu porttitor a.
            </p>
          </div>
          <div className="modal-footer d-flex justify-content-between">
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                id="flexSwitchCheckDefault"
                checked={showOnLoad}
                onChange={(e) => {
                  onToggleShowOnLoad(e.target.checked);
                }}
              ></input>
              <label
                className="form-check-label"
                htmlFor="flexSwitchCheckDefault"
              >
                Mostrar ao abrir
              </label>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              data-bs-dismiss="modal"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default HelpModal;
