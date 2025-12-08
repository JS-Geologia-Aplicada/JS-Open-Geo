import React, { useEffect, useState } from "react";
import { Button, Form, Modal, Alert } from "react-bootstrap";
import type { AGSProjectData, AGSAbbreviation, PalitoData } from "@/types";
import {
  detectAbbreviations,
  validateAbbreviations,
} from "@/utils/agsDictionary";
import { Download, X } from "lucide-react";

interface AGSExportModalProps {
  show: boolean;
  onClose: () => void;
  palitoData: PalitoData[];
  onExport: (
    projectData: AGSProjectData,
    tranInput: {
      TRAN_PROD?: string;
      TRAN_RECV?: string;
      TRAN_DESC?: string;
      TRAN_STAT?: string;
    },
    abbreviations: AGSAbbreviation[]
  ) => void;
}

const AGSExportModal: React.FC<AGSExportModalProps> = ({
  show,
  onClose,
  palitoData,
  onExport,
}) => {
  // Estados dos formulários
  const [projectData, setProjectData] = useState<AGSProjectData>({
    PROJ_ID: "",
    PROJ_NAME: "",
    PROJ_LOC: "",
    PROJ_CLNT: "",
    PROJ_CONT: "",
    PROJ_ENG: "",
    PROJ_MEMO: "",
  });

  const [tranInput, setTranInput] = useState({
    TRAN_PROD: "JS OpenGeo",
    TRAN_RECV: "",
    TRAN_DESC: "",
    TRAN_STAT: "Final",
  });

  const [abbreviations, setAbbreviations] = useState<AGSAbbreviation[]>([]);
  const [validationError, setValidationError] = useState<string>("");

  // Detecta abreviações quando o modal abre ou palitoData muda
  useEffect(() => {
    if (show && palitoData.length > 0) {
      // Coleta todos os valores de interp de todas as sondagens
      const allInterpValues: string[] = [];
      palitoData.forEach((palito) => {
        if (palito.interp) {
          allInterpValues.push(...palito.interp);
        }
      });

      const detected = detectAbbreviations(allInterpValues);
      setAbbreviations(detected);
    }
  }, [show, palitoData]);

  const handleProjectChange = (field: keyof AGSProjectData, value: string) => {
    setProjectData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTranChange = (
    field: "TRAN_PROD" | "TRAN_RECV" | "TRAN_DESC" | "TRAN_STAT",
    value: string
  ) => {
    setTranInput((prev) => ({ ...prev, [field]: value }));
  };

  //   const handleAbbreviationChange = (index: number, description: string) => {
  //     setAbbreviations((prev) =>
  //       prev.map((abbr, i) => (i === index ? { ...abbr, description } : abbr))
  //     );
  //   };

  //   const handleAddAbbreviation = () => {
  //     setAbbreviations((prev) => [
  //       ...prev,
  //       { code: "", description: "", isUserDefined: true },
  //     ]);
  //   };

  //   const handleRemoveAbbreviation = (index: number) => {
  //     setAbbreviations((prev) => prev.filter((_, i) => i !== index));
  //   };

  const handleExport = () => {
    // Validações
    if (!projectData.PROJ_ID.trim()) {
      setValidationError("ID do Projeto é obrigatório");
      return;
    }
    if (!projectData.PROJ_NAME.trim()) {
      setValidationError("Nome do Projeto é obrigatório");
      return;
    }

    // Valida abreviações
    if (!validateAbbreviations(abbreviations)) {
      setValidationError(
        "Todas as abreviações precisam ter descrição. Preencha as descrições vazias ou remova as abreviações."
      );
      return;
    }

    setValidationError("");
    onExport(projectData, tranInput, abbreviations);
  };

  return (
    <Modal show={show} onHide={onClose} size="xl" centered>
      <Modal.Header>
        <Modal.Title>Exportar AGS</Modal.Title>
        <Button
          variant="link"
          onClick={onClose}
          className="text-dark p-0 border-0"
        >
          <X size={24} />
        </Button>
      </Modal.Header>

      <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
        {validationError && (
          <Alert
            variant="danger"
            dismissible
            onClose={() => setValidationError("")}
          >
            {validationError}
          </Alert>
        )}

        {/* Seção: Informações do Projeto */}
        <h5 className="mb-3">Informações do projeto</h5>
        <Form className="mb-4">
          <Form.Group className="mb-2">
            <Form.Label>
              ID do projeto <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Ex: 24-0344"
              value={projectData.PROJ_ID}
              onChange={(e) => handleProjectChange("PROJ_ID", e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>
              Nome do projeto <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Ex: Acesso Rodovia Norte"
              value={projectData.PROJ_NAME}
              onChange={(e) => handleProjectChange("PROJ_NAME", e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Localização da obra</Form.Label>
            <Form.Control
              type="text"
              placeholder="Ex: Praia Enseada"
              value={projectData.PROJ_LOC}
              onChange={(e) => handleProjectChange("PROJ_LOC", e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Nome do cliente</Form.Label>
            <Form.Control
              type="text"
              placeholder="Ex: CONSOBRA SA"
              value={projectData.PROJ_CLNT}
              onChange={(e) => handleProjectChange("PROJ_CLNT", e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Nome da empreiteira</Form.Label>
            <Form.Control
              type="text"
              placeholder="Ex: GEOSon"
              value={projectData.PROJ_CONT}
              onChange={(e) => handleProjectChange("PROJ_CONT", e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Engenheiro de projeto</Form.Label>
            <Form.Control
              type="text"
              placeholder="Ex: Luis Alberto"
              value={projectData.PROJ_ENG}
              onChange={(e) => handleProjectChange("PROJ_ENG", e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Comentários gerais</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={projectData.PROJ_MEMO}
              onChange={(e) => handleProjectChange("PROJ_MEMO", e.target.value)}
            />
          </Form.Group>
        </Form>

        <hr />

        {/* Seção: Dados de Transmissão */}
        <h5 className="mb-3">Informações sobre a transmissão do arquivo</h5>
        <Form className="mb-4">
          <Form.Group className="mb-2">
            <Form.Label>
              Fornecedor do arquivo de dados{" "}
              <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Ex: JS OpenGeo"
              value={tranInput.TRAN_PROD}
              onChange={(e) => handleTranChange("TRAN_PROD", e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>
              Receptor do arquivo de dados{" "}
              <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Ex: CONSOBRA SA"
              value={tranInput.TRAN_RECV}
              onChange={(e) => handleTranChange("TRAN_RECV", e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Descrição dos dados</Form.Label>
            <Form.Control
              type="text"
              placeholder="Ex: Boletins de campo"
              value={tranInput.TRAN_DESC}
              onChange={(e) => handleTranChange("TRAN_DESC", e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Status dos dados</Form.Label>
            <Form.Control
              type="text"
              placeholder="Ex: Rascunho"
              value={tranInput.TRAN_STAT}
              onChange={(e) => handleTranChange("TRAN_STAT", e.target.value)}
            />
          </Form.Group>
        </Form>

        <hr />

        {/* Seção: Abreviações */}
        {/* <h5 className="mb-3">Abreviações Detectadas (GEOL_GEOL)</h5>
        {abbreviations.length === 0 ? (
          <Alert variant="info">
            Nenhuma abreviação detectada nos dados de interpretação geológica.
          </Alert>
        ) : (
          <>
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th style={{ width: "20%" }}>Código</th>
                  <th style={{ width: "70%" }}>Descrição</th>
                  <th style={{ width: "10%" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {abbreviations.map((abbr, index) => (
                  <tr key={index}>
                    <td>
                      {abbr.isUserDefined ? (
                        <Form.Control
                          type="text"
                          size="sm"
                          value={abbr.code}
                          onChange={(e) => {
                            const newAbbrs = [...abbreviations];
                            newAbbrs[index].code = e.target.value;
                            setAbbreviations(newAbbrs);
                          }}
                        />
                      ) : (
                        <strong>{abbr.code}</strong>
                      )}
                    </td>
                    <td>
                      <Form.Control
                        type="text"
                        size="sm"
                        value={abbr.description}
                        onChange={(e) =>
                          handleAbbreviationChange(index, e.target.value)
                        }
                        className={
                          !abbr.description.trim() ? "border-danger" : ""
                        }
                      />
                    </td>
                    <td className="text-center">
                      {abbr.isUserDefined && (
                        <Button
                          variant="link"
                          size="sm"
                          className="text-danger p-0"
                          onClick={() => handleRemoveAbbreviation(index)}
                        >
                          <X size={16} />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={handleAddAbbreviation}
            >
              + Adicionar Abreviação
            </Button>
          </> 
        )}
          */}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="success" onClick={handleExport}>
          <Download size={16} className="me-1" />
          Exportar AGS ({palitoData.length} sondagem
          {palitoData.length !== 1 ? "ns" : ""})
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AGSExportModal;
