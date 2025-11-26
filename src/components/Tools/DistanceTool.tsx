import { useMemo, useEffect } from "react";
import * as XLSX from "xlsx";
import { Alert, Button, Form } from "react-bootstrap";
import {
  detectDxfType,
  extractMultileaders,
  getAttributedBlocks,
  getInsertsFromDxf,
  getPolylinesFromDxf,
  groupBy,
  parseDxf,
  type DxfInsert,
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
import { ToolLayout } from "./ToolLayout";
import { FileDropzone } from "../FileDropzone";
import { ToolControlSection } from "./ToolControlSection";
import { DataTable } from "../DataTable";
import { useToolState } from "@/hooks/useToolState";

interface DirectionOption {
  label: string;
  value: CardinalOrdinalDirection;
  direction: "forward" | "backward";
}

const DistanceTool = () => {
  const { state, update } = useToolState("distanceTool");

  const {
    selectedFile,
    polylines,
    dxfData,
    dxfType,
    attributeColumns,
    insertLayers,
    polylineLayers,
    selectedInsertLayers,
    selectedPolylineLayer,
    selectedDirection,
    selectedIdField,
    distanceResults,
  } = state;

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
    const parsed = parseDxf(fileText);
    const dxfType = detectDxfType(fileText);

    // 1. Inserts brutos
    const inserts = getInsertsFromDxf(fileText);
    const insertsByLayer = groupBy(inserts, "layer");

    // 2. Polylines brutas
    const polylines = getPolylinesFromDxf(fileText);
    const polylinesByLayer = groupBy(polylines, "layer");

    // 3. Processar dados de acordo com tipo de arquivo
    let dxfData: DxfInsert[] = [];
    let attributeColumns: string[] = [];

    if (dxfType === "block") {
      const blocksAtt = getAttributedBlocks(parsed);

      dxfData = inserts.map((insert) => {
        const matchingBlock = blocksAtt.find(
          (block) => block.blockName === insert.blockName
        );
        return {
          ...insert,
          attributes: matchingBlock?.attributes,
        };
      });

      const columnsSet = new Set<string>();
      dxfData.forEach((item) => {
        item.attributes?.forEach((attr) => {
          if (attr.tag) columnsSet.add(attr.tag);
        });
      });
      attributeColumns = Array.from(columnsSet);
    } else if (dxfType === "multileader") {
      const multileaders = extractMultileaders(parsed);

      dxfData = multileaders.map((ml) => ({
        x: ml.x,
        y: ml.y,
        id: ml.text,
        layer: ml.layer,
        blockName: "",
        attributes: undefined,
      }));
    }

    update({
      fileText,
      inserts,
      polylines,
      insertLayers: Object.keys(insertsByLayer),
      polylineLayers: Object.keys(polylinesByLayer),
      dxfType,
      dxfData,
      attributeColumns,
    });
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
      update({ selectedDirection: forward });
    }
  }, [directionOptions]);

  const handleFileChange = (files: File[]) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    update({ selectedFile: file });

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;

      // Analisar e salvar dados
      analyzeFile(text);
    };

    reader.readAsText(file);
  };

  const getPointsDistances = () => {
    // Verificar se tem dados necessários
    if (!plAsLineString || plAsLineString.length === 0) {
      console.warn("Nenhuma polyline disponível");
      return [];
    }

    if (!selectedDirection) {
      console.warn("Nenhuma direção selecionada");
      return [];
    }

    if (dxfData.length === 0) {
      console.warn("Nenhum dado de sondagem disponível");
      return;
    }

    // Filtrar apenas layers selecionadas
    const validInserts = dxfData.filter((insert) =>
      selectedInsertLayers.includes(insert.layer)
    );

    if (validInserts.length === 0) {
      console.warn("Nenhuma sondagem nas layers selecionadas");
      update({ distanceResults: [] });
      return;
    }

    // 4. Preparar direção da polyline
    const direction = directionOptions?.find(
      (opt) => opt.value === selectedDirection
    )?.direction;

    const correctedLines =
      direction === "backward"
        ? plAsLineString.map((line) => reverseLineString(line))
        : plAsLineString;

    // Processar cada insert
    const distanceResults: DistanceResult[] = validInserts
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
            : insert.attributes?.find((a) => a.tag === selectedIdField)
                ?.value || "Sem ID";

        // 2. Ponto do insert
        const point: Point = { x: insert.x, y: insert.y };

        // 3. Calcular distância para CADA polyline

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
    update({ distanceResults });
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
    <>
      <ToolLayout
        title="Calcular distâncias DXF"
        controls={
          <>
            <FileDropzone
              onFileSelect={handleFileChange}
              selectedFile={selectedFile}
              accept={{
                "application/dxf": [".dxf"],
              }}
              templateTab="distanceTool"
            />
            {selectedFile && (
              <>
                <ToolControlSection title="Dados da Polyline" collapsible>
                  <Form.Group>
                    <div className="d-flex gap-2 text-start mb-2 align-items-center">
                      <Form.Label
                        className="small mb-0"
                        style={{ width: "125px" }}
                      >
                        Layer da Polyline
                      </Form.Label>
                      <Form.Select
                        size="sm"
                        value={selectedPolylineLayer}
                        onChange={(e) => {
                          update({ selectedPolylineLayer: e.target.value });
                        }}
                        style={{ maxWidth: "200px" }}
                      >
                        <option value="">Selecione</option>
                        {polylineLayers.map((plLayer) => (
                          <option key={plLayer} value={plLayer}>
                            {plLayer}
                          </option>
                        ))}
                      </Form.Select>
                    </div>
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
                    <div className="d-flex gap-2 text-start mb-2 align-items-center">
                      <Form.Label
                        className="small mb-0"
                        style={{ width: "125px" }}
                      >
                        Sentido da Polyline
                      </Form.Label>
                      <Form.Select
                        size="sm"
                        value={selectedDirection}
                        onChange={(e) => {
                          update({
                            selectedDirection: e.target
                              .value as CardinalOrdinalDirection,
                          });
                        }}
                        style={{ maxWidth: "200px" }}
                      >
                        <option value="">Selecione</option>
                        {directionOptions?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </Form.Select>
                    </div>
                  </Form.Group>
                </ToolControlSection>
                <ToolControlSection title="Layers de sondagens" collapsible>
                  <div className="d-flex gap-2 mb-2">
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() =>
                        update({ selectedInsertLayers: insertLayers })
                      }
                      className="flex-fill"
                    >
                      Selecionar Todas
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-secondary"
                      onClick={() => update({ selectedInsertLayers: [] })}
                      className="flex-fill"
                    >
                      Limpar
                    </Button>
                  </div>
                  <Form.Group>
                    <Form.Label className="small">
                      Selecione as layers com sondagens
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
                      {insertLayers.map((layer) => (
                        <Form.Check
                          label={layer}
                          value={layer}
                          key={layer}
                          checked={selectedInsertLayers.includes(layer)}
                          onChange={(e) => {
                            if (
                              e.target.checked &&
                              !selectedInsertLayers.includes(layer)
                            ) {
                              update({
                                selectedInsertLayers: [
                                  ...selectedInsertLayers,
                                  layer,
                                ],
                              });
                            } else if (!e.target.checked) {
                              update({
                                selectedInsertLayers:
                                  selectedInsertLayers.filter(
                                    (l) => l !== layer
                                  ),
                              });
                            }
                          }}
                        />
                      ))}
                    </div>
                  </Form.Group>
                </ToolControlSection>
                {dxfType === "block" && (
                  <ToolControlSection
                    title="Atributo nome da sondagem"
                    collapsible
                  >
                    <Form.Select
                      value={selectedIdField || ""}
                      onChange={(e) =>
                        update({ selectedIdField: e.target.value })
                      }
                    >
                      <option value="">Selecione o campo</option>
                      {attributeColumns.map((att) => (
                        <option key={att} value={att}>
                          {att}
                        </option>
                      ))}
                    </Form.Select>
                  </ToolControlSection>
                )}
                <ToolControlSection title="Calcular Distâncias">
                  <div className="d-flex gap-2 mt-2">
                    <Button onClick={getPointsDistances} className="flex-fill">
                      Calcular
                    </Button>
                    <Button onClick={handleExport} className="flex-fill">
                      Exportar XLSX
                    </Button>
                  </div>
                </ToolControlSection>
              </>
            )}
          </>
        }
        panel={
          <>
            {distanceResults.length > 0 && (
              <DataTable
                data={distanceResults}
                columns={[
                  {
                    key: "name",
                    header: "Nome",
                  },
                  {
                    key: "distance",
                    header: "Distância (m)",
                    align: "end",
                    render: (row) => row.distance.toFixed(2),
                  },
                  {
                    key: "side",
                    header: "Lado",
                    align: "center",
                    render: (row) => (
                      <span
                        className={`badge ${
                          row.side === "Left"
                            ? "bg-primary"
                            : row.side === "Right"
                            ? "bg-success"
                            : "bg-secondary"
                        }`}
                      >
                        {row.side === "Left"
                          ? "Esquerda"
                          : row.side === "Right"
                          ? "Direita"
                          : "Sobre"}
                      </span>
                    ),
                  },
                ]}
                maxHeight="calc(100vh - 500px)"
                emptyMessage="Configure as camadas e direção para calcular distâncias"
                title={`Distâncias (${distanceResults.length} pontos)`}
              />
            )}
          </>
        }
      />
    </>
  );
};

export default DistanceTool;
