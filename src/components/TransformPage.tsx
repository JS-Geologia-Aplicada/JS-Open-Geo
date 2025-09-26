import { useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  getAttributedBlocks,
  getInsertsFromDxf,
  type DxfInsert,
} from "../utils/dxfParseUtils";

import * as XLSX from "xlsx";

const TrasformPage = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileText, setFileText] = useState<string>("");

  const handleFileChange = (files: File[]) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setFileText(text);
    };

    reader.readAsText(file);
  };

  const handleRejectedFiles = (rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      alert(`Arquivo deve ser um DXF válido!`);
    }
  };

  const handleAnalyzeDxf = () => {
    if (!selectedFile || !fileText) {
      return;
    }

    const blocksAtt = getAttributedBlocks(fileText);
    const inserts = getInsertsFromDxf(fileText);
    const insertsWithAtt: DxfInsert[] = [];

    inserts.forEach((entry) => {
      const matchingBlock = blocksAtt.find(
        (block) => block.blockName === entry.blockName
      );
      const attributes = matchingBlock
        ? matchingBlock.attributes.map((att) => {
            return {
              tag: att.find((a) => a.code === "2")?.value,
              value: att.find((a) => a.code === "1")?.value,
            };
          })
        : undefined;
      insertsWithAtt.push({
        ...entry,
        attributes: attributes,
      });
    });
    console.log("insertsWithAtt: ", insertsWithAtt);

    exportToExcel(insertsWithAtt);
  };

  const exportToExcel = (data: DxfInsert[]) => {
    const excelData = data
      .filter((insert) => insert.attributes && insert.attributes.length > 0) // Só inserts com atributos
      .map((insert) => {
        const row: any = {
          X: insert.x,
          Y: insert.y,
          Layer: insert.layer,
        };

        // Adicionar todos os atributos como colunas
        insert.attributes?.forEach((attr) => {
          if (attr.tag && attr.value) {
            row[attr.tag] = attr.value;
          }
        });

        return row;
      });

    // Criar e baixar Excel
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sondagens");
    XLSX.writeFile(wb, "sondagens-dxf.xlsx");
  };

  const baseStyle = {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    padding: "20px",
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
      accept: { "application/dxf": [".dxf"] },
      onDropAccepted: handleFileChange,
      onDropRejected: handleRejectedFiles,
      maxFiles: 1,
    });

  const style = useMemo(
    () => ({
      ...baseStyle,
      ...(isFocused ? focusedStyle : {}),
      ...(isDragAccept ? acceptStyle : {}),
      ...(isDragReject ? rejectStyle : {}),
    }),
    [isFocused, isDragAccept, isDragReject]
  );

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h4 className="mb-0">Transformar DXF</h4>
            </div>
            <div className="card-body">
              {/* Área de Upload */}
              <div {...getRootProps({ style })}>
                <input {...getInputProps()} />
                {selectedFile ? (
                  <div style={{ color: "#4caf50", textAlign: "center" }}>
                    <p className="mb-0">
                      <strong>{selectedFile.name}</strong>
                    </p>
                    <p className="mb-0 small">
                      Clique ou arraste para trocar o arquivo
                    </p>
                  </div>
                ) : (
                  <p className="mb-0">
                    Arraste seu arquivo DXF aqui, ou clique para selecionar
                  </p>
                )}
              </div>

              {/* Botão Analisar */}
              <div className="text-center mt-3">
                <button className="btn btn-primary" onClick={handleAnalyzeDxf}>
                  Analisar DXF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrasformPage;
