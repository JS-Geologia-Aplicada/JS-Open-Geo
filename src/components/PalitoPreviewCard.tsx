import { Card, Form, Button, Row, Col } from "react-bootstrap";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PalitoData } from "../types";
import { useState } from "react";

interface PalitoPreviewCardProps {
  palitoData: PalitoData[];
}

const PalitoPreviewCard = ({ palitoData }: PalitoPreviewCardProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (palitoData.length === 0) {
    return (
      <Card className="mt-2">
        <Card.Header>
          <h5 className="card-title">Preview dos Dados</h5>
        </Card.Header>
        <Card.Body>
          <p className="text-muted">Nenhum dado disponível para preview</p>
        </Card.Body>
      </Card>
    );
  }

  const currentPalito = palitoData[selectedIndex];

  const handlePrevious = () => {
    setSelectedIndex((prev: number) =>
      prev > 0 ? prev - 1 : palitoData.length - 1
    );
  };

  const handleNext = () => {
    setSelectedIndex((prev: number) =>
      prev < palitoData.length - 1 ? prev + 1 : 0
    );
  };

  return (
    <Card className="mt-2">
      <Card.Header>
        <div className="d-flex align-items-center justify-content-between">
          <h5 className="card-title mb-0">Preview dos Dados</h5>

          <div className="d-flex align-items-center gap-2">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={handlePrevious}
              disabled={palitoData.length <= 1}
            >
              <ChevronLeft size={16} />
            </Button>

            <Form.Select
              size="sm"
              style={{ width: "200px" }}
              value={selectedIndex}
              onChange={(e) => setSelectedIndex(parseInt(e.target.value))}
            >
              {palitoData.map((palito, index) => (
                <option key={index} value={index}>
                  {palito.hole_id || `Sondagem ${index + 1}`}
                </option>
              ))}
            </Form.Select>

            <Button
              variant="outline-secondary"
              size="sm"
              onClick={handleNext}
              disabled={palitoData.length <= 1}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </Card.Header>

      <Card.Body>
        {/* Dados básicos */}
        <div className="mb-3">
          <div className="row">
            <div className="col-4">
              <strong>Sondagem:</strong>
              <br />
              <span>{currentPalito.hole_id}</span>
            </div>
            <div className="col-4">
              <strong>Cota:</strong>
              <br />
              <span>{currentPalito.z ?? 0}m</span>
            </div>
            <div className="col-4">
              <strong>Prof. Total:</strong>
              <br />
              <span>{currentPalito.max_depth}m</span>
            </div>
          </div>
        </div>

        <hr />

        {/* Geologia intercalada */}
        <div>
          <strong>Descrição Geológica:</strong>
          <div
            className="mt-2"
            style={{ maxHeight: "50vh", overflowY: "auto" }}
          >
            {currentPalito.depths.map((depth, index) => {
              const nextDepth = currentPalito.depths[index + 1];
              const description = currentPalito.geology[index];

              if (!nextDepth) return null; // Skip último depth

              return (
                <div key={index} className="border rounded mb-2 bg-light">
                  <Row className="g-0 ps-3 mt-1">
                    <Col sm={3} className="text-start">
                      Início: <span className="fw-bold">{depth}m</span>.
                    </Col>
                    <Col sm={3} className="text-start">
                      Fim: <span className="fw-bold">{nextDepth}m</span>.
                    </Col>
                  </Row>
                  <Row className="g-0 ps-3">
                    <Col xs={12} className="my-1 text-start text-muted small">
                      {description || "Sem descrição"}
                    </Col>
                  </Row>
                </div>
              );
            })}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default PalitoPreviewCard;
