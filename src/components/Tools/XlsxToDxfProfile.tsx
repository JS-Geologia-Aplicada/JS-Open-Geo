import { useMemo, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import { processXlsxData, readXlsxFile, type XlsxRow } from "@/utils/xlsxUtils";
import type { ProfileSondagem } from "@/types";
import { generateDxfProfile } from "@/utils/dxfProfileGenerator";
import { ToolLayout } from "./ToolLayout";
import { ToolControlSection } from "./ToolControlSection";
import { FileDropzone } from "../FileDropzone";
import { DataTable } from "../DataTable";

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

  return (
    <>
      <ToolLayout
        title="XLSX → Perfil DXF"
        controls={
          <>
            {/* Upload */}
            <FileDropzone
              onFileSelect={handleFileChange}
              selectedFile={selectedFile}
              accept={{
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                  [".xlsx"],
                "application/vnd.ms-excel": [".xls"],
              }}
            />
            {selectedFile && (
              <>
                <ToolControlSection title="Dados da Planilha">
                  <>
                    <Form.Check
                      type="switch"
                      label="Possui linha de cabeçalho"
                      disabled={!selectedFile}
                      checked={hasHeader}
                      onChange={(e) => handleHeaderToggle(e.target.checked)}
                      className="mb-3 text-start"
                    />
                    <h6 className="mb-2 text-start" style={{ fontWeight: 500 }}>
                      Mapeamento de Colunas
                    </h6>
                    <div className="f-flex gap-2">
                      <Form.Group>
                        <div className="d-flex gap-2 text-start mb-2 align-items-center">
                          <Form.Label
                            className="small mb-0"
                            style={{ width: "75px" }}
                          >
                            Nome
                          </Form.Label>
                          <Form.Select
                            size="sm"
                            value={nameColumnIndex}
                            onChange={(e) => {
                              setNameColumnIndex(Number(e.target.value));
                            }}
                            style={{ maxWidth: "200px" }}
                          >
                            <option value="">Selecione</option>
                            {headers.map((h, i) => (
                              <option key={h} value={i}>
                                {hasHeader ? h : `Coluna ${i + 1}`}
                              </option>
                            ))}
                          </Form.Select>
                        </div>
                      </Form.Group>
                      <Form.Group>
                        <div className="d-flex gap-2 text-start mb-2 align-items-center">
                          <Form.Label
                            className="small mb-0"
                            style={{ width: "75px" }}
                          >
                            Distância
                          </Form.Label>
                          <Form.Select
                            size="sm"
                            value={distanceColumnIndex}
                            onChange={(e) => {
                              setDistanceColumnIndex(Number(e.target.value));
                            }}
                            style={{ maxWidth: "200px" }}
                          >
                            <option value="">Selecione</option>
                            {headers.map((h, i) => (
                              <option key={h} value={i}>
                                {hasHeader ? h : `Coluna ${i + 1}`}
                              </option>
                            ))}
                          </Form.Select>
                        </div>
                      </Form.Group>
                      <Form.Group>
                        <div className="d-flex gap-2 text-start mb-2 align-items-center">
                          <Form.Label
                            className="small mb-0"
                            style={{ width: "75px" }}
                          >
                            Cota
                          </Form.Label>
                          <Form.Select
                            size="sm"
                            value={zColumnIndex}
                            onChange={(e) => {
                              setZColumnIndex(Number(e.target.value));
                            }}
                            style={{ maxWidth: "200px" }}
                          >
                            <option value="">Nenhum</option>
                            {headers.map((h, i) => (
                              <option key={h} value={i}>
                                {hasHeader ? h : `Coluna ${i + 1}`}
                              </option>
                            ))}
                          </Form.Select>
                        </div>
                      </Form.Group>
                    </div>
                  </>
                </ToolControlSection>
                <ToolControlSection title="Configurações do DXF">
                  <>
                    <Form.Group className="text-start">
                      <div className="d-flex gap-2 text-start mb-2 align-items-center">
                        <Form.Label
                          className="small"
                          style={{ width: "150px" }}
                        >
                          Orientação do Texto
                        </Form.Label>
                        <div className="d-flex flex-column">
                          <Form.Check
                            className="small"
                            inline
                            type="radio"
                            label="Horizontal"
                            name="textRotation"
                            checked={textRotation === "horizontal"}
                            onChange={() => setTextRotation("horizontal")}
                          />
                          <Form.Check
                            className="small"
                            inline
                            type="radio"
                            label="Vertical"
                            name="textRotation"
                            checked={textRotation === "vertical"}
                            onChange={() => setTextRotation("vertical")}
                          />
                        </div>
                      </div>
                    </Form.Group>
                    <Form.Group>
                      <div className="d-flex gap-2 text-start mb-2 align-items-center">
                        <Form.Label
                          className="small mb-0"
                          style={{ width: "150px" }}
                        >
                          Tamanho da Fonte
                        </Form.Label>
                        <Form.Control
                          className="show-arrow"
                          type="number"
                          size="sm"
                          value={fontSize}
                          onChange={(e) => setFontSize(Number(e.target.value))}
                          min={1}
                          max={100}
                          style={{ maxWidth: "75px" }}
                        />
                      </div>
                    </Form.Group>
                  </>
                </ToolControlSection>

                <ToolControlSection title="Exportar">
                  <Button
                    onClick={handleExportDxf}
                    disabled={sondagens.length === 0}
                    className="w-100"
                  >
                    DXF
                  </Button>
                </ToolControlSection>
              </>
            )}
          </>
        }
        panel={
          <>
            {rawData.length > 0 && (
              <DataTable<XlsxRow>
                data={rawData}
                columns={headers.map((h, i) => ({
                  key: h,
                  header: hasHeader ? h : `Coluna ${i + 1}`,
                  render: (row) => String(row[h] ?? ""),
                }))}
                maxHeight="calc(100vh - 400px)"
                emptyMessage="Nenhum dado na planilha"
                title={`Planilha carregada (${rawData.length} linhas)`}
              />
            )}
          </>
        }
      />
    </>
  );
};

export default XlsxToDxfProfile;
