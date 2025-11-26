import { FileText } from "lucide-react";
import { useState } from "react";
import { Button } from "react-bootstrap";
import { useDropzone, type Accept } from "react-dropzone";
import FileTemplatesModal from "./FileTemplatesModal";

interface FileDropzoneProps {
  onFileSelect: (files: File[]) => void;
  accept?: Accept;
  maxFiles?: number;
  selectedFile?: File | null;
  label?: string;
  changeLabel?: string;
  templateTab?: string;
}

export const FileDropzone = ({
  onFileSelect,
  accept,
  maxFiles = 1,
  selectedFile = null,
  label = "Arraste seu arquivo aqui, ou clique para selecionar",
  changeLabel = "Clique ou arraste para trocar o arquivo",
  templateTab,
}: FileDropzoneProps) => {
  const [showTemplates, setShowTemplates] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    onDropAccepted: onFileSelect,
    maxFiles,
  });

  return (
    <>
      <div className="d-flex flex-column gap-2">
        <div
          {...getRootProps()}
          style={{
            border: "2px dashed #ccc",
            borderRadius: "4px",
            padding: "20px",
            textAlign: "center",
            cursor: "pointer",
            backgroundColor: isDragActive ? "#e3f2fd" : "#fafafa",
            transition: "background-color 0.2s ease",
          }}
        >
          <input {...getInputProps()} />
          {selectedFile ? (
            <div style={{ color: "#4caf50" }}>
              <p className="mb-0">
                <strong>{selectedFile.name}</strong>
              </p>
              <p className="mb-0 small text-muted">{changeLabel}</p>
            </div>
          ) : (
            <p className="mb-0 text-muted">{label}</p>
          )}
        </div>
        {templateTab && (
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => setShowTemplates(true)}
            className="d-flex align-items-center justify-content-center gap-2"
          >
            <FileText size={16} />
            Ver modelos de arquivo
          </Button>
        )}
      </div>
      <FileTemplatesModal
        show={showTemplates}
        onHide={() => setShowTemplates(false)}
        defaultTab={templateTab}
      />
    </>
  );
};
