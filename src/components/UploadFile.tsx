import { useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";

interface UploadFileProps {
  onFileSelect: (file: File) => void;
}
// Limite de 100MB
const MAX_FILE_SIZE = 100 * 1024 * 1024;

type FeedbackType = "success" | "error" | null;

function UploadFile({ onFileSelect }: UploadFileProps) {
  const [feedback, setFeedback] = useState<{
    type: FeedbackType;
    message: string;
  } | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleFileChange = async (files: any[]) => {
    if (files) {
      const file = files[0];

      const magicBytesResult = await validatePDFMagicBytes(file);
      if (!magicBytesResult.isValid) {
        setFeedback({
          type: "error",
          message: `${magicBytesResult.error} - O arquivo pode estar corrompido ou não ser um PDF real.`,
        });
        return;
      }

      setUploadedFile(file);
      setFeedback({
        type: "success",
        message: `PDF "${file.name}" carregado com sucesso! (${(
          file.size /
          1024 /
          1024
        ).toFixed(2)} MB)`,
      });

      onFileSelect(file);
    }
  };

  // Auto-hide success message after 5 seconds
  useEffect(() => {
    if (feedback?.type === "success") {
      const timer = setTimeout(() => {
        setFeedback(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const closeFeedback = () => {
    setFeedback(null);
  };

  const validatePDFMagicBytes = async (
    file: File
  ): Promise<{ isValid: boolean; error?: string }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        if (!e.target?.result) {
          resolve({ isValid: false, error: "Não foi possível ler o arquivo" });
          return;
        }

        const bytes = new Uint8Array(e.target.result as ArrayBuffer);

        // Magic bytes do PDF: %PDF- (25 50 44 46 2D em hex)
        const pdfMagicBytes = [0x25, 0x50, 0x44, 0x46, 0x2d];

        // Verificar se os primeiros 5 bytes são %PDF-
        const isValidPDF = pdfMagicBytes.every(
          (byte, index) => bytes[index] === byte
        );

        if (isValidPDF) {
          resolve({ isValid: true });
        } else {
          resolve({
            isValid: false,
            error: "Arquivo não é um PDF válido",
          });
        }
      };

      reader.onerror = () => {
        resolve({ isValid: false, error: "Erro ao ler arquivo" });
      };

      // Ler apenas os primeiros 5 bytes
      reader.readAsArrayBuffer(file.slice(0, 5));
    });
  };

  const handleRejectedFiles = (rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];

      const file = rejection.file;
      const errors = rejection.errors;

      // Verificar tipo de erro
      if (errors.some((e: any) => e.code === "file-invalid-type")) {
        setFeedback({
          type: "error",
          message: `Arquivo "${file.name}" não é um PDF válido. Apenas arquivos PDF são permitidos!`,
        });
      } else if (errors.some((e: any) => e.code === "file-too-large")) {
        setFeedback({
          type: "error",
          message: `Arquivo "${
            file.name
          }" muito grande! Limite máximo: 100MB. Seu arquivo: ${(
            file.size /
            1024 /
            1024
          ).toFixed(1)}MB`,
        });
      } else if (errors.some((e: any) => e.code === "too-many-files")) {
        setFeedback({
          type: "error",
          message: "Apenas um arquivo por vez é permitido!",
        });
      } else {
        setFeedback({
          type: "error",
          message: `Erro ao carregar "${file.name}": ${
            errors[0]?.message || "Arquivo inválido"
          }`,
        });
      }
    }
  };

  const baseStyle = {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    padding: "10px",
    borderWidth: 2,
    borderRadius: 2,
    borderColor: "#eeeeee",
    borderStyle: "dashed",
    backgroundColor: "#fafafa",
    color: "#bdbdbd",
    outline: "none",
    transition: "border .24s ease-in-out",
  };

  const focusedStyle = {
    borderColor: "#2196f3",
  };

  const acceptStyle = {
    borderColor: "#00e676",
  };

  const rejectStyle = {
    borderColor: "#ff1744",
  };

  const { getRootProps, getInputProps, isFocused, isDragAccept, isDragReject } =
    useDropzone({
      accept: { "application/pdf": [".pdf"] },
      onDropAccepted: handleFileChange,
      onDropRejected: handleRejectedFiles,
      maxFiles: 1,
      maxSize: MAX_FILE_SIZE,
    });

  const style = useMemo(
    () => ({
      ...baseStyle,
      ...(isFocused ? focusedStyle : {}),
      ...(isDragAccept ? acceptStyle : {}),
      ...(isDragReject ? rejectStyle : {}),
    }),
    [isFocused, isDragAccept, isDragReject, uploadedFile]
  );

  return (
    <div>
      {/* Bootstrap Alert para feedback */}
      {feedback && (
        <div
          className={`alert alert-${
            feedback.type === "success" ? "success" : "danger"
          } alert-dismissible fade show`}
          role="alert"
        >
          <strong>{feedback.type === "success" ? "Sucesso!" : "Erro!"}</strong>{" "}
          {feedback.message}
          <button
            type="button"
            className="btn-close"
            onClick={closeFeedback}
            aria-label="Close"
          ></button>
        </div>
      )}
      {/* Caixa de drag n drop */}
      <div className="container">
        <div {...getRootProps({ style })}>
          <input {...getInputProps()} />
          {uploadedFile ? (
            <div style={{ color: "#4caf50", textAlign: "center" }}>
              <p
                style={{
                  margin: 0,
                  wordBreak: "break-all",
                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                  maxWidth: "100%",
                  fontSize: 14,
                }}
              >
                <strong>{uploadedFile.name}</strong>
              </p>
              <p className="m-0 small">
                Clique ou arraste para trocar o arquivo
              </p>
            </div>
          ) : (
            <p className="m-0">
              Arraste seu PDF aqui, ou clique para selecionar arquivos
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default UploadFile;
