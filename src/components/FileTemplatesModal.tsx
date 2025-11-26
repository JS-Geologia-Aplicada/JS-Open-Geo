import { useState } from "react";
import { Modal, Nav, Tab, Card, Button } from "react-bootstrap";
import { Download } from "lucide-react";
import { FILE_TEMPLATES } from "@/data/fileTemplates";

interface FileTemplatesModalProps {
  show: boolean;
  onHide: () => void;
  defaultTab?: string; // ID da aba inicial
}

const FileTemplatesModal = ({
  show,
  onHide,
  defaultTab = "xlsx",
}: FileTemplatesModalProps) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Atualizar aba quando o modal abrir
  const handleShow = () => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    link.click();
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      onShow={handleShow}
      size="xl"
      centered
      style={{ minHeight: "60vh" }}
    >
      <Modal.Header closeButton>
        <Modal.Title>Modelos de Arquivo</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k!)}>
          <Nav variant="tabs" className="mb-3">
            {FILE_TEMPLATES.map((category) => (
              <Nav.Item key={category.id}>
                <Nav.Link eventKey={category.id}>{category.label}</Nav.Link>
              </Nav.Item>
            ))}
          </Nav>

          <Tab.Content style={{ height: "400px", overflowY: "auto" }}>
            {FILE_TEMPLATES.map((category) => (
              <Tab.Pane key={category.id} eventKey={category.id}>
                <div className="d-flex flex-column gap-3">
                  {category.templates.map((template) => (
                    <Card key={template.id}>
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <h6 className="mb-2">{template.name}</h6>
                            <p className="text-muted small mb-2">
                              {template.description}
                            </p>
                          </div>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() =>
                              handleDownload(
                                template.fileUrl,
                                template.fileName
                              )
                            }
                          >
                            <Download size={16} className="me-1" />
                            Baixar
                          </Button>
                        </div>
                        {template.imageUrl && (
                          <img
                            src={template.imageUrl}
                            alt={`Preview ${template.name}`}
                            className="img-fluid mt-3 rounded border"
                            style={{ maxHeight: "200px" }}
                          />
                        )}
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              </Tab.Pane>
            ))}
          </Tab.Content>
        </Tab.Container>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Fechar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default FileTemplatesModal;
