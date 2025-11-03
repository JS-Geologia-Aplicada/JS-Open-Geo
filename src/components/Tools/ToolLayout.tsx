import { Card, Col, Container, Row } from "react-bootstrap";

interface ToolLayoutProps {
  title: string;
  controls: React.ReactNode;
  panel: React.ReactNode;
  controlsWidth?: number; // Opcional: largura das cols (padrão 4)
  panelWidth?: number; // Opcional: largura do painel (padrão 8)
  maxWidth?: string; // Opcional: largura máxima do container
}

export const ToolLayout = ({
  title,
  controls,
  panel,
  controlsWidth = 4,
  panelWidth = 8,
  maxWidth = "1400px",
}: ToolLayoutProps) => {
  return (
    <Container fluid className="mt-4">
      <Row className="justify-content-center">
        <Col style={{ maxWidth }}>
          <Card>
            <Card.Header>
              <h4 className="mb-0">{title}</h4>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={controlsWidth}>{controls}</Col>
                <Col md={panelWidth}>{panel}</Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};
