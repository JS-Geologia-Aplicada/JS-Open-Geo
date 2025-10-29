import { useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Table,
} from "react-bootstrap";
import { useDropzone } from "react-dropzone";
import { toast } from "react-toastify";
import { processXlsxData, readXlsxFile, type XlsxRow } from "@/utils/xlsxUtils";
import type { ProfileSondagem } from "@/types";
import { generateDxfProfile } from "@/utils/dxfProfileGenerator";

const DEFAULT_Z = 100;

const XlsxToDxfProfile = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawData, setRawData] = useState<XlsxRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [hasHeader, setHasHeader] = useState(false);

  const [nameColumnIndex, setNameColumnIndex] = useState<number>(0);
  const [distanceColumnIndex, setDistanceColumnIndex] = useState<number>(1);
  const [zColumnIndex, setZColumnIndex] = useState<number>(2);

  const [textRotation, setTextRotation] = useState<"horizontal" | "vertical">(
    "horizontal"
  );
  const [fontSize, setFontSize] = useState<number>(10);

  const handleFileChange = async (files: File[]) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    setSelectedFile(file);
    setHasHeader(false);

    try {
      const dataArray = await readXlsxFile(file);

      if (dataArray.length === 0) {
        toast.error("Planilha vazia!");
        return;
      }

      const processedData = processXlsxData(dataArray, false);
      setHeaders(processedData.headers);
      setRawData(processedData.data);
    } catch (error) {
      console.error("Erro ao ler arquivo:", error);
      toast.error("Erro ao ler arquivo XLSX");
    }
  };

  const handleHeaderToggle = async (checked: boolean) => {
    setHasHeader(checked);

    if (selectedFile) {
      try {
        const dataArray = await readXlsxFile(selectedFile);
        const processed = processXlsxData(dataArray, checked);
        setHeaders(processed.headers);
        setRawData(processed.data);
      } catch (error) {
        console.error("Erro ao reprocessar: ", error);
        toast.error("Erro ao reprocessar");
      }
    }
  };

  const sondagens = useMemo((): ProfileSondagem[] => {
    if (rawData.length === 0 || headers.length === 0) return [];

    const nameCol = headers[nameColumnIndex];
    const distCol = headers[distanceColumnIndex];
    const zCol = headers[zColumnIndex];

    if (!nameCol || !distCol) return [];

    return rawData.map((row) => {
      const name = String(row[nameCol] || "Sem nome");
      const distance = parseFloat(row[distCol] || 0);
      const z =
        zCol && row[zCol] !== undefined && row[zCol] !== ""
          ? parseFloat(row[zCol])
          : DEFAULT_Z;

      return { name, distance, z };
    });
  }, [rawData, headers, nameColumnIndex, distanceColumnIndex, zColumnIndex]);

  const handleExportDxf = () => {
    generateDxfProfile(sondagens, fontSize, textRotation);
  };

  // Definições React Dropzone
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

  return (
    <Container>
      <Row>
        <Col md={8}>
          <Card>
            <Card.Header>
              <h4 className="justify-content-center">XLSX → Perfil DXF</h4>
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
                          Clique ou arraste para trocar o arquivo
                        </p>
                      </div>
                    ) : (
                      <p className="mb-0">Arraste seu arquivo XLSX aqui</p>
                    )}
                  </div>

                  {/* Header Toggle */}
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
                      <div className="f-flex gap-2">
                        <Form.Group>
                          <Form.Label className="small">Nome</Form.Label>
                          <Form.Select
                            size="sm"
                            value={nameColumnIndex}
                            onChange={(e) => {
                              setNameColumnIndex(Number(e.target.value));
                            }}
                          >
                            <option value="">Selecione</option>
                            {headers.map((h, i) => (
                              <option key={h} value={i}>
                                {hasHeader ? h : `Coluna ${i + 1}`}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                        <Form.Group>
                          <Form.Label className="small">Distância</Form.Label>
                          <Form.Select
                            size="sm"
                            value={distanceColumnIndex}
                            onChange={(e) => {
                              setDistanceColumnIndex(Number(e.target.value));
                            }}
                          >
                            <option value="">Selecione</option>
                            {headers.map((h, i) => (
                              <option key={h} value={i}>
                                {hasHeader ? h : `Coluna ${i + 1}`}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                        <Form.Group>
                          <Form.Label className="small">Cota</Form.Label>
                          <Form.Select
                            size="sm"
                            value={zColumnIndex}
                            onChange={(e) => {
                              setZColumnIndex(Number(e.target.value));
                            }}
                          >
                            <option value="">Nenhum</option>
                            {headers.map((h, i) => (
                              <option key={h} value={i}>
                                {hasHeader ? h : `Coluna ${i + 1}`}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </div>
                    </>
                  )}

                  {/* Configurações de saída */}
                  <h6 className="mb-2">Configurações do DXF</h6>
                  <Form.Group className="text-start">
                    <Form.Label className="small">
                      Orientação do Texto
                    </Form.Label>
                    <Form.Check
                      inline
                      type="radio"
                      label="Horizontal"
                      name="textRotation"
                      checked={textRotation === "horizontal"}
                      onChange={() => setTextRotation("horizontal")}
                    />
                    <Form.Check
                      inline
                      type="radio"
                      label="Vertical"
                      name="textRotation"
                      checked={textRotation === "vertical"}
                      onChange={() => setTextRotation("vertical")}
                    />
                  </Form.Group>
                  <Form.Group>
                    <Form.Label className="small">Tamanho da Fonte</Form.Label>
                    <Form.Control
                      type="number"
                      size="sm"
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      min={1}
                      max={100}
                    />
                  </Form.Group>

                  <h6 className="mb-2">Exportar</h6>
                  <Button
                    onClick={handleExportDxf}
                    disabled={sondagens.length === 0}
                    className="w-100"
                  >
                    DXF
                  </Button>
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
                        Planilha Carragada ({rawData.length} linhas)
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
                          className="mb-o"
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
                            {rawData.map((r, i) => (
                              <tr key={i}>
                                {headers.map((h) => (
                                  <td key={h}>{String(r[h] ?? "")}</td>
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

export default XlsxToDxfProfile;
