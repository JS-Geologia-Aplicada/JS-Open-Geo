import { useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
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
} from "../utils/dxfParseUtils";

import * as XLSX from "xlsx";
import {
  convertGeographicCoordinates,
  DATUMS,
  UTM_ZONES,
  type DatumType,
  type ZoneType,
} from "../utils/mapUtils";
import {
  Accordion,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Table,
} from "react-bootstrap";
import {
  dxfColorToKml,
  KmlBuilder,
  KmlColors,
  type KmlData,
} from "../utils/kmlGenerator";
import JSZip from "jszip";
import { toast } from "react-toastify";

const TrasformPage = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileText, setFileText] = useState<string>("");
  const [codedDxf, setCodedDxf] = useState<CodedDxf[] | null>(null);
  const [renamedFileText, setRenamedFileText] = useState<string | null>(null);
  const [useNewName, setUseNewName] = useState(false);
  const [renamingConfigs, setRenamingConfigs] = useState<{
    direction: CardinalDirection;
    generalPrefix: string;
    numberLength: number;
    layerPrefixes: Record<string, string>;
  }>({
    direction: "N-S",
    generalPrefix: "",
    numberLength: 3,
    layerPrefixes: {},
  });
  const [fileLayers, setFileLayers] = useState<Set<string>>();

  const [dxfData, setDxfData] = useState<DxfInsert[]>([]);
  const [dxfType, setDxfType] = useState<"block" | "multileader" | null>(null);
  const [selectedDatum, setSelectedDatum] = useState<DatumType | undefined>(
    undefined
  );
  const [selectedZone, setSelectedZone] = useState<ZoneType | undefined>(
    undefined
  );
  const [selectedIdField, setSelectedIdField] = useState<string | undefined>(
    undefined
  );

  const handleFileChange = (files: File[]) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setFileText(text);
    };

    reader.readAsText(file);
  };

  const handleRejectedFiles = (rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      alert(`Arquivo deve ser um DXF válido!`);
    }
  };

  // Série de UseEffects para atualizar os dados
  // 1. Quando carrega arquivo, analisa automaticamente
  useEffect(() => {
    if (fileText && selectedFile) {
      const parsed = parseDxf(fileText);
      setCodedDxf(parsed);
      handleAnalyzeDxf(parsed);
    }
  }, [fileText, selectedFile]);

  // 2. Quando configs de renomeação mudam, atualiza renamedFileText
  useEffect(() => {
    if (useNewName && dxfData && dxfData.length > 0) {
      handleRename();
    }
  }, [
    useNewName,
    renamingConfigs.direction,
    renamingConfigs.generalPrefix,
    renamingConfigs.numberLength,
    renamingConfigs.layerPrefixes,
  ]);

  // 3. Quando renamedFileText muda E useNewName está ativo, re-analisa
  useEffect(() => {
    if (useNewName && renamedFileText) {
      const parsed = parseDxf(renamedFileText);
      setCodedDxf(parsed);
      handleAnalyzeDxf(parsed);
    }
  }, [renamedFileText, useNewName]);

  // 4. Quando desativa useNewName, volta para o original
  useEffect(() => {
    if (!useNewName && fileText) {
      const parsed = parseDxf(fileText);
      setCodedDxf(parsed);
      handleAnalyzeDxf(parsed);
    }
  }, [useNewName]);

  const handleAnalyzeDxf = (parsed: CodedDxf[]) => {
    const inserts = getInsertsFromDxf(fileText);
    const detectedType = detectDxfType(fileText);
    setDxfType(detectedType);
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
      setFileLayers(insertLayers);
      setDxfData(insertsWithAtt);
      console.log("insertsWithAtt: ", insertsWithAtt);
    } else {
      const multileaders = extractMultileaders(parsed);
      const insertsWithId: DxfInsert[] = [];
      inserts.forEach((insert) => {
        const matchingMultileader = multileaders.find(
          (m) =>
            Math.abs(m.x - insert.x) <= 0.1 && Math.abs(m.y - insert.y) <= 0.1 // Tolerância de 0.1
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
      setFileLayers(insertLayers);
      setDxfData(insertsWithId);
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
    const excelData = dxfData
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
    dxfData.forEach((item) => {
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
      const layerPrefix = renamingConfigs.layerPrefixes[layer] || "";

      items.forEach((item, index) => {
        const number = (index + 1)
          .toString()
          .padStart(renamingConfigs.numberLength, "0");
        const newId = `${renamingConfigs.generalPrefix}${layerPrefix}${number}`;
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
    if (codedDxf !== null) {
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
      setRenamedFileText(newFileText);
    }
  };

  const handleToggleRename = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (dxfType === "block" && !selectedIdField && !e.target.checked) {
      toast.warn("Escolha um atributo como nome para poder renomear");
      return;
    }
    setUseNewName(e.target.checked);
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

  return (
    <Container fluid className="mt-4">
      <Row className="justify-content-center">
        <Col md={10}>
          <Card>
            <Card.Header>
              <h4 className="mb-0">Transformar DXF</h4>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={4}>
                  {/* Área de Upload */}
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
                  {dxfType === "block" && (
                    <div className="d-flex gap-2 mt-2">
                      <h6 className="text-start mb-2 small">
                        Atributo que representa o nome da sondagem
                      </h6>

                      {dxfType === "block" ? (
                        <Form.Select
                          aria-label="Id de Sondagem"
                          value={selectedIdField || ""}
                          onChange={(e) => setSelectedIdField(e.target.value)}
                          disabled={!dxfData || attributeColumns.length === 0}
                        >
                          <option value="">Selecione o campo</option>
                          {attributeColumns.map((att, i) => (
                            <option key={`${att}-${i}`} value={att}>
                              {att}
                            </option>
                          ))}
                        </Form.Select>
                      ) : (
                        <p className="text-muted small mb-0">
                          Configuração necessária apenas para DXFs com sondagens
                          em blocos
                        </p>
                      )}
                    </div>
                  )}
                  <Accordion
                    defaultActiveKey={["0"]}
                    alwaysOpen
                    className="mt-2"
                  >
                    <Accordion.Item eventKey="0">
                      <Accordion.Header>
                        Configurações para KML/KMZ
                      </Accordion.Header>
                      <Accordion.Body>
                        <Row className="g-3">
                          {/* Coluna Esquerda - Sistema de Coordenadas */}
                          <h6 className="text-start mb-2 small">
                            Sistema de coordenadas utilizado no DXF
                          </h6>

                          {/* Seleção de Datum */}
                          <div className="d-flex gap-3">
                            <Form.Select
                              aria-label="Datum"
                              className="mb-2"
                              value={selectedDatum || ""}
                              onChange={(e) =>
                                setSelectedDatum(e.target.value as DatumType)
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
                                setSelectedZone(e.target.value as ZoneType)
                              }
                              disabled={
                                !selectedDatum || selectedDatum === "WGS84"
                              }
                            >
                              <option value="">Zona UTM</option>
                              {UTM_ZONES.map((zone) => (
                                <option key={zone.value} value={zone.value}>
                                  {zone.label}
                                </option>
                              ))}
                            </Form.Select>
                          </div>
                        </Row>
                      </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey="1">
                      <Accordion.Header>Renomear sondagens</Accordion.Header>
                      <Accordion.Body>
                        <Form.Check
                          type="switch"
                          label="Renomear sondagens"
                          checked={useNewName}
                          onChange={handleToggleRename}
                        />
                        <div className="d-flex gap-3 text-start mb-2">
                          <Form.Group>
                            <Form.Label className="small ps-2">
                              Direção
                            </Form.Label>
                            <Form.Select
                              size="sm"
                              value={renamingConfigs.direction}
                              onChange={(e) => {
                                setRenamingConfigs((prev) => ({
                                  ...prev,
                                  direction: e.target
                                    .value as CardinalDirection,
                                }));
                              }}
                            >
                              <option value="N-S">Norte → Sul</option>
                              <option value="O-E">Oeste → Leste</option>
                              <option value="S-N">Sul → Norte</option>
                              <option value="E-O">Leste → Oeste</option>
                            </Form.Select>
                          </Form.Group>
                          <Form.Group>
                            <Form.Label className="small ps-2">
                              Quantidade de dígitos
                            </Form.Label>

                            <Form.Control
                              size="sm"
                              type="number"
                              placeholder="Dígitos"
                              className="show-arrow"
                              value={renamingConfigs.numberLength}
                              onChange={(e) => {
                                setRenamingConfigs((prev) => ({
                                  ...prev,
                                  numberLength: parseInt(e.target.value) || 0,
                                }));
                              }}
                            />
                          </Form.Group>
                        </div>
                        <h6 className="text-start mt-3">Prefixos</h6>
                        {/* Prefixos e configurações */}
                        <div className="d-flex text-start gap-3">
                          <div>
                            <h6 className="small ps-2">Geral</h6>
                            <Form.Control
                              placeholder="Prefixo geral"
                              onChange={(e) => {
                                setRenamingConfigs((prev) => ({
                                  ...prev,
                                  generalPrefix: e.target.value,
                                }));
                              }}
                            />
                          </div>
                          <div>
                            <h6 className="small ps-2">Camadas</h6>
                            {fileLayers &&
                              Array.from(fileLayers).map((layer) => {
                                return (
                                  <Form.Group key={`${layer}-formgroup`}>
                                    <Form.Label className="small mt-2 mb-1">
                                      {layer}
                                    </Form.Label>
                                    <Form.Control
                                      placeholder="Prefixo da camada"
                                      value={
                                        renamingConfigs.layerPrefixes[layer] ||
                                        ""
                                      }
                                      onChange={(e) => {
                                        setRenamingConfigs((prev) => ({
                                          ...prev,
                                          layerPrefixes: {
                                            ...prev.layerPrefixes,
                                            [layer]: e.target.value,
                                          },
                                        }));
                                      }}
                                    />
                                  </Form.Group>
                                );
                              })}
                          </div>
                        </div>
                      </Accordion.Body>
                    </Accordion.Item>
                  </Accordion>

                  {/* Botões download */}
                  <div className="mt-4">
                    <h6 className="text-start mb-2">Exportar</h6>
                    <hr className="mt-0 mb-3" />
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
                  </div>
                </Col>
                <Col md={8}>
                  {/* Se tem dados, mostrar preview + config */}
                  {dxfData.length > 0 && (
                    <>
                      <h5>Dados extraídos ({dxfData.length} sondagens)</h5>

                      {/* Tabela preview */}
                      <div style={{ maxHeight: "100%", overflow: "auto" }}>
                        <Table striped bordered hover>
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
                                    top:
                                      dxfType === "multileader" ? 0 : "2.5rem",
                                    borderBottom: "1px solid #dee2e6",
                                  }}
                                >
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody
                            style={{ maxHeight: "400px", overflowY: "auto" }}
                          >
                            {dxfData.map((item, idx) => (
                              <tr key={idx}>
                                {dxfType === "multileader" && (
                                  <td>{item.id}</td>
                                )}
                                <td>{item.x.toFixed(3).replace(".", ",")}</td>
                                <td>{item.y.toFixed(3).replace(".", ",")}</td>
                                <td>{item.layer}</td>
                                {attributeColumns.map((col) => {
                                  const attr = item.attributes?.find(
                                    (a) => a.tag === col
                                  );
                                  return (
                                    <td key={col}>{attr?.value || "-"}</td>
                                  );
                                })}
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

export default TrasformPage;
