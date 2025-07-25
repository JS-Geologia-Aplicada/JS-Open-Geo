import { type ChangeEvent } from "react";

interface UploadFileProps {
  onFileSelect: (file: File) => void;
}
// Limite de 100MB
const MAX_FILE_SIZE = 100 * 1024 * 1024;

function UploadFile({ onFileSelect }: UploadFileProps) {
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const file = e.target.files[0];

      if (file.size > MAX_FILE_SIZE) {
        alert(
          `Arquivo muito grande! Limite máximo: 100MB. Seu arquivo: ${(
            file.size /
            1024 /
            1024
          ).toFixed(1)}MB`
        );
        e.target.value = "";
        return;
      }
      onFileSelect(file);
    }
  };
  return (
    <div>
      <input
        className="form-control mb-2"
        type="file"
        id="pdf-file"
        name="pdf-file"
        accept=".pdf"
        onChange={handleFileChange}
      />
    </div>
  );
}

export default UploadFile;
