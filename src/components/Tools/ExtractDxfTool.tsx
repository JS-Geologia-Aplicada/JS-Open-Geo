import { useMemo, useRef } from "react";
import {
  detectDxfType,
  extractMultileaders,
  getAttributedBlocks,
  getInsertsFromDxf,
  getLayerColorsFromDxf,
  groupBy,
  parseDxf,
  reconstructDxf,
  sortByDirection,
  type CodedDxf,
  type CardinalDirection,
  type DxfInsert,
} from "@utils/dxfParseUtils";

import * as XLSX from "xlsx";
import {
  convertGeographicCoordinates,
  DATUMS,
  UTM_ZONES,
  type DatumType,
  type ZoneType,
} from "@utils/mapUtils";
import { Button, Form, Table } from "react-bootstrap";
import {
  dxfColorToKml,
  KmlBuilder,
  KmlColors,
  type KmlData,
} from "@utils/kmlGenerator";
import JSZip from "jszip";
import { toast } from "react-toastify";
import { ToolLayout } from "./ToolLayout";
import { ToolControlSection } from "./ToolControlSection";
import { FileDropzone } from "../FileDropzone";
import { useToolState } from "@/hooks/useToolState";
import { useDidMountEffect } from "@/hooks/useDidMountEffect";

const ExtractDxfTool = () => {
  const { state, update } = useToolState("extractDxfTool");
  const {
    selectedFile,
    fileText,
    selectedDatum,
    selectedZone,
    selectedIdField,
    useNewName,
    renamingConfigs,
    dxfData,
    dxfType,
    codedDxf,
    renamedFileText,
    fileLayers,
    selectedLayers,
  } = state;

  const filteredDxfData = useMemo(() => {
    if (selectedLayers.length === 0) {
      return [];
    }
    return dxfData.filter((item) => selectedLayers.includes(item.layer));
  }, [dxfData, selectedLayers]);

  const layersInitialized = useRef<Set<string>>(new Set());
  const handleFileChange = (files: File[]) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    update({ selectedFile: file });

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      update({ fileText: text });
    };

    reader.readAsText(file);
  };

  // Série de UseEffects para atualizar os dados
  // 1. Quando carrega arquivo, analisa automaticamente
  useDidMountEffect(() => {
    if (fileText && selectedFile) {
      const parsed = parseDxf(fileText);
      update({ codedDxf: parsed });
      handleAnalyzeDxf(parsed);
    }
  }, [fileText, selectedFile]);

  // 2. Quando configs de renomeação mudam, atualiza renamedFileText
  useDidMountEffect(() => {
    if (useNewName && dxfData && dxfData.length > 0) {
      handleRename();
    }
  }, [useNewName, renamingConfigs.direction, renamingConfigs.layerConfigs]);

  // 3. Quando renamedFileText muda E useNewName está ativo, re-analisa
  useDidMountEffect(() => {
    if (useNewName && renamedFileText) {
      const parsed = parseDxf(renamedFileText);
      update({ codedDxf: parsed });
      handleAnalyzeDxf(parsed);
    }
  }, [renamedFileText, useNewName]);

  // 4. Quando desativa useNewName, volta para o original
  useDidMountEffect(() => {
    if (!useNewName && fileText) {
      const parsed = parseDxf(fileText);
      update({ codedDxf: parsed });
      handleAnalyzeDxf(parsed);
    }
  }, [useNewName]);

  // 5. Quando atualiza as layers, define as layerConfigs para um default
  useDidMountEffect(() => {
    if (!fileLayers) return;
    const newLayerConfigs: Record<
      string,
      {
        prefix: string;
        numberLength: number;
        startNumber: number;
      }
    > = {};
    let hasNewLayers = false;
    Array.from(fileLayers).forEach((layer) => {
      // Se já foi inicializada, pula
      if (layersInitialized.current.has(layer)) return;

      // Nova layer, adiciona
      newLayerConfigs[layer] = {
        prefix: layer + "-",
        numberLength: 3,
        startNumber: 1,
      };
      layersInitialized.current.add(layer);
      hasNewLayers = true;
    });
    if (hasNewLayers) {
      update({
        renamingConfigs: {
          ...renamingConfigs,
          layerConfigs: {
            ...renamingConfigs.layerConfigs,
            ...newLayerConfigs,
          },
        },
      });
    }
  }, [fileLayers]);

  const handleAnalyzeDxf = (parsed: CodedDxf[]) => {
    const inserts = getInsertsFromDxf(fileText);
    const detectedType = detectDxfType(fileText);
    update({ dxfType: detectedType });
    if (detectedType === "block") {
      const blocksAtt = getAttributedBlocks(parsed);
      const insertsWithAtt: DxfInsert[] = [];
      inserts.forEach((entry) => {
        const matchingBlock = blocksAtt.find(
          (block) => block.blockName === entry.blockName
        );
        insertsWithAtt.push({
          ...entry,
          attributes: matchingBlock?.attributes,
        });
      });
      const insertLayers = new Set(insertsWithAtt.map((data) => data.layer));
      update({
        fileLayers: insertLayers,
        dxfData: insertsWithAtt,
        selectedLayers: Array.from(insertLayers),
      });
    } else {
      const multileaders = extractMultileaders(parsed);
      const insertsWithId: DxfInsert[] = [];
      inserts.forEach((insert) => {
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
      const insertLayers = new Set(insertsWithId.map((data) => data.layer));
      update({
        fileLayers: insertLayers,
        dxfData: insertsWithId,
        selectedLayers: Array.from(insertLayers),
      });
    }
  };

  const attributeColumns = useMemo(() => {
    if (dxfType === "multileader") return [];

    const columns = new Set<string>();
    dxfData.forEach((item) => {
      item.attributes?.forEach((attr) => {
        const tag = attr.tag;
        if (tag) columns.add(tag);
      });
    });
    return Array.from(columns);
  }, [dxfData, dxfType]);

  const exportToExcel = () => {
    const excelData = filteredDxfData
      .filter(
        (insert) =>
          (insert.attributes && insert.attributes.length > 0) || insert.id
      ) // Só inserts com atributos ou ID
      .map((insert) => {
        const row: any = {};

        // Adicionar Sondagem primeiro, se existir
        if (insert.id) {
          row["Sondagem"] = insert.id;
        }

        // Depois X, Y, Layer
        row.X = insert.x;
        row.Y = insert.y;
        row.Layer = insert.layer;
        // Adicionar todos os atributos como colunas
        insert.attributes?.forEach((attr) => {
          if (attr.tag && attr.value) {
            row[attr.tag] = attr.value;
          }
        });

        return row;
      });

    // Criar e baixar Excel
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sondagens");
    XLSX.writeFile(wb, "sondagens-dxf.xlsx");
  };

  const exportToKML = async (kmz = false) => {
    if (!selectedDatum || (selectedDatum !== "WGS84" && !selectedZone)) {
      alert("Selecione o sistema de coordenadas");
      return;
    }

    // 1. Criar KML
    const kml = new KmlBuilder("Sondagens DXF");

    const layerColors = getLayerColorsFromDxf(fileText);
    const insertLayers = fileLayers
      ? fileLayers
      : new Set(dxfData.map((data) => data.layer));

    insertLayers.forEach((layer) => {
      const layerColor = layerColors?.find((l: any) => l.layerName === layer);

      const kmlColor = layerColor
        ? dxfColorToKml(layerColor.color)
        : KmlColors.Cyan;

      kml.addStyle({
        id: layer,
        icon: {
          color: kmlColor,
          href: "https://maps.google.com/mapfiles/kml/shapes/target.png",
        },
      });
    });

    // 2. Converter e adicionar cada ponto
    filteredDxfData.forEach((item) => {
      const [lon, lat] = convertGeographicCoordinates([item.x, item.y], {
        datum: selectedDatum,
        zone: selectedZone ? selectedZone : "23S",
      });

      const itemId =
        item.id ||
        item.attributes?.find((att) => att.tag === selectedIdField)?.value ||
        "Sem ID";

      const data: KmlData[] = [];
      item.attributes?.forEach((attr) => {
        if (attr.tag && attr.value && attr.tag !== selectedIdField) {
          data.push({
            displayName: attr.tag,
            value: attr.value,
          });
        }
      });

      // Adicionar placemark
      kml.addPlacemark(itemId, kml.createPoint(lon, lat), {
        data: data.length > 0 ? data : undefined,
        styleUrl: `#${item.layer}`,
      });
    });

    // 3. Gerar e baixar
    const kmlString = kml.build();

    if (kmz) {
      const zip = new JSZip();
      zip.file("doc.kml", kmlString); // Nome padrão do KML dentro do KMZ

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "sondagens.kmz";
      link.click();
      URL.revokeObjectURL(url);
    } else {
      const blob = new Blob([kmlString], {
        type: "application/vnd.google-earth.kml+xml",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "sondagens.kml";
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleKMLExport = (kmz = false) => {
    if (dxfType === "block" && !selectedIdField) {
      const proceed = window.confirm(
        "Nenhum campo de nome foi selecionado. As sondagens no arquivo não terão título. Deseja continuar?"
      );
      if (!proceed) return;
    }

    exportToKML(kmz);
  };

  const handleDownlaodDxf = () => {
    if (!useNewName) {
      const proceed = window.confirm(
        "Não há alterações no DXF, deseja exportar mesmo assim?"
      );
      if (!proceed) return;
    }
    const dxfText = useNewName && renamedFileText ? renamedFileText : fileText;
    const blob = new Blob([dxfText], {
      type: "application/dxf",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sondagens.dxf";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRename = () => {
    if (!dxfData || dxfData.length === 0) return;

    // 1. Ordenar baseado na direção
    const sorted = sortByDirection([...dxfData], renamingConfigs.direction);

    // 2. Agrupar por layer
    const byLayer = groupBy(sorted, "layer");

    // 3. Renumerar cada grupo
    const linesToRename: { index: number; id: string }[] = [];

    Object.entries(byLayer).forEach(([layer, items]) => {
      const configs = renamingConfigs.layerConfigs[layer] || "";

      items.forEach((item, index) => {
        const number = (configs.startNumber + index)
          .toString()
          .padStart(configs.numberLength, "0");
        const newId = `${configs.prefix}${number}`;
        const idIndex =
          dxfType === "multileader"
            ? item.idIndex
            : item.attributes?.find((a) => a.tag === selectedIdField)
                ?.valueIndex;

        if (idIndex) {
          linesToRename.push({
            index: idIndex,
            id: newId,
          });
        }
      });
    });
    if (codedDxf) {
      const renamedDxf = [...codedDxf]; // Copiar array

      linesToRename.forEach((insert) => {
        if (insert.index !== undefined && insert.id) {
          renamedDxf[insert.index] = {
            ...renamedDxf[insert.index],
            value: insert.id,
          };
        }
      });

      const newFileText = reconstructDxf(renamedDxf);
      update({ renamedFileText: newFileText });
    }
  };

  const handleToggleRename = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (dxfType === "block" && !selectedIdField && !e.target.checked) {
      toast.warn("Escolha um atributo como nome para poder renomear");
      return;
    }
    update({ useNewName: e.target.checked });
  };

  return (
    <ToolLayout
      title="Ferramentas DXF"
      controls={
        <>
          {/* Área de Upload */}
          <FileDropzone
            onFileSelect={handleFileChange}
            selectedFile={selectedFile}
            accept={{
              "application/dxf": [".dxf"],
            }}
          />
          {selectedFile && (
            <>
              {dxfType === "block" && (
                <>
                  <ToolControlSection
                    title="Atributo nome do ponto"
                    collapsible={true}
                  >
                    <Form.Select
                      aria-label="Id de Sondagem"
                      value={selectedIdField || ""}
                      onChange={(e) =>
                        update({ selectedIdField: e.target.value })
                      }
                      disabled={!dxfData || attributeColumns.length === 0}
                    >
                      <option value="">Selecione o campo</option>
                      {attributeColumns.map((att, i) => (
                        <option key={`${att}-${i}`} value={att}>
                          {att}
                        </option>
                      ))}
                    </Form.Select>
                  </ToolControlSection>
                </>
              )}
              {selectedFile && fileLayers && fileLayers.size > 0 && (
                <ToolControlSection
                  title="Filtrar camadas analisadas"
                  collapsible
                  defaultOpen={false}
                >
                  <div className="d-flex flex-column gap-2">
                    {/* Botões para selecionar/desselecionar todos */}
                    <div className="d-flex gap-2 mb-2">
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() =>
                          update({ selectedLayers: Array.from(fileLayers) })
                        }
                        className="flex-fill"
                      >
                        Selecionar Todas
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        onClick={() => update({ selectedLayers: [] })}
                        className="flex-fill"
                      >
                        Limpar
                      </Button>
                    </div>

                    {/* Checkboxes para cada layer */}
                    {Array.from(fileLayers).map((layer) => (
                      <Form.Check
                        key={layer}
                        type="checkbox"
                        id={`layer-${layer}`}
                        label={layer}
                        checked={selectedLayers.includes(layer)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            update({
                              selectedLayers: [...selectedLayers, layer],
                            });
                          } else {
                            update({
                              selectedLayers: selectedLayers.filter(
                                (l) => l !== layer
                              ),
                            });
                          }
                        }}
                      />
                    ))}
                  </div>
                </ToolControlSection>
              )}
              <ToolControlSection
                title="Sistema de coordenadas (para KML/KMZ)"
                collapsible={true}
                defaultOpen={false}
              >
                <>
                  <div className="d-flex gap-3">
                    <Form.Select
                      aria-label="Datum"
                      value={selectedDatum || ""}
                      onChange={(e) =>
                        update({ selectedDatum: e.target.value as DatumType })
                      }
                    >
                      <option value="">Datum</option>
                      {DATUMS.map((datum) => (
                        <option key={datum.value} value={datum.value}>
                          {datum.label}
                        </option>
                      ))}
                    </Form.Select>

                    {/* Seleção de Zona UTM */}
                    <Form.Select
                      aria-label="Zona UTM"
                      value={selectedZone || ""}
                      onChange={(e) =>
                        update({ selectedZone: e.target.value as ZoneType })
                      }
                      disabled={!selectedDatum || selectedDatum === "WGS84"}
                    >
                      <option value="">Zona UTM</option>
                      {UTM_ZONES.map((zone) => (
                        <option key={zone.value} value={zone.value}>
                          {zone.label}
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                </>
              </ToolControlSection>
              <ToolControlSection
                title="Renomear pontos"
                collapsible={true}
                defaultOpen={false}
              >
                <div>
                  <Form.Group>
                    <div className="d-flex gap-2 text-start mb-2 align-items-center">
                      <Form.Check
                        type="switch"
                        checked={useNewName}
                        onChange={handleToggleRename}
                        disabled={dxfType === "block" && !selectedIdField}
                      />
                      <Form.Label className="mb-0">Renomear pontos</Form.Label>
                    </div>
                  </Form.Group>
                  <Form.Group>
                    <div className="d-flex gap-2 text-start mb-2 align-items-center">
                      <Form.Label className="mb-0">Direção</Form.Label>
                      <Form.Select
                        size="sm"
                        value={renamingConfigs.direction}
                        onChange={(e) => {
                          update({
                            renamingConfigs: {
                              ...renamingConfigs,
                              direction: e.target.value as CardinalDirection,
                            },
                          });
                        }}
                        style={{ maxWidth: "200px" }}
                      >
                        <option value="N-S">Norte → Sul</option>
                        <option value="O-E">Oeste → Leste</option>
                        <option value="S-N">Sul → Norte</option>
                        <option value="E-O">Leste → Oeste</option>
                      </Form.Select>
                    </div>
                  </Form.Group>
                  {/* Prefixos e configurações */}
                  <div className="d-flex text-start gap-3">
                    <div>
                      {fileLayers &&
                        Array.from(fileLayers).map((layer) => {
                          const layerConfig = renamingConfigs.layerConfigs[
                            layer
                          ] || {
                            prefix: "",
                            numberLength: 3,
                            startNumber: 1,
                          };

                          return (
                            <Form.Group key={layer} className="mb-3">
                              <Form.Label className="small mb-0">
                                <strong>{layer}</strong>
                              </Form.Label>
                              <div className="d-flex gap-2">
                                <Form.Group>
                                  <Form.Label className="small mb-1">
                                    Prefixo
                                  </Form.Label>
                                  <Form.Control
                                    placeholder="Prefixo"
                                    value={layerConfig.prefix}
                                    onChange={(e) => {
                                      update({
                                        renamingConfigs: {
                                          ...renamingConfigs,
                                          layerConfigs: {
                                            ...renamingConfigs.layerConfigs,
                                            [layer]: {
                                              ...layerConfig,
                                              prefix: e.target.value,
                                            },
                                          },
                                        },
                                      });
                                    }}
                                    onFocus={(e) => e.target.select()}
                                  />
                                </Form.Group>
                                <Form.Group>
                                  <Form.Label className="small mb-1">
                                    N. de dígitos
                                  </Form.Label>
                                  <Form.Control
                                    type="number"
                                    className="show-arrow"
                                    placeholder="Dígitos"
                                    // style={{ width: "80px" }}
                                    value={layerConfig.numberLength}
                                    onChange={(e) => {
                                      update({
                                        renamingConfigs: {
                                          ...renamingConfigs,
                                          layerConfigs: {
                                            ...renamingConfigs.layerConfigs,
                                            [layer]: {
                                              ...layerConfig,
                                              numberLength:
                                                parseInt(e.target.value) || 3,
                                            },
                                          },
                                        },
                                      });
                                    }}
                                    onFocus={(e) => e.target.select()}
                                  />
                                </Form.Group>

                                <Form.Group>
                                  <Form.Label className="small mb-1">
                                    Número inicial
                                  </Form.Label>

                                  <Form.Control
                                    type="number"
                                    className="show-arrow"
                                    placeholder="Primeiro número"
                                    value={layerConfig.startNumber}
                                    onChange={(e) => {
                                      update({
                                        renamingConfigs: {
                                          ...renamingConfigs,
                                          layerConfigs: {
                                            ...renamingConfigs.layerConfigs,
                                            [layer]: {
                                              ...layerConfig,
                                              startNumber:
                                                parseInt(e.target.value) || 1,
                                            },
                                          },
                                        },
                                      });
                                    }}
                                    onFocus={(e) => e.target.select()}
                                  />
                                </Form.Group>
                              </div>
                            </Form.Group>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </ToolControlSection>
              <ToolControlSection title="Exportar">
                <div className="d-flex gap-2">
                  <Button
                    onClick={exportToExcel}
                    disabled={!dxfData || dxfData.length === 0}
                    className="flex-fill"
                  >
                    XLSX
                  </Button>
                  <Button
                    onClick={() => handleKMLExport(false)}
                    disabled={
                      !dxfData ||
                      dxfData.length === 0 ||
                      !selectedDatum ||
                      (selectedDatum !== "WGS84" && !selectedZone)
                    }
                    className="flex-fill"
                  >
                    KML
                  </Button>
                  <Button
                    onClick={() => handleKMLExport(true)}
                    disabled={
                      !dxfData ||
                      dxfData.length === 0 ||
                      !selectedDatum ||
                      (selectedDatum !== "WGS84" && !selectedZone)
                    }
                    className="flex-fill"
                  >
                    KMZ
                  </Button>
                  <Button onClick={handleDownlaodDxf} className="flex-fill">
                    DXF
                  </Button>
                </div>
              </ToolControlSection>
            </>
          )}
        </>
      }
      panel={
        <>
          {dxfData.length > 0 && (
            <>
              <h5>Dados extraídos ({filteredDxfData.length} pontos)</h5>

              {/* Tabela preview */}

              <div
                style={{
                  maxHeight: "calc(100vh - 400px)",
                  overflow: "auto",
                  border: "1px solid #dee2e6",
                  borderRadius: "4px",
                }}
              >
                <Table striped bordered hover style={{ overflowX: "auto" }}>
                  <thead>
                    {dxfType === "block" && (
                      /* Primeira linha - headers agrupados */
                      <tr>
                        <th
                          colSpan={3}
                          style={{
                            position: "sticky",
                            top: 0,
                            backgroundColor: "white",
                            borderTop: "1px solid #dee2e6",
                            borderBottom: "1px solid #dee2e6",
                            zIndex: 10,
                          }}
                        >
                          Dados
                        </th>
                        {attributeColumns.length > 0 && (
                          <th
                            colSpan={attributeColumns.length}
                            style={{
                              position: "sticky",
                              top: 0,
                              backgroundColor: "white",
                              borderTop: "1px solid #dee2e6",
                              borderBottom: "1px solid #dee2e6",
                            }}
                          >
                            Atributos do Bloco
                          </th>
                        )}
                      </tr>
                    )}
                    <tr>
                      {dxfType === "multileader" && (
                        <th
                          style={{
                            position: "sticky",
                            top: 0,
                            borderBottom: "1px solid #dee2e6",
                          }}
                        >
                          ID
                        </th>
                      )}
                      <th
                        style={{
                          position: "sticky",
                          top: dxfType === "multileader" ? 0 : "2.5rem",
                          borderBottom: "1px solid #dee2e6",
                        }}
                      >
                        X
                      </th>
                      <th
                        style={{
                          position: "sticky",
                          top: dxfType === "multileader" ? 0 : "2.5rem",
                          borderBottom: "1px solid #dee2e6",
                        }}
                      >
                        Y
                      </th>
                      <th
                        style={{
                          position: "sticky",
                          top: dxfType === "multileader" ? 0 : "2.5rem",
                          borderBottom: "1px solid #dee2e6",
                        }}
                      >
                        Layer
                      </th>
                      {attributeColumns.map((col) => (
                        <th
                          key={col}
                          style={{
                            position: "sticky",
                            top: dxfType === "multileader" ? 0 : "2.5rem",
                            borderBottom: "1px solid #dee2e6",
                          }}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody style={{ maxHeight: "400px", overflowY: "auto" }}>
                    {filteredDxfData.map((item, idx) => (
                      <tr key={idx}>
                        {dxfType === "multileader" && <td>{item.id}</td>}
                        <td>{item.x.toFixed(3).replace(".", ",")}</td>
                        <td>{item.y.toFixed(3).replace(".", ",")}</td>
                        <td>{item.layer}</td>
                        {attributeColumns.map((col) => {
                          const attr = item.attributes?.find(
                            (a) => a.tag === col
                          );
                          return <td key={col}>{attr?.value || "-"}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </>
          )}
        </>
      }
    />
  );
};

export default ExtractDxfTool;
