import { useState, useMemo, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Table,
} from "react-bootstrap";
import {
  detectDxfType,
  extractMultileaders,
  getAttributedBlocks,
  getInsertsFromDxf,
  getPolylinesFromDxf,
  groupBy,
  parseDxf,
  type DxfInsert,
  type DxfPolyline,
} from "@/utils/dxfParseUtils";
import {
  getCardinalDirection,
  plToLineString,
  getPointSideFromLine,
  invertDirection,
  mergeConnectedLineStrings,
  type CardinalOrdinalDirection,
  getLineLength,
  nearestPointOnLine,
  reverseLineString,
} from "@/utils/distanceUtils";
import type { DistanceResult, LineString, Point } from "@/types/geometryTypes";

interface DirectionOption {
  label: string;
  value: CardinalOrdinalDirection;
  direction: "forward" | "backward";
}

const DistanceTool = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileText, setFileText] = useState<string>("");

  // Dados extraídos
  const [inserts, setInserts] = useState<DxfInsert[]>([]);
  const [polylines, setPolylines] = useState<DxfPolyline[]>([]);

  // Layers disponíveis
  const [insertLayers, setInsertLayers] = useState<string[]>([]);
  const [polylineLayers, setPolylineLayers] = useState<string[]>([]);

  // Seleções do usuário
  const [selectedPolylineLayer, setSelectedPolylineLayer] =
    useState<string>("");
  const [selectedInsertLayers, setSelectedInsertLayers] = useState<string[]>(
    []
  );

  const [selectedDirection, setSelectedDirection] = useState<
    CardinalOrdinalDirection | undefined
  >(undefined);
  const [distanceResults, setDistanceResults] = useState<DistanceResult[]>([]);

  const plAsLineString = useMemo((): LineString[] | undefined => {
    const eligiblePolylines = polylines.filter(
      (pl) => pl.layer === selectedPolylineLayer && pl.vertices.length > 0
    );

    if (eligiblePolylines.length === 0) return undefined;

    const lineStrings = plToLineString(eligiblePolylines);

    const mergedLineStrings = mergeConnectedLineStrings(lineStrings);

    return mergedLineStrings;
  }, [polylines, selectedPolylineLayer]);

  const analyzeFile = (fileText: string) => {
    // 1. Inserts (sondagens)
    const inserts = getInsertsFromDxf(fileText);
    const insertsByLayer = groupBy(inserts, "layer");

    // 2. Polylines
    const polylines = getPolylinesFromDxf(fileText);
    const polylinesByLayer = groupBy(polylines, "layer");

    return {
      inserts,
      insertsByLayer,
      polylines,
      polylinesByLayer,
      insertLayers: Object.keys(insertsByLayer),
      polylineLayers: Object.keys(polylinesByLayer),
    };
  };

  const referenceLine = useMemo((): LineString | undefined => {
    if (!plAsLineString || plAsLineString.length === 0) return undefined;

    return plAsLineString.reduce((longest, current) =>
      getLineLength(current) > getLineLength(longest) ? current : longest
    );
  }, [plAsLineString]);

  const directionOptions = useMemo((): DirectionOption[] | undefined => {
    if (!referenceLine) return undefined;

    const coords = referenceLine.points;
    const startPoint = coords[0];
    const endPoint = coords[coords.length - 1];

    // Direção start→end
    const forward = getCardinalDirection(startPoint, endPoint);
    const backward = invertDirection(forward);

    return [
      { label: forward, value: forward, direction: "forward" },
      { label: backward, value: backward, direction: "backward" },
    ];
  }, [referenceLine]);

  useEffect(() => {
    if (directionOptions && !selectedDirection) {
      const forward =
        directionOptions.find((opt) => opt.direction === "forward")?.value ||
        undefined;
      setSelectedDirection(forward);
    }
  }, [directionOptions]);

  const handleFileChange = (files: File[]) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setFileText(text);

      // Analisar e salvar dados
      const analysis = analyzeFile(text);

      setInserts(analysis.inserts);
      setPolylines(analysis.polylines);
      setInsertLayers(analysis.insertLayers);
      setPolylineLayers(analysis.polylineLayers);
    };

    reader.readAsText(file);
  };

  const handleRejectedFiles = (rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      alert("Arquivo deve ser um DXF válido!");
    }
  };

  const baseStyle = {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    padding: "20px",
    borderWidth: 2,
    borderRadius: 2,
    borderColor: "#eeeeee",
    borderStyle: "dashed",
    backgroundColor: "#fafafa",
    color: "#bdbdbd",
    outline: "none",
    transition: "border .24s ease-in-out",
  };

  const focusedStyle = {
    borderColor: "#2196f3",
  };

  const acceptStyle = {
    borderColor: "#00e676",
  };

  const rejectStyle = {
    borderColor: "#ff1744",
  };

  const { getRootProps, getInputProps, isFocused, isDragAccept, isDragReject } =
    useDropzone({
      accept: { "application/dxf": [".dxf"] },
      onDropAccepted: handleFileChange,
      onDropRejected: handleRejectedFiles,
      maxFiles: 1,
    });

  const style = useMemo(
    () => ({
      ...baseStyle,
      ...(isFocused ? focusedStyle : {}),
      ...(isDragAccept ? acceptStyle : {}),
      ...(isDragReject ? rejectStyle : {}),
    }),
    [isFocused, isDragAccept, isDragReject]
  );

  const getPointsDistances = () => {
    const validInserts = inserts.filter((i) =>
      selectedInsertLayers.includes(i.layer)
    );
    const dxfType = detectDxfType(fileText);
    let dxfData: DxfInsert[] = [];
    const parsed = parseDxf(fileText);

    if (dxfType === "block") {
      const blocksAtt = getAttributedBlocks(parsed);
      const insertsWithAtt: DxfInsert[] = [];
      validInserts.forEach((entry) => {
        const matchingBlock = blocksAtt.find(
          (block) => block.blockName === entry.blockName
        );
        insertsWithAtt.push({
          ...entry,
          attributes: matchingBlock?.attributes,
        });
      });
      dxfData = insertsWithAtt;
    } else {
      const multileaders = extractMultileaders(parsed);
      const insertsWithId: DxfInsert[] = [];
      validInserts.forEach((insert) => {
        const matchingMultileader = multileaders.find(
          (m) =>
            Math.abs(m.x - insert.x) <= 0.8 && Math.abs(m.y - insert.y) <= 0.8 // Tolerância de 0.8
        );
        if (
          !insertsWithId.find(
            (entry) => entry.x === insert.x && entry.y === insert.y
          )
        ) {
          insertsWithId.push({
            ...insert,
            id: matchingMultileader?.text,
            idIndex: matchingMultileader?.textIndex,
            layer: matchingMultileader?.layer || insert.layer,
          });
        }
      });
      dxfData = insertsWithId;
    }

    // Verificar se tem dados necessários
    if (!plAsLineString || plAsLineString.length === 0) {
      console.warn("Nenhuma polyline disponível");
      return [];
    }

    if (!selectedDirection) {
      console.warn("Nenhuma direção selecionada");
      return [];
    }

    // Processar cada insert
    const results: DistanceResult[] = dxfData
      .filter(
        (insert) =>
          insert.id?.trim() ||
          (insert.attributes && insert.attributes.length > 0)
      )
      .map((insert) => {
        // 1. Extrair nome/ID
        const name =
          dxfType === "multileader"
            ? insert.id || "Sem ID"
            : insert.attributes?.find((a) => a.tag === a.tag)?.value ||
              "Sem ID";

        // 2. Ponto do insert
        const point: Point = { x: insert.x, y: insert.y };

        // 3. Calcular distância para CADA polyline
        const direction = directionOptions?.find(
          (opt) => opt.value === selectedDirection
        )?.direction;
        const correctedLines =
          direction === "backward"
            ? plAsLineString.map((line) => reverseLineString(line))
            : plAsLineString;
        const distancesPerLine = correctedLines.map((line) => {
          const nearest = nearestPointOnLine(line, point);
          return {
            distance: nearest.distance || 0,
            line: line,
            segment: nearest.segment,
            nearestPoint: nearest.point,
          };
        });

        // 4. Pegar a polyline mais próxima
        const closest = distancesPerLine.reduce((min, current) =>
          current.distance < min.distance ? current : min
        );

        // 5. Calcular lado em relação à polyline mais próxima
        const side = getPointSideFromLine(closest.segment, point);

        // 6. Retornar resultado
        return {
          name,
          x: insert.x,
          y: insert.y,
          layer: insert.layer,
          distance: closest.distance,
          side,
        };
      });

    setDistanceResults(results);
  };

  const handleExport = () => {
    const data = distanceResults.map((r) => ({
      Nome: r.name,
      "Distância (m)": r.distance.toFixed(3),
      Lado:
        r.side === "Left"
          ? "Esquerda"
          : r.side === "Right"
          ? "Direita"
          : "Sobre",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Distâncias");
    XLSX.writeFile(wb, "distancias-sondagens.xlsx");
  };

  return (
    <Container fluid className="mt-4">
      <Row className="justify-content-center">
        <Col md={10}>
          <Card>
            <Card.Header>
              <h4 className="justify-content-center">
                Calcular Distâncias DXF
              </h4>
            </Card.Header>
            <Card.Body style={{ height: "calc(100vh - 300px)", padding: 0 }}>
              <Row className="g-0" style={{ height: "100%", margin: 0 }}>
                <Col
                  md={4}
                  style={{
                    height: "100%",
                    overflowY: "auto",
                    padding: "1rem",
                    borderRight: "1px solid #dee2e6",
                  }}
                >
                  {/* Upload */}
                  <div {...getRootProps({ style })}>
                    <input {...getInputProps()} />
                    {selectedFile ? (
                      <div style={{ color: "#4caf50", textAlign: "center" }}>
                        <p className="mb-0">
                          <strong>{selectedFile.name}</strong>
                        </p>
                        <p className="mb-0 small">
                          Clique ou arraste para trocar o arquivo
                        </p>
                      </div>
                    ) : (
                      <p className="mb-0">
                        Arraste seu arquivo DXF aqui, ou clique para selecionar
                      </p>
                    )}
                  </div>
                  <Form.Group className="mb-2">
                    <Form.Label className="small">Layer da Polyline</Form.Label>
                    <Form.Select
                      size="sm"
                      value={selectedPolylineLayer}
                      onChange={(e) => {
                        setSelectedPolylineLayer(e.target.value);
                      }}
                    >
                      <option value="">Selecione</option>
                      {polylineLayers.map((plLayer) => (
                        <option key={plLayer} value={plLayer}>
                          {plLayer}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  {polylines.filter((pl) => pl.layer === selectedPolylineLayer)
                    .length > 1 && (
                    <>
                      <Alert variant="warning">
                        Há mais de uma polyline na camada selecionada. A
                        distância será calculada com base na linha mais próxima
                        de cada ponto.
                      </Alert>
                    </>
                  )}
                  {polylines.filter((pl) => pl.layer === selectedPolylineLayer)
                    .length === 0 && (
                    <>
                      <Alert variant="warning">
                        Não há polylines na camada selecionada.
                      </Alert>
                    </>
                  )}

                  <Form.Group>
                    <Form.Label>Sentido da polyline</Form.Label>
                    <Form.Select
                      size="sm"
                      value={selectedDirection}
                      onChange={(e) => {
                        setSelectedDirection(
                          e.target.value as CardinalOrdinalDirection
                        );
                      }}
                    >
                      <option value="">Selecione</option>
                      {directionOptions?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  <Form.Group>
                    <Form.Label className="small">
                      Layers de Sondagens
                    </Form.Label>
                    <div
                      style={{
                        maxHeight: "200px",
                        overflowY: "auto",
                        border: "1px solid #dee2e6",
                        borderRadius: "4px",
                        padding: "8px",
                      }}
                    >
                      {insertLayers.map((l) => (
                        <Form.Check
                          label={l}
                          value={l}
                          key={l}
                          checked={selectedInsertLayers.includes(l)}
                          onChange={(e) => {
                            if (
                              e.target.checked &&
                              !selectedInsertLayers.includes(l)
                            ) {
                              setSelectedInsertLayers((prev) => [...prev, l]);
                            } else if (!e.target.checked) {
                              setSelectedInsertLayers((prev) =>
                                prev.filter((layer) => layer !== l)
                              );
                            }
                          }}
                        />
                      ))}
                    </div>
                  </Form.Group>
                  <div className="d-flex gap-2 mt-2">
                    <Button onClick={getPointsDistances}>
                      Calcular Distâncias
                    </Button>
                    <Button onClick={handleExport}>Exportar XLSX</Button>
                  </div>
                </Col>

                <Col
                  md={8}
                  style={{
                    height: "100%",
                    overflowY: "hidden",
                    padding: "1rem",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {distanceResults.length > 0 && (
                    <>
                      <h5 className="mt-4">Resultados</h5>
                      <div
                        style={{
                          flex: 1,
                          overflow: "auto",
                          border: "1px solid #dee2e6",
                          borderRadius: "4px",
                          minHeight: 0,
                        }}
                      >
                        <Table
                          striped
                          bordered
                          hover
                          size="sm"
                          style={{ overflowX: "auto" }}
                        >
                          <thead>
                            <tr
                              style={{
                                position: "sticky",
                                top: 0,
                                backgroundColor: "white",
                                zIndex: 10,
                              }}
                            >
                              <th>Nome</th>
                              <th>Distância (m)</th>
                              <th>Lado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {distanceResults.map((r, i) => (
                              <tr key={i}>
                                <td>{r.name}</td>
                                <td>{r.distance.toFixed(2)}</td>
                                <td>
                                  {r.side === "Left"
                                    ? "Esquerda"
                                    : r.side === "Right"
                                    ? "Direita"
                                    : "Sobre"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    </>
                  )}
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default DistanceTool;
