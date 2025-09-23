import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
} from "react-bootstrap";
import { generateDxfJs, generateDXFMetro } from "../utils/dxfGenerator";
import { useState } from "react";
import type { Area, PageTextData, PalitoData } from "../types";
import { convertToPalitoData } from "../utils/downloadUtils";
import PalitoPreviewCard from "./PalitoPreviewCard";
import { toast } from "react-toastify";
import LeapfrogToJsonModal from "./LeapfrogToJsonModal";

interface DxfPageProps {
  areas: Area[];
  extractedTexts: PageTextData[];
  palitoData: PalitoData[];
  setPalitoData: (palitoData: PalitoData[]) => void;
}

const DxfPage = ({
  areas,
  extractedTexts,
  palitoData,
  setPalitoData,
}: DxfPageProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error" | "warning";
    text: string;
  } | null>(null);

  // Carregar JSON de teste do public
  const loadExtractedData = async () => {
    try {
      setIsLoading(true);
      const data = convertToPalitoData(areas, extractedTexts);
      if (data.length === 0) {
        toast.error("Não foram encontrados dados extraídos");
      } else {
        setPalitoData(data);
        toast.success("Dados extraídos carregados com sucesso!");
      }
    } catch (error) {
      setMessage({ type: "error", text: "Erro ao carregar dados de teste" });
      console.error("Erro:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Upload de arquivo JSON
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        setPalitoData(jsonData);
        toast.success("Arquivo JSON carregado com sucesso!");
      } catch (error) {
        toast.error("Erro ao processar arquivo JSON");
        console.error("Erro:", error);
      }
    };
    reader.readAsText(file);
  };

  // Gerar DXF
  const handleGenerateDXF = async (variant: string = "padrao-1") => {
    if (palitoData.length === 0) {
      toast.error("Nenhum dado carregado para gerar DXF");
      setMessage({
        type: "error",
        text: "Nenhum dado carregado para gerar DXF",
      });
      return;
    }

    try {
      setIsLoading(true);
      let result;
      switch (variant) {
        case "metro":
          result = await generateDXFMetro(palitoData);
          break;
        case "padrao-2":
          result = await generateDxfJs(palitoData, "padrao-2");
          break;
        default: // padrão 1
          result = await generateDxfJs(palitoData, "padrao-1");
          break;
      }
      if (result.processErrorNames.length > 0) {
        toast.warn(
          `DXF gerado! ${result.successCount}/${
            result.totalProcessed
          } palitos processados. Falhas: ${result.processErrorNames.join(", ")}`
        );
      } else {
        toast.success("DXF gerado com sucesso!");
      }
    } catch (error) {
      toast.error("Erro ao gerar DXF");
      console.error("Erro:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportLeapfrog = (data: PalitoData[]) => {
    if (data.length === 0) {
      toast.error("Nenhum dado foi processado");
      return;
    }

    setPalitoData(data);
    toast.success(
      `${data.length} palito${data.length !== 1 ? "s" : ""} importado${
        data.length !== 1 ? "s" : ""
      } com sucesso!`
    );
  };

  // Atualizar palito específico
  const handleUpdatePalito = (index: number, updatedPalito: PalitoData) => {
    console.log(`Atualizando palito ${index}:`, updatedPalito);
    setPalitoData(
      palitoData.map((palito, i) => (index === i ? updatedPalito : palito))
    );
  };

  const handleUpdateAllNspt = (newValue: number) => {
    setPalitoData(
      palitoData.map((palito) => {
        return {
          ...palito,
          nspt: {
            ...palito.nspt,
            start_depth: newValue,
          },
        };
      })
    );
  };

  return (
    <Container fluid>
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card>
            <Card.Header>
              <h3 className="mb-0">Gerador de Palitos DXF</h3>
            </Card.Header>
            <Card.Body>
              {/* Mensagens */}
              {message && (
                <Alert
                  variant={
                    message.type === "success"
                      ? "success"
                      : message.type === "warning"
                      ? "warning"
                      : "danger"
                  }
                  onClose={() => setMessage(null)}
                  dismissible
                >
                  {message.text}
                </Alert>
              )}

              {/* Seção de carregamento de dados */}
              <div className="mb-4">
                <Row>
                  <Col md={4}>
                    <Button
                      variant="outline-primary"
                      onClick={loadExtractedData}
                      disabled={isLoading}
                      className="w-100 mb-2"
                    >
                      {isLoading ? "Carregando..." : "Usar Dados Extraídos"}
                    </Button>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Upload de JSON:</Form.Label>
                      <Form.Control
                        type="file"
                        accept=".json"
                        onChange={handleFileUpload}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <LeapfrogToJsonModal
                      onDataProcessed={handleImportLeapfrog}
                    />
                  </Col>
                </Row>
              </div>

              {/* Botão de gerar DXF */}
              <div className="mb-4 d-flex gap-2">
                <Button
                  variant="success"
                  size="lg"
                  onClick={() => {
                    handleGenerateDXF("padrao-1");
                  }}
                  disabled={isLoading || palitoData.length === 0}
                  className="w-100"
                >
                  {isLoading
                    ? "Gerando..."
                    : `Gerar DXF padrão 1 (${palitoData.length} palito${
                        palitoData.length !== 1 ? "s" : ""
                      })`}
                </Button>
                <Button
                  variant="success"
                  size="lg"
                  onClick={() => {
                    handleGenerateDXF("padrao-2");
                  }}
                  disabled={isLoading || palitoData.length === 0}
                  className="w-100"
                >
                  {isLoading
                    ? "Gerando..."
                    : `Gerar DXF padrão 2 (${palitoData.length} palito${
                        palitoData.length !== 1 ? "s" : ""
                      })`}
                </Button>
                <Button
                  variant="success"
                  size="lg"
                  onClick={() => handleGenerateDXF("metro")}
                  disabled={isLoading || palitoData.length === 0}
                  className="w-100"
                >
                  {isLoading
                    ? "Gerando..."
                    : `Gerar DXF Metrô (${palitoData.length} palito${
                        palitoData.length !== 1 ? "s" : ""
                      })`}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6} lg={7}>
          <PalitoPreviewCard
            palitoData={palitoData}
            onUpdatePalito={handleUpdatePalito}
            onUpdateAllNspt={handleUpdateAllNspt}
          />
        </Col>
      </Row>
    </Container>
  );
};

export default DxfPage;
