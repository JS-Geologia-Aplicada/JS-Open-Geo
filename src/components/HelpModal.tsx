import { Button, Modal } from "react-bootstrap";

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
        <p className="lead text-muted mb-3">
          O Extrator de Dados de PDF da JS Geologia Aplicada é uma ferramenta
          desenvolvida para automatizar a extração de informações de relatórios
          de sondagem e outros documentos técnicos, facilitando a organização e
          análise de dados geológicos.
        </p>

        <div className="mt-3 px-3 text-start">
          <h6 className="text-dark fw-bold mb-2 text-start">Como usar</h6>
          <ol className="mb-1 text-start" style={{ lineHeight: "1.3" }}>
            <li className="mb-1 text-start">
              <strong>Carregue um PDF</strong> clicando em "Escolher arquivo"
            </li>
            <li className="mb-1 text-start">
              <strong>Adicione áreas</strong> para marcar regiões que deseja
              extrair texto
            </li>
            <li className="mb-1 text-start">
              <strong>Renomeie as áreas</strong> clicando no nome para facilitar
              identificação
            </li>
            <li className="mb-1 text-start">
              <strong>Selecione as áreas</strong> clicando no ícone de seleção e
              arrastando no PDF
            </li>
            <li className="mb-1 text-start">
              <strong>Extraia os dados</strong> e exporte em JSON, CSV ou Excel
            </li>
          </ol>
        </div>

        <div className="mt-3 px-3 text-start">
          <h6 className="text-dark fw-bold mb-2 text-start">
            Recursos disponíveis
          </h6>
          <ul className="mb-1 text-start" style={{ lineHeight: "1.3" }}>
            <li className="mb-1 text-start">
              <strong>Até 10 áreas</strong> de extração com cores diferentes
            </li>
            <li className="mb-1 text-start">
              <strong>Sistema de presets</strong> para salvar configurações
            </li>
            <li className="mb-1 text-start">
              <strong>Campos obrigatórios</strong> para ignorar páginas que não
              contenham dados essenciais
            </li>
          </ul>
        </div>

        <div className="alert alert-warning mt-3 mb-0 text-start" role="alert">
          <p className="mb-0 text-start">
            A JS Geologia Aplicada não se responsabiliza por eventuais erros na
            leitura automática dos dados.
          </p>
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
