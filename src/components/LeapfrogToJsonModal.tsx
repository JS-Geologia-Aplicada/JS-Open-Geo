import { useState } from "react";
import Papa from "papaparse";
import {
  Button,
  Col,
  Form,
  Modal,
  OverlayTrigger,
  Row,
  Tooltip,
} from "react-bootstrap";
import type { PalitoData } from "../types";
import { toast } from "react-toastify";

interface LeapfrogToJsonModalProps {
  onDataProcessed: (data: PalitoData[]) => void;
}

const LeapfrogToJsonModal = ({ onDataProcessed }: LeapfrogToJsonModalProps) => {
  const [show, setShow] = useState(false);
  const [uploadSuccessful, setUploadSuccessful] = useState(false);
  const [palitoDataArr, setPalitoDataArr] = useState<PalitoData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const [columnMappings, setColumnMappings] = useState<{
    [fileType: string]: { [propertyKey: string]: string };
  }>({});

  const leapfrogTypes = [
    {
      key: "geology",
      label: "Descrição geológica",
      required: true,
      expectedColumns: [
        { key: "hole_id", label: "ID da Sondagem", defaultIndex: 0 },
        { key: "from", label: "De (m)", defaultIndex: 1 },
        { key: "to", label: "Até (m)", defaultIndex: 2 },
        { key: "geology", label: "Descrição Geológica", defaultIndex: 3 },
      ],
    },
    {
      key: "nspt",
      label: "NSPT",
      required: false,
      expectedColumns: [
        { key: "hole_id", label: "ID da Sondagem", defaultIndex: 0 },
        { key: "from", label: "De (m)", defaultIndex: 1 },
        { key: "to", label: "Até (m)", defaultIndex: 2 },
        { key: "nspt", label: "NSPT", defaultIndex: 3 },
      ],
    },
    {
      key: "collar",
      label: "Collar",
      required: false,
      expectedColumns: [
        { key: "hole_id", label: "ID da Sondagem", defaultIndex: 0 },
        { key: "z", label: "Cota", defaultIndex: 3 },
      ],
    },
    {
      key: "na",
      label: "Nível d'água",
      required: false,
      expectedColumns: [
        { key: "hole_id", label: "ID da Sondagem", defaultIndex: 0 },
        { key: "from", label: "De (m)", defaultIndex: 1 },
        { key: "to", label: "Até (m)", defaultIndex: 2 },
        { key: "condition", label: "Condição", defaultIndex: 3 },
      ],
    },
  ];

  const [files, setFiles] = useState<{ [key: string]: File | undefined }>({});
  const [data, setData] = useState<{ [key: string]: any[] }>({});

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleImport = () => {
    onDataProcessed(palitoDataArr);
  };

  const handleProcessFiles = async () => {
    if (!files.geology) return;
    setIsProcessing(true);

    try {
      const newData: { [key: string]: any[] } = {};

      for (const type of leapfrogTypes) {
        const file = files[type.key];

        if (file) {
          const extractedData = await parseFileAsync(file);
          newData[type.key] = extractedData;
        } else if (type.required) {
          throw new Error(`Arquivo ${type.label} é obrigatório`);
        }
      }

      setData(newData);
      setUploadSuccessful(true);
    } catch (error) {
      console.error(error);
      toast.error(error as string);
    } finally {
      setIsProcessing(false);
    }
  };

  const parseFileAsync = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        transform: (value: string) => {
          return typeof value === "string" ? value.trim() : value;
        },
        complete: (results) => {
          // Filtrar ANTES de resolver a Promise
          const filteredData = results.data.filter((entry: any) => {
            // Verificar se pelo menos uma propriedade tem valor válido
            return Object.values(entry).some(
              (value) =>
                value !== null &&
                value !== undefined &&
                value !== "" &&
                String(value).trim() !== ""
            );
          });
          resolve(filteredData);
        },
        error: (error) => reject(error),
      });
    });
  };

  const convertToPalitoData = (): PalitoData[] => {
    const allHoleIds = new Set<string>();

    Object.keys(data).forEach((fileType) => {
      const mapping = columnMappings[fileType];
      if (mapping?.hole_id) {
        data[fileType].forEach((row) => {
          const holeId = String(row[mapping.hole_id]).trim();
          if (holeId) allHoleIds.add(holeId);
        });
      }
    });

    // 2. Para cada hole_id, gerar PalitoData
    return Array.from(allHoleIds).map((holeId) => {
      const palitoEntry: PalitoData = {
        hole_id: holeId,
        depths: [],
        geology: [],
        nspt: {
          start_depth: 1,
          interval: 1,
          values: [],
        },
      };

      return palitoEntry;
      // Extrair dados de cada arquivo para este hole_id
      // Montar objeto PalitoData
    });
  };

  return (
    <>
      <OverlayTrigger
        overlay={
          <Tooltip id="json-tooltip">
            Importe arquivos CSV no formato Leapfrog para gerar os palitos
          </Tooltip>
        }
      >
        <span className="d-inline-block">
          <Button variant="secondary" onClick={handleShow}>
            Importar Leapfrog
          </Button>
        </span>
      </OverlayTrigger>
      {/* Modal */}
      <Modal show={show} onHide={handleClose} size="xl">
        {/* Header */}
        <Modal.Header closeButton>
          <Modal.Title>
            {isProcessing ? (
              <>
                <span className="spinner-border spinner-border-sm me-1" />
                <span>Processando...</span>
              </>
            ) : (
              "Processar arquivos"
            )}
          </Modal.Title>
        </Modal.Header>

        {/* Body */}
        <Modal.Body className="p-4">
          <Row>
            <Col md={3}>
              <h5>1. Upload</h5>
              <p className="text-muted">
                Faça upload dos arquivos CSV. Apenas o arquivo de descrição
                geológica é obrigatório.
              </p>
              {leapfrogTypes.map((type) => {
                return (
                  <Form.Group controlId={`${type.key}File`} className="mb-3">
                    <Form.Label>{type.label}</Form.Label>
                    <Form.Control
                      type="file"
                      onChange={(e) => {
                        const target = e.target as HTMLInputElement;
                        const file = target.files?.[0];
                        setFiles((prev) => ({ ...prev, [type.key]: file }));
                      }}
                    />
                  </Form.Group>
                );
              })}
              <Button
                disabled={!files.geology || isProcessing}
                onClick={handleProcessFiles}
              >
                Processar arquivos
              </Button>
            </Col>

            {/* Série de input file */}
            {uploadSuccessful && (
              <Col md={6}>
                <h5>2. Associação de colunas</h5>
                <p className="text-muted">
                  Verifique quais os nomes das colunas dos CSVs para cada uma
                  das propriedades
                </p>

                {Object.keys(data).map((fileType) => {
                  const fileTypeConfig = leapfrogTypes.find(
                    (t) => t.key === fileType
                  );
                  const availableColumns = Object.keys(data[fileType][0] || {});

                  return (
                    <div key={fileType} className="mb-4">
                      <h6>{fileTypeConfig?.label}</h6>
                      <div className="d-flex gap-3">
                        {fileTypeConfig?.expectedColumns.map((expectedCol) => {
                          // Lógica para determinar a coluna padrão
                          const defaultColumn =
                            expectedCol.defaultIndex < availableColumns.length
                              ? availableColumns[expectedCol.defaultIndex]
                              : availableColumns[availableColumns.length - 1]; // última coluna se não existir

                          return (
                            <Form.Group key={expectedCol.key} className="mb-2">
                              <Form.Label className="small">
                                {expectedCol.label}:
                              </Form.Label>
                              <Form.Select
                                size="sm"
                                value={
                                  columnMappings[fileType]?.[expectedCol.key] ||
                                  defaultColumn
                                }
                                onChange={(e) => {
                                  setColumnMappings((prev) => ({
                                    ...prev,
                                    [fileType]: {
                                      ...prev[fileType],
                                      [expectedCol.key]: e.target.value,
                                    },
                                  }));
                                }}
                              >
                                {availableColumns.map((col) => (
                                  <option key={col} value={col}>
                                    {col}
                                  </option>
                                ))}
                              </Form.Select>
                            </Form.Group>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </Col>
            )}

            {/* Botão "upload" */}
            {uploadSuccessful && (
              <Col md={3}>
                <h5>3. Importação</h5>
                <p className="text-muted">
                  Se as colunas estiverem corretas, finalize a importação dos
                  CSVs.
                </p>
                {/* (Após upload) associar headers */}
                {/* (Após upload) Botão "importar" => gera e carrega JSON, fecha modal */}
                <Button onClick={handleImport}>Importar</Button>
              </Col>
            )}
          </Row>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default LeapfrogToJsonModal;
