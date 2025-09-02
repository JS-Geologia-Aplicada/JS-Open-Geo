import { Alert, Button, Modal } from "react-bootstrap";

interface HelpModalProps {
  showOnLoad: boolean;
  onToggleShowOnLoad: (show: boolean) => void;
  show: boolean;
  setShow: (show: boolean) => void;
}

const HelpModal = ({
  showOnLoad,
  onToggleShowOnLoad,
  show,
  setShow,
}: HelpModalProps) => {
  const handleClose = () => setShow(false);
  return (
    <Modal size="lg" centered show={show} onHide={handleClose}>
      <Modal.Header>
        <img
          src="js_open_geo_logo.png"
          alt="JS Geologia Aplicada"
          style={{ maxHeight: "40px" }}
        />
        <Button
          type="button"
          className="btn-close"
          onClick={handleClose}
          aria-label="Close"
        ></Button>
      </Modal.Header>
      <Modal.Body className="text-start">
        <Alert variant={"warning"}>
          <div>
            Este programa se encontra em fase ALFA de desenvolvimento: isso
            significa que o programa não está completo e as atualizações são
            constantes. Bugs, erros e falhas são esperados.
          </div>
          <div>
            Portanto, a JS Geologia Aplicada não se responsabiliza por eventuais
            erros na leitura automática dos dados.
          </div>
        </Alert>
        <p className="lead text-muted mb-3">
          O JS OpenGeo é um programa totalmente on-line, gratuito e de código
          aberto da JS Geologia Aplicada, desenvolvido para automatizar a
          extração de informações de relatórios de sondagem e outros documentos
          técnicos, facilitando a organização e análise de dados geológicos.
        </p>

        <div className="mt-3 px-3 text-start">
          <h6 className="text-dark fw-bold mb-2 text-start">
            Recursos disponíveis
          </h6>
          <ul className="mb-1 text-start" style={{ lineHeight: "1.3" }}>
            <li className="mb-1 text-start">
              <strong>Extração automática de texto</strong> de áreas
              selecionadas em PDFs
            </li>
            <li className="mb-1 text-start">
              <strong>Organização por sondagem</strong> quando configuradas
              áreas com tipos específicos
            </li>
            <li className="mb-1 text-start">
              <strong>Exportação em múltiplos formatos</strong> (JSON, CSV,
              Excel, Leapfrog)
            </li>
            <li className="mb-1 text-start">
              <strong>Geração de palitos de sondagem</strong> em formato DXF
            </li>
          </ul>
        </div>
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between">
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
          <label className="form-check-label" htmlFor="flexSwitchCheckDefault">
            Mostrar ao abrir
          </label>
        </div>
        <Button variant="secondary" type="button" onClick={handleClose}>
          Fechar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default HelpModal;
