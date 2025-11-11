import { useDropzone, type Accept } from "react-dropzone";

interface FileDropzoneProps {
  onFileSelect: (files: File[]) => void;
  accept?: Accept;
  maxFiles?: number;
  selectedFile?: File | null;
  label?: string;
  changeLabel?: string;
}

export const FileDropzone = ({
  onFileSelect,
  accept,
  maxFiles = 1,
  selectedFile = null,
  label = "Arraste seu arquivo aqui, ou clique para selecionar",
  changeLabel = "Clique ou arraste para trocar o arquivo",
}: FileDropzoneProps) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    onDropAccepted: onFileSelect,
    maxFiles,
  });

  return (
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
  );
};
