import { useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Table,
} from "react-bootstrap";
import * as XLSX from "xlsx";
import { parseKmlFile, type KmlSondagem } from "@/utils/kmlParser";
import JSZip from "jszip";
import {
  convertGeographicCoordinates,
  DATUMS,
  UTM_ZONES,
  type DatumType,
  type ZoneType,
} from "@/utils/mapUtils";

const KmlToXlsx = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sondagens, setSondagens] = useState<KmlSondagem[]>([]);

  const [convertCoordinates, setConvertCoordinates] = useState(false);
  const [selectedDatum, setSelectedDatum] = useState<DatumType | undefined>(
    undefined
  );
  const [selectedZone, setSelectedZone] = useState<ZoneType | undefined>(
    undefined
  );

  const processedSondagens = useMemo(() => {
    if (!convertCoordinates || !selectedDatum) {
      // Sem conversão, retorna original
      return sondagens.map((s) => ({
        ...s,
        displayCoords: {
          x: s.coordinates.lon,
          y: s.coordinates.lat,
          xLabel: "Longitude",
          yLabel: "Latitude",
        },
      }));
    }

    // Com conversão
    return sondagens.map((s) => {
      let x = s.coordinates.lon;
      let y = s.coordinates.lat;
      let xLabel = "Longitude";
      let yLabel = "Latitude";

      if (selectedDatum === "WGS84") {
        // WGS84 → já está em lat/lon
        xLabel = "Longitude";
        yLabel = "Latitude";
      } else if (selectedZone) {
        // Converter para UTM
        [x, y] = convertGeographicCoordinates(
          [s.coordinates.lon, s.coordinates.lat],
          { datum: "WGS84", zone: undefined },
          { datum: selectedDatum, zone: selectedZone }
        );
        xLabel = "X (UTM)";
        yLabel = "Y (UTM)";
      }

      return {
        ...s,
        displayCoords: { x, y, xLabel, yLabel },
      };
    });
  }, [sondagens, convertCoordinates, selectedDatum, selectedZone]);

  const handleFileChange = async (files: File[]) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    setSelectedFile(file);

    try {
      let kmlText: string;

      // Se for KMZ (ZIP), extrair o KML de dentro
      if (file.name.endsWith(".kmz")) {
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(file);

        // Procurar arquivo .kml dentro do ZIP
        const kmlFile = Object.keys(zipContent.files).find((name) =>
          name.endsWith(".kml")
        );

        if (!kmlFile) {
          throw new Error("Nenhum arquivo KML encontrado dentro do KMZ");
        }

        kmlText = await zipContent.files[kmlFile].async("text");
      } else {
        // Ler KML direto
        kmlText = await file.text();
      }

      // Parsear e extrair sondagens
      const parsedSondagens = parseKmlFile(kmlText);
      setSondagens(parsedSondagens);
    } catch (error) {
      console.error("Erro ao processar arquivo:", error);
      alert("Erro ao processar arquivo KML/KMZ: " + error);
    }
  };

  const handleExportXlsx = () => {
    if (sondagens.length === 0) return;

    const excelData = processedSondagens.map((s) => ({
      Nome: s.name,
      [s.displayCoords.xLabel]: s.displayCoords.x,
      [s.displayCoords.yLabel]: s.displayCoords.y,
      Elevação: s.coordinates.elevation,
      ...s.extendedData,
    }));

    // Criar e baixar Excel
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sondagens");
    XLSX.writeFile(wb, "sondagens-kml.xlsx");
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/vnd.google-earth.kml+xml": [".kml"],
      "application/vnd.google-earth.kmz": [".kmz"],
    },
    onDropAccepted: handleFileChange,
    maxFiles: 1,
  });

  // Coletar todas as colunas únicas de ExtendedData
  const extendedDataColumns = Array.from(
    new Set(sondagens.flatMap((s) => Object.keys(s.extendedData)))
  );

  return (
    <Container fluid className="mt-4">
      <Row className="justify-content-center">
        <Col md={10}>
          <Card>
            <Card.Header>
              <h4 className="mb-0">KMZ/KML → XLSX</h4>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={4}>
                  {/* Área de Upload */}
                  <div
                    {...getRootProps()}
                    style={{
                      border: "2px dashed #ccc",
                      borderRadius: "4px",
                      padding: "20px",
                      textAlign: "center",
                      cursor: "pointer",
                      backgroundColor: isDragActive ? "#e3f2fd" : "#fafafa",
                    }}
                  >
                    <input {...getInputProps()} />
                    {selectedFile ? (
                      <div style={{ color: "#4caf50" }}>
                        <p className="mb-0">
                          <strong>{selectedFile.name}</strong>
                        </p>
                        <p className="mb-0 small">
                          Clique ou arraste para trocar o arquivo
                        </p>
                      </div>
                    ) : (
                      <p className="mb-0">
                        Arraste seu arquivo KML/KMZ aqui, ou clique para
                        selecionar
                      </p>
                    )}
                  </div>

                  {/* Configurações de conversão */}
                  <Card className="mt-3">
                    <Card.Header>
                      <Form.Check
                        type="switch"
                        label="Converter coordenadas"
                        checked={convertCoordinates}
                        onChange={(e) =>
                          setConvertCoordinates(e.target.checked)
                        }
                      />
                    </Card.Header>
                    {convertCoordinates && (
                      <Card.Body>
                        <div className="d-flex gap-2">
                          <Form.Group className="mb-2">
                            <Form.Label className="small">Datum</Form.Label>
                            <Form.Select
                              size="sm"
                              value={selectedDatum || ""}
                              onChange={(e) =>
                                setSelectedDatum(e.target.value as DatumType)
                              }
                            >
                              <option value="">Selecione o Datum</option>
                              {DATUMS.map((datum) => (
                                <option key={datum.value} value={datum.value}>
                                  {datum.label}
                                </option>
                              ))}
                            </Form.Select>
                          </Form.Group>

                          <Form.Group>
                            <Form.Label className="small">Zona UTM</Form.Label>
                            <Form.Select
                              size="sm"
                              value={selectedZone || ""}
                              onChange={(e) =>
                                setSelectedZone(e.target.value as ZoneType)
                              }
                            >
                              <option value="">Selecione a Zona</option>
                              {UTM_ZONES.map((zone) => (
                                <option key={zone.value} value={zone.value}>
                                  {zone.label}
                                </option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </div>
                      </Card.Body>
                    )}
                  </Card>

                  {/* Botão de exportar */}
                  <div className="mt-4">
                    <Button
                      onClick={handleExportXlsx}
                      disabled={sondagens.length === 0}
                      className="w-100"
                    >
                      Exportar XLSX
                    </Button>
                  </div>
                </Col>

                <Col md={8}>
                  {/* Preview dos dados */}
                  {sondagens.length > 0 && (
                    <>
                      <h5>Dados extraídos ({sondagens.length} sondagens)</h5>
                      <div style={{ maxHeight: "500px", overflow: "auto" }}>
                        <Table striped bordered hover>
                          <thead>
                            <tr>
                              <th>Nome</th>
                              <th>Longitude</th>
                              <th>Latitude</th>
                              {extendedDataColumns.map((col) => (
                                <th key={col}>{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {processedSondagens.map((s, idx) => (
                              <tr key={idx}>
                                <td>{s.name}</td>
                                <td>
                                  {s.displayCoords.x.toLocaleString("pt-BR", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 3,
                                  })}
                                </td>
                                <td>
                                  {s.displayCoords.y.toLocaleString("pt-BR", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 3,
                                  })}
                                </td>
                                {extendedDataColumns.map((col) => (
                                  <td key={col}>
                                    {s.extendedData[col] || "-"}
                                  </td>
                                ))}
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

export default KmlToXlsx;
