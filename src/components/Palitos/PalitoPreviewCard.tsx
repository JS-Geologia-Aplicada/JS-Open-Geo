import { Card, Form, Row, Col } from "react-bootstrap";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import styles from "./PalitoPreviewCard.module.css";
import { useExtractionContext } from "@/contexts/ExtractionContext";
import PalitoEditableField from "./PalitoEditableField";
import { parseNumber } from "@/utils/helpers";

const PalitoPreviewCard = () => {
  const { extractionState, updatePalito, updateAllNsptStartDepth } =
    useExtractionContext();
  const { palitoData } = extractionState;

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeField, setActiveField] = useState<string | null>(null);

  const currentPalito = palitoData[selectedIndex];

  const layerCount = useMemo(
    () =>
      currentPalito && currentPalito.depths
        ? currentPalito.depths.length - 1
        : 1,
    [currentPalito],
  );

  const firstNsptDepth = useMemo(() => {
    if (!palitoData) return undefined;
    const nsptStartDepths = palitoData.map(
      (palitoData) => palitoData.nspt.start_depth,
    );
    if (nsptStartDepths.some((depth) => depth !== nsptStartDepths[0])) {
      return undefined;
    }
    return nsptStartDepths[0];
  }, [palitoData]);

  if (palitoData.length === 0) {
    return (
      <Card className="mt-2">
        <Card.Header>
          <h5 className="card-title">Pré-visualização dos Dados</h5>
        </Card.Header>
        <Card.Body>
          <p className="text-muted">
            Nenhum dado disponível para pré-visualização
          </p>
        </Card.Body>
      </Card>
    );
  }

  const handlePrevious = () => {
    setSelectedIndex((prev: number) =>
      prev > 0 ? prev - 1 : palitoData.length - 1,
    );
  };

  const handleNext = () => {
    setSelectedIndex((prev: number) =>
      prev < palitoData.length - 1 ? prev + 1 : 0,
    );
  };

  const handleAddLayer = () => {
    const depths = currentPalito.depths ?? [];
    const lastDepth =
      depths.length > 0
        ? depths[depths.length - 1]
        : (currentPalito.max_depth ?? 0);

    updatePalito(selectedIndex, {
      ...currentPalito,
      depths: [...depths, lastDepth + 1],
    });
  };

  return (
    <Card className="mt-2">
      <Card.Header>
        <div className="d-flex align-items-center justify-content-between">
          <h5 className="card-title mb-0">Preview dos Dados</h5>
        </div>
      </Card.Header>

      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="text-muted small">
            {palitoData.length === 0
              ? "Nenhuma sondagem carregada"
              : palitoData.length === 1
                ? "1 sondagem carregada"
                : `${palitoData.length} sondagens carregadas`}
          </span>
        </div>
        <Row>
          <Col xs={6}>
            <div className="d-flex align-items-center gap-2">
              <button
                className={styles.changeBoreholeButton}
                onClick={handlePrevious}
                disabled={palitoData.length <= 1}
              >
                <ChevronLeft size={16} />
              </button>

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

              <button
                className={styles.changeBoreholeButton}
                onClick={handleNext}
                disabled={palitoData.length <= 1}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </Col>
          <Col xs={6}>
            <div className="d-flex align-items-centerjustify-content-start gap-1">
              <span className="fw-bold">
                {"Profundidade inicial dos NSPTs: "}
              </span>
              <PalitoEditableField
                value={
                  firstNsptDepth === undefined
                    ? "VARIÁVEL"
                    : firstNsptDepth.toFixed(2).replace(".", ",")
                }
                unit="m"
                fieldKey="initial_nspt"
                activeField={activeField}
                setActiveField={setActiveField}
                onConfirm={(newValue) =>
                  updateAllNsptStartDepth(parseNumber(newValue))
                }
              />
            </div>
          </Col>
        </Row>
        <hr />
        <Row className="text-start g-0">
          <Col xs={6} className="pb-1 pe-1">
            <div className="d-flex align-items-centerjustify-content-start gap-1">
              <span className="fw-bold" style={{ width: "120px" }}>
                {"Sondagem: "}
              </span>
              <PalitoEditableField
                value={currentPalito.hole_id}
                fieldKey="hole_id"
                activeField={activeField}
                setActiveField={setActiveField}
                onConfirm={(newValue) =>
                  updatePalito(selectedIndex, {
                    ...currentPalito,
                    hole_id: newValue,
                  })
                }
              />
            </div>
          </Col>
          <Col xs={6} className="pb-1 pe-1">
            <div className="d-flex align-items-centerjustify-content-start gap-1">
              <span className="fw-bold" style={{ width: "120px" }}>
                {"Cota: "}
              </span>
              <PalitoEditableField
                value={
                  currentPalito.z
                    ? currentPalito.z.toFixed(2).replace(".", ",")
                    : "0"
                }
                unit="m"
                fieldKey="z"
                activeField={activeField}
                setActiveField={setActiveField}
                onConfirm={(newValue) =>
                  updatePalito(selectedIndex, {
                    ...currentPalito,
                    z: parseNumber(newValue),
                  })
                }
              />
            </div>
          </Col>
          <Col xs={6} className="pb-1 pe-1">
            <div className="d-flex align-items-centerjustify-content-start gap-1">
              <span className="fw-bold" style={{ width: "120px" }}>
                {"Nível d'água: "}
              </span>
              <PalitoEditableField
                value={
                  currentPalito.water_level
                    ? currentPalito.water_level.toFixed(2).replace(".", ",")
                    : "SECO"
                }
                unit={currentPalito.water_level ? "m" : undefined}
                fieldKey="water_level"
                activeField={activeField}
                setActiveField={setActiveField}
                onConfirm={(newValue) =>
                  updatePalito(selectedIndex, {
                    ...currentPalito,
                    water_level: parseNumber(newValue),
                  })
                }
              />
            </div>
          </Col>
          <Col xs={6} className="pb-1 pe-1">
            <div className="d-flex align-items-centerjustify-content-start gap-1">
              <span className="fw-bold" style={{ width: "120px" }}>
                {"Prof. Total: "}
              </span>
              <PalitoEditableField
                value={
                  currentPalito.depths
                    ? currentPalito.depths[currentPalito.depths.length - 1]
                        .toFixed(2)
                        .replace(".", ",")
                    : currentPalito.max_depth
                      ? currentPalito.max_depth.toString().replace(".", ",")
                      : "0"
                }
                unit="m"
                fieldKey="max_depth"
                activeField={activeField}
                setActiveField={setActiveField}
                onConfirm={(newValue) => {
                  const parsed = parseNumber(newValue.replace(",", ".")) || 0;
                  const newDepths = currentPalito.depths.map((d, i) =>
                    i === currentPalito.depths.length - 1 ? parsed : d,
                  );
                  updatePalito(selectedIndex, {
                    ...currentPalito,
                    depths: newDepths,
                    max_depth: parsed,
                  });
                }}
              />
            </div>
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
              {Array.from({ length: layerCount }, (_, index) => {
                const description = currentPalito.geology[index] || "";
                const depthFrom = currentPalito.depths[index];
                const depthTo = currentPalito.depths[index + 1];

                return (
                  <div key={index}>
                    {/* Profundidade de cima */}
                    <div className="d-flex align-items-center">
                      <PalitoEditableField
                        value={depthFrom.toFixed(2).replace(".", ",")}
                        fieldKey={`depth_${index}`}
                        unit="m"
                        activeField={activeField}
                        setActiveField={setActiveField}
                        onConfirm={(newValue) => {
                          const parsed = parseNumber(newValue) || 0;
                          const newDepths = currentPalito.depths.map((d, i) =>
                            i === index ? parsed : d,
                          );
                          updatePalito(selectedIndex, {
                            ...currentPalito,
                            depths: newDepths,
                          });
                        }}
                      />
                    </div>

                    {/* Descrição */}
                    <div className={styles.descriptionDiv}>
                      <PalitoEditableField
                        value={description || "Sem descrição"}
                        fieldKey={`geology_${index}`}
                        multiline
                        activeField={activeField}
                        setActiveField={setActiveField}
                        onConfirm={(newValue) => {
                          const newGeology = currentPalito.geology.map(
                            (g, i) => (i === index ? newValue : g),
                          );
                          updatePalito(selectedIndex, {
                            ...currentPalito,
                            geology: newGeology,
                          });
                        }}
                      />
                    </div>

                    {/* Última profundidade */}
                    {index === layerCount - 1 && (
                      <div className="d-flex align-items-center">
                        <PalitoEditableField
                          value={depthTo.toFixed(2).replace(".", ",")}
                          fieldKey={`depth_${index + 1}`}
                          unit="m"
                          activeField={activeField}
                          setActiveField={setActiveField}
                          onConfirm={(newValue) => {
                            const parsed = parseNumber(newValue) || 0;
                            const newDepths = currentPalito.depths.map(
                              (d, i) => (i === index + 1 ? parsed : d),
                            );
                            updatePalito(selectedIndex, {
                              ...currentPalito,
                              depths: newDepths,
                            });
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
              <div className={styles.addLayerDiv}>
                <button className={styles.addLayerBtn} onClick={handleAddLayer}>
                  <Plus />
                </button>
              </div>
            </div>
          </Col>
          {/* NSPTs */}
          <Col xs={3}>
            <strong>NSPT:</strong>

            {currentPalito.nspt.values.length === 0 ? (
              <p className="small text-muted mt-2">Não possui</p>
            ) : (
              <>
                {/* Start depth individual */}
                <div className="d-flex align-items-center gap-1 mt-2">
                  <span className="fw-bold">Inicia em:</span>
                  <PalitoEditableField
                    value={currentPalito.nspt.start_depth
                      .toFixed(2)
                      .replace(".", ",")}
                    unit="m"
                    fieldKey="nspt_start_depth"
                    activeField={activeField}
                    setActiveField={setActiveField}
                    onConfirm={(newValue) =>
                      updatePalito(selectedIndex, {
                        ...currentPalito,
                        nspt: {
                          ...currentPalito.nspt,
                          start_depth: parseNumber(newValue),
                        },
                      })
                    }
                  />
                </div>

                {/* Lista de NSPTs */}
                <div
                  className="mt-2"
                  style={{ maxHeight: "50vh", overflowY: "auto" }}
                >
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
                        className="d-flex align-items-center gap-1 mb-1"
                        style={{
                          color: isOutOfRange ? "orangered" : "inherit",
                        }}
                      >
                        <span className="fw-bold" style={{ width: "50px" }}>
                          {nsptDepth}m:
                        </span>
                        <PalitoEditableField
                          value={nsptValue.toString()}
                          fieldKey={`nspt_${index}`}
                          activeField={activeField}
                          setActiveField={setActiveField}
                          onConfirm={(newValue) => {
                            const newValues = currentPalito.nspt.values.map(
                              (v, i) => (i === index ? newValue : v),
                            );
                            updatePalito(selectedIndex, {
                              ...currentPalito,
                              nspt: {
                                ...currentPalito.nspt,
                                values: newValues,
                              },
                            });
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default PalitoPreviewCard;
