import { useState, useMemo } from "react";
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
import JSZip from "jszip";
import { KmlBuilder, type KmlData } from "@/utils/kmlGenerator";
import {
  convertGeographicCoordinates,
  DATUMS,
  UTM_ZONES,
  type DatumType,
  type ZoneType,
} from "@/utils/mapUtils";
import { toast } from "react-toastify";

interface XlsxRow {
  [key: string]: any;
}

interface ParsedSondagem {
  name: string;
  lon: number;
  lat: number;
  extraData: Record<string, any>;
}

const XlsxToKmz = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawData, setRawData] = useState<XlsxRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [hasHeader, setHasHeader] = useState(false);

  // Mapeamento de colunas por índice
  const [nameColumnIndex, setNameColumnIndex] = useState<number>(0);
  const [xColumnIndex, setXColumnIndex] = useState<number>(1);
  const [yColumnIndex, setYColumnIndex] = useState<number>(2);

  // Sistema de coordenadas
  const [selectedDatum, setSelectedDatum] = useState<DatumType | undefined>(
    undefined
  );
  const [selectedZone, setSelectedZone] = useState<ZoneType | undefined>(
    undefined
  );

  const handleFileChange = async (files: File[]) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    setSelectedFile(file);
    setHasHeader(false);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      const dataArray: any[][] = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
      });

      if (dataArray.length === 0) {
        toast.error("Planilha vazia!");
        return;
      }

      processData(dataArray, false);
    } catch (error) {
      console.error("Erro ao ler arquivo:", error);
      toast.error("Erro ao ler arquivo XLSX");
    }
  };

  const processData = (dataArray: any[][], hasHeaderRow: boolean) => {
    let actualData: XlsxRow[];
    let cols: string[];

    if (hasHeaderRow && dataArray.length > 1) {
      const headerRow = dataArray[0];
      cols = headerRow.map((v, i) => String(v || `Coluna ${i + 1}`));

      actualData = dataArray.slice(1).map((row) => {
        const mapped: XlsxRow = {};
        cols.forEach((col, i) => {
          mapped[col] = row[i];
        });
        return mapped;
      });
    } else {
      const numCols = dataArray[0]?.length || 0;
      cols = Array.from({ length: numCols }, (_, i) => `col_${i}`);

      actualData = dataArray.map((row) => {
        const mapped: XlsxRow = {};
        cols.forEach((col, i) => {
          mapped[col] = row[i];
        });
        return mapped;
      });
    }

    setHeaders(cols);
    setRawData(actualData);
  };

  // Processar dados com conversão
  const processedData = useMemo((): ParsedSondagem[] => {
    // Se faltar alguma config, retorna vazio
    if (
      nameColumnIndex === undefined ||
      xColumnIndex === undefined ||
      yColumnIndex === undefined ||
      !selectedDatum ||
      rawData.length === 0
    ) {
      return [];
    }

    const nameCol = headers[nameColumnIndex];
    const xCol = headers[xColumnIndex];
    const yCol = headers[yColumnIndex];

    return rawData.map((row) => {
      let x = parseFloat(row[xCol]);
      let y = parseFloat(row[yCol]);
      const name = String(row[nameCol] || "Sem nome");

      if (selectedDatum !== "WGS84" && selectedZone) {
        [x, y] = convertGeographicCoordinates(
          [x, y],
          { datum: selectedDatum, zone: selectedZone },
          { datum: "WGS84", zone: undefined }
        );
      }

      const extraData: Record<string, any> = {};
      headers.forEach((header, index) => {
        if (
          index !== nameColumnIndex &&
          index !== xColumnIndex &&
          index !== yColumnIndex
        ) {
          const value = row[header];
          if (value !== null && value !== undefined && value !== "") {
            extraData[header] = value;
          }
        }
      });
      return { name, lon: x, lat: y, extraData };
    });
  }, [
    rawData,
    nameColumnIndex,
    xColumnIndex,
    yColumnIndex,
    selectedDatum,
    selectedZone,
    headers,
  ]);

  const handleExport = async (kmz: boolean) => {
    if (processedData.length === 0) return;

    const kml = new KmlBuilder("Sondagens XLSX");

    processedData.forEach((sondagem) => {
      const data: KmlData[] = Object.entries(sondagem.extraData)
        .filter(
          ([_, value]) => value !== null && value !== undefined && value !== ""
        )
        .map(([key, value]) => ({
          displayName: hasHeader ? key : `Coluna ${key}`,
          value: String(value),
        }));

      kml.addPlacemark(
        sondagem.name,
        kml.createPoint(sondagem.lon, sondagem.lat),
        { data: data.length > 0 ? data : undefined }
      );
    });

    const kmlString = kml.build();

    if (kmz) {
      const zip = new JSZip();
      zip.file("doc.kml", kmlString);
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

  // Recarregar quando mudar hasHeader
  const handleHeaderToggle = (checked: boolean) => {
    setHasHeader(checked);

    // Re-processar dados com novo modo
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const buffer = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(buffer);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const dataArray: any[][] = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
        });
        processData(dataArray, checked);
      };
      reader.readAsArrayBuffer(selectedFile);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
    },
    onDropAccepted: handleFileChange,
    maxFiles: 1,
  });

  const canExport =
    nameColumnIndex &&
    xColumnIndex &&
    yColumnIndex &&
    selectedDatum &&
    (selectedDatum === "WGS84" || selectedZone) &&
    processedData.length > 0;

  return (
    <Container fluid className="mt-4">
      <Row className="justify-content-center">
        <Col md={10}>
          <Card>
            <Card.Header>
              <h4 className="mb-0">XLSX → KMZ/KML</h4>
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
                  <div
                    {...getRootProps()}
                    style={{
                      border: "2px dashed #ccc",
                      borderRadius: "4px",
                      padding: "20px",
                      textAlign: "center",
                      cursor: "pointer",
                      backgroundColor: isDragActive ? "#e3f2fd" : "#fafafa",
                      marginBottom: "1rem",
                    }}
                  >
                    <input {...getInputProps()} />
                    {selectedFile ? (
                      <div style={{ color: "#4caf50" }}>
                        <p className="mb-0">
                          <strong>{selectedFile.name}</strong>
                        </p>
                        <p className="mb-0 small">
                          Clique ou arraste para trocar
                        </p>
                      </div>
                    ) : (
                      <p className="mb-0">Arraste seu arquivo XLSX aqui</p>
                    )}
                  </div>

                  {/* Header toggle */}
                  <Form.Check
                    type="switch"
                    label="Planilha possui linha de cabeçalho"
                    disabled={!selectedFile}
                    checked={hasHeader}
                    onChange={(e) => handleHeaderToggle(e.target.checked)}
                    className="mb-3 text-start"
                  />

                  {/* Mapeamento de colunas */}
                  {headers.length > 0 && (
                    <>
                      <h6 className="mb-2 text-start fw-bold">
                        Mapeamento de Colunas
                      </h6>
                      <div className="d-flex gap-2">
                        <Form.Group className="mb-2 text-start">
                          <Form.Label className="small">Nome</Form.Label>
                          <Form.Select
                            size="sm"
                            value={nameColumnIndex}
                            onChange={(e) =>
                              setNameColumnIndex(Number(e.target.value))
                            }
                          >
                            <option value="">Selecione</option>
                            {headers.map((h, i) => (
                              <option key={h} value={i}>
                                {hasHeader ? h : `Coluna ${i + 1}`}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-4 text-start">
                          <Form.Label className="small">Longitude</Form.Label>
                          <Form.Select
                            size="sm"
                            value={xColumnIndex}
                            onChange={(e) =>
                              setXColumnIndex(Number(e.target.value))
                            }
                          >
                            <option value="">Selecione</option>
                            {headers.map((h, i) => (
                              <option key={h} value={i}>
                                {hasHeader ? h : `Coluna ${i + 1}`}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-2 text-start">
                          <Form.Label className="small">Latitude</Form.Label>
                          <Form.Select
                            size="sm"
                            value={yColumnIndex}
                            onChange={(e) =>
                              setYColumnIndex(Number(e.target.value))
                            }
                          >
                            <option value="">Selecione</option>
                            {headers.map((h, i) => (
                              <option key={h} value={i}>
                                {hasHeader ? h : `Coluna ${i + 1}`}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </div>

                      {/* Sistema de coordenadas */}
                      <h6 className="mb-1 text-start fw-bold">
                        Sistema de Coordenadas
                      </h6>
                      <div className="d-flex gap-2">
                        <Form.Group className="mb-4 text-start">
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

                        <Form.Group className="mb-2 text-start">
                          <Form.Label className="small">Zona UTM</Form.Label>
                          <Form.Select
                            size="sm"
                            value={selectedZone || ""}
                            disabled={
                              !selectedDatum || selectedDatum === "WGS84"
                            }
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

                      {/* Botões */}
                      <h6 className="mb-2 text-start fw-bold">Exportar</h6>
                      <div className="d-flex gap-2">
                        <Button
                          onClick={() => handleExport(false)}
                          disabled={!canExport}
                          className="flex-fill"
                        >
                          KML
                        </Button>
                        <Button
                          onClick={() => handleExport(true)}
                          disabled={!canExport}
                          className="flex-fill"
                        >
                          KMZ
                        </Button>
                      </div>
                    </>
                  )}
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
                  {rawData.length > 0 && (
                    <>
                      <h5 className="mb-3">
                        Planilha Carregada ({rawData.length} linhas)
                      </h5>

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
                          className="mb-0"
                        >
                          <thead
                            style={{
                              position: "sticky",
                              top: 0,
                              backgroundColor: "white",
                              zIndex: 10,
                            }}
                          >
                            <tr>
                              {headers.map((h, i) => (
                                <th key={h}>
                                  {hasHeader ? h : `Coluna ${i + 1}`}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {rawData.map((row, idx) => (
                              <tr key={idx}>
                                {headers.map((h) => (
                                  <td key={h}>{String(row[h] ?? "")}</td>
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

export default XlsxToKmz;
