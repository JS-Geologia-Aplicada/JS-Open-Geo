import { Modal,  Button, Container, Row, Col, Image } from "react-bootstrap";

interface ModelPreviewModalProps {
  show: boolean;
  onHide: () => void;
  defaultTab?: string; // ID da aba inicial
}

const ModelPreviewModal = ({
  show,
  onHide,
}: ModelPreviewModalProps) => {

  const MODELS: {name: string, src: string}[] = [
    {name: "Padrão JS", src: "/palitos/palitos_js_1.png"},
    {name: "Padrão JS 2", src: "/palitos/palitos_js_2.png"},
    {name: "Padrão Metrô", src: "/palitos/palitos_metro.png"},
  ]

  // Atualizar aba quando o modal abrir
  // const handleShow = () => {
  //   analytics.track("cadsig_open_templates");
  // };

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="xl"
      centered
      style={{ minHeight: "60vh" }}
    >
      <Modal.Header closeButton>
        <Modal.Title>Padrões de Palito</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Container>
          <Row>
            {MODELS.map(model => {return (
              <>
              <Col sm={4}>
              <div className="d-flex flex-column">
                <h6 className="text-center">{model.name}</h6>
                <Image src={model.src} />
              </div>
              </Col>
              </>
            )})}
          </Row>
        </Container>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Fechar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModelPreviewModal;
