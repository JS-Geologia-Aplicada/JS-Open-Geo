import { Card, Form, Button, Row, Col, ButtonGroup } from "react-bootstrap";
import { Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import type { PalitoData } from "../types";
import { useState } from "react";

interface PalitoPreviewCardProps {
  palitoData: PalitoData[];
  onUpdatePalito: (index: number, updatedPalito: PalitoData) => void;
}

const PalitoPreviewCard = ({
  palitoData,
  onUpdatePalito,
}: PalitoPreviewCardProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPalito, setEditedPalito] = useState<PalitoData | null>(null);

  const handleStartEdit = () => {
    setEditedPalito(JSON.parse(JSON.stringify(currentPalito)));
    setIsEditing(true);
  };
  const handleConfirmEdit = () => {
    setIsEditing(false);
    if (editedPalito) {
      onUpdatePalito(selectedIndex, editedPalito);
    }
    setEditedPalito(null);
  };
  const handleCancelEdit = () => {
    setEditedPalito(null);
    setIsEditing(false);
  };

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
          <Row>
            <Col xs={3}>
              <strong>Sondagem:</strong>
              <br />
              {isEditing ? (
                <>
                  <Form.Control
                    type="text"
                    size="sm"
                    value={editedPalito?.hole_id || ""}
                    onChange={(e) => {
                      setEditedPalito((prev) =>
                        prev ? { ...prev, hole_id: e.target.value } : null
                      );
                    }}
                  ></Form.Control>
                </>
              ) : (
                <span>{currentPalito.hole_id}</span>
              )}
            </Col>
            <Col xs={3}>
              <strong>Cota:</strong>
              <br />
              {isEditing ? (
                <Form.Control
                  type="number"
                  size="sm"
                  value={editedPalito?.z || "0"}
                  onChange={(e) => {
                    setEditedPalito((prev) =>
                      prev ? { ...prev, z: parseFloat(e.target.value) } : null
                    );
                  }}
                ></Form.Control>
              ) : (
                <span>{currentPalito.z ?? 0}m</span>
              )}
            </Col>
            <Col xs={3}>
              <strong>Prof. Total:</strong>
              <br />
              <span>
                {isEditing
                  ? editedPalito?.depths[editedPalito?.depths.length - 1]
                  : currentPalito.depths[currentPalito.depths.length - 1]}
                m
              </span>
            </Col>
            <Col xs={3}>
              {isEditing ? (
                <>
                  <ButtonGroup>
                    <Button variant="success" onClick={handleConfirmEdit}>
                      <Check size={16} />
                    </Button>
                    <Button variant="danger" onClick={handleCancelEdit}>
                      <X size={16} />
                    </Button>
                  </ButtonGroup>
                </>
              ) : (
                <Button onClick={handleStartEdit}>Editar</Button>
              )}
            </Col>
          </Row>
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
                    <Col sm={4} className="text-start">
                      {"Início: "}
                      {isEditing ? (
                        <Form.Control
                          style={{ width: "50px" }}
                          type="number"
                          size="sm"
                          value={editedPalito?.depths[index] || "0"}
                          onChange={(e) => {
                            setEditedPalito((prev) => {
                              if (!prev) return null;
                              const newDepths = prev.depths.map((d, i) =>
                                i === index
                                  ? parseFloat(e.target.value) || 0
                                  : d
                              );
                              return { ...prev, depths: newDepths };
                            });
                          }}
                        ></Form.Control>
                      ) : (
                        <span className="fw-bold">{depth}m</span>
                      )}
                    </Col>
                    <Col sm={4} className="text-start">
                      {"Fim: "}
                      {isEditing ? (
                        <Form.Control
                          style={{ width: "50px" }}
                          type="number"
                          size="sm"
                          value={editedPalito?.depths[index + 1] || "0"}
                          onChange={(e) => {
                            setEditedPalito((prev) => {
                              if (!prev) return null;
                              const newDepths = prev.depths.map((d, i) =>
                                i === index + 1
                                  ? parseFloat(e.target.value) || 0
                                  : d
                              );
                              return { ...prev, depths: newDepths };
                            });
                          }}
                        ></Form.Control>
                      ) : (
                        <span className="fw-bold">{nextDepth}m</span>
                      )}
                    </Col>
                  </Row>
                  <Row className="g-0 ps-3">
                    <Col xs={12} className="my-1 text-start text-muted small">
                      {isEditing ? (
                        <Form.Control
                          type="text"
                          as="textarea"
                          size="sm"
                          value={editedPalito?.geology[index] || "0"}
                          onChange={(e) => {
                            setEditedPalito((prev) => {
                              if (!prev) return null;
                              const newGeology = prev.geology.map((g, i) =>
                                i === index
                                  ? e.target.value || "Sem descrição"
                                  : g
                              );
                              return { ...prev, geology: newGeology };
                            });
                          }}
                        ></Form.Control>
                      ) : (
                        description || "Sem descrição"
                      )}
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
