import React, { useEffect, useState } from "react";
import { Button, Form, Modal, Alert, Table } from "react-bootstrap";
import type {
  AGSProjectData,
  AGSAbbreviation,
  PalitoData,
  AGSTransmissionData,
} from "@/types";
import { detectAbbreviations } from "@/utils/agsDictionary";
import { Download } from "lucide-react";

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
    TRAN_PROD: "",
    TRAN_RECV: "",
    TRAN_DESC: "",
    TRAN_STAT: "",
  });

  const [abbreviations, setAbbreviations] = useState<AGSAbbreviation[]>([]);

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

  const handleAbbreviationChange = (index: number, description: string) => {
    setAbbreviations((prev) =>
      prev.map((abbr, i) => (i === index ? { ...abbr, description } : abbr))
    );
  };

  const handleExport = () => {
    // Validações PROJ e TRAN
    const missingFields: Array<string> = [];
    if (!projectData.PROJ_ID.trim()) missingFields.push("ID do projeto");
    if (!projectData.PROJ_NAME.trim()) missingFields.push("Nome do projeto");
    if (!tranInput.TRAN_PROD.trim())
      missingFields.push("Fornecedor do arquivo de dados");
    if (!tranInput.TRAN_RECV.trim())
      missingFields.push("Receptor do arquivo de dados");

    // Valida abreviações
    const activeAbbreviations = abbreviations.filter((abbr) => !abbr.ignored);
    const abbrWithoutDesc = activeAbbreviations.filter(
      (abbr) => !abbr.description.trim()
    );

    if (missingFields.length > 0 || abbrWithoutDesc.length > 0) {
      let message = "Informações incompletas para gerar AGS.\n\n";
      if (missingFields.length > 0) {
        message +=
          "Campos obrigatórios ausentes:\n- " +
          missingFields.join("\n- ") +
          "\n\n";
        message += "Se continuar, valores padrões serão utilizados.\n\n";
      }
      if (abbrWithoutDesc.length > 0) {
        message += `${abbrWithoutDesc.length} abreviações sem descrição.\n`;
        message +=
          "Se continuar, essas abreviações não serão incluídas no arquivo\n\n";
      }
      message += "Deseja continuar?";
      if (!confirm(message)) return;
    }

    // Aplica valores padrão onde necessário
    const finalProjectData: AGSProjectData = {
      PROJ_ID: projectData.PROJ_ID.trim() || "01",
      PROJ_NAME: projectData.PROJ_NAME.trim() || "Projeto",
      PROJ_LOC: projectData.PROJ_LOC,
      PROJ_CLNT: projectData.PROJ_CLNT,
      PROJ_CONT: projectData.PROJ_CONT,
      PROJ_ENG: projectData.PROJ_ENG,
      PROJ_MEMO: projectData.PROJ_MEMO,
    };

    const finalTranData: AGSTransmissionData = {
      ...tranInput,
      TRAN_PROD: tranInput.TRAN_PROD.trim() || "Empresa",
      TRAN_RECV: tranInput.TRAN_RECV.trim() || "Empresa",
    };

    // Filtra apenas abreviações com descrição
    const finalAbbreviations = activeAbbreviations.filter(
      (abbr) => abbr.description.trim() !== ""
    );

    onExport(finalProjectData, finalTranData, finalAbbreviations);
  };

  return (
    <Modal show={show} onHide={onClose} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>EXPORTAR - AGS4_BR (ABGE 301, 2024)</Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ maxHeight: "70vh", overflowY: "auto" }}>
        <Alert variant="info">
          <h6>Sobre o formato AGS4_BR</h6>
          <ul>
            <li>
              O arquivo AGS gerado aqui segue o padrão AGS4_BR da{" "}
              <a
                href="https://www.abge.org.br/arquivos/DTP_NormaABGE_301.pdf"
                target="_blank"
              >
                DIRETRIZ NORMATIVA ABGE 301/2024.
              </a>
            </li>
            <li>
              O gerador de arquivo padrão AGS do JS OpenGeo está em caráter
              experimental, veja abaixo as informações que você deve checar. O
              arquivo gerado aqui passa no teste do{" "}
              <a
                href="www.ags.org.uk/data-format/ags-validator/"
                target="_blank"
              >
                validador AGS
              </a>
              , mas muitas das informações são padrão, veja abaixo.
            </li>
            <li>
              Verifique os campos obrigatórios e opcionais do AGS abaixo, e
              preencha caso você tenha os dados. Caso não tenha os dados, o JS
              OpenGeo exportará o arquivo com valores padrão nos campos
              obrigatórios.
            </li>
            <li>
              Verifique a lista de abreviaturas utilizadas no campo GEOL_GEOL
              (Classificação/Código da Geologia). O JS OpenGeo insere no arquivo
              AGS a lista da{" "}
              <a
                href="https://www.abge.org.br/arquivos/DTP_NormaABGE_301.pdf"
                target="_blank"
              >
                DIRETRIZ NORMATIVA ABGE 301/2024.
              </a>
              .
            </li>
            <li>
              Os campos GEOL_DESC e DETL_DESC contém a mesma informação,
              extraída do perfil de sondagem.
            </li>
            <li>
              No padrão AGS, o campo para o valor final de NSPT (ISPT_NVAL), é
              um campo de número inteiro, portanto não permite frações (comuns
              nos valores de NSPT lidos em campo). Por este motivo, apresentamos
              o valor final de NSPT no campo ISPT_REP, que permite valores em
              formato texto.
            </li>
          </ul>
        </Alert>

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
              placeholder="Ex: GEOSon"
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
        <h5 className="mb-3">
          Abreviações detectadas (interpretação geológica)
        </h5>
        {abbreviations.length === 0 ? (
          <Alert variant="info">
            Nenhuma abreviação detectada nos dados de interpretação geológica.
          </Alert>
        ) : (
          <>
            <Alert variant="warning" className="small">
              <strong>Atenção:</strong> Verifique as abreviações detectadas. Se
              alguma não deveria estar aqui, marque "Ignorar" para não incluí-la
              no arquivo AGS.
            </Alert>
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th style={{ width: "15%" }}>Código</th>
                  <th style={{ width: "65%" }}>Descrição</th>
                  <th style={{ width: "20%" }} className="text-center">
                    Ignorar
                  </th>
                </tr>
              </thead>
              <tbody>
                {abbreviations.map((abbr, index) => (
                  <tr key={index} className={abbr.ignored ? "text-muted" : ""}>
                    <td>
                      <strong>{abbr.code}</strong>
                    </td>
                    <td>
                      <Form.Control
                        type="text"
                        size="sm"
                        value={abbr.description}
                        onChange={(e) =>
                          handleAbbreviationChange(index, e.target.value)
                        }
                        disabled={abbr.ignored}
                        className={
                          !abbr.description.trim() && !abbr.ignored
                            ? "border-danger"
                            : ""
                        }
                      />
                    </td>
                    <td className="text-center">
                      <Form.Check
                        type="checkbox"
                        checked={abbr.ignored || false}
                        onChange={(e) => {
                          setAbbreviations((prev) =>
                            prev.map((a, i) =>
                              i === index
                                ? { ...a, ignored: e.target.checked }
                                : a
                            )
                          );
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="success" onClick={handleExport}>
          <Download size={16} className="me-1" />
          Exportar AGS ({palitoData.length} sondage
          {palitoData.length !== 1 ? "ns" : "m"})
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AGSExportModal;
