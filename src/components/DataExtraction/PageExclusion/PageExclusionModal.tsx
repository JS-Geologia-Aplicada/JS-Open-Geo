// PageExclusionModal.tsx
import { useState, useEffect } from "react";
import { Button, Col, Form, Modal, Row } from "react-bootstrap";
import { useExtractionContext } from "@/contexts/ExtractionContext";
import { getDocument } from "pdfjs-dist";

interface PageExclusionModalProps {
  show: boolean;
  onClose: () => void;
}

const PageExclusionModal = ({ show, onClose }: PageExclusionModalProps) => {
  const { extractionState, updateExtractionState } = useExtractionContext();
  const { excludedPages, selectedFile } = extractionState;

  const [inputValue, setInputValue] = useState("");
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Carregar número de páginas quando o modal abrir
  useEffect(() => {
    if (!show || !selectedFile) return;

    const loadPdfInfo = async () => {
      setIsLoading(true);
      try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const pdf = await getDocument({ data: arrayBuffer }).promise;
        setTotalPages(pdf.numPages);
      } catch (error) {
        console.error("Erro ao carregar PDF:", error);
        setTotalPages(0);
      } finally {
        setIsLoading(false);
      }
    };

    loadPdfInfo();
  }, [show, selectedFile]);

  const handleApply = () => {
    // TODO: Parsear inputValue e atualizar excludedPages
    console.log("Aplicar:", inputValue);
    onClose();
  };

  const handleSelectOdd = () => {
    // TODO: Implementar
    console.log("Selecionar ímpares");
  };

  const handleSelectEven = () => {
    // TODO: Implementar
    console.log("Selecionar pares");
  };

  const handleClear = () => {
    setInputValue("");
  };

  if (!selectedFile) return null;

  return (
    <Modal show={show} onHide={onClose} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>Selecionar Páginas a Ignorar</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {isLoading ? (
          <div className="text-center py-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Carregando...</span>
            </div>
          </div>
        ) : (
          <Row>
            {/* Coluna Esquerda - Seleção Rápida */}
            <Col md={4}>
              <h6 className="mb-3">Seleção Rápida</h6>

              <div className="d-grid gap-2 mb-3">
                <Button variant="outline-secondary" onClick={handleSelectOdd}>
                  Páginas Ímpares
                </Button>
                <Button variant="outline-secondary" onClick={handleSelectEven}>
                  Páginas Pares
                </Button>
                <Button variant="outline-danger" onClick={handleClear}>
                  Limpar Seleção
                </Button>
              </div>

              <Form.Group className="mb-3">
                <Form.Label>Páginas (ex: 1-5, 7, 9-11):</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Digite os números das páginas..."
                />
              </Form.Group>

              <div className="text-muted small">
                <div>Total de páginas: {totalPages}</div>
                <div>Páginas selecionadas: {excludedPages.size}</div>
              </div>
            </Col>

            {/* Coluna Direita - Miniaturas */}
            <Col md={8}>
              <h6 className="mb-3">Miniaturas</h6>
              <div
                className="border rounded p-3"
                style={{
                  height: "500px",
                  overflowY: "auto",
                  backgroundColor: "#f8f9fa",
                }}
              >
                <div className="d-flex flex-wrap gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (pageNum) => (
                      <div
                        key={pageNum}
                        className="border rounded p-2 text-center"
                        style={{
                          width: "80px",
                          height: "100px",
                          cursor: "pointer",
                          backgroundColor: excludedPages.has(pageNum)
                            ? "#dc3545"
                            : "white",
                          color: excludedPages.has(pageNum) ? "white" : "black",
                        }}
                        onClick={() => console.log("Toggle page", pageNum)}
                      >
                        <div className="small">Página {pageNum}</div>
                        {excludedPages.has(pageNum) && (
                          <div className="mt-1">✓</div>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>
            </Col>
          </Row>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleApply} disabled={isLoading}>
          Aplicar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PageExclusionModal;
