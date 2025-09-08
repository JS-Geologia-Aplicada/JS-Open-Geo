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
        <Row>
          <Col xs={9} className="mb-3">
            <Row className="text-start g-0">
              <Col xs={7} className="pb-1 pe-1">
                <div className="d-flex align-items-centerjustify-content-start gap-1">
                  <span className="fw-bold" style={{ width: "120px" }}>
                    {"Sondagem: "}
                  </span>
                  {isEditing ? (
                    <>
                      <Form.Control
                        type="text"
                        size="sm"
                        value={editedPalito?.hole_id || ""}
                        style={{ width: "100px" }}
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
                </div>
              </Col>
              <Col xs={5} className="pb-1 pe-1">
                <div className="d-flex align-items-centerjustify-content-start gap-1">
                  <span className="fw-bold" style={{ width: "120px" }}>
                    {"Cota: "}
                  </span>
                  {isEditing ? (
                    <Form.Control
                      type="number"
                      size="sm"
                      value={editedPalito?.z || "0"}
                      style={{ width: "100px" }}
                      onChange={(e) => {
                        setEditedPalito((prev) =>
                          prev
                            ? { ...prev, z: parseFloat(e.target.value) }
                            : null
                        );
                      }}
                    ></Form.Control>
                  ) : (
                    <span>{currentPalito.z ?? 0}m</span>
                  )}
                </div>
              </Col>
              <Col xs={7} className="pb-1 pe-1">
                <div className="d-flex align-items-centerjustify-content-start gap-1">
                  <span className="fw-bold" style={{ width: "120px" }}>
                    {"Nível d'água: "}
                  </span>
                  {isEditing ? (
                    <Form.Control
                      type="number"
                      size="sm"
                      value={editedPalito?.water_level || "SECO"}
                      style={{ width: "100px" }}
                      onChange={(e) => {
                        setEditedPalito((prev) =>
                          prev
                            ? {
                                ...prev,
                                water_level: parseFloat(e.target.value),
                              }
                            : null
                        );
                      }}
                    ></Form.Control>
                  ) : (
                    <span>
                      {currentPalito.water_level
                        ? currentPalito.water_level.toString() + "m"
                        : "SECO"}
                    </span>
                  )}
                </div>
              </Col>
              <Col xs={5} className="pb-1 pe-1">
                <div className="d-flex align-items-centerjustify-content-start gap-1">
                  <span className="fw-bold" style={{ width: "120px" }}>
                    {"Prof. Total: "}
                  </span>
                  <span>
                    {isEditing ? (
                      <Form.Control
                        style={{ width: "100px" }}
                        type="number"
                        size="sm"
                        value={
                          editedPalito?.depths[
                            editedPalito?.depths.length - 1
                          ] || "0"
                        }
                        onChange={(e) => {
                          setEditedPalito((prev) => {
                            if (!prev || !editedPalito) return null;
                            const newDepths = prev.depths.map((d, i) =>
                              i === editedPalito.depths.length - 1
                                ? parseFloat(e.target.value) || 0
                                : d
                            );
                            return { ...prev, depths: newDepths };
                          });
                        }}
                      ></Form.Control>
                    ) : (
                      currentPalito.depths[currentPalito.depths.length - 1] +
                      "m"
                    )}
                  </span>
                </div>
              </Col>
            </Row>
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

        <hr />

        <Row>
          {/* Descrição Geológica */}
          <Col xs={9}>
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
                        <div className="d-flex align-items-start">
                          <span className="pe-2">{"Início: "}</span>
                          {isEditing ? (
                            <Form.Control
                              style={{ width: "50px", marginLeft: "10px" }}
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
                        </div>
                      </Col>
                      <Col sm={4} className="text-start">
                        <div className="d-flex align-items-start">
                          <span className="pe-2">{"Fim: "}</span>
                          {isEditing ? (
                            <Form.Control
                              style={{ width: "50px", marginLeft: "10px" }}
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
                        </div>
                      </Col>
                    </Row>
                    <Row className="g-0 ps-3">
                      <Col
                        xs={12}
                        className="my-1 text-start text-muted small pe-2"
                      >
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
          </Col>
          {/* NSPTs */}
          <Col xs={3}>
            <strong>NSPT:</strong>
            {/* No topo colocar a profundidade do primeiro, editável. Fazer parecido com as descrições geológicas, colocar profundidade e NSPT. Aqui só o NSPT é editável. NSPTs em uma profundidade superior à última profundidade da sondagem aparecem em uma cor diferente, indicando que não vão aparecer no palito */}
            {/* Configuração do primeiro NSPT - editável */}
            <div className="mt-2 mb-3 p-2 border rounded bg-light">
              <div className="d-flex align-items-center justify-content-between">
                {currentPalito.nspt.values.length === 0 ? (
                  <span className="small">Não possui</span>
                ) : (
                  <>
                    <span className="small">Inicia em:</span>
                    {isEditing ? (
                      <Form.Control
                        type="number"
                        size="sm"
                        style={{ width: "60px" }}
                        value={
                          editedPalito?.nspt.start_depth ||
                          currentPalito.nspt.start_depth
                        }
                        onChange={(e) => {
                          setEditedPalito((prev) => {
                            if (!prev) return null;
                            return {
                              ...prev,
                              nspt: {
                                ...prev.nspt,
                                start_depth: parseFloat(e.target.value) || 0,
                              },
                            };
                          });
                        }}
                      />
                    ) : (
                      <span className="fw-bold">
                        {currentPalito.nspt.start_depth}m
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Lista de NSPTs */}
            <div style={{ maxHeight: "50vh", overflowY: "auto" }}>
              {currentPalito.nspt.values.map((nsptValue, index) => {
                const nsptDepth =
                  currentPalito.nspt.start_depth +
                  index * currentPalito.nspt.interval;
                const maxDepth =
                  currentPalito.depths[currentPalito.depths.length - 1];
                const isOutOfRange = nsptDepth > maxDepth;

                return (
                  <div
                    key={index}
                    className={`border rounded mb-2 p-2 ${
                      isOutOfRange
                        ? "bg-warning-subtle border-warning"
                        : "bg-light"
                    }`}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <span
                        className={`small ${
                          isOutOfRange ? "text-warning-emphasis" : ""
                        }`}
                      >
                        {nsptDepth}m:
                      </span>
                      {isEditing ? (
                        <Form.Control
                          type="text"
                          size="sm"
                          style={{ width: "60px" }}
                          value={editedPalito?.nspt.values[index] || nsptValue}
                          onChange={(e) => {
                            setEditedPalito((prev) => {
                              if (!prev) return null;
                              const newValues = [...prev.nspt.values];
                              newValues[index] = e.target.value;
                              return {
                                ...prev,
                                nspt: {
                                  ...prev.nspt,
                                  values: newValues,
                                },
                              };
                            });
                          }}
                        />
                      ) : (
                        <span
                          className={`fw-bold ${
                            isOutOfRange ? "text-warning-emphasis" : ""
                          }`}
                        >
                          {nsptValue}
                        </span>
                      )}
                    </div>
                    {isOutOfRange && (
                      <small className="text-warning-emphasis">
                        Fora da sondagem
                      </small>
                    )}
                  </div>
                );
              })}
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default PalitoPreviewCard;
